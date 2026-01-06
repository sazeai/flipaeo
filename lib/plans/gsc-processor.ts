/**
 * GSC Processor
 * Shared logic for filtering, scoring, and clustering GSC search data.
 */

export interface GSCQueryRow {
    keys: string[]
    clicks: number
    impressions: number
    ctr: number
    position: number
}

export interface ProcessedQuery {
    query: string
    impressions: number
    clicks: number
    ctr: number
    position: number
    intent: "informational" | "commercial" | "howto"
    opportunity_score: number
    word_count: number
    expected_ctr: number
    top_url?: string
    is_cannibalization_risk: boolean
}

export interface KeywordCluster {
    primary_keyword: string
    supporting_keywords: string[]
    intent: "informational" | "commercial" | "howto"
    opportunity_score: number
    impressions: number
    position: number
    ctr: number
    expected_ctr: number
    category: "quick_win" | "high_potential" | "strategic" | "new_opportunity" | "supporting_intent"
    top_url?: string
}

// Expected CTR curve (industry standard)
const EXPECTED_CTR: Record<number, number> = {
    1: 0.30, 2: 0.20, 3: 0.12, 4: 0.08, 5: 0.06,
    6: 0.04, 7: 0.03, 8: 0.03, 9: 0.03, 10: 0.03,
}

function getExpectedCTR(position: number): number {
    if (position <= 10) return EXPECTED_CTR[Math.round(position)] || 0.03
    if (position <= 20) return 0.01
    return 0.005
}

/**
 * Filter out brand queries and low-value junk
 */
export function filterGarbageQueries(queries: GSCQueryRow[], brandName?: string): GSCQueryRow[] {
    return queries.filter(q => {
        if (!q.keys?.[0]) return false
        const query = q.keys[0].toLowerCase()
        const wordCount = query.split(/\s+/).length

        if (brandName && query.includes(brandName.toLowerCase())) return false
        if (q.impressions < 20) return false
        if (q.position > 50) return false
        if (q.ctr < 0.001 && q.position > 25) return false
        if (wordCount < 2) return false

        return true
    })
}

/**
 * Categorize intent based on keywords
 */
export function tagIntent(query: string): "informational" | "commercial" | "howto" {
    const q = query.toLowerCase()
    if (q.includes("how") || q.includes("tutorial") || q.includes("step") ||
        q.includes("guide") || q.includes("setup") || q.includes("create") ||
        q.includes("make") || q.includes("build")) return "howto"

    if (q.includes("best") || q.includes("top") || q.includes("vs") ||
        q.includes("review") || q.includes("alternative") || q.includes("pricing") ||
        q.includes("compare") || q.includes("software") || q.includes("app")) return "commercial"

    return "informational"
}

/**
 * Calculate the strategic opportunity of a keyword
 */
export function computeOpportunityScore(
    impressions: number,
    position: number,
    ctr: number,
    wordCount: number,
    maxImpressions: number
): number {
    const impressionsNormalized = maxImpressions > 0 ? impressions / maxImpressions : 0
    const positionInverse = Math.max(0, (50 - position) / 50)
    const expectedCtr = getExpectedCTR(position)
    const ctrGap = Math.max(0, expectedCtr - ctr)

    let queryDepthScore = 0.3
    if (wordCount >= 3) queryDepthScore = 0.5
    if (wordCount >= 4) queryDepthScore = 0.7
    if (wordCount >= 5) queryDepthScore = 1.0

    const score = (
        (impressionsNormalized * 0.4) +
        (positionInverse * 0.3) +
        (ctrGap * 0.2) +
        (queryDepthScore * 0.1)
    )

    return Math.round(score * 100)
}

function calculateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/))
    const wordsB = new Set(b.toLowerCase().split(/\s+/))
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)))
    const union = new Set([...wordsA, ...wordsB])
    return intersection.size / union.size
}

/**
 * Cluster similar queries to prevent topic cannibalization
 */
export function clusterQueries(queries: ProcessedQuery[], maxImpressions: number): KeywordCluster[] {
    const clusters: KeywordCluster[] = []
    const used = new Set<string>()

    const sorted = [...queries].sort((a, b) => b.opportunity_score - a.opportunity_score)
    const highImpressionsThreshold = maxImpressions * 0.1
    const mediumImpressionsThreshold = maxImpressions * 0.05

    for (const query of sorted) {
        if (used.has(query.query)) continue

        const similar = sorted.filter(q =>
            !used.has(q.query) &&
            q.query !== query.query &&
            calculateSimilarity(query.query, q.query) > 0.4
        )

        used.add(query.query)
        similar.forEach(s => used.add(s.query))

        let category: KeywordCluster["category"] = "new_opportunity"
        const isLowCTR = query.ctr < query.expected_ctr * 0.5
        const hasHighImpressions = query.impressions >= mediumImpressionsThreshold

        if (query.position >= 5 && query.position <= 20 && hasHighImpressions && isLowCTR) {
            category = "quick_win"
        } else if (query.impressions >= highImpressionsThreshold && query.position > 20 && query.position <= 40) {
            category = "high_potential"
        } else if (query.opportunity_score >= 50 && query.impressions >= mediumImpressionsThreshold) {
            category = "strategic"
        }

        // RECONCILIATION: If we have a URL but it wasn't excluded (so it's weak/leak), treat as supporting
        if (query.top_url && category !== "quick_win") {
            category = "supporting_intent"
        }

        clusters.push({
            primary_keyword: query.query,
            supporting_keywords: similar.map(s => s.query),
            intent: query.intent,
            opportunity_score: query.opportunity_score,
            impressions: query.impressions,
            position: query.position,
            ctr: query.ctr,
            expected_ctr: query.expected_ctr,
            category,
            top_url: query.top_url
        })
    }

    return clusters
}

