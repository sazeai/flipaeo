import { getGeminiClient } from "@/utils/gemini/geminiClient"
import { ContentPlanItem } from "@/lib/schemas/content-plan"
import { BrandDetails } from "@/lib/schemas/brand"

/**
 * Strategic Planner - Revamped content plan generation using mega-prompt approach.
 * 
 * Replaces the old 5-phase pipeline (Seeds → SERP → Gap → Hierarchy → Generator)
 * with a single strategic prompt that produces persona-driven, interconnected content.
 */

export interface StrategicPlanParams {
    brandData: BrandDetails
    brandUrl?: string
    competitorBrands: Array<{ name: string; url?: string }>
    existingContent?: string[]
}

export interface StrategicPlanResult {
    contentGapAnalysis: string
    plan: ContentPlanItem[]
    categoryDistribution: Record<string, number>
}

/**
 * Generate a strategic 30-day content plan using the mega-prompt approach.
 * This produces persona-driven, interconnected content plans instead of abstract keyword lists.
 */
export async function generateStrategicPlan({
    brandData,
    brandUrl,
    competitorBrands = [],
    existingContent = []
}: StrategicPlanParams): Promise<StrategicPlanResult> {
    const client = getGeminiClient()
    const today = new Date()
    const currentDate = `${today.toLocaleDateString('en-US', { month: 'long' })} ${today.getFullYear()}`

    // Format competitor section
    const competitorSection = competitorBrands.length > 0
        ? `## Known Competitors (Use for Comparison Articles)
${competitorBrands.slice(0, 10).map(c => `- ${c.name}${c.url ? ` (${c.url})` : ''}`).join('\n')}

Use EXACT competitor names in comparison articles. Create at least 2-3 "X vs Y" articles.`
        : `No specific competitors identified. Focus on generic comparison patterns like "AI vs Traditional".`

    // Format existing content section
    const existingContentSection = existingContent.length > 0
        ? `## Existing Content (DO NOT DUPLICATE)
The brand already has content on these topics:
${existingContent.slice(0, 20).map(c => `- ${c}`).join('\n')}

Create EXPANSION content, not duplicate coverage.`
        : ``

    const megaPrompt = `
## Context
You are analyzing a brand: ${brandData.product_name}
${brandUrl ? `Website: ${brandUrl}` : ''}
Current Date: ${currentDate}

## Brand Intelligence (HIGH-LEVEL ONLY)
- **Product:** ${brandData.product_name} - ${brandData.product_identity.literally}
- **What it is (literally):** ${brandData.product_identity.literally}
- **Category:** ${brandData.category || 'SaaS Software'}
- **Primary Audience:** ${brandData.audience.primary}
- **The Problem We Solve:** ${Array.isArray(brandData.uvp) ? brandData.uvp.slice(0, 2).join(', ') : brandData.uvp}
- **Core Features:** ${Array.isArray(brandData.core_features) ? brandData.core_features.join(', ') : brandData.core_features}

here are the competitor brands:
${competitorSection}

here is the existing content which is already been published by the brand:
${existingContentSection}

---

## Your Role
Senior SEO Strategist. Your goal: Create a 30-day content plan based on **REAL SEARCH QUERIES** users type into Google and AI assistants.

## CRITICAL: What Makes a GOOD Content Plan

### ✅ GOOD Keyword Examples (Real queries people search):
- "best AI headshot generator 2026"
- "how to get professional headshots without a photographer"
- "AI headshots vs professional photographer cost"
- "do AI headshots look fake on LinkedIn"
- "corporate headshot poses male"

### ❌ BAD Keyword Examples (Nobody searches these):
- "money back guarantee AI photos" ← Not a search query
- "our privacy policy" ← Self-promotional
- "how nano-texture engine works" ← Brand-specific jargon
- "why we delete your data" ← Self-promotional sales copy
- "what our users say" ← Testimonials are not SEO content

## The 4 Content Categories (Strict Distribution)

### 1. Core Answers (12 articles)
Educational "hub" content. Example queries:
- "what are AI headshots"
- "are AI generated photos legal to use"
- "how long do AI headshots take"

### 2. Supporting Articles (8 articles)
Specific how-to guides. Example queries:
- "how to take good photos for AI headshot"
- "best outfit for professional headshot"
- "how to smile naturally in photos"

### 3. Conversion Pages (6 articles)
Persona + comparison content. Example queries:
- "AI headshots for realtors"
- "HeadshotPro vs [competitor]"
- "best AI headshot for LinkedIn 2026"

### 4. Authority Plays (4 articles)
Data-driven thought leadership. Example queries:
- "AI headshot industry statistics 2026"
- "study: do recruiters prefer professional photos"

---

## MANDATORY CONSTRAINTS

### 1. Title Length: MAXIMUM 60 CHARACTERS
- ❌ BANNED: "Data Study of Ten Thousand Users Shows That Authentic AI Photos Increase Recruiter Response by Forty Percent" (107 chars!)
- ✅ GOOD: "Do AI Photos Hurt Your LinkedIn Response Rate?" (46 chars)

### 2. Keywords Must Be REAL Search Queries
- Test: Would a real person type this into Google?
- ❌ "nano texture engine explained" ← Brand feature, not a search
- ✅ "why do AI photos look so fake" ← Real user question

### 3. NO Self-Promotional Content
- ❌ "What our customers say about us"
- ❌ "Why our money-back guarantee matters"
- ❌ "How [brand name] works"
- ✅ "How AI headshot generators work" (generic, educational)

### 4. Supporting Keywords: Provide 3-5 Related Queries
Each article must have \`supporting_keywords\` array with related search terms.

### 5. Impact Must Vary
- **High** (10 articles): Highest traffic potential, core topics
- **Medium** (15 articles): Supporting content
- **Low** (5 articles): Niche or experimental topics

### 6. Reason Field = STRATEGIC RATIONALE (Not the hook!)
Explain WHY this article is strategically important:
- ❌ "Stop settling for rubbery skin..." (this is a hook)
- ✅ "High-volume query with low competition; establishes authority on core category question"

### 7. Connected_to = Article Day Numbers (Not titles)
Use integers: \`[1, 5, 12]\` not \`["day-1", "day-5"]\`

---

## Phased Rollout

- **Days 1-7 (Foundation):** Core category definitions, "what is X" content
- **Days 8-14 (Use-Case):** Persona-specific and problem-solving content
- **Days 15-21 (Technical):** How-to guides, process content
- **Days 22-30 (Trust):** Comparisons, alternatives, decision content

---

## Deep Analysis Requirement

BEFORE the plan, provide ~150 words analyzing:
- What high-traffic queries is the brand missing?
- What comparison keywords should they target?
- What user questions remain unanswered by competitors?

---

## Output Format

Return JSON with:
1. \`content_gap_analysis\`: Your analysis
2. \`plan\`: Array of 30 articles

Each article schema:
\`\`\`json
{
  "day": 1,
  "phase": "Foundation",
  "category": "Core Answers",
  "main_keyword": "what are AI headshots",
  "supporting_keywords": ["AI generated photos", "AI portrait generator", "fake headshots AI"],
  "title": "What Are AI Headshots? Everything You Need to Know",
  "hook": "One-sentence user benefit",
  "reason": "Strategic rationale explaining traffic potential and competitive advantage",
  "user_intent": "Informational",
  "impact": "High",
  "connected_to": [2, 5, 8],
  "cluster": "Category Fundamentals",
  "article_type": "informational"
}
\`\`\`

---

## FINAL CHECKLIST
Before finalizing, verify:
- [ ] ALL titles are under 60 characters
- [ ] NO self-promotional content (testimonials, pricing, guarantees)
- [ ] Keywords are REAL search queries (test: would someone Google this?)
- [ ] \`supporting_keywords\` has 3-5 items per article
- [ ] \`reason\` explains strategy, NOT repeat the hook
- [ ] \`impact\` is properly distributed (10 High, 15 Medium, 5 Low)
- [ ] \`connected_to\` uses day numbers as integers
- [ ] At least 3 competitor comparison articles with real names
- [ ] At least 3 persona-specific articles (realtors, doctors, actors, etc.)
`

    try {
        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: "user", parts: [{ text: megaPrompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        content_gap_analysis: {
                            type: "STRING",
                            description: "150-word analysis of content gaps"
                        },
                        plan: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    day: { type: "INTEGER" },
                                    phase: { type: "STRING" },
                                    category: { type: "STRING" },
                                    main_keyword: { type: "STRING" },
                                    supporting_keywords: {
                                        type: "ARRAY",
                                        items: { type: "STRING" }
                                    },
                                    title: { type: "STRING" },
                                    hook: { type: "STRING" },
                                    reason: { type: "STRING" },
                                    user_intent: { type: "STRING" },
                                    impact: { type: "STRING" },
                                    connected_to: {
                                        type: "ARRAY",
                                        items: { type: "INTEGER" }
                                    },
                                    cluster: { type: "STRING" },
                                    article_type: { type: "STRING" }
                                },
                                required: ["day", "phase", "category", "main_keyword", "supporting_keywords", "title", "hook", "reason", "user_intent", "impact", "connected_to", "cluster", "article_type"]
                            }
                        }
                    },
                    required: ["content_gap_analysis", "plan"]
                }
            }
        })

        const text = response.text || "{}"
        const result = JSON.parse(text)

        // Transform raw plan into ContentPlanItem format
        const planItems: ContentPlanItem[] = (result.plan || []).map((item: any, index: number) => {
            const scheduledDate = new Date(today)
            scheduledDate.setDate(today.getDate() + (item.day - 1))

            return {
                id: `plan-${Date.now()}-${index}`,
                title: item.title || `Article ${index + 1}`,
                main_keyword: item.main_keyword || "",
                supporting_keywords: item.supporting_keywords || [],
                article_type: validateArticleType(item.article_type),
                cluster: item.cluster || "General",
                scheduled_date: scheduledDate.toISOString().split('T')[0],
                status: "pending" as const,
                // Strategic planner fields
                article_category: validateCategory(item.category),
                phase: validatePhase(item.phase),
                hook: item.hook || "",
                user_intent: validateUserIntent(item.user_intent),
                connected_to: (item.connected_to || []).map((d: number) => d), // Keep as integers
                // New fields from improved prompt
                impact: validateImpact(item.impact),
                reason: item.reason || "Strategic content for topic cluster authority."
            }
        })

        // Calculate distribution
        const categoryDistribution: Record<string, number> = {
            "Core Answers": 0,
            "Supporting Articles": 0,
            "Conversion Pages": 0,
            "Authority Plays": 0
        }
        for (const item of planItems) {
            const cat = item.article_category || "Core Answers"
            if (cat in categoryDistribution) {
                categoryDistribution[cat]++
            }
        }


        return {
            contentGapAnalysis: result.content_gap_analysis || "",
            plan: planItems,
            categoryDistribution
        }

    } catch (error) {
        console.error("[Strategic Planner] Generation failed:", error)
        throw error
    }
}

