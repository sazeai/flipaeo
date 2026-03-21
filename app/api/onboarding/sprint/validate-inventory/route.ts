import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import Sitemapper from "sitemapper"

function isArticleLike(url: string) {
  const pathname = new URL(url).pathname.toLowerCase()
  const articlePatterns = [
    "/blog/",
    "/article/",
    "/articles/",
    "/post/",
    "/posts/",
    "/guides/",
    "/guide/",
    "/news/",
    "/insights/",
    "/resources/",
    "/learn/",
    "/how-to/",
  ]
  return articlePatterns.some((p) => pathname.includes(p))
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const {
      user_sprint_id,
      primary_blog_sitemap_url,
      additional_sitemap_urls = [],
    } = body || {}

    if (!user_sprint_id || !primary_blog_sitemap_url) {
      return NextResponse.json({ error: "user_sprint_id and primary_blog_sitemap_url are required" }, { status: 400 })
    }

    const urlsToScan = [primary_blog_sitemap_url, ...(Array.isArray(additional_sitemap_urls) ? additional_sitemap_urls : [])]
      .filter(Boolean)
      .map((u: string) => u.trim())

    const allUrls = new Set<string>()

    for (const sitemapUrl of urlsToScan) {
      try {
        const mapper = new Sitemapper({ url: sitemapUrl, timeout: 20000 })
        const { sites } = await mapper.fetch()
        for (const site of (sites || [])) {
          if (typeof site === "string") allUrls.add(site)
        }
      } catch (e) {
        console.warn("[Sprint Inventory] Failed sitemap fetch", sitemapUrl, e)
      }
    }

    const parsed = Array.from(allUrls)
    const articleUrls: string[] = []
    const nonArticleUrls: string[] = []

    for (const u of parsed) {
      try {
        if (isArticleLike(u)) articleUrls.push(u)
        else nonArticleUrls.push(u)
      } catch {
        nonArticleUrls.push(u)
      }
    }

    const confidenceScore = parsed.length === 0 ? 0 : Math.round((articleUrls.length / parsed.length) * 100)

    const { data: sprint } = await supabase
      .from("user_sprints")
      .select("id, user_id, metadata")
      .eq("id", user_sprint_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!sprint) return NextResponse.json({ error: "Sprint not found" }, { status: 404 })

    const metadata = {
      ...(sprint.metadata || {}),
      inventory_validation: {
        total_urls_found: parsed.length,
        article_urls_count: articleUrls.length,
        non_article_urls_count: nonArticleUrls.length,
        confidence_score: confidenceScore,
        scanned_at: new Date().toISOString(),
      },
    }

    await supabase
      .from("user_sprints")
      .update({ metadata, updated_at: new Date().toISOString() })
      .eq("id", user_sprint_id)

    return NextResponse.json({
      success: true,
      confidence_score: confidenceScore,
      total_urls_found: parsed.length,
      article_urls_count: articleUrls.length,
      non_article_urls_count: nonArticleUrls.length,
      article_urls_preview: articleUrls.slice(0, 200),
      non_article_urls_preview: nonArticleUrls.slice(0, 100),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to validate inventory" }, { status: 500 })
  }
}
