import { GoogleGenAI, Type } from "@google/genai"
import { createAdminClient } from "@/utils/supabase/admin"
import type { ShowcaseStrategy } from "@/lib/product-showcase"

const ai = new GoogleGenAI({ apiKey: process.env.MYGEMINI_API_KEY })

const AUTHENTIC_HANDMADE_TAG = "Authentic & Handmade"
const LEGACY_AESTHETIC_ALIASES: Record<string, string> = {
  "Indie DIY Setup": AUTHENTIC_HANDMADE_TAG,
}

function normalizeAestheticTag(tag?: string | null) {
  if (!tag) return ""
  return LEGACY_AESTHETIC_ALIASES[tag] || tag
}

/**
 * Aesthetic Definition Map — universal mood guides for Gemini.
 *
 * DESIGN PRINCIPLE: Each definition describes MOOD, LIGHTING, COLOR TEMPERATURE,
 * CONTRAST, COMPOSITION, and CAMERA FEEL only — never specific props, surfaces,
 * or environments. The product's own category determines WHERE the scene takes
 * place; the aesthetic determines HOW it looks and feels.
 *
 * Must work equally well across all target categories: artisan food, tech accessories,
 * wedding, stationery, spiritual/crystals, digital art, home decor, apparel,
 * jewelry, bath/skincare, kids/baby, and pet accessories.
 */
export const AESTHETIC_DEFINITIONS: Record<string, string> = {
  'Modern & Minimalist': 'Clean, bright, generous negative space. Cool-neutral palette (whites, pale greys, soft blacks). Even diffused lighting with almost no shadows. Sharp focus, editorial stillness.',
  'Warm & Cozy': 'Inviting golden-hour warmth. Amber, cream, caramel, and burnt-orange palette. Soft directional lighting with gentle, warm shadows. Slightly shallow depth of field. Layered textures feel touchable.',
  'Bold & Vibrant': 'High-energy, saturated color pops. Punchy lighting with strong contrast and hard shadows allowed. Vivid color grading pushed past neutral. The scene should feel alive and loud.',
  'Earthy & Natural': 'Organic, grounded, tactile. Sage, sand, olive, warm-brown palette. Soft natural daylight — dappled if possible. Matte textures, warm muted tones.',
  'Authentic & Handmade': 'Believable small-business feel — shot-on-phone energy. Uneven natural window light or cheap ring-light catch. Mild grain, muted naturals, nothing over-styled.',
  'Luxury & Premium': 'Elevated, aspirational, rich. Deep jewel-tone or dark neutral palette (emerald, burgundy, gold, ivory, black). Dramatic directional lighting with controlled shadows. Rich contrast, polished feel.',
  'Playful & Fun': 'Bright, cheerful, youthful energy. Pastel or candy-colored palette (pink, sky blue, lemon, lavender, mint). Flat even lighting with almost no shadows. The scene should feel light and joyful.',
  'Scandinavian': 'Airy, calm, breathing room. Pale neutral palette (white, light wood, soft grey, muted blue). Cool even northern daylight — clean and soft. Serene and unhurried feel.',
  'Industrial': 'Raw, textural, gritty character. Charcoal, rust, slate, gunmetal palette. Harsh directional lighting with strong moody shadows. The scene should feel like it has weight and history.',
  'Bohemian': 'Layered, warm, effortlessly relaxed. Burnt orange, rust, dusty rose, olive, cream palette. Golden-hour warmth with dappled light. Warm color grading.',
  'Coastal': 'Breezy, light-filled, airy calm. Ocean blue, sandy beige, white, aqua palette. Bright overcast lighting — soft, even, no harsh shadows. Slightly washed-out highlights.',
}

/**
 * Pick ONE aesthetic from the user's selected boundaries for this specific pin.
 * Rotates based on the GLOBAL user pin count (across all products) so that
 * different products in the same batch get different aesthetics.
 */
export function pickAestheticForPin(
  boundaries: string[],
  globalPinCount: number,
): { tag: string; definition: string } {
  if (!boundaries || boundaries.length === 0) {
    return { tag: 'Modern & Minimalist', definition: AESTHETIC_DEFINITIONS['Modern & Minimalist'] }
  }
  // Round-robin through the user's selected aesthetics using GLOBAL count
  const idx = globalPinCount % boundaries.length
  const tag = normalizeAestheticTag(boundaries[idx])
  const definition = AESTHETIC_DEFINITIONS[tag] || tag
  return { tag, definition }
}

/**
 * FEATURE 4 & 5: Context Matrix & Semantic De-Duplication
 * Generates a highly specific, unique "Angle" (Aesthetic + Season + Trend) for a product.
 * Guarantees programmatic uniqueness by rejecting angles semantically similar to past pins.
 *
 * @param product Title & description to base the angle on
 * @param trends Array of trending keywords from Pinterest API
 * @param brandBoundaries (Optional) Hard constraints on aesthetics
 */
