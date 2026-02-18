import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { tasks } from "@trigger.dev/sdk/v3"
import type { runAuditTask } from "@/trigger/run-audit"

// ============================================================
// Topical Audit API — Thin trigger + GET status endpoint
// All heavy logic is in trigger/run-audit.ts
// ============================================================

/**
 * POST — Trigger a new audit
 * Creates/upserts the audit row, then triggers the background task
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { brandId, brandData, brandUrl } = await req.json()

        if (!brandId || !brandData || !brandUrl) {
            return NextResponse.json({ error: "Brand ID, data, and URL required" }, { status: 400 })
        }

        // Check if there's already a running audit
        const { data: existing } = await supabase
            .from("topical_audits")
            .select("generation_status")
            .eq("user_id", user.id)
            .eq("brand_id", brandId)
            .single()

        if (existing?.generation_status === "running") {
            return NextResponse.json({
                message: "Audit already running",
                status: "running"
            })
        }

        // Create or reset the audit row
        const { error: upsertError } = await supabase
            .from("topical_audits")
            .upsert({
                user_id: user.id,
                brand_id: brandId,
                generation_status: "running",
                generation_phase: "niche_mapping",
                generation_error: null,
                // Clear previous results
                niche_blueprint: null,
                user_coverage: null,
                competitor_coverages: null,
                authority_score: null,
                pillar_scores: null,
                gap_matrix: null,
                pillar_suggestions: null,
                projected_score: null,
                competitors_scanned: 0,
                topics_analyzed: 0,
                user_pages_scanned: 0,
                updated_at: new Date().toISOString()
            }, {
                onConflict: "user_id,brand_id"
            })

        if (upsertError) {
            console.error("[Audit API] Upsert failed:", upsertError)
            throw new Error(`Failed to create audit record: ${upsertError.message}`)
        }

        // Trigger the background task
        const handle = await tasks.trigger<typeof runAuditTask>("run-topical-audit", {
            userId: user.id,
            brandId,
            brandData,
            brandUrl
        })

        console.log(`[Audit API] Triggered audit task: ${handle.id}`)

        return NextResponse.json({
            message: "Audit started",
            status: "running",
            taskId: handle.id
        })

    } catch (error: any) {
        console.error("[Audit API] Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

/**
 * GET — Poll audit status + partial results
 * Frontend polls this every 3s during audit
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const brandId = req.nextUrl.searchParams.get("brandId")
        if (!brandId) {
            return NextResponse.json({ error: "brandId required" }, { status: 400 })
        }

        const { data: audit, error } = await supabase
            .from("topical_audits")
            .select("*")
            .eq("user_id", user.id)
            .eq("brand_id", brandId)
            .single()

        if (error || !audit) {
            return NextResponse.json({
                status: "not_found",
                audit: null
            })
        }

        // Build a response tailored to the current status
        return NextResponse.json({
            status: audit.generation_status,
            phase: audit.generation_phase,
            error: audit.generation_error,
            audit: audit.generation_status === "completed" ? {
                niche_blueprint: audit.niche_blueprint,
                user_coverage: audit.user_coverage,
                competitor_coverages: audit.competitor_coverages || [],
                authority_score: audit.authority_score,
                pillar_scores: audit.pillar_scores || [],
                gap_matrix: audit.gap_matrix || [],
                pillar_suggestions: audit.pillar_suggestions || [],
                projected_score_after_plan: audit.projected_score,
                audit_meta: {
                    competitors_scanned: audit.competitors_scanned || 0,
                    topics_analyzed: audit.topics_analyzed || 0,
                    user_pages_scanned: audit.user_pages_scanned || 0,
                    duration_ms: 0
                }
            } : null,
            // Partial data for progress display
            partial: {
                topics_analyzed: audit.topics_analyzed || 0,
                user_pages_scanned: audit.user_pages_scanned || 0,
                competitors_scanned: audit.competitors_scanned || 0,
                authority_score: audit.authority_score
            }
        })

    } catch (error: any) {
        console.error("[Audit API] GET Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
