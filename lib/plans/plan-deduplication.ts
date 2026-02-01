import { createClient } from "@/utils/supabase/server"
import { ContentPlanItem } from "@/lib/schemas/content-plan"
import { generateEmbedding } from "@/lib/internal-linking"

/**
 * Semantic Deduplication "Bouncer" for Content Plans
 * 
 * Filters out generated content plan items that are semantically too similar to:
 * 1. Existing sitemap pages (internal_links table)
 * 2. Previously written articles (articles table)
 * 
 * This prevents the AI from suggesting topics that already have coverage.
 */

export interface DeduplicationResult {
    filteredPlan: ContentPlanItem[]
    removedItems: Array<{
        item: ContentPlanItem
        reason: string
        similarTo: string
        similarity: number
    }>
    stats: {
        originalCount: number
        filteredCount: number
        removedBySitemap: number
        removedByArticles: number
    }
}

const SIMILARITY_THRESHOLD = 0.85 // More aggressive than 0.90 used elsewhere

/**
 * Deduplicate a content plan against existing content
 */
export async function deduplicateContentPlan(
    plan: ContentPlanItem[],
    userId: string,
    brandId?: string
): Promise<DeduplicationResult> {
    const supabase = await createClient()

    const removedItems: DeduplicationResult['removedItems'] = []
    const filteredPlan: ContentPlanItem[] = []

    let removedBySitemap = 0
    let removedByArticles = 0

    console.log(`[Deduplication] Starting bouncer check for ${plan.length} plan items...`)

    for (const item of plan) {
        // Create embedding text from title + main keyword for semantic matching
        const embeddingText = `${item.title} ${item.main_keyword}`

        let embedding: number[]
        try {
            embedding = await generateEmbedding(embeddingText)
        } catch (error) {
            console.error(`[Deduplication] Failed to get embedding for "${item.title}":`, error)
            // If embedding fails, keep the item (fail open)
            filteredPlan.push(item)
            continue
        }

        // Check 1: Compare against sitemap/internal links
        const sitemapMatch = await checkAgainstSitemap(supabase, embedding, userId)
        if (sitemapMatch) {
            removedItems.push({
                item,
                reason: `Too similar to existing sitemap page`,
                similarTo: sitemapMatch.title,
                similarity: sitemapMatch.similarity
            })
            removedBySitemap++
            continue
        }

        // Check 2: Compare against existing articles
        const articleMatch = await checkAgainstArticles(supabase, embedding, userId, brandId)
        if (articleMatch) {
            removedItems.push({
                item,
                reason: `Too similar to existing article`,
                similarTo: articleMatch.keyword,
                similarity: articleMatch.similarity
            })
            removedByArticles++
            continue
        }

        // No duplicates found, keep this item
        filteredPlan.push(item)
    }

    const stats = {
        originalCount: plan.length,
        filteredCount: filteredPlan.length,
        removedBySitemap,
        removedByArticles
    }

    console.log(`[Deduplication] Complete. Kept ${stats.filteredCount}/${stats.originalCount} items`)
    console.log(`[Deduplication] Removed: ${removedBySitemap} sitemap matches, ${removedByArticles} article matches`)

    return { filteredPlan, removedItems, stats }
}

/**
 * Check if an embedding matches any existing sitemap pages
 */
async function checkAgainstSitemap(
    supabase: Awaited<ReturnType<typeof createClient>>,
    embedding: number[],
    userId: string
): Promise<{ title: string; similarity: number } | null> {
    try {
        const { data, error } = await supabase.rpc('match_internal_links', {
            query_embedding: embedding,
            match_threshold: SIMILARITY_THRESHOLD,
            match_count: 1,
            p_user_id: userId
        })

        if (error) {
            console.error('[Deduplication] Sitemap check error:', error)
            return null
        }

        if (data && data.length > 0) {
            return {
                title: data[0].title,
                similarity: data[0].similarity
            }
        }

        return null
    } catch (error) {
        console.error('[Deduplication] Sitemap check exception:', error)
        return null
    }
}

/**
 * Check if an embedding matches any existing articles
 */
