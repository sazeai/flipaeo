import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { putR2Object } from "@/lib/r2"
import { decrypt } from "@/utils/encryption"

/**
 * EcomPin — Shopify Product Sync (No-OAuth)
 * 
 * background auto-sync utilizing Custom App (Admin API) Key.
 * Fetches products, downloads images, and deduplicates by Handle.
 */
export const shopifyProductSync = schedules.task({
  id: "shopify-product-sync",
  cron: "0 2 * * *", // run daily at 2AM by default if configured
  run: async () => {
    logger.info(`🛍️ Global Shopify sync started`)

    const supabase = createAdminClient() as any

    // Fetch all connections with custom app client credentials
    const { data: connections, error: connErr } = await supabase
      .from("shopify_connections")
      .select("user_id, store_domain, shopify_client_id, shopify_client_secret")
      .not("shopify_client_secret", "is", null)
      .not("store_domain", "is", null)
      .eq("is_default", true)

    if (connErr || !connections || connections.length === 0) {
      logger.info(`No users configured for Shopify auto-sync.`)
      return { result: "No users configured" }
    }

    let usersProcessed = 0
    let totalSyncedGlobal = 0
    let totalSkippedGlobal = 0

    for (const connection of connections) {
      const { user_id: userId, store_domain, shopify_client_id: client_id, shopify_client_secret: encrypted_secret } = connection
      
      let access_token: string
      try {
        const client_secret = decrypt(encrypted_secret)
        
        // Exchange Client Credentials for 24-hr access token
        const tokenRes = await fetch(`https://${store_domain}/admin/oauth/access_token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id,
            client_secret,
            grant_type: 'client_credentials'
          })
        })
        
        if (!tokenRes.ok) {
          logger.error(`Failed to generate 24hr access token for user ${userId}. Skipping...`)
          continue
        }
        
        const tokenData = await tokenRes.json()
        access_token = tokenData.access_token
      } catch (err: any) {
        logger.error(`Encryption or Auth failure for user ${userId}: ${err.message}`)
        continue
      }
      
      const shopifyBase = `https://${store_domain}/admin/api/2024-10`

      logger.info(`Syncing store: ${store_domain} for user ${userId}`)

      // Get user's brand_settings_id for linking products
      const { data: brand } = await supabase
        .from("brand_settings")
        .select("id")
        .eq("user_id", userId)
        .single()

      const brandSettingsId = brand?.id || null

      let pageInfo: string | null = null
      let hasMore = true
      let syncedForUser = 0
      let skippedForUser = 0

      while (hasMore) {
        try {
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
            if (!product.handle) continue

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

              const tags = product.tags
                ? product.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                : []

              if (product.product_type) {
                tags.unshift(product.product_type)
              }

              const price = product.variants?.[0]?.price
                ? parseFloat(product.variants[0].price)
                : null

              const r2PublicDomain = (process.env.R2_PUBLIC_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/+$/, "")
              const imageUrl = imageR2Key && r2PublicDomain
                ? `https://${r2PublicDomain}/${imageR2Key}`
                : primaryImage

              // Deduplicate using handle to align with CSV uploader
              const { error: upsertError } = await supabase
                .from("products")
                .upsert({
                  user_id: userId,
                  brand_settings_id: brandSettingsId,
                  source: "shopify",
                  source_product_id: String(product.id),
                  handle: product.handle,
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
                  onConflict: "user_id,handle",
                  ignoreDuplicates: false,
                })

              if (upsertError) {
                logger.warn(`Failed to upsert Shopify product ${product.handle}: ${upsertError.message}`)
                skippedForUser++
              } else {
                syncedForUser++
              }

              await new Promise(r => setTimeout(r, 100))

            } catch (prodErr: any) {
              logger.error(`Error syncing product ${product.id}: ${prodErr.message}`)
              skippedForUser++
            }
          }

          const linkHeader: string = res.headers.get("link") || ""
          const nextMatch: RegExpMatchArray | null = linkHeader.match(/<[^>]*page_info=([^>&]+)[^>]*>;\s*rel="next"/)
          if (nextMatch) {
            pageInfo = nextMatch[1]
          } else {
            hasMore = false
          }
        } catch (fetchErr: any) {
          logger.error(`Failed to fetch from Shopify for user ${userId}: ${fetchErr.message}`)
          hasMore = false // stop pagination loop on fetch error
        }
      }

      usersProcessed++
      totalSyncedGlobal += syncedForUser
      totalSkippedGlobal += skippedForUser
      
      logger.info(`Finished user ${userId}: ${syncedForUser} synced, ${skippedForUser} skipped`)
    }

    logger.info(`🛍️ Global Shopify sync complete: ${usersProcessed} users processed, ${totalSyncedGlobal} synced, ${totalSkippedGlobal} skipped`)
    return { result: "Complete", usersProcessed, synced: totalSyncedGlobal, skipped: totalSkippedGlobal }
  },
})
