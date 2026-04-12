import { GoogleGenAI, Type } from "@google/genai"
import { createAdminClient } from "@/utils/supabase/admin"

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
  'Modern & Minimalist': 'Clean, bright, generous negative space. Cool-neutral palette (whites, pale greys, soft blacks). Even diffused lighting with almost no shadows. Symmetrical, centered composition with geometric precision. Sharp focus, editorial stillness. The product should feel like the only thing in the frame.',
  'Warm & Cozy': 'Inviting golden-hour warmth. Amber, cream, caramel, and burnt-orange palette. Soft directional lighting with gentle, warm shadows. Slightly shallow depth of field — intimate and close. Layered textures feel touchable. The scene should make you want to reach in.',
  'Bold & Vibrant': 'High-energy, saturated color pops against the product. Punchy lighting with strong contrast and hard shadows allowed. Dynamic angles — tilted, tight crops, unexpected framing. Vivid color grading pushed past neutral. The scene should feel alive and loud.',
  'Earthy & Natural': 'Organic, grounded, tactile. Sage, sand, olive, warm-brown palette. Soft natural daylight — dappled if possible. Slightly imperfect framing, nothing too precise. Matte textures, warm muted tones. The scene should feel like it grew there naturally.',
  'Authentic & Handmade': 'Believable small-business feel — shot-on-phone energy. Uneven natural window light or cheap ring-light catch. Slightly off-center amateur crop with mild grain. Muted naturals, nothing over-styled. The scene should look like a real seller photographed it on their kitchen table, not a studio.',
  'Luxury & Premium': 'Elevated, aspirational, rich. Deep jewel-tone or dark neutral palette (emerald, burgundy, gold, ivory, black). Dramatic directional lighting with controlled shadows. Precise editorial composition — nothing accidental. Rich contrast, polished feel. The scene should whisper exclusivity without naming specific luxury objects.',
  'Playful & Fun': 'Bright, cheerful, youthful energy. Pastel or candy-colored palette (pink, sky blue, lemon, lavender, mint). Flat even lighting with almost no shadows. Overhead flat-lays or slightly tilted angles. The scene should feel light, joyful, and smile-inducing.',
  'Scandinavian': 'Airy, calm, breathing room. Pale neutral palette (white, light wood, soft grey, muted blue). Cool even northern daylight — clean and soft. Structured composition with deliberate empty space. The scene should feel serene and unhurried.',
  'Industrial': 'Raw, textural, gritty character. Charcoal, rust, slate, gunmetal palette. Harsh directional lighting with strong moody shadows. Close-up angles that emphasize texture and material. The scene should feel like it has weight and history.',
  'Bohemian': 'Layered, warm, effortlessly relaxed. Burnt orange, rust, dusty rose, olive, cream palette. Golden-hour warmth with dappled light. Relaxed composition — slightly busy but intentional. Warm color grading. The scene should feel collected and personal.',
  'Coastal': 'Breezy, light-filled, airy calm. Ocean blue, sandy beige, white, aqua palette. Bright overcast lighting — soft, even, no harsh shadows. Slightly washed-out highlights. The scene should feel like a deep breath of sea air.',
}

/**
 * Pick ONE aesthetic from the user's selected boundaries for this specific pin.
 * Rotates based on the number of past pins to ensure visual variety across the feed.
 */
