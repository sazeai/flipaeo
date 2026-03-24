import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { getValidAccessToken, getBatchPinAnalytics } from "@/lib/pinterest-api"
import { updatePromptWeights, recordPromptUsage } from "@/lib/prompt-weight-engine"

/**
 * PinLoop — Analytics Collector (The Closed-Loop Brain)
 * 
 * Runs every 24 hours. For each user with a Pinterest connection:
 * 1. Fetches analytics for all published pins (last 30 days)
 * 2. Updates pin records with click/impression/save counts
 * 3. Aggregates clicks per prompt_weight template
 * 4. Runs the Bayesian weight update algorithm
 * 
 * This closes the feedback loop:
 * High-CTR prompts → higher weight → more pins generated with that style
 */
export const analyticsCollector = schedules.task({
  id: "pinloop-analytics-collector",
  cron: "30 3 * * *", // Daily at 3:30 AM UTC (off-peak)
  run: async () => {
    logger.info("📊 PinLoop analytics collector started")

    const supabase = createAdminClient() as any

    // Get all connected users
    const { data: connections, error } = await supabase
      .from("pinterest_connections")
      .select("user_id")

    if (error || !connections || connections.length === 0) {
      logger.info("No Pinterest connections for analytics")
      return { result: "No connections", updated: 0 }
    }

    let totalUpdated = 0

    for (const conn of connections) {
      try {
        const { user_id } = conn

        // Get access token
        const accessToken = await getValidAccessToken(user_id)
        if (!accessToken) {
          logger.warn(`No valid token for user ${user_id}, skipping analytics`)
          continue
        }

        // Get published pins that have a Pinterest pin ID
        const { data: publishedPins } = await supabase
          .from("pins")
          .select("id, pinterest_pin_id, image_prompt_used")
          .eq("user_id", user_id)
          .eq("status", "published")
          .not("pinterest_pin_id", "is", null)
          .gte("published_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        if (!publishedPins || publishedPins.length === 0) {
          logger.info(`User ${user_id}: no published pins to analyze`)
          continue
        }

        // Fetch analytics from Pinterest API
        const pinterestPinIds = publishedPins.map((p: any) => p.pinterest_pin_id)
        const analytics = await getBatchPinAnalytics(accessToken, pinterestPinIds)

        // Create a map for quick lookup
        const analyticsMap = new Map(analytics.map(a => [a.pin_id, a]))

        // Update each pin with new analytics
        for (const pin of publishedPins) {
          const pinAnalytics = analyticsMap.get(pin.pinterest_pin_id)
          if (!pinAnalytics) continue

          await supabase
            .from("pins")
            .update({
              outbound_clicks: pinAnalytics.outbound_clicks,
              impressions: pinAnalytics.impressions,
              saves: pinAnalytics.saves,
              last_analytics_at: new Date().toISOString(),
            })
            .eq("id", pin.id)

          totalUpdated++
        }

        // Aggregate clicks per prompt template for weight updates
        // Get all prompt weights for this user
        const { data: brandSettings } = await supabase
          .from("brand_settings")
          .select("id")
          .eq("user_id", user_id)

        if (brandSettings && brandSettings.length > 0) {
          for (const brand of brandSettings) {
            // Get all published pins for this brand with their prompt data
            const { data: brandPins } = await supabase
              .from("pins")
              .select("id, image_prompt_used, outbound_clicks")
              .eq("user_id", user_id)
              .eq("brand_settings_id", brand.id)
              .eq("status", "published")
              .not("outbound_clicks", "is", null)

            if (brandPins && brandPins.length > 0) {
              // Group clicks by prompt template
              const promptClickMap = new Map<string, { totalClicks: number; pinCount: number }>()

              for (const pin of brandPins) {
                const promptText = pin.image_prompt_used || "default"
                const existing = promptClickMap.get(promptText) || { totalClicks: 0, pinCount: 0 }
                existing.totalClicks += pin.outbound_clicks || 0
                existing.pinCount++
                promptClickMap.set(promptText, existing)
              }

              // Update prompt_weights with aggregated data
              const { data: promptWeights } = await supabase
                .from("prompt_weights")
                .select("id, prompt_template")
                .eq("user_id", user_id)
                .eq("brand_settings_id", brand.id)

              if (promptWeights) {
                for (const pw of promptWeights) {
                  const stats = promptClickMap.get(pw.prompt_template)
                  if (stats) {
                    await supabase
                      .from("prompt_weights")
                      .update({
                        total_clicks: stats.totalClicks,
                        total_pins_used: stats.pinCount,
                      })
                      .eq("id", pw.id)
                  }
                }
              }

              // Run the Bayesian weight update
              await updatePromptWeights(user_id, brand.id)
              logger.info(`📊 Updated prompt weights for user ${user_id}, brand ${brand.id}`)
            }
          }
        }

        logger.info(`📊 Updated analytics for ${totalUpdated} pins (user: ${user_id})`)

      } catch (userError: any) {
        logger.error(`Analytics error for user ${conn.user_id}: ${userError.message}`)
      }
    }

    logger.info(`📊 Analytics collector complete: ${totalUpdated} pins updated`)
    return { result: "Complete", updated: totalUpdated }
  },
})
