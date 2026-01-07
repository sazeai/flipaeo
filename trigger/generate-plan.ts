import { task } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { BrandDetails } from "@/lib/schemas/brand"
import { gatherSERPIntelligence, extractCompetitorBrands } from "@/lib/plans/serp-intelligence"
import { performGapAnalysis } from "@/lib/plans/gap-analysis"
import { buildTopicHierarchy } from "@/lib/plans/topic-hierarchy"
import { generateContentPlan } from "@/lib/plans/generator"
import { getGeminiClient } from "@/utils/gemini/geminiClient"

interface GeneratePlanPayload {
    planId: string
    userId: string
    brandId: string
    brandData: BrandDetails
    // seeds are always generated in this task from brandData
    competitorBrands?: Array<{ name: string; url?: string }>
    existingContent?: string[]
}

/**
 * Generate content seeds from brand data using AI.
 * This replaces the server-side competitor analysis for onboarding.
 */
async function generateSeedsFromBrand(brandData: BrandDetails): Promise<string[]> {
    const client = getGeminiClient()

    const brandContext = `${brandData.product_name} - ${brandData.product_identity.literally}. 
Category: ${brandData.category || 'SaaS Software'}. 
Target: ${brandData.audience.primary}. 
Features: ${brandData.core_features.slice(0, 5).join(', ')}`

    const prompt = `
Given this brand, generate 15-20 SEO keyword seeds for a content plan.

Brand Context: ${brandContext}

REQUIREMENTS:
1. Focus on the PRIMARY PRODUCT CATEGORY (e.g., "web analytics", "AI photo editing", "CRM")
2. Include a mix of:
   - Informational keywords ("what is [topic]", "how to [task]", "[topic] guide")
   - Commercial keywords ("best [category] tools", "[product] alternatives", "[competitor] vs")
   - Feature-based keywords ("[feature] software", "tools with [feature]")
3. Keywords should be relevant to what the brand's target audience would search
4. Include some long-tail variations

Return a JSON object with:
{
  "seeds": ["keyword1", "keyword2", ...]
}
`

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        })

        const text = response.text || "{}"
        const data = JSON.parse(text)
        return data.seeds || []
    } catch (error) {
        console.error("[generateSeedsFromBrand] Error:", error)
        // Fallback: generate basic seeds from brand data
        const category = brandData.category || brandData.product_identity.literally
        return [
            `best ${category} tools`,
            `${category} software`,
            `${category} guide`,
            `how to ${category}`,
            `${brandData.product_name} alternatives`,
            ...brandData.core_features.slice(0, 5).map(f => `${f} tools`)
        ]
    }
}

/**
 * Background task for generating content plan using Trigger.dev.
 * This runs after user saves brand data during onboarding.
 * 
 * Flow:
 * 1. User completes brand step → saves brand
 * 2. API creates plan with status='pending' → triggers this task
 * 3. This task runs: Seeds (if needed) → SERP → Gap → Hierarchy → Plan Generation
 * 4. Updates plan in DB at each phase
 * 5. User sees progress on /content-plan page via polling/realtime
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
        const { planId, userId, brandId, brandData, competitorBrands: passedCompetitorBrands, existingContent } = payload
        const supabase = createAdminClient()

        console.log(`[Generate Plan Task] Starting for plan: ${planId}`)

        const updateStatus = async (status: string, phase?: string, error?: string) => {
            const updates: Record<string, any> = { generation_status: status }
            if (phase !== undefined) updates.generation_phase = phase
            if (error) updates.generation_error = error

            // Cast to any - content_plans table exists but not in generated types
            await (supabase as any)
                .from("content_plans")
                .update(updates)
                .eq("id", planId)
        }

        try {
            // === PHASE 1: Generate Seeds from Brand Data ===
            await updateStatus("generating", "seeds")
            console.log(`[Generate Plan Task] Phase 1: Generating seeds from brand data...`)
            const seeds = await generateSeedsFromBrand(brandData)
            console.log(`[Generate Plan Task] Seeds generated: ${seeds.length} keywords`)

            // Update plan with generated seeds
            await (supabase as any)
                .from("content_plans")
                .update({ competitor_seeds: seeds })
                .eq("id", planId)

            // === PHASE 1: SERP Intelligence ===
            await updateStatus("generating", "serp")
            console.log(`[Generate Plan Task] Phase 1: SERP Intelligence...`)

            const serpData = await gatherSERPIntelligence(seeds, 3)
            console.log(`[Generate Plan Task] SERP complete: ${serpData.length} seeds analyzed`)

            // Extract competitor brands if not passed
            const competitorBrands = (passedCompetitorBrands && passedCompetitorBrands.length > 0)
                ? passedCompetitorBrands
                : extractCompetitorBrands(serpData)

            // === PHASE 2: Gap Analysis ===
            await updateStatus("generating", "gap")
            console.log(`[Generate Plan Task] Phase 2: Gap Analysis...`)

            const gapAnalysis = await performGapAnalysis(serpData, brandData, existingContent || [])
            console.log(`[Generate Plan Task] Gap complete: ${gapAnalysis.blueOceanTopics.length} blue ocean topics`)

            // === PHASE 3: Topic Hierarchy ===
            await updateStatus("generating", "hierarchy")
            console.log(`[Generate Plan Task] Phase 3: Topic Hierarchy...`)

            const competitorNames = competitorBrands.map(c => c.name)
            const hierarchy = await buildTopicHierarchy(gapAnalysis, brandData, competitorNames)
            console.log(`[Generate Plan Task] Hierarchy complete: ${hierarchy.nodes.length} topics mapped`)

            // === PHASE 4: Plan Generation ===
            await updateStatus("generating", "plan")
            console.log(`[Generate Plan Task] Phase 4: Plan Generation...`)

            const { plan, categoryDistribution } = await generateContentPlan({
                userId,
                brandId,
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

            console.log(`[Generate Plan Task] Plan generated: ${plan.length} articles`)

            // === SAVE PLAN ===
            // Cast to any - content_plans table exists but not in generated types
            const { error: updateError } = await (supabase as any)
                .from("content_plans")
                .update({
                    plan_data: plan,
                    competitor_seeds: seeds,
                    generation_status: "complete",
                    generation_phase: undefined,
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
                articleCount: plan.length,
                categoryDistribution
            }

        } catch (error: any) {
            console.error(`[Generate Plan Task] Error:`, error)
            await updateStatus("failed", undefined, error.message || "Unknown error")
            throw error
        }
    }
})

