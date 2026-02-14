import { NicheBlueprint, SiteCoverage, PillarScore } from "./types"

// ============================================================
// Authority Scorer — Pure math, no LLM calls
// ============================================================

/**
 * Calculates the overall weighted authority score for a site.
 * 
 * Algorithm:
 * - Each pillar has a weight (1-10)
 * - Each topic has an importance multiplier:
 *   critical = 3x, important = 2x, supporting = 1x
 * - Score = weighted sum of (covered topics / required topics) per pillar
 */
export function calculateAuthorityScore(
    coverage: SiteCoverage,
    blueprint: NicheBlueprint
): number {
    if (blueprint.pillars.length === 0) return 0

    let totalWeightedScore = 0
    let totalWeight = 0

    for (const pillar of blueprint.pillars) {
        const pillarCoverage = coverage.pillar_coverage.find(
            pc => pc.pillar_name === pillar.name
        )
        if (!pillarCoverage) continue

        // Calculate importance-weighted score for this pillar
        let maxPossiblePoints = 0
        let earnedPoints = 0

        for (const topic of pillar.required_topics) {
            const multiplier = getImportanceMultiplier(topic.importance)
            maxPossiblePoints += multiplier

            const covered = pillarCoverage.covered_topics.find(
                ct => ct.topic_question === topic.question
            )
            if (covered) {
                const qualityMultiplier = covered.coverage_quality === "strong" ? 1.0 : 0.5
                earnedPoints += multiplier * qualityMultiplier
            }
        }

        const pillarScore = maxPossiblePoints > 0
            ? (earnedPoints / maxPossiblePoints) * 100
            : 0

        totalWeightedScore += pillarScore * pillar.weight
        totalWeight += pillar.weight
    }

    return totalWeight > 0
        ? Math.round(totalWeightedScore / totalWeight)
        : 0
}

/**
 * Generates per-pillar comparison scores between user and competitors.
 */
export function generatePillarScores(
    userCoverage: SiteCoverage,
    competitorCoverages: SiteCoverage[]
): PillarScore[] {
    return userCoverage.pillar_coverage.map(userPillar => {
        // Find the best competitor score for this pillar
        let bestCompetitorName = "No competitors"
        let bestCompetitorScore = 0

        for (const compCoverage of competitorCoverages) {
            const compPillar = compCoverage.pillar_coverage.find(
                pc => pc.pillar_name === userPillar.pillar_name
            )
            if (compPillar && compPillar.score > bestCompetitorScore) {
                bestCompetitorScore = compPillar.score
                bestCompetitorName = compCoverage.site_name
            }
        }

        return {
            pillar: userPillar.pillar_name,
            user_score: userPillar.score,
            best_competitor_name: bestCompetitorName,
            best_competitor_score: bestCompetitorScore
        }
    })
}

/**
 * Projects what the authority score would be after completing the 30-day plan.
 * 
 * Assumes the plan will cover:
 * - All critical missing topics (100%)
 * - Most important missing topics (~80%)
 * - Some supporting missing topics (~50%)
 */
export function projectScoreAfterPlan(
    currentCoverage: SiteCoverage,
    blueprint: NicheBlueprint,
    planArticleCount: number = 30
): number {
    // Create a simulated "after plan" coverage
    let additionalCoveredTopics = 0
    const totalMissing = currentCoverage.pillar_coverage.reduce(
        (sum, pc) => sum + pc.missing_topics.length, 0
    )

    if (totalMissing === 0) return currentCoverage.overall_score

    // Estimate how many missing topics the plan would cover
    // (cap at planArticleCount since each article covers ~1 topic)
    let topicsToFill = Math.min(planArticleCount, totalMissing)

    // Sort missing topics by importance (critical first)
    const allMissing = currentCoverage.pillar_coverage.flatMap(
        pc => pc.missing_topics.map(mt => ({
            ...mt,
            pillar: pc.pillar_name,
            pillar_weight: pc.pillar_weight
        }))
    )

    allMissing.sort((a, b) => {
        const importanceOrder = { critical: 0, important: 1, supporting: 2 }
        return (importanceOrder[a.importance] || 2) - (importanceOrder[b.importance] || 2)
    })

    // Simulate filling the most important gaps
    const filledTopics = allMissing.slice(0, topicsToFill)

    // Recalculate score with filled topics counted as "strong" coverage
    let totalWeightedScore = 0
    let totalWeight = 0

    for (const pillar of blueprint.pillars) {
        const pillarCoverage = currentCoverage.pillar_coverage.find(
            pc => pc.pillar_name === pillar.name
        )
        if (!pillarCoverage) continue

        let maxPoints = 0
        let earnedPoints = 0

        for (const topic of pillar.required_topics) {
            const multiplier = getImportanceMultiplier(topic.importance)
            maxPoints += multiplier

            const alreadyCovered = pillarCoverage.covered_topics.find(
                ct => ct.topic_question === topic.question
            )
            if (alreadyCovered) {
                const qualityMult = alreadyCovered.coverage_quality === "strong" ? 1.0 : 0.5
                earnedPoints += multiplier * qualityMult
            } else {
                // Check if this topic is in the "filled" list
                const filled = filledTopics.find(
                    ft => ft.question === topic.question && ft.pillar === pillar.name
                )
                if (filled) {
                    earnedPoints += multiplier * 0.9 // New articles = 90% coverage quality
                }
            }
        }

        const pillarScore = maxPoints > 0 ? (earnedPoints / maxPoints) * 100 : 0
        totalWeightedScore += pillarScore * pillar.weight
        totalWeight += pillar.weight
    }

    return totalWeight > 0
        ? Math.round(totalWeightedScore / totalWeight)
        : currentCoverage.overall_score
}

function getImportanceMultiplier(importance: "critical" | "important" | "supporting"): number {
    switch (importance) {
        case "critical": return 3
        case "important": return 2
        case "supporting": return 1
        default: return 1
    }
}
