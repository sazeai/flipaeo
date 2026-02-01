import { task } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { BrandDetails } from "@/lib/schemas/brand"
import { generateStrategicPlan } from "@/lib/plans/strategic-planner"
import { deduplicateWithReplacementLoop } from "@/lib/plans/plan-deduplication"
import { tavily } from "@tavily/core"
import Sitemapper from "sitemapper"
import { extractTitleFromUrl, generateEmbedding } from "@/lib/internal-linking"
import { getGeminiClient } from "@/utils/gemini/geminiClient"


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
                    // Extract path if it's on the same domain, or handle full URL logic
                    const sitemapUrl = new URL(foundSitemap)
                    // If it's a full URL that's not already in our paths-to-try, add it
                    const relativePath = sitemapUrl.pathname

                    if (!sitemapPaths.includes(relativePath) && !sitemapPaths.includes(foundSitemap)) {
                        // Priority to full URL if it differs from base, but ensure we check it
                        // The loop logic handles full URLs correctly now.
                        sitemapPaths.unshift(foundSitemap)
                    }
                } catch (e) {
                    console.warn(`[Sitemap Sync] Invalid sitemap URL in robots.txt: ${foundSitemap}`)
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

    // --- BLOG CONTENT FILTER (Production-Grade) ---
    // Only store URLs that are likely blog/article content, not product directories or misc pages
    const BLOG_PATH_PATTERNS = [
        '/blog/',
        '/articles/',
        '/article/',
        '/posts/',
        '/post/',
        '/news/',
        '/resources/',
        '/guides/',
        '/guide/',
        '/insights/',
        '/learn/',
        '/tutorials/',
        '/tutorial/',
        '/how-to/',
        '/tips/',
    ]

    const blogUrls = sitemapUrls.filter(url => {
        try {
            const pathname = new URL(url).pathname.toLowerCase()
            // Check if URL path contains any blog pattern
            return BLOG_PATH_PATTERNS.some(pattern => pathname.includes(pattern))
        } catch {
            return false // Invalid URL
        }
    })

    console.log(`[Sitemap Sync] Filtered ${sitemapUrls.length} URLs -> ${blogUrls.length} blog URLs`)

    if (blogUrls.length === 0) {
        console.warn(`[Sitemap Sync] No blog URLs found. Site may use non-standard blog paths.`)
        // Don't fail - just return empty. The site might not have a blog.
        return { titles: [], syncedCount: 0 }
    }

    // Get existing URLs to avoid duplicates
    const { data: existingRecords } = await (supabase as any)
        .from("internal_links")
        .select("url")
        .eq("user_id", userId)
        .eq("brand_id", brandId)

    const existingUrls = new Set<string>(existingRecords?.map((r: any) => r.url) || [])
    const urlsToAdd = blogUrls.filter(url => !existingUrls.has(url))

    console.log(`[Sitemap Sync] ${urlsToAdd.length} new blog URLs to add`)

    // Extract titles for blog URLs only (for immediate return to plan generator)
    const allTitles = blogUrls.map(url => extractTitleFromUrl(url))

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
 * Quick competitor discovery using Tavily search + AI extraction.
 * Searches for "Top [category] software tools competitors" to force listicle results,
 * then uses Gemini Flash to extract real B2B product brands.
 */
async function discoverCompetitors(
    brandData: BrandDetails
): Promise<Array<{ name: string; url?: string }>> {
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
        console.warn("[Competitor Discovery] No Tavily API key, skipping competitor discovery")
        return []
    }

    try {
        const tvly = tavily({ apiKey })

        // 1. SMART QUERY: Force a "Listicle" result which contains many competitors
        const category = brandData.product_identity.literally || brandData.category
        const searchQuery = `Top ${category} software tools competitors and alternatives 2026`

        console.log(`[Competitor Discovery] Searching: "${searchQuery}"`)

        // 2. FETCH CONTEXT: Get the content, not just the URL
        const response = await tvly.search(searchQuery, {
            maxResults: 6,
            searchDepth: "advanced", // worth the extra credit for better snippets
            includeAnswer: true      // Tavily tries to summarize the answer
        })

        // 3. THE AGENT: Feed the noise to the LLM
        const contextText = `
        Tavily Summary: ${response.answer || ''}
        
        Search Results:
        ${response.results.map(r => `- Title: ${r.title}\n  Snippet: ${r.content}\n  URL: ${r.url}`).join('\n')}
        `

        const genAI = getGeminiClient() // Use a cheap model like Flash
        const prompt = `
        I am analyzing the market for "${category}".
        Based on the search results below, extract the top 5 REAL direct competitor BRANDS (software/products).
        
        RULES:
        1. IGNORE review sites (G2, Capterra, Reddit).
        2. IGNORE news/publishers (Forbes, TechCrunch, Search Engine Land).
        3. IGNORE the user's own brand: "${brandData.product_name}".
        4. Return ONLY a valid JSON array of objects: [{"name": "BrandName", "url": "BrandURL"}].
        5. If the URL is a blog post (e.g., hubspot.com/blog/...), strip it to the root domain (hubspot.com).
        
        SEARCH CONTEXT:
        ${contextText}
        `

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING" },
                            url: { type: "STRING" }
                        },
                        required: ["name", "url"]
                    }
                }
            }
        })

        const text = result.text || "[]"
        const competitors = JSON.parse(text) as Array<{ name: string; url: string }>

        console.log(`[Competitor Discovery] AI Extracted:`, competitors.map((c) => c.name))
        return competitors

    } catch (error) {
        console.error("[Competitor Discovery] AI Extraction Failed:", error)
        // Fallback to empty
        return []
    }
}

