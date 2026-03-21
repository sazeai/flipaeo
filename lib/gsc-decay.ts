import { refreshGSCToken } from "@/actions/gsc"
import { createAdminClient } from "@/utils/supabase/admin"

type GSCPageRow = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

function isoDateDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split("T")[0]
}

function scoreDecay(now30: GSCPageRow, prev30: GSCPageRow | undefined) {
  const prevClicks = prev30?.clicks ?? 0
  const prevImpressions = prev30?.impressions ?? 0
  const clickDelta = now30.clicks - prevClicks
  const impDelta = now30.impressions - prevImpressions
  const ctrDelta = now30.ctr - (prev30?.ctr ?? 0)
  const posDelta = now30.position - (prev30?.position ?? now30.position)

  // Higher score means stronger decay opportunity
  const clickDropScore = Math.max(0, -clickDelta) * 1.5
  const impDropScore = Math.max(0, -impDelta) * 0.2
  const ctrDropScore = Math.max(0, -ctrDelta) * 1000
  const positionDropScore = Math.max(0, posDelta) * 5

  return clickDropScore + impDropScore + ctrDropScore + positionDropScore
}

async function fetchPageRows(accessToken: string, siteUrl: string, startDate: string, endDate: string) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit: 250,
      }),
    }
  )

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`GSC query failed: ${txt}`)
  }
  const body = await res.json()
  return (body.rows || []) as GSCPageRow[]
}

export async function syncDecayCandidates(params: { userId: string; userSprintId: string }) {
  const supabase = createAdminClient()
  const { userId, userSprintId } = params

  const { data: connection } = await supabase
    .from("gsc_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()
  if (!connection) return { success: false, error: "GSC not connected", inserted: 0 }

  let accessToken = connection.access_token as string
  if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
    const refreshed = await refreshGSCToken(connection.id)
    if (!refreshed.success) return { success: false, error: "Failed to refresh GSC token", inserted: 0 }
    accessToken = refreshed.accessToken as string
  }

  const siteUrl = connection.site_url
  if (!siteUrl) return { success: false, error: "No GSC site selected", inserted: 0 }

  // Compare recent 30d window vs previous 30d window.
  const recentEnd = isoDateDaysAgo(0)
  const recentStart = isoDateDaysAgo(30)
  const prevEnd = isoDateDaysAgo(31)
  const prevStart = isoDateDaysAgo(60)

  const [recentRows, prevRows] = await Promise.all([
    fetchPageRows(accessToken, siteUrl, recentStart, recentEnd),
    fetchPageRows(accessToken, siteUrl, prevStart, prevEnd),
  ])

  const prevByPage = new Map<string, GSCPageRow>()
  for (const row of prevRows) {
    const page = row.keys?.[0]
    if (!page) continue
    prevByPage.set(page, row)
  }

  const candidates = []
  for (const row of recentRows) {
    const page = row.keys?.[0]
    if (!page) continue
    const prev = prevByPage.get(page)
    const decayScore = scoreDecay(row, prev)
    if (decayScore <= 0) continue
    candidates.push({
      user_sprint_id: userSprintId,
      page_url: page,
      window_30_clicks: row.clicks ?? 0,
      window_60_clicks: prev?.clicks ?? 0,
      window_30_impressions: row.impressions ?? 0,
      window_60_impressions: prev?.impressions ?? 0,
      ctr_delta: (row.ctr ?? 0) - (prev?.ctr ?? 0),
      position_delta: (row.position ?? 0) - (prev?.position ?? 0),
      decay_score: decayScore,
      status: "queued",
      meta: {
        recent_window: { start: recentStart, end: recentEnd },
        previous_window: { start: prevStart, end: prevEnd },
      },
    })
  }

  // Replace previous queued candidates with fresh snapshot for this sprint.
  await supabase
    .from("gsc_decay_candidates")
    .delete()
    .eq("user_sprint_id", userSprintId)
    .eq("status", "queued")

  if (candidates.length === 0) return { success: true, inserted: 0 }

  const { error } = await supabase.from("gsc_decay_candidates").insert(candidates)
  if (error) return { success: false, error: error.message, inserted: 0 }

  return { success: true, inserted: candidates.length }
}
