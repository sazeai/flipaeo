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
  productAppearance: string
  suggestedProps: string
}

/**
 * Full showcase analysis returned by Gemini — contains ALL viable modes
 * so we can rotate across pins for the same product.
 */
export interface ShowcaseAnalysis {
  productType: string
  productAppearance: string
  /** Ranked list of viable presentation modes with details for each */
  viableModes: {
    presentationMode: PresentationMode
    cameraAngle: string
    heroAction: string
    naturalEnvironment: string
    suggestedProps: string
  }[]
}

const SHOWCASE_PROMPT = `You are a product photographer planning shots. Decide HOW to present this product.

PRODUCT: "{title}"
{descriptionLine}

Return 2-4 different shot options ranked by buyer appeal. For EACH shot:

presentationMode (pick one):
- "worn-on-model": show on person/animal (clothing, jewelry, accessories)
- "held-in-hand": show being held (small items, skincare, beverages)
- "styled-on-surface": arrange on surface (decor, boxes, jars, accessories)
- "in-use-action": show being used (food eaten, serum applied, collar on dog)
- "flat-lay-arrangement": overhead spread (kits, multi-piece sets)

cameraAngle: "eye-level front" | "eye-level three-quarter" | "close-up detail" | "overhead flat-lay" | "low-angle hero" | "over-the-shoulder"

heroAction: specific pose/action in max 12 words (e.g. "dog wearing collar on morning walk, ears perked")

naturalEnvironment: 1-2 specific locations in max 10 words (e.g. "sunny park path with grass edge")

suggestedProps: exactly 2 props that a BUYER of this product would own or use alongside it. Props must come from the product's world — not generic lifestyle items.
- Dog collar → "water bowl, tennis ball" or "leash hook, paw-print bandana" — NOT "watch, journal, vase"
- Ring box → "ring, dried flowers" or "ribbon, tissue paper" — NOT "pen, notebook, coffee cup"
- Hoodie → "sneakers, backpack" or "beanie, phone" — NOT "candle, book, plant"

productAppearance: the product's actual colors, materials, and key design details in max 15 words. Critical for preservation.
- Good: "brown leather collar with turquoise padding, gold buckle, silver conchos"
- Bad: "collar" (no visual detail)

Return ONLY valid JSON:
{
  "productType": "...",
  "productAppearance": "...",
  "viableModes": [
    {
      "presentationMode": "...",
      "cameraAngle": "...",
      "heroAction": "...",
      "naturalEnvironment": "...",
      "suggestedProps": "..."
    }
  ]
}`

/**
 * Stage 1: Product Showcase Resolver
 *
 * Analyzes the product and returns ALL viable presentation modes ranked.
 * Uses multimodal Gemini to see the actual product image.
 * Call pickShowcaseForPin() after to select one mode by rotation.
 */
export async function resolveProductShowcase(
  product: { title: string; description?: string },
  productImageBase64?: string | null,
  productImageMimeType?: string | null,
): Promise<ShowcaseAnalysis> {
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

    // Validate and filter viable modes
    const viableModes = (parsed.viableModes || [])
      .filter((m: any) => PRESENTATION_MODES.includes(m.presentationMode))
      .map((m: any) => ({
        presentationMode: m.presentationMode as PresentationMode,
        cameraAngle: m.cameraAngle || "eye-level three-quarter",
        heroAction: m.heroAction || `${product.title} displayed naturally`,
        naturalEnvironment: m.naturalEnvironment || "clean neutral surface",
        suggestedProps: m.suggestedProps || "",
      }))

    // Ensure at least one mode
    if (viableModes.length === 0) {
      viableModes.push({
        presentationMode: "styled-on-surface" as PresentationMode,
        cameraAngle: "eye-level three-quarter",
        heroAction: `${product.title} displayed naturally`,
        naturalEnvironment: "clean neutral surface",
        suggestedProps: "",
      })
    }

    return {
      productType: parsed.productType || product.title,
      productAppearance: parsed.productAppearance || product.title,
      viableModes,
    }
  } catch (err) {
    // Graceful fallback — never block generation
    console.error("Product Showcase Resolver failed, using fallback:", err)
    return {
      productType: product.title,
      productAppearance: product.title,
      viableModes: [{
        presentationMode: "styled-on-surface",
        cameraAngle: "eye-level three-quarter",
        heroAction: `${product.title} displayed naturally`,
        naturalEnvironment: "clean neutral surface",
        suggestedProps: "",
      }],
    }
  }
}

/**
 * Pick ONE showcase mode by rotating through the product's viable modes.
 * Uses per-product pin count so each new pin gets a different presentation.
 *
 * Pin 0 → viableModes[0] (best mode)
 * Pin 1 → viableModes[1] (second-best)
 * Pin 2 → viableModes[2] (third option)
 * Pin 3 → viableModes[0] (wraps around with fresh scene from Stage 2)
 */
export function pickShowcaseForPin(
  analysis: ShowcaseAnalysis,
  productPinCount: number,
): ShowcaseStrategy {
  const idx = productPinCount % analysis.viableModes.length
  const picked = analysis.viableModes[idx]
  return {
    productType: analysis.productType,
    productAppearance: analysis.productAppearance,
    ...picked,
  }
}
