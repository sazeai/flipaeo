import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * GET /api/seo-metrics
 * Returns cached SEO metrics from database (single-row architecture)
 * Returns complete row with both mobile and desktop data
 */

// Helper: Normalize domain to consistent format
function normalizeDomain(rawDomain: string): string {
    return rawDomain
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .toLowerCase()
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const rawDomain = searchParams.get("domain")
        const brandId = searchParams.get("brandId")

        const domain = rawDomain ? normalizeDomain(rawDomain) : null

        let query = supabase
            .from("seo_metrics")
            .select("*")
            .eq("user_id", user.id)
            .order("fetched_at", { ascending: false })

        if (domain) {
            query = query.eq("domain", domain)
        }

        if (brandId) {
            query = query.eq("brand_id", brandId)
        }

        const { data: metrics, error } = await query.limit(1).single()

        if (error && error.code !== "PGRST116") {
            console.error("[SEO Metrics] Database error:", error)
            return NextResponse.json({ error: "Database error" }, { status: 500 })
        }

        if (!metrics) {
            return NextResponse.json({
                metrics: null,
                message: "No metrics found. Run an analysis to get started."
            })
        }

        // Calculate data age
        const fetchedAt = new Date(metrics.fetched_at)
        const ageInDays = Math.floor((Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24))

        return NextResponse.json({
            metrics,
            status: metrics.status || 'completed',
            error_message: metrics.error_message || null,
            age_days: ageInDays,
            stale: ageInDays > 30
        })

    } catch (error: any) {
        console.error("[SEO Metrics] Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to get metrics" },
            { status: 500 }
        )
    }
}