/**
 * Background task for generating content plan using Trigger.dev.
 * 
 * REVAMPED FLOW (3 phases):
 * 1. Intelligence Phase: Discover competitors if not provided
 * 2. Generation Phase: Use strategic mega-prompt to generate plan
 * 3. Deduplication Phase: Filter out topics too similar to existing content
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

            // Check for cached competitors in brand_details first
            if (competitorBrands.length === 0 && brandId) {
                const { data: brandRecord } = await (supabase as any)
                    .from("brand_details")
                    .select("discovered_competitors")
                    .eq("id", brandId)
                    .single()

                if (brandRecord?.discovered_competitors?.length > 0) {
                    competitorBrands = brandRecord.discovered_competitors
                    console.log(`[Generate Plan Task] Using ${competitorBrands.length} cached competitors`)
                }
            }

            // Discover competitors if not cached and not provided
            if (competitorBrands.length === 0) {
                competitorBrands = await discoverCompetitors(brandData)

                // Cache discovered competitors for future use (non-blocking)
                if (brandId && competitorBrands.length > 0) {
                    (supabase as any)
                        .from("brand_details")
                        .update({ discovered_competitors: competitorBrands })
                        .eq("id", brandId)
                        .then(() => console.log(`[Generate Plan Task] Cached ${competitorBrands.length} competitors to DB`))
                        .catch((e: any) => console.warn(`[Generate Plan Task] Failed to cache competitors:`, e))
                }
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

            // === PHASE 3: SEMANTIC DEDUPLICATION WITH REPLACEMENT LOOP ===
            await updateStatus("generating", "deduplication")
            console.log(`[Generate Plan Task] Phase 3: Deduplication with replacement loop...`)

            const {
                finalPlan: filteredPlan,
                totalRejected,
                replacementsGenerated,
                attempts
            } = await deduplicateWithReplacementLoop(
                result.plan,
                userId,
                brandData,
                {
                    brandId,
                    targetCount: 30, // Always aim for exactly 30 articles
                    maxAttempts: 3
                }
            )

            // Detailed logging for Trigger.dev dashboard
            console.log(`[Generate Plan Task] Deduplication Loop Results:`)
            console.log(`  - Original articles: ${result.plan.length}`)
            console.log(`  - Final article count: ${filteredPlan.length}`)
            console.log(`  - Total rejected: ${totalRejected}`)
            console.log(`  - Replacements generated: ${replacementsGenerated}`)
            console.log(`  - Attempts taken: ${attempts}`)

            // === SAVE PLAN ===
            const { error: updateError } = await (supabase as any)
                .from("content_plans")
                .update({
                    plan_data: filteredPlan,
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
                articleCount: filteredPlan.length,
                originalCount: result.plan.length,
                removedCount: totalRejected,
                replacementsGenerated,
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
