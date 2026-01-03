import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { refreshGSCToken } from "@/actions/gsc"
import { generateContentPlan } from "@/lib/plans/generator"
import { processGSCData } from "@/lib/plans/gsc-processor"
import { buildTopicHierarchy } from "@/lib/plans/topic-hierarchy"

export const maxDuration = 300 // 5 minute timeout

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { brandData, competitorBrands, brandName, existingPlan, seeds } = await req.json()

        // 1. Get GSC connection
        const { data: connection } = await supabase
            .from("gsc_connections")
            .select("*")
            .eq("user_id", user.id)
            .single()

        if (!connection) {
            return NextResponse.json({ error: "GSC not connected" }, { status: 400 })
        }

        // 2. Refresh token if needed
        let accessToken = connection.access_token
        if (new Date(connection.expires_at) < new Date()) {
            const refreshResult = await refreshGSCToken(connection.id)
            if (!refreshResult.success) {
                return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 })
            }
            accessToken = refreshResult.accessToken
        }

        const siteUrl = connection.site_url
        if (!siteUrl) {
            return NextResponse.json({ error: "No site URL configured" }, { status: 400 })
        }

        // 3. Fetch GSC Data (Last 30 days)
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - 30)

        const gscResponse = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    startDate: startDate.toISOString().split("T")[0],
                    endDate: endDate.toISOString().split("T")[0],
                    dimensions: ["query"],
                    rowLimit: 500,
                }),
            }
        )

        if (!gscResponse.ok) {
            return NextResponse.json({ error: "Failed to fetch GSC data" }, { status: 500 })
        }

        const gscData = await gscResponse.json()
        const gscClusters = processGSCData(gscData.rows || [], brandName)

        console.log(`[GSC Plan] Processed ${gscClusters.length} clusters from search data`)

        // 4. Build Strategy (Topic Hierarchy)
        // We pass the existingPlan (Blueprint) or seeds to the hierarchy builder
        const hierarchySeeds = seeds && seeds.length > 0 ? seeds : (existingPlan?.map((p: any) => p.title) || [])
        const hierarchy = await buildTopicHierarchy(hierarchySeeds, brandData)

        // 5. Generate Unified Plan
        const result = await generateContentPlan({
            userId: user.id,
            brandId: connection.brand_id,
            brandData,
            seeds: hierarchySeeds,
            competitorBrands,
            topicHierarchy: hierarchy,
            gscClusters,
            existingContent: [] // Could be populated from sitemap if needed
        })

        console.log(`[GSC Plan] Unified generation complete: ${result.plan.length} articles`)

        return NextResponse.json({ plan: result.plan })

    } catch (error: any) {
        console.error("GSC plan generation error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate content plan" },
            { status: 500 }
        )
    }
}
