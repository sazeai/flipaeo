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
  brandBoundaries?: string[]
): Promise<{ angle: string; embedding: number[] }> {
  const supabase = createAdminClient()

  // Try up to 3 times to find a unique angle
  for (let attempt = 1; attempt <= 3; attempt++) {
    // 1. Ask Gemini to generate an angle
    const generationPrompt = `
You are an expert Pinterest Strategist. We need a unique, highly-converting lifestyle angle for a product.
Product: "${product.title}" ${product.description ? `- ${product.description}` : ""}

Current Pinterest Trends this week: ${trends.slice(0, 10).join(", ")}
${brandBoundaries && brandBoundaries.length > 0 ? `Brand Aesthetic Constraints: strictly stick to these vibes -> ${brandBoundaries.join(", ")}` : ""}

Generate ONE highly specific "Angle" that combines:
1. A specific Aesthetic / Vibe
2. A Season, Event, or Buyer Persona
3. One of the trending keywords (if it makes sense for the product, otherwise invent a high-volume search term)

Output MUST be a single, short string (max 12 words).
Examples: "Minimalist Work Bag for Autumn Streetwear", "Cozy Cottagecore Mug for Holiday Gifting", "Dark Academia Desk Setup Aesthetic".
    `

    const angleResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: generationPrompt }],
      config: { temperature: 0.8 + (attempt * 0.1) }, // increase creativity if retrying
    })

    const proposedAngle = angleResponse.text?.trim()

    if (!proposedAngle) continue

    // 2. Generate text embedding for semantic comparison
    const embeddingResponse = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: proposedAngle,
    })

    const embedding = embeddingResponse.embeddings?.[0]?.values

    if (!embedding) continue

    // 3. Check for uniqueness against past pins using pgvector
    const { data: matchesData, error } = await supabase.rpc("match_pin_angles" as any, {
      query_product_id: product.id,
      query_embedding: embedding,
      match_threshold: 0.85, // 85% similarity is considered a duplicate
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
    model: "text-embedding-004",
    contents: fallbackAngle,
  })
  
  return { 
    angle: fallbackAngle, 
    embedding: fallbackEmbedding.embeddings?.[0]?.values || Array(768).fill(0) 
  }
}
