import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"

/**
 * PinLoop — Account Warmup Manager
 * 
 * Runs daily at midnight UTC. Manages the progressive warmup protocol
 * to build Pinterest account trust and avoid shadow bans.
 * 
 * Warmup Phases:
 * ─────────────────────────────────────────────────────────────
 * Phase 1: warmup_no_url (Days 1-14)
 *   - Repin existing popular pins only
 *   - Do NOT publish URL pins (pins that link to external sites)
 *   - Goal: establish account as active, engage with platform
 *   - PinLoop action: generate pins but hold in queue
 * 
 * Phase 2: warmup_partial (Days 15-30)
 *   - Start publishing 1-2 URL pins per day
 *   - Continue repinning 3-5 community pins
 *   - Goal: introduce external links slowly
 * 
 * Phase 3: full (Days 31+)
 *   - Full publishing rate: up to 15 pins/day
 *   - Focus on URL pins to drive traffic
 *   - Analytics-driven optimization kicks in
 * ─────────────────────────────────────────────────────────────
 * 
 * Trust Score (0-100):
 *   - Based on account age, engagement rate, and absence of flags
 *   - Used to throttle publishing rate within each phase
 */
export const accountWarmup = schedules.task({
  id: "pinloop-account-warmup",
  cron: "0 0 * * *", // Daily at midnight UTC
  run: async () => {
    logger.info("🌡️ PinLoop warmup manager started")

    const supabase = createAdminClient() as any

    const { data: connections, error } = await supabase
      .from("pinterest_connections")
      .select("*")

    if (error || !connections || connections.length === 0) {
      logger.info("No Pinterest connections to manage")
      return { result: "No connections" }
    }

    let updated = 0

    for (const conn of connections) {
      try {
        // Calculate days since connection (not account creation)
        const connectedAt = new Date(conn.created_at)
        const daysSinceConnection = Math.floor(
          (Date.now() - connectedAt.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Determine new warmup phase
        let newPhase: string
        let newTrustScore: number

        if (daysSinceConnection < 14) {
          newPhase = "warmup_no_url"
          // Trust grows linearly: 10 → 40 over 14 days
          newTrustScore = Math.min(40, 10 + (daysSinceConnection * 30 / 14))
        } else if (daysSinceConnection < 30) {
          newPhase = "warmup_partial"
          // Trust grows: 40 → 75 over days 14-30
          const daysInPhase = daysSinceConnection - 14
          newTrustScore = Math.min(75, 40 + (daysInPhase * 35 / 16))
        } else {
          newPhase = "full"
          // Trust stabilizes at 80-100 based on performance
          newTrustScore = Math.min(100, 80 + Math.min(20, daysSinceConnection / 10))
        }

        // Check for recent shadow ban indicators
        // If pins have 0 impressions after 48 hours, reduce trust
        const { data: recentPins } = await supabase
          .from("pins")
          .select("id, impressions, published_at")
          .eq("user_id", conn.user_id)
          .eq("status", "published")
          .gte("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        if (recentPins && recentPins.length >= 5) {
          const zeroImpressionPins = recentPins.filter(
            (p: any) => (p.impressions || 0) === 0 &&
            new Date(p.published_at).getTime() < Date.now() - 48 * 60 * 60 * 1000
          )

          const zeroRate = zeroImpressionPins.length / recentPins.length
          if (zeroRate > 0.8) {
            // More than 80% of recent pins have zero impressions → likely shadow banned
            logger.warn(`⚠️ User ${conn.user_id}: ${Math.round(zeroRate * 100)}% zero-impression pins — possible shadow ban`)
            newTrustScore = Math.max(10, newTrustScore - 30)
            // Downgrade phase if currently full
            if (newPhase === "full") newPhase = "warmup_partial"
          } else if (zeroRate > 0.5) {
            // 50-80% zero impressions — caution
            logger.warn(`⚠️ User ${conn.user_id}: ${Math.round(zeroRate * 100)}% zero-impression pins — reducing rate`)
            newTrustScore = Math.max(20, newTrustScore - 15)
          }
        }

        // Only update if phase or trust score changed significantly
        const phaseChanged = conn.warmup_phase !== newPhase
        const trustChanged = Math.abs((conn.trust_score || 0) - newTrustScore) > 3

        if (phaseChanged || trustChanged) {
          await supabase
            .from("pinterest_connections")
            .update({
              warmup_phase: newPhase,
              trust_score: Math.round(newTrustScore),
              account_age_days: daysSinceConnection + (conn.account_age_days || 0),
              updated_at: new Date().toISOString(),
            })
            .eq("id", conn.id)

          if (phaseChanged) {
            logger.info(`🎉 User ${conn.user_id}: warmup phase changed ${conn.warmup_phase} → ${newPhase}`)
          }
          updated++
        }

        // Log health check
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { count: pinsToday } = await supabase
          .from("pins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", conn.user_id)
          .eq("status", "published")
          .gte("published_at", todayStart.toISOString())

        const { count: pinsThisWeek } = await supabase
          .from("pins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", conn.user_id)
          .eq("status", "published")
          .gte("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        await supabase.from("account_health_log").insert({
          user_id: conn.user_id,
          pinterest_connection_id: conn.id,
          pins_today: pinsToday || 0,
          pins_this_week: pinsThisWeek || 0,
          warmup_phase: newPhase,
          warmup_day: daysSinceConnection,
          shadow_ban_risk: newTrustScore < 30 ? "high" : newTrustScore < 60 ? "medium" : "low",
          checked_at: new Date().toISOString(),
        })

      } catch (err: any) {
        logger.error(`Error updating warmup for user ${conn.user_id}: ${err.message}`)
      }
    }

    logger.info(`🌡️ Warmup manager complete: ${updated} accounts updated`)
    return { result: "Complete", updated }
  },
})
