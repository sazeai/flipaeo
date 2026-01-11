import { task } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { BrandDetails } from "@/lib/schemas/brand"
import { generateStrategicPlan } from "@/lib/plans/strategic-planner"
import { tavily } from "@tavily/core"
import Sitemapper from "sitemapper"
import { extractTitleFromUrl, generateEmbedding } from "@/lib/internal-linking"


interface GeneratePlanPayload {
    planId: string
    userId: string
    brandId: string
    brandData: BrandDetails
    brandUrl?: string
    competitorBrands?: Array<{ name: string; url?: string }>
    existingContent?: string[]
}

/**
 * Sync sitemap URLs to internal_links table.
 * Returns titles for use in plan generation to avoid duplicate content.
 */
async function syncSitemapToInternalLinks(
    websiteUrl: string,
    userId: string,
    brandId: string
): Promise<{ titles: string[]; syncedCount: number }> {
    const supabase = createAdminClient()

    // Build sitemap URLs to try
    const baseUrl = websiteUrl.replace(/\/$/, '')
    const sitemapPaths = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml']

    let sitemapUrls: string[] = []

    console.log(`[Sitemap Sync] Starting sync for ${baseUrl}`)

    // 1. Try to find sitemap in robots.txt first
    try {
        const robotsUrl = `${baseUrl}/robots.txt`
        console.log(`[Sitemap Sync] Checking robots.txt at ${robotsUrl}`)
        const robotsRes = await fetch(robotsUrl)
        if (robotsRes.ok) {
            const robotsTxt = await robotsRes.text()
            const sitemapMatch = robotsTxt.match(/Sitemap:\s*(https?:\/\/[^\s]+)/i)
            if (sitemapMatch && sitemapMatch[1]) {
                const foundSitemap = sitemapMatch[1].trim()
                console.log(`[Sitemap Sync] Found sitemap in robots.txt: ${foundSitemap}`)
                // Add to front of paths to try (extracted path only)
                try {
                    const sitemapPath = new URL(foundSitemap).pathname
                    if (!sitemapPaths.includes(sitemapPath)) {
                        sitemapPaths.unshift(sitemapPath)
                    }
                } catch (e) {
                    // If full URL, push it as a custom check or handle logic below
                    // For simplicity, we just add the path if it's on same domain, 
                    // or we should logic to handle full URL in the loop.
                    // The loop checks `${baseUrl}${path}`. 
                    // Let's just use the full URL if we can, but the loop expects paths.
                    // Modifying logic to handle full URLs or paths.
                }
            }
        }
    } catch (e) {
        console.warn(`[Sitemap Sync] Failed to check robots.txt:`, e)
    }

    // Try paths sequentially until we find one with URLs
    for (const pathOrUrl of sitemapPaths) {
        // If it looks like a full URL, use it, otherwise append to base
        const currentUrl = pathOrUrl.startsWith('http') ? pathOrUrl : `${baseUrl}${pathOrUrl}`
        console.log(`[Sitemap Sync] Trying: ${currentUrl}`)

        try {
            const sitemapper = new Sitemapper({
                url: currentUrl,
                timeout: 15000,
                debug: true, // Enable internal debug logs if any
            })

            const { sites, errors } = await sitemapper.fetch()

            if (errors && errors.length > 0) {
                console.warn(`[Sitemap Sync] Errors fetching ${currentUrl}:`, errors)
            }

            if (sites && sites.length > 0) {
                sitemapUrls = Array.from(new Set(sites as string[])) // Deduplicate
                console.log(`[Sitemap Sync] Found ${sitemapUrls.length} URLs at ${currentUrl}`)
                break // Stop if we found a working sitemap
            } else {
                console.log(`[Sitemap Sync] No URLs found at ${currentUrl}`)
            }
        } catch (e: any) {
            console.error(`[Sitemap Sync] Failed to fetch ${currentUrl}:`, e.message || e)
        }
    }

    if (sitemapUrls.length === 0) {
        console.warn(`[Sitemap Sync] FAILED: No URLs found in any sitemap for ${baseUrl}. Checked: ${sitemapPaths.join(', ')}`)
        return { titles: [], syncedCount: 0 }
    }

    // Get existing URLs to avoid duplicates
    const { data: existingRecords } = await (supabase as any)
        .from("internal_links")
        .select("url")
        .eq("user_id", userId)
        .eq("brand_id", brandId)

    const existingUrls = new Set<string>(existingRecords?.map((r: any) => r.url) || [])
    const urlsToAdd = sitemapUrls.filter(url => !existingUrls.has(url))

    console.log(`[Sitemap Sync] ${urlsToAdd.length} new URLs to add`)

    // Extract titles for all URLs (for immediate return to plan generator)
    const allTitles = sitemapUrls.map(url => extractTitleFromUrl(url))

    // Process new URLs in batches
    const BATCH_SIZE = 5
    let syncedCount = 0

    for (let i = 0; i < urlsToAdd.length; i += BATCH_SIZE) {
        const batch = urlsToAdd.slice(i, i + BATCH_SIZE)

        const inserts = await Promise.all(batch.map(async (url) => {
            const title = extractTitleFromUrl(url)

            try {
                const embedding = await generateEmbedding(title)
                return {
                    user_id: userId,
                    brand_id: brandId,
                    url,
                    title,
                    embedding
                }
            } catch (e) {
                console.error(`[Sitemap Sync] Failed embedding for ${url}:`, e)
                // Still save without embedding - can be backfilled later
                return {
                    user_id: userId,
                    brand_id: brandId,
                    url,
                    title,
                    embedding: null
                }
            }
        }))

        const validInserts = inserts.filter(item => item !== null)

        if (validInserts.length > 0) {
            const { error } = await (supabase as any)
                .from("internal_links")
                .insert(validInserts)

            if (error) {
                console.error("[Sitemap Sync] DB Insert error:", error)
            } else {
                syncedCount += validInserts.length
            }
        }
    }

    console.log(`[Sitemap Sync] Synced ${syncedCount} new links`)
    return { titles: allTitles, syncedCount }
}

