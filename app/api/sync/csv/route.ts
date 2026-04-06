import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { rows } = await req.json()
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ message: "Invalid CSV payload" }, { status: 400 })
    }

    // Get brand settings
    const { data: brand } = await supabase
      .from("brand_settings")
      .select("id")
      .eq("user_id", user.id)
      .single()

    const brandSettingsId = brand?.id || null

    let inserted = 0
    let updated = 0
    let errors = 0
    let errorDetails: string[] = []

    // Dedup engine
    const { data: existingProducts } = await supabase
      .from("products")
      .select("id, handle")
      .eq("user_id", user.id)
      .not("handle", "is", null)

    const handleToId = new Map(existingProducts?.map(p => [p.handle, p.id]) || [])
    const processedHandles = new Set()

    const upsertPayload = []

    for (const row of rows) {
      if (!row.Handle || !row.Title) continue
      
      const handle = row.Handle
      if (processedHandles.has(handle)) continue // Dedup within the CSV itself
      processedHandles.add(handle)

      const title = row.Title
      const price = parseFloat(row["Variant Price"]) || null
      const imageUrl = row["Image Src"] || null
      const tags = row.Tags ? row.Tags.split(",").map((t: string) => t.trim()) : []
      const description = row["Body (HTML)"]?.replace(/<[^>]*>/g, "").substring(0, 1000) || null

      const existingId = handleToId.get(handle)

      if (existingId) {
        // It's an update (preserve other fields by just passing id)
        upsertPayload.push({
          id: existingId,
          user_id: user.id,
          handle,
          title,
          price,
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        updated++
      } else {
        // It's an insert
        upsertPayload.push({
          user_id: user.id,
          brand_settings_id: brandSettingsId,
          source: "shopify",
          source_product_id: handle,
          handle,
          title,
          description,
          price,
          product_url: row["SEO Item URL"] || null,
          image_url: imageUrl,
          tags,
          is_active: row.Published !== "false",
        })
        inserted++
      }
    }

    // Process in chunks of 100 to respect Supabase payload limits
    const chunkSize = 100;
    for (let i = 0; i < upsertPayload.length; i += chunkSize) {
      const chunk = upsertPayload.slice(i, i + chunkSize);
      const { error } = await supabase.from("products").upsert(chunk);
      if (error) {
        console.error("Bulk upsert error chunk:", error);
        errors += chunk.length;
        errorDetails.push(`Bulk chunk failed: ${error.message}`);
        // Readjust metrics
        inserted -= chunk.filter(c => !c.id).length;
        updated -= chunk.filter(c => c.id).length;
      }
    }

    return NextResponse.json({
      success: true,
      report: { inserted, updated, errors, errorDetails }
    })
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 })
  }
}
