import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { refreshGSCToken } from "@/actions/gsc"
import { processGSCData, KeywordCluster } from "@/lib/plans/gsc-processor"
import { ContentPlanItem } from "@/lib/schemas/content-plan"

export const maxDuration = 120 // 2 minute timeout

/**
 * POST: Enhance existing content plan with GSC data
 * 
 * This does NOT regenerate the plan - it:
 * 1. Fetches the existing 30-day plan from DB
 * 2. Fetches GSC search data (query + page)
 * 3. Enriches existing plan items with GSC metrics
 * 4. Adds NEW opportunity articles from GSC gaps
 * 5. Saves enhanced plan with gsc_enhanced: true
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

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

        // 3. Fetch EXISTING content plan from database
        const { data: existingPlan, error: planError } = await supabase
            .from("content_plans")
            .select("*")
            .eq("user_id", user.id)
            .single()

        if (planError || !existingPlan) {
            return NextResponse.json({ error: "No existing content plan found" }, { status: 404 })
        }

        const planItems: ContentPlanItem[] = existingPlan.plan_data || []
        console.log(`[GSC Enhance] Found existing plan with ${planItems.length} articles`)

        // 4. Fetch GSC Data (Last 30 days) - Query + Page dimension
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

        if (!gscResponse.ok) {
            console.error("[GSC Enhance] GSC API error:", await gscResponse.text())
            return NextResponse.json({ error: "Failed to fetch GSC data" }, { status: 500 })
        }

        const gscData = await gscResponse.json()

        // 5. Fetch existing content URLs from internal_links (sitemap data)
        const { data: existingLinks } = await supabase
            .from("internal_links")
            .select("url, title")
            .eq("brand_id", existingPlan.brand_id)

        const existingUrls = existingLinks?.map(l => l.url) || []
        console.log(`[GSC Enhance] Found ${existingUrls.length} existing URLs from sitemap`)

        // 6. Get brand name for filtering
        const { data: brand } = await supabase
            .from("brands")
            .select("brand_data")
            .eq("id", existingPlan.brand_id)
            .single()

        const brandName = brand?.brand_data?.product_name || ""

        // 7. Process GSC data - this filters out cannibalization risks!
        const gscClusters = processGSCData(gscData.rows || [], brandName, existingUrls)
        console.log(`[GSC Enhance] Processed ${gscClusters.length} opportunity clusters`)

        // 8. Enhance existing plan items with GSC metrics
        const enhancedItems = planItems.map(item => {
            // Find matching GSC cluster by keyword similarity
            const match = findBestMatch(item.main_keyword, gscClusters)

            if (match) {
                return {
                    ...item,
                    gsc_impressions: match.impressions,
                    gsc_position: Math.round(match.position * 10) / 10,
                    gsc_ctr: Math.round(match.ctr * 10000) / 100,
                    opportunity_score: match.opportunity_score,
                    gsc_category: match.category,
                }
            }
            return item
        })

        // 9. Find NEW opportunities not covered by existing plan
        const existingKeywords = new Set(planItems.map(p => p.main_keyword.toLowerCase()))

        const newOpportunities = gscClusters
            .filter(cluster =>
                (cluster.category === "quick_win" || cluster.category === "high_potential") &&
                !existingKeywords.has(cluster.primary_keyword.toLowerCase()) &&
                !isKeywordCovered(cluster.primary_keyword, Array.from(existingKeywords))
            )
            .slice(0, 5) // Add up to 5 new articles

        console.log(`[GSC Enhance] Adding ${newOpportunities.length} new opportunity articles`)

        // Create new plan items from opportunities
        const newItems: ContentPlanItem[] = newOpportunities.map((opp, index) => ({
            id: `gsc-${Date.now()}-${index}`,
            title: generateTitle(opp.primary_keyword, opp.intent),
            main_keyword: opp.primary_keyword,
            supporting_keywords: opp.supporting_keywords,
            article_type: opp.intent,
            cluster: "GSC Opportunity",
            scheduled_date: getNextAvailableDate(enhancedItems, index),
            status: "pending" as const,
            impact: opp.category === "quick_win" ? "High" as const : "Medium" as const,
            reason: `${opp.category.replace("_", " ")}: ${opp.impressions} impressions, position ${opp.position.toFixed(1)}`,
            gsc_impressions: opp.impressions,
            gsc_position: Math.round(opp.position * 10) / 10,
            gsc_ctr: Math.round(opp.ctr * 10000) / 100,
            opportunity_score: opp.opportunity_score,
            gsc_category: opp.category,
        }))

        // 10. Combine and save
        const finalPlan = [...enhancedItems, ...newItems]

        const { error: updateError } = await supabase
            .from("content_plans")
            .update({
                plan_data: finalPlan,
                gsc_enhanced: true,
                updated_at: new Date().toISOString()
            })
            .eq("id", existingPlan.id)

        if (updateError) {
            console.error("[GSC Enhance] Save error:", updateError)
            return NextResponse.json({ error: "Failed to save enhanced plan" }, { status: 500 })
        }

        console.log(`[GSC Enhance] Complete! Enhanced ${enhancedItems.length} items, added ${newItems.length} new`)

        return NextResponse.json({
            success: true,
            enhanced_count: enhancedItems.filter(i => i.gsc_impressions).length,
            new_opportunities: newItems.length,
            total_articles: finalPlan.length
        })

    } catch (error: any) {
        console.error("[GSC Enhance] Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to enhance plan" },
            { status: 500 }
        )
    }
}

// Helper: Find best matching GSC cluster for a keyword
function findBestMatch(keyword: string, clusters: KeywordCluster[]): KeywordCluster | null {
    const keywordLower = keyword.toLowerCase()
    const keywordWords = new Set(keywordLower.split(/\s+/))

    let bestMatch: KeywordCluster | null = null
    let bestScore = 0

    for (const cluster of clusters) {
        const clusterLower = cluster.primary_keyword.toLowerCase()

        // Exact match
        if (clusterLower === keywordLower) {
            return cluster
        }

        // Partial match - calculate word overlap
        const clusterWords = new Set(clusterLower.split(/\s+/))
        const intersection = [...keywordWords].filter(w => clusterWords.has(w))
        const union = new Set([...keywordWords, ...clusterWords])
        const similarity = intersection.length / union.size

        if (similarity > bestScore && similarity > 0.4) {
            bestScore = similarity
            bestMatch = cluster
        }
    }

    return bestMatch
}

// Helper: Check if keyword is semantically covered by existing keywords
function isKeywordCovered(keyword: string, existingKeywords: string[]): boolean {
    const words = keyword.toLowerCase().split(/\s+/)

    for (const existing of existingKeywords) {
        const existingWords = existing.split(/\s+/)
        const overlap = words.filter(w => existingWords.includes(w)).length
        if (overlap >= Math.min(2, words.length - 1)) {
            return true
        }
    }
    return false
}

// Helper: Generate SEO-friendly title from keyword
function generateTitle(keyword: string, intent: string): string {
    const capitalized = keyword.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')

    if (intent === "howto") {
        return `How to ${capitalized}`
    } else if (intent === "commercial") {
        return `Best ${capitalized} in 2026`
    }
    return capitalized
}

// Helper: Get next available date for new articles
function getNextAvailableDate(existingItems: ContentPlanItem[], offset: number): string {
    const dates = existingItems
        .map(i => new Date(i.scheduled_date))
        .sort((a, b) => b.getTime() - a.getTime())

    const lastDate = dates[0] || new Date()
    const newDate = new Date(lastDate)
    newDate.setDate(newDate.getDate() + 1 + offset)

    return newDate.toISOString().split('T')[0]
}
