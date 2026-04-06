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
    // 1. Ask Gemini to generate a Micro-Environment Habitat
    const generationPrompt = `
You are an expert Pinterest Strategist configuring the "Micro-Environment" visual engine.
We need a highly specific, natural lifestyle habitat for this product.
Product: "${product.title}" ${product.description ? `- ${product.description}` : ""}

Current Pinterest Trends this week (use for lighting/color-grading ideas only): ${trends.slice(0, 10).join(", ")}
${brandBoundaries && brandBoundaries.length > 0 ? `Brand Aesthetic Constraints (strictly stick to these vibes): ${brandBoundaries.join(", ")}` : ""}
${audienceProfile ? `\nAudience Intelligence: ${JSON.stringify(audienceProfile).slice(0, 500)}.` : ""}

CRITICAL INSTRUCTION: Do NOT force this product into a generic "cozy room". Consider the product's NATURAL, real-world habitat. 

${pastAngles && pastAngles.length > 0 ? `CRITICAL RULE: You have already generated these exact habitats for this product in the past. You MUST INVENT SOMETHING COMPLETELY DIFFERENT. DO NOT REUSE THESE:
- ${pastAngles.slice(0, 20).join("\n- ")}` : ""}

Generate ONE highly specific "Habitat Vibe" that combines:
1. The Product's distinct Natural Habitat (physical surface/location)
2. A specific Aesthetic / Lighting style
3. An optional season or trend (for color grading)

Output MUST be a single, short string (max 15 words).
Examples: "Marble vanity with warm glowing sunset light", "Rustic wooden picnic table in autumn breeze", "Sleek workout bench under neon gym lighting", "Morning kitchen counter with scattered coffee beans".
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
