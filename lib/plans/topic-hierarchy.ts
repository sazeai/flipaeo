import { getGeminiClient } from "@/utils/gemini/geminiClient"
import { BrandDetails } from "@/lib/schemas/brand"
import { GapAnalysis } from "./gap-analysis"

export type TopicType = "foundation" | "supporting" | "advanced" | "conversion"

export interface TopicNode {
    topic: string
    type: TopicType
    intentRole: string
    dependsOn: string[]      // Topics that must exist first
    priority: number         // 1 = highest priority
    reason: string           // Why this topic matters
}

export interface TopicHierarchy {
    nodes: TopicNode[]
    levels: {
        foundation: TopicNode[]
        supporting: TopicNode[]
        advanced: TopicNode[]
        conversion: TopicNode[]
    }
}

/**
 * Builds a topic hierarchy that orders content strategically.
 * Foundation topics unlock supporting topics, which unlock advanced topics, etc.
 */
export async function buildTopicHierarchy(
    gapAnalysis: GapAnalysis,
    brandData: BrandDetails,
    competitorBrands: string[] = []
): Promise<TopicHierarchy> {
    const genAI = getGeminiClient()

    console.log(`[Topic Hierarchy] Building hierarchy from ${gapAnalysis.prioritizedOpportunities.length} opportunities...`)

    const prompt = `
You are a content strategist building a TOPIC HIERARCHY for a 30-day content plan.

## BRAND CONTEXT
Product: ${brandData.product_name}
Category: ${brandData.product_identity.literally}
Audience: ${brandData.audience.primary}
Core Features: ${brandData.core_features?.join(", ") || "Not specified"}

## COMPETITOR BRANDS (for comparison articles)
${competitorBrands.slice(0, 5).join(", ") || "None identified"}

## GAP ANALYSIS RESULTS
Blue Ocean Opportunities (No/low competition):
${gapAnalysis.blueOceanTopics.slice(0, 10).join("\n")}

Competitor Weaknesses (Poor coverage):
${gapAnalysis.competitorWeaknesses.slice(0, 10).join("\n")}

Prioritized Topics:
${gapAnalysis.prioritizedOpportunities.slice(0, 10).map(p => `- ${p.topic} (${p.priority}): ${p.reason}`).join("\n")}

## YOUR TASK

Build a strategic topic hierarchy with 30 topics organized into 4 levels:

### LEVEL 1: FOUNDATION (12 topics)
- "What is X?" questions that establish authority
- Core definitions and explanations
- MUST come FIRST to unlock other content
- Intent: Core Answer, Definition

### LEVEL 2: SUPPORTING (8 topics)
- "How to" guides and tutorials
- Problem-specific solutions
- DEPENDS ON foundation topics existing
- Intent: How-To, Problem-Specific

### LEVEL 3: ADVANCED (4 topics)
- Deep expertise and edge cases
- Thought leadership content
- DEPENDS ON supporting topics
- Intent: Authority/Edge, Emotional/Story

### LEVEL 4: CONVERSION (6 topics)
- Comparison articles (X vs Y)
- Decision-focused content
- DEPENDS ON foundation + authority
- Intent: Comparison, Decision

## RULES
1. Each topic must have clear dependencies
2. Use REAL competitor names for comparison articles: ${competitorBrands.slice(0, 3).join(", ") || "Generic competitors"}
3. Prioritize BLUE OCEAN topics
4. NO placeholders like "[Generic Tool]"

OUTPUT (JSON):
{
    "nodes": [
        {
            "topic": "What is Privacy-First Analytics?",
            "type": "foundation",
            "intentRole": "Core Answer",
            "dependsOn": [],
            "priority": 1,
            "reason": "Establishes topical authority"
        },
        {
            "topic": "GA4 vs Datafa.st: Privacy Comparison",
            "type": "conversion",
            "intentRole": "Comparison",
            "dependsOn": ["What is Privacy-First Analytics?"],
            "priority": 15,
            "reason": "Converts users researching alternatives"
        }
    ]
}
`

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        })

        const text = response.text || "{}"
        const parsed = JSON.parse(text.replace(/```json|```/g, ""))
        const nodes: TopicNode[] = parsed.nodes || []

        // Organize into levels
        const levels = {
            foundation: nodes.filter(n => n.type === "foundation"),
            supporting: nodes.filter(n => n.type === "supporting"),
            advanced: nodes.filter(n => n.type === "advanced"),
            conversion: nodes.filter(n => n.type === "conversion")
        }

        console.log(`[Topic Hierarchy] Built: ${levels.foundation.length} foundation, ${levels.supporting.length} supporting, ${levels.advanced.length} advanced, ${levels.conversion.length} conversion`)

        return { nodes, levels }
    } catch (error) {
        console.error("[Topic Hierarchy] Failed to build hierarchy:", error)
        return {
            nodes: [],
            levels: { foundation: [], supporting: [], advanced: [], conversion: [] }
        }
    }
}

/**
 * Orders topics for scheduling based on dependencies.
 * Ensures foundation topics come before topics that depend on them.
 */
export function orderByDependencies(hierarchy: TopicHierarchy): TopicNode[] {
    const ordered: TopicNode[] = []
    const added = new Set<string>()

    // Add foundation first (no dependencies)
    for (const node of hierarchy.levels.foundation.sort((a, b) => a.priority - b.priority)) {
        ordered.push(node)
        added.add(node.topic.toLowerCase())
    }

    // Then supporting
    for (const node of hierarchy.levels.supporting.sort((a, b) => a.priority - b.priority)) {
        ordered.push(node)
        added.add(node.topic.toLowerCase())
    }

    // Then advanced
    for (const node of hierarchy.levels.advanced.sort((a, b) => a.priority - b.priority)) {
        ordered.push(node)
        added.add(node.topic.toLowerCase())
    }

    // Finally conversion
    for (const node of hierarchy.levels.conversion.sort((a, b) => a.priority - b.priority)) {
        ordered.push(node)
        added.add(node.topic.toLowerCase())
    }

    return ordered
}

/**
 * Maps a topic type to article category for plan generator compatibility.
 */
export function topicTypeToCategory(type: TopicType): string {
    const mapping: Record<TopicType, string> = {
        "foundation": "Core Answers",
        "supporting": "Supporting Articles",
        "advanced": "Authority Plays",
        "conversion": "Conversion Pages"
    }
    return mapping[type]
}
