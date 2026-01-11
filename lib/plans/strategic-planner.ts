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

## Brand Intelligence (Extracted from Website)
- **Product Name:** ${brandData.product_name}
- **What it is (literally):** ${brandData.product_identity.literally}
- **What it is (emotionally):** ${brandData.product_identity.emotionally}
- **What it is NOT:** ${brandData.product_identity.not}
- **Category:** ${brandData.category || 'SaaS Software'}
- **Mission:** ${brandData.mission}
- **Primary Audience:** ${brandData.audience.primary}
- **Audience Psychology:** ${brandData.audience.psychology}
- **The Enemy (problems we fight):** ${Array.isArray(brandData.enemy) ? brandData.enemy.join(', ') : brandData.enemy}
- **Unique Value Props:** ${Array.isArray(brandData.uvp) ? brandData.uvp.join(' | ') : brandData.uvp}
- **Core Features:** ${Array.isArray(brandData.core_features) ? brandData.core_features.join(', ') : brandData.core_features}
- **Writing Style DNA:** ${brandData.style_dna || 'Professional, conversational, outcome-focused'}

${competitorSection}

${existingContentSection}

---

## Your Role
Act as a Senior SEO Strategist and Head of Content Growth. Your goal is NOT just "traffic" but building a **Topic Cluster Ecosystem** that establishes this brand as the authority in "${brandData.category || brandData.product_identity.literally}".

## The Objective
Generate a comprehensive **30-Day Content Roadmap** designed to:
1. Capture users at every funnel stage: **Awareness → Consideration → Decision**
2. Optimize for both Google Search (SEO) and LLM Answers (AEO - Answer Engine Optimization)
3. Create interconnected content that keeps users on the site

---

## Strategic Framework (The 4 Pillars)

Categorize every content piece into one of these buckets:

### 1. Core Answers (12 articles) - "Hubs"
Broad, educational topics that define the category.
- Answer fundamental questions in the space
- Establish topical authority
- Examples: "The future of [category]", "What is [concept]?"

### 2. Supporting Articles (8 articles) - "Spokes"
Specific "how-to" guides or problem-solving articles.
- Link back to Core Answers
- Solve specific user problems
- Examples: "How to [specific task]", "Why your [thing] isn't working"

### 3. Conversion Pages (6 articles) - "Money Pages"
High-intent pages targeting specific buyer personas.
- Target people ready to buy/sign up
- Persona-specific landing pages
- Examples: "[Product] for [specific profession]", "Best [category] for [use case]"

### 4. Authority Plays (4 articles) - "Backlink Magnets"
Thought leadership pieces designed to get cited.
- Data studies, original research, bold takes
- Examples: "Data study: Does X increase Y?", "The truth about [controversial topic]"

---

## Execution Constraints (MANDATORY)

### 1. No Shallow Keywords
- ❌ AVOID: "free headshot", "AI photo generator"
- ✅ USE: "How to get a corporate headshot without a studio"
- Focus on long-tail, semantic, AEO-optimized queries

### 2. The "Interconnection" Rule
For every content piece, specify which OTHER article(s) it links to.
The goal is to keep users on the site and build topic clusters.

### 3. User Intent Labels
Every piece must have clear intent:
- **Informational**: Learning, researching
- **Transactional**: Ready to act/buy
- **Commercial Investigation**: Comparing options

### 4. LLM/AEO Optimization
Keywords must answer complex questions users ask ChatGPT or Perplexity.
Think: "What is the user really trying to solve?"

### 5. Phased Rollout (4 Phases)
- **Phase 1 (Days 1-7): Foundation** - Establish the "Anti-[Enemy]" philosophy, build hub pages
- **Phase 2 (Days 8-14): Use-Case Expansion** - Capture specific user personas
- **Phase 3 (Days 15-21): Technical/Vibe** - LLM "how does it work" optimization
- **Phase 4 (Days 22-30): Trust & Safety** - Overcome objections, build confidence

### 6. Natural Language Titles
- ❌ BANNED: "AI Photoshoot: A Complete Guide" (keyword: subtitle format)
- ❌ BANNED: "The Ultimate Guide to X"
- ✅ GOOD: "How to Generate Candid Hinge Photos That Actually Look Real"
- ✅ GOOD: "Hollywood-Grade Headshots for the Price of a Coffee"

---

## Deep Analysis Requirement

BEFORE generating the plan, provide a ~200-word analysis of the brand's current "Content Gap":
- What traffic is the brand MISSING right now?
- What vocabulary/concepts should they OWN but don't?
- What niche landing pages are absent?
- What will this plan FIX?

---

## Output Format

Return a JSON object with:
1. \`content_gap_analysis\`: Your 200-word analysis
2. \`plan\`: Array of 30 articles with the schema below

Each article needs:
- \`day\`: 1-30
- \`phase\`: "Foundation" | "Use-Case" | "Technical" | "Trust"
- \`category\`: "Core Answers" | "Supporting Articles" | "Conversion Pages" | "Authority Plays"
- \`main_keyword\`: The target search query (long-tail, specific)
- \`title\`: Click-worthy H1 title (NO keyword:subtitle format!)
- \`hook\`: One sentence on why a user needs this NOW
- \`user_intent\`: "Informational" | "Transactional" | "Commercial Investigation"
- \`connected_to\`: Array of day numbers this links to (e.g., [1, 5] means links to Day 1 and Day 5)
- \`cluster\`: Topic cluster name for grouping
- \`article_type\`: "informational" | "commercial" | "howto"

---

## CRITICAL: Quality Checklist
Before finalizing, verify:
- [ ] At least 3 persona-specific articles of the brand (e.g., "for realtors", "for medical residents")
- [ ] At least 3 competitor comparison articles using real names
- [ ] NO abstract/theoretical topics (e.g., "the ethics of AI")
- [ ] ALL titles are natural language, NOT "Keyword: Subtitle" format
- [ ] Interconnections form logical topic clusters
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
                            description: "200-word analysis of content gaps"
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
                                    title: { type: "STRING" },
                                    hook: { type: "STRING" },
                                    user_intent: { type: "STRING" },
                                    connected_to: {
                                        type: "ARRAY",
                                        items: { type: "INTEGER" }
                                    },
                                    cluster: { type: "STRING" },
                                    article_type: { type: "STRING" }
                                },
                                required: ["day", "phase", "category", "main_keyword", "title", "hook", "user_intent", "connected_to", "cluster", "article_type"]
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
                supporting_keywords: [], // Can be enhanced later
                article_type: validateArticleType(item.article_type),
                cluster: item.cluster || "General",
                scheduled_date: scheduledDate.toISOString().split('T')[0],
                status: "pending" as const,
                // Strategic planner fields
                article_category: validateCategory(item.category),
                phase: validatePhase(item.phase),
                hook: item.hook || "",
                user_intent: validateUserIntent(item.user_intent),
                connected_to: (item.connected_to || []).map((d: number) => `day-${d}`),
                // Legacy fields for compatibility
                impact: "Medium" as const,
                reason: item.hook || "Strategic content for topic cluster authority."
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

        console.log(`[Strategic Planner] Generated ${planItems.length} articles`)
        console.log(`[Strategic Planner] Distribution:`, categoryDistribution)

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
