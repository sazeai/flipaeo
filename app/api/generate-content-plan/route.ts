import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { BrandDetails } from "@/lib/schemas/brand"
import { generateContentPlan } from "@/lib/plans/generator"
import { gatherSERPIntelligence, extractCompetitorBrands } from "@/lib/plans/serp-intelligence"
import { performGapAnalysis } from "@/lib/plans/gap-analysis"
import { buildTopicHierarchy } from "@/lib/plans/topic-hierarchy"
import { extractSearchPrefs } from "@/lib/tavily-search"

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
        const searchPrefs = extractSearchPrefs(brandData)
        const serpData = await gatherSERPIntelligence(seeds, 3, searchPrefs) // Analyze top 3 seeds


        // Extract competitor brands if not passed OR if passed is empty
        const competitorBrands = (passedCompetitorBrands && passedCompetitorBrands.length > 0)
            ? passedCompetitorBrands
            : extractCompetitorBrands(serpData)

        // --- PHASE 2: Gap Analysis (NEW) ---
        const gapAnalysis = await performGapAnalysis(serpData, brandData, existingContent || [])

        // --- PHASE 3: Topic Hierarchy (NEW) ---
        const competitorNames = competitorBrands.map(c => c.name)
        const hierarchy = await buildTopicHierarchy(gapAnalysis, brandData, competitorNames)

        // --- PHASE 4: Generate Strategic Plan ---
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
