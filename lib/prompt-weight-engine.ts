/**
 * Prompt Weight Engine — The Closed-Loop Brain
 * 
 * Selects prompt templates using weighted random sampling.
 * Higher-performing prompts (more outbound clicks) get higher
 * probability of selection, creating a self-improving loop.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface PromptWeight {
  id: string
  prompt_template: string
  aesthetic_tags: string[] | null
  weight: number
  total_pins_used: number
  total_clicks: number
  avg_click_rate: number
}

/**
 * Default prompt templates seeded on first use.
 * These represent different editorial "styles" the Art Director can use.
 */
const DEFAULT_PROMPTS: { template: string; tags: string[] }[] = [
  {
    template: 'Place this product in a bright, airy Scandinavian kitchen with natural wood textures and soft morning light. Photorealistic, 8k. Aspect ratio 2:3.',
    tags: ['Scandinavian', 'Modern & Minimalist'],
  },
  {
    template: 'Place this product on a rustic wooden farmhouse table with dried lavender and linen cloth. Warm golden hour light. Photorealistic, 8k. Aspect ratio 2:3.',
    tags: ['Warm & Cozy', 'Earthy & Natural'],
  },
  {
    template: 'Display this product in a luxury marble-and-brass bathroom setting with orchids and candles. Deep, moody lighting. Photorealistic, 8k. Aspect ratio 2:3.',
    tags: ['Luxury & Premium'],
  },
  {
    template: 'Show this product on a coastal porch overlooking the ocean, with wicker furniture and sea breeze textures. Bright, natural light. Photorealistic, 8k. Aspect ratio 2:3.',
    tags: ['Coastal', 'Earthy & Natural'],
  },
  {
    template: 'Present this product in a vibrant, colorful bohemian living room with layered textiles, plants, and warm terracotta tones. Photorealistic, 8k. Aspect ratio 2:3.',
    tags: ['Bohemian', 'Bold & Vibrant'],
  },
  {
    template: 'Feature this product on a clean concrete surface with industrial metal shelving, exposed brick, and a single green plant. Soft directional light. Photorealistic, 8k. Aspect ratio 2:3.',
    tags: ['Industrial', 'Modern & Minimalist'],
  },
]

/**
 * Seed default prompt weights for a new user/brand.
 */
export async function seedDefaultPrompts(userId: string, brandSettingsId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('prompt_weights')
    .select('id')
    .eq('user_id', userId)
    .eq('brand_settings_id', brandSettingsId)
    .limit(1)

  if (existing && existing.length > 0) return // Already seeded

  const rows = DEFAULT_PROMPTS.map(p => ({
    user_id: userId,
    brand_settings_id: brandSettingsId,
    prompt_template: p.template,
    aesthetic_tags: p.tags,
    weight: 1.0,
  }))

  await supabase.from('prompt_weights').insert(rows)
}

/**
 * Select a prompt template using weighted random sampling.
 * Filters by aesthetic boundaries if provided.
 * Always keeps a minimum exploration weight (0.1) so no prompt is fully eliminated.
 */
export async function selectWeightedPrompt(
  userId: string,
  brandSettingsId: string,
  aestheticBoundaries?: string[]
): Promise<PromptWeight | null> {
  let query = supabase
    .from('prompt_weights')
    .select('*')
    .eq('user_id', userId)
    .eq('brand_settings_id', brandSettingsId)

  const { data: prompts } = await query

  if (!prompts || prompts.length === 0) return null

  // Filter by aesthetic boundaries if set
  let filtered = prompts
  if (aestheticBoundaries && aestheticBoundaries.length > 0) {
    filtered = prompts.filter(p => {
      if (!p.aesthetic_tags || p.aesthetic_tags.length === 0) return true
      return p.aesthetic_tags.some((tag: string) => aestheticBoundaries.includes(tag))
    })
    // Fallback to all prompts if nothing matches
    if (filtered.length === 0) filtered = prompts
  }

  // Weighted random selection
  const totalWeight = filtered.reduce((sum, p) => sum + Math.max(p.weight, 0.1), 0)
  let random = Math.random() * totalWeight
  
  for (const prompt of filtered) {
    random -= Math.max(prompt.weight, 0.1)
    if (random <= 0) return prompt as PromptWeight
  }

  return filtered[0] as PromptWeight
}

/**
 * Update weights after analytics data comes in.
 * Uses a simple Bayesian-inspired update:
 * - Pins with above-average CTR get weight boost
 * - Pins with below-average CTR get weight reduction
 * - Minimum weight is 0.1 (exploration floor)
 */
export async function updatePromptWeights(
  userId: string,
  brandSettingsId: string
): Promise<void> {
  const { data: prompts } = await supabase
    .from('prompt_weights')
    .select('*')
    .eq('user_id', userId)
    .eq('brand_settings_id', brandSettingsId)

  if (!prompts || prompts.length === 0) return

  // Calculate global average CTR
  const totalClicks = prompts.reduce((s, p) => s + p.total_clicks, 0)
  const totalPins = prompts.reduce((s, p) => s + p.total_pins_used, 0)
  const globalAvgCTR = totalPins > 0 ? totalClicks / totalPins : 0

  // Update each prompt's weight
  for (const prompt of prompts) {
    if (prompt.total_pins_used < 2) continue // Need minimum data

    const promptCTR = prompt.total_pins_used > 0 
      ? prompt.total_clicks / prompt.total_pins_used 
      : 0

    // Weight adjustment: ratio of prompt CTR to global average
    // Clamped between 0.1 (exploration floor) and 5.0 (exploitation cap)
    let newWeight: number
    if (globalAvgCTR > 0) {
      newWeight = Math.min(5.0, Math.max(0.1, promptCTR / globalAvgCTR))
    } else {
      newWeight = 1.0
    }

    await supabase
      .from('prompt_weights')
      .update({
        weight: newWeight,
        avg_click_rate: promptCTR,
      })
      .eq('id', prompt.id)
  }
}

/**
 * Record that a prompt was used for a pin.
 */
export async function recordPromptUsage(promptWeightId: string): Promise<void> {
  const { data: current } = await supabase
    .from('prompt_weights')
    .select('total_pins_used')
    .eq('id', promptWeightId)
    .single()

  if (current) {
    await supabase
      .from('prompt_weights')
      .update({ total_pins_used: current.total_pins_used + 1 })
      .eq('id', promptWeightId)
  }
}
