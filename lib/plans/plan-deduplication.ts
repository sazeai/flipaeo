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

    console.log(`\n${'='.repeat(80)}`)
    console.log(`[Deduplication] 🚀 STARTING BOUNCER CHECK`)
    console.log(`${'='.repeat(80)}`)
    console.log(`[Deduplication] Input: ${plan.length} plan items`)
    console.log(`[Deduplication] User ID: ${userId}`)
    console.log(`[Deduplication] Brand ID: ${brandId || 'NONE'}`)
    console.log(`[Deduplication] Similarity Threshold: ${SIMILARITY_THRESHOLD} (${SIMILARITY_THRESHOLD * 100}%)`)
    console.log(`${'='.repeat(80)}\n`)

    for (let i = 0; i < plan.length; i++) {
        const item = plan[i]
        const itemLabel = `[${i + 1}/${plan.length}]`

        console.log(`\n${'─'.repeat(60)}`)
        console.log(`[Deduplication] ${itemLabel} Processing: "${item.main_keyword}"`)
        console.log(`[Deduplication] ${itemLabel} Title: "${item.title}"`)
        console.log(`[Deduplication] ${itemLabel} Phase: ${item.phase}, Category: ${item.article_category}`)

        // Create embedding text from title + main keyword for semantic matching
        const embeddingText = `${item.title} ${item.main_keyword}`
        console.log(`[Deduplication] ${itemLabel} Embedding text: "${embeddingText}"`)

        let embedding: number[]
        try {
            console.log(`[Deduplication] ${itemLabel} Generating embedding...`)
            embedding = await generateEmbedding(embeddingText)
            console.log(`[Deduplication] ${itemLabel} ✅ Embedding generated (${embedding.length} dimensions)`)
            console.log(`[Deduplication] ${itemLabel} Embedding preview: [${embedding.slice(0, 5).map(n => n.toFixed(4)).join(', ')}...]`)
        } catch (error) {
            console.error(`[Deduplication] ${itemLabel} ❌ FAILED to get embedding:`, error)
            console.log(`[Deduplication] ${itemLabel} ⚠️ Keeping item (fail open policy)`)
            filteredPlan.push(item)
            continue
        }

        // Check 1: Compare against sitemap/internal links
        console.log(`[Deduplication] ${itemLabel} 🔍 Check 1: Sitemap/Internal Links...`)
        const sitemapMatch = await checkAgainstSitemap(supabase, embedding, userId, itemLabel)
        if (sitemapMatch) {
            console.log(`[Deduplication] ${itemLabel} 🚫 REJECTED by sitemap match!`)
            console.log(`[Deduplication] ${itemLabel}    Similar to: "${sitemapMatch.title}"`)
            console.log(`[Deduplication] ${itemLabel}    Similarity: ${(sitemapMatch.similarity * 100).toFixed(2)}%`)
            removedItems.push({
                item,
                reason: `Too similar to existing sitemap page`,
                similarTo: sitemapMatch.title,
                similarity: sitemapMatch.similarity
            })
            removedBySitemap++
            continue
        }
        console.log(`[Deduplication] ${itemLabel} ✅ Passed sitemap check`)

        // Check 2: Compare against existing articles
        console.log(`[Deduplication] ${itemLabel} 🔍 Check 2: Existing Articles...`)
        const articleMatch = await checkAgainstArticles(supabase, embedding, userId, brandId, itemLabel)
        if (articleMatch) {
            console.log(`[Deduplication] ${itemLabel} 🚫 REJECTED by article match!`)
            console.log(`[Deduplication] ${itemLabel}    Similar to: "${articleMatch.keyword}"`)
            console.log(`[Deduplication] ${itemLabel}    Similarity: ${(articleMatch.similarity * 100).toFixed(2)}%`)
            removedItems.push({
                item,
                reason: `Too similar to existing article`,
                similarTo: articleMatch.keyword,
                similarity: articleMatch.similarity
            })
            removedByArticles++
            continue
        }
        console.log(`[Deduplication] ${itemLabel} ✅ Passed article check`)

        // No duplicates found, keep this item
        console.log(`[Deduplication] ${itemLabel} ✅ PASSED ALL CHECKS - Keeping item`)
        filteredPlan.push(item)
    }

    const stats = {
        originalCount: plan.length,
        filteredCount: filteredPlan.length,
        removedBySitemap,
        removedByArticles
    }

    console.log(`\n${'='.repeat(80)}`)
    console.log(`[Deduplication] 🏁 BOUNCER CHECK COMPLETE`)
    console.log(`${'='.repeat(80)}`)
    console.log(`[Deduplication] 📊 FINAL STATS:`)
    console.log(`[Deduplication]    Original items:     ${stats.originalCount}`)
    console.log(`[Deduplication]    Kept items:         ${stats.filteredCount}`)
    console.log(`[Deduplication]    Removed by sitemap: ${removedBySitemap}`)
    console.log(`[Deduplication]    Removed by articles: ${removedByArticles}`)
    console.log(`[Deduplication]    Total removed:      ${removedBySitemap + removedByArticles}`)

    if (removedItems.length > 0) {
        console.log(`\n[Deduplication] 📋 REJECTED ITEMS SUMMARY:`)
        removedItems.forEach((r, idx) => {
            console.log(`[Deduplication]    ${idx + 1}. "${r.item.main_keyword}" → ${r.reason}`)
            console.log(`[Deduplication]       Similar to: "${r.similarTo}" (${(r.similarity * 100).toFixed(2)}%)`)
        })
    }
    console.log(`${'='.repeat(80)}\n`)

    return { filteredPlan, removedItems, stats }
}

