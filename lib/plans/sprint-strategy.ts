import { getGeminiClient } from "@/utils/gemini/geminiClient"
import { createAdminClient } from "@/utils/supabase/admin"
import { ContentPlanItem } from "@/lib/schemas/content-plan"
import { generateEmbedding } from "@/lib/gemini-embedding"
import { generatePacingSchedule, PacedSlot } from "@/lib/plans/sprint-pacing"

// ============================================================
// Sprint Strategy Engine v2 — $497/$897 quality plan generation
// ============================================================

// --- Types ---

export type SprintStrategyInput = {
  userSprintId: string
  userId: string
  brandData: any
  brandUrl?: string
  existingContent: string[]
  totalNew: number
  totalRefresh: number
  sprintStartDate: string
  // Audit data — the key differentiator from v1
  auditGaps?: Array<{ topic: string; importance: string; pillar: string; competitors_covering: string[] }>
  auditPillarSuggestions?: Array<{ suggested_title: string; key_sections: string[]; description?: string }>
  competitorBrands?: Array<{ name: string; url?: string }>
}

// --- Registry helpers (kept from v1, they're solid) ---

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120)
}

async function readRegistryExclusions(userSprintId: string) {
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from("topic_registry")
    .select("title, canonical_keyword, normalized_slug, intent, funnel_role")
    .eq("user_sprint_id", userSprintId)
    .in("state", ["accepted", "reserved"])
    .limit(5000)
  return data || []
}

async function reserveTopic(userSprintId: string, candidate: any, sourceBatchId: string) {
  const supabase = createAdminClient()
  const normalizedSlug = slugify(candidate.title || candidate.main_keyword || "")
  if (!normalizedSlug) return { ok: false, reason: "Missing normalized slug" }

  const { data: existing } = await (supabase as any)
    .from("topic_registry")
    .select("id")
    .eq("user_sprint_id", userSprintId)
    .eq("normalized_slug", normalizedSlug)
    .maybeSingle()

  if (existing) return { ok: false, reason: "Slug already reserved/accepted" }

  let embedding: number[] | null = null
  try {
    embedding = await generateEmbedding(`${candidate.title} ${candidate.main_keyword}`, "SEMANTIC_SIMILARITY")
  } catch {
    embedding = null
  }

  const { data, error } = await (supabase as any)
    .from("topic_registry")
    .insert({
      user_sprint_id: userSprintId,
      state: "reserved",
      title: candidate.title,
      canonical_keyword: candidate.main_keyword,
      normalized_slug: normalizedSlug,
      intent: candidate.user_intent || candidate.intent || null,
      funnel_role: candidate.funnel_role || null,
      cluster_id: candidate.cluster || null,
      embedding,
      source_batch_id: sourceBatchId,
    })
    .select("id")
    .single()

  if (error || !data) return { ok: false, reason: error?.message || "Reserve failed" }
  return { ok: true, id: data.id, normalizedSlug }
}

async function acceptTopic(topicId: string) {
  const supabase = createAdminClient()
  await (supabase as any)
    .from("topic_registry")
    .update({ state: "accepted", updated_at: new Date().toISOString() })
    .eq("id", topicId)
}