export function pickAestheticForPin(
  boundaries: string[],
  pastPinCount: number,
): { tag: string; definition: string } {
  if (!boundaries || boundaries.length === 0) {
    return { tag: 'Modern & Minimalist', definition: AESTHETIC_DEFINITIONS['Modern & Minimalist'] }
  }
  // Round-robin through the user's selected aesthetics
  const idx = pastPinCount % boundaries.length
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
  pastAngles?: string[]
): Promise<{ angle: string; embedding: number[]; pickedAesthetic: { tag: string; definition: string } }> {
  const supabase = createAdminClient()

  // Pick ONE aesthetic from the user's selected set (round-robin by past pin count)
  const pickedAesthetic = pickAestheticForPin(brandBoundaries || [], (pastAngles || []).length)
  const authenticHandmadeMode = pickedAesthetic.tag === AUTHENTIC_HANDMADE_TAG

  // Try up to 3 times to find a unique angle
  for (let attempt = 1; attempt <= 3; attempt++) {
    // 1. Ask Gemini to generate a creative Scene Concept
    const generationPrompt = `
You are an elite Pinterest Creative Director who creates viral, aspirational product photography concepts.
Your scenes get 10x more saves than generic "product on counter" shots.

Product: "${product.title}" ${product.description ? `— ${product.description}` : ""}

VISUAL AESTHETIC FOR THIS PIN: "${pickedAesthetic.tag}"
${pickedAesthetic.definition}

${audienceProfile ? `\nTarget Audience: ${JSON.stringify(audienceProfile).slice(0, 500)}.` : ""}
${authenticHandmadeMode ? `\nAUTHENTICITY GUARDRAIL: Keep it believable, modest, slightly imperfect, and never polished like a luxury ad campaign.` : ""}

CRITICAL RULE — PRODUCT CONTEXT COMES FIRST:
The PRODUCT determines WHERE the scene takes place. The AESTHETIC determines HOW it looks and feels.
First, identify the product's real-world environment — where would a buyer actually use or display this?
  - A kid's chair → nursery, playroom, child's bedroom
  - A face serum → bathroom vanity, skincare shelf, morning routine
  - A tarot deck → reading nook, cozy table, spiritual corner
  - A dog collar → park scene, entryway, pet's bed area
  - A mechanical keycap → desk setup, home office
Then apply the aesthetic's mood, lighting, and color palette TO that natural environment.
NEVER let the aesthetic override the product's context. "Luxury & Premium" on a kid's chair means a rich, editorial nursery — NOT a dark library with brass globes.

STEP 1 — Understand the product category and its NATURAL environment. Where does this product live in real life? Your scene MUST be set in a place that makes sense for this specific product.

STEP 2 — Choose ONE creative direction from these diverse approaches (rotate, don't repeat):
• LIFESTYLE MOMENT: The product being used in an aspirational real-life scene within its natural environment
• INGREDIENT STORY: Surround the product with its raw ingredients or complementary items spilling naturally around it
• SEASONAL TABLESCAPE: Place the product in a seasonally-styled version of its natural setting
• FLAT-LAY COMPOSITION: Artful overhead arrangement with category-appropriate complementary props
• ASPIRATIONAL CONTEXT: The product in an aspirational version of where it naturally belongs, telling a story about its buyer
• CULTURAL MOMENT: Tie to a celebration, festival, gifting occasion, or ritual that fits the product
• TEXTURE CONTRAST: Place product against contrasting textures that still belong in its natural environment
• PROCESS SHOT: The product mid-use — being poured, spread, applied, unwrapped, or styled
${authenticHandmadeMode ? `• DIY SELLER SNAPSHOT: A believable small-business setup shot on a phone with natural window light and modest props` : ""}

STEP 3 — Write the scene as a vivid, specific concept. Include a concrete physical setting appropriate for the product, 2-3 specific props that naturally belong there, and the mood/lighting from the aesthetic.

${pastAngles && pastAngles.length > 0 ? `IMPORTANT — These scenes were ALREADY created for this product. You MUST create something COMPLETELY DIFFERENT in both concept and mood. DO NOT produce anything similar:
${pastAngles.slice(0, 20).map(a => `• ${a}`).join("\n")}` : ""}

Output ONLY a single descriptive scene concept (max 20 words). Be specific and vivid, not generic.
BAD examples (too generic): "Kitchen counter with warm light", "Cozy room with soft lighting", "Shelf with natural light"
BAD examples (aesthetic overriding product): "Kid's chair in dark library with brass globe" (wrong environment for a children's product)
GOOD examples: "Overflowing breakfast spread with fresh toast, fruit, and morning newspaper on sunlit farmhouse table", "Montessori playroom corner with soft rug, stacking rings, and morning sun through sheer curtains", "Gym bag flat-lay with protein shake, earbuds, and chalk-dusted hands on rubber mat"
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
