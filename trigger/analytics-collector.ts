import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { getValidAccessToken, getBatchPinAnalytics } from "@/lib/pinterest-api"

/**
 * EcomPin — Analytics Collector
 * 
 * Runs every 24 hours. For each user with a Pinterest connection:
 * 1. Fetches analytics for all published pins (last 30 days)
 * 2. Updates pin records with click/impression/save counts
 */
export const analyticsCollector = schedules.task({
  id: "pinloop-analytics-collector",
  cron: "30 3 * * *", // Daily at 3:30 AM UTC (off-peak)
  run: async () => {
    logger.info("📊  EcomPin analytics collector started")

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
          .select("id, pinterest_pin_id")
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

          // Write daily time-series snapshot for analytics dashboard
          // Uses upsert so multiple collector runs per day just update the same row
          const today = new Date().toISOString().slice(0, 10)
          await supabase
            .from("pin_analytics_snapshots")
            .upsert({
              pin_id: pin.id,
              user_id: conn.user_id,
              impressions: pinAnalytics.impressions,
              outbound_clicks: pinAnalytics.outbound_clicks,
              saves: pinAnalytics.saves,
              snapshot_date: today,
            }, { onConflict: 'pin_id,snapshot_date' })

          totalUpdated++
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
