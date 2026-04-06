import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { putR2Object } from "@/lib/r2"
import { GoogleGenAI } from "@google/genai"
import { fal } from "@fal-ai/client"
import { getValidAccessToken, getTrendingKeywords } from "@/lib/pinterest-api"
import { generateUniqueAngle } from "@/lib/context-matrix"

const ai = new GoogleGenAI({ apiKey: process.env.MYGEMINI_API_KEY })
fal.config({ credentials: process.env.FAL_KEY || "" })

// Fisher-Yates shuffle — ensures the Approval Inbox feels like a curated magazine, not a bulk generator
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

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
  cron: "*/5 * * * *",
  run: async () => {
    logger.info("🎨 PinLoop batch generator started")

    const supabase = createAdminClient() as any



    // Get all users with brand settings
    const { data: brands, error } = await supabase
      .from("brand_settings")
      .select("id, user_id, brand_name, font_choice, store_url, aesthetic_boundaries, automation_paused, audience_profile, pin_layout_mode")

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

        // 1. API Safeguards: Check 150-pin monthly generation limit
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { count: cycleGenerations } = await supabase
          .from("pins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", brand.user_id)
          .gte("created_at", thirtyDaysAgo.toISOString())

        if ((cycleGenerations || 0) >= 150) {
          logger.warn(`User ${brand.user_id} hit the 150/mo API Safeguard limit. Pausing automation.`)
          // Auto-pause their automation to protect API costs from going rogue or endless rejections
          await supabase.from("brand_settings").update({ automation_paused: true }).eq("id", brand.id)
          continue
        }

        // Check pending approval cap (> 50 pins waiting = skip generation)
        const { count: pendingCount } = await supabase
          .from("pins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", brand.user_id)
          .eq("status", "pending_approval")

        if ((pendingCount || 0) >= 50) {
          logger.info(`User ${brand.user_id} has >= 50 pins pending approval. Skipping generation to save API costs.`)
          continue
        }

        // Get products that need pins (active products that have an image)
        const { data: products } = await supabase
          .from("products")
          .select("id, title, image_r2_key, image_url")
          .eq("user_id", brand.user_id)
          .eq("is_active", true)
          .not("image_url", "is", null)

        if (!products || products.length === 0) {
          logger.info(`No products with images for user ${brand.user_id}`)
          continue
        }

        // 1. Calculate Monthly Quota (100-Pin Hard Cap)
        const pastThirtyDays = new Date()
        pastThirtyDays.setDate(pastThirtyDays.getDate() - 30)

        const { data: userPins } = await supabase
          .from("pins")
          .select("id, product_id, created_at, status, target_angle")
          .eq("user_id", brand.user_id)

        const monthlyPins = (userPins || []).filter((p: any) => new Date(p.created_at) >= pastThirtyDays)
        if (monthlyPins.length >= 100) {
          logger.info(`User ${brand.user_id} hit the 100-pin monthly quota limit. Skipping generation.`)
          continue
        }

        // 2. Filter Eligible Products
        // Dynamic per-product cap: distribute 100-pin quota evenly across catalog.
        // With 2 products → max 15 each. With 40 products → max 3 each. Hard ceiling of 15.
        const perProductCap = Math.min(15, Math.ceil(100 / products.length))
        
        const eligibleProducts = products.filter((prod: any) => {
          const prodPins = (userPins || []).filter((p: any) => p.product_id === prod.id)
          // Check pending approval queue limit (max 10 sitting unapproved)
          const pendingCount = prodPins.filter((p: any) => !['published', 'failed'].includes(p.status)).length
          if (pendingCount >= 10) return false
          // Check monthly per-product cap
          const monthlyProdPins = prodPins.filter((p: any) => new Date(p.created_at) >= pastThirtyDays)
          if (monthlyProdPins.length >= perProductCap) return false
          return true
        })

        if (eligibleProducts.length === 0) {
          logger.info(`All products for user ${brand.user_id} have sufficient pins or hit limit`)
          continue
        }

        // 3. Round-Robin Array: Sort products by oldest `last_generated_at`
        const productsWithLastGen = eligibleProducts.map((prod: any) => {
          const prodPins = (userPins || []).filter((p: any) => p.product_id === prod.id)
          let lastGenTime = 0
          if (prodPins.length > 0) {
            const dates = prodPins.map((p: any) => new Date(p.created_at).getTime())
            lastGenTime = Math.max(...dates)
          }
          return { ...prod, last_generated_at: lastGenTime }
        })

        productsWithLastGen.sort((a: any, b: any) => a.last_generated_at - b.last_generated_at)

        // Fetch trends isolated per-user to comply with Pinterest API guidelines
        let brandTrends: string[] = ['home decor', 'aesthetic lifestyle', 'minimalist style', 'gift ideas', 'seasonal trends']
        try {
          const token = await getValidAccessToken(brand.user_id)
          if (token) {
            const fetchedTrends = await getTrendingKeywords(token, 'US', 'growing')
            if (fetchedTrends && fetchedTrends.length > 0) {
              brandTrends = fetchedTrends
              logger.info(`Fetched isolated Pinterest Trends for ${brand.user_id}: ${brandTrends.slice(0, 5).join(", ")}...`)
            }
          }
        } catch (e) {
          logger.warn(`Could not fetch live trends for user ${brand.user_id}, using fallbacks`)
        }

        // Grab exactly 1 product to generate (4 pins generated a day on 6hr cron interval)
        const batchProducts = productsWithLastGen.slice(0, 1)

        for (const product of batchProducts) {
          try {
            logger.info(`Generating pin for product: ${product.title}`)

            // Generate unique Context Matrix angle (Semantic De-Duplication)
            const prodPins = (userPins || []).filter((p: any) => p.product_id === product.id)
            const pastAngles = prodPins.map((p: any) => p.target_angle).filter(Boolean)

            const { angle: targetAngle, embedding: angleEmbedding } = await generateUniqueAngle(
              { id: product.id, title: product.title, description: product.description },
              brandTrends,
              brand.aesthetic_boundaries,
              brand.audience_profile,
              pastAngles
            )
            logger.info(`Selected semantic angle: "${targetAngle}"`)

            // Step 1: Call Gemini Art Director & Fal.ai Inline
            const r2Domain = process.env.R2_PUBLIC_DOMAIN?.replace(/\/$/, "")
            const sourceImageUrl = product.image_url || (r2Domain && product.image_r2_key ? `${r2Domain}/${product.image_r2_key}` : "")

            if (!sourceImageUrl) {
              logger.error(`Skipping product ${product.title} because no valid image URL could be resolved`)
              continue
            }

            const cameraAngles = [
              "Macro close-up shot",
              "Overhead flat-lay shot",
              "Dynamic low-angle shot",
              "Eye-level straight on shot",
              "Wide environmental shot",
              "Symmetrical Wes Anderson style shot",
              "Dutch angle, dramatic tilt",
              "Ultra-wide establishing shot",
              "Shallow depth of field with heavy bokeh",
              "First-person POV perspective",
              "Intimate over-the-shoulder perspective",
              "Isometric 3D perspective style",
              "Telephoto compressed background shot"
            ]
            const lightingStyles = [
              "Golden hour sunlight streaming through a window",
              "Moody cinematic shadows with soft diffused light",
              "Bright, high-key studio lighting",
              "Harsh sunlight with strong, defined shadows",
              "Soft, glowing evening ambient light",
              "Neon cyberpunk glow with pink and blue hues",
              "Warm, flickering candlelit ambiance",
              "Dappled sunlight filtering through tree leaves",
              "Harsh direct flash, paparazzi style",
              "Overcast, flat diffused daylight",
              "Cinematic rim lighting separating subject from background",
              "Ethereal, misty morning light",
              "Dramatic chiaroscuro Renaissance lighting"
            ]
            
            const randomCamera = cameraAngles[Math.floor(Math.random() * cameraAngles.length)]
            const randomLighting = lightingStyles[Math.floor(Math.random() * lightingStyles.length)]

            const artDirectorPrompt = `You are an expert Pinterest Marketing Art Director.
Product: "${product.title}"
Habitat & Aesthetic Vibe: "${targetAngle}"

1. Look closely at the attached image of the product.
2. Write a photorealistic, 8k image generation prompt. The prompt MUST:
   a. Start by describing the product ("${product.title}") in its exact real-world form — its shape, color, size, label, packaging.
   b. Then describe the environment/habitat around it based on the Vibe above.
   c. Use Camera Angle: [${randomCamera}]
   d. Use Lighting Style: [${randomLighting}]
3. CRITICAL: The product "${product.title}" MUST be the hero subject in the center of the scene. Do NOT write a prompt that only describes a background or room.
4. Do NOT alter the product's shape, text, or structure. Keep it structurally faithful to the real product.
5. Write an elegant, 4 to 6 word title for the product. Use nouns, not verbs.
6. Select the best text layout template (template-1, template-2, template-3, template-4, or template-5). template-5 is pure aesthetic (no text) which is usually best.

Return ONLY valid JSON: { "imagePrompt": "...", "title": "...", "templateId": "..." }`

            // Fetch product image to give Gemini visual context
            let imagePart: any = null
            try {
              const imgRes = await fetch(sourceImageUrl)
              if (imgRes.ok) {
                const imgBuffer = await imgRes.arrayBuffer()
                const imgBase64 = Buffer.from(imgBuffer).toString('base64')
                const mimeType = imgRes.headers.get('content-type') || 'image/jpeg'
                imagePart = { inlineData: { data: imgBase64, mimeType } }
              }
            } catch (err) {
              logger.warn(`Failed to fetch product image for Gemini context`)
            }

            const promptParts: any[] = [{ text: artDirectorPrompt }]
            if (imagePart) promptParts.push(imagePart)

            const planResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: promptParts,
              config: { temperature: 0.7, responseMimeType: "application/json" }
            })

            const plan = JSON.parse(planResponse.text?.trim() || '{}')
            const dynamicImagePrompt = plan.imagePrompt || `Aesthetic lifestyle shot of ${product.title}, photorealistic 8k`
            const genTitle = plan.title || product.title
            const genTemplateId = plan.templateId || "template-5"

            logger.info(`Art Director Prompt: ${dynamicImagePrompt}`)

            // Firing Fal.ai Native Polling
            logger.info(`Starting fal.ai generation for ${product.title}...`)
            const result: any = await fal.subscribe("fal-ai/nano-banana-2/edit", {
              input: {
                prompt: dynamicImagePrompt,
                num_images: 1,
                aspect_ratio: "2:3",
                output_format: "png",
                safety_tolerance: "4",
                image_urls: [sourceImageUrl],
                resolution: "1K",
                limit_generations: true,
                thinking_level: "minimal"
              },
              logs: true,
              onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                  update.logs.map((log) => log.message).forEach(console.log)
                }
              },
            })

            const falImageUrl = result.data?.images?.[0]?.url
            if (!falImageUrl) {
              logger.error("Fal.ai returned no image URL. Full Result:", result)
              continue
            }
            logger.info(`✅ Fal.ai successfully generated image: ${falImageUrl}`)

            // Save pin record to DB to reserve ID
            const { data: pin } = await supabase.from('pins').insert({
              user_id: brand.user_id,
              product_id: product.id,
              brand_settings_id: brand.id,
              art_director_prompt: dynamicImagePrompt,
              target_angle: targetAngle,
              angle_embedding: angleEmbedding ? `[${Array.from(angleEmbedding).join(",")}]` : null,
              template_id: genTemplateId,
              pin_title: genTitle,
              status: 'generating',
              is_mood_board: Math.random() < 0.1
            }).select('id').single()

            const pinId = pin?.id
            if (!pinId) {
              logger.error(`No pinId returned from DB for ${product.title}`)
              continue
            }

            // Download from Fal and save to R2
            logger.info(`Downloading image from Fal...`)
            const falImageRes = await fetch(falImageUrl)
            const falImageBuffer = Buffer.from(await falImageRes.arrayBuffer())
            const rawR2Key = `pin-images/${brand.user_id}/${pinId}-raw.png`
            await putR2Object(rawR2Key, falImageBuffer, "image/png")

            const rawImageUrl = r2Domain ? `${r2Domain}/${rawR2Key}` : rawR2Key

            // Save the raw image to DB immediately so it's not lost on render failure
            await supabase.from("pins").update({
              generated_image_url: rawImageUrl,
              generated_image_r2_key: rawR2Key
            }).eq("id", pinId)

            // Step 2: Generate premium Pinterest SEO copy (title + description) — ALL modes
            // The metadata is now the PRIMARY driver of discovery for organic pins.
            const copyRes = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [{
                text: `You are a Pinterest SEO expert. Your copy is the PRIMARY driver of discovery and click-through. Make it world-class.

Product: "${product.title}"
Lifestyle Angle: "${targetAngle}"
Trending Keywords this week: ${brandTrends.slice(0, 5).join(', ')}

Generate:

1. PIN TITLE (max 100 chars): Keyword-first. Hook the searcher. Make it sound desirable. No hashtags. No ALL CAPS. No generic "Buy Now" language.
   Good example: "Sunlit Nursery Aesthetic — Handmade Terrazzo Kids Chair"
   Bad example: "Kids Chair For Sale"

2. PIN DESCRIPTION (150-300 chars): Evocative, editorial copy. Weave the trend keyword in naturally. Paint the lifestyle. End with a soft discovery word (Explore, Discover, Shop the look). No hashtags.

Return ONLY valid JSON: { "seo_title": "...", "seo_description": "..." }`
              }],
              config: {
                temperature: 0.7,
                responseMimeType: "application/json",
              }
            })

            let pinTitle = genTitle
            let pinDescription = `Discover ${product.title}`
            try {
              const seoData = JSON.parse(copyRes.text?.trim() || '{}')
              if (seoData.seo_title) pinTitle = seoData.seo_title.slice(0, 100)
              if (seoData.seo_description) pinDescription = seoData.seo_description.slice(0, 500)
            } catch {
              logger.warn(`SEO copy parse failed for ${product.title}, using Art Director title`)
            }

            const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000').replace(/\/$/, '')
            const layoutMode = brand.pin_layout_mode || 'organic'

            const renderParams = new URLSearchParams({
              imageUrl: rawImageUrl,
              title: genTitle,
              templateId: genTemplateId,
              fontChoice: brand.font_choice || "Playfair Display",
              storeUrl: brand.store_url || "",
              pinId,
              layoutMode,
            })

            const renderRes = await fetch(`${appUrl}/api/render-pin?${renderParams.toString()}`)

            if (!renderRes.ok) {
              const errText = await renderRes.text().catch(() => "Unable to read error text")
              logger.error(`Render failed for pin ${pinId}: STATUS ${renderRes.status} | MSG: ${errText} | Sent Image: ${rawImageUrl}`)
              await supabase.from("pins").update({ status: "failed", error_message: "Render failed" }).eq("id", pinId)
              continue
            }

            // Step 4: Validate rendered image is not blank/broken (a real 1000x1500 PNG is >50KB)
            const renderedBuffer = Buffer.from(await renderRes.arrayBuffer())
            if (renderedBuffer.length < 10000) {
              logger.error(`Render returned suspiciously small image (${renderedBuffer.length} bytes) for pin ${pinId}. Likely a blank/black render. Marking as failed.`)
              await supabase.from("pins").update({ status: "failed", error_message: `Render produced blank image (${renderedBuffer.length} bytes)` }).eq("id", pinId)
              continue
            }

            const renderedR2Key = `pin-images/${brand.user_id}/${pinId}-final.png`
            await putR2Object(renderedR2Key, renderedBuffer, "image/png")

            const renderedImageUrl = r2Domain ? `${r2Domain}/${renderedR2Key}` : renderedR2Key

            // Step 5: Update pin record with rendered image, SEO title, and description
            await supabase
              .from("pins")
              .update({
                rendered_image_url: renderedImageUrl,
                rendered_image_r2_key: renderedR2Key,
                pin_title: pinTitle,          // Override Art Director title with SEO-optimized title
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