async function checkAgainstArticles(
    supabase: Awaited<ReturnType<typeof createClient>>,
    embedding: number[],
    userId: string,
    brandId?: string
): Promise<{ keyword: string; similarity: number } | null> {
    try {
        const { data, error } = await supabase.rpc('match_articles', {
            query_embedding: embedding,
            match_threshold: SIMILARITY_THRESHOLD,
            match_count: 1,
            p_user_id: userId,
            p_brand_id: brandId || null
        })

        if (error) {
            // RPC might not exist yet - log and continue
            console.warn('[Deduplication] Article check error (RPC may not exist yet):', error.message)
            return null
        }

        if (data && data.length > 0) {
            return {
                keyword: data[0].keyword,
                similarity: data[0].similarity
            }
        }

        return null
    } catch (error) {
        console.error('[Deduplication] Article check exception:', error)
        return null
    }
}

/**
 * Full deduplication with replacement loop.
 * Ensures we always hit the target count (default 30) by generating replacements.
 */
export async function deduplicateWithReplacementLoop(
    plan: ContentPlanItem[],
    userId: string,
    brandData: import("@/lib/schemas/brand").BrandDetails,
    options: {
        brandId?: string
        targetCount?: number
        maxAttempts?: number
    } = {}
): Promise<{
    finalPlan: ContentPlanItem[]
    totalRejected: number
    replacementsGenerated: number
    attempts: number
}> {
    const { generateReplacementArticles } = await import("@/lib/plans/strategic-planner")

    const targetCount = options.targetCount ?? 30
    const maxAttempts = options.maxAttempts ?? 3 // Prevent infinite loops

    let currentPlan = [...plan]
    let allRejectedKeywords: string[] = [] // Track all rejected topics across attempts
    let totalRejected = 0
    let replacementsGenerated = 0
    let attempt = 0

    console.log(`[Replacement Loop] Starting with ${currentPlan.length} items, target is ${targetCount}`)

    while (currentPlan.length < targetCount && attempt < maxAttempts) {
        attempt++
        console.log(`[Replacement Loop] Attempt ${attempt}/${maxAttempts}...`)

        // Deduplicate current plan
        const { filteredPlan, removedItems, stats } = await deduplicateContentPlan(
            currentPlan,
            userId,
            options.brandId
        )

        // If nothing was removed, we're done
        if (removedItems.length === 0) {
            console.log(`[Replacement Loop] No duplicates found, keeping ${filteredPlan.length} items`)
            currentPlan = filteredPlan
            break
        }

        totalRejected += removedItems.length

        // Track rejected keywords to prevent re-suggesting them
        allRejectedKeywords.push(...removedItems.map(r => r.item.main_keyword))

        console.log(`[Replacement Loop] ${removedItems.length} items rejected. Need ${targetCount - filteredPlan.length} replacements.`)

        // Build rejected items info for LLM
        const rejectedForLLM = removedItems.map(r => ({
            rejected_keyword: r.item.main_keyword,
            rejected_title: r.item.title,
            reason: `${r.reason}: "${r.similarTo}" (${(r.similarity * 100).toFixed(1)}% similar)`,
            phase: r.item.phase,
            category: r.item.article_category,
            cluster: r.item.cluster
        }))

        // Get keywords from verified plan so LLM doesn't duplicate them
        const existingPlanKeywords = [
            ...filteredPlan.map(p => p.main_keyword),
            ...allRejectedKeywords // Also include all previously rejected keywords
        ]

        // Generate replacements
        try {
            const replacements = await generateReplacementArticles({
                brandData,
                rejectedItems: rejectedForLLM,
                existingPlanKeywords
            })

            replacementsGenerated += replacements.length
            console.log(`[Replacement Loop] Generated ${replacements.length} replacement articles`)

            // Combine verified items with new replacements for next iteration
            currentPlan = [...filteredPlan, ...replacements]

        } catch (error) {
            console.error(`[Replacement Loop] Replacement generation failed:`, error)
            // If replacement generation fails, just use what we have
            currentPlan = filteredPlan
            break
        }
    }

    // Final safety check - ensure we don't exceed target
    if (currentPlan.length > targetCount) {
        console.log(`[Replacement Loop] Trimming plan from ${currentPlan.length} to ${targetCount}`)
        currentPlan = currentPlan.slice(0, targetCount)
    }

    console.log(`[Replacement Loop] Complete. Final count: ${currentPlan.length}/${targetCount}`)
    console.log(`[Replacement Loop] Stats: ${totalRejected} rejected, ${replacementsGenerated} replacements generated, ${attempt} attempts`)

    return {
        finalPlan: currentPlan,
        totalRejected,
        replacementsGenerated,
        attempts: attempt
    }
}
