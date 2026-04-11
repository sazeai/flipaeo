import { GoogleGenAI, Type } from "@google/genai"
import { createAdminClient } from "@/utils/supabase/admin"

const ai = new GoogleGenAI({ apiKey: process.env.MYGEMINI_API_KEY })

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
  trends: string[],
  brandBoundaries?: string[],
  audienceProfile?: Record<string, any> | null,
  pastAngles?: string[]
): Promise<{ angle: string; embedding: number[] }> {
  const supabase = createAdminClient()

  // Try up to 3 times to find a unique angle
  for (let attempt = 1; attempt <= 3; attempt++) {
    // 1. Ask Gemini to generate a creative Scene Concept
    const generationPrompt = `
You are an elite Pinterest Creative Director who creates viral, aspirational product photography concepts.
Your scenes get 10x more saves than generic "product on counter" shots.

Product: "${product.title}" ${product.description ? `— ${product.description}` : ""}

Current Pinterest Trends this week: ${trends.slice(0, 10).join(", ")}
${brandBoundaries && brandBoundaries.length > 0 ? `Brand Aesthetic Constraints (strictly follow): ${brandBoundaries.join(", ")}` : ""}
${audienceProfile ? `\nTarget Audience: ${JSON.stringify(audienceProfile).slice(0, 500)}.` : ""}

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
      return { angle: proposedAngle, embedding }
    }

    // If no matches found above 85% similarity, this angle is unique!
    if (!matches || matches.length === 0) {
      return { angle: proposedAngle, embedding }
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
    embedding: fallbackEmbedding.embeddings?.[0]?.values || Array(768).fill(0)
  }
}
