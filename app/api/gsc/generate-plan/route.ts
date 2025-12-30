import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { refreshGSCToken } from "@/actions/gsc"
import { getGeminiClient } from "@/utils/gemini/geminiClient"
import { jsonrepair } from "jsonrepair"
import { checkTopicDuplication } from "@/lib/topic-memory"

interface GSCQueryRow {
    keys: string[]
    clicks: number
    impressions: number
    ctr: number
    position: number
}

interface ProcessedQuery {
    query: string
    impressions: number
    clicks: number
    ctr: number
    position: number
    intent: "informational" | "commercial" | "howto"
    opportunity_score: number
    word_count: number
    expected_ctr: number // For low CTR detection
}

interface KeywordCluster {
    primary_keyword: string
    supporting_keywords: string[]
    intent: "informational" | "commercial" | "howto"
    opportunity_score: number
    impressions: number
    position: number
    ctr: number
    expected_ctr: number
    category: "quick_win" | "high_potential" | "strategic" | "new_opportunity"
}

// Expected CTR curve by position (industry standard)
const EXPECTED_CTR: Record<number, number> = {
    1: 0.30, 2: 0.20, 3: 0.12, 4: 0.08, 5: 0.06,
    6: 0.04, 7: 0.03, 8: 0.03, 9: 0.03, 10: 0.03,
}

function getExpectedCTR(position: number): number {
    if (position <= 10) return EXPECTED_CTR[Math.round(position)] || 0.03
    if (position <= 20) return 0.01
    return 0.005
}

// Step 1: Filter garbage queries
function filterGarbageQueries(queries: GSCQueryRow[], brandName?: string): GSCQueryRow[] {
    return queries.filter(q => {
        const query = q.keys[0].toLowerCase()
        const wordCount = query.split(/\s+/).length

        // Filter out:
        // - Brand queries (if brand name provided)
        if (brandName && query.includes(brandName.toLowerCase())) return false
        // - Very low impressions (not meaningful)
        if (q.impressions < 20) return false
        // - Position > 50 (not relevant)
        if (q.position > 50) return false
        // - Low CTR + bad position
        if (q.ctr < 0.001 && q.position > 20) return false
        // - Too generic (< 2 words)
        if (wordCount < 2) return false

        return true
    })
}

// Step 2: Tag query intent (only 3 core types for generate-blog.ts compatibility)
function tagIntent(query: string): "informational" | "commercial" | "howto" {
    const q = query.toLowerCase()

    // How-to patterns (tutorials, guides, step-by-step)
    if (q.includes("how") || q.includes("tutorial") || q.includes("step") ||
        q.includes("guide") || q.includes("setup") || q.includes("create") ||
        q.includes("make") || q.includes("build")) {
        return "howto"
    }

    // Commercial patterns (comparisons, reviews, best-of lists)
    if (q.includes("best") || q.includes("top") || q.includes("vs") ||
        q.includes("review") || q.includes("alternative") || q.includes("pricing") ||
        q.includes("compare") || q.includes("cheap") || q.includes("free") ||
        q.includes("tool") || q.includes("software") || q.includes("app")) {
        return "commercial"
    }

    // Default: Informational (what/why/explain)
    return "informational"
}

// Step 3: Compute opportunity score
function computeOpportunityScore(
    impressions: number,
    position: number,
    ctr: number,
    wordCount: number,
    maxImpressions: number
): number {
    // Normalize impressions (0-1)
    const impressionsNormalized = maxImpressions > 0 ? impressions / maxImpressions : 0

    // Position inverse (lower position = higher score)
    const positionInverse = Math.max(0, (50 - position) / 50)

    // CTR gap (expected - actual)
    const expectedCtr = getExpectedCTR(position)
    const ctrGap = Math.max(0, expectedCtr - ctr)

    // Query depth score (longer = more specific = better)
    let queryDepthScore = 0.3
    if (wordCount >= 3) queryDepthScore = 0.5
    if (wordCount >= 4) queryDepthScore = 0.7
    if (wordCount >= 5) queryDepthScore = 1.0

    // Final weighted score
    const score = (
        (impressionsNormalized * 0.4) +
        (positionInverse * 0.3) +
        (ctrGap * 0.2) +
        (queryDepthScore * 0.1)
    )

    return Math.round(score * 100)
}

