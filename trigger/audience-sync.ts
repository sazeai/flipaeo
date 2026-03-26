import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { getValidAccessToken, getAudienceInsights } from "@/lib/pinterest-api"

/**
 * PinLoop — Audience Insights Sync (Feature 10)
 * 
 * Runs monthly (1st of each month at 3 AM UTC).
 * Fetches engagement analytics from each user's Pinterest Business Account
 * and stores the demographic profile in brand_settings.audience_profile.
 * 
 * The Context Matrix reads this profile to bias AI-generated lifestyle
 * angles toward the user's actual engaged audience.
 */
export const audienceSync = schedules.task({
  id: "pinloop-audience-sync",
  cron: "0 3 1 * *", // 1st of each month at 3 AM UTC
  run: async () => {
    logger.info("📊 PinLoop audience sync started")

    const supabase = createAdminClient() as any

    // Get all users with Pinterest connections
    const { data: connections, error } = await supabase
      .from("pinterest_connections")
      .select("user_id, pinterest_user_id")

    if (error || !connections || connections.length === 0) {
      logger.info("No Pinterest connections found")
      return { result: "No connections", synced: 0 }
    }

    let totalSynced = 0

    for (const connection of connections) {
      try {
        const { user_id } = connection

        // Get valid access token
        const accessToken = await getValidAccessToken(user_id)
        if (!accessToken) {
          logger.warn(`No valid token for user ${user_id}, skipping`)
          continue
        }

        // Fetch audience insights from Pinterest
        const insights = await getAudienceInsights(accessToken)
        if (!insights) {
          logger.warn(`No insights available for user ${user_id}`)
          continue
        }

        // Build a simplified audience profile for prompt injection
        const audienceProfile = {
          raw_metrics: insights.topPinMetrics,
          synced_at: new Date().toISOString(),
          source: "pinterest_user_account_analytics",
        }

        // Save to brand_settings
        await supabase
          .from("brand_settings")
          .update({ audience_profile: audienceProfile })
          .eq("user_id", user_id)

        totalSynced++
        logger.info(`✅ Audience profile synced for user ${user_id}`)

      } catch (userError: any) {
        logger.error(`Error syncing audience for ${connection.user_id}: ${userError.message}`)
      }
    }

    logger.info(`📊 Audience sync complete: ${totalSynced} profiles updated`)
    return { result: "Complete", synced: totalSynced }
  },
})