async function markConflict(topicId: string, reason: string) {
  const supabase = createAdminClient()
  await (supabase as any)
    .from("topic_registry")
    .update({
      state: "conflict_replacement_requested",
      reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", topicId)
}

// --- GSC Decay candidate fetching for refresh targets ---

async function fetchRefreshTargets(userSprintId: string, limit: number): Promise<Array<{
  page_url: string
  decay_score: number
  clicks_now: number
  clicks_prev: number
  impressions_now: number
  ctr_now: number
  position_now: number
}>> {
  const supabase = createAdminClient()
  const { data } = await (supabase as any)
    .from("gsc_decay_candidates")
    .select("page_url, decay_score, clicks_now, clicks_prev, impressions_now, ctr_now, position_now")
    .eq("user_sprint_id", userSprintId)
    .eq("status", "pending")
    .order("decay_score", { ascending: false })
    .limit(limit)

  return data || []
}

// --- Plan item builders ---

function toNewPlanItem(post: any, slot: PacedSlot, index: number): ContentPlanItem {
  return {
    id: `sprint-new-${Date.now()}-${index}`,
    title: post.title,
    main_keyword: post.main_keyword,
    supporting_keywords: post.supporting_keywords || [],
    article_type: validateArticleType(post.article_type),
    cluster: post.cluster || "General",
    scheduled_date: slot.date,
    status: "pending",
    article_category: validateCategory(post.category || post.article_category),
    phase: slot.phase,
    hook: post.hook || "",
    user_intent: validateUserIntent(post.user_intent),
    connected_to: (post.connected_to || []).map((d: number) => d),
    impact: validateImpact(post.impact),
    reason: post.reason || "",
    content_action: "new",
  } as ContentPlanItem
}

function toRefreshPlanItem(
  target: { page_url: string; decay_score: number; clicks_now: number; clicks_prev: number; impressions_now: number; ctr_now: number; position_now: number },
  refreshPost: any,
  slot: PacedSlot,
  index: number
): ContentPlanItem {
  return {
    id: `sprint-refresh-${Date.now()}-${index}`,
    title: refreshPost.title || `Refresh: ${extractSlugFromUrl(target.page_url)}`,
    main_keyword: refreshPost.main_keyword || extractSlugFromUrl(target.page_url).replace(/-/g, " "),
    supporting_keywords: refreshPost.supporting_keywords || [],
    article_type: validateArticleType(refreshPost.article_type || "informational"),
    cluster: refreshPost.cluster || "Refresh",
    scheduled_date: slot.date,
    status: "pending",
    article_category: "Supporting Articles" as any,
    phase: slot.phase,
    reason: `Decaying page (score ${Math.round(target.decay_score)}): clicks dropped from ${target.clicks_prev} to ${target.clicks_now}`,
    impact: target.decay_score > 50 ? "High" as const : "Medium" as const,
    content_action: "refresh",
    target_url: target.page_url,
    gsc_baseline_metrics: {
      clicks: target.clicks_now,
      impressions: target.impressions_now,
      ctr: target.ctr_now,
      position: target.position_now,
    },
  } as ContentPlanItem
}

function extractSlugFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname
    const segments = path.split("/").filter(Boolean)
    return segments[segments.length - 1] || "page"
  } catch {
    return "page"
  }
}

// --- Mega-prompt builder ---