// Step 4: Deduplicate similar queries using n-gram similarity
function calculateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/))
    const wordsB = new Set(b.toLowerCase().split(/\s+/))

    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)))
    const union = new Set([...wordsA, ...wordsB])

    return intersection.size / union.size // Jaccard similarity
}

function clusterQueries(queries: ProcessedQuery[], maxImpressions: number): KeywordCluster[] {
    const clusters: KeywordCluster[] = []
    const used = new Set<string>()

    // Sort by opportunity score descending
    const sorted = [...queries].sort((a, b) => b.opportunity_score - a.opportunity_score)

    // Calculate meaningful thresholds based on actual data
    const highImpressionsThreshold = maxImpressions * 0.1 // Top 10% of impressions
    const mediumImpressionsThreshold = maxImpressions * 0.05 // Top 5%

    for (const query of sorted) {
        if (used.has(query.query)) continue

        // Find similar queries (Jaccard similarity > 40%)
        const similar = sorted.filter(q =>
            !used.has(q.query) &&
            q.query !== query.query &&
            calculateSimilarity(query.query, q.query) > 0.4
        )

        // Mark all as used
        used.add(query.query)
        similar.forEach(s => used.add(s.query))

        // Determine category based on blueprint criteria:
        // Quick Win: Position 7-20 + High impressions + Low CTR (below expected)
        // High Potential: High impressions + Position 20-40
        // Strategic: High opportunity score (cluster builders)
        // New Opportunity: Everything else (emerging queries)

        let category: KeywordCluster["category"] = "new_opportunity"
        const isLowCTR = query.ctr < query.expected_ctr * 0.5 // CTR is less than half of expected
        const hasHighImpressions = query.impressions >= mediumImpressionsThreshold

        if (query.position >= 7 && query.position <= 20 && hasHighImpressions && isLowCTR) {
            // Quick Win: Easy to jump to page 1 with better title/meta
            category = "quick_win"
        } else if (query.impressions >= highImpressionsThreshold && query.position > 20 && query.position <= 40) {
            // High Potential: Mid-term SEO value
            category = "high_potential"
        } else if (query.opportunity_score >= 50 && query.impressions >= mediumImpressionsThreshold) {
            // Strategic: Good score + decent impressions = cluster builder
            category = "strategic"
        }
        // else: new_opportunity (default)

        clusters.push({
            primary_keyword: query.query,
            supporting_keywords: similar.map(s => s.query),
            intent: query.intent,
            opportunity_score: query.opportunity_score,
            impressions: query.impressions,
            position: query.position,
            ctr: query.ctr,
            expected_ctr: query.expected_ctr,
            category,
        })
    }

    return clusters
}

