import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/emails/client"

/**
 * EcomPin — Weekly Performance Report
 * 
 * Runs every Monday at 9 AM UTC.
 * Sends each user a summary of their Pinterest performance:
 * - Pins generated + published this week
 * - Total outbound clicks + impressions
 * - Best performing pin
 * - Winning aesthetic style (top prompt weight)
 * - Engine health status
 */
export const weeklyReport = schedules.task({
    id: "pinloop-weekly-report",
    cron: "0 9 * * 1", // Every Monday 9 AM UTC
    run: async () => {
        logger.info("📧 EcomPin weekly report starting")

        const supabase = createAdminClient() as any

        // Get all users with brand settings (active engine users)
        const { data: brands, error } = await supabase
            .from("brand_settings")
            .select("id, user_id, brand_name")

        if (error || !brands || brands.length === 0) {
            return { result: "No brands", sent: 0 }
        }

        let sentCount = 0
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        for (const brand of brands) {
            try {
                // Get user email
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("email, full_name")
                    .eq("id", brand.user_id)
                    .single()

                if (!profile?.email) continue

                // Collect stats
                const { count: pinsGenerated } = await supabase
                    .from("pins")
                    .select("id", { count: "exact", head: true })
                    .eq("user_id", brand.user_id)
                    .gte("created_at", weekAgo)

                const { count: pendingApproval } = await supabase
                    .from("pins")
                    .select("id", { count: "exact", head: true })
                    .eq("user_id", brand.user_id)
                    .eq("status", "pending_approval")

                const { count: pinsPublished } = await supabase
                    .from("pins")
                    .select("id", { count: "exact", head: true })
                    .eq("user_id", brand.user_id)
                    .eq("status", "published")
                    .gte("published_at", weekAgo)

                const { data: publishedPins } = await supabase
                    .from("pins")
                    .select("id, pin_title, outbound_clicks, impressions, saves, rendered_image_url")
                    .eq("user_id", brand.user_id)
                    .eq("status", "published")
                    .gte("published_at", weekAgo)
                    .order("outbound_clicks", { ascending: false })
                    .limit(5)

                const totalClicks = (publishedPins || []).reduce((s: number, p: any) => s + (p.outbound_clicks || 0), 0)
                const totalImpressions = (publishedPins || []).reduce((s: number, p: any) => s + (p.impressions || 0), 0)
                const totalSaves = (publishedPins || []).reduce((s: number, p: any) => s + (p.saves || 0), 0)
                const bestPin = publishedPins?.[0] || null

                // Get top prompt weight (winning aesthetic)
                const { data: topWeight } = await supabase
                    .from("prompt_weights")
                    .select("aesthetic_tags, weight, total_clicks")
                    .eq("user_id", brand.user_id)
                    .eq("brand_settings_id", brand.id)
                    .order("weight", { ascending: false })
                    .limit(1)
                    .single()

                const winningAesthetic = topWeight?.aesthetic_tags?.[0] || "Not enough data yet"

                // Get warmup status
                const { data: connection } = await supabase
                    .from("pinterest_connections")
                    .select("warmup_phase, trust_score")
                    .eq("user_id", brand.user_id)
                    .single()

                const warmupLabel = connection?.warmup_phase === "full" ? "Full Speed 🚀"
                    : connection?.warmup_phase === "warmup_partial" ? "Warming Up 🌡️"
                        : connection?.warmup_phase === "warmup_no_url" ? "Building Trust 🌱"
                            : "Not Connected"

                // Build email HTML
                const emailHtml = buildReportEmail({
                    userName: profile.full_name || "there",
                    brandName: brand.brand_name,
                    pinsGenerated: pinsGenerated || 0,
                    pinsPublished: pinsPublished || 0,
                    pendingApproval: pendingApproval || 0,
                    totalClicks,
                    totalImpressions,
                    totalSaves,
                    bestPinTitle: bestPin?.pin_title || null,
                    bestPinClicks: bestPin?.outbound_clicks || 0,
                    winningAesthetic,
                    warmupLabel,
                    trustScore: connection?.trust_score || 0,
                })

                await resend.emails.send({
                    from: EMAIL_FROM.replace('FlipAEO', 'EcomPin'),
                    replyTo: EMAIL_REPLY_TO,
                    to: profile.email,
                    subject: `📊 Your EcomPin Weekly — ${totalClicks} clicks, ${pinsPublished || 0} pins published`,
                    html: emailHtml,
                })

                sentCount++
                logger.info(`📧 Sent weekly report to ${profile.email}`)

            } catch (err: any) {
                logger.error(`Failed to send report for user ${brand.user_id}: ${err.message}`)
            }
        }

        logger.info(`📧 Weekly reports complete: ${sentCount} sent`)
        return { result: "Complete", sent: sentCount }
    },
})