// Validation helpers
function validateArticleType(type: string): "informational" | "commercial" | "howto" {
    const valid = ["informational", "commercial", "howto"]
    return valid.includes(type) ? type as any : "informational"
}

function validateCategory(category: string): "Core Answers" | "Supporting Articles" | "Conversion Pages" | "Authority Plays" {
    const valid = ["Core Answers", "Supporting Articles", "Conversion Pages", "Authority Plays"]
    return valid.includes(category) ? category as any : "Core Answers"
}

function validatePhase(phase: string): "Foundation" | "Use-Case" | "Technical" | "Trust" {
    const valid = ["Foundation", "Use-Case", "Technical", "Trust"]
    return valid.includes(phase) ? phase as any : "Foundation"
}

function validateUserIntent(intent: string): "Informational" | "Transactional" | "Commercial Investigation" {
    const valid = ["Informational", "Transactional", "Commercial Investigation"]
    return valid.includes(intent) ? intent as any : "Informational"
}

function validateImpact(impact: string): "High" | "Medium" | "Low" {
    const valid = ["High", "Medium", "Low"]
    return valid.includes(impact) ? impact as any : "Medium"
}

/**
 * Rejected item structure for replacement generation
 */
export interface RejectedItem {
    rejected_keyword: string
    rejected_title: string
    reason: string
    phase?: string
    category?: string
    cluster?: string
}

