import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { putR2Object } from "@/lib/r2"
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.MYGEMINI_API_KEY })

/**
 * PinLoop — Autonomous Pin Generation Batch Task
 * 
 * Runs every 6 hours. For each user with active brand settings:
 * 1. Picks products that need new pins
 * 2. Calls the generate-pin API (Art Director → Image Gen)
 * 3. Calls the render-pin API (text overlay + CTA badge)
 * 4. Uploads final rendered pin to R2
 * 5. Enqueues the pin for publishing
 * 
 * Rate limit: max 3 pins per user per batch to avoid API quota issues.
 */
export const generatePinBatch = schedules.task({
  id: "pinloop-generate-batch",
  cron: "0 */6 * * *", // Every 6 hours
  run: async () => {
    logger.info("🎨 PinLoop batch generator started")

    const supabase = createAdminClient() as any

    // Get all users with brand settings (they've completed onboarding)
    const { data: brands, error } = await supabase
      .from("brand_settings")
      .select("id, user_id, brand_name, font_choice, store_url, aesthetic_boundaries, automation_paused")

    if (error || !brands || brands.length === 0) {
      logger.info("No users with brand settings found")
      return { result: "No brands", count: 0 }
    }

    let totalGenerated = 0

    for (const brand of brands) {
      try {
        // Skip users who have paused automation
        if (brand.automation_paused) {
          logger.info(`User ${brand.user_id}: automation paused, skipping generation`)
          continue
        }

        logger.info(`Processing brand: ${brand.brand_name} (user: ${brand.user_id})`)

        // Check if user has a subscription (basic entitlement check)
        const { data: sub } = await supabase
          .from("dodo_subscriptions")
          .select("status")
          .eq("user_id", brand.user_id)
          .eq("status", "active")
          .maybeSingle()

        if (!sub) {
          logger.info(`User ${brand.user_id} has no active subscription, skipping`)
          continue
        }

        // Get products that need pins (active products with fewer than 5 pins)
        const { data: products } = await supabase
          .from("products")
          .select("id, title, image_r2_key")
          .eq("user_id", brand.user_id)
          .eq("is_active", true)
          .not("image_r2_key", "is", null)

        if (!products || products.length === 0) {
          logger.info(`No products with images for user ${brand.user_id}`)
          continue
        }

        // For each product, check how many pins already exist
        const eligibleProducts = []
        for (const product of products) {
          const { count } = await supabase
            .from("pins")
            .select("id", { count: "exact", head: true })
            .eq("product_id", product.id)
            .neq("status", "failed")

          if ((count || 0) < 5) {
            eligibleProducts.push(product)
          }
        }

        if (eligibleProducts.length === 0) {
          logger.info(`All products for user ${brand.user_id} have sufficient pins`)
          continue
        }

        // Generate up to 3 pins per batch
        const batchProducts = eligibleProducts.slice(0, 3)

        for (const product of batchProducts) {
          try {
            logger.info(`Generating pin for product: ${product.title}`)

            // Step 1: Call generate-pin API (Art Director + Image Gen)
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000'
            const generateRes = await fetch(`${appUrl}/api/generate-pin`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                product_id: product.id,
                user_id: brand.user_id,
              }),
            })

            if (!generateRes.ok) {
              const errText = await generateRes.text()
              logger.error(`Generate failed for ${product.title}: ${errText}`)
              continue
            }

            const genResult = await generateRes.json()
            const pinId = genResult.pinId

            if (!pinId) {
              logger.error(`No pinId returned for ${product.title}`)
              continue
            }

            // Step 2: Generate Pinterest SEO copy
            const copyRes = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [{
                text: `Write a Pinterest SEO description for this pin.
                
Product: "${product.title}"
Pin Title: "${genResult.title}"

Write a 150-300 character description optimized for Pinterest SEO. Include relevant keywords naturally. Do NOT use hashtags. Write in an inviting, editorial tone.

Return ONLY the description text, nothing else.`
              }],
              config: { temperature: 0.6 }
            })

            const pinDescription = copyRes.text?.trim() || `Discover ${product.title}`

            // Step 3: Call render-pin API (text overlay + CTA badge)
            const renderRes = await fetch(`${appUrl}/api/render-pin`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: genResult.imageUrl,
                title: genResult.title,
                templateId: genResult.templateId,
                fontChoice: brand.font_choice || "Playfair Display",
                storeUrl: brand.store_url || "",
                pinId,
              }),
            })

            if (!renderRes.ok) {
              logger.error(`Render failed for pin ${pinId}`)
              await supabase.from("pins").update({ status: "failed", error_message: "Render failed" }).eq("id", pinId)
              continue
            }

            // Step 4: Upload rendered image to R2
            const renderedBuffer = Buffer.from(await renderRes.arrayBuffer())
            const renderedR2Key = `pin-images/${brand.user_id}/${pinId}-final.webp`
            await putR2Object(renderedR2Key, renderedBuffer, "image/png")

            const r2Domain = process.env.R2_PUBLIC_DOMAIN?.replace(/\/$/, "")
            const renderedImageUrl = r2Domain ? `${r2Domain}/${renderedR2Key}` : renderedR2Key

            // Step 5: Update pin record with rendered image + description
            await supabase
              .from("pins")
              .update({
                rendered_image_url: renderedImageUrl,
                rendered_image_r2_key: renderedR2Key,
                pin_description: pinDescription,
                status: "pending_approval",
              })
              .eq("id", pinId)

            // Pin now waits for user approval before entering publish queue

            totalGenerated++
            logger.info(`✅ Pin generated → pending approval: ${pinId} for "${product.title}"`)

          } catch (productError: any) {
            logger.error(`Error generating pin for ${product.title}: ${productError.message}`)
          }
        }

      } catch (brandError: any) {
        logger.error(`Error processing brand ${brand.brand_name}: ${brandError.message}`)
      }
    }

    logger.info(`🎨 PinLoop batch complete: ${totalGenerated} pins generated`)
    return { result: "Batch complete", generated: totalGenerated }
  },
})
