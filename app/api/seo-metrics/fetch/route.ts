import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { tasks } from "@trigger.dev/sdk/v3"
import { seoHealthTask } from "@/trigger/seo-health"

/**
 * POST /api/seo-metrics/fetch
 * Triggers SEO health check as a background job via Trigger.dev
 * Returns immediately - frontend should poll /api/seo-metrics for results
 */

// Helper: Normalize domain to consistent format
function normalizeDomain(rawDomain: string): string {
    return rawDomain
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .toLowerCase()
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { domain: rawDomain, brandId, force = false, refreshStrategy = null } = await req.json()

        if (!rawDomain) {
            return NextResponse.json({ error: "Domain is required" }, { status: 400 })
        }

        const domain = normalizeDomain(rawDomain)

        // Check for cached data if not forcing refresh
        if (!force) {
            const { data: existingMetrics } = await supabase
                .from("seo_metrics")
                .select("*")
                .eq("user_id", user.id)
                .eq("domain", domain)
                .order("fetched_at", { ascending: false })
                .limit(1)
                .single()

            if (existingMetrics) {
                // If currently running, just return status
                if (existingMetrics.status === 'running') {
                    return NextResponse.json({
                        success: true,
                        triggered: false,
                        status: 'running',
                        message: "Analysis already in progress"
                    })
                }

                // Return cached data if fresh (< 7 days)
                const fetchedAt = new Date(existingMetrics.fetched_at)
                const ageInDays = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24)

                if (ageInDays < 7 && existingMetrics.status === 'completed') {
                    return NextResponse.json({
                        success: true,
                        metrics: existingMetrics,
                        cached: true,
                        message: "Using cached data"
                    })
                }
            }
        }

        console.log(`[SEO Metrics] Triggering background job for ${domain}...`)

        // Set status to pending before triggering
        await supabase
            .from("seo_metrics")
            .upsert({
                user_id: user.id,
                domain,
                brand_id: brandId || null,
                status: 'pending',
                fetched_at: new Date().toISOString()
            }, {
                onConflict: "user_id,domain"
            })

        // Trigger the background job
        const handle = await tasks.trigger<typeof seoHealthTask>(
            "seo-health-check",
            {
                userId: user.id,
                brandId: brandId || undefined,
                domain,
                force,
                refreshStrategy
            }
        )

        console.log(`[SEO Metrics] Triggered job ${handle.id} for ${domain}`)

        return NextResponse.json({
            success: true,
            triggered: true,
            jobId: handle.id,
            status: 'pending',
            message: "Analysis started. Poll /api/seo-metrics for results."
        })

    } catch (error: any) {
        console.error("[SEO Metrics] Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to trigger analysis" },
            { status: 500 }
        )
    }
}
