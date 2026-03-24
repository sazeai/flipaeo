import { task } from "@trigger.dev/sdk/v3"
import { tavily } from "@tavily/core"
import { createAdminClient } from "@/utils/supabase/admin"
import { getGeminiClient } from "@/utils/gemini/geminiClient"
import { BrandDetailsSchema } from "@/lib/schemas/brand"
import { buildRefreshStrategyPrompt } from "@/lib/prompts/refresh-strategy"
import { refreshExistingPost, lookupPostByUrl } from "@/lib/integrations/wordpress-client"
import type { WordPressCredentials } from "@/lib/integrations/wordpress-client"

/**
 * Refresh Blog Post — Trigger.dev Background Task
 *
 * Unlike generate-blog.ts (net-new content), this task:
 * 1. Scrapes the existing page content
 * 2. Rewrites it using the refresh strategy prompt (preserves intent, updates for AEO)
 * 3. Publishes via CMS UPDATE (not create)
 *
 * Called by the scheduler when content_mode === "refresh"
 */

interface RefreshBlogPayload {
  articleId: string
  keyword: string
  brandId: string
  title?: string
  targetUrl: string         // The URL to refresh
  supportingKeywords?: string[]
  planId?: string
  itemId?: string
  gscMetrics?: {
    clicks?: number
    impressions?: number
    ctr?: number
    position?: number
  }
  decayReason?: string
}

