import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * GET /api/analytics/overview
 *
 * Single endpoint that fetches ALL data for the analytics dashboard.
 * One fetch, one render — no waterfall queries from the client.
 *
 * Returns:
 * - summary: hero card numbers (7d totals + prior 7d for % change)
 * - timeSeries: daily aggregated snapshots for charts
 * - productLeaderboard: per-product performance ranking
 * - health: latest account health log entry (shadow ban status)
 * - experiments: recent A/B test results
 * - aestheticWeights: prompt_weights for the performance breakdown
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse date range from query params (default: 30 days)
  const url = new URL(request.url)
  const range = parseInt(url.searchParams.get('range') || '30', 10)
  const clampedRange = Math.min(Math.max(range, 7), 90)

  const now = new Date()
  const rangeStart = new Date(now.getTime() - clampedRange * 24 * 60 * 60 * 1000)
  const priorStart = new Date(rangeStart.getTime() - clampedRange * 24 * 60 * 60 * 1000)

  try {
    // ─── 1. Time-Series Snapshots ──────────────────────────────
    const { data: snapshots } = await supabase
      .from('pin_analytics_snapshots')
      .select('snapshot_date, impressions, outbound_clicks, saves')
      .eq('user_id', user.id)
      .gte('snapshot_date', rangeStart.toISOString().slice(0, 10))
      .order('snapshot_date', { ascending: true })

    // Aggregate snapshots by date (multiple pins per day → sum them)
    const dailyMap: Record<string, { impressions: number; clicks: number; saves: number }> = {}
    for (const snap of (snapshots || [])) {
      const date = snap.snapshot_date
      if (!dailyMap[date]) {
        dailyMap[date] = { impressions: 0, clicks: 0, saves: 0 }
      }
      dailyMap[date].impressions += snap.impressions || 0
      dailyMap[date].clicks += snap.outbound_clicks || 0
      dailyMap[date].saves += snap.saves || 0
    }

    const timeSeries = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        impressions: data.impressions,
        clicks: data.clicks,
        saves: data.saves,
        ctr: data.impressions > 0 ? Math.round((data.clicks / data.impressions) * 10000) / 100 : 0,
      }))

    // ─── 2. Summary Cards (current range vs prior range) ──────
    // Current range totals from live pin data
    const { data: currentPins } = await supabase
      .from('pins')
      .select('impressions, outbound_clicks, saves')
      .eq('user_id', user.id)
      .eq('status', 'published')
      .gte('published_at', rangeStart.toISOString())

    const { data: priorSnapshots } = await supabase
      .from('pin_analytics_snapshots')
      .select('impressions, outbound_clicks, saves')
      .eq('user_id', user.id)
      .gte('snapshot_date', priorStart.toISOString().slice(0, 10))
      .lt('snapshot_date', rangeStart.toISOString().slice(0, 10))

    const current = {
      impressions: (currentPins || []).reduce((sum, p) => sum + (p.impressions || 0), 0),
      clicks: (currentPins || []).reduce((sum, p) => sum + (p.outbound_clicks || 0), 0),
      saves: (currentPins || []).reduce((sum, p) => sum + (p.saves || 0), 0),
    }
    current.impressions = current.impressions || timeSeries.reduce((s, d) => s + d.impressions, 0)
    current.clicks = current.clicks || timeSeries.reduce((s, d) => s + d.clicks, 0)
    current.saves = current.saves || timeSeries.reduce((s, d) => s + d.saves, 0)

    const prior = {
      impressions: (priorSnapshots || []).reduce((sum, p) => sum + (p.impressions || 0), 0),
      clicks: (priorSnapshots || []).reduce((sum, p) => sum + (p.outbound_clicks || 0), 0),
      saves: (priorSnapshots || []).reduce((sum, p) => sum + (p.saves || 0), 0),
    }

    const summary = {
      impressions: current.impressions,
      clicks: current.clicks,
      saves: current.saves,
      ctr: current.impressions > 0 ? Math.round((current.clicks / current.impressions) * 10000) / 100 : 0,
      impressionsChange: prior.impressions > 0 ? Math.round(((current.impressions - prior.impressions) / prior.impressions) * 100) : null,
      clicksChange: prior.clicks > 0 ? Math.round(((current.clicks - prior.clicks) / prior.clicks) * 100) : null,
      savesChange: prior.saves > 0 ? Math.round(((current.saves - prior.saves) / prior.saves) * 100) : null,
    }

    // ─── 3. Product Leaderboard ────────────────────────────────
    const { data: allPublishedPins } = await supabase
      .from('pins')
      .select('product_id, impressions, outbound_clicks, saves, products(title, image_url)')
      .eq('user_id', user.id)
      .eq('status', 'published')

    const productMap: Record<string, {
      title: string
      image_url: string | null
      pins: number
      impressions: number
      clicks: number
      saves: number
    }> = {}

    for (const pin of (allPublishedPins || [])) {
      const pid = pin.product_id
      if (!pid) continue
      if (!productMap[pid]) {
        const product = pin.products as any
        productMap[pid] = {
          title: product?.title || 'Unknown',
          image_url: product?.image_url || null,
          pins: 0,
          impressions: 0,
          clicks: 0,
          saves: 0,
        }
      }
      productMap[pid].pins += 1
      productMap[pid].impressions += pin.impressions || 0
      productMap[pid].clicks += pin.outbound_clicks || 0
      productMap[pid].saves += pin.saves || 0
    }

    const productLeaderboard = Object.entries(productMap)
      .map(([id, data]) => ({
        id,
        ...data,
        ctr: data.impressions > 0 ? Math.round((data.clicks / data.impressions) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)

    // ─── 4. Account Health (Shadow Ban Detection) ──────────────
    const { data: healthLog } = await supabase
      .from('account_health_log')
      .select('*')
      .eq('user_id', user.id)
      .order('checked_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: connection } = await supabase
      .from('pinterest_connections')
      .select('warmup_phase, trust_score, account_age_days')
      .eq('user_id', user.id)
      .maybeSingle()

    // Calculate zero-impression rate for last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    const { data: recentPublished } = await supabase
      .from('pins')
      .select('id, impressions, published_at')
      .eq('user_id', user.id)
      .eq('status', 'published')
      .gte('published_at', sevenDaysAgo.toISOString())

    const eligiblePins = (recentPublished || []).filter(
      p => new Date(p.published_at) < fortyEightHoursAgo
    )
    const zeroPins = eligiblePins.filter(p => (p.impressions || 0) === 0)
    const zeroImpressionRate = eligiblePins.length > 0
      ? Math.round((zeroPins.length / eligiblePins.length) * 100)
      : 0

    const health = {
      shadowBanRisk: healthLog?.shadow_ban_risk || 'unknown',
      warmupPhase: connection?.warmup_phase || null,
      trustScore: connection?.trust_score || null,
      accountAgeDays: connection?.account_age_days || null,
      zeroImpressionRate,
      recentPinCount: (recentPublished || []).length,
      lastChecked: healthLog?.checked_at || null,
    }

    // ─── 5. Aesthetic Performance ──────────────────────────────
    const { data: weights } = await supabase
      .from('prompt_weights')
      .select('aesthetic_tags, weight, total_pins_used, total_clicks, avg_click_rate')
      .eq('user_id', user.id)

    const aestheticWeights = (weights || []).map((w: any) => ({
      tag: w.aesthetic_tags?.[0] || 'Unknown',
      weight: Number(w.weight),
      pinsUsed: w.total_pins_used || 0,
      totalClicks: w.total_clicks || 0,
      ctr: Math.round(Number(w.avg_click_rate || 0) * 10000) / 100,
    })).sort((a: any, b: any) => b.weight - a.weight)

    // ─── 6. A/B Experiments ────────────────────────────────────
    const { data: experiments } = await supabase
      .from('ab_experiments')
      .select(`
        id, aesthetic_a, aesthetic_b, status, winner,
        started_at, concluded_at, metrics_a, metrics_b,
        products(title),
        pin_a:pin_a_id(id, pin_title, rendered_image_url),
        pin_b:pin_b_id(id, pin_title, rendered_image_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      summary,
      timeSeries,
      productLeaderboard,
      health,
      aestheticWeights,
      experiments: experiments || [],
    })

  } catch (err: any) {
    console.error('Analytics overview error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
