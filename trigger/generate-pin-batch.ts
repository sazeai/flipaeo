import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { putR2Object } from "@/lib/r2"
import { GoogleGenAI } from "@google/genai"
import { fal } from "@fal-ai/client"
import { generateUniqueAngle, normalizeAestheticTag, AESTHETIC_DEFINITIONS } from "@/lib/context-matrix"
import { resolveProductShowcase, pickShowcaseForPin, isDigitalProduct } from "@/lib/product-showcase"
import { validatePrompt } from "@/lib/prompt-critic"
import { adminHasCredits, adminDeductCredits } from "@/lib/credits"

const ai = new GoogleGenAI({ apiKey: process.env.MYGEMINI_API_KEY })
fal.config({ credentials: process.env.FAL_KEY || "" })

const AUTHENTIC_HANDMADE_TAG = "Authentic & Handmade"

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
    logger.info("🎨 EcomPin batch generator started")

    const supabase = createAdminClient() as any



    // Get all users with brand settings
    const { data: brands, error } = await supabase
      .from("brand_settings")
      .select("id, user_id, brand_name, store_url, aesthetic_boundaries, automation_paused, show_brand_url")

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
          .select("id, title, description, image_r2_key, image_url, tags")
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

        // Grab exactly 1 product to generate (4 pins generated a day on 6hr cron interval)
        const batchProducts = productsWithLastGen.slice(0, 1)

        for (const product of batchProducts) {
          try {
            logger.info(`Generating pin for product: ${product.title}`)

            // Skip digital/downloadable products — no physical product to composite
            if (isDigitalProduct({ title: product.title, description: product.description }, product.tags)) {
              logger.info(`Skipping digital product: ${product.title} — flagged for manual pin creation`)
              continue
            }

            // Resolve source image URL first — needed for both Showcase Resolver and Art Director
            const r2Domain = process.env.R2_PUBLIC_DOMAIN?.replace(/\/$/, "")
            const sourceImageUrl = product.image_url || (r2Domain && product.image_r2_key ? `${r2Domain}/${product.image_r2_key}` : "")

            if (!sourceImageUrl) {
              logger.error(`Skipping product ${product.title} because no valid image URL could be resolved`)
              continue
            }

            // Fetch product image once — reused by Showcase Resolver, Art Director, and fal.ai
            let productImageBase64: string | null = null
            let productImageMimeType: string | null = null
            try {
              const imgRes = await fetch(sourceImageUrl)
              if (imgRes.ok) {
                const imgBuffer = await imgRes.arrayBuffer()
                productImageBase64 = Buffer.from(imgBuffer).toString('base64')
                productImageMimeType = imgRes.headers.get('content-type') || 'image/jpeg'
              }
            } catch (err) {
              logger.warn(`Failed to fetch product image for multimodal context`)
            }

            // Stage 1: Product Showcase Resolver — returns ALL viable presentation modes
            logger.info(`Resolving showcase strategy for: ${product.title}`)
            const showcaseAnalysis = await resolveProductShowcase(
              { title: product.title, description: product.description },
              productImageBase64,
              productImageMimeType,
              product.tags,
            )
            logger.info(`Showcase analysis: ${showcaseAnalysis.viableModes.length} viable modes for "${showcaseAnalysis.productType}"`)

            // Pick one mode by rotating through viable modes using per-product pin count
            // Pin 0 → mode[0], Pin 1 → mode[1], Pin 2 → mode[2], Pin 3 → wraps to mode[0] with fresh scene
            const prodPins = (userPins || []).filter((p: any) => p.product_id === product.id)
            const showcase = pickShowcaseForPin(showcaseAnalysis, prodPins.length)
            logger.info(`Picked showcase: ${showcase.presentationMode} | ${showcase.heroAction} | ${showcase.cameraAngle}`)

            // Stage 2: Generate unique Context Matrix angle (Semantic De-Duplication)
            // Showcase strategy is passed as locked constraints.
            // Pass recent past angles across ALL products to ensure brand-level variety
            const pastAngles = (userPins || [])
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((p: any) => p.target_angle)
              .filter(Boolean)

            // Fetch learned aesthetic weights from the feedback loop (aesthetic-optimizer.ts)
            // These weights bias selection toward aesthetics with higher CTR
            let aestheticWeights: Record<string, number> | undefined
            try {
              const { data: weightRows } = await supabase
                .from("prompt_weights")
                .select("aesthetic_tags, weight")
                .eq("user_id", brand.user_id)
                .eq("brand_settings_id", brand.id)

              if (weightRows && weightRows.length > 0) {
                aestheticWeights = {}
                for (const row of weightRows) {
                  const tags = row.aesthetic_tags as string[]
                  if (tags && tags.length > 0 && row.weight) {
                    aestheticWeights[tags[0]] = Number(row.weight)
                  }
                }
                logger.info(`Loaded ${Object.keys(aestheticWeights).length} aesthetic weights for optimization`)
              }
            } catch {
              // No weights yet (cold start) — pickAestheticForPin falls back to round-robin
            }

            const { angle: targetAngle, embedding: angleEmbedding, pickedAesthetic } = await generateUniqueAngle(
              { id: product.id, title: product.title, description: product.description },
              brand.aesthetic_boundaries,
              pastAngles,
              showcase,
              prodPins.length,  // Per-product pin count ensures rotation for THIS product
              aestheticWeights,
            )
            logger.info(`Selected semantic angle: "${targetAngle}" | Aesthetic: "${pickedAesthetic.tag}"`)

            const authenticHandmadeMode = pickedAesthetic.tag === AUTHENTIC_HANDMADE_TAG

            // Stage 3: Art Director — writes fal.ai prompt using two-tier architecture
            // Tier 1: ALL constraints as reasoning context for Gemini
            // Tier 2: Output rules demanding positive-only visual scene description

            const artDirectorPrompt = `You are an expert product photography Art Director. Your job is to write a single, coherent scene description for fal.ai image editing. The source product image will be composited into the scene you describe.

═══ CREATIVE CONTEXT (use these to inform your choices — do NOT copy them into the output) ═══

PRODUCT: ${showcase.productAppearance}
FAMILY: ${showcase.productFamily}
PRODUCT TYPE: ${showcase.productType}
SHOT: ${showcase.presentationMode}, ${showcase.heroAction}
CAMERA: ${showcase.cameraAngle}
SETTING: ${showcase.naturalEnvironment}
SCENE SCOPE: ${showcase.sceneScope}
SCALE RULE: ${showcase.scaleGuidance}
SCENE CONCEPT: ${targetAngle}
STYLE: ${pickedAesthetic.tag} — ${pickedAesthetic.definition}

═══ OUTPUT RULES (follow these exactly) ═══

Write a single flowing scene description, max 80 words. Rules:
- Start with the product: what it is, how it appears, what it's doing in the scene
- Describe ONLY what the camera will physically see: surfaces, materials, light, atmosphere
- The product must keep its exact original colors, materials, shape, quantity, and design from the source image
- Apply the style's lighting and color palette to the ENVIRONMENT only, not the product itself
- No meta-instructions ("do not", "avoid", "ensure", "make sure")
- No lists of props to include or exclude which is not necessary to the core scene concept of the product niche itself
- No references to "the viewer", "the camera", "the model" as abstract concepts
- End with: "${authenticHandmadeMode ? 'authentic product photo, natural window light, slight grain, 8k' : 'editorial product photography, soft natural light, 8k'}"

Return ONLY JSON: { "imagePrompt": "..." }`

            // Reuse product image fetched earlier for Gemini Art Director multimodal context
            const imagePart = productImageBase64 && productImageMimeType
              ? { inlineData: { data: productImageBase64, mimeType: productImageMimeType } }
              : null

            const promptParts: any[] = [{ text: artDirectorPrompt }]
            if (imagePart) promptParts.push(imagePart)

            const planResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: promptParts,
              config: { temperature: 0.7, responseMimeType: "application/json" }
            })

            const plan = JSON.parse(planResponse.text?.trim() || '{}')
            let dynamicImagePrompt = plan.imagePrompt || `Aesthetic lifestyle shot of ${product.title}, photorealistic 8k`

            // Prompt Critic — validate before sending to fal.ai
            const criticResult = validatePrompt(dynamicImagePrompt, showcase)
            if (!criticResult.valid) {
              logger.warn(`Prompt critic flagged issues: ${criticResult.issues.join("; ")}`)
              // Retry Art Director with critic feedback (up to 2x)
              for (let retry = 0; retry < 2; retry++) {
                const retryPrompt = `${artDirectorPrompt}\n\nCRITICAL CORRECTIONS — your previous prompt had these issues:\n${criticResult.issues.map(i => `- ${i}`).join("\n")}\nFix these issues in the new prompt.`
                const retryParts: any[] = [{ text: retryPrompt }]
                if (imagePart) retryParts.push(imagePart)

                const retryResponse = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: retryParts,
                  config: { temperature: 0.5, responseMimeType: "application/json" }
                })
                const retryPlan = JSON.parse(retryResponse.text?.trim() || '{}')
                const retryPromptText = retryPlan.imagePrompt || dynamicImagePrompt
                const retryCritic = validatePrompt(retryPromptText, showcase)
                if (retryCritic.valid) {
                  dynamicImagePrompt = retryPromptText
                  logger.info(`Prompt critic passed on retry ${retry + 1}`)
                  break
                }
                logger.warn(`Prompt critic retry ${retry + 1} still has issues: ${retryCritic.issues.join("; ")}`)
              }
            }

            logger.info(`Art Director Prompt: ${dynamicImagePrompt}`)

            // Credit gate: verify the user has at least 1 credit before spending API budget
            const { hasCredits: hasSufficientCredits } = await adminHasCredits(brand.user_id, 1)
            if (!hasSufficientCredits) {
              logger.info(`User ${brand.user_id} has insufficient credits — skipping pin generation`)
              continue
            }

            // Firing Fal.ai Native Polling
            logger.info(`Starting fal.ai generation for ${product.title}...`)
            const result: any = await fal.subscribe("fal-ai/flux-2/edit", {
              input: {
                prompt: dynamicImagePrompt,
                num_inference_steps: 50,
                guidance_scale: 3.5,
                image_size: {
                  width: 1000,
                  height: 1500
                },
                num_images: 1,
                enable_safety_checker: true,
                acceleration: "regular",
                output_format: "png",
                image_urls: [sourceImageUrl],
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
              template_id: 'template-5',
              pin_title: product.title,
              aesthetic_tag: pickedAesthetic.tag,
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
                text: `You write Pinterest pin titles and descriptions that rank in Pinterest search and drive clicks to product pages.

Product name: "${product.title}"
${product.description ? `Product details: "${product.description}"` : ''}
Creative angle for this pin: "${targetAngle}"

Pinterest SEO rules you MUST follow:
- Pinterest extracts "annotations" (1-6 word keyword phrases) from pin titles and descriptions, then scores relevance
- Titles with specific, searchable terms outperform generic aesthetic language
- Users search Pinterest like Google: "peanut butter jar gift set", "face serum for acne", "wooden kids chair"
- The title must sound like something a real person would type into Pinterest search

Generate:

1. PIN TITLE (max 100 chars):
   - Lead with the most specific, searchable product term
   - Include 1-2 descriptive modifiers real shoppers would search for (material, use-case, benefit, occasion)
   - Make it read naturally — not keyword-stuffed
   - NEVER use generic filler like "Aesthetic", "Lifestyle", "Home Decor Finds", "Essential", "Collection"
   - NEVER use em-dashes (—) or en-dashes (–) to bolt on generic suffixes
   - Good: "Pintola Peanut Butter Jar — Perfect Protein-Packed Snack for Gym Days"
   - Good: "Lashika Anti-Acne Face Serum with Niacinamide for Clear Skin"
   - Good: "Handmade Terrazzo Kids Chair for Sunlit Nursery Rooms"
   - Bad: "Aesthetic Lifestyle: Pintola Stone Garden — Minimalist Home Decor" (generic filler)
   - Bad: "Sun-Dappled Aesthetic: Pintola Jar & Roasted Peanuts" (describes the photo, not the product)

2. PIN DESCRIPTION (150-300 chars):
   - Open with what the product IS and who it's for
   - Include 2-3 natural long-tail keyword phrases shoppers would search
   - Mention a specific benefit, ingredient, material, or use-case
   - End with a single call-to-action phrase: "Shop now", "Get yours", "See more", "Save for later"
   - NEVER use hashtags
   - Write like a product copywriter, not a poet

Return ONLY valid JSON: { "seo_title": "...", "seo_description": "..." }`
              }],
              config: {
                temperature: 0.6,
                responseMimeType: "application/json",
              }
            })

            let pinTitle = product.title
            let pinDescription = `Discover ${product.title}`
            try {
              const seoData = JSON.parse(copyRes.text?.trim() || '{}')
              if (seoData.seo_title) pinTitle = seoData.seo_title.slice(0, 100)
              if (seoData.seo_description) pinDescription = seoData.seo_description.slice(0, 500)
            } catch {
              logger.warn(`SEO copy parse failed for ${product.title}, using Art Director title`)
            }

            // Save SEO title + description NOW, before render — so they survive render failures
            await supabase.from("pins").update({
              pin_title: pinTitle,
              pin_description: pinDescription,
            }).eq("id", pinId)
            logger.info(`SEO data saved for pin ${pinId}: "${pinTitle}"`)

            let appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000').replace(/\/$/, '')
            if (!appUrl.startsWith('http')) {
              // Vercel deployment URLs (e.g. ecompin.com) come without protocol
              appUrl = `https://${appUrl}`
            }

            // Render bypass: skip render-pin when brand URL watermark is disabled
            const shouldRender = brand.show_brand_url !== false && !!brand.store_url

            if (shouldRender) {
              // Call render-pin to add CTA badge overlay
              const renderRes = await fetch(`${appUrl}/api/render-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: rawImageUrl,
                  storeUrl: brand.store_url || "",
                }),
              })

              if (!renderRes.ok) {
                const errText = await renderRes.text().catch(() => "Unable to read error text")
                logger.error(`Render failed for pin ${pinId}: STATUS ${renderRes.status} | MSG: ${errText} | Sent Image: ${rawImageUrl}`)
                await supabase.from("pins").update({ status: "failed", error_message: "Render failed" }).eq("id", pinId)
                continue
              }

              // Validate rendered image is not blank/broken (a real 1000x1500 PNG is >50KB)
              const renderedBuffer = Buffer.from(await renderRes.arrayBuffer())
              if (renderedBuffer.length < 10000) {
                logger.error(`Render returned suspiciously small image (${renderedBuffer.length} bytes) for pin ${pinId}. Likely a blank/black render. Marking as failed.`)
                await supabase.from("pins").update({ status: "failed", error_message: `Render produced blank image (${renderedBuffer.length} bytes)` }).eq("id", pinId)
                continue
              }

              const renderedR2Key = `pin-images/${brand.user_id}/${pinId}-final.png`
              await putR2Object(renderedR2Key, renderedBuffer, "image/png")

              const renderedImageUrl = r2Domain ? `${r2Domain}/${renderedR2Key}` : renderedR2Key

              await supabase
                .from("pins")
                .update({
                  rendered_image_url: renderedImageUrl,
                  rendered_image_r2_key: renderedR2Key,
                  status: "pending_approval",
                })
                .eq("id", pinId)
            } else {
              // No watermark — raw fal.ai image IS the final pin
              logger.info(`Skipping render-pin for pin ${pinId} (show_brand_url=false or no store_url)`)
              await supabase
                .from("pins")
                .update({
                  rendered_image_url: rawImageUrl,
                  rendered_image_r2_key: rawR2Key,
                  status: "pending_approval",
                })
                .eq("id", pinId)
            }

            // Pin now waits for user approval before entering publish queue

            // Deduct 1 credit for the successfully generated pin
            const { success: creditDeducted, error: creditError } = await adminDeductCredits(
              brand.user_id,
              1,
              `Pin generated: ${pinId}`
            )
            if (!creditDeducted) {
              logger.warn(`Credit deduction failed for user ${brand.user_id}: ${creditError}`)
            } else {
              logger.info(`💳 1 credit deducted for user ${brand.user_id} (pin ${pinId})`)
            }

            totalGenerated++
            logger.info(`✅ Pin generated → pending approval: ${pinId} for "${product.title}"`)

            // ─── A/B Experiment Triggering ───────────────────────────────
            // Conditions: product has ≥3 published pins, no running experiments,
            // user has ≥2 aesthetics, and 25% random chance per eligible product.
            // When triggered, generate a second pin with a different aesthetic.
            try {
              const publishedProdPins = prodPins.filter((p: any) => p.status === 'published')
              const hasSufficientHistory = publishedProdPins.length >= 3
              const hasMultipleAesthetics = (brand.aesthetic_boundaries || []).length >= 2
              const randomTrigger = Math.random() < 0.25

              if (hasSufficientHistory && hasMultipleAesthetics && randomTrigger) {
                // Check for existing running experiments on this product
                const { count: runningExperiments } = await supabase
                  .from("ab_experiments")
                  .select("id", { count: "exact", head: true })
                  .eq("product_id", product.id)
                  .eq("status", "running")

                if ((runningExperiments || 0) === 0) {
                  logger.info(`🧪 A/B experiment triggered for ${product.title}`)

                  // Pick a DIFFERENT aesthetic for the B variant
                  // Find the aesthetic with least performance data (most under-explored)
                  const usedTag = pickedAesthetic.tag
                  const altBoundaries = (brand.aesthetic_boundaries as string[]).filter(
                    (b: string) => normalizeAestheticTag(b) !== usedTag
                  )

                  if (altBoundaries.length > 0) {
                    // Pick the least-used aesthetic from weights, or random if no data
                    let altTag: string
                    if (aestheticWeights && Object.keys(aestheticWeights).length > 0) {
                      // Pick the aesthetic with least total data (lowest pin count)
                      const sorted = altBoundaries
                        .map(b => ({ tag: normalizeAestheticTag(b), weight: aestheticWeights![normalizeAestheticTag(b)] ?? 0 }))
                        .sort((a, b) => a.weight - b.weight)
                      altTag = sorted[0].tag
                    } else {
                      altTag = normalizeAestheticTag(altBoundaries[Math.floor(Math.random() * altBoundaries.length)])
                    }

                    const altDefinition = AESTHETIC_DEFINITIONS[altTag] || altTag

                    // Generate B variant with the alternate aesthetic
                    const { angle: altAngle, embedding: altEmbedding } = await generateUniqueAngle(
                      { id: product.id, title: product.title, description: product.description },
                      [altTag], // Force this specific aesthetic
                      [...pastAngles, targetAngle], // Include the A variant to ensure B is different
                      showcase,
                      prodPins.length + 1,
                    )

                    // Credit gate for the B variant
                    const { hasCredits: hasCreditForB } = await adminHasCredits(brand.user_id, 1)
                    if (hasCreditForB) {
                      // Art Director for B variant
                      const artDirectorPromptB = `You are an expert product photography Art Director. Your job is to write a single, coherent scene description for fal.ai image editing. The source product image will be composited into the scene you describe.

═══ CREATIVE CONTEXT ═══

PRODUCT: ${showcase?.productAppearance || product.title}
SHOT: ${showcase?.presentationMode || 'hero'}, ${showcase?.heroAction || 'displayed'}
CAMERA: ${showcase?.cameraAngle || 'eye-level'}
SCENE CONCEPT: ${altAngle}
STYLE: ${altTag} — ${altDefinition}

═══ OUTPUT RULES ═══

Write a single flowing scene description, max 80 words. Rules:
- Start with the product: what it is, how it appears, what it's doing in the scene
- Describe ONLY what the camera will physically see: surfaces, materials, light, atmosphere
- The product must keep its exact original colors, materials, shape from the source image
- Apply the style's lighting and color palette to the ENVIRONMENT only
- No meta-instructions, no lists, no references to "the viewer"
- End with: "editorial product photography, soft natural light, 8k"

Return ONLY JSON: { "imagePrompt": "..." }`

                      const bPromptParts: any[] = [{ text: artDirectorPromptB }]
                      if (productImageBase64 && productImageMimeType) {
                        bPromptParts.push({ inlineData: { data: productImageBase64, mimeType: productImageMimeType } })
                      }

                      const bPlanResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: bPromptParts,
                        config: { temperature: 0.7, responseMimeType: "application/json" }
                      })
                      const bPlan = JSON.parse(bPlanResponse.text?.trim() || '{}')
                      const bImagePrompt = bPlan.imagePrompt || `Aesthetic lifestyle shot of ${product.title}, photorealistic 8k`

                      // Generate B image via fal.ai
                      const bResult: any = await fal.subscribe("fal-ai/flux-2/edit", {
                        input: {
                          prompt: bImagePrompt,
                          num_inference_steps: 50,
                          guidance_scale: 3.5,
                          image_size: { width: 1000, height: 1500 },
                          num_images: 1,
                          enable_safety_checker: true,
                          acceleration: "regular",
                          output_format: "png",
                          image_urls: [sourceImageUrl],
                        },
                        logs: true,
                        onQueueUpdate: (update) => {
                          if (update.status === "IN_PROGRESS") {
                            update.logs.map((log) => log.message).forEach(console.log)
                          }
                        },
                      })

                      const bFalImageUrl = bResult.data?.images?.[0]?.url
                      if (bFalImageUrl) {
                        // Save B pin to DB
                        const { data: pinB } = await supabase.from('pins').insert({
                          user_id: brand.user_id,
                          product_id: product.id,
                          brand_settings_id: brand.id,
                          art_director_prompt: bImagePrompt,
                          target_angle: altAngle,
                          angle_embedding: altEmbedding ? `[${Array.from(altEmbedding).join(",")}]` : null,
                          template_id: 'template-5',
                          pin_title: product.title,
                          aesthetic_tag: altTag,
                          status: 'generating',
                          is_mood_board: false,
                        }).select('id').single()

                        if (pinB?.id) {
                          // Upload B image to R2
                          const bImgRes = await fetch(bFalImageUrl)
                          const bImgBuffer = Buffer.from(await bImgRes.arrayBuffer())
                          const bRawR2Key = `pin-images/${brand.user_id}/${pinB.id}-raw.png`
                          await putR2Object(bRawR2Key, bImgBuffer, "image/png")
                          const bRawImageUrl = r2Domain ? `${r2Domain}/${bRawR2Key}` : bRawR2Key

                          // Handle render (same logic as main pin)
                          const shouldRenderB = brand.show_brand_url !== false && !!brand.store_url
                          let bFinalUrl = bRawImageUrl
                          let bFinalKey = bRawR2Key

                          if (shouldRenderB) {
                            let appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000').replace(/\/$/, '')
                            if (!appUrl.startsWith('http')) appUrl = `https://${appUrl}`

                            const renderRes = await fetch(`${appUrl}/api/render-pin`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ imageUrl: bRawImageUrl, storeUrl: brand.store_url || "" }),
                            })
                            if (renderRes.ok) {
                              const renderedBuffer = Buffer.from(await renderRes.arrayBuffer())
                              if (renderedBuffer.length >= 10000) {
                                const renderedKey = `pin-images/${brand.user_id}/${pinB.id}-final.png`
                                await putR2Object(renderedKey, renderedBuffer, "image/png")
                                bFinalUrl = r2Domain ? `${r2Domain}/${renderedKey}` : renderedKey
                                bFinalKey = renderedKey
                              }
                            }
                          }

                          await supabase.from("pins").update({
                            generated_image_url: bRawImageUrl,
                            generated_image_r2_key: bRawR2Key,
                            rendered_image_url: bFinalUrl,
                            rendered_image_r2_key: bFinalKey,
                            status: "pending_approval",
                          }).eq("id", pinB.id)

                          // Generate SEO copy for B variant
                          const bCopyRes = await ai.models.generateContent({
                            model: "gemini-2.5-flash",
                            contents: [{ text: `Write a Pinterest SEO title (max 100 chars) and description (150-300 chars) for: "${product.title}". Creative angle: "${altAngle}". Return JSON: { "seo_title": "...", "seo_description": "..." }` }],
                            config: { temperature: 0.6, responseMimeType: "application/json" }
                          })
                          try {
                            const bSeo = JSON.parse(bCopyRes.text?.trim() || '{}')
                            if (bSeo.seo_title) {
                              await supabase.from("pins").update({
                                pin_title: bSeo.seo_title.slice(0, 100),
                                pin_description: (bSeo.seo_description || '').slice(0, 500),
                              }).eq("id", pinB.id)
                            }
                          } catch { /* SEO copy parse failure is non-fatal */ }

                          // Create the experiment record
                          await supabase.from("ab_experiments").insert({
                            user_id: brand.user_id,
                            product_id: product.id,
                            pin_a_id: pinId,
                            pin_b_id: pinB.id,
                            aesthetic_a: pickedAesthetic.tag,
                            aesthetic_b: altTag,
                            status: "running",
                          })

                          // Deduct credit for B variant
                          await adminDeductCredits(brand.user_id, 1, `A/B test pin: ${pinB.id}`)

                          totalGenerated++
                          logger.info(`🧪 A/B experiment created: Pin A (${pickedAesthetic.tag}) vs Pin B (${altTag}) for "${product.title}"`)
                        }
                      }
                    } else {
                      logger.info(`Skipping A/B variant — insufficient credits`)
                    }
                  }
                }
              }
            } catch (abError: any) {
              // A/B experiment failure should never block normal pin generation
              logger.warn(`A/B experiment triggering failed (non-fatal): ${abError.message}`)
            }

          } catch (productError: any) {
            logger.error(`Error generating pin for ${product.title}: ${productError.message}`)
          }
        }


      } catch (brandError: any) {
        logger.error(`Error processing brand ${brand.brand_name}: ${brandError.message}`)
      }
    }

    logger.info(`🎨 EcomPin batch complete: ${totalGenerated} pins generated`)
    return { result: "Batch complete", generated: totalGenerated }
  },
})