/**
 * Build the weekly report email HTML.
 */
function buildReportEmail(data: {
    userName: string
    brandName: string
    pinsGenerated: number
    pinsPublished: number
    pendingApproval: number
    totalClicks: number
    totalImpressions: number
    totalSaves: number
    bestPinTitle: string | null
    bestPinClicks: number
    winningAesthetic: string
    warmupLabel: string
    trustScore: number
}): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; padding: 32px 16px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 24px; font-weight: 800; color: #1c1917; margin: 0;">
        📌 EcomPin
      </h1>
      <p style="color: #78716c; font-size: 13px; margin: 4px 0 0;">
        Weekly Report — ${data.brandName}
      </p>
    </div>

    <!-- Greeting -->
    <p style="color: #44403c; font-size: 15px; line-height: 1.6;">
      Hey ${data.userName} 👋
    </p>
    <p style="color: #44403c; font-size: 15px; line-height: 1.6;">
      Here's what your EcomPin engine accomplished this week:
    </p>

    <!-- Stats Grid -->
    <div style="display: flex; gap: 12px; margin: 24px 0;">
      <div style="flex: 1; background: white; border-radius: 12px; padding: 16px; border: 1px solid #e7e5e4; text-align: center;">
        <div style="font-size: 28px; font-weight: 800; color: #1c1917;">${data.pinsPublished}</div>
        <div style="font-size: 11px; color: #a8a29e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Pins Published</div>
      </div>
      <div style="flex: 1; background: white; border-radius: 12px; padding: 16px; border: 1px solid #e7e5e4; text-align: center;">
        <div style="font-size: 28px; font-weight: 800; color: #1c1917;">${data.totalClicks}</div>
        <div style="font-size: 11px; color: #a8a29e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Outbound Clicks</div>
      </div>
      <div style="flex: 1; background: white; border-radius: 12px; padding: 16px; border: 1px solid #e7e5e4; text-align: center;">
        <div style="font-size: 28px; font-weight: 800; color: #1c1917;">${data.totalImpressions}</div>
        <div style="font-size: 11px; color: #a8a29e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Impressions</div>
      </div>
    </div>

    <!-- Best Pin -->
    ${data.bestPinTitle ? `
    <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e7e5e4; margin-bottom: 16px;">
      <div style="font-size: 11px; color: #a8a29e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">🏆 Best Performing Pin</div>
      <div style="font-size: 15px; font-weight: 600; color: #1c1917;">${data.bestPinTitle}</div>
      <div style="font-size: 13px; color: #78716c; margin-top: 4px;">${data.bestPinClicks} outbound clicks</div>
    </div>
    ` : ''}

    <!-- Engine Status -->
    <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e7e5e4; margin-bottom: 16px;">
      <div style="font-size: 11px; color: #a8a29e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Engine Status</div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 13px; color: #78716c;">Warmup Phase</span>
        <span style="font-size: 13px; font-weight: 600; color: #1c1917;">${data.warmupLabel}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 13px; color: #78716c;">Trust Score</span>
        <span style="font-size: 13px; font-weight: 600; color: #1c1917;">${data.trustScore}/100</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 13px; color: #78716c;">Winning Aesthetic</span>
        <span style="font-size: 13px; font-weight: 600; color: #1c1917;">${data.winningAesthetic}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-size: 13px; color: #78716c;">Pins Generated</span>
        <span style="font-size: 13px; font-weight: 600; color: #1c1917;">${data.pinsGenerated}</span>
      </div>
    </div>

    <!-- Footer -->
    <p style="color: #a8a29e; font-size: 12px; text-align: center; margin-top: 32px;">
      Your EcomPin engine is working for you.${data.pendingApproval && data.pendingApproval > 0 ? `<br>You have <strong>${data.pendingApproval} pins</strong> awaiting your approval.` : ''}<br>
      Log in to your dashboard anytime to fine-tune your settings.
    </p>

  </div>
</body>
</html>
  `.trim()
}