// Master LLM prompt for 30-day plan generation
function generatePlanPrompt(
    clusters: KeywordCluster[],
    brandData: any,
    competitorSeeds: string[],
    existingPlan: any[]
): string {
    const now = new Date()
    const currentDate = `${now.toLocaleDateString('en-US', { month: 'long' })} ${now.getFullYear()}`

    return `You are an elite SEO strategist enhancing a content plan with real search data. [Current Date: ${currentDate}]

---

## STRATEGIC PRIORITY (READ FIRST — THIS DEFINES YOUR MINDSET)

You are ENHANCING an existing strategic plan, NOT replacing it with keywords.

The Blueprint below represents STRATEGIC THINKING:
- Carefully chosen categories (12-8-6-4 distribution)
- Intentional topic sequencing
- Decision-stage content designed for AI citation

GSC data represents MARKET VALIDATION:
- Real search demand signals
- Opportunity scores
- Ranking potential

YOUR ROLE:
1. KEEP the Blueprint's STRATEGIC STRUCTURE as the foundation
2. Use GSC to VALIDATE and ENRICH (not replace) topics
3. If a Blueprint topic has GSC support → Keep and add metrics
4. If a Blueprint topic has NO GSC match → KEEP IT ANYWAY (strategic value trumps search volume)
5. If GSC shows high-opportunity topic not in Blueprint → Add ONLY if it fills a genuine category gap

DO NOT let GSC pull the plan into "keyword + scenario + year" patterns.
The goal is STRATEGIC DEPTH, not keyword optimization.

---

## DECISION-STAGE CONTENT (AI CITATION PRIORITY)

AI systems cite content that answers DECISION questions, not curiosity questions.

PRIORITIZE these patterns based on brand category:
- "Should I use X?" / "When should I NOT use X?"
- "What can go wrong with X?"
- "X vs Y - which is better for Z?"
- "Is X worth it for [specific situation]?"

DEPRIORITIZE these patterns based on brand category:
- "What is X?" (Only 1-2 if foundational)
- "Why X is amazing" (Low citation value)
- "The future of X" (Speculative)

---

## INPUT 1: THE BLUEPRINT (STRATEGIC STRUCTURE — THIS LEADS)

This plan has the strategic category balance. Respect its intent.

${existingPlan && existingPlan.length > 0 ? JSON.stringify(existingPlan.map(p => ({
        title: p.title,
        category: p.article_category || p.category || "Core Answers",
        intent: p.intent_role || p.intent || "informational",
        keywords: [p.main_keyword, ...(p.supporting_keywords || [])].slice(0, 3)
    })), null, 2) : "No blueprint available — generate fresh strategic structure."}

---

## INPUT 2: GSC KEYWORD CLUSTERS (VALIDATION & ENRICHMENT — THIS SUPPORTS)

Use this data to:
- Confirm which Blueprint topics have real demand
- Add opportunity_score, impressions, position metrics
- Identify 2-3 high-opportunity additions that fit category gaps

DO NOT use this to:
- Replace strategic topics with keyword-driven ones
- Create duplicate articles for similar keywords
- Override the Blueprint's category distribution

${JSON.stringify(clusters.slice(0, 30), null, 2)}

---

## FEATURE LIMIT (MANDATORY CONSTRAINT)

AT MOST 4 feature-led articles in the entire plan.

Feature-led = title mentions proprietary feature name, or primary purpose is explaining how a specific feature works.

Market-led topics (no limit) = address user questions that exist regardless of this specific product.

---

## BRAND VOICE (USE FOR TONE, NOT TOPICS)

Apply this voice when WRITING titles, not when CHOOSING topics.

- Product: ${brandData?.product_name || "Unknown Product"}
- Core Features: ${brandData?.core_features?.join(", ") || "Not specified"}
- Audience: ${brandData?.audience?.primary || "General audience"}
- What it is: ${brandData?.product_identity?.literally || "Not specified"}

---

## COMPETITOR CONTEXT (VALIDATION)

These are topics competitors cover. Use for validation, NOT as primary source.

${competitorSeeds?.length > 0 ? competitorSeeds.join(", ") : "No competitor data available"}

---

## CRITICAL RULES: You MUST output exactly 30 articles plan.

1. **MAINTAIN 12-8-6-4 DISTRIBUTION**:
   - 12 Core Answers (Foundational)
   - 8 Supporting Articles (How-tos, niche)
   - 6 Conversion Pages (Commercial, comparison)
   - 4 Authority Plays (Thought leadership)

2. **INTELLIGENT MERGING (NO DUPLICATES)**:
   - If GSC has "ai christmas photoshoot" and "christmas photoshoot ai", treat as ONE topic
   - Pick the higher-volume variant as primary keyword

3. **GSC FIELD MAPPING**:
   - \`gsc_query\`: EXACT \`primary_keyword\` from cluster (for data mapping)
   - \`badge\`: "quick_win", "high_impact", "low_ctr", or "new_opportunity"

4. **TITLE OPTIMIZATION**:
   - Human-first, decision-focused titles
   - No "Ultimate Guide to..." or "Everything About..."

## OUTPUT FORMAT (Strict JSON Array):
[
  {
    "article_category": "Core Answers|Supporting Articles|Conversion Pages|Authority Plays",
    "gsc_query": "exact query from cluster or null if Blueprint-only",
    "target_keyword": "primary keyword for SEO",
    "title": "string",
    "article_type": "informational|commercial|howto",
    "supporting_keywords": ["array"],
    "cluster": "topic cluster name",
    "opportunity_score": number,
    "badge": "quick_win|high_impact|low_ctr|new_opportunity|strategic",
    "reason": "1-sentence strategic rationale",
    "impact": "Low|Medium|High"
  }
]
Return ONLY the JSON array. No explanations.`
}