export function processGSCData(rawRows: GSCQueryRow[], brandName?: string, existingUrls: string[] = []): KeywordCluster[] {
    if (!rawRows || rawRows.length === 0) return []

    // 1. Group by Query to find Top URL for each query
    // Since we now fetch dimensions: ['query', 'page'], we get multiple rows per query
    const queryGroups = new Map<string, {
        impressions: number,
        clicks: number,
        ctr: number,
        position: number,
        urls: Map<string, { clicks: number, impressions: number }>,
        keys: string[]
    }>()

    rawRows.forEach(row => {
        const query = row.keys[0]
        const url = row.keys[1] // URL is now second key

        if (!queryGroups.has(query)) {
            queryGroups.set(query, {
                impressions: 0,
                clicks: 0,
                ctr: 0, // Weighted average later
                position: 0, // Weighted average later
                urls: new Map(),
                keys: row.keys
            })
        }

        const group = queryGroups.get(query)!
        group.impressions += row.impressions
        group.clicks += row.clicks

        // Track per-URL stats to find dominant page
        if (url) {
            if (!group.urls.has(url)) group.urls.set(url, { clicks: 0, impressions: 0 })
            const urlStats = group.urls.get(url)!
            urlStats.clicks += row.clicks
            urlStats.impressions += row.impressions
        }

        // Weighted sum for position (approximate)
        group.position = (group.position * (group.impressions - row.impressions) + row.position * row.impressions) / group.impressions
    })

    // Flatten groups back to "rows" for filtering
    const consolidatedRows: GSCQueryRow[] = Array.from(queryGroups.values()).map(g => ({
        keys: g.keys, // Note: this keeps JUST the first URL found in keys, but we use the Map for logic
        clicks: g.clicks,
        impressions: g.impressions,
        ctr: g.impressions > 0 ? g.clicks / g.impressions : 0,
        position: g.position
    }))

    const filtered = filterGarbageQueries(consolidatedRows, brandName)
    if (filtered.length === 0) return []

    const maxImpressions = Math.max(...filtered.map(q => q.impressions))

    const processed: ProcessedQuery[] = filtered.map(q => {
        const query = q.keys[0]
        const wordCount = query.split(/\s+/).length

        // Identify dominant URL
        const group = queryGroups.get(query)
        let topUrl = ""
        let maxUrlClicks = -1

        if (group) {
            group.urls.forEach((stats, url) => {
                if (stats.clicks > maxUrlClicks) {
                    maxUrlClicks = stats.clicks
                    topUrl = url
                } else if (stats.clicks === maxUrlClicks && stats.impressions > (group.urls.get(topUrl)?.impressions || 0)) {
                    topUrl = url // Break ties with impressions
                }
            })
        }

        const expectedCtr = getExpectedCTR(q.position)

        // --- QUERY-TO-URL RECONCILIATION LOGIC ---
        let isCannibalizationRisk = false

        // Check if Top URL is a content page (not homepage/root)
        const isContentPage = topUrl && topUrl.length > 15 && (
            topUrl.includes('/blog') ||
            topUrl.includes('/article') ||
            topUrl.includes('/post') ||
            // Heuristic: URL slug matches query words
            query.split(' ').filter(w => w.length > 3 && topUrl.includes(w)).length >= 2
        )

        // Also check if explicitly in known existing content URLs
        const isKnownContent = existingUrls.some(existing => existing.includes(topUrl) || topUrl.includes(existing))

        if ((isContentPage || isKnownContent) && q.impressions > 50 && q.position < 20) {
            // CONDITION 1: Strong page exists -> Mark as risk (EXCLUDE later)
            isCannibalizationRisk = true
        }

        // Exception: If CTR is terrible (Intent Leak), we might want a Supporting Article
        // But if it's purely a duplicate intent, we still flag risk.
        // The clusterer will decide if it becomes "Supporting" or "Excluded" based on this flag.

        return {
            query,
            impressions: q.impressions,
            clicks: q.clicks,
            ctr: q.ctr,
            position: q.position,
            intent: tagIntent(query),
            word_count: wordCount,
            expected_ctr: expectedCtr,
            opportunity_score: computeOpportunityScore(q.impressions, q.position, q.ctr, wordCount, maxImpressions),
            top_url: topUrl,
            is_cannibalization_risk: isCannibalizationRisk
        }
    })

    // Filter out simple cannibalization risks immediately
    const reconciled = processed.filter(p => !p.is_cannibalization_risk)

    return clusterQueries(reconciled, maxImpressions)
}
