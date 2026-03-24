import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { putR2Object } from "@/lib/r2"

/**
 * Manual Product Upload API
 * 
 * POST /api/products/upload
 * 
 * Accepts multipart form data with product info + optional image.
 * For users who don't use Shopify/Etsy or want to add products manually.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()

    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const price = formData.get("price") as string | null
    const currency = formData.get("currency") as string || "USD"
    const productUrl = formData.get("product_url") as string | null
    const tags = formData.get("tags") as string | null
    const imageFile = formData.get("image") as File | null

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Product title is required" }, { status: 400 })
    }

    // Get brand settings
    const { data: brand } = await supabase
      .from("brand_settings")
      .select("id")
      .eq("user_id", user.id)
      .single()

    let imageUrl: string | null = null
    let imageR2Key: string | null = null

    // Upload image to R2 if provided
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const ext = imageFile.name.split(".").pop() || "jpg"
      const r2Key = `products/${user.id}/manual_${Date.now()}.${ext}`

      await putR2Object(r2Key, buffer, imageFile.type || "image/jpeg", "public, max-age=31536000")
      imageR2Key = r2Key

      const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN || ""
      if (r2PublicDomain) {
        imageUrl = `https://${r2PublicDomain}/${r2Key}`
      }
    }

    // Parse tags
    const parsedTags = tags
      ? tags.split(",").map(t => t.trim()).filter(Boolean)
      : []

    // Insert product
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
        brand_settings_id: brand?.id || null,
        source: "manual",
        title: title.trim(),
        description: description?.trim() || null,
        price: price ? parseFloat(price) : null,
        currency,
        product_url: productUrl?.trim() || null,
        image_url: imageUrl,
        image_r2_key: imageR2Key,
        tags: parsedTags,
        is_active: true,
      })
      .select("id, title")
      .single()

    if (error) {
      console.error("Failed to create product:", error)
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
    }

    return NextResponse.json({ product }, { status: 201 })

  } catch (err: any) {
    console.error("Product upload error:", err)
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 })
  }
}
