import { getGeminiClient } from "@/utils/gemini/geminiClient"
import { createAdminClient } from "@/utils/supabase/admin"
import { ContentPlanItem } from "@/lib/schemas/content-plan"
import { generateEmbedding } from "@/lib/gemini-embedding"

type StrategyInput = {
  userSprintId: string
  userId: string
  brandData: any
  existingContent: string[]
  totalNew: number
  totalRefresh: number
}

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
  const { data } = await supabase
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

  const { data: existing } = await supabase
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

  const { data, error } = await supabase
    .from("topic_registry")
    .insert({
      user_sprint_id: userSprintId,
      state: "reserved",
      title: candidate.title,
      canonical_keyword: candidate.main_keyword,
      normalized_slug: normalizedSlug,
      intent: candidate.intent || null,
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
  await supabase
    .from("topic_registry")
    .update({ state: "accepted", updated_at: new Date().toISOString() })
    .eq("id", topicId)
}

async function markConflict(topicId: string, reason: string) {
  const supabase = createAdminClient()
  await supabase
    .from("topic_registry")
    .update({
      state: "conflict_replacement_requested",
      reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", topicId)
}

function toPlanItem(post: any, index: number, action: "new" | "refresh"): ContentPlanItem {
  return {
    id: `sprint-${Date.now()}-${index}`,
    title: post.title,
    main_keyword: post.main_keyword,
    supporting_keywords: post.supporting_keywords || [],
    article_type: (post.article_type || "informational") as any,
    cluster: post.cluster || "General",
    scheduled_date: new Date().toISOString().split("T")[0],
    status: "pending",
    article_category: post.article_category,
    reason: post.reason,
    impact: post.impact,
    content_action: action,
  } as ContentPlanItem
}

export async function generateSprintPlanInBatches(input: StrategyInput) {
  const client = getGeminiClient()
  const accepted: ContentPlanItem[] = []
  const targetTotal = input.totalNew + input.totalRefresh
  const batchSize = 15
  let batch = 0

  while (accepted.length < targetTotal && batch < 20) {
    batch += 1
    const sourceBatchId = `batch-${Date.now()}-${batch}`
    const needed = Math.min(batchSize, targetTotal - accepted.length)
    const exclusions = await readRegistryExclusions(input.userSprintId)

    const exclusionText = exclusions
      .slice(0, 300)
      .map((x: any) => `- ${x.title} | ${x.canonical_keyword} | ${x.normalized_slug} | ${x.intent || ""}`)
      .join("\n")

    const prompt = `
Generate exactly ${needed} strategic SEO article ideas in JSON.
Brand: ${input.brandData?.product_name || "Unknown"}
Audience: ${input.brandData?.audience?.primary || "Unknown"}

Do NOT duplicate these accepted/reserved topics:
${exclusionText || "- none yet"}

Also avoid overlap with existing site coverage:
${input.existingContent.slice(0, 200).map((x) => `- ${x}`).join("\n")}

Return JSON:
{
  "posts": [
    {
      "title": "...",
      "main_keyword": "...",
      "supporting_keywords": ["..."],
      "article_type": "informational|commercial|howto",
      "cluster": "...",
      "intent": "...",
      "funnel_role": "pillar|supporting|conversion|authority",
      "article_category": "Core Answers|Supporting Articles|Conversion Pages|Authority Plays",
      "reason": "...",
      "impact": "High|Medium|Low"
    }
  ]
}
`.trim()

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    })

    const parsed = JSON.parse(response.text || "{}")
    const posts = Array.isArray(parsed.posts) ? parsed.posts : []

    for (const post of posts) {
      if (accepted.length >= targetTotal) break

      const reserved = await reserveTopic(input.userSprintId, post, sourceBatchId)
      if (!reserved.ok || !reserved.id) continue

      const conflict = accepted.some((x) => slugify(x.title) === reserved.normalizedSlug)
      if (conflict) {
        await markConflict(reserved.id, "Collision with already accepted batch topic")
        continue
      }

      await acceptTopic(reserved.id)
      const newCount = accepted.filter((x) => x.content_action === "new").length
      const action: "new" | "refresh" = newCount < input.totalNew ? "new" : "refresh"
      accepted.push(toPlanItem(post, accepted.length, action))
    }
  }

  return accepted.slice(0, targetTotal)
}
