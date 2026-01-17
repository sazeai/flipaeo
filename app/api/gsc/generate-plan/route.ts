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
                    dimensions: ["query", "page"],
                    rowLimit: 1000,
                }),
            }
        )

        // 3.5. Fetch Existing Content (Sitemap Context)
        const { data: existingLinks } = await supabase
            .from("internal_links")
            .select("url, title")
            .eq("brand_id", connection.brand_id)

        const existingContentItems = existingLinks?.map(l => l.title || "") || []
        const existingUrls = existingLinks?.map(l => l.url) || []

        if (!gscResponse.ok) {
            return NextResponse.json({ error: "Failed to fetch GSC data" }, { status: 500 })
        }

        const gscData = await gscResponse.json()
        const gscClusters = processGSCData(gscData.rows || [], brandName, existingUrls)


        // 4. Build Strategy (Topic Hierarchy)
        // We pass the existingPlan (Blueprint) or seeds to the hierarchy builder
        const hierarchySeeds = seeds && seeds.length > 0 ? seeds : (existingPlan?.map((p: any) => p.title) || [])

        // Note: buildTopicHierarchy expects GapAnalysis object, but for GSC flow we may not have full gap analysis
        // Create a minimal gap analysis object from GSC clusters
        const gapAnalysis = {
            blueOceanTopics: gscClusters.filter(c => c.category === "new_opportunity").map(c => c.primary_keyword),
            saturatedTopics: [] as string[],
            competitorWeaknesses: gscClusters.filter(c => c.category === "quick_win").map(c => c.primary_keyword),
            prioritizedOpportunities: gscClusters.slice(0, 20).map(c => ({
                topic: c.primary_keyword,
                priority: c.category === "quick_win" ? "high" : c.category === "high_potential" ? "medium" : "low",
                reason: `${c.category.replace("_", " ")} - ${c.impressions} impressions, position ${c.position.toFixed(1)}`
            }))
        }

        // Only build hierarchy if we have meaningful data
        let hierarchy = undefined
        if (gapAnalysis.prioritizedOpportunities.length > 0) {
            try {
                hierarchy = await buildTopicHierarchy(gapAnalysis as any, brandData, competitorBrands?.map((c: any) => c.name) || [])
            } catch (hierarchyError) {
                console.warn("[GSC Plan] Topic hierarchy failed, continuing without:", hierarchyError)
            }
        }

        // 5. Generate Unified Plan
        const result = await generateContentPlan({
            userId: user.id,
            brandId: connection.brand_id,
            brandData,
            seeds: hierarchySeeds,
            competitorBrands,
            topicHierarchy: hierarchy,
            existingContent: existingContentItems
        })


        return NextResponse.json({ plan: result.plan })

    } catch (error: any) {
        console.error("GSC plan generation error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate content plan" },
            { status: 500 }
        )
    }
}
