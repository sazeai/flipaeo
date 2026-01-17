import { task } from "@trigger.dev/sdk/v3"
import { createClient } from "@supabase/supabase-js"
import { fetchMozMetrics } from "@/lib/moz"
import { fetchPageSpeedMetrics } from "@/lib/pagespeed"

// Initialize Supabase client for Trigger.dev (uses service role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabase() {
    return createClient(supabaseUrl, supabaseServiceKey)
}

// Helper: Normalize domain to consistent format
function normalizeDomain(rawDomain: string): string {
    return rawDomain
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, '')
        .toLowerCase()
}

export interface SEOHealthPayload {
    userId: string
    brandId?: string
    domain: string
    force?: boolean
    refreshStrategy?: 'mobile' | 'desktop' | null
}

/**
 * SEO Health Check Background Task
 * Fetches Moz and PageSpeed metrics without Vercel timeout constraints
 */
export const seoHealthTask = task({
    id: "seo-health-check",
    maxDuration: 300, // 5 minutes max

    run: async (payload: SEOHealthPayload) => {
        const { userId, brandId, domain: rawDomain, force = false, refreshStrategy = null } = payload
        const domain = normalizeDomain(rawDomain)
        const fullUrl = `https://${domain}`

        console.log(`[SEO Health] Starting analysis for ${domain} (userId: ${userId})`)

        const supabase = getSupabase()

        // Update status to "running"
        await supabase
            .from("seo_metrics")
            .upsert({
                user_id: userId,
                domain,
                brand_id: brandId || null,
                status: 'running',
                fetched_at: new Date().toISOString()
            }, {
                onConflict: "user_id,domain"
            })

        try {
            // Fetch existing metrics for intelligent caching
            const { data: existingMetrics } = await supabase
                .from("seo_metrics")
                .select("*")
                .eq("user_id", userId)
                .eq("domain", domain)
                .order("fetched_at", { ascending: false })
                .limit(1)
                .single()

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
                    }
                    console.log("[SEO Health] Using cached Moz data (< 30 days)")
                }
            }

            // PageSpeed: Fetch both strategies OR just the requested one
            const shouldFetchDesktop = !refreshStrategy || refreshStrategy === 'desktop'
            const shouldFetchMobile = !refreshStrategy || refreshStrategy === 'mobile'

            console.log(`[SEO Health] Fetching: Moz=${shouldFetchMoz}, Desktop=${shouldFetchDesktop}, Mobile=${shouldFetchMobile}`)

            // Parallel fetch all APIs
            const [mozData, desktopData, mobileData] = await Promise.all([
                shouldFetchMoz ? fetchMozMetrics(fullUrl) : Promise.resolve(null),
                shouldFetchDesktop ? fetchPageSpeedMetrics(fullUrl, 'desktop') : Promise.resolve(null),
                shouldFetchMobile ? fetchPageSpeedMetrics(fullUrl, 'mobile') : Promise.resolve(null)
            ])

            const finalMozData = mozData || cachedMozData

            if (!finalMozData && !desktopData && !mobileData) {
                // Update status to failed
                await supabase
                    .from("seo_metrics")
                    .update({
                        status: 'failed',
                        error_message: 'Failed to fetch any metrics from APIs'
                    })
                    .eq("user_id", userId)
                    .eq("domain", domain)

                return { success: false, error: "Failed to fetch any metrics" }
            }

            // Build the complete metrics object
            const metrics = {
                user_id: userId,
                brand_id: brandId || existingMetrics?.brand_id || null,
                domain,
                fetched_at: new Date().toISOString(),
                status: 'completed',
                error_message: null,

                // Moz metrics
                domain_authority: finalMozData?.domain_authority ?? existingMetrics?.domain_authority ?? null,
                page_authority: finalMozData?.page_authority ?? existingMetrics?.page_authority ?? null,
                linking_root_domains: finalMozData?.linking_root_domains ?? existingMetrics?.linking_root_domains ?? null,
                external_links: finalMozData?.external_links ?? existingMetrics?.external_links ?? null,

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

            // Upsert to database
            const { data: savedMetrics, error } = await supabase
                .from("seo_metrics")
                .upsert(metrics, {
                    onConflict: "user_id,domain"
                })
                .select()
                .single()

            if (error) {
                console.error("[SEO Health] Database error:", error)
                return { success: false, error: error.message, metrics }
            }

            console.log(`[SEO Health] Completed analysis for ${domain}`)

            return {
                success: true,
                metrics: savedMetrics
            }

        } catch (error: any) {
            console.error("[SEO Health] Error:", error)

            // Update status to failed
            await supabase
                .from("seo_metrics")
                .update({
                    status: 'failed',
                    error_message: error.message || 'Unknown error'
                })
                .eq("user_id", userId)
                .eq("domain", domain)

            return { success: false, error: error.message }
        }
    }
})