/**
 * Quick competitor discovery using Tavily search.
 * Searches for "[category] tools" to find real competitor brands.
 */
async function discoverCompetitors(
    brandData: BrandDetails
): Promise<Array<{ name: string; url?: string }>> {
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
        console.warn("[Generate Plan] No Tavily API key, skipping competitor discovery")
        return []
    }

    try {
        const tvly = tavily({ apiKey })
        const category = brandData.category || brandData.product_identity.literally
        const searchQuery = `best ${category} tools software 2024`

        console.log(`[Generate Plan] Discovering competitors for: "${searchQuery}"`)

        const response = await tvly.search(searchQuery, {
            maxResults: 10,
            searchDepth: "basic"
        })

        // Extract unique domains as competitors
        const competitors: Array<{ name: string; url: string }> = []
        const seenDomains = new Set<string>()

        for (const result of response.results || []) {
            try {
                const url = new URL(result.url)
                const domain = url.hostname.replace('www.', '')

                // Skip if already seen or is the brand itself
                if (seenDomains.has(domain)) continue
                if (brandData.product_name.toLowerCase().includes(domain.split('.')[0])) continue

                seenDomains.add(domain)

                // Extract brand name from title or domain
                const brandName = result.title?.split(' - ')[0]?.split(' | ')[0]?.trim() ||
                    domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)

                competitors.push({
                    name: brandName,
                    url: url.origin
                })
            } catch {
                // Invalid URL, skip
            }
        }

        console.log(`[Generate Plan] Found ${competitors.length} competitors`)
        return competitors.slice(0, 8) // Max 8 competitors

    } catch (error) {
        console.error("[Generate Plan] Competitor discovery failed:", error)
        return []
    }
}

/**
 * Background task for generating content plan using Trigger.dev.
 * 
 * REVAMPED FLOW (2 phases instead of 5):
 * 1. Intelligence Phase: Discover competitors if not provided
 * 2. Generation Phase: Use strategic mega-prompt to generate plan
 */