/**
 * Generate replacement articles for rejected duplicates.
 * This is called when the bouncer rejects items and we need replacements to hit 30 articles.
 */
export async function generateReplacementArticles({
    brandData,
    rejectedItems,
    existingPlanKeywords
}: {
    brandData: BrandDetails
    rejectedItems: RejectedItem[]
    existingPlanKeywords: string[] // Keywords from the verified plan so far
}): Promise<ContentPlanItem[]> {
    const client = getGeminiClient()
    const today = new Date()
    const count = rejectedItems.length

    if (count === 0) return []

    // Format rejected items with reasons for the LLM
    const rejectedList = rejectedItems.map((item, i) =>
        `${i + 1}. REJECTED: "${item.rejected_keyword}" (Title: "${item.rejected_title}")
   - Reason: ${item.reason}
   - Was in phase: ${item.phase || 'Unknown'}, category: ${item.category || 'Unknown'}, cluster: ${item.cluster || 'Unknown'}`
    ).join('\n\n')

    // Format existing plan keywords so LLM doesn't repeat them
    const existingList = existingPlanKeywords.slice(0, 30).map(k => `- ${k}`).join('\n')

    const replacementPrompt = `
## Context
You previously generated a content plan for: ${brandData.product_name}
${count} articles were REJECTED because they were too similar to existing content.

## REJECTED ARTICLES (DO NOT SUGGEST ANYTHING SIMILAR)
${rejectedList}

## ARTICLES ALREADY IN THE PLAN (DO NOT DUPLICATE)
${existingList}

## Your Task
Generate EXACTLY ${count} NEW, UNIQUE article ideas to replace the rejected ones.

CRITICAL RULES:
1. DO NOT suggest topics similar to the rejected ones - that's WHY they were rejected
2. DO NOT duplicate any keyword from "ARTICLES ALREADY IN THE PLAN"
3. Maintain the same phase/category/cluster distribution as the rejected items when possible
4. ALL keywords must be REAL search queries people actually type into Google
5. Titles MUST be under 60 characters

## Product Context (Quick Reference)
- Product: ${brandData.product_name}
- What it is: ${brandData.product_identity.literally}
- Core Features: ${Array.isArray(brandData.core_features) ? brandData.core_features.join(', ') : brandData.core_features}

## Output Format
Return a JSON array of ${count} articles. Each article:
\`\`\`json
{
  "day": 1,
  "phase": "Foundation",
  "category": "Core Answers",
  "main_keyword": "completely different search query",
  "supporting_keywords": ["related term 1", "related term 2", "related term 3"],
  "title": "Short Title Under 60 Chars",
  "hook": "One-sentence user benefit",
  "reason": "Strategic rationale for this topic",
  "user_intent": "Informational",
  "impact": "Medium",
  "connected_to": [1, 5],
  "cluster": "Topic Cluster Name",
  "article_type": "informational"
}
\`\`\`

Think of COMPLETELY DIFFERENT angles, topics, or audiences that the brand could target.
For example, if rejected topic was about "AI headshots vs professional photographer", suggest something completely unrelated like "best lighting for selfie photos" or "corporate headshot outfit guide for men".
`

    try {
        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: "user", parts: [{ text: replacementPrompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            day: { type: "INTEGER" },
                            phase: { type: "STRING" },
                            category: { type: "STRING" },
                            main_keyword: { type: "STRING" },
                            supporting_keywords: {
                                type: "ARRAY",
                                items: { type: "STRING" }
                            },
                            title: { type: "STRING" },
                            hook: { type: "STRING" },
                            reason: { type: "STRING" },
                            user_intent: { type: "STRING" },
                            impact: { type: "STRING" },
                            connected_to: {
                                type: "ARRAY",
                                items: { type: "INTEGER" }
                            },
                            cluster: { type: "STRING" },
                            article_type: { type: "STRING" }
                        },
                        required: ["day", "phase", "category", "main_keyword", "supporting_keywords", "title", "hook", "reason", "user_intent", "impact", "connected_to", "cluster", "article_type"]
                    }
                }
            }
        })

        const text = response.text || "[]"
        const rawItems = JSON.parse(text)

        // Transform to ContentPlanItem format
        const replacements: ContentPlanItem[] = rawItems.map((item: any, index: number) => {
            const scheduledDate = new Date(today)
            scheduledDate.setDate(today.getDate() + (item.day - 1))

            return {
                id: `replacement-${Date.now()}-${index}`,
                title: item.title || `Replacement Article ${index + 1}`,
                main_keyword: item.main_keyword || "",
                supporting_keywords: item.supporting_keywords || [],
                article_type: validateArticleType(item.article_type),
                cluster: item.cluster || "General",
                scheduled_date: scheduledDate.toISOString().split('T')[0],
                status: "pending" as const,
                article_category: validateCategory(item.category),
                phase: validatePhase(item.phase),
                hook: item.hook || "",
                user_intent: validateUserIntent(item.user_intent),
                connected_to: (item.connected_to || []).map((d: number) => d),
                impact: validateImpact(item.impact),
                reason: item.reason || "Replacement article for deduplicated content."
            }
        })

        console.log(`[Replacement Generator] Generated ${replacements.length} replacement articles`)
        return replacements

    } catch (error) {
        console.error("[Replacement Generator] Failed:", error)
        throw error
    }
}