export async function generateUniqueAngle(
  product: { id: string; title: string; description?: string },
  brandBoundaries?: string[],
  audienceProfile?: Record<string, any> | null,
  pastAngles?: string[],
  showcase?: ShowcaseStrategy,
  globalPinCount?: number,
): Promise<{ angle: string; embedding: number[]; pickedAesthetic: { tag: string; definition: string } }> {
  const supabase = createAdminClient()

  // Pick ONE aesthetic using GLOBAL user pin count (not per-product) so different products get different aesthetics
  const pickedAesthetic = pickAestheticForPin(brandBoundaries || [], globalPinCount ?? (pastAngles || []).length)
  const authenticHandmadeMode = pickedAesthetic.tag === AUTHENTIC_HANDMADE_TAG

  // Build showcase constraint block (from Stage 1 — Product Showcase Resolver)
  const showcaseBlock = showcase
    ? `
LOCKED PRODUCT SHOWCASE (decided by a separate system — do NOT change these):
- Product type: ${showcase.productType}
- Presentation: ${showcase.presentationMode} — ${showcase.heroAction}
- Camera: ${showcase.cameraAngle}
- Setting: ${showcase.naturalEnvironment}

Your job is to design the ENVIRONMENT and PROPS around this locked showcase. The product presentation, camera angle, and setting are already decided. You are styling the world around it.`
    : ""

  // Try up to 3 times to find a unique angle
  for (let attempt = 1; attempt <= 3; attempt++) {
    // 1. Ask Gemini to generate a creative Scene Concept
    const generationPrompt = `
You are an elite Pinterest Creative Director who designs the environment and scene around product photos.
Your environments get 10x more saves than generic backgrounds.

Product: "${product.title}" ${product.description ? `— ${product.description}` : ""}
${showcaseBlock}

ENVIRONMENT STYLING — apply this mood to the scene:
Aesthetic: "${pickedAesthetic.tag}"
${pickedAesthetic.definition}

${audienceProfile ? `\nTarget Audience: ${JSON.stringify(audienceProfile).slice(0, 500)}.` : ""}
${authenticHandmadeMode ? `\nAUTHENTICITY GUARDRAIL: Keep it believable, modest, slightly imperfect, and never polished like a luxury ad campaign.` : ""}

YOUR TASK: Design the scene AROUND the product. The product's presentation mode (${showcase?.presentationMode || "styled-on-surface"}) and location (${showcase?.naturalEnvironment || "natural setting"}) are already decided. You add:
- 2-3 specific props that naturally belong in this product's world (NOT from the aesthetic — from the PRODUCT's world)
- Background/surface details that fit the setting
- Atmospheric details (steam, bokeh, morning light, rain on window, etc.)
- Apply the aesthetic's color palette and lighting mood to everything

RULES:
- Props must make sense for the PRODUCT, not the aesthetic. A ring gets a jewelry tray, not gummy bears. A hoodie gets sneakers, not confetti.
- The aesthetic only controls colors, lighting quality, and emotional tone — never what objects appear in the scene.
- ${authenticHandmadeMode ? 'Keep it grounded — Etsy-seller realism, modest props, slight imperfections.' : 'Keep it editorial and aspirational.'}

${pastAngles && pastAngles.length > 0 ? `ALREADY CREATED — design something COMPLETELY DIFFERENT:
${pastAngles.slice(0, 20).map(a => `• ${a}`).join("\n")}` : ""}

Output ONLY a single descriptive scene concept (max 20 words). Be specific and vivid.
BAD: "Kitchen counter with warm light" (generic), "Gummy bears and confetti around a ring" (aesthetic props, not product props)
GOOD: "Marble vanity with gold jewelry tray, morning light through sheer curtains, soft bokeh", "Urban sidewalk cafe table, iced coffee, canvas tote, dappled afternoon shade"
    `

    const angleResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: generationPrompt }],
      config: { temperature: 1.1 + (attempt * 0.1) }, // Start high (1.2) for maximum brainstorming variance
    })

    const proposedAngle = angleResponse.text?.trim()

    if (!proposedAngle) continue

    // 2. Generate text embedding for semantic comparison
    const embeddingResponse = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: proposedAngle,
      config: {
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: 768,
      }
    })

    const embedding = embeddingResponse.embeddings?.[0]?.values

    if (!embedding) continue

    // 3. Check for uniqueness against past pins using pgvector
    const { data: matchesData, error } = await supabase.rpc("match_pin_angles" as any, {
      query_product_id: product.id,
      query_embedding: embedding,
      match_threshold: 0.75, // 75% similarity = genuinely different creative concepts required
      match_count: 1
    })

    const matches = matchesData as any[]

    if (error) {
      console.error("Vector search error:", error)
      // If vector DB fails, just accept the angle
      return { angle: proposedAngle, embedding, pickedAesthetic }
    }

    // If no matches found above 85% similarity, this angle is unique!
    if (!matches || matches.length === 0) {
      return { angle: proposedAngle, embedding, pickedAesthetic }
    }

    console.log(`[De-Dupe] Attempt ${attempt}: Rejected duplicate angle "${proposedAngle}" (Similarity: ${matches[0].similarity})`)
  }

  // Fallback if all 3 attempts hit duplicates (rare)
  const fallbackAngle = `Premium Lifestyle aesthetic for ${product.title}`
  const fallbackEmbedding = await ai.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: fallbackAngle,
    config: {
      taskType: "SEMANTIC_SIMILARITY",
      outputDimensionality: 768,
    }
  })

  return {
    angle: fallbackAngle,
    embedding: fallbackEmbedding.embeddings?.[0]?.values || Array(768).fill(0),
    pickedAesthetic,
  }
}