export const refreshBlogPost = task({
  id: "refresh-blog-post",
  maxDuration: 600, // 10 min max
  queue: {
    concurrencyLimit: 2,
  },
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: RefreshBlogPayload) => {
    const {
      articleId,
      keyword,
      brandId,
      title,
      targetUrl,
      supportingKeywords = [],
      planId,
      itemId,
      gscMetrics,
      decayReason,
    } = payload

    const supabase = createAdminClient()
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! })
    const genAI = getGeminiClient()

    try {
      console.log(`[Refresh Blog] Starting refresh for: ${targetUrl}`)
      console.log(`[Refresh Blog] Article ID: ${articleId}, Keyword: ${keyword}`)

      // Mark as researching
      await supabase
        .from("articles")
        .update({ status: "researching", content_mode: "refresh", original_url: targetUrl })
        .eq("id", articleId)

      // === STEP 1: Fetch existing page content ===
      console.log(`[Refresh Blog] Step 1: Scraping existing page content...`)

      let existingContent = ""
      let existingTitle = title || keyword

      try {
        // Use Tavily extract for clean content extraction
        const extractResult = await tvly.extract([targetUrl])

        if (extractResult.results && extractResult.results.length > 0) {
          existingContent = extractResult.results[0].rawContent || ""
          console.log(`[Refresh Blog] Extracted ${existingContent.length} chars from ${targetUrl}`)
        }
      } catch (extractErr) {
        console.warn(`[Refresh Blog] Tavily extract failed, trying fetch:`, extractErr)

        // Fallback: direct fetch
        try {
          const res = await fetch(targetUrl, {
            headers: { "User-Agent": "FlipAEO-Refresher/1.0" },
            signal: AbortSignal.timeout(10000),
          })
          if (res.ok) {
            const html = await res.text()
            // Strip HTML tags for a rough content extraction
            existingContent = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 15000)
            console.log(`[Refresh Blog] Fallback: extracted ${existingContent.length} chars`)
          }
        } catch (fetchErr) {
          console.error(`[Refresh Blog] Both extraction methods failed:`, fetchErr)
        }
      }

      if (!existingContent || existingContent.length < 100) {
        console.warn(`[Refresh Blog] Insufficient existing content (${existingContent.length} chars). Generating net-new instead.`)
        // Fall through to generate fresh content if we can't scrape existing
      }

      // === STEP 2: Fetch brand data ===
      const { data: brandRec } = await supabase
        .from("brand_details")
        .select("brand_data")
        .eq("id", brandId)
        .single()

      if (!brandRec) throw new Error("Brand not found")
      const brandDetails = BrandDetailsSchema.parse(brandRec.brand_data)

      // Update status
      await supabase
        .from("articles")
        .update({ status: "writing" })
        .eq("id", articleId)

      // === STEP 3: Generate refreshed content ===
      console.log(`[Refresh Blog] Step 3: Generating refreshed content via LLM...`)

      const refreshPrompt = buildRefreshStrategyPrompt({
        existingContent,
        existingTitle,
        targetKeyword: keyword,
        supportingKeywords,
        brandName: brandDetails.product_name,
        brandDescription: brandDetails.product_identity?.literally,
        gscMetrics,
        decayReason,
      })

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: refreshPrompt }] }],
      })

      const refreshedHtml = response.text || ""

      if (!refreshedHtml || refreshedHtml.length < 200) {
        throw new Error(`LLM returned insufficient content (${refreshedHtml.length} chars)`)
      }

      console.log(`[Refresh Blog] Generated ${refreshedHtml.length} chars of refreshed content`)

      // Extract title from h1 if present
      const h1Match = refreshedHtml.match(/<h1[^>]*>(.*?)<\/h1>/i)
      const refreshedTitle = h1Match ? h1Match[1].replace(/<[^>]+>/g, "") : title || keyword

      // Generate meta description
      const metaResponse = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{
            text: `Write a compelling SEO meta description (max 155 chars) for this article.
Title: ${refreshedTitle}
Keyword: ${keyword}
Return ONLY the meta description text, nothing else.`,
          }],
        }],
      })
      const metaDescription = metaResponse.text?.trim().slice(0, 160) || ""

      // Generate slug
      const slug = keyword
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 80)

      // === STEP 4: Save to DB ===
      console.log(`[Refresh Blog] Step 4: Saving refreshed content...`)

      await supabase
        .from("articles")
        .update({
          raw_content: refreshedHtml,
          final_html: refreshedHtml,
          status: "completed",
          meta_description: metaDescription,
          slug,
          keyword: keyword,
          content_mode: "refresh",
          original_url: targetUrl,
        })
        .eq("id", articleId)

      // === STEP 5: Update via CMS (if WordPress connected) ===
      console.log(`[Refresh Blog] Step 5: Checking CMS for update...`)

      const { data: articleWithUser } = await supabase
        .from("articles")
        .select("user_id")
        .eq("id", articleId)
        .single()

      if (articleWithUser?.user_id) {
        const { data: cmsConnection } = await (supabase as any)
          .from("cms_connections")
          .select("*")
          .eq("user_id", articleWithUser.user_id)
          .maybeSingle()

        if (cmsConnection?.platform === "wordpress" && cmsConnection?.access_token) {
          try {
            console.log(`[Refresh Blog] Attempting WordPress update for ${targetUrl}...`)

            const wpCredentials: WordPressCredentials = {
              siteUrl: cmsConnection.site_url || cmsConnection.wordpress_url,
              username: cmsConnection.username || "",
              appPassword: cmsConnection.access_token,
            }

            // Look up post ID from URL
            const postId = await lookupPostByUrl(wpCredentials, targetUrl)
            if (!postId) {
              console.warn(`[Refresh Blog] Could not find WordPress post ID for ${targetUrl}`)
            } else {
              const wpResult = await refreshExistingPost(wpCredentials, postId, {
                title: refreshedTitle,
                content: refreshedHtml,
              })

              if (wpResult.success) {
                console.log(`[Refresh Blog] ✅ WordPress post updated: ${wpResult.post?.id}`)
                await supabase
                  .from("articles")
                  .update({ status: "published" })
                  .eq("id", articleId)
              } else {
                console.warn(`[Refresh Blog] WordPress update failed: ${wpResult.error}`)
              }
            }
          } catch (cmsErr) {
            console.error(`[Refresh Blog] CMS update error:`, cmsErr)
            // Non-blocking — article is saved, just not pushed to CMS
          }
        } else {
          console.log(`[Refresh Blog] No WordPress connection found. Content saved but not published.`)
        }
      }

      // === STEP 6: Update content plan item status ===
      if (planId && itemId) {
        try {
          const { data: plan } = await (supabase as any)
            .from("content_plans")
            .select("*")
            .eq("id", planId)
            .single()

          if (plan?.plan_data) {
            const updatedPlanData = plan.plan_data.map((item: any) => {
              if (item.id === itemId) {
                return { ...item, status: "published" }
              }
              return item
            })

            await (supabase as any)
              .from("content_plans")
              .update({ plan_data: updatedPlanData })
              .eq("id", planId)

            console.log(`[Refresh Blog] Updated plan item ${itemId} to published`)
          }
        } catch (e) {
          console.error("[Refresh Blog] Failed to update content plan:", e)
        }
      }

      // Mark GSC decay candidate as refreshed
      if (targetUrl) {
        await (supabase as any)
          .from("gsc_decay_candidates")
          .update({ status: "refreshed", refreshed_at: new Date().toISOString() })
          .eq("page_url", targetUrl)
      }

      console.log(`[Refresh Blog] ✅ Refresh complete for ${targetUrl}`)
      return { success: true, articleId, refreshedTitle }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[Refresh Blog] ❌ Error:`, msg)

      await supabase
        .from("articles")
        .update({ status: "failed", error_message: `Refresh failed: ${msg}` })
        .eq("id", articleId)

      throw e
    }
  },
})

