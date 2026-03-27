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

    // Deduplication Engine
    // Query all existing handles for this user
    const { data: existingProducts } = await supabase
      .from("products")
      .select("handle")
      .eq("user_id", user.id)
      .not("handle", "is", null)

    const existingHandles = new Set(existingProducts?.map(p => p.handle) || [])

    for (const row of rows) {
      if (!row.Handle || !row.Title) continue // Skip invalid rows

      const handle = row.Handle
      const title = row.Title
      const price = parseFloat(row["Variant Price"]) || null
      // Map Image Src to image_url per PRD
      const imageUrl = row["Image Src"] || null
      
      const tags = row.Tags ? row.Tags.split(",").map((t: string) => t.trim()) : []

      if (existingHandles.has(handle)) {
        // Condition: Handle already in database, UPDATE product
        const { error } = await supabase
          .from("products")
          .update({
            title,
            price,
            image_url: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("handle", handle)

        if (error) {
          console.error(`CSV Update Error for ${handle}:`, error)
          errors++
          errorDetails.push(`Update failed for ${handle}: ${error.message}`)
        } else {
          updated++
        }
      } else {
        // Condition: Handle does not exist, INSERT new product
        const { error } = await supabase
          .from("products")
          .insert({
            user_id: user.id,
            brand_settings_id: brandSettingsId,
            source: "shopify",
            source_product_id: handle, // Use handle as source_product_id for CSV to avoid null errors
            handle: handle,
            title,
            description: row["Body (HTML)"]?.replace(/<[^>]*>/g, "").substring(0, 1000) || null,
            price,
            product_url: row["SEO Item URL"] || null, // Or try to build from storefront if known
            image_url: imageUrl,
            tags,
            is_active: row.Published !== "false",
          })

        if (error) {
          console.error(`CSV Insert Error for ${handle}:`, error)
          errors++
          errorDetails.push(`Insert failed for ${handle}: ${error.message}`)
        } else {
          inserted++
          existingHandles.add(handle) // Prevent duplicate inserts for later rows of same handle
        }
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