/**
 * Check if an embedding matches any existing sitemap pages
 */
async function checkAgainstSitemap(
    supabase: Awaited<ReturnType<typeof createClient>>,
    embedding: number[],
    userId: string,
    itemLabel: string
): Promise<{ title: string; similarity: number } | null> {
    try {
        console.log(`[Deduplication] ${itemLabel}    RPC: match_internal_links`)
        console.log(`[Deduplication] ${itemLabel}    Params: threshold=${SIMILARITY_THRESHOLD}, count=1, user_id=${userId}`)

        const { data, error } = await supabase.rpc('match_internal_links', {
            query_embedding: embedding,
            match_threshold: SIMILARITY_THRESHOLD,
            match_count: 1,
            p_user_id: userId
        })

        if (error) {
            console.error(`[Deduplication] ${itemLabel}    ❌ RPC ERROR:`, error.message)
            console.error(`[Deduplication] ${itemLabel}    Error details:`, JSON.stringify(error))
            return null
        }

        console.log(`[Deduplication] ${itemLabel}    RPC returned: ${data?.length || 0} matches`)
        if (data && data.length > 0) {
            console.log(`[Deduplication] ${itemLabel}    Top match: "${data[0].title}" (${(data[0].similarity * 100).toFixed(2)}%)`)
            return {
                title: data[0].title,
                similarity: data[0].similarity
            }
        }

        console.log(`[Deduplication] ${itemLabel}    No matches above threshold`)
        return null
    } catch (error) {
        console.error(`[Deduplication] ${itemLabel}    ❌ EXCEPTION:`, error)
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
    brandId: string | undefined,
    itemLabel: string
): Promise<{ keyword: string; similarity: number } | null> {
    try {
        console.log(`[Deduplication] ${itemLabel}    RPC: match_articles`)
        console.log(`[Deduplication] ${itemLabel}    Params: threshold=${SIMILARITY_THRESHOLD}, count=1, user_id=${userId}, brand_id=${brandId || 'NULL'}`)

        const { data, error } = await supabase.rpc('match_articles', {
            query_embedding: embedding,
            match_threshold: SIMILARITY_THRESHOLD,
            match_count: 1,
            p_user_id: userId,
            p_brand_id: brandId || null
        })

        if (error) {
            console.warn(`[Deduplication] ${itemLabel}    ⚠️ RPC ERROR (may not exist):`, error.message)
            console.warn(`[Deduplication] ${itemLabel}    Error code: ${error.code}`)
            console.warn(`[Deduplication] ${itemLabel}    Error details:`, JSON.stringify(error))
            return null
        }

        console.log(`[Deduplication] ${itemLabel}    RPC returned: ${data?.length || 0} matches`)

        // Log raw RPC response for debugging
        if (data && data.length > 0) {
            console.log(`[Deduplication] ${itemLabel}    Raw response:`, JSON.stringify(data[0]))
            console.log(`[Deduplication] ${itemLabel}    Top match: "${data[0].keyword}" (${(data[0].similarity * 100).toFixed(2)}%)`)
            return {
                keyword: data[0].keyword,
                similarity: data[0].similarity
            }
        }

        console.log(`[Deduplication] ${itemLabel}    No matches above threshold (${SIMILARITY_THRESHOLD * 100}%)`)

        // DEBUG: Also query to see what articles exist for this user/brand
        console.log(`[Deduplication] ${itemLabel}    🔬 DEBUG: Checking what articles exist...`)
        try {
            let query = supabase
                .from('articles')
                .select('id, keyword, topic_embedding')
                .eq('user_id', userId)

            if (brandId) {
                query = query.eq('brand_id', brandId)
            }

            const { data: articles, error: listError } = await query.limit(10)

            if (listError) {
                console.log(`[Deduplication] ${itemLabel}    DEBUG query error:`, listError.message)
            } else {
                console.log(`[Deduplication] ${itemLabel}    DEBUG: Found ${articles?.length || 0} articles (showing up to 10)`)
                articles?.forEach((a, idx) => {
                    const hasEmbedding = a.topic_embedding !== null
                    console.log(`[Deduplication] ${itemLabel}       ${idx + 1}. "${a.keyword}" - embedding: ${hasEmbedding ? '✅ YES' : '❌ NO'}`)
                })
            }
        } catch (debugError) {
            console.log(`[Deduplication] ${itemLabel}    DEBUG query exception:`, debugError)
        }

        return null
    } catch (error) {
        console.error(`[Deduplication] ${itemLabel}    ❌ EXCEPTION:`, error)
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

    console.log(`\n${'#'.repeat(80)}`)
    console.log(`[Replacement Loop] 🔄 STARTING REPLACEMENT LOOP`)
    console.log(`${'#'.repeat(80)}`)
    console.log(`[Replacement Loop] Initial items: ${currentPlan.length}`)
    console.log(`[Replacement Loop] Target count: ${targetCount}`)
    console.log(`[Replacement Loop] Max attempts: ${maxAttempts}`)
    console.log(`[Replacement Loop] Brand ID: ${options.brandId || 'NONE'}`)
    console.log(`${'#'.repeat(80)}\n`)

    // CRITICAL: Use do-while to ALWAYS run deduplication at least once
    // Previously used while loop which skipped entirely when starting with target count
    do {
        attempt++
        console.log(`\n${'*'.repeat(60)}`)
        console.log(`[Replacement Loop] 🔁 ATTEMPT ${attempt}/${maxAttempts}`)
        console.log(`[Replacement Loop] Current plan size: ${currentPlan.length}`)
        console.log(`${'*'.repeat(60)}\n`)

        // Deduplicate current plan
        const { filteredPlan, removedItems, stats } = await deduplicateContentPlan(
            currentPlan,
            userId,
            options.brandId
        )

        // If nothing was removed, we're done with deduplication
        if (removedItems.length === 0) {
            console.log(`[Replacement Loop] ✅ No duplicates found this round`)
            console.log(`[Replacement Loop] Keeping all ${filteredPlan.length} items`)
            currentPlan = filteredPlan
            break
        }

        totalRejected += removedItems.length
        console.log(`[Replacement Loop] 🚫 ${removedItems.length} items rejected this round`)

        // Track rejected keywords to prevent re-suggesting them
        allRejectedKeywords.push(...removedItems.map(r => r.item.main_keyword))
        console.log(`[Replacement Loop] Total rejected keywords so far: ${allRejectedKeywords.length}`)
        console.log(`[Replacement Loop] Rejected keywords:`, allRejectedKeywords)

        const needed = targetCount - filteredPlan.length
        console.log(`[Replacement Loop] Need ${needed} replacements to reach target ${targetCount}`)

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

        console.log(`[Replacement Loop] Sending ${rejectedForLLM.length} rejected items to LLM`)
        console.log(`[Replacement Loop] Existing keywords to avoid: ${existingPlanKeywords.length}`)

        // Generate replacements
        try {
            console.log(`[Replacement Loop] 🤖 Calling generateReplacementArticles...`)
            const replacements = await generateReplacementArticles({
                brandData,
                rejectedItems: rejectedForLLM,
                existingPlanKeywords
            })

            replacementsGenerated += replacements.length
            console.log(`[Replacement Loop] ✅ Generated ${replacements.length} replacement articles`)
            replacements.forEach((r, idx) => {
                console.log(`[Replacement Loop]    ${idx + 1}. "${r.main_keyword}" - ${r.title}`)
            })

            // Combine verified items with new replacements for next iteration
            currentPlan = [...filteredPlan, ...replacements]
            console.log(`[Replacement Loop] New plan size: ${currentPlan.length}`)

        } catch (error) {
            console.error(`[Replacement Loop] ❌ Replacement generation FAILED:`, error)
            // If replacement generation fails, just use what we have
            currentPlan = filteredPlan
            break
        }
    } while (currentPlan.length < targetCount && attempt < maxAttempts)

    // Final safety check - ensure we don't exceed target
    if (currentPlan.length > targetCount) {
        console.log(`[Replacement Loop] ⚠️ Trimming plan from ${currentPlan.length} to ${targetCount}`)
        currentPlan = currentPlan.slice(0, targetCount)
    }

    console.log(`\n${'#'.repeat(80)}`)
    console.log(`[Replacement Loop] 🏁 REPLACEMENT LOOP COMPLETE`)
    console.log(`${'#'.repeat(80)}`)
    console.log(`[Replacement Loop] 📊 FINAL STATS:`)
    console.log(`[Replacement Loop]    Final count: ${currentPlan.length}/${targetCount}`)
    console.log(`[Replacement Loop]    Total rejected: ${totalRejected}`)
    console.log(`[Replacement Loop]    Replacements generated: ${replacementsGenerated}`)
    console.log(`[Replacement Loop]    Attempts used: ${attempt}`)
    console.log(`${'#'.repeat(80)}\n`)

    return {
        finalPlan: currentPlan,
        totalRejected,
        replacementsGenerated,
        attempts: attempt
    }
}
