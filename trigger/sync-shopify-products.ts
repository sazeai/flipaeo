import { task, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { putR2Object } from "@/lib/r2"

/**
 * PinLoop — Shopify Product Sync
 * 
 * Triggered on-demand when a user connects their Shopify store
 * or clicks "Re-sync" in the Products dashboard.
 * 
 * Uses the Shopify Admin REST API to fetch all active products,
 * downloads their primary images to R2, and upserts into the
 * products table with source='shopify'.
 */
export const shopifyProductSync = task({
  id: "shopify-product-sync",
  retry: { maxAttempts: 2 },
  run: async (payload: { userId: string; shopifyConnectionId: string }) => {
    const { userId, shopifyConnectionId } = payload
    logger.info(`🛍️ Shopify sync started for user ${userId}`)

    const supabase = createAdminClient() as any

    // Fetch the Shopify connection
    const { data: connection, error: connErr } = await supabase
      .from("shopify_connections")
      .select("store_domain, access_token")
      .eq("id", shopifyConnectionId)
      .eq("user_id", userId)
      .single()

    if (connErr || !connection) {
      throw new Error(`Shopify connection not found: ${connErr?.message}`)
    }

    const { store_domain, access_token } = connection
    const shopifyBase = `https://${store_domain}/admin/api/2024-10`

    // Get user's brand_settings_id for linking products
    const { data: brand } = await supabase
      .from("brand_settings")
      .select("id")
      .eq("user_id", userId)
      .single()

    const brandSettingsId = brand?.id || null

    // Paginate through all products
    let pageInfo: string | null = null
    let totalSynced = 0
    let totalSkipped = 0
    let hasMore = true

    while (hasMore) {
      const url: string = pageInfo
        ? `${shopifyBase}/products.json?limit=50&page_info=${pageInfo}`
        : `${shopifyBase}/products.json?limit=50&status=active`

      const res: Response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": access_token,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Shopify API error (${res.status}): ${errText}`)
      }

      const data = await res.json()
      const products = data.products || []

      for (const product of products) {
        try {
          // Get primary image
          const primaryImage = product.image?.src || product.images?.[0]?.src || null
          let imageR2Key: string | null = null

          // Download image to R2
          if (primaryImage) {
            try {
              const imgRes = await fetch(primaryImage)
              if (imgRes.ok) {
                const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
                const r2Key = `products/${userId}/${product.id}.jpg`
                await putR2Object(r2Key, imgBuffer, "image/jpeg", "public, max-age=31536000")
                imageR2Key = r2Key
              }
            } catch (imgErr) {
              logger.warn(`Failed to sync image for product ${product.id}: ${imgErr}`)
            }
          }

          // Build tags array from Shopify tags
          const tags = product.tags
            ? product.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
            : []

          // Add product type as a tag if present
          if (product.product_type) {
            tags.unshift(product.product_type)
          }

          // Get price from first variant
          const price = product.variants?.[0]?.price
            ? parseFloat(product.variants[0].price)
            : null

          const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN || ""
          const imageUrl = imageR2Key && r2PublicDomain
            ? `https://${r2PublicDomain}/${imageR2Key}`
            : primaryImage

          // Upsert product (deduplicate by source + source_product_id)
          const { error: upsertError } = await supabase
            .from("products")
            .upsert({
              user_id: userId,
              brand_settings_id: brandSettingsId,
              source: "shopify",
              source_product_id: String(product.id),
              title: product.title,
              description: product.body_html?.replace(/<[^>]*>/g, "").substring(0, 1000) || null,
              price,
              currency: "USD",
              product_url: `https://${store_domain}/products/${product.handle}`,
              image_url: imageUrl,
              image_r2_key: imageR2Key,
              tags,
              is_active: product.status === "active",
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "user_id,source,source_product_id",
              ignoreDuplicates: false,
            })

          if (upsertError) {
            logger.warn(`Failed to upsert Shopify product ${product.id}: ${upsertError.message}`)
            totalSkipped++
          } else {
            totalSynced++
          }

          // Small delay to respect rate limits
          await new Promise(r => setTimeout(r, 100))

        } catch (prodErr: any) {
          logger.error(`Error syncing product ${product.id}: ${prodErr.message}`)
          totalSkipped++
        }
      }

      // Handle pagination via Link header
      const linkHeader: string = res.headers.get("link") || ""
      const nextMatch: RegExpMatchArray | null = linkHeader.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/)
      if (nextMatch) {
        pageInfo = nextMatch[1]
      } else {
        hasMore = false
      }
    }

    logger.info(`🛍️ Shopify sync complete: ${totalSynced} synced, ${totalSkipped} skipped`)
    return { result: "Complete", synced: totalSynced, skipped: totalSkipped }
  },
})
