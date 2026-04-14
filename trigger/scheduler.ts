import { schedules } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { BillingAlertEmail } from "@/lib/emails/templates/billing-alert"
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/emails/client"
import { render } from "@react-email/components"

/**
 * Billing Reminder — Sends upcoming invoice emails
 * 
 * Runs daily at 10:00 AM UTC.
 * Checks for subscriptions renewing in 5 days and sends a reminder email.
 * 
 * Preserved from the legacy Watchman — this is payment infrastructure
 * that applies to both the old SEO product and the new EcomPin product.
 */
export const billingReminder = schedules.task({
    id: "billing-reminder",
    cron: "0 10 * * *", // Daily at 10:00 AM UTC
    run: async () => {
        console.log("🧾 Billing Reminder: Checking for upcoming renewals...")

        const supabase = createAdminClient() as any

        try {
            const targetDate = new Date()
            targetDate.setDate(targetDate.getDate() + 5)
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0)).toISOString()
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999)).toISOString()

            const { data: subs } = await supabase
                .from("dodo_subscriptions")
                .select("*, dodo_pricing_plans(name, price, currency)")
                .eq("status", "active")
                .gte("next_billing_date", startOfDay)
                .lte("next_billing_date", endOfDay)

            if (!subs || subs.length === 0) {
                console.log("🧾 No subscriptions renewing in 5 days.")
                return { result: "No upcoming renewals", sent: 0 }
            }

            console.log(`🧾 Found ${subs.length} subscriptions renewing soon`)
            let sentCount = 0

            for (const sub of subs) {
                const plan = (sub.dodo_pricing_plans as any)
                try {
                    const { data: userRec } = await supabase.auth.admin.getUserById(sub.user_id)
                    const user = userRec?.user

                    if (user?.email) {
                        const emailHtml = await render(BillingAlertEmail({
                            userName: user.user_metadata?.full_name || user.email.split('@')[0],
                            billingDate: new Date(sub.next_billing_date).toLocaleDateString(),
                            amount: plan ? `${plan.price} ${plan.currency}` : "Subscription Price",
                            planName: plan?.name || "EcomPin Plan"
                        }))

                        await resend.emails.send({
                            from: EMAIL_FROM,
                            to: user.email,
                            subject: `Upcoming Invoice Reminder 🧾`,
                            html: emailHtml,
                            replyTo: EMAIL_REPLY_TO
                        })
                        sentCount++
                        console.log(`📧 Billing email sent to ${user.email}`)
                    }
                } catch (err) {
                    console.error(`Failed to send billing email for sub ${sub.id}`, err)
                }
            }

            return { result: "Billing reminders sent", sent: sentCount }
        } catch (billingErr) {
            console.error("Billing check failed:", billingErr)
            return { result: "Billing check failed", error: String(billingErr) }
        }
    }
})