export const generatePlanTask = task({
    id: "generate-content-plan",
    maxDuration: 600, // 10 minutes max
    retry: {
        maxAttempts: 2,
        minTimeoutInMs: 5000,
        maxTimeoutInMs: 30000,
    },
    run: async (payload: GeneratePlanPayload) => {
        const {
            planId,
            userId,
            brandId,
            brandData,
            brandUrl,
            competitorBrands: passedCompetitors,
            existingContent
        } = payload
        const supabase = createAdminClient()

        console.log(`[Generate Plan Task] Starting for plan: ${planId}`)

        const updateStatus = async (status: string, phase?: string, error?: string) => {
            const updates: Record<string, any> = { generation_status: status }
            if (phase !== undefined) updates.generation_phase = phase
            if (error) updates.generation_error = error

            await (supabase as any)
                .from("content_plans")
                .update(updates)
                .eq("id", planId)
        }

        try {
            // === PHASE 0: SITEMAP SYNC (Save internal links + get existing content) ===
            let sitemapTitles: string[] = []
            if (brandUrl) {
                await updateStatus("generating", "sitemap")
                console.log(`[Generate Plan Task] Phase 0: Syncing sitemap...`)

                try {
                    const syncResult = await syncSitemapToInternalLinks(brandUrl, userId, brandId)
                    sitemapTitles = syncResult.titles
                    console.log(`[Generate Plan Task] Sitemap sync: ${syncResult.syncedCount} new links, ${sitemapTitles.length} total titles`)
                } catch (e) {
                    console.warn(`[Generate Plan Task] Sitemap sync failed (non-blocking):`, e)
                }
            }

            // Merge existing content: passed content + sitemap titles (deduplicated)
            const allExistingContent = Array.from(new Set([
                ...(existingContent || []),
                ...sitemapTitles
            ]))
            console.log(`[Generate Plan Task] Total existing content for deduplication: ${allExistingContent.length}`)

            // === PHASE 1: INTELLIGENCE (Competitor Discovery) ===
            await updateStatus("generating", "intelligence")
            console.log(`[Generate Plan Task] Phase 1: Intelligence gathering...`)

            let competitorBrands = passedCompetitors || []

            // Discover competitors if not provided
            if (competitorBrands.length === 0) {
                competitorBrands = await discoverCompetitors(brandData)
            }

            console.log(`[Generate Plan Task] Using ${competitorBrands.length} competitors`)

            // === PHASE 2: STRATEGIC PLAN GENERATION ===
            await updateStatus("generating", "plan")
            console.log(`[Generate Plan Task] Phase 2: Strategic plan generation...`)

            const result = await generateStrategicPlan({
                brandData,
                brandUrl,
                competitorBrands,
                existingContent: allExistingContent
            })

            console.log(`[Generate Plan Task] Plan generated: ${result.plan.length} articles`)
            console.log(`[Generate Plan Task] Content Gap Analysis:`, result.contentGapAnalysis.slice(0, 200) + "...")

            // === SAVE PLAN ===
            const { error: updateError } = await (supabase as any)
                .from("content_plans")
                .update({
                    plan_data: result.plan,
                    competitor_seeds: competitorBrands.map(c => c.name), // Store competitor names as seeds for reference
                    generation_status: "complete",
                    generation_phase: undefined,
                    content_gap_analysis: result.contentGapAnalysis, // Store the analysis if column exists
                    updated_at: new Date().toISOString()
                })
                .eq("id", planId)

            if (updateError) {
                throw new Error(`Failed to save plan: ${updateError.message}`)
            }

            console.log(`[Generate Plan Task] Complete! Plan saved.`)

            return {
                success: true,
                planId,
                articleCount: result.plan.length,
                categoryDistribution: result.categoryDistribution,
                contentGapAnalysis: result.contentGapAnalysis
            }

        } catch (error: any) {
            console.error(`[Generate Plan Task] Error:`, error)
            await updateStatus("failed", undefined, error.message || "Unknown error")
            throw error
        }
    }
})
