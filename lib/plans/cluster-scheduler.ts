/**
 * Cluster-aware scheduling for topical authority.
 * Groups articles by cluster and assigns consecutive dates.
 */

export interface SchedulableArticle {
    id: string
    title: string
    main_keyword: string
    supporting_keywords: string[]
    article_type: "informational" | "commercial" | "howto"
    cluster: string
    intent_role?: string
    article_category?: string
    [key: string]: any
}

export interface ScheduledArticle extends SchedulableArticle {
    scheduled_date: string
    status: "pending" | "writing" | "published" | "skipped"
}

/**
 * Groups articles by cluster and assigns consecutive dates.
 * This creates "topical authority blocks" - all articles about one topic
 * are published consecutively before moving to the next topic.
 */
export function scheduleByCluster(
    articles: SchedulableArticle[],
    startDate: Date
): ScheduledArticle[] {
    if (articles.length === 0) return []

    // Step 1: Group articles by cluster
    const clusterGroups = groupByCluster(articles)

    // Step 2: Sort clusters by priority
    // Priority: Conversion > Core Answers > Supporting > Authority
    // Also by size (larger clusters first for deeper authority)
    const sortedClusters = sortClustersByPriority(clusterGroups)

    // Step 3: Within each cluster, sort by intent
    // Core Answer first, then How-To, then Comparison, then Edge cases
    const sortedWithinClusters = sortWithinClusters(sortedClusters)

    // Step 4: Flatten and assign consecutive dates
    const scheduled: ScheduledArticle[] = []
    let dayOffset = 0

    for (const [cluster, clusterArticles] of sortedWithinClusters) {
        for (const article of clusterArticles) {
            const date = new Date(startDate)
            date.setDate(date.getDate() + dayOffset)

            scheduled.push({
                ...article,
                scheduled_date: date.toISOString().split('T')[0],
                status: "pending" as const
            })

            dayOffset++
        }
    }

    return scheduled
}

/**
 * Groups articles by their cluster field.
 */
function groupByCluster(articles: SchedulableArticle[]): Map<string, SchedulableArticle[]> {
    const groups = new Map<string, SchedulableArticle[]>()

    for (const article of articles) {
        const cluster = article.cluster || "General"
        if (!groups.has(cluster)) {
            groups.set(cluster, [])
        }
        groups.get(cluster)!.push(article)
    }

    return groups
}

/**
 * Sorts clusters by strategic priority.
 * Larger clusters and certain categories get priority.
 */
function sortClustersByPriority(
    clusterGroups: Map<string, SchedulableArticle[]>
): [string, SchedulableArticle[]][] {
    const entries = Array.from(clusterGroups.entries())

    return entries.sort(([clusterA, articlesA], [clusterB, articlesB]) => {
        // First, sort by cluster size (larger first for authority)
        const sizeDiff = articlesB.length - articlesA.length
        if (sizeDiff !== 0) return sizeDiff

        // Then alphabetically for consistency
        return clusterA.localeCompare(clusterB)
    })
}

/**
 * Sorts articles within each cluster by intent role priority.
 */
function sortWithinClusters(
    sortedClusters: [string, SchedulableArticle[]][]
): [string, SchedulableArticle[]][] {
    const intentPriority: Record<string, number> = {
        "Core Answer": 1,
        "Definition": 1,
        "Problem-Specific": 2,
        "How-To": 2,
        "Comparison": 3,
        "Decision": 3,
        "Authority/Edge": 4,
        "Emotional/Story": 4
    }

    return sortedClusters.map(([cluster, articles]) => {
        const sorted = [...articles].sort((a, b) => {
            const priorityA = intentPriority[a.intent_role || ""] || 5
            const priorityB = intentPriority[b.intent_role || ""] || 5
            return priorityA - priorityB
        })
        return [cluster, sorted] as [string, SchedulableArticle[]]
    })
}

/**
 * Consolidates clusters to ensure minimum articles per cluster.
 * Merges small clusters into "General" or nearest large cluster.
 */
export function consolidateClusters(
    articles: SchedulableArticle[],
    minPerCluster: number = 3,
    maxClusters: number = 8
): SchedulableArticle[] {
    const clusterGroups = groupByCluster(articles)
    const clusterSizes = Array.from(clusterGroups.entries())
        .map(([cluster, articles]) => ({ cluster, count: articles.length }))
        .sort((a, b) => b.count - a.count)

    // If we have too many clusters or some are too small, consolidate
    const largeClusters = clusterSizes.filter(c => c.count >= minPerCluster).slice(0, maxClusters)
    const smallClusters = clusterSizes.filter(c => c.count < minPerCluster || !largeClusters.includes(c))

    if (smallClusters.length === 0) {
        return articles // No consolidation needed
    }

    console.log(`[Cluster Scheduler] Consolidating ${smallClusters.length} small clusters into larger ones`)

    // Merge small clusters into "General" or the largest cluster
    const targetCluster = largeClusters[0]?.cluster || "General"

    return articles.map(article => {
        if (smallClusters.some(sc => sc.cluster === article.cluster)) {
            return { ...article, cluster: targetCluster }
        }
        return article
    })
}
