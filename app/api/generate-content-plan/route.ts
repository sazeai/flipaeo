import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { BrandDetails } from "@/lib/schemas/brand"
import { generateContentPlan } from "@/lib/plans/generator"
import { gatherSERPIntelligence, extractCompetitorBrands } from "@/lib/plans/serp-intelligence"
import { performGapAnalysis } from "@/lib/plans/gap-analysis"
import { buildTopicHierarchy } from "@/lib/plans/topic-hierarchy"

export const maxDuration = 300 // 5 minute timeout

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { seeds, brandData, brandId, existingContent, competitorBrands: passedCompetitorBrands } = await req.json() as {
            seeds: string[],
            brandData: BrandDetails,
            brandId: string,
            existingContent?: string[],
            competitorBrands?: Array<{ name: string; url?: string }>
        }

        if (!seeds || !Array.isArray(seeds) || seeds.length === 0) {
            return NextResponse.json({ error: "Seeds are required" }, { status: 400 })
        }

        if (!brandData) {
            return NextResponse.json({ error: "Brand data is required" }, { status: 400 })
        }

        // --- PHASE 1: SERP Intelligence (NEW) ---
        console.log("[Content Plan API] Starting Phase 1: SERP Intelligence...")
        const serpData = await gatherSERPIntelligence(seeds, 3) // Analyze top 3 seeds
        console.log(`[Content Plan API] Phase 1 complete: ${serpData.length} seeds analyzed`)

        // Debug: Log what was passed
        console.log(`[Content Plan API] Passed competitors: ${passedCompetitorBrands?.length || 0} brands: ${passedCompetitorBrands?.map(c => c.name).join(', ') || 'NONE'}`)

        // Extract competitor brands if not passed OR if passed is empty
        const competitorBrands = (passedCompetitorBrands && passedCompetitorBrands.length > 0)
            ? passedCompetitorBrands
            : extractCompetitorBrands(serpData)
        console.log(`[Content Plan API] Using competitors: ${competitorBrands.map(c => c.name).join(', ')}`)

        // --- PHASE 2: Gap Analysis (NEW) ---
        console.log("[Content Plan API] Starting Phase 2: Gap Analysis...")
        const gapAnalysis = await performGapAnalysis(serpData, brandData, existingContent || [])
        console.log(`[Content Plan API] Phase 2 complete: ${gapAnalysis.blueOceanTopics.length} blue ocean topics`)

        // --- PHASE 3: Topic Hierarchy (NEW) ---
        console.log("[Content Plan API] Starting Phase 3: Topic Hierarchy...")
        const competitorNames = competitorBrands.map(c => c.name)
        const hierarchy = await buildTopicHierarchy(gapAnalysis, brandData, competitorNames)
        console.log(`[Content Plan API] Phase 3 complete: ${hierarchy.nodes.length} strategic topics mapped`)

        // --- PHASE 4: Generate Strategic Plan ---
        console.log("[Content Plan API] Starting Phase 4: Plan Generation...")
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
            topicHierarchy: hierarchy, // Pass the blueprint
            existingContent
        })

        return NextResponse.json({
            plan,
            categoryDistribution,
            gapAnalysis: {
                blueOceanTopics: gapAnalysis.blueOceanTopics,
                competitorBrands: competitorBrands.map(c => c.name)
            }
        })
    } catch (error: any) {
        console.error("Content plan generation error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate content plan" },
            { status: 500 }
        )
    }
}