export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { brandData, competitorSeeds, brandName, existingPlan } = await req.json()

        // Get GSC connection
        const { data: connection } = await supabase
            .from("gsc_connections")
            .select("*")
            .eq("user_id", user.id)
            .single()

        if (!connection) {
            return NextResponse.json({ error: "GSC not connected" }, { status: 400 })
        }

        // Check if token is expired and refresh if needed
        let accessToken = connection.access_token
        const expiresAt = new Date(connection.expires_at)

        if (expiresAt < new Date()) {
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

        // Calculate date range (last 30 days)
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - 30)

        const dateRange = {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
        }

        // Fetch top 100 queries (we'll filter down)
        console.log("=== GSC PLAN GENERATION: Fetching queries ===")
        const queriesResponse = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...dateRange,
                    dimensions: ["query"],
                    rowLimit: 500,
                }),
            }
        )

        if (!queriesResponse.ok) {
            console.error("GSC queries fetch failed:", await queriesResponse.text())
            // Fallback: If GSC fails, verify if we can just return existing plan enriched? 
            // For now, return error to prompt user to retry or skip.
            return NextResponse.json({ error: "Failed to fetch GSC data" }, { status: 500 })
        }

        const queriesData = await queriesResponse.json()
        const rawQueries: GSCQueryRow[] = queriesData.rows || []

        console.log("Raw queries fetched:", rawQueries.length)

        // STEP 1: Filter garbage
        const filteredQueries = filterGarbageQueries(rawQueries, brandName)
        console.log("After filtering:", filteredQueries.length)

        // If no GSC data found, we should ideally handle this gracefully.
        // But the user is specifically here for GSC enhancement.
        if (filteredQueries.length === 0) {
            return NextResponse.json({ error: "No valid queries found after filtering. Your site may need more search data." }, { status: 400 })
        }

        // Find max impressions for normalization
        const maxImpressions = Math.max(...filteredQueries.map(q => q.impressions))

        // STEP 2 & 3: Tag intent and compute opportunity score
        const processedQueries: ProcessedQuery[] = filteredQueries.map(q => {
            const query = q.keys[0]
            const wordCount = query.split(/\s+/).length
            const expectedCtr = getExpectedCTR(q.position)
            return {
                query,
                impressions: q.impressions,
                clicks: q.clicks,
                ctr: q.ctr,
                position: q.position,
                intent: tagIntent(query),
                word_count: wordCount,
                expected_ctr: expectedCtr,
                opportunity_score: computeOpportunityScore(
                    q.impressions,
                    q.position,
                    q.ctr,
                    wordCount,
                    maxImpressions
                ),
            }
        })

        // STEP 4: Cluster similar queries
        const clusters = clusterQueries(processedQueries, maxImpressions)
        console.log("Clusters created:", clusters.length)

        // STEP 5: Generate 30-day plan using LLM with Blueprint
        const genAI = getGeminiClient()
        // Pass existingPlan to the prompt generator
        const prompt = generatePlanPrompt(clusters, brandData, competitorSeeds, existingPlan)

        console.log("=== Calling Gemini 2.5 Pro for strategic plan ===")

        const response = await genAI.models.generateContent({
            model: "gemini-2.0-flash", // Using Flash for speed/cost, works well for structured tasks
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        })

        const responseText = response.text || ""
        console.log("LLM response length:", responseText.length)

        // Parse LLM response
        let planData: any[]
        try {
            const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim()
            planData = JSON.parse(cleanedJson)
        } catch (e) {
            try {
                planData = JSON.parse(jsonrepair(responseText))
            } catch (e2) {
                console.error("Failed to parse LLM response:", responseText.slice(0, 500))
                return NextResponse.json({ error: "Failed to parse content plan from LLM" }, { status: 500 })
            }
        }

        // Transform to ContentPlanItem format with dates
        const today = new Date()

        // Filter duplicates before mapping
        const validPlanData: any[] = []
        for (const item of planData) {
            // Use Title + Query for rich signal
            const topicSignal = `${item.title || ""} : ${item.gsc_query || ""}`
            const { isDuplicate } = await checkTopicDuplication(topicSignal, user.id)

            if (!isDuplicate) {
                validPlanData.push(item)
            } else {
                console.log(`[GSC Plan] Skipped duplicate topic: ${topicSignal}`)
            }
            if (validPlanData.length >= 30) break
        }

        const contentPlan = validPlanData.slice(0, 30).map((item: any, index: number) => {
            const scheduledDate = new Date(today)
            scheduledDate.setDate(today.getDate() + index)

            // Find the matching cluster using the exact GSC query
            let matchingCluster = clusters.find(c => c.primary_keyword === item.gsc_query)

            // Fallback 1: Case-insensitive match
            if (!matchingCluster) {
                matchingCluster = clusters.find(c => c.primary_keyword.toLowerCase().trim() === item.gsc_query.toLowerCase().trim())
            }

            // Fallback 2: Substring match (if LLM modified query slightly)
            if (!matchingCluster) {
                // Be tighter with substring matching to avoid bad associations
                matchingCluster = clusters.find(c =>
                    item.gsc_query.toLowerCase().includes(c.primary_keyword.toLowerCase()) && c.primary_keyword.length > 5
                )
            }

            // Use target_keyword if provided, otherwise fall back to gsc_query
            const mainKeyword = item.target_keyword || item.gsc_query

            return {
                id: `gsc-plan-${Date.now()}-${index}`,
                title: item.title,
                main_keyword: mainKeyword,
                gsc_query: item.gsc_query, // Original GSC query for reference
                supporting_keywords: item.supporting_keywords || matchingCluster?.supporting_keywords || [],
                article_type: ["informational", "commercial", "howto"].includes(item.article_type)
                    ? item.article_type
                    : "informational",
                intent: item.article_type,
                article_category: item.article_category || "Core Answers", // Ensure category exists
                cluster: item.cluster,
                scheduled_date: scheduledDate.toISOString().split("T")[0],
                status: "pending",
                // GSC data - now using gsc_query for lookup (guaranteed match)
                opportunity_score: item.opportunity_score || matchingCluster?.opportunity_score || 0,
                badge: item.badge,
                gsc_impressions: matchingCluster?.impressions || 0,
                gsc_position: matchingCluster?.position || 0,
                gsc_ctr: matchingCluster?.ctr || 0,
                reason: item.reason,
                impact: item.impact,
            }
        })


        console.log("=== GSC PLAN GENERATED ===")
        console.log("Total items:", contentPlan.length)
        console.log("Categories:", contentPlan.map((p: any) => p.article_category).reduce((acc: any, c: string) => ({ ...acc, [c]: (acc[c] || 0) + 1 }), {}))

        return NextResponse.json({ plan: contentPlan })

    } catch (error: any) {
        console.error("GSC plan generation error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to generate content plan" },
            { status: 500 }
        )
    }
}
