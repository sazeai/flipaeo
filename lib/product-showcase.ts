import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.MYGEMINI_API_KEY })

/**
 * Finite taxonomy of product presentation modes.
 * The Showcase Resolver MUST pick from this list — no hallucinated modes.
 */
export const PRESENTATION_MODES = [
  "worn-on-model",
  "held-in-hand",
  "styled-on-surface",
  "in-use-action",
  "flat-lay-arrangement",
] as const

export type PresentationMode = (typeof PRESENTATION_MODES)[number]

export interface ShowcaseStrategy {
  productType: string
  presentationMode: PresentationMode
  cameraAngle: string
  heroAction: string
  naturalEnvironment: string
}

const SHOWCASE_PROMPT = `You are a product photography strategist. Your ONLY job is to decide HOW a product should be presented in a photo — the most compelling, buyer-converting way to showcase it.

You know NOTHING about aesthetics, mood, color palettes, or lighting. Those are someone else's job. You ONLY decide:
1. What type of product this is
2. How it should be physically presented
3. Where it naturally belongs
4. What the camera should focus on

PRODUCT TITLE: "{title}"
{descriptionLine}

PRESENTATION MODE — pick exactly ONE:
- "worn-on-model": clothing, jewelry, accessories, wearables → show on a person
- "held-in-hand": small items, beverages, skincare, tools → show being held naturally
- "styled-on-surface": home decor, candles, stationery, boxes, jars → arrange on an appropriate surface
- "in-use-action": food being eaten, serum being applied, chair being sat in, tool being used → show mid-use
- "flat-lay-arrangement": collections, kits, gift sets, multi-piece items → overhead curated layout

RULES:
- Pick the mode that a professional product photographer would choose for THIS specific product
- A hoodie → worn-on-model (on a person, styled casually)
- A ring → worn-on-model (on a hand, close-up)
- A face serum → held-in-hand OR in-use-action (being applied)
- A kids chair → in-use-action (child sitting) OR styled-on-surface (in a room)
- A candle → styled-on-surface (on a shelf or table)
- A peanut butter jar → in-use-action (spread on toast) OR styled-on-surface (kitchen counter)
- Jewelry box → styled-on-surface (on vanity) OR in-use-action (being opened)

For cameraAngle pick ONE: "eye-level front", "eye-level three-quarter", "close-up detail", "overhead flat-lay", "low-angle hero", "over-the-shoulder"

For heroAction describe the SPECIFIC physical action/pose (max 12 words). Be concrete:
- Good: "woman wearing hoodie unzipped over a white tee"
- Good: "ring on a woman's ring finger, hand resting on collarbone"
- Good: "child sitting cross-legged on the chair reading a book"
- Bad: "product displayed beautifully" (too vague)
- Bad: "aesthetic arrangement" (meaningless)

For naturalEnvironment name 1-2 SPECIFIC real-world locations where a buyer would use this product (max 10 words):
- Good: "bathroom vanity with mirror"
- Good: "urban sidewalk cafe"
- Bad: "beautiful setting" (not a place)

Return ONLY valid JSON:
{
  "productType": "...",
  "presentationMode": "worn-on-model|held-in-hand|styled-on-surface|in-use-action|flat-lay-arrangement",
  "cameraAngle": "...",
  "heroAction": "...",
  "naturalEnvironment": "..."
}`

/**
 * Stage 1: Product Showcase Resolver
 *
 * Decides HOW a product should be physically presented in photography,
 * BEFORE any aesthetic/mood is applied. Uses multimodal Gemini to see
 * the actual product image.
 */
export async function resolveProductShowcase(
  product: { title: string; description?: string },
  productImageBase64?: string | null,
  productImageMimeType?: string | null,
): Promise<ShowcaseStrategy> {
  const descriptionLine = product.description
    ? `PRODUCT DESCRIPTION: "${product.description}"`
    : ""

  const prompt = SHOWCASE_PROMPT
    .replace("{title}", product.title)
    .replace("{descriptionLine}", descriptionLine)

  const parts: any[] = [{ text: prompt }]

  if (productImageBase64 && productImageMimeType) {
    parts.push({
      inlineData: {
        data: productImageBase64,
        mimeType: productImageMimeType,
      },
    })
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: parts,
      config: { temperature: 0.3, responseMimeType: "application/json" },
    })

    const parsed = JSON.parse(response.text?.trim() || "{}")

    // Validate presentationMode is in our finite taxonomy
    const mode = PRESENTATION_MODES.includes(parsed.presentationMode)
      ? parsed.presentationMode
      : "styled-on-surface"

    return {
      productType: parsed.productType || product.title,
      presentationMode: mode,
      cameraAngle: parsed.cameraAngle || "eye-level three-quarter",
      heroAction: parsed.heroAction || `${product.title} displayed naturally`,
      naturalEnvironment: parsed.naturalEnvironment || "clean neutral surface",
    }
  } catch (err) {
    // Graceful fallback — never block generation
    console.error("Product Showcase Resolver failed, using fallback:", err)
    return {
      productType: product.title,
      presentationMode: "styled-on-surface",
      cameraAngle: "eye-level three-quarter",
      heroAction: `${product.title} displayed naturally`,
      naturalEnvironment: "clean neutral surface",
    }
  }
}
