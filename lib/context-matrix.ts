import { GoogleGenAI, Type } from "@google/genai"
import { createAdminClient } from "@/utils/supabase/admin"

const ai = new GoogleGenAI({ apiKey: process.env.MYGEMINI_API_KEY })

const AUTHENTIC_HANDMADE_TAGS = ["Authentic & Handmade", "Indie DIY Setup"]

function hasAuthenticHandmadeAesthetic(brandBoundaries?: string[] | null) {
  return (brandBoundaries || []).some((boundary) => AUTHENTIC_HANDMADE_TAGS.includes(boundary))
}

/**
 * Aesthetic Definition Map — gives Gemini precise visual meaning for each tag.
 * Each entry describes: lighting, surfaces/textures, props, color palette, and camera feel.
 * When the system picks an aesthetic for a pin, it injects this full definition — not just the tag name.
 */
export const AESTHETIC_DEFINITIONS: Record<string, string> = {
  'Modern & Minimalist': 'Clean white or light grey surfaces, negative space, geometric lines. Lighting: bright, even, diffused softbox feel. Props: single accent object (a plant sprig, a glass of water). Color palette: white, pale grey, black accents. Camera: perfectly centered, symmetrical, sharp focus.',
  'Warm & Cozy': 'Warm wood tones, knit textures, candlelight glow. Lighting: golden hour warmth, soft shadows, amber tint. Props: knit blanket, ceramic mug, cinnamon sticks, dried flowers, worn leather book. Color palette: amber, cream, burnt orange, caramel. Camera: slightly shallow depth of field, inviting closeness.',
  'Bold & Vibrant': 'Saturated pops of color, high contrast, energetic composition. Lighting: bright and punchy, hard shadows allowed. Props: colorful fruits, paint splashes, confetti, bold textiles. Color palette: fuchsia, electric blue, tangerine, lime. Camera: dynamic angles, tight crops, vivid saturation.',
  'Earthy & Natural': 'Raw linen, terracotta, unfinished wood, green foliage. Lighting: soft natural daylight, dappled leaf shadows. Props: dried herbs, clay pots, woven baskets, raw cotton, stone surfaces. Color palette: sage, sand, warm brown, olive, cream. Camera: organic framing, slightly imperfect, natural tones.',
  'Authentic & Handmade': 'Believable small-business DIY setup. Lighting: uneven natural window light, cheap ring-light catch, soft daylight falloff. Props: kraft paper, tape measure, scissors, stacked vintage books, half-burned candle, faux plant, tissue paper, fabric scraps. Surfaces: wrinkled linen on a table, wooden nightstand edge, cluttered craft desk, kitchen counter. Color palette: muted naturals, nothing too styled. Camera: amateur smartphone photography, slight grain, slightly off-center, natural crop.',
  'Luxury & Premium': 'Dark moody backgrounds, marble, brass, velvet. Lighting: dramatic low-key, single directional light with deep shadows. Props: orchids, gold cutlery, crystal glassware, silk fabric, leather. Color palette: black, deep emerald, gold, burgundy, ivory. Camera: precise, editorial, rich contrast.',
  'Playful & Fun': 'Soft pastels, rounded shapes, confetti energy. Lighting: bright, flat, cheerful with minimal shadows. Props: balloons, sprinkles, candy, colorful stationery, toys, ribbons. Color palette: baby pink, sky blue, lemon, lavender, mint. Camera: overhead flat-lays or slightly playful tilts.',
  'Scandinavian': 'Light birch wood, white ceramics, grey wool, airy space. Lighting: cool, even northern daylight, clean and soft. Props: simple ceramic vase, single branch, wool throw, linen napkin. Color palette: white, pale grey, light wood, muted blue. Camera: clean, structured, lots of breathing room.',
  'Industrial': 'Raw concrete, exposed brick, dark metals, grit. Lighting: harsh directional, tungsten warmth or cool fluorescent. Props: metal shelving, riveted surfaces, vintage tools, raw pipe, dark glass. Color palette: charcoal, rust, slate, gunmetal, dark brown. Camera: textural close-ups, moody shadows, raw angles.',
  'Bohemian': 'Layered textiles, macramé, rattan, terracotta warmth. Lighting: warm golden hour, dappled sunlight through a curtain. Props: woven wall hanging, pampas grass, incense, floor cushions, beaded jewelry, terracotta pots. Color palette: burnt orange, rust, cream, olive, dusty rose. Camera: relaxed, slightly messy composition, warm color grading.',
  'Coastal': 'Ocean blues, sandy neutrals, driftwood, sea glass. Lighting: bright overcast beach light, soft and airy. Props: shells, rope, linen, bleached wood, striped fabric, sea salt jar. Color palette: navy, sky blue, sandy beige, white, aqua. Camera: breezy, light-filled, slightly washed-out highlights.',
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
  const tag = boundaries[idx]
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
  const authenticHandmadeMode = hasAuthenticHandmadeAesthetic(brandBoundaries)

  // Pick ONE aesthetic from the user's selected set (round-robin by past pin count)
  const pickedAesthetic = pickAestheticForPin(brandBoundaries || [], (pastAngles || []).length)

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
${authenticHandmadeMode ? `

AUTHENTIC & HANDMADE MODE:
- The scene should feel like a real small-business seller shot it at home, in a tiny studio corner, or in a believable workspace.
- Favor DIY setups: window-lit desk, wrinkled linen over a table, shelf corner, kitchen table, chair-back drape, bedspread flat-lay, peg rail, simple lightbox.
- Allow human imperfections: slightly off-center framing, natural clutter, uneven fabric, casual crop, believable negative space.
- Use props a normal seller could actually own: tape measure, scissors, kraft paper, folded tissue, stacked books, a ceramic mug, fake plant, candle stub, fabric swatches.
- BAD: luxury hotel vibes, marble ad sets, impossible symmetry, hyper-polished studio campaigns, dramatic cinema lighting.
` : ""}

STEP 1 — Understand the product category. Is this a FOOD item, BEAUTY product, HOME DECOR, FASHION, FITNESS, KIDS, TECH, or something else? Your scene MUST feel natural for this specific category.

STEP 2 — Choose ONE creative direction from these diverse approaches (rotate, don't repeat):
• LIFESTYLE MOMENT: Show the product being used in an aspirational real-life scene (e.g. someone's breakfast spread, a morning skincare ritual, a cozy reading nook setup)
• INGREDIENT STORY: Surround the product with its raw ingredients or complementary items spilling naturally around it (e.g. peanuts, cocoa beans, fresh herbs, fabric swatches)
• SEASONAL TABLESCAPE: Place the product in a seasonally-styled scene — spring florals, summer citrus, autumn leaves, winter textures
• FLAT-LAY COMPOSITION: Artful overhead arrangement with complementary props, textures, and negative space
• ASPIRATIONAL CONTEXT: The product in an aspirational setting that tells a story about who uses it (fitness prep station, artisan workshop, nursery shelf, travel essentials layout)
• CULTURAL MOMENT: tie to a celebration, festival, gifting occasion, or ritual (Diwali gift hamper, Christmas morning, birthday brunch, self-care Sunday)
• TEXTURE CONTRAST: Place product against unexpected but beautiful contrasting textures (smooth product on rough linen, glossy packaging on raw wood, colorful label against matte concrete)
• PROCESS SHOT: The product mid-use — being poured, spread, applied, unwrapped, or styled — capturing motion and anticipation
${authenticHandmadeMode ? `• DIY SELLER SNAPSHOT: A believable small-business setup shot on a phone with natural window light, modest props, and lived-in surfaces` : ""}

STEP 3 — Write the scene as a vivid, specific concept. Include a concrete physical setting, 2-3 specific props or contextual details, and an overall mood/emotion.

${pastAngles && pastAngles.length > 0 ? `IMPORTANT — These scenes were ALREADY created for this product. You MUST create something COMPLETELY DIFFERENT in both concept and mood. DO NOT produce anything similar:
${pastAngles.slice(0, 20).map(a => `• ${a}`).join("\n")}` : ""}

Output ONLY a single descriptive scene concept (max 20 words). Be specific and vivid, not generic.
BAD examples (too generic): "Kitchen counter with warm light", "Cozy room with soft lighting", "Shelf with natural light"
GOOD examples: "Overflowing breakfast spread with fresh toast, fruit, and morning newspaper on sunlit farmhouse table", "Autumn picnic blanket with scattered maple leaves, thermos, and knit scarf in golden hour", "Gym bag flat-lay with protein shake, earbuds, and chalk-dusted hands on rubber mat", "Diwali gift hamper with diyas, marigolds, and silk wrapping on brass tray"
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
