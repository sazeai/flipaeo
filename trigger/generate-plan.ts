import { task } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { BrandDetails } from "@/lib/schemas/brand"
import { generateStrategicPlan } from "@/lib/plans/strategic-planner"
import { tavily } from "@tavily/core"


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
 * Quick competitor discovery using Tavily search.
 * Searches for "[category] tools" to find real competitor brands.
 */
async function discoverCompetitors(
    brandData: BrandDetails
): Promise<Array<{ name: string; url?: string }>> {
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
        console.warn("[Generate Plan] No Tavily API key, skipping competitor discovery")
        return []
    }

    try {
        const tvly = tavily({ apiKey })
        const category = brandData.category || brandData.product_identity.literally
        const searchQuery = `best ${category} tools software 2024`

        console.log(`[Generate Plan] Discovering competitors for: "${searchQuery}"`)

        const response = await tvly.search(searchQuery, {
            maxResults: 10,
            searchDepth: "basic"
        })

        // Extract unique domains as competitors
        const competitors: Array<{ name: string; url: string }> = []
        const seenDomains = new Set<string>()

        for (const result of response.results || []) {
            try {
                const url = new URL(result.url)
                const domain = url.hostname.replace('www.', '')

                // Skip if already seen or is the brand itself
                if (seenDomains.has(domain)) continue
                if (brandData.product_name.toLowerCase().includes(domain.split('.')[0])) continue

                seenDomains.add(domain)

                // Extract brand name from title or domain
                const brandName = result.title?.split(' - ')[0]?.split(' | ')[0]?.trim() ||
                    domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)

                competitors.push({
                    name: brandName,
                    url: url.origin
                })
            } catch {
                // Invalid URL, skip
            }
        }

        console.log(`[Generate Plan] Found ${competitors.length} competitors`)
        return competitors.slice(0, 8) // Max 8 competitors

    } catch (error) {
        console.error("[Generate Plan] Competitor discovery failed:", error)
        return []
    }
}

/**
 * Background task for generating content plan using Trigger.dev.
 * 
 * REVAMPED FLOW (2 phases instead of 5):
 * 1. Intelligence Phase: Discover competitors if not provided
 * 2. Generation Phase: Use strategic mega-prompt to generate plan
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
            // === PHASE 1: INTELLIGENCE (Competitor Discovery) ===
            await updateStatus("generating", "intelligence")
            console.log(`[Generate Plan Task] Phase 1: Intelligence gathering...`)

            let competitorBrands = passedCompetitors || []

            // Discover competitors if not provided
            if (competitorBrands.length === 0) {
                competitorBrands = await discoverCompetitors(brandData)
            }

            console.log(`[Generate Plan Task] Using ${competitorBrands.length} competitors`)

            // === PHASE 2: STRATEGIC PLAN GENERATION ===
            await updateStatus("generating", "plan")
            console.log(`[Generate Plan Task] Phase 2: Strategic plan generation...`)

            const result = await generateStrategicPlan({
                brandData,
                brandUrl,
                competitorBrands,
                existingContent: existingContent || []
            })

            console.log(`[Generate Plan Task] Plan generated: ${result.plan.length} articles`)
            console.log(`[Generate Plan Task] Content Gap Analysis:`, result.contentGapAnalysis.slice(0, 200) + "...")

            // === SAVE PLAN ===
            const { error: updateError } = await (supabase as any)
                .from("content_plans")
                .update({
                    plan_data: result.plan,
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
                articleCount: result.plan.length,
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
