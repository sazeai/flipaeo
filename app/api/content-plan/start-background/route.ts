import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { tasks } from "@trigger.dev/sdk/v3"
import { generatePlanTask } from "@/trigger/generate-plan"
import { BrandDetails } from "@/lib/schemas/brand"

export const maxDuration = 30 // Quick response, actual work is in background

/**
 * POST: Start background plan generation
 * 
 * Called after user saves brand during onboarding.
 * Creates a pending plan and triggers Trigger.dev task.
 * Returns immediately so user can proceed to /content-plan.
 * 
 * Seeds are now optional - the background task will generate them from brand data if not provided.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const {
            brandId,
            brandData,
            competitorBrands,
            existingContent
        } = await req.json() as {
            brandId: string
            brandData: BrandDetails
            competitorBrands?: Array<{ name: string; url?: string }>
            existingContent?: string[]
        }

        if (!brandId || !brandData) {
            return NextResponse.json({ error: "Brand ID and data required" }, { status: 400 })
        }

        // Seeds are generated in the trigger task from brandData

        // Delete any existing plans for this user
        await supabase
            .from("content_plans")
            .delete()
            .eq("user_id", user.id)

        // Create new plan with pending status
        const { data: plan, error: insertError } = await supabase
            .from("content_plans")
            .insert({
                user_id: user.id,
                brand_id: brandId,
                plan_data: [], // Empty, will be filled by background task
                competitor_seeds: [], // Will be populated by trigger task
                gsc_enhanced: false,
                generation_status: "pending",
                generation_phase: "seeds" // First phase: generate seeds
            })
            .select()
            .single()

        if (insertError || !plan) {
            console.error("[Start Background Plan] Insert error:", insertError)
            return NextResponse.json({ error: insertError?.message || "Failed to create plan" }, { status: 500 })
        }

        console.log(`[Start Background Plan] Created pending plan: ${plan.id}`)

        // Trigger background task
        try {
            const handle = await tasks.trigger<typeof generatePlanTask>(
                "generate-content-plan",
                {
                    planId: plan.id,
                    userId: user.id,
                    brandId,
                    brandData,
                    competitorBrands,
                    existingContent
                }
            )

            console.log(`[Start Background Plan] Triggered task: ${handle.id}`)

            return NextResponse.json({
                success: true,
                planId: plan.id,
                taskId: handle.id,
                generation_status: "pending"
            })
        } catch (triggerError: any) {
            console.error("[Start Background Plan] Trigger error:", triggerError)

            // Mark plan as failed if trigger fails
            await supabase
                .from("content_plans")
                .update({
                    generation_status: "failed",
                    generation_error: triggerError.message || "Failed to start generation"
                })
                .eq("id", plan.id)

            return NextResponse.json({
                error: "Failed to start plan generation",
                planId: plan.id
            }, { status: 500 })
        }

    } catch (error: any) {
        console.error("[Start Background Plan] Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
