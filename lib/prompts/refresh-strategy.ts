/**
 * Refresh Strategy Prompt Builder
 * 
 * Generates prompts for refreshing existing content (decaying pages).
 * Unlike net-new articles, refresh prompts:
 * 1. Include the existing page content for context
 * 2. Focus on updating/improving rather than writing from scratch
 * 3. Preserve the core intent and URL structure
 * 4. Add AEO/AI-answer optimizations
 */

type RefreshPromptInput = {
    existingContent: string
    existingTitle: string
    targetKeyword: string
    supportingKeywords: string[]
    brandName: string
    brandDescription?: string
    gscMetrics?: {
        clicks?: number
        impressions?: number
        ctr?: number
        position?: number
    }
    decayReason?: string // e.g., "clicks dropped 40% over 30 days"
}

export function buildRefreshStrategyPrompt(input: RefreshPromptInput): string {
    const gscContext = input.gscMetrics
        ? `
## Current GSC Performance (declining)
- Clicks (30d): ${input.gscMetrics.clicks ?? 'N/A'}
- Impressions (30d): ${input.gscMetrics.impressions ?? 'N/A'}
- CTR: ${input.gscMetrics.ctr ? (input.gscMetrics.ctr * 100).toFixed(1) + '%' : 'N/A'}
- Average Position: ${input.gscMetrics.position?.toFixed(1) ?? 'N/A'}
${input.decayReason ? `- Decay Reason: ${input.decayReason}` : ''}
`
        : ''

    return `You are an expert SEO/AEO content strategist. Your task is to REFRESH an existing blog post that is experiencing declining performance.

## Brand
- Name: ${input.brandName}
${input.brandDescription ? `- Description: ${input.brandDescription}` : ''}

## Target Keyword: "${input.targetKeyword}"
## Supporting Keywords: ${input.supportingKeywords.join(', ')}
${gscContext}

## Existing Content to Refresh
Title: "${input.existingTitle}"

<existing_content>
${input.existingContent}
</existing_content>

## Your Task
Rewrite and significantly improve this article. You must:

1. **Preserve core intent** — The article should still target the same keyword and serve the same user need.
2. **Update outdated information** — Replace any stale stats, dates, or references with current best practices.
3. **Improve structure for AEO** — Add clear question-and-answer sections that AI assistants can extract.
4. **Expand thin sections** — Any section under 100 words should be expanded with actionable detail.
5. **Add missing angles** — Look at the supporting keywords and ensure they're covered.
6. **Improve the intro** — Write a compelling hook that immediately addresses the search intent.
7. **Strengthen the conclusion** — End with a clear takeaway and CTA.
8. **Keep what works** — If a section is already strong and well-written, keep its core but polish it.

## Output Format
Return ONLY the fully rewritten article in clean HTML with proper heading hierarchy (h1, h2, h3), paragraphs, lists, and bold/italic formatting. The h1 should be the new/improved title.

Do NOT include markdown formatting. Output clean, semantic HTML only.`
}

export function buildRefreshAnalysisPrompt(input: {
    existingContent: string
    targetKeyword: string
    brandName: string
}): string {
    return `Analyze this existing blog post for a content refresh. Identify:

1. **Outdated sections** — What information is stale or no longer accurate?
2. **Thin sections** — Which parts need more depth?
3. **Missing topics** — What related subtopics are competitors covering that this article misses?
4. **AEO opportunities** — What questions should be added for AI-answer optimization?
5. **Structure issues** — How can the heading hierarchy and flow be improved?

Brand: ${input.brandName}
Target Keyword: "${input.targetKeyword}"

<existing_content>
${input.existingContent}
</existing_content>

Return a brief JSON analysis:
{
  "outdated_sections": ["..."],
  "thin_sections": ["..."],
  "missing_topics": ["..."],
  "aeo_questions": ["..."],
  "structure_suggestions": ["..."],
  "overall_quality_score": 1-10,
  "refresh_priority": "low" | "medium" | "high"
}`
}
