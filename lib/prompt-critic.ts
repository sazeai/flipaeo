import type { ShowcaseStrategy } from "@/lib/product-showcase"

interface CriticResult {
  valid: boolean
  issues: string[]
}

const SMALL_FAMILIES = new Set([
  "jewelry-small",
  "box-case-small",
  "beauty-small",
  "ceramics-tableware",
])

const SURFACE_REQUIRED_FAMILIES = new Set([
  "apparel",
  "carried-accessory",
])

/**
 * Prompt Critic — lightweight rule-based validation gate.
 *
 * Checks the assembled art director prompt for logical errors BEFORE
 * sending to fal.ai. No LLM call — pure string/rule analysis.
 *
 * Returns { valid: true } if the prompt passes, or { valid: false, issues: [...] }
 * with human-readable descriptions of what went wrong.
 */
export function validatePrompt(
  prompt: string,
  showcase: ShowcaseStrategy,
): CriticResult {
  const issues: string[] = []
  const lower = prompt.toLowerCase()

  // Rule 1: Small product + room-scale scene = wrong
  if (SMALL_FAMILIES.has(showcase.productFamily)) {
    const roomIndicators = ["full room", "living room", "bedroom", "full venue", "room-scale", "room corner"]
    for (const indicator of roomIndicators) {
      if (lower.includes(indicator)) {
        issues.push(`Small product (${showcase.productFamily}) placed in room-scale scene ("${indicator}")`)
        break
      }
    }
  }

  // Rule 2: Apparel/carried-accessory without clear support surface
  if (SURFACE_REQUIRED_FAMILIES.has(showcase.productFamily)) {
    if (showcase.presentationMode === "styled-on-surface" || showcase.presentationMode === "flat-lay-arrangement") {
      const surfaceTerms = ["surface", "bench", "table", "bed", "backdrop", "floor", "mat", "shelf", "desk", "counter", "flat-lay"]
      const hasSurface = surfaceTerms.some(t => lower.includes(t))
      if (!hasSurface) {
        issues.push(`Apparel/accessory on surface but no clear support surface mentioned in prompt`)
      }
    }
  }

  // Rule 3: Forbidden elements leaked into prompt (primary enforcer — replaces pink elephant in prompt)
  if (showcase.forbiddenElements) {
    const forbidden = showcase.forbiddenElements.split(",").map(f => f.trim().toLowerCase()).filter(Boolean)
    for (const f of forbidden) {
      // Check each word of the forbidden phrase independently for multi-word terms
      if (f.length > 4 && lower.includes(f)) {
        issues.push(`Forbidden element "${f}" found in prompt`)
      }
      // Also check individual significant words from forbidden phrases
      const words = f.split(/\s+/).filter(w => w.length > 3)
      for (const word of words) {
        // Use word boundary check to avoid false positives (e.g., "wall" in "wallet")
        const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        if (wordRegex.test(prompt)) {
          issues.push(`Forbidden word "${word}" (from "${f}") found in prompt`)
          break
        }
      }
    }
  }

  // Rule 3b: Meta-instructions leaked into prompt (should be context only, not output)
  const metaPatterns = [
    /\bdo not\b/i,
    /\bdon'?t\b/i,
    /\bnever\b/i,
    /\bavoid\b/i,
    /\bensure\b/i,
    /\bmake sure\b/i,
    /\bexplicitly\b/i,
    /\bmust not\b/i,
    /\bshould not\b/i,
    /\bkeep the product at\b/i,
    /\bkeep the scene\b/i,
  ]
  for (const pattern of metaPatterns) {
    if (pattern.test(prompt)) {
      issues.push(`Meta-instruction detected in prompt: "${prompt.match(pattern)?.[0]}"`)
      break // One meta-instruction flag is enough
    }
  }

  // Rule 3c: Unwanted body parts in non-worn/held modes
  if (showcase.presentationMode !== "worn-on-model" && showcase.presentationMode !== "held-in-hand") {
    const bodyParts = ["hand", "hands", "finger", "fingers", "wrist", "arm", "body part"]
    for (const part of bodyParts) {
      const partRegex = new RegExp(`\\b${part}\\b`, 'i')
      if (partRegex.test(prompt)) {
        issues.push(`Body part "${part}" referenced in ${showcase.presentationMode} mode prompt`)
        break
      }
    }
  }

  // Rule 4: Wall art not on wall or in frame
  if (showcase.productFamily === "wall-art") {
    const wallTerms = ["wall", "frame", "gallery", "hung", "leaning", "mounted"]
    const hasWallContext = wallTerms.some(t => lower.includes(t))
    if (!hasWallContext) {
      issues.push(`Wall art product but no wall/frame/gallery context in prompt`)
    }
  }

  // Rule 5: Kids/baby with adult-inappropriate content
  if (showcase.productFamily === "kids-baby") {
    const inappropriate = ["alcohol", "wine", "beer", "cocktail", "bar", "knife", "industrial", "dark moody"]
    for (const term of inappropriate) {
      if (lower.includes(term)) {
        issues.push(`Kids/baby product with inappropriate context: "${term}"`)
        break
      }
    }
  }

  // Rule 6: Wedding/event with casual or mismatched context
  if (showcase.productFamily === "wedding-event") {
    const mismatch = ["gym", "garage", "industrial warehouse", "pet"]
    for (const term of mismatch) {
      if (lower.includes(term)) {
        issues.push(`Wedding/event product with mismatched context: "${term}"`)
        break
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
