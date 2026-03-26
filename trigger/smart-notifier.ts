import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"

/**
 * Smart Notifier (The B2B UX Manager)
 * 
 * Runs daily at 10:00 AM UTC.
 * Responsibilities:
 * - Checks if user is running low on approved pins (< 5 left)
 * - Checks if there is a sufficient new batch ready (> 12 pending)
 * - Checks if we've already emailed them recently (throttle to 1 email per 4 days)
 * 
 * This guarantees users only get the "Approval Needed" email when they *actually* need to act.
 */
export const smartNotifier = schedules.task({
  id: "pinloop-smart-notifier",
  cron: "0 10 * * *", // 10:00 AM UTC daily
  run: async () => {
    logger.info("📩 PinLoop Smart Notifier started")

    const supabase = createAdminClient() as any

    // 1. Fetch active brands
    const { data: brands, error } = await supabase
      .from("brand_settings")
      .select("id, user_id, brand_name, automation_paused, autopilot_enabled, last_notified_at")

    if (error || !brands || brands.length === 0) {
      logger.info("No active brands found")
      return { result: "No brands" }
    }

    let usersNotified = 0

    for (const brand of brands) {
      // Skip if completely paused or on full autopilot (autopilot skips the inbox)
      if (brand.automation_paused || brand.autopilot_enabled) continue

      // 2. Count Approved Pins (The Queue)
      const { count: queuedCount } = await supabase
        .from("pin_queue")
        .select("id", { count: "exact", head: true })
        .eq("user_id", brand.user_id)
        .eq("status", "pending")

      // 3. Count Pending Pins (The Inbox)
      const { count: pendingCount } = await supabase
        .from("pins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", brand.user_id)
        .eq("status", "pending_approval")

      const qCount = queuedCount || 0
      const pCount = pendingCount || 0

      logger.info(`Brand: ${brand.brand_name} | Queued: ${qCount} | Pending: ${pCount}`)

      // 4. Evaluate Notification Triggers
      if (qCount < 5 && pCount >= 12) {
        // Check 4-day throttle
        let recentlyNotified = false
        if (brand.last_notified_at) {
          const lastDate = new Date(brand.last_notified_at)
          const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
          if (lastDate > fourDaysAgo) recentlyNotified = true
        }

        if (!recentlyNotified) {
          logger.info(`🚨 Triggering Approval Email for: ${brand.brand_name} (Queue is low!)`)
          
          // TODO: Actually trigger Resend/Postmark email here.
          // e.g., await sendEmail(user.email, "Your PinLoop queue is running low! 12+ new pins await...")

          // Update DB with timestamp
          await supabase
            .from("brand_settings")
            .update({ last_notified_at: new Date().toISOString() })
            .eq("id", brand.id)
            
          usersNotified++
        } else {
          logger.info(`Skipped email for ${brand.brand_name} — already notified recently.`)
        }
      }
    }

    logger.info(`📩 Smart Notifier complete. Notified ${usersNotified} brands.`)
    return { notified: usersNotified }
  }
})
