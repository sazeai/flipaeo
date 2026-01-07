import { NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { BrandDetails } from "@/lib/schemas/brand"
import { gatherSERPIntelligence, extractCompetitorBrands, SERPIntelligence } from "@/lib/plans/serp-intelligence"
import { performGapAnalysis, GapAnalysis } from "@/lib/plans/gap-analysis"
import { buildTopicHierarchy, TopicHierarchy } from "@/lib/plans/topic-hierarchy"
import { generateContentPlan } from "@/lib/plans/generator"
import { createStreamEvent, PlanStreamEvent, PlanPhase } from "@/lib/plans/stream-types"

export const maxDuration = 300 // 5 minute timeout

// Helper to send SSE event
function sendEvent(controller: ReadableStreamDefaultController, event: PlanStreamEvent) {
    const data = `data: ${JSON.stringify(event)}\n\n`
    controller.enqueue(new TextEncoder().encode(data))
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        })
    }

    const { seeds, brandData, brandId, existingContent, competitorBrands: passedCompetitorBrands } = await req.json() as {
        seeds: string[],
        brandData: BrandDetails,
        brandId: string,
        existingContent?: string[],
        competitorBrands?: Array<{ name: string; url?: string }>
    }

    if (!seeds || !Array.isArray(seeds) || seeds.length === 0) {
        return new Response(JSON.stringify({ error: "Seeds are required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        })
    }

    if (!brandData) {
        return new Response(JSON.stringify({ error: "Brand data is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        })
    }

    // Create SSE stream
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // === PHASE 1: SERP Intelligence ===
                sendEvent(controller, createStreamEvent('phase_start', {
                    phase: 'serp' as PlanPhase,
                    message: 'Scanning the competitive landscape...'
                }))

                // Stream each seed analysis
                const serpData: SERPIntelligence[] = []
                const seedsToProcess = seeds.slice(0, 3)

                for (const seed of seedsToProcess) {
                    sendEvent(controller, createStreamEvent('serp_analyzing_seed', {
                        seed,
                        message: `Analyzing "${seed}"...`
                    }))
                }

                // Actually run SERP intelligence
                const serpResults = await gatherSERPIntelligence(seeds, 3)

                // Stream results for each seed
                for (const result of serpResults) {
                    serpData.push(result)
                    sendEvent(controller, createStreamEvent('serp_seed_complete', {
                        seed: result.seed,
                        coverage: result.coverageLevel,
                        topPagesCount: result.topPages.length,
                        missingAngles: result.missingAngles.slice(0, 3)
                    }))

                    // Stream competitor discoveries
                    const competitors = result.topPages
                        .filter(p => p.competitorName)
                        .slice(0, 3)

                    for (const page of competitors) {
                        sendEvent(controller, createStreamEvent('serp_competitor_found', {
                            name: page.competitorName,
                            url: page.url
                        }))
                    }
                }

                // Extract competitor brands
                const competitorBrands = (passedCompetitorBrands && passedCompetitorBrands.length > 0)
                    ? passedCompetitorBrands
                    : extractCompetitorBrands(serpData)

                sendEvent(controller, createStreamEvent('phase_complete', {
                    phase: 'serp' as PlanPhase,
                    competitors: competitorBrands.slice(0, 5).map(c => c.name),
                    seedsAnalyzed: serpData.length
                }))

                // === PHASE 2: Gap Analysis ===
                sendEvent(controller, createStreamEvent('phase_start', {
                    phase: 'gap' as PlanPhase,
                    message: 'Identifying content gaps and opportunities...'
                }))

                sendEvent(controller, createStreamEvent('gap_analysis_start', {
                    message: 'Comparing against competitor coverage...'
                }))

                const gapAnalysis = await performGapAnalysis(serpData, brandData, existingContent || [])

                // Stream blue ocean topics
                if (gapAnalysis.blueOceanTopics.length > 0) {
                    sendEvent(controller, createStreamEvent('gap_blue_ocean', {
                        topics: gapAnalysis.blueOceanTopics.slice(0, 5),
                        count: gapAnalysis.blueOceanTopics.length,
                        message: `Found ${gapAnalysis.blueOceanTopics.length} untapped opportunities!`
                    }))
                }

                // Stream saturated warnings
                if (gapAnalysis.saturatedTopics.length > 0) {
                    sendEvent(controller, createStreamEvent('gap_saturated', {
                        topics: gapAnalysis.saturatedTopics.slice(0, 3),
                        count: gapAnalysis.saturatedTopics.length,
                        message: `Identified ${gapAnalysis.saturatedTopics.length} crowded topics to avoid`
                    }))
                }

                // Stream competitor weaknesses
                if (gapAnalysis.competitorWeaknesses.length > 0) {
                    sendEvent(controller, createStreamEvent('gap_weakness', {
                        topics: gapAnalysis.competitorWeaknesses.slice(0, 3),
                        count: gapAnalysis.competitorWeaknesses.length,
                        message: `Found ${gapAnalysis.competitorWeaknesses.length} areas where competitors are weak`
                    }))
                }

                // Stream prioritized opportunities
                for (const opp of gapAnalysis.prioritizedOpportunities.slice(0, 3)) {
                    sendEvent(controller, createStreamEvent('gap_opportunity', {
                        topic: opp.topic,
                        reason: opp.reason,
                        priority: opp.priority
                    }))
                }

                sendEvent(controller, createStreamEvent('phase_complete', {
                    phase: 'gap' as PlanPhase,
                    blueOcean: gapAnalysis.blueOceanTopics.length,
                    saturated: gapAnalysis.saturatedTopics.length,
                    weaknesses: gapAnalysis.competitorWeaknesses.length
                }))

                // === PHASE 3: Topic Hierarchy ===
                sendEvent(controller, createStreamEvent('phase_start', {
                    phase: 'hierarchy' as PlanPhase,
                    message: 'Building strategic content roadmap...'
                }))

                sendEvent(controller, createStreamEvent('hierarchy_building', {
                    message: 'Organizing topics by strategic priority...'
                }))

                const competitorNames = competitorBrands.map(c => c.name)
                const hierarchy = await buildTopicHierarchy(gapAnalysis, brandData, competitorNames)

                // Stream each level
                const levels = ['foundation', 'supporting', 'advanced', 'conversion'] as const
                for (const level of levels) {
                    const levelNodes = hierarchy.levels[level]
                    if (levelNodes.length > 0) {
                        sendEvent(controller, createStreamEvent('hierarchy_level_complete', {
                            level,
                            count: levelNodes.length,
                            samples: levelNodes.slice(0, 2).map(n => n.topic)
                        }))
                    }
                }

                sendEvent(controller, createStreamEvent('phase_complete', {
                    phase: 'hierarchy' as PlanPhase,
                    totalTopics: hierarchy.nodes.length,
                    foundation: hierarchy.levels.foundation.length,
                    supporting: hierarchy.levels.supporting.length,
                    advanced: hierarchy.levels.advanced.length,
                    conversion: hierarchy.levels.conversion.length
                }))

                // === PHASE 4: Plan Generation ===
                sendEvent(controller, createStreamEvent('phase_start', {
                    phase: 'plan' as PlanPhase,
                    message: 'Generating your 30-day content plan...'
                }))

                sendEvent(controller, createStreamEvent('plan_generating', {
                    message: 'Creating strategic article schedule...'
                }))

                const { plan, categoryDistribution } = await generateContentPlan({
                    userId: user.id,
                    brandId: brandId || null,
                    brandData,
                    seeds,
                    competitorBrands,
                    gapAnalysis: {
                        blueOceanTopics: gapAnalysis.blueOceanTopics,
                        saturatedTopics: gapAnalysis.saturatedTopics,
                        competitorWeaknesses: gapAnalysis.competitorWeaknesses
                    },
                    topicHierarchy: hierarchy,
                    existingContent
                })

                // Stream sample articles
                for (const article of plan.slice(0, 5)) {
                    sendEvent(controller, createStreamEvent('plan_article_added', {
                        title: article.title,
                        category: article.article_category || 'Core Answers',
                        day: article.scheduled_date
                    }))
                }

                // === COMPLETE ===
                sendEvent(controller, createStreamEvent('phase_complete', {
                    phase: 'plan' as PlanPhase,
                    totalArticles: plan.length
                }))

                sendEvent(controller, createStreamEvent('complete', {
                    plan,
                    categoryDistribution,
                    gapAnalysis: {
                        blueOceanTopics: gapAnalysis.blueOceanTopics,
                        competitorBrands: competitorBrands.map(c => c.name)
                    }
                }))

                controller.close()
            } catch (error: any) {
                console.error("[Stream API] Error:", error)
                sendEvent(controller, createStreamEvent('error', {
                    message: error.message || "Failed to generate content plan"
                }))
                controller.close()
            }
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
}
