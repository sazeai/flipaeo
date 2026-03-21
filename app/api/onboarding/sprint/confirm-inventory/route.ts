import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { extractTitleFromUrl, generateEmbedding } from "@/lib/internal-linking"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const {
      user_sprint_id,
      brand_id,
      confirmed_article_urls = [],
    } = body || {}

    if (!user_sprint_id || !brand_id) {
      return NextResponse.json({ error: "user_sprint_id and brand_id are required" }, { status: 400 })
    }
    if (!Array.isArray(confirmed_article_urls) || confirmed_article_urls.length === 0) {
      return NextResponse.json({ error: "confirmed_article_urls is required and must be non-empty" }, { status: 400 })
    }

    const { data: sprint } = await supabase
      .from("user_sprints")
      .select("id, user_id, metadata")
      .eq("id", user_sprint_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!sprint) return NextResponse.json({ error: "Sprint not found" }, { status: 404 })

    const linksToInsert = []
    for (const url of confirmed_article_urls.slice(0, 1000)) {
      const title = extractTitleFromUrl(url)
      let embedding: number[] | null = null
      try {
        embedding = await generateEmbedding(title, "SEMANTIC_SIMILARITY")
      } catch {
        embedding = null
      }
      linksToInsert.push({
        user_id: user.id,
        brand_id,
        url,
        title,
        embedding,
      })
    }

    const { data: existingRows } = await admin
      .from("internal_links")
      .select("url")
      .eq("user_id", user.id)
      .eq("brand_id", brand_id)

    const existingUrls = new Set<string>((existingRows || []).map((r: any) => r.url))
    const newRows = linksToInsert.filter((row) => !existingUrls.has(row.url))

    const { error: insertErr } = await admin
      .from("internal_links")
      .insert(newRows)

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    const metadata = {
      ...(sprint.metadata || {}),
      inventory_confirmation: {
        confirmed: true,
        confirmed_article_count: linksToInsert.length,
        confirmed_at: new Date().toISOString(),
      },
    }

    await supabase
      .from("user_sprints")
      .update({ metadata, updated_at: new Date().toISOString() })
      .eq("id", user_sprint_id)

    return NextResponse.json({ success: true, imported: newRows.length })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to confirm inventory" }, { status: 500 })
  }
}
