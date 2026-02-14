"use server"

import { createClient } from "@/utils/supabase/server"
import { TopicalAuditResult } from "@/lib/audit/types"

/**
 * Save audit result to the topical_audits table.
 */
export async function saveAuditResult(
    brandId: string,
    auditData: TopicalAuditResult
): Promise<{ success: boolean; auditId?: string; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: "Unauthorized" }

        const { data, error } = await supabase
            .from("topical_audits")
            .insert({
                user_id: user.id,
                brand_id: brandId,
                niche_blueprint: auditData.niche_blueprint,
                user_coverage: auditData.user_coverage,
                competitor_coverages: auditData.competitor_coverages,
                authority_score: auditData.authority_score,
                pillar_scores: auditData.pillar_scores,
                gap_matrix: auditData.gap_matrix,
                pillar_suggestions: auditData.pillar_suggestions,
                projected_score: auditData.projected_score_after_plan,
                competitors_scanned: auditData.audit_meta.competitors_scanned,
                topics_analyzed: auditData.audit_meta.topics_analyzed,
            })
            .select("id")
            .single()

        if (error) {
            console.error("[Audit Action] Save error:", error)
            return { success: false, error: error.message }
        }

        return { success: true, auditId: data.id }

    } catch (error: any) {
        console.error("[Audit Action] Save failed:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Get the latest audit for a brand.
 */
export async function getLatestAudit(
    brandId: string
): Promise<{ audit: TopicalAuditResult | null; auditId: string | null }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { audit: null, auditId: null }

        const { data, error } = await supabase
            .from("topical_audits")
            .select("*")
            .eq("user_id", user.id)
            .eq("brand_id", brandId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

        if (error || !data) return { audit: null, auditId: null }

        const audit: TopicalAuditResult = {
            niche_blueprint: data.niche_blueprint,
            user_coverage: data.user_coverage,
            competitor_coverages: data.competitor_coverages || [],
            authority_score: data.authority_score,
            pillar_scores: data.pillar_scores || [],
            gap_matrix: data.gap_matrix || [],
            pillar_suggestions: data.pillar_suggestions || [],
            projected_score_after_plan: data.projected_score || 0,
            audit_meta: {
                competitors_scanned: data.competitors_scanned || 0,
                topics_analyzed: data.topics_analyzed || 0,
                user_pages_scanned: data.user_coverage?.pages_analyzed || 0,
                duration_ms: 0
            }
        }

        return { audit, auditId: data.id }

    } catch (error) {
        console.error("[Audit Action] Get latest failed:", error)
        return { audit: null, auditId: null }
    }
}

/**
 * Get audit gap matrix for feeding into plan generation.
 */
export async function getAuditGapsForPlan(
    brandId: string
): Promise<{
    gaps: TopicalAuditResult["gap_matrix"]
    pillarSuggestions: TopicalAuditResult["pillar_suggestions"]
    blueprint: TopicalAuditResult["niche_blueprint"] | null
} | null> {
    const { audit } = await getLatestAudit(brandId)
    if (!audit) return null

    return {
        gaps: audit.gap_matrix.filter(g => !g.user_covered), // Only uncovered gaps
        pillarSuggestions: audit.pillar_suggestions,
        blueprint: audit.niche_blueprint
    }
}