function buildSprintMegaPrompt(input: SprintStrategyInput, batchSize: number, exclusionText: string, batchNum: number): string {
  const { brandData, brandUrl, competitorBrands = [], auditGaps, auditPillarSuggestions, existingContent } = input

  // Competitor section
  const competitorSection = competitorBrands.length > 0
    ? `## Known Competitors (Use for Comparison Articles)
${competitorBrands.slice(0, 10).map(c => `- ${c.name}${c.url ? ` (${c.url})` : ''}`).join('\n')}

Create comparison/vs articles using these EXACT competitor names.`
    : `No specific competitors identified. Focus on generic category comparisons.`

  // Audit gaps section
  const auditGapsSection = auditGaps && auditGaps.length > 0
    ? `## CRITICAL: Authority Gap Analysis Results
A topical authority audit has identified these SPECIFIC content gaps that competitors cover but this brand does NOT.
PRIORITIZE creating articles that address these gaps:

${auditGaps.slice(0, 25).map(g => `- [${g.importance.toUpperCase()}] ${g.topic} (Pillar: ${g.pillar})${g.competitors_covering.length > 0 ? ` — ${g.competitors_covering.length} competitors cover this` : ''}`).join('\n')}

At least 50% of articles MUST directly address one of these gaps.`
    : ``

  // Pillar suggestions section
  const pillarSection = auditPillarSuggestions && auditPillarSuggestions.length > 0
    ? `## Recommended Pillar Topics (from Topical Authority Audit)
${auditPillarSuggestions.map(p => `- ${p.suggested_title}: ${p.description || p.key_sections.join(', ')}`).join('\n')}

Create supporting articles that naturally link back to these pillar topics.`
    : ``

  // Existing content section
  const existingContentSection = existingContent.length > 0
    ? `## Existing Content (DO NOT DUPLICATE)
${existingContent.slice(0, 30).map(c => `- ${c}`).join('\n')}

Create EXPANSION content, not duplicate coverage.`
    : ``

  // Feature translation
  const featureList = brandData.core_features || []
  const bannedTerms = [brandData.product_name, ...featureList].filter(Boolean)
  const bannedExamples = bannedTerms.slice(0, 3).map((t: string) => `- "${t}" ← Brand feature (User doesn't know this name)`).join('\n')

  // Category distribution targets for this batch
  const coreTarget = Math.max(1, Math.round(batchSize * 0.35))
  const supportingTarget = Math.max(1, Math.round(batchSize * 0.25))
  const conversionTarget = Math.max(1, Math.round(batchSize * 0.25))
  const authorityTarget = Math.max(1, batchSize - coreTarget - supportingTarget - conversionTarget)

  return `
## Context
You are a Senior SEO/AEO Strategist generating a HIGH-VALUE 90-day sprint content plan.
Brand: ${brandData.product_name}
${brandUrl ? `Website: ${brandUrl}` : ''}
Batch ${batchNum}: Generate exactly ${batchSize} NEW article ideas.

## Brand Intelligence
- **Product:** ${brandData.product_name} - ${brandData.product_identity?.literally || brandData.category || 'Software'}
- **Category:** ${brandData.category || 'SaaS Software'}
- **Primary Audience:** ${brandData.audience?.primary || 'business professionals'}
- **Problem Solved (UVP):** ${Array.isArray(brandData.uvp) ? brandData.uvp.slice(0, 2).join(', ') : brandData.uvp}
- **Internal Features (context only, NOT keywords):** ${Array.isArray(brandData.core_features) ? brandData.core_features.join(', ') : brandData.core_features}

${competitorSection}

${auditGapsSection}

${pillarSection}

${existingContentSection}

## Already Reserved/Accepted Topics (DO NOT DUPLICATE)
${exclusionText || "- none yet"}

---

## "Translate, Don't Repeat" Rule
Features above are INTERNAL NAMES. Users don't know them.
- ❌ BAD: "What is Anti-AI Filter?" (feature name)
- ✅ GOOD: "How to bypass AI detection" (the problem it solves)

## The 4 Content Categories (Target Distribution for this batch)
1. **Core Answers** (~${coreTarget} articles): Educational hub content answering fundamental questions
2. **Supporting Articles** (~${supportingTarget} articles): How-to guides, tutorials, specific tips
3. **Conversion Pages** (~${conversionTarget} articles): Comparisons, alternatives, persona-specific buying guides
4. **Authority Plays** (~${authorityTarget} articles): Data-driven thought leadership, industry analysis

## article_type: Choose Based on CONTENT
Use a MIX of all 3 types:
| article_type | When to Use | Examples |
|---|---|---|
| "informational" | Explains concepts, "what is" | "what are AI headshots", "are AI photos legal" |
| "howto" | Step-by-step guides | "how to pose for headshot", "best lighting setup" |
| "commercial" | Comparisons, "best X", buying guides | "best AI headshot generator", "[Competitor] vs [Competitor]" |

**REQUIRED:** ~35% informational, ~30% howto, ~35% commercial

## 90-Day Sprint Phases
Articles should match the sprint phase progression:
- **Foundation (Days 1-20):** Core definitions, foundational pillar content, "what is X"
- **Growth (Days 21-45):** Persona-specific, use-case content, problem-solving guides
- **Expansion (Days 46-70):** Commercial content, comparisons, conversion-oriented
- **Authority (Days 71-90):** Thought leadership, data studies, future predictions

## Strategic Quality Standard (MANDATORY per item)
Each article MUST include:
- **strategic_role**: pillar | supporting | conversion | authority
- **funnel_stage**: awareness | consideration | decision
- **angle_against_competitors**: What unique angle does this take vs competitors?
- **confidence_score**: 1-10 confidence this will drive traffic
- **reason**: Strategic rationale (NOT a hook)

## CONSTRAINTS
1. Titles MAXIMUM 60 characters
2. Keywords must be REAL search queries (would someone Google this?)
3. NO self-promotional content
4. supporting_keywords: 3-5 related search terms per article
5. impact: vary between High/Medium/Low
6. ${bannedExamples ? `BANNED keywords:\n${bannedExamples}` : ''}

---

## Output Format
Return JSON:
\`\`\`json
{
  "posts": [
    {
      "title": "...",
      "main_keyword": "...",
      "supporting_keywords": ["...", "..."],
      "article_type": "informational|commercial|howto",
      "category": "Core Answers|Supporting Articles|Conversion Pages|Authority Plays",
      "cluster": "...",
      "hook": "...",
      "reason": "Strategic rationale explaining WHY this article matters",
      "user_intent": "Informational|Transactional|Commercial Investigation",
      "impact": "High|Medium|Low",
      "connected_to": [1, 5],
      "strategic_role": "pillar|supporting|conversion|authority",
      "funnel_stage": "awareness|consideration|decision",
      "angle_against_competitors": "...",
      "confidence_score": 8
    }
  ]
}
\`\`\`

## FINAL CHECKLIST
- [ ] ALL titles under 60 characters
- [ ] Keywords are REAL search queries
- [ ] NO self-promotional content
- [ ] 3-5 supporting_keywords per article
- [ ] Category distribution matches targets above
- [ ] article_type mix: ~35% informational, ~30% howto, ~35% commercial
- [ ] At least 2 competitor comparison articles (if competitors provided)
- [ ] reason = strategic rationale, NOT a hook
- [ ] confidence_score is realistic (not all 10s)
`.trim()
}

