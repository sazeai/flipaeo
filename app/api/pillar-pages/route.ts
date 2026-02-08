import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateEmbedding } from "@/lib/internal-linking"
import { PillarRecommendation } from "@/lib/plans/pillar-generator"

/**
 * POST: Mark a pillar page as created by saving its URL to internal_links
 * 
 * Body: { pillarId: string, url: string, brandId: string }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { pillarId, url, brandId } = await req.json()

        if (!pillarId || !url || !brandId) {
            return NextResponse.json(
                { error: "pillarId, url, and brandId are required" },
                { status: 400 }
            )
        }

        // Validate URL format
        try {
            new URL(url)
        } catch {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
        }

        // 1. Fetch the brand's pillar recommendations
        const { data: brand, error: brandError } = await supabase
            .from("brand_details")
            .select("pillar_recommendations")
            .eq("id", brandId)
            .eq("user_id", user.id)
            .single()

        if (brandError || !brand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 })
        }

        const pillars = brand.pillar_recommendations as PillarRecommendation[] | null
        if (!pillars || pillars.length === 0) {
            return NextResponse.json({ error: "No pillar recommendations found" }, { status: 404 })
        }

        // 2. Find the specific pillar and update it
        const pillarIndex = pillars.findIndex(p => p.id === pillarId)
        if (pillarIndex === -1) {
            return NextResponse.json({ error: "Pillar not found" }, { status: 404 })
        }

        const pillar = pillars[pillarIndex]

        // Update the pillar with created_url and created_at
        pillars[pillarIndex] = {
            ...pillar,
            created_url: url,
            created_at: new Date().toISOString()
        }

        // 3. Save updated pillars back to brand_details
        const { error: updateError } = await supabase
            .from("brand_details")
            .update({ pillar_recommendations: pillars })
            .eq("id", brandId)

        if (updateError) {
            console.error("[pillar-pages] Failed to update brand:", updateError)
            return NextResponse.json({ error: "Failed to update pillar status" }, { status: 500 })
        }

        // 4. Add to internal_links with embedding (for automatic linking in future articles)
        try {
            const embedding = await generateEmbedding(pillar.title)

            // Check if URL already exists in internal_links
            const { data: existing } = await supabase
                .from("internal_links")
                .select("id")
                .eq("url", url)
                .eq("brand_id", brandId)
                .maybeSingle()

            if (!existing) {
                await supabase
                    .from("internal_links")
                    .insert({
                        user_id: user.id,
                        brand_id: brandId,
                        url: url,
                        title: pillar.title,
                        embedding: embedding,
                        is_pillar: true // Mark as pillar page for potential future use
                    })

                console.log(`[pillar-pages] Added pillar "${pillar.title}" to internal_links`)
            } else {
                console.log(`[pillar-pages] URL already exists in internal_links, skipping insert`)
            }
        } catch (embedError) {
            // Non-blocking - pillar is still marked as created even if embedding fails
            console.error("[pillar-pages] Failed to add to internal_links:", embedError)
        }

        return NextResponse.json({
            success: true,
            pillar: pillars[pillarIndex]
        })

    } catch (error: any) {
        console.error("[pillar-pages] Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
