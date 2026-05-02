import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"

/**
 * EcomPin — A/B Experiment Evaluator
 *
 * Runs daily at 5:00 AM UTC (after aesthetic-optimizer at 4:00 AM).
 *
 * Evaluates running A/B experiments that are at least 7 days old:
 * 1. Fetches cumulative analytics for both pins in each experiment
 * 2. Requires minimum 50 impressions per pin to declare a winner (statistical floor)
 * 3. Compares CTR to determine winner
 * 4. Boosts the winning aesthetic's weight in prompt_weights (+0.1)
 * 5. Expires experiments that haven't reached 50 impressions after 14 days
 */

const MIN_IMPRESSIONS = 50   // Minimum impressions to declare a statistically meaningful winner
const EVALUATION_DAYS = 7    // Days before first evaluation attempt
const EXPIRY_DAYS = 14       // Days before expiring inconclusive experiments
const WINNER_WEIGHT_BOOST = 0.001 // Weight boost for the winning aesthetic

export const abEvaluator = schedules.task({
  id: "pinloop-ab-evaluator",
  cron: "0 5 * * *", // Daily at 5:00 AM UTC
  run: async () => {
    logger.info("🧪 A/B evaluator started")

    const supabase = createAdminClient() as any

    // Get running experiments that are at least 7 days old
    const sevenDaysAgo = new Date(Date.now() - EVALUATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const fourteenDaysAgo = new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { data: experiments, error } = await supabase
      .from("ab_experiments")
      .select("*")
      .eq("status", "running")
      .lte("started_at", sevenDaysAgo)

    if (error || !experiments || experiments.length === 0) {
      logger.info("No experiments ready for evaluation")
      return { result: "No experiments", concluded: 0, expired: 0 }
    }

    let concluded = 0
    let expired = 0

    for (const experiment of experiments) {
      try {
        // Fetch analytics for both pins
        const { data: pinA } = await supabase
          .from("pins")
          .select("impressions, outbound_clicks, saves, status")
          .eq("id", experiment.pin_a_id)
          .single()

        const { data: pinB } = await supabase
          .from("pins")
          .select("impressions, outbound_clicks, saves, status")
          .eq("id", experiment.pin_b_id)
          .single()

        if (!pinA || !pinB) {
          logger.warn(`Experiment ${experiment.id}: one or both pins missing. Expiring.`)
          await supabase.from("ab_experiments").update({
            status: "expired",
            concluded_at: new Date().toISOString(),
          }).eq("id", experiment.id)
          expired++
          continue
        }

        // Check if both pins were actually published (user may have rejected one)
        if (pinA.status !== 'published' || pinB.status !== 'published') {
          // If experiment is old enough, expire it
          if (new Date(experiment.started_at) < new Date(fourteenDaysAgo)) {
            logger.info(`Experiment ${experiment.id}: one or both pins not published after ${EXPIRY_DAYS} days. Expiring.`)
            await supabase.from("ab_experiments").update({
              status: "expired",
              concluded_at: new Date().toISOString(),
              metrics_a: {
                impressions: pinA.impressions || 0,
                clicks: pinA.outbound_clicks || 0,
                saves: pinA.saves || 0,
                status: pinA.status,
              },
              metrics_b: {
                impressions: pinB.impressions || 0,
                clicks: pinB.outbound_clicks || 0,
                saves: pinB.saves || 0,
                status: pinB.status,
              },
            }).eq("id", experiment.id)
            expired++
          }
          continue
        }

        const impressionsA = pinA.impressions || 0
        const impressionsB = pinB.impressions || 0
        const clicksA = pinA.outbound_clicks || 0
        const clicksB = pinB.outbound_clicks || 0

        const metricsA = {
          impressions: impressionsA,
          clicks: clicksA,
          saves: pinA.saves || 0,
          ctr: impressionsA > 0 ? Math.round((clicksA / impressionsA) * 10000) / 100 : 0,
        }
        const metricsB = {
          impressions: impressionsB,
          clicks: clicksB,
          saves: pinB.saves || 0,
          ctr: impressionsB > 0 ? Math.round((clicksB / impressionsB) * 10000) / 100 : 0,
        }

        // Check if we have enough data
        if (impressionsA < MIN_IMPRESSIONS || impressionsB < MIN_IMPRESSIONS) {
          // Not enough data yet — check if experiment is past expiry
          if (new Date(experiment.started_at) < new Date(fourteenDaysAgo)) {
            logger.info(`Experiment ${experiment.id}: insufficient data after ${EXPIRY_DAYS} days (A: ${impressionsA}, B: ${impressionsB} impressions). Expiring.`)
            await supabase.from("ab_experiments").update({
              status: "expired",
              concluded_at: new Date().toISOString(),
              metrics_a: metricsA,
              metrics_b: metricsB,
            }).eq("id", experiment.id)
            expired++
          } else {
            logger.info(`Experiment ${experiment.id}: waiting for data (A: ${impressionsA}, B: ${impressionsB} impressions, need ${MIN_IMPRESSIONS} each)`)
          }
          continue
        }

        // Declare winner based on CTR
        const ctrA = clicksA / impressionsA
        const ctrB = clicksB / impressionsB

        let winner: 'a' | 'b' | 'tie'
        // Require at least 20% relative CTR difference to declare a winner (avoid noise)
        const relativeDiff = Math.abs(ctrA - ctrB) / Math.max(ctrA, ctrB, 0.001)
        if (relativeDiff < 0.2) {
          winner = 'tie'
        } else if (ctrA > ctrB) {
          winner = 'a'
        } else {
          winner = 'b'
        }

        // Update experiment with results
        await supabase.from("ab_experiments").update({
          status: "concluded",
          winner,
          concluded_at: new Date().toISOString(),
          metrics_a: metricsA,
          metrics_b: metricsB,
        }).eq("id", experiment.id)

        // Boost the winning aesthetic's weight in prompt_weights
        if (winner !== 'tie') {
          const winningAesthetic = winner === 'a' ? experiment.aesthetic_a : experiment.aesthetic_b
          const { data: existingWeight } = await supabase
            .from("prompt_weights")
            .select("id, weight")
            .eq("user_id", experiment.user_id)
            .contains("aesthetic_tags", [winningAesthetic])
            .maybeSingle()

          if (existingWeight) {
            await supabase.from("prompt_weights").update({
              weight: Math.round((Number(existingWeight.weight) + WINNER_WEIGHT_BOOST) * 10000) / 10000,
              updated_at: new Date().toISOString(),
            }).eq("id", existingWeight.id)
          }

          logger.info(`🏆 Experiment ${experiment.id}: Winner is "${winningAesthetic}" (${winner.toUpperCase()}) with CTR ${(winner === 'a' ? ctrA : ctrB * 100).toFixed(2)}% vs ${(winner === 'a' ? ctrB : ctrA * 100).toFixed(2)}%`)
        } else {
          logger.info(`🤝 Experiment ${experiment.id}: Tie — CTR difference too small (A: ${(ctrA * 100).toFixed(2)}%, B: ${(ctrB * 100).toFixed(2)}%)`)
        }

        concluded++

      } catch (err: any) {
        logger.error(`Error evaluating experiment ${experiment.id}: ${err.message}`)
      }
    }

    logger.info(`🧪 A/B evaluator complete: ${concluded} concluded, ${expired} expired`)
    return { result: "Complete", concluded, expired }
  },
})
