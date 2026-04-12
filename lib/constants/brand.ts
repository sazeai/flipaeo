export const FONT_OPTIONS: { name: string; google: string; sample: string }[] = [
  { name: 'Playfair Display', google: 'Playfair+Display:wght@700', sample: 'Elegant Serif' },
  { name: 'Inter', google: 'Inter:wght@600', sample: 'Modern Sans' },
  { name: 'Roboto', google: 'Roboto:wght@500', sample: 'Readable Sans' },
  { name: 'Outfit', google: 'Outfit:wght@600', sample: 'Geometric' },
  { name: 'Poppins', google: 'Poppins:wght@600', sample: 'Rounded Sans' },
  { name: 'Montserrat', google: 'Montserrat:wght@600', sample: 'Bold Sans' },
  { name: 'Lora', google: 'Lora:wght@600', sample: 'Book Serif' },
  { name: 'Merriweather', google: 'Merriweather:wght@700', sample: 'Warm Serif' },
  { name: 'Raleway', google: 'Raleway:wght@600', sample: 'Thin Elegance' },
  { name: 'DM Sans', google: 'DM+Sans:wght@600', sample: 'Minimal Sans' },
]

export const AESTHETIC_OPTIONS: { name: string; gradient: string; emoji: string; desc: string }[] = [
  { name: 'Modern & Minimalist', gradient: 'from-neutral-100 to-neutral-300', emoji: '◻️', desc: 'White space, clean lines' },
  { name: 'Warm & Cozy', gradient: 'from-amber-100 to-orange-200', emoji: '🕯️', desc: 'Soft tones, warm textures' },
  { name: 'Bold & Vibrant', gradient: 'from-fuchsia-300 to-orange-300', emoji: '🎨', desc: 'Saturated, eye-catching' },
  { name: 'Earthy & Natural', gradient: 'from-lime-100 to-emerald-200', emoji: '🌿', desc: 'Organic greens, linen, wood' },
  { name: 'Authentic & Handmade', gradient: 'from-stone-100 via-amber-50 to-lime-100', emoji: '🧵', desc: 'Window light, lived-in props, DIY realism' },
  { name: 'Luxury & Premium', gradient: 'from-amber-200 to-yellow-400', emoji: '✨', desc: 'Gold accents, dark moods' },
  { name: 'Playful & Fun', gradient: 'from-pink-200 to-sky-200', emoji: '🎈', desc: 'Pastels, rounded, cheerful' },
  { name: 'Scandinavian', gradient: 'from-slate-100 to-sky-100', emoji: '❄️', desc: 'Light wood, hygge, airy' },
  { name: 'Industrial', gradient: 'from-zinc-300 to-stone-400', emoji: '⚙️', desc: 'Raw concrete, metal, dark' },
  { name: 'Bohemian', gradient: 'from-orange-200 to-rose-200', emoji: '🪬', desc: 'Macramé, rattan, terracotta' },
  { name: 'Coastal', gradient: 'from-cyan-100 to-blue-200', emoji: '🌊', desc: 'Ocean blues, sandy neutrals' },
]

export interface BrandSettingsData {
  brand_name: string
  brand_description: string
  store_url: string
  logo_url: string
  font_choice: string
  aesthetic_boundaries: string[]
  default_board_id: string
  account_age_type: 'brand_new' | 'established' | ''
  pin_layout_mode: 'organic' | 'editorial'
}
