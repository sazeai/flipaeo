import { createClient } from "@/utils/supabase/server"
import { getGeminiClient } from "@/utils/gemini/geminiClient"
import { ContentPlanItem } from "@/lib/schemas/content-plan"
import { BrandDetails } from "@/lib/schemas/brand"
import { checkTopicDuplication } from "@/lib/topic-memory"
import { getCoverageContext, summarizeCoverage } from "@/lib/coverage/analyzer"
import { detectContentStage, getStrategyPrompt } from "@/lib/plans/strategy-detector"
import { scheduleByCluster, consolidateClusters } from "@/lib/plans/cluster-scheduler"
import { TopicHierarchy } from "@/lib/plans/topic-hierarchy"

// Strategic Article Category Distribution (30 = 12 + 8 + 6 + 4)
export const ARTICLE_CATEGORIES = {
    "Core Answers": {
        count: 12,
        description: "Foundation articles that establish topical authority",
        intentRoles: ["Core Answer", "Definition"],
        articleType: "informational" as const,
        prompt: "Answer fundamental 'What is X?' and 'How does X work?' questions"
    },
    "Supporting Articles": {
        count: 8,
        description: "Deepen existing coverage with specific problems and tutorials",
        intentRoles: ["Problem-Specific", "How-To"],
        articleType: "howto" as const,
        prompt: "Create step-by-step guides and solve specific user problems"
    },
    "Conversion Pages": {
        count: 6,
        description: "Commercial intent - comparisons and buying decisions",
        intentRoles: ["Comparison", "Decision"],
        articleType: "commercial" as const,
        prompt: "Help users choose between options and make buying decisions"
    },
    "Authority Plays": {
        count: 4,
        description: "Edge cases, deep expertise, and emotional stories",
        intentRoles: ["Authority/Edge", "Emotional/Story"],
        articleType: "informational" as const,
        prompt: "Establish expert positioning with edge cases and compelling stories"
    }
} as const

interface GeneratePlanParams {
    userId: string
    brandId: string | null
    brandData: BrandDetails
    seeds: string[]
    competitorBrands?: Array<{ name: string; url?: string }>
    gapAnalysis?: {
        blueOceanTopics?: string[]
        saturatedTopics?: string[]
        competitorWeaknesses?: string[]
    }
    topicHierarchy?: TopicHierarchy
    existingContent?: string[]
}

interface GeneratePlanResult {
    plan: ContentPlanItem[]
    categoryDistribution: Record<string, number>
}

/**
 * Core logic for generating a 30-day strategic content plan.
 * Used by both the API route (onboarding) and the Scheduler (auto-refill).
 */
