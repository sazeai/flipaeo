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

  // Rule 3: Forbidden elements leaked into prompt
  if (showcase.forbiddenElements) {
    const forbidden = showcase.forbiddenElements.split(",").map(f => f.trim().toLowerCase()).filter(Boolean)
    for (const f of forbidden) {
      // Only check multi-word forbidden terms (single words like "wall" would false-positive on "wall art")
      if (f.length > 4 && lower.includes(f)) {
        issues.push(`Forbidden element "${f}" found in prompt`)
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
