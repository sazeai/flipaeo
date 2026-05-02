import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"

/**
 * EcomPin — Aesthetic Optimizer (Feedback Loop)
 *
 * Runs daily at 4:00 AM UTC (after analytics-collector at 3:30 AM).
 *
 * Closes the feedback loop between pin performance and aesthetic selection:
 * 1. Aggregates CTR (outbound_clicks / impressions) per aesthetic tag
 * 2. Applies Bayesian smoothing to prevent single-pin flukes from dominating
 * 3. Upserts into prompt_weights so pickAestheticForPin() can bias toward winners
 *
 * Bayesian formula:
 *   weight = (avg_ctr × pin_count + prior_ctr × prior_n) / (pin_count + prior_n)
 *   where prior_ctr = 0.02 (2% baseline CTR), prior_n = 10 (pseudo-count)
 *
 * This ensures:
 * - New aesthetics with 1–2 pins don't get wildly over/under-weighted
 * - Proven winners with 20+ pins genuinely influence future selection
 */

const PRIOR_CTR = 0.02  // 2% baseline — reasonable Pinterest average for product pins
const PRIOR_N = 10       // Pseudo-count — how much we trust the prior vs real data

export const aestheticOptimizer = schedules.task({
  id: "pinloop-aesthetic-optimizer",
  cron: "0 4 * * *", // Daily at 4:00 AM UTC
  run: async () => {
    logger.info("🧠 Aesthetic optimizer started")

    const supabase = createAdminClient() as any

    // Get all users with brand settings
    const { data: brands, error } = await supabase
      .from("brand_settings")
      .select("id, user_id, aesthetic_boundaries")

    if (error || !brands || brands.length === 0) {
      logger.info("No brands to optimize")
      return { result: "No brands", updated: 0 }
    }

    let totalUpdated = 0
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    for (const brand of brands) {
      try {
        // Fetch all published pins from last 30 days that have analytics data
        const { data: pins } = await supabase
          .from("pins")
          .select("aesthetic_tag, impressions, outbound_clicks, saves")
          .eq("user_id", brand.user_id)
          .eq("status", "published")
          .not("aesthetic_tag", "is", null)
          .gte("published_at", thirtyDaysAgo)

        if (!pins || pins.length === 0) {
          logger.info(`User ${brand.user_id}: no published pins with aesthetic tags in last 30 days`)
          continue
        }

        // Filter to pins with at least some impressions (avoid division by zero noise)
        const pinsWithData = pins.filter((p: any) => (p.impressions || 0) > 0)

        if (pinsWithData.length < 3) {
          logger.info(`User ${brand.user_id}: only ${pinsWithData.length} pins with data — too early to optimize`)
          continue
        }

        // Aggregate by aesthetic tag
        const aestheticStats: Record<string, {
          totalImpressions: number
          totalClicks: number
          totalSaves: number
          pinCount: number
        }> = {}

        for (const pin of pinsWithData) {
          const tag = pin.aesthetic_tag
          if (!tag) continue

          if (!aestheticStats[tag]) {
            aestheticStats[tag] = { totalImpressions: 0, totalClicks: 0, totalSaves: 0, pinCount: 0 }
          }

          aestheticStats[tag].totalImpressions += pin.impressions || 0
          aestheticStats[tag].totalClicks += pin.outbound_clicks || 0
          aestheticStats[tag].totalSaves += pin.saves || 0
          aestheticStats[tag].pinCount += 1
        }

        // Calculate Bayesian-smoothed weight for each aesthetic
        for (const [tag, stats] of Object.entries(aestheticStats)) {
          const rawCtr = stats.totalImpressions > 0
            ? stats.totalClicks / stats.totalImpressions
            : 0

          // Bayesian smoothing: blend real CTR with prior based on sample size
          const weight = (rawCtr * stats.pinCount + PRIOR_CTR * PRIOR_N) / (stats.pinCount + PRIOR_N)

          // Upsert into prompt_weights
          const { error: upsertError } = await supabase
            .from("prompt_weights")
            .upsert({
              user_id: brand.user_id,
              brand_settings_id: brand.id,
              aesthetic_tags: [tag],
              weight: Math.round(weight * 10000) / 10000, // 4 decimal places
              total_pins_used: stats.pinCount,
              total_clicks: stats.totalClicks,
              avg_click_rate: Math.round(rawCtr * 10000) / 10000,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,brand_settings_id,aesthetic_tags',
            })

          if (upsertError) {
            // If upsert on composite key fails, try update-or-insert manually
            const { data: existing } = await supabase
              .from("prompt_weights")
              .select("id")
              .eq("user_id", brand.user_id)
              .eq("brand_settings_id", brand.id)
              .contains("aesthetic_tags", [tag])
              .maybeSingle()

            if (existing) {
              await supabase.from("prompt_weights").update({
                weight: Math.round(weight * 10000) / 10000,
                total_pins_used: stats.pinCount,
                total_clicks: stats.totalClicks,
                avg_click_rate: Math.round(rawCtr * 10000) / 10000,
                updated_at: new Date().toISOString(),
              }).eq("id", existing.id)
            } else {
              await supabase.from("prompt_weights").insert({
                user_id: brand.user_id,
                brand_settings_id: brand.id,
                aesthetic_tags: [tag],
                weight: Math.round(weight * 10000) / 10000,
                total_pins_used: stats.pinCount,
                total_clicks: stats.totalClicks,
                avg_click_rate: Math.round(rawCtr * 10000) / 10000,
              })
            }
          }

          logger.info(`  ${tag}: ${stats.pinCount} pins, CTR=${(rawCtr * 100).toFixed(2)}%, weight=${(weight * 100).toFixed(2)}%`)
          totalUpdated++
        }

        logger.info(`✅ Optimized ${Object.keys(aestheticStats).length} aesthetics for user ${brand.user_id}`)

      } catch (err: any) {
        logger.error(`Error optimizing aesthetics for user ${brand.user_id}: ${err.message}`)
      }
    }

    logger.info(`🧠 Aesthetic optimizer complete: ${totalUpdated} weights updated`)
    return { result: "Complete", updated: totalUpdated }
  },
})