// --- Refresh plan item generator via LLM ---

async function generateRefreshTitles(
  brandData: any,
  targets: Array<{ page_url: string; decay_score: number }>,
): Promise<Array<{ title: string; main_keyword: string; supporting_keywords: string[]; article_type: string; cluster: string }>> {
  if (targets.length === 0) return []

  const client = getGeminiClient()
  const prompt = `
For each of these decaying blog pages, generate an improved title and target keyword for a content refresh.
Brand: ${brandData.product_name}

Decaying pages to refresh:
${targets.map((t, i) => `${i + 1}. ${t.page_url} (decay score: ${Math.round(t.decay_score)})`).join('\n')}

For each page, return a JSON array with:
- title: improved SEO title (max 60 chars)
- main_keyword: target search query
- supporting_keywords: 3-5 related queries
- article_type: informational|howto|commercial
- cluster: topic cluster name

Return JSON array only.`

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    })
    return JSON.parse(response.text || "[]")
  } catch {
    // Fallback: generate minimal items from URLs
    return targets.map(t => ({
      title: `Updated: ${extractSlugFromUrl(t.page_url).replace(/-/g, " ")}`,
      main_keyword: extractSlugFromUrl(t.page_url).replace(/-/g, " "),
      supporting_keywords: [],
      article_type: "informational",
      cluster: "Refresh",
    }))
  }
}

// --- Main entry point ---

