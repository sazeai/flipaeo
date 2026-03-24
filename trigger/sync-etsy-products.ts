import { task, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { putR2Object } from "@/lib/r2"

/**
 * PinLoop — Etsy Product Sync
 * 
 * Triggered on-demand when a user connects their Etsy shop
 * or clicks "Re-sync" in the Products dashboard.
 * 
 * Uses the Etsy Open API v3 to fetch all active listings,
 * downloads images to R2, and upserts into products table
 * with source='etsy'.
 * 
 * Etsy API: https://developers.etsy.com/documentation/reference
 */
export const etsyProductSync = task({
  id: "etsy-product-sync",
  retry: { maxAttempts: 2 },
  run: async (payload: { userId: string; etsyConnectionId: string }) => {
    const { userId, etsyConnectionId } = payload
    logger.info(`🧶 Etsy sync started for user ${userId}`)

    const supabase = createAdminClient() as any

    // Fetch the Etsy connection
    const { data: connection, error: connErr } = await supabase
      .from("etsy_connections")
      .select("shop_id, shop_name, access_token, refresh_token, expires_at")
      .eq("id", etsyConnectionId)
      .eq("user_id", userId)
      .single()

    if (connErr || !connection) {
      throw new Error(`Etsy connection not found: ${connErr?.message}`)
    }

    // Check if token needs refresh
    let accessToken = connection.access_token
    if (connection.expires_at && new Date(connection.expires_at) < new Date()) {
      accessToken = await refreshEtsyToken(supabase, connection, etsyConnectionId)
    }

    const shopId = connection.shop_id

    // Get user's brand_settings_id
    const { data: brand } = await supabase
      .from("brand_settings")
      .select("id")
      .eq("user_id", userId)
      .single()

    const brandSettingsId = brand?.id || null

    // Fetch active listings from Etsy
    let offset = 0
    const limit = 100
    let totalSynced = 0
    let totalSkipped = 0
    let hasMore = true

    while (hasMore) {
      const url = `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/active?limit=${limit}&offset=${offset}`

      const res = await fetch(url, {
        headers: {
          "x-api-key": process.env.ETSY_API_KEY!,
          "Authorization": `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Etsy API error (${res.status}): ${errText}`)
      }

      const data = await res.json()
      const listings = data.results || []

      for (const listing of listings) {
        try {
          // Fetch listing images
          let primaryImageUrl: string | null = null
          let imageR2Key: string | null = null

          try {
            const imagesRes = await fetch(
              `https://openapi.etsy.com/v3/application/listings/${listing.listing_id}/images`,
              {
                headers: {
                  "x-api-key": process.env.ETSY_API_KEY!,
                  "Authorization": `Bearer ${accessToken}`,
                },
              }
            )

            if (imagesRes.ok) {
              const imagesData = await imagesRes.json()
              const primaryImg = imagesData.results?.[0]
              primaryImageUrl = primaryImg?.url_fullxfull || primaryImg?.url_570xN || null

              // Download to R2
              if (primaryImageUrl) {
                const imgRes = await fetch(primaryImageUrl)
                if (imgRes.ok) {
                  const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
                  const r2Key = `products/${userId}/etsy_${listing.listing_id}.jpg`
                  await putR2Object(r2Key, imgBuffer, "image/jpeg", "public, max-age=31536000")
                  imageR2Key = r2Key
                }
              }
            }
          } catch (imgErr) {
            logger.warn(`Failed to sync image for listing ${listing.listing_id}: ${imgErr}`)
          }

          // Extract tags
          const tags = listing.tags || []
          if (listing.taxonomy_path && Array.isArray(listing.taxonomy_path)) {
            tags.unshift(...listing.taxonomy_path)
          }

          // Get price
          const price = listing.price?.amount
            ? listing.price.amount / listing.price.divisor
            : null
          const currency = listing.price?.currency_code || "USD"

          const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN || ""
          const imageUrl = imageR2Key && r2PublicDomain
            ? `https://${r2PublicDomain}/${imageR2Key}`
            : primaryImageUrl

          // Upsert product
          const { error: upsertError } = await supabase
            .from("products")
            .upsert({
              user_id: userId,
              brand_settings_id: brandSettingsId,
              source: "etsy",
              source_product_id: String(listing.listing_id),
              title: listing.title,
              description: listing.description?.substring(0, 1000) || null,
              price,
              currency,
              product_url: listing.url || `https://www.etsy.com/listing/${listing.listing_id}`,
              image_url: imageUrl,
              image_r2_key: imageR2Key,
              tags: [...new Set(tags)].slice(0, 20), // Deduplicate and limit
              is_active: listing.state === "active",
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "user_id,source,source_product_id",
              ignoreDuplicates: false,
            })

          if (upsertError) {
            logger.warn(`Failed to upsert Etsy listing ${listing.listing_id}: ${upsertError.message}`)
            totalSkipped++
          } else {
            totalSynced++
          }

          // Respect rate limits (Etsy: ~10 req/sec)
          await new Promise(r => setTimeout(r, 150))

        } catch (listErr: any) {
          logger.error(`Error syncing listing ${listing.listing_id}: ${listErr.message}`)
          totalSkipped++
        }
      }

      // Handle Etsy offset pagination
      if (listings.length < limit) {
        hasMore = false
      } else {
        offset += limit
      }
    }

    logger.info(`🧶 Etsy sync complete: ${totalSynced} synced, ${totalSkipped} skipped`)
    return { result: "Complete", synced: totalSynced, skipped: totalSkipped }
  },
})

/**
 * Refresh an expired Etsy access token.
 */
async function refreshEtsyToken(
  supabase: any,
  connection: any,
  connectionId: string
): Promise<string> {
  const res = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ETSY_API_KEY!,
      refresh_token: connection.refresh_token,
    }),
  })

  if (!res.ok) {
    throw new Error(`Etsy token refresh failed: ${await res.text()}`)
  }

  const tokens = await res.json()

  await supabase
    .from("etsy_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)

  return tokens.access_token
}
