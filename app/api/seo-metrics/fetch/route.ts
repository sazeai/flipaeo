import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { fetchMozMetrics } from "@/lib/moz"
import { fetchPageSpeedMetrics } from "@/lib/pagespeed"

export const maxDuration = 60 // 60 second timeout for API calls

/**
 * POST /api/seo-metrics/fetch
 * Fetches fresh metrics from Moz + PageSpeed (both mobile & desktop) and stores in database
 * Single-row architecture: one row per domain with all strategies
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
        const fullUrl = `https://${domain}`

        // Fetch existing metrics
        const { data: existingMetrics } = await supabase
            .from("seo_metrics")
            .select("*")
            .eq("user_id", user.id)
            .eq("domain", domain)
            .order("fetched_at", { ascending: false })
            .limit(1)
            .single()

        // Check cache (if not forcing refresh)
        if (!force && existingMetrics) {
            const fetchedAt = new Date(existingMetrics.fetched_at)
            const ageInDays = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24)

            if (ageInDays < 7) {
                return NextResponse.json({
                    success: true,
                    metrics: existingMetrics,
                    cached: true,
                    message: "Using cached data"
                })
            }
        }

        console.log(`[SEO Metrics] Fetching fresh metrics for ${domain} (force=${force}, refreshStrategy=${refreshStrategy})...`)

        // INTELLIGENT FETCHING
        // Moz: Only fetch if missing or > 30 days old
        let shouldFetchMoz = true
        let cachedMozData = null

        if (existingMetrics && existingMetrics.domain_authority) {
            const fetchedAt = new Date(existingMetrics.fetched_at)
            const ageInDays = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24)
            if (ageInDays < 30) {
                shouldFetchMoz = false
                cachedMozData = {
                    domain_authority: existingMetrics.domain_authority,
                    page_authority: existingMetrics.page_authority,
                    linking_root_domains: existingMetrics.linking_root_domains,
                    external_links: existingMetrics.external_links,
                    spam_score: existingMetrics.spam_score
                }
                console.log("[SEO Metrics] Using cached Moz data (< 30 days)")
            }
        }

        // PageSpeed: Fetch both strategies OR just the requested one
        // If refreshStrategy is specified, only refresh that strategy
        const shouldFetchDesktop = !refreshStrategy || refreshStrategy === 'desktop'
        const shouldFetchMobile = !refreshStrategy || refreshStrategy === 'mobile'

        // Parallel fetch all APIs
        const [mozData, desktopData, mobileData] = await Promise.all([
            shouldFetchMoz ? fetchMozMetrics(fullUrl) : Promise.resolve(null),
            shouldFetchDesktop ? fetchPageSpeedMetrics(fullUrl, 'desktop') : Promise.resolve(null),
            shouldFetchMobile ? fetchPageSpeedMetrics(fullUrl, 'mobile') : Promise.resolve(null)
        ])

        const finalMozData = mozData || cachedMozData

        if (!finalMozData && !desktopData && !mobileData) {
            return NextResponse.json({ error: "Failed to fetch any metrics" }, { status: 500 })
        }

        // Build the complete metrics object (merge with existing if partial refresh)
        const metrics = {
            user_id: user.id,
            brand_id: brandId || existingMetrics?.brand_id || null,
            domain,
            fetched_at: new Date().toISOString(),

            // Moz metrics
            domain_authority: finalMozData?.domain_authority ?? existingMetrics?.domain_authority ?? null,
            page_authority: finalMozData?.page_authority ?? existingMetrics?.page_authority ?? null,
            linking_root_domains: finalMozData?.linking_root_domains ?? existingMetrics?.linking_root_domains ?? null,
            external_links: finalMozData?.external_links ?? existingMetrics?.external_links ?? null,
            spam_score: finalMozData?.spam_score ?? existingMetrics?.spam_score ?? null,

            // Desktop PageSpeed
            performance_desktop: desktopData?.performance_score ?? existingMetrics?.performance_desktop ?? null,
            accessibility_desktop: desktopData?.accessibility_score ?? existingMetrics?.accessibility_desktop ?? null,
            best_practices_desktop: desktopData?.best_practices_score ?? existingMetrics?.best_practices_desktop ?? null,
            seo_desktop: desktopData?.seo_score ?? existingMetrics?.seo_desktop ?? null,
            lcp_desktop: desktopData?.lcp_seconds ?? existingMetrics?.lcp_desktop ?? null,
            cls_desktop: desktopData?.cls ?? existingMetrics?.cls_desktop ?? null,
            tbt_desktop: desktopData?.tbt_ms ?? existingMetrics?.tbt_desktop ?? null,
            fcp_desktop: desktopData?.fcp_seconds ?? existingMetrics?.fcp_desktop ?? null,
            recommendations_desktop: desktopData?.recommendations ?? existingMetrics?.recommendations_desktop ?? [],

            // Mobile PageSpeed
            performance_mobile: mobileData?.performance_score ?? existingMetrics?.performance_mobile ?? null,
            accessibility_mobile: mobileData?.accessibility_score ?? existingMetrics?.accessibility_mobile ?? null,
            best_practices_mobile: mobileData?.best_practices_score ?? existingMetrics?.best_practices_mobile ?? null,
            seo_mobile: mobileData?.seo_score ?? existingMetrics?.seo_mobile ?? null,
            lcp_mobile: mobileData?.lcp_seconds ?? existingMetrics?.lcp_mobile ?? null,
            cls_mobile: mobileData?.cls ?? existingMetrics?.cls_mobile ?? null,
            tbt_mobile: mobileData?.tbt_ms ?? existingMetrics?.tbt_mobile ?? null,
            fcp_mobile: mobileData?.fcp_seconds ?? existingMetrics?.fcp_mobile ?? null,
            recommendations_mobile: mobileData?.recommendations ?? existingMetrics?.recommendations_mobile ?? [],
        }

        // Upsert to database (single row per user+domain)
        const { data: savedMetrics, error } = await supabase
            .from("seo_metrics")
            .upsert(metrics, {
                onConflict: "user_id,domain"
            })
            .select()
            .single()

        if (error) {
            console.error("[SEO Metrics] Database error:", error)
            return NextResponse.json({
                success: true,
                metrics,
                cached: false,
                warning: "Metrics fetched but failed to save"
            })
        }

        console.log(`[SEO Metrics] Saved metrics for ${domain}`)

        return NextResponse.json({
            success: true,
            metrics: savedMetrics,
            cached: false
        })

    } catch (error: any) {
        console.error("[SEO Metrics] Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to fetch metrics" },
            { status: 500 }
        )
    }
}