export async function generateSprintPlanInBatches(input: SprintStrategyInput): Promise<ContentPlanItem[]> {
  const client = getGeminiClient()
  const accepted: ContentPlanItem[] = []
  const batchSize = 15
  let batchNum = 0

  // Generate pacing schedule
  const pacingSchedule = generatePacingSchedule({
    totalNew: input.totalNew,
    totalRefresh: input.totalRefresh,
    sprintStartDate: input.sprintStartDate,
  })
  const newSlots = pacingSchedule.filter(s => s.type === "new")
  const refreshSlots = pacingSchedule.filter(s => s.type === "refresh")

  console.log(`[Sprint Strategy v2] Generating ${input.totalNew} new + ${input.totalRefresh} refresh articles across 90 days`)
  console.log(`[Sprint Strategy v2] Audit gaps: ${input.auditGaps?.length || 0}, Competitors: ${input.competitorBrands?.length || 0}`)

  // === PART 1: Generate net-new articles in batches ===
  const newAccepted: ContentPlanItem[] = []

  while (newAccepted.length < input.totalNew && batchNum < 20) {
    batchNum++
    const sourceBatchId = `sprint-v2-batch-${Date.now()}-${batchNum}`
    const needed = Math.min(batchSize, input.totalNew - newAccepted.length)
    const exclusions = await readRegistryExclusions(input.userSprintId)

    const exclusionText = exclusions
      .slice(0, 300)
      .map((x: any) => `- ${x.title} | ${x.canonical_keyword} | ${x.intent || ""}`)
      .join("\n")

    const prompt = buildSprintMegaPrompt(input, needed, exclusionText, batchNum)

    console.log(`[Sprint Strategy v2] Batch ${batchNum}: requesting ${needed} articles (${newAccepted.length}/${input.totalNew} done)`)

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    })

    const parsed = JSON.parse(response.text || "{}")
    const posts = Array.isArray(parsed.posts) ? parsed.posts : (Array.isArray(parsed) ? parsed : [])

    for (const post of posts) {
      if (newAccepted.length >= input.totalNew) break

      const reserved = await reserveTopic(input.userSprintId, post, sourceBatchId)
      if (!reserved.ok || !reserved.id) continue

      const conflict = newAccepted.some(x => slugify(x.title) === reserved.normalizedSlug)
      if (conflict) {
        await markConflict(reserved.id, "Collision with already accepted batch topic")
        continue
      }

      await acceptTopic(reserved.id)

      // Assign pacing slot
      const slotIndex = newAccepted.length
      const slot = slotIndex < newSlots.length ? newSlots[slotIndex] : newSlots[newSlots.length - 1]

      newAccepted.push(toNewPlanItem(post, slot, slotIndex))
    }

    console.log(`[Sprint Strategy v2] Batch ${batchNum} done: ${newAccepted.length}/${input.totalNew} new articles accepted`)
  }

  // === PART 2: Generate refresh articles from GSC decay candidates ===
  const refreshAccepted: ContentPlanItem[] = []

  if (input.totalRefresh > 0) {
    console.log(`[Sprint Strategy v2] Fetching GSC decay candidates for ${input.totalRefresh} refresh articles...`)

    const decayCandidates = await fetchRefreshTargets(input.userSprintId, input.totalRefresh)
    console.log(`[Sprint Strategy v2] Found ${decayCandidates.length} decay candidates`)

    if (decayCandidates.length > 0) {
      // Get LLM-generated titles/keywords for the decay candidates
      const refreshTitles = await generateRefreshTitles(input.brandData, decayCandidates)

      for (let i = 0; i < decayCandidates.length && refreshAccepted.length < input.totalRefresh; i++) {
        const target = decayCandidates[i]
        const refreshPost = refreshTitles[i] || {
          title: `Refresh: ${extractSlugFromUrl(target.page_url).replace(/-/g, " ")}`,
          main_keyword: extractSlugFromUrl(target.page_url).replace(/-/g, " "),
          supporting_keywords: [],
          article_type: "informational",
          cluster: "Refresh",
        }

        const slotIndex = refreshAccepted.length
        const slot = slotIndex < refreshSlots.length ? refreshSlots[slotIndex] : refreshSlots[refreshSlots.length - 1]

        refreshAccepted.push(toRefreshPlanItem(target, refreshPost, slot, slotIndex))

        // Mark candidate as scheduled
        const supabase = createAdminClient()
        await (supabase as any)
          .from("gsc_decay_candidates")
          .update({ status: "scheduled" })
          .eq("user_sprint_id", input.userSprintId)
          .eq("page_url", target.page_url)
      }
    }

    // Fallback: if not enough decay candidates, keep refresh quota pending
    if (refreshAccepted.length < input.totalRefresh) {
      const shortfall = input.totalRefresh - refreshAccepted.length
      console.log(`[Sprint Strategy v2] ⚠️ Only ${refreshAccepted.length}/${input.totalRefresh} refresh targets available. ${shortfall} refresh slots pending GSC data.`)
    }
  }

  // === Combine and sort by scheduled date ===
  const finalPlan = [...newAccepted, ...refreshAccepted]
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))

  console.log(`[Sprint Strategy v2] ✅ Plan complete: ${newAccepted.length} new + ${refreshAccepted.length} refresh = ${finalPlan.length} total`)

  return finalPlan
}

// --- Validators ---

function validateArticleType(type: string): "informational" | "commercial" | "howto" {
  const valid = ["informational", "commercial", "howto"]
  return valid.includes(type) ? type as any : "informational"
}

function validateCategory(category: string): "Core Answers" | "Supporting Articles" | "Conversion Pages" | "Authority Plays" {
  const valid = ["Core Answers", "Supporting Articles", "Conversion Pages", "Authority Plays"]
  return valid.includes(category) ? category as any : "Core Answers"
}

function validateUserIntent(intent: string): "Informational" | "Transactional" | "Commercial Investigation" {
  const valid = ["Informational", "Transactional", "Commercial Investigation"]
  return valid.includes(intent) ? intent as any : "Informational"
}

function validateImpact(impact: string): "High" | "Medium" | "Low" {
  const valid = ["High", "Medium", "Low"]
  return valid.includes(impact) ? impact as any : "Medium"
}