export async function generateContentPlan({
    userId,
    brandId,
    brandData,
    seeds,
    competitorBrands = [],
    gapAnalysis = {},
    topicHierarchy,
    existingContent = []
}: GeneratePlanParams): Promise<GeneratePlanResult> {
    const today = new Date()
    const client = getGeminiClient()
    const currentDate = `${today.toLocaleDateString('en-US', { month: 'long' })} ${today.getFullYear()}`

    // --- STEP 1: FETCH EXISTING COVERAGE ---
    console.log("[Content Plan] Fetching existing coverage context...")
    const coverageData = await getCoverageContext(userId, brandId)
    const { stronglyAnswered } = summarizeCoverage(coverageData)

    // Combine database coverage with sitemap-provided existing content
    const allCoveredQuestions = [
        ...stronglyAnswered,
        ...existingContent
    ]

    console.log(`[Content Plan] Total covered questions: ${allCoveredQuestions.length}`)

    // Build coverage clusters: SATURATED / PARTIAL / EMPTY
    const coverageSection = allCoveredQuestions.length > 0
        ? `
## COVERAGE STATE (CRITICAL - READ CAREFULLY)

The following parent questions are ALREADY COVERED on the user's site.
DO NOT create articles that simply re-answer these questions.

**SATURATED (DO NOT TARGET DIRECTLY):**
${allCoveredQuestions.slice(0, 20).map(q => `- "${q}"`).join('\n')}
${allCoveredQuestions.length > 20 ? `\n... and ${allCoveredQuestions.length - 20} more covered questions` : ''}

**YOUR STRATEGY:**
- For saturated topics: Only create EXPANSION articles (edge cases, comparisons, specific problems)
- For new topics: Create Core Answers FIRST
- DO NOT duplicate existing coverage

**EXPANSION RULES (For saturated topics):**
a) Expand the perimeter (new sub-question)
b) Support internally (linking-focused article)
c) Attack a comparison (X vs Y)
d) Address edge cases (why X fails)
`
        : ""

    // --- STEP 2: DETECT CONTENT STAGE (GSC-ONLY) ---
    console.log("[Content Plan] Detecting content stage...")
    const { stage, hasGSC } = await detectContentStage(userId)
    const strategySection = getStrategyPrompt(stage, hasGSC)
    console.log(`[Content Plan] Stage: ${stage}, GSC Connected: ${hasGSC}`)

    // --- STEP 3: BUILD STRATEGIC PROMPT ---
    const categorySection = Object.entries(ARTICLE_CATEGORIES).map(([category, config]) => {
        return `### ${category} (~${config.count} articles)
Purpose: ${config.description}
Intent Roles: ${config.intentRoles.join(", ")}
Focus: ${config.prompt}`
    }).join('\n\n')

    // Format competitor brands section
    const competitorSection = competitorBrands.length > 0
        ? `
## COMPETITOR BRANDS (FOR VS-ARTICLES - USE EXACT NAMES)

These are REAL competitors identified from search results:
${competitorBrands.map(c => `- ${c.name}${c.url ? ` (${c.url})` : ''}`).join('\n')}

RULES:
- Use EXACT competitor names in comparison articles (e.g., "${brandData.product_name} vs ${competitorBrands[0]?.name || 'Competitor'}")
- DO NOT use placeholders like "[Generic Competitor Tool]"
- Create at least 2-3 comparison articles against these competitors
`
        : ""

    // Format gap analysis section
    const gapSection = (gapAnalysis.blueOceanTopics?.length || gapAnalysis.competitorWeaknesses?.length)
        ? `
## GAP ANALYSIS (STRATEGIC INTELLIGENCE)

${gapAnalysis.blueOceanTopics?.length ? `**BLUE OCEAN OPPORTUNITIES (PRIORITIZE THESE):**
Topics with low/no competitor coverage - easy wins:
${gapAnalysis.blueOceanTopics.slice(0, 10).map(t => `- ${t}`).join('\n')}
` : ''}

${gapAnalysis.competitorWeaknesses?.length ? `**COMPETITOR WEAKNESSES (ATTACK THESE):**
Topics where competitors are weak - opportunity for better content:
${gapAnalysis.competitorWeaknesses.slice(0, 5).map(t => `- ${t}`).join('\n')}
` : ''}

${gapAnalysis.saturatedTopics?.length ? `**SATURATED TOPICS (AVOID OR DO 10X BETTER):**
Heavy competition - only target if you have unique angle:
${gapAnalysis.saturatedTopics.slice(0, 5).map(t => `- ${t}`).join('\n')}
` : ''}
`
        : ""

    const prompt = `
You are an elite SEO strategist building a STRATEGIC content plan. [Current Date: ${currentDate}]

---

## STRATEGIC PRIORITY (READ FIRST — THIS DEFINES YOUR MINDSET)

You are NOT here to explain product features.
You are here to CAPTURE MARKET DEMAND and EXPAND TOPICAL AUTHORITY.

Your job:
1. Enter conversations where the audience ALREADY exists
2. Answer questions the audience is ALREADY asking
3. Fill gaps that competitors have NOT covered

Brand features should ONLY appear when they naturally support existing demand.
Do NOT create articles just to explain features unless explicit demand exists.

THINK LIKE A STRATEGIST:
- What must exist on this site BEFORE other articles make sense?
- What questions MUST be answered for the audience to trust this brand?
- What will AI systems cite as the CANONICAL answer?

---

## DECISION-STAGE CONTENT (AI CITATION PRIORITY)

AI systems cite content that answers DECISION questions, not curiosity questions.

PRIORITIZE these question patterns:
- "Should I use X?" (Decision)
- "When should I NOT use X?" (Risk awareness)
- "What can go wrong with X?" (Objection handling)
- "X vs Y - which is better for Z?" (Comparison)
- "How much does X cost?" (Practical)
- "Is X worth it for [specific situation]?" (Contextual decision)

DEPRIORITIZE these patterns:
- "What is X?" (Only 1-2 if truly foundational)
- "Why X is cool/amazing" (Low citation value)
- "The future of X" (Speculative, not actionable)

---

${strategySection}

${competitorSection}

${gapSection}

${coverageSection}

${topicHierarchy ? `
## THE BLUEPRINT: TOPIC HIERARCHY (MANDATORY)
Follow this hierarchy EXACTLY. For each topic provided, generate the necessary SEO metadata.

**TOPICS TO GENERATE:**
${topicHierarchy.nodes.map((n: any) => `- Topic: "${n.topic}" (Type: ${n.type}, Intent: ${n.intentRole}, Priority: ${n.priority})`).join('\n')}

**RULES:**
1. You MUST generate exactly one article for each Topic in the list above.
2. DO NOT invent new topics if the hierarchy has 30 topics.
3. The "cluster" for each article should group related topics logically (e.g., all topics about "Privacy" go into a "Privacy" cluster).
` : ''}

## SEED KEYWORDS (VALIDATION ONLY)
Use these to confirm demand exists, NOT to drive topic selection.
The GAP ANALYSIS above is your primary strategic source.

${seeds.join("\\n")}

---

## BRAND VOICE (USE FOR TONE, NOT TOPICS)

Apply this voice when WRITING titles, not when CHOOSING topics.
Topics come from MARKET DEMAND (above). Brand voice shapes HOW you write.

- Product: ${brandData.product_name}
- Core Features: ${brandData.core_features?.join(", ") || "Not specified"}
- Audience: ${brandData.audience.primary}
- What it is: ${brandData.product_identity.literally}

---




## THE GROUNDING PRINCIPLE (MANDATORY)

You are strictly forbidden from inventing features, capabilities, or claims about this brand.
Every article topic and claim must be directly supported by the brand data provided.

1. **STRICT GROUNDING:** Do not assume the product has any feature, tool, or integration not explicitly mentioned in the "Core Features" or "What it is" sections.
2. **NO INVENTED STANDARDS:** Do not write about legal, technical, or industry standards (e.g. HIPAA, ISO, specialized certifications) unless the brand explicitly claims them.
3. **NO GUESSWORK:** If you aren't 100% sure the brand does something, don't include it in the plan.
4. **BRAND HONESTY:** It is better to have a shorter, more focused plan than one filled with "creative" guesses that are factually incorrect.

If an article title or keyword implies a capability the brand does not clearly have, the plan is invalid.


## FEATURE LIMIT (MANDATORY CONSTRAINT)

You may create AT MOST 4 feature-led articles in the entire 30-day plan.

A "feature-led article" is one where:
- The title mentions a proprietary feature name (e.g., "Identity-Lock™")
- The primary purpose is explaining how a specific feature works
- The topic wouldn't exist without this specific product

Examples of feature-led (COUNT TOWARD LIMIT):
- "What is AI Identity-Lock™ Protocol"
- "How Multi-Ratio Formatting Works"

Examples of market-led (DO NOT COUNT):
- "AI Headshots vs Professional Photography: Cost Breakdown"
- "Why Your LinkedIn Photo Isn't Getting Responses"

If you create more than 4 feature-led articles, the plan is INVALID.

---

## THE 4 STRATEGIC CATEGORIES (TARGET DISTRIBUTION: ~12 + ~8 + ~6 + ~4 = 30)

Aim for this distribution, but prioritize QUALITY over exact counts:

${categorySection}

If you have strong ideas that don't fit the exact count, adjust slightly. Quality > rigid quotas.

---

## ANTI-CANNIBALIZATION RULES (CRITICAL)

Each article must answer a DIFFERENT parent question. Examples of SAME parent question (BAD):
- "How to restore old photos" = "What is AI photo restoration" = "Does AI enhancement work"
These all answer: "Can AI restore my photos?"

Examples of DIFFERENT parent questions (GOOD):
- "Can AI restore my photos?" (Core Answer)
- "How much does restoration cost?" (Core Answer - DIFFERENT)
- "AI vs professional restoration?" (Conversion)
- "Why some photos can't be restored?" (Authority)

---

## TITLE RULES (MODERN SEO - 2025)

Create titles that DOMINATE in modern AI-powered search:

1. Use SPECIFIC numbers: "7 Ways..." not "Ways..."
2. Include YEAR when relevant: "...in 2025"
3. Attack a PAIN POINT: "Why Your [X] Keeps Failing"
4. Use POWER WORDS: "Proven", "Exact", "Secret", "Without", "Actually"
5. Keep under 60 characters

FORMAT PATTERNS (use variety):
- How-To: "How to [X] Without [Pain Point]"
- List: "[Number] [Adjective] Ways to [Benefit]"
- Comparison: "[X] vs [Y]: Which [Benefit] Better?"
- Question: "Is [X] Worth It? (Real Data Inside)"
- Problem: "Why [Common Approach] Doesn't Work (And What Does)"
- Contrarian: "[X] is Dead—Here's What Actually Works"

BANNED PATTERNS (NEVER USE):
- "What is X? (Explained)" - Too generic, boring
- "Ultimate Guide to X" - Overused, ignored by searchers
- "Everything You Need to Know About X" - Vague, no hook
- "A Comprehensive Look at X" - Academic, not engaging
- "The Complete Guide to X" - Same as ultimate guide

---

## YOUR TASK

Generate EXACTLY 30 articles distributed as follows (NO EXCEPTIONS):
- Core Answers: 12 articles (EMPTY parent questions only)
- Supporting Articles: 8 articles (expand coverage with how-tos)
- Conversion Pages: 6 articles (comparisons, decisions)
- Authority Plays: 4 articles (edge cases, stories)

For each article provide:
1. title: Compelling blog post title (follow MODERN SEO rules above)
2. main_keyword: Primary target keyword (2-4 words)
3. supporting_keywords: 2-3 related keywords (array)
4. article_type: "informational" | "commercial" | "howto"
5. cluster: Topic cluster for organization
6. intent_role: The specific intent ("Core Answer", "Problem-Specific", "Comparison", "Decision", "Emotional/Story", "Authority/Edge")
7. article_category: One of "Core Answers", "Supporting Articles", "Conversion Pages", "Authority Plays"
8. parent_question: The ONE fundamental user question this article answers

## CRITICAL REQUIREMENTS:
1. Each article's parent_question must be UNIQUE across the plan.
2. If the brand has multiple features, articles must be distributed across ALL features.
3. You MUST generate EXACTLY 30 articles with the 12-8-6-4 distribution.
`

    const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    posts: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                title: { type: "STRING" },
                                main_keyword: { type: "STRING" },
                                supporting_keywords: {
                                    type: "ARRAY",
                                    items: { type: "STRING" }
                                },
                                article_type: { type: "STRING" },
                                cluster: { type: "STRING" },
                                intent_role: { type: "STRING" },
                                article_category: { type: "STRING" },
                                parent_question: { type: "STRING" }
                            },
                            required: ["title", "main_keyword", "supporting_keywords", "article_type", "cluster", "intent_role", "article_category", "parent_question"]
                        }
                    }
                },
                required: ["posts"]
            }
        }
    })

    const text = response.text || "{}"
    const result = JSON.parse(text)

    // Process posts and check for duplicates
    const validPosts: any[] = []
    const posts = result.posts || []

    // Track distribution
    const categoryDistribution: Record<string, number> = {
        "Core Answers": 0,
        "Supporting Articles": 0,
        "Conversion Pages": 0,
        "Authority Plays": 0
    }
    const seenParentQuestions = new Set<string>()

    for (const post of posts) {
        // Skip if parent question already seen in this plan
        const normalizedPQ = (post.parent_question || "").toLowerCase().trim()
        if (seenParentQuestions.has(normalizedPQ)) {
            console.log(`[Content Plan] Skipped duplicate parent question: ${post.parent_question}`)
            continue
        }

        // Check duplication against existing articles
        const topicSignal = `${post.title || ""} : ${post.main_keyword || ""}`
        const { isDuplicate } = await checkTopicDuplication(topicSignal, userId, brandId)

        if (!isDuplicate) {
            validPosts.push(post)
            seenParentQuestions.add(normalizedPQ)

            // Track distribution
            const category = post.article_category || "Core Answers"
            if (category in categoryDistribution) {
                categoryDistribution[category]++
            }
        } else {
            console.log(`[Content Plan] Skipped duplicate topic: ${post.title}`)
        }

        if (validPosts.length >= 30) break
    }

    // Ensure minimum 30 posts - fallback if dedup too aggressive
    if (validPosts.length < 20 && posts.length >= 30) {
        console.warn("[Content Plan] Deduplication too aggressive, using additional posts")
        for (const post of posts) {
            if (validPosts.length >= 30) break
            if (!validPosts.includes(post)) {
                validPosts.push(post)
                const category = post.article_category || "Core Answers"
                if (category in categoryDistribution) {
                    categoryDistribution[category]++
                }
            }
        }
    }

    // --- CATEGORY-AWARE TOP-UP LOOP ---
    // If we have fewer than 30 articles, make a second call with specific category requirements
    if (validPosts.length < 30 && validPosts.length >= 15) {
        const targetDistribution = {
            "Core Answers": 12,
            "Supporting Articles": 8,
            "Conversion Pages": 6,
            "Authority Plays": 4
        }

        const neededByCategory = {
            "Core Answers": Math.max(0, targetDistribution["Core Answers"] - categoryDistribution["Core Answers"]),
            "Supporting Articles": Math.max(0, targetDistribution["Supporting Articles"] - categoryDistribution["Supporting Articles"]),
            "Conversion Pages": Math.max(0, targetDistribution["Conversion Pages"] - categoryDistribution["Conversion Pages"]),
            "Authority Plays": Math.max(0, targetDistribution["Authority Plays"] - categoryDistribution["Authority Plays"])
        }

        const totalNeeded = 30 - validPosts.length

        console.log(`[Content Plan] Only ${validPosts.length} articles generated, requesting ${totalNeeded} more...`)
        console.log(`[Content Plan] Needed by category:`, neededByCategory)

        const existingTitles = validPosts.map(p => p.title).join('\n')

        const topUpPrompt = `
You must generate EXACTLY ${totalNeeded} more articles to complete a 30-day content plan.

## CATEGORY REQUIREMENTS (MANDATORY)
Generate articles in these specific categories:
${neededByCategory["Core Answers"] > 0 ? `- Core Answers: ${neededByCategory["Core Answers"]} more needed` : ''}
${neededByCategory["Supporting Articles"] > 0 ? `- Supporting Articles: ${neededByCategory["Supporting Articles"]} more needed` : ''}
${neededByCategory["Conversion Pages"] > 0 ? `- Conversion Pages: ${neededByCategory["Conversion Pages"]} more needed` : ''}
${neededByCategory["Authority Plays"] > 0 ? `- Authority Plays: ${neededByCategory["Authority Plays"]} more needed` : ''}

## BRAND CONTEXT
- Product: ${brandData.product_name}
- Features: ${brandData.core_features?.join(", ") || "Not specified"}
- Audience: ${brandData.audience.primary}

## EXISTING ARTICLES (DO NOT DUPLICATE)
${existingTitles}

## YOUR TASK
Generate EXACTLY ${totalNeeded} unique articles following the category requirements above.
Each article needs: title, main_keyword, supporting_keywords, article_type, cluster, intent_role, article_category, parent_question
`

        try {
            const topUpResponse = await client.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: topUpPrompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            posts: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        title: { type: "STRING" },
                                        main_keyword: { type: "STRING" },
                                        supporting_keywords: { type: "ARRAY", items: { type: "STRING" } },
                                        article_type: { type: "STRING" },
                                        cluster: { type: "STRING" },
                                        intent_role: { type: "STRING" },
                                        article_category: { type: "STRING" },
                                        parent_question: { type: "STRING" }
                                    },
                                    required: ["title", "main_keyword", "article_type", "article_category"]
                                }
                            }
                        },
                        required: ["posts"]
                    }
                }
            })

            const topUpText = topUpResponse.text || "{}"
            const topUpResult = JSON.parse(topUpText)
            const additionalPosts = topUpResult.posts || []

            console.log(`[Content Plan] Top-up generated ${additionalPosts.length} additional articles`)

            for (const post of additionalPosts) {
                if (validPosts.length >= 30) break
                // Skip duplicates
                const isDupe = validPosts.some(p => p.title === post.title || p.main_keyword === post.main_keyword)
                if (!isDupe) {
                    validPosts.push(post)
                    const category = post.article_category || "Core Answers"
                    if (category in categoryDistribution) {
                        categoryDistribution[category]++
                    }
                }
            }

            console.log(`[Content Plan] After top-up: ${validPosts.length} total articles`)
        } catch (topUpError) {
            console.error("[Content Plan] Top-up failed:", topUpError)
        }
    }

    console.log(`[Content Plan] Final Category Distribution:`, categoryDistribution)

    // Add metadata and IDs
    const rawItems = validPosts.map((post: any, index: number) => {
        // Validate article_type
        const validTypes = ["informational", "commercial", "howto"]
        const articleType = validTypes.includes(post.article_type) ? post.article_type : "informational"

        // Validate article_category
        const validCategories = ["Core Answers", "Supporting Articles", "Conversion Pages", "Authority Plays"]
        const articleCategory = validCategories.includes(post.article_category)
            ? post.article_category
            : "Core Answers"

        return {
            id: `plan-${Date.now()}-${index}`,
            title: post.title || `Post ${index + 1}`,
            main_keyword: post.main_keyword || "",
            supporting_keywords: post.supporting_keywords || [],
            article_type: articleType as "informational" | "commercial" | "howto",
            cluster: post.cluster || "General",
            intent_role: post.intent_role || "Core Answer",
            article_category: articleCategory as "Core Answers" | "Supporting Articles" | "Conversion Pages" | "Authority Plays"
        }
    })

    // --- STEP 6: STRATEGIC SCHEDULING (NEW) ---
    console.log("[Content Plan] Applying Cluster-first scheduling...")

    // First, consolidate small clusters for better authority
    const consolidated = consolidateClusters(rawItems, 3, 8)

    // Then schedule by cluster
    const scheduledPlan = scheduleByCluster(consolidated, today)

    return { plan: scheduledPlan as ContentPlanItem[], categoryDistribution }
}
