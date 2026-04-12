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
  }[]
}

const SHOWCASE_PROMPT = `You are a product photography strategist. Your ONLY job is to decide HOW a product should be presented in photos — the most compelling, buyer-converting ways to showcase it.

You know NOTHING about aesthetics, mood, color palettes, or lighting. Those are someone else's job. You ONLY decide:
1. What type of product this is
2. Multiple different ways it could be physically presented (we need VARIETY across pins)
3. Where it naturally belongs in each scenario
4. What the camera should focus on in each scenario

PRODUCT TITLE: "{title}"
{descriptionLine}

PRESENTATION MODES — rank ALL modes that make sense for this product (minimum 2, maximum 4):
- "worn-on-model": clothing, jewelry, accessories, wearables → show on a person/animal
- "held-in-hand": small items, beverages, skincare, tools → show being held naturally
- "styled-on-surface": home decor, candles, stationery, boxes, jars, accessories → arrange on an appropriate surface
- "in-use-action": food being eaten, serum being applied, chair being sat in, tool being used, collar on a dog → show mid-use
- "flat-lay-arrangement": collections, kits, gift sets, multi-piece items, accessories with their parts → overhead curated layout

RULES:
- Return MULTIPLE viable modes ranked by how compelling they are for a buyer
- Each mode MUST have a DIFFERENT heroAction and naturalEnvironment — variety is the whole point
- A dog collar → in-use-action (dog wearing it), styled-on-surface (on marble/wood), flat-lay-arrangement (collar + leash + tag spread out)
- A hoodie → worn-on-model (person wearing), styled-on-surface (folded on chair), flat-lay-arrangement (outfit spread)
- A ring → worn-on-model (on hand close-up), styled-on-surface (on ring dish), in-use-action (being put on)
- A face serum → held-in-hand (holding bottle), in-use-action (applying to face), styled-on-surface (on vanity shelf)
- A candle → styled-on-surface (on shelf), in-use-action (being lit/burning), flat-lay-arrangement (with match + tray)

For cameraAngle pick ONE per mode: "eye-level front", "eye-level three-quarter", "close-up detail", "overhead flat-lay", "low-angle hero", "over-the-shoulder"

For heroAction describe the SPECIFIC physical action/pose per mode (max 12 words). Be concrete:
- Good: "large dog wearing collar, head slightly turned, looking forward"
- Good: "collar coiled on aged marble slab beside brass leash clip"
- Good: "collar and leash set spread in flat-lay with dog tags"
- Bad: "product displayed beautifully" (too vague)

For naturalEnvironment name 1-2 SPECIFIC real-world locations per mode (max 10 words):
- Good: "sunny park path with grass edge"
- Good: "rustic wooden entryway bench"
- Bad: "beautiful setting" (not a place)

For productAppearance describe the product's ACTUAL visual identity as seen in the image or inferred from the title (max 15 words). This is critical — an AI image editor will use this to know WHAT to preserve.
- Include: dominant colors, material/fabric, key design elements, distinctive features
- Good: "brown leather collar with turquoise padding, gold buckle, silver conchos"
- Good: "gray cotton hoodie with dark cross and chain graphics, fur-trimmed hood"
- Bad: "nice product" (useless)

Return ONLY valid JSON:
{
  "productType": "...",
  "productAppearance": "...",
  "viableModes": [
    {
      "presentationMode": "in-use-action",
      "cameraAngle": "...",
      "heroAction": "...",
      "naturalEnvironment": "..."
    },
    {
      "presentationMode": "styled-on-surface",
      "cameraAngle": "...",
      "heroAction": "...",
      "naturalEnvironment": "..."
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
      }))

    // Ensure at least one mode
    if (viableModes.length === 0) {
      viableModes.push({
        presentationMode: "styled-on-surface" as PresentationMode,
        cameraAngle: "eye-level three-quarter",
        heroAction: `${product.title} displayed naturally`,
        naturalEnvironment: "clean neutral surface",
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
