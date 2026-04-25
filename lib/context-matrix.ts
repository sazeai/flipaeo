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
  indexKey: number,
): { tag: string; definition: string } {
  if (!boundaries || boundaries.length === 0) {
    return { tag: 'Modern & Minimalist', definition: AESTHETIC_DEFINITIONS['Modern & Minimalist'] }
  }
  // Round-robin through the user's selected aesthetics using the provided index key
  const idx = indexKey % boundaries.length
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
  pinCountForProduct?: number,
): Promise<{ angle: string; embedding: number[]; pickedAesthetic: { tag: string; definition: string } }> {
  const supabase = createAdminClient()

  // Calculate a stable hash for the product ID to offset the aesthetic rotation.
  // This ensures different products get DIFFERENT aesthetics on the same day.
  const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const offsetCount = (pinCountForProduct || 0) + hash;

  // Pick ONE aesthetic using per-product count + hash
  const pickedAesthetic = pickAestheticForPin(brandBoundaries || [], offsetCount)
  const authenticHandmadeMode = pickedAesthetic.tag === AUTHENTIC_HANDMADE_TAG

  // Build showcase constraint block (from Stage 1 — Product Showcase Resolver)
  const showcaseBlock = showcase
    ? `
LOCKED SHOWCASE (use as creative context — describe only what fits within these constraints):
- Product: ${showcase.productType}
- Family: ${showcase.productFamily}
- Shot: ${showcase.presentationMode} — ${showcase.heroAction}
- Camera: ${showcase.cameraAngle}
- Setting: ${showcase.naturalEnvironment}
- Scene scope: ${showcase.sceneScope}
- Scale rule: ${showcase.scaleGuidance}`
    : ""

  // Try up to 3 times to find a unique angle
  for (let attempt = 1; attempt <= 3; attempt++) {
    // 1. Ask Gemini to generate a creative Scene Concept
    const generationPrompt = `
Product: "${product.title}"${product.description ? ` — ${product.description}` : ""}
${showcaseBlock}

Aesthetic mood: "${pickedAesthetic.tag}" — ${pickedAesthetic.definition}
${authenticHandmadeMode ? `Keep it modest and believable — small-business realism.` : ""}

Write a scene concept for this product photo. The showcase constraints are locked above. You ONLY add:
- Surface/background material and color
- Lighting direction and atmosphere (bokeh, steam, morning glow, etc.)
- Apply the aesthetic's color palette to the ENVIRONMENT only

${pastAngles && pastAngles.length > 0 ? `Already done — be DIFFERENT:\n${pastAngles.slice(0, 10).map(a => `• ${a}`).join("\n")}` : ""}

Output a single scene concept, max 20 words. Surface + lighting + atmosphere only.`

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
