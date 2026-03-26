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
  cron: "*/5 * * * *", // changed temporarily to 5 minutes for user testing
  run: async () => {
    logger.info("🎨 PinLoop batch generator started")

    const supabase = createAdminClient() as any

    // Fetch global trends from Pinterest once per batch to avoid rate limits
    let globalTrends: string[] = []
    try {
      const { data: anyConn } = await supabase.from("pinterest_connections").select("user_id").limit(1).maybeSingle()
      if (anyConn) {
        const token = await getValidAccessToken(anyConn.user_id)
        if (token) {
          globalTrends = await getTrendingKeywords(token, 'US', 'growing')
          logger.info(`Fetched Pinterest Trends: ${globalTrends.slice(0, 5).join(", ")}...`)
        }
      }
    } catch (e) {
      logger.warn("Could not fetch live trends, using fallbacks")
    }
    
    if (globalTrends.length === 0) {
      globalTrends = ['home decor', 'aesthetic lifestyle', 'minimalist style', 'gift ideas', 'seasonal trends']
    }

    // Get all users with brand settings
    const { data: brands, error } = await supabase
      .from("brand_settings")
      .select("id, user_id, brand_name, font_choice, store_url, aesthetic_boundaries, automation_paused, autopilot_enabled, audience_profile, pin_layout_mode")

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

        // For each product, check how many pins already exist
        const eligibleProducts = []
        for (const product of products) {
          const { count } = await supabase
            .from("pins")
            .select("id", { count: "exact", head: true })
            .eq("product_id", product.id)
            .neq("status", "failed")

          if ((count || 0) < 10) {
            eligibleProducts.push(product)
          }
        }

        if (eligibleProducts.length === 0) {
          logger.info(`All products for user ${brand.user_id} have sufficient pins`)
          continue
        }

        // Weekly Shuffle: Randomize product selection so the Approval Inbox has maximum variety
        const shuffledProducts = shuffleArray(eligibleProducts)
        const batchProducts = shuffledProducts.slice(0, 3)

        for (const product of batchProducts) {
          try {
            logger.info(`Generating pin for product: ${product.title}`)

            // Generate unique Context Matrix angle (Semantic De-Duplication)
            const { angle: targetAngle, embedding: angleEmbedding } = await generateUniqueAngle(
              { id: product.id, title: product.title },
              globalTrends,
              brand.aesthetic_boundaries,
              brand.audience_profile
            )
            logger.info(`Selected semantic angle: "${targetAngle}"`)

            // Step 1: Call Gemini Art Director & Fal.ai Inline
            const r2Domain = process.env.R2_PUBLIC_DOMAIN?.replace(/\/$/, "")
            const sourceImageUrl = product.image_url || (r2Domain && product.image_r2_key ? `${r2Domain}/${product.image_r2_key}` : "")
            
            if (!sourceImageUrl) {
              logger.error(`Skipping product ${product.title} because no valid image URL could be resolved`)
              continue
            }
            
            const artDirectorPrompt = `You are an expert Pinterest Marketing Art Director.
Product: "${product.title}"
Angle: "${targetAngle}"

1. Write a photorealistic, 8k background prompt for an image generation model to place this product in a fitting, highly aesthetic lifestyle environment.
2. Write an elegant, 4 to 6 word title for the product. Use nouns, not verbs.
3. Select the best text layout template (template-1, template-2, template-3, template-4, or template-5). template-5 is pure aesthetic (no text) which is usually best.

CRITICAL CONTEXT: The specific lifestyle angle you MUST use for this image is: "${targetAngle}". You MUST design the entire environment, lighting, and aesthetic strictly around this angle.

Return ONLY valid JSON: { "imagePrompt": "...", "title": "...", "templateId": "..." }`

            const planResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: [{ text: artDirectorPrompt }],
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
              is_mood_board: false
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

            // Step 2: Generate premium Pinterest SEO copy (title + description) — ALL modes
            // The metadata is now the PRIMARY driver of discovery for organic pins.
            const copyRes = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [{
                text: `You are a Pinterest SEO expert. Your copy is the PRIMARY driver of discovery and click-through. Make it world-class.

Product: "${product.title}"
Lifestyle Angle: "${targetAngle}"
Trending Keywords this week: ${globalTrends.slice(0, 5).join(', ')}

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

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000'
            const layoutMode = brand.pin_layout_mode || 'organic'
            const renderRes = await fetch(`${appUrl}/api/render-pin`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: rawImageUrl,
                title: genTitle,
                templateId: genTemplateId,
                fontChoice: brand.font_choice || "Playfair Display",
                storeUrl: brand.store_url || "",
                pinId,
                layoutMode,
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

            const renderedImageUrl = r2Domain ? `${r2Domain}/${renderedR2Key}` : renderedR2Key

            // Step 5: Update pin record with rendered image, SEO title, and description
            await supabase
              .from("pins")
              .update({
                rendered_image_url: renderedImageUrl,
                rendered_image_r2_key: renderedR2Key,
                pin_title: pinTitle,          // Override Art Director title with SEO-optimized title
                pin_description: pinDescription,
                status: brand.autopilot_enabled ? "queued" : "pending_approval",
              })
              .eq("id", pinId)

            // Pin now waits for user approval before entering publish queue (unless Autopilot is enabled)

            totalGenerated++
            logger.info(`✅ Pin generated → ${brand.autopilot_enabled ? 'queued (Autopilot)' : 'pending approval'}: ${pinId} for "${product.title}"`)

          } catch (productError: any) {
            logger.error(`Error generating pin for ${product.title}: ${productError.message}`)
          }
        }

        // Feature 14: Generate Trojan Horse "Mood Board" Pin to actively build domain trust
        try {
          logger.info(`Generating Trojan Horse Mood Board pin for brand: ${brand.brand_name}`)
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000'
          const r2DomainMb = process.env.R2_PUBLIC_DOMAIN?.replace(/\/$/, "")

          // Step 1: Gemini Art Director for Mood Board
          const artDirectorPrompt = `You are an expert Pinterest Marketing Art Director. Generate a beautiful, purely aesthetic "Mood Board" lifestyle photo concept.
          
1. Write a photorealistic, 8k background prompt for an image generation model to create a stunning, atmospheric scene based on the brand: "${brand.brand_name}".
2. Write an elegant, 4 to 6 word title for this mood board. Use nouns, not verbs.
3. Select template-2 (Center text) as the text layout template.

Return ONLY valid JSON: { "imagePrompt": "...", "title": "...", "templateId": "..." }`

          const mbPlanResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ text: artDirectorPrompt }],
            config: { temperature: 0.7, responseMimeType: "application/json" }
          })

          const mbPlan = JSON.parse(mbPlanResponse.text?.trim() || '{}')
          const mbPrompt = mbPlan.imagePrompt || `Aesthetic lifestyle mood board for ${brand.brand_name}`
          const mbTitle = mbPlan.title || `${brand.brand_name} Mood Board`
          const mbTemplateId = mbPlan.templateId || "template-2"

          // Step 2: Fal.ai Generation
          logger.info(`Starting fal.ai Mood Board generation for ${brand.brand_name}...`)
          const mbResult: any = await fal.subscribe("fal-ai/flux/dev", {
            input: {
              prompt: mbPrompt,
              num_images: 1,
              image_size: { width: 1000, height: 1500 },
              output_format: "png",
            },
          })

          const mbFalImageUrl = mbResult.data?.images?.[0]?.url
          if (!mbFalImageUrl) {
            logger.error("Fal.ai returned no Mood Board image URL. Full Result:", mbResult)
            throw new Error("Fal.ai returned no Mood Board image URL")
          }
          logger.info(`✅ Fal.ai successfully generated Mood Board image: ${mbFalImageUrl}`)

          // Save pin to DB for ID
          const { data: mbPin } = await supabase.from('pins').insert({
            user_id: brand.user_id,
            brand_settings_id: brand.id,
            art_director_prompt: mbPrompt,
            template_id: mbTemplateId,
            pin_title: mbTitle,
            status: 'generating',
            is_mood_board: true
          }).select('id').single()

          const mbPinId = mbPin?.id
          if (!mbPinId) throw new Error("No pinId returned from DB for Mood Board")

          // Download & Save raw to R2
          const mbFalRes = await fetch(mbFalImageUrl)
          const mbFalBuffer = Buffer.from(await mbFalRes.arrayBuffer())
          const mbRawR2Key = `pin-images/${brand.user_id}/${mbPinId}-raw.png`
          await putR2Object(mbRawR2Key, mbFalBuffer, "image/png")
          const mbRawImageUrl = r2DomainMb ? `${r2DomainMb}/${mbRawR2Key}` : mbRawR2Key

          // Step 3: SEO Copy
          const copyRes = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{
              text: `Write a Pinterest SEO description for this aesthetic mood board image.
              Pin Title: "${mbTitle}"
              Write a 150-300 character description optimized for Pinterest SEO. Include relevant aesthetic keywords naturally. Do NOT use hashtags. Write in an inviting, editorial tone.
              Return ONLY the description text, nothing else.`
            }],
            config: { temperature: 0.6 }
          })
          const mbDescription = copyRes.text?.trim() || `Discover ${mbTitle}`

          // Step 4: Render Pin
          const renderRes = await fetch(`${appUrl}/api/render-pin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: mbRawImageUrl,
              title: mbTitle,
              templateId: mbTemplateId,
              fontChoice: brand.font_choice || "Playfair Display",
              storeUrl: brand.store_url || "",
              pinId: mbPinId,
              layoutMode: "editorial", // Usually moodboards have text
            }),
          })

          if (!renderRes.ok) {
            await supabase.from("pins").update({ status: "failed", error_message: "Render failed" }).eq("id", mbPinId)
            throw new Error(`Render failed for mb pin ${mbPinId}`)
          }

          // Step 5: Save Rendered to R2 & Update DB
          const renderedBuffer = Buffer.from(await renderRes.arrayBuffer())
          const renderedR2Key = `pin-images/${brand.user_id}/${mbPinId}-final.png`
          await putR2Object(renderedR2Key, renderedBuffer, "image/png")
          const renderedImageUrl = r2DomainMb ? `${r2DomainMb}/${renderedR2Key}` : renderedR2Key

          await supabase.from("pins").update({
            rendered_image_url: renderedImageUrl,
            rendered_image_r2_key: renderedR2Key,
            pin_description: mbDescription,
            status: brand.autopilot_enabled ? "queued" : "pending_approval",
          }).eq("id", mbPinId)

          totalGenerated++
          logger.info(`✅ Mood Board generated → ${brand.autopilot_enabled ? 'queued' : 'pending approval'}: ${mbPinId}`)

        } catch (moodBoardError: any) {
          logger.error(`Error generating Mood Board for ${brand.brand_name}: ${moodBoardError.message}`)
        }
      } catch (brandError: any) {
        logger.error(`Error processing brand ${brand.brand_name}: ${brandError.message}`)
      }
    }

    logger.info(`🎨 PinLoop batch complete: ${totalGenerated} pins generated`)
    return { result: "Batch complete", generated: totalGenerated }
  },
})
