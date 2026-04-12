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
export type ProductFamily =
  | "jewelry-small"
  | "box-case-small"
  | "apparel"
  | "pet-accessory"
  | "beauty-small"
  | "furniture-large"
  | "home-decor"
  | "food-drink"
  | "tech-desk"
  | "stationery"
  | "ceramics-tableware"
  | "kids-baby"
  | "wedding-event"
  | "wall-art"
  | "carried-accessory"
  | "general"

type ShowcaseMode = {
  presentationMode: PresentationMode
  cameraAngle: string
  heroAction: string
  naturalEnvironment: string
  suggestedProps: string
}

type FamilyRules = {
  sceneScope: string
  scaleGuidance: string
  forbiddenElements: string
  defaultProps: Partial<Record<PresentationMode, string>>
  defaultEnvironments: Partial<Record<PresentationMode, string>>
  defaultCameras: Partial<Record<PresentationMode, string>>
}

const FAMILY_RULES: Record<ProductFamily, FamilyRules> = {
  "jewelry-small": {
    sceneScope: "macro jewelry shot only; no full-room background story",
    scaleGuidance: "keep jewelry at believable wearable scale using macro framing, a hand, ring dish, tray, or velvet box",
    forbiddenElements: "dressers, dreamcatchers, wall decor, full furniture scenes, oversized props",
    defaultProps: {
      "worn-on-model": "mirror, jewelry tray",
      "held-in-hand": "soft linen, jewelry tray",
      "styled-on-surface": "ring dish, soft linen",
      "in-use-action": "mirror, velvet box",
      "flat-lay-arrangement": "jewelry tray, soft linen",
    },
    defaultEnvironments: {
      "worn-on-model": "hand close-up near vanity mirror",
      "held-in-hand": "soft linen beside vanity tray",
      "styled-on-surface": "jewelry tray on stone slab close-up",
      "in-use-action": "close vanity mirror setup",
      "flat-lay-arrangement": "soft linen with jewelry tray",
    },
    defaultCameras: {
      "worn-on-model": "close-up detail",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "close-up detail",
      "in-use-action": "close-up detail",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "box-case-small": {
    sceneScope: "tight tabletop or hand close-up only",
    scaleGuidance: "keep the box at believable hand scale and anchor it with a hand, ring, or tabletop close-up",
    forbiddenElements: "journals, pens, coffee cups, full sofa scenes, room decor",
    defaultProps: {
      "held-in-hand": "ring, soft linen",
      "styled-on-surface": "ring, tissue paper",
      "in-use-action": "ring, ribbon",
      "flat-lay-arrangement": "ring, ribbon",
      "worn-on-model": "ring, ribbon",
    },
    defaultEnvironments: {
      "held-in-hand": "soft window-lit interior close-up",
      "styled-on-surface": "linen tabletop close-up",
      "in-use-action": "gift table close-up",
      "flat-lay-arrangement": "gift wrap flat-lay",
      "worn-on-model": "soft tabletop close-up",
    },
    defaultCameras: {
      "held-in-hand": "close-up detail",
      "styled-on-surface": "close-up detail",
      "in-use-action": "close-up detail",
      "flat-lay-arrangement": "overhead flat-lay",
      "worn-on-model": "close-up detail",
    },
  },
  apparel: {
    sceneScope: "full garment shot or believable outfit layout only",
    scaleGuidance: "garment must clearly rest on a real horizontal surface or be worn on a body; no floating or wall-floor ambiguity",
    forbiddenElements: "floating layouts, vertical-wall ambiguity, vinyl records, skateboards, random decor props",
    defaultProps: {
      "worn-on-model": "sneakers, crossbody bag",
      "held-in-hand": "phone, tote bag",
      "styled-on-surface": "folded jeans, sneakers",
      "in-use-action": "backpack, headphones",
      "flat-lay-arrangement": "jeans, sneakers",
    },
    defaultEnvironments: {
      "worn-on-model": "streetwear sidewalk or studio backdrop",
      "held-in-hand": "boutique fitting room",
      "styled-on-surface": "studio paper backdrop or wooden bench",
      "in-use-action": "city sidewalk or casual indoor hallway",
      "flat-lay-arrangement": "studio paper backdrop or bedspread",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "eye-level three-quarter",
      "styled-on-surface": "overhead flat-lay",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "pet-accessory": {
    sceneScope: "close product scene or dog-wear shot only",
    scaleGuidance: "show believable pet-accessory scale using a dog neck, leash hardware, hand, or dog tag as context",
    forbiddenElements: "watches, journals, pens, coffee cups, unrelated decor",
    defaultProps: {
      "worn-on-model": "leash, dog tag",
      "held-in-hand": "leash, dog tag",
      "styled-on-surface": "leash, dog tag",
      "in-use-action": "leash, tennis ball",
      "flat-lay-arrangement": "leash, dog tag",
    },
    defaultEnvironments: {
      "worn-on-model": "park path near grass edge",
      "held-in-hand": "entryway bench close-up",
      "styled-on-surface": "wood bench or stone slab close-up",
      "in-use-action": "park path or porch step",
      "flat-lay-arrangement": "entryway bench flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "close-up detail",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "beauty-small": {
    sceneScope: "close vanity or hand-held beauty shot only",
    scaleGuidance: "keep the item at believable hand or countertop scale with close framing",
    forbiddenElements: "room decor stories, oversized props, unrelated objects",
    defaultProps: {
      "worn-on-model": "mirror, folded towel",
      "held-in-hand": "mirror, folded towel",
      "styled-on-surface": "tray, folded towel",
      "in-use-action": "mirror, cotton pad",
      "flat-lay-arrangement": "tray, cotton pad",
    },
    defaultEnvironments: {
      "worn-on-model": "bathroom mirror close-up",
      "held-in-hand": "bathroom vanity close-up",
      "styled-on-surface": "vanity tray close-up",
      "in-use-action": "bathroom mirror close-up",
      "flat-lay-arrangement": "vanity tray flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "close-up detail",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "close-up detail",
      "in-use-action": "close-up detail",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "furniture-large": {
    sceneScope: "room-scale scene is allowed",
    scaleGuidance: "show the product at believable furniture scale with enough surrounding context to read size",
    forbiddenElements: "miniature staging that shrinks the product unrealistically",
    defaultProps: {
      "worn-on-model": "throw pillow, blanket",
      "held-in-hand": "book, blanket",
      "styled-on-surface": "throw pillow, blanket",
      "in-use-action": "book, throw pillow",
      "flat-lay-arrangement": "blanket, throw pillow",
    },
    defaultEnvironments: {
      "worn-on-model": "living room or nursery",
      "held-in-hand": "living room corner",
      "styled-on-surface": "living room or nursery",
      "in-use-action": "living room or nursery",
      "flat-lay-arrangement": "styled room corner",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "eye-level three-quarter",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "eye-level three-quarter",
    },
  },
  "home-decor": {
    sceneScope: "tabletop or shelf vignette only",
    scaleGuidance: "show the item at believable home-decor scale using a table, shelf, or hand for context",
    forbiddenElements: "random props unrelated to the item’s home use",
    defaultProps: {
      "worn-on-model": "tray, folded linen",
      "held-in-hand": "tray, folded linen",
      "styled-on-surface": "tray, folded linen",
      "in-use-action": "tray, folded linen",
      "flat-lay-arrangement": "tray, folded linen",
    },
    defaultEnvironments: {
      "worn-on-model": "tabletop vignette",
      "held-in-hand": "tabletop vignette",
      "styled-on-surface": "tabletop or shelf vignette",
      "in-use-action": "tabletop vignette",
      "flat-lay-arrangement": "tabletop flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "food-drink": {
    sceneScope: "close kitchen or dining scene only",
    scaleGuidance: "show believable serving scale with plate, hand, or tabletop context",
    forbiddenElements: "random decor props unrelated to eating or serving",
    defaultProps: {
      "worn-on-model": "plate, napkin",
      "held-in-hand": "napkin, spoon",
      "styled-on-surface": "plate, napkin",
      "in-use-action": "spoon, napkin",
      "flat-lay-arrangement": "plate, napkin",
    },
    defaultEnvironments: {
      "worn-on-model": "kitchen table",
      "held-in-hand": "kitchen counter close-up",
      "styled-on-surface": "kitchen counter or dining table",
      "in-use-action": "kitchen table or counter",
      "flat-lay-arrangement": "tabletop flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "close-up detail",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "tech-desk": {
    sceneScope: "desk or workspace close-up only; no full-room shots",
    scaleGuidance: "keep the item at believable desk-accessory scale using a keyboard, monitor edge, or hand for context",
    forbiddenElements: "kitchen props, food, pet items, jewelry, candles, plants unrelated to desk setup",
    defaultProps: {
      "worn-on-model": "keyboard, monitor",
      "held-in-hand": "keyboard, cable",
      "styled-on-surface": "keyboard, desk mat",
      "in-use-action": "keyboard, monitor",
      "flat-lay-arrangement": "keyboard, cable",
    },
    defaultEnvironments: {
      "worn-on-model": "desk setup close-up",
      "held-in-hand": "desk setup close-up",
      "styled-on-surface": "desk mat or wooden desk close-up",
      "in-use-action": "workspace with monitor glow",
      "flat-lay-arrangement": "desk mat flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "close-up detail",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  stationery: {
    sceneScope: "desk vignette or hand-writing close-up only",
    scaleGuidance: "keep the item at believable hand or desk scale with close framing",
    forbiddenElements: "kitchen props, pet items, jewelry, full room scenes, tech monitors",
    defaultProps: {
      "worn-on-model": "ink bottle, wax seal",
      "held-in-hand": "ink bottle, desk blotter",
      "styled-on-surface": "ink bottle, brass paperweight",
      "in-use-action": "ink bottle, letter paper",
      "flat-lay-arrangement": "ink bottle, wax seal",
    },
    defaultEnvironments: {
      "worn-on-model": "dark wood desk close-up",
      "held-in-hand": "leather desk pad close-up",
      "styled-on-surface": "dark wood desk or leather pad close-up",
      "in-use-action": "writing desk with warm lamp glow",
      "flat-lay-arrangement": "dark wood desk flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "close-up detail",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "ceramics-tableware": {
    sceneScope: "tabletop or hand-held pottery close-up only",
    scaleGuidance: "keep the item at believable tableware scale using a hand, table setting, or shelf for context",
    forbiddenElements: "pet items, tech accessories, jewelry, full room scenes, wall decor",
    defaultProps: {
      "worn-on-model": "linen napkin, wooden spoon",
      "held-in-hand": "linen napkin, tea towel",
      "styled-on-surface": "linen napkin, dried flowers",
      "in-use-action": "wooden spoon, linen napkin",
      "flat-lay-arrangement": "linen napkin, dried flowers",
    },
    defaultEnvironments: {
      "worn-on-model": "kitchen shelf or dining table close-up",
      "held-in-hand": "kitchen counter close-up with natural light",
      "styled-on-surface": "linen tablecloth or wooden shelf close-up",
      "in-use-action": "kitchen table with morning light",
      "flat-lay-arrangement": "linen tablecloth flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "kids-baby": {
    sceneScope: "nursery vignette, play mat, or parent-child close-up only",
    scaleGuidance: "show believable child or baby scale using a small hand, play mat, crib rail, or nursery shelf for context",
    forbiddenElements: "alcohol, sharp objects, candles, adult-only props, dark moody lighting, industrial scenes",
    defaultProps: {
      "worn-on-model": "stuffed animal, wooden rattle",
      "held-in-hand": "stuffed animal, wooden rattle",
      "styled-on-surface": "stuffed animal, soft blanket",
      "in-use-action": "stuffed animal, play mat",
      "flat-lay-arrangement": "stuffed animal, soft blanket",
    },
    defaultEnvironments: {
      "worn-on-model": "sunlit nursery corner",
      "held-in-hand": "parent holding near nursery shelf",
      "styled-on-surface": "nursery shelf or crib ledge close-up",
      "in-use-action": "play mat in bright nursery",
      "flat-lay-arrangement": "soft blanket or play mat flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "wedding-event": {
    sceneScope: "elegant tabletop vignette or hand close-up only; no full venue shots",
    scaleGuidance: "keep the item at believable gift or table-setting scale using a hand, invitation, or small tray for context",
    forbiddenElements: "pet items, tech accessories, kitchen appliances, full room scenes, casual streetwear",
    defaultProps: {
      "worn-on-model": "ribbon, dried flowers",
      "held-in-hand": "ribbon, envelope",
      "styled-on-surface": "ribbon, dried flowers",
      "in-use-action": "envelope, wax seal stamp",
      "flat-lay-arrangement": "ribbon, dried flowers",
    },
    defaultEnvironments: {
      "worn-on-model": "elegant vanity or linen table close-up",
      "held-in-hand": "soft window-lit interior close-up",
      "styled-on-surface": "linen or marble tabletop close-up",
      "in-use-action": "candlelit table or writing desk close-up",
      "flat-lay-arrangement": "linen tabletop flat-lay with soft light",
    },
    defaultCameras: {
      "worn-on-model": "close-up detail",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "close-up detail",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "wall-art": {
    sceneScope: "wall-mounted or framed display only; art must be on or against a wall",
    scaleGuidance: "show the art at believable print scale on a real wall, leaning on a shelf, or in a frame held by a hand",
    forbiddenElements: "random tabletop props, kitchen items, pet items, tech accessories",
    defaultProps: {
      "worn-on-model": "frame, picture hook",
      "held-in-hand": "frame, wrapping paper",
      "styled-on-surface": "frame, small plant",
      "in-use-action": "frame, picture hook",
      "flat-lay-arrangement": "frame, tissue paper",
    },
    defaultEnvironments: {
      "worn-on-model": "gallery wall or living room wall close-up",
      "held-in-hand": "bright room with clean wall behind",
      "styled-on-surface": "leaning on shelf against clean wall",
      "in-use-action": "being hung on gallery wall",
      "flat-lay-arrangement": "wrapping paper flat-lay with frame",
    },
    defaultCameras: {
      "worn-on-model": "eye-level front",
      "held-in-hand": "eye-level three-quarter",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level front",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "carried-accessory": {
    sceneScope: "outfit pairing or styled surface shot only; no full room backgrounds",
    scaleGuidance: "show the accessory at believable carry scale — on a shoulder, in a hand, or beside an outfit",
    forbiddenElements: "kitchen props, pet items, jewelry trays, candles, full furniture scenes",
    defaultProps: {
      "worn-on-model": "sunglasses, phone",
      "held-in-hand": "sunglasses, coffee cup",
      "styled-on-surface": "sunglasses, keys",
      "in-use-action": "phone, sunglasses",
      "flat-lay-arrangement": "sunglasses, keys",
    },
    defaultEnvironments: {
      "worn-on-model": "city sidewalk or café entrance",
      "held-in-hand": "café table or boutique doorway",
      "styled-on-surface": "wooden bench or studio backdrop",
      "in-use-action": "city street or transit station",
      "flat-lay-arrangement": "studio or bedspread flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  general: {
    sceneScope: "product-world scene only",
    scaleGuidance: "keep size believable using a natural surface, hand, or nearby product-world object",
    forbiddenElements: "random unrelated props and room-scale distractions",
    defaultProps: {
      "worn-on-model": "none",
      "held-in-hand": "none",
      "styled-on-surface": "none",
      "in-use-action": "none",
      "flat-lay-arrangement": "none",
    },
    defaultEnvironments: {
      "worn-on-model": "natural use setting",
      "held-in-hand": "clean close-up setting",
      "styled-on-surface": "clean tabletop setting",
      "in-use-action": "natural use setting",
      "flat-lay-arrangement": "clean flat-lay setting",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
}

function inferProductFamily(product: { title: string; description?: string }, productType?: string) {
  const haystack = `${product.title} ${product.description || ""} ${productType || ""}`.toLowerCase()

  // --- Most specific families first (order matters!) ---

  // Wedding & Event — before box-case-small (velvet ring box in wedding context should stay wedding)
  if (/(wax seal|acrylic sign|groomsmen|bridesmaid|wedding favor|place card|table number|wedding|bridal|engagement gift|proposal gift)/.test(haystack)) {
    return "wedding-event" as ProductFamily
  }
  // Box/Case — after wedding to avoid wedding ring boxes matching here
  if (/(ring box|jewelry box|velvet box|proposal box|gem box|gift box|hinged box|case)/.test(haystack)) {
    return "box-case-small" as ProductFamily
  }
  // Pet — before ceramics (ceramic pet bowl should be pet-accessory)
  if (/(collar|leash|harness|dog|cat|pet|puppy|kitten)/.test(haystack)) {
    return "pet-accessory" as ProductFamily
  }
  // Kids/Baby — before apparel (baby onesie should be kids-baby, not apparel)
  if (/(baby|nursery|montessori|pacifier|toddler|wooden block|crib|onesie|infant|newborn|playmat|teether|silicone clip)/.test(haystack)) {
    return "kids-baby" as ProductFamily
  }
  // Carried accessories — before apparel (tote bag should be carried-accessory, not apparel)
  if (/(tote bag|backpack|wallet|clutch|laptop bag|messenger bag|crossbody bag|purse|handbag|fanny pack|sling bag|duffle)/.test(haystack)) {
    return "carried-accessory" as ProductFamily
  }
  // Apparel
  if (/(hoodie|t-shirt|tee|shirt|sweatshirt|jacket|coat|sweater|cardigan|pants|jeans|dress|apparel|sneaker|custom sneaker)/.test(haystack)) {
    return "apparel" as ProductFamily
  }
  // Jewelry & worn accessories (watches, wallets already handled above in carried-accessory)
  if (/(ring|earring|bracelet|necklace|pendant|anklet|gemstone|turquoise|sterling silver|jewelry|watch|signet|cuff|brooch)/.test(haystack)) {
    return "jewelry-small" as ProductFamily
  }
  // Tech & Desk
  if (/(keycap|keyboard|mousepad|mouse pad|monitor|headphone stand|desk mat|cable organizer|laptop sleeve|laptop stand|webcam|mechanical key|tech accessory)/.test(haystack)) {
    return "tech-desk" as ProductFamily
  }
  // Stationery
  if (/(journal|planner|fountain pen|desk organizer|brass desk|stationery|bookmark|wax seal kit|letter opener|calligraphy|notebook|diary)/.test(haystack)) {
    return "stationery" as ProductFamily
  }
  // Ceramics/Tableware — before food-drink (artisan mug is ceramics, not food)
  if (/(ceramic|pottery|stoneware|porcelain|handcrafted mug|artisan mug|matcha bowl|incense holder|speckled mug|wabi.sabi|earthenware|glazed)/.test(haystack)) {
    return "ceramics-tableware" as ProductFamily
  }
  // Beauty
  if (/(serum|cream|lotion|balm|skincare|perfume|cosmetic|lip|beauty)/.test(haystack)) {
    return "beauty-small" as ProductFamily
  }
  // Wall Art — before home-decor (art print moved here)
  if (/(wall art|art print|poster|canvas print|framed art|gallery print|typography print|nursery print|downloadable print|digital art print)/.test(haystack)) {
    return "wall-art" as ProductFamily
  }
  // Home Decor (art print removed — now in wall-art)
  if (/(candle|vase|decor|frame|planter|ornament|home decor|throw pillow|lamp|rug|tapestry)/.test(haystack)) {
    return "home-decor" as ProductFamily
  }
  // Furniture
  if (/(chair|stool|bench|sofa|table|furniture|bookshelf|cabinet|dresser|nightstand)/.test(haystack)) {
    return "furniture-large" as ProductFamily
  }
  // Food & Drink (after ceramics to avoid artisan mug → food-drink)
  if (/(peanut butter|snack|tea|coffee|food|drink|jar|sauce|honey|chocolate|spice|granola)/.test(haystack)) {
    return "food-drink" as ProductFamily
  }

  return "general" as ProductFamily
}

/**
 * Detect digital/downloadable products that have no physical product to composite.
 * These should be skipped in auto-generation and flagged for manual pin creation.
 */
export function isDigitalProduct(product: { title: string; description?: string }, tags?: string[] | null): boolean {
  const haystack = `${product.title} ${product.description || ""} ${(tags || []).join(" ")}`.toLowerCase()
  return /(downloadable|digital download|instant download|printable|pdf|digital file|digital print)/.test(haystack)
}

const VALID_SIZE_CLASSES = ["tiny", "palm", "handheld", "tabletop", "furniture", "room"] as const
const VALID_SCENE_DEPTHS = ["macro close-up", "tabletop vignette", "room corner", "full room"] as const

function parseConstraints(raw: any): ProductConstraints | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const sizeClass = VALID_SIZE_CLASSES.includes(raw.sizeClass) ? raw.sizeClass : undefined
  if (!sizeClass) return undefined

  return {
    sizeClass,
    scaleAnchor: typeof raw.scaleAnchor === "string" ? raw.scaleAnchor.slice(0, 50) : "",
    supportRule: typeof raw.supportRule === "string" ? raw.supportRule.slice(0, 80) : "",
    maxSceneDepth: VALID_SCENE_DEPTHS.includes(raw.maxSceneDepth) ? raw.maxSceneDepth : "tabletop vignette",
    propWorld: typeof raw.propWorld === "string" ? raw.propWorld.slice(0, 50) : "",
    forbiddenContexts: Array.isArray(raw.forbiddenContexts)
      ? raw.forbiddenContexts.filter((c: any) => typeof c === "string").map((c: string) => c.slice(0, 60)).slice(0, 5)
      : [],
  }
}

function normalizeWhitespace(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || ""
}

function containsAny(value: string, terms: string[]) {
  const lower = value.toLowerCase()
  return terms.some(term => lower.includes(term))
}

function sanitizeSuggestedProps(rawProps: string, family: ProductFamily, mode: PresentationMode) {
  const normalized = normalizeWhitespace(rawProps)
  const rules = FAMILY_RULES[family]
  const defaultProps = rules.defaultProps[mode] || "none"

  if (!normalized || normalized === "none") return defaultProps

  const blacklist = [
    "watch",
    "journal",
    "notebook",
    "pen",
    "coffee cup",
    "mug",
    "dreamcatcher",
    "record",
    "vinyl",
    "dvd",
    "skateboard",
    "candle",
    "wine glass",
    "cocktail",
    "alcohol",
    "cigarette",
    "ashtray",
    "knife",
    "weapon",
  ]

  if (containsAny(normalized, blacklist)) return defaultProps
  return normalized
}

function sanitizeEnvironment(rawEnvironment: string, family: ProductFamily, mode: PresentationMode) {
  const normalized = normalizeWhitespace(rawEnvironment)
  const rules = FAMILY_RULES[family]
  const defaultEnvironment = rules.defaultEnvironments[mode] || "clean product setting"

  if (!normalized) return defaultEnvironment

  const familyBlacklists: Partial<Record<ProductFamily, string[]>> = {
    "jewelry-small": ["dresser", "bedroom", "dreamcatcher", "sofa", "couch", "room", "wall"],
    "box-case-small": ["journal", "pen", "sofa", "couch", "room"],
    apparel: ["wall", "floor", "concrete floor", "patio", "sidewalk", "street floor"],
    "pet-accessory": ["watch", "journal", "pen", "office"],
    "tech-desk": ["kitchen", "dining", "bathroom", "nursery", "pet", "garden", "outdoor"],
    stationery: ["kitchen", "bathroom", "nursery", "pet", "garden", "gym"],
    "ceramics-tableware": ["bedroom", "office", "gym", "pet", "tech", "garage"],
    "kids-baby": ["bar", "alcohol", "wine", "industrial", "garage", "office", "dark"],
    "wedding-event": ["gym", "kitchen", "pet", "tech", "garage", "industrial"],
    "wall-art": ["kitchen counter", "dining table", "pet", "tech desk", "bathroom counter"],
    "carried-accessory": ["kitchen", "bathroom", "nursery", "pet", "jewelry tray"],
  }

  if (containsAny(normalized, familyBlacklists[family] || [])) {
    return defaultEnvironment
  }

  return normalized
}

function normalizeModeForFamily(
  mode: ShowcaseMode,
  family: ProductFamily,
  productTitle: string,
): ShowcaseMode {
  const rules = FAMILY_RULES[family]
  const presentationMode = mode.presentationMode

  return {
    presentationMode,
    cameraAngle: rules.defaultCameras[presentationMode] || mode.cameraAngle || "eye-level three-quarter",
    heroAction: normalizeWhitespace(mode.heroAction) || `${productTitle} displayed naturally`,
    naturalEnvironment: sanitizeEnvironment(mode.naturalEnvironment, family, presentationMode),
    suggestedProps: sanitizeSuggestedProps(mode.suggestedProps, family, presentationMode),
  }
}

export interface ProductConstraints {
  sizeClass: "tiny" | "palm" | "handheld" | "tabletop" | "furniture" | "room"
  scaleAnchor: string
  supportRule: string
  maxSceneDepth: string
  propWorld: string
  forbiddenContexts: string[]
}

export interface ShowcaseStrategy {
  productFamily: ProductFamily
  productType: string
  presentationMode: PresentationMode
  cameraAngle: string
  heroAction: string
  naturalEnvironment: string
  productAppearance: string
  suggestedProps: string
  sceneScope: string
  scaleGuidance: string
  forbiddenElements: string
}

/**
 * Full showcase analysis returned by Gemini — contains ALL viable modes
 * so we can rotate across pins for the same product.
 */
export interface ShowcaseAnalysis {
  productFamily: ProductFamily
  productType: string
  productAppearance: string
  /** AI-inferred per-product constraints (can tighten but not loosen family rules) */
  constraints?: ProductConstraints
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

Keep size and support physically believable:
- small jewelry or boxes should stay in macro or hand-level setups, not become room decor
- apparel on a surface must clearly rest on a real horizontal surface, not float between wall and floor

Return ONLY valid JSON:
{
  "productType": "...",
  "productAppearance": "...",
  "constraints": {
    "sizeClass": "tiny|palm|handheld|tabletop|furniture|room",
    "scaleAnchor": "what object grounds the product's size (e.g. finger, hand, desk surface, table, room corner)",
    "supportRule": "how the product must be physically supported (e.g. must rest on flat surface, must be worn, can hang on wall)",
    "maxSceneDepth": "macro close-up|tabletop vignette|room corner|full room",
    "propWorld": "the product's natural prop universe in max 5 words (e.g. desk office supplies, kitchen dining, pet gear and toys)",
    "forbiddenContexts": ["contexts that would look wrong for this product", "e.g. full room scenes, outdoor"]
  },
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
  productTags?: string[] | null,
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
    const productFamily = inferProductFamily(product, parsed.productType || productTags?.[0])

    // Validate and filter viable modes
    const viableModes = (parsed.viableModes || [])
      .filter((m: any) => PRESENTATION_MODES.includes(m.presentationMode))
      .map((m: any) => normalizeModeForFamily({
        presentationMode: m.presentationMode as PresentationMode,
        cameraAngle: m.cameraAngle || "eye-level three-quarter",
        heroAction: m.heroAction || `${product.title} displayed naturally`,
        naturalEnvironment: m.naturalEnvironment || "clean product setting",
        suggestedProps: m.suggestedProps || "",
      }, productFamily, product.title))

    // Ensure at least one mode
    if (viableModes.length === 0) {
      viableModes.push(normalizeModeForFamily({
        presentationMode: "styled-on-surface" as PresentationMode,
        cameraAngle: "eye-level three-quarter",
        heroAction: `${product.title} displayed naturally`,
        naturalEnvironment: "clean product setting",
        suggestedProps: "",
      }, productFamily, product.title))
    }

    // Parse AI-inferred constraints (best-effort — graceful if missing/malformed)
    const rawConstraints = parsed.constraints
    const constraints = parseConstraints(rawConstraints)

    return {
      productFamily,
      productType: parsed.productType || product.title,
      productAppearance: parsed.productAppearance || product.title,
      constraints,
      viableModes,
    }
  } catch (err) {
    // Graceful fallback — never block generation
    console.error("Product Showcase Resolver failed, using fallback:", err)
    const fallbackFamily = inferProductFamily(product, productTags?.[0])
    return {
      productFamily: fallbackFamily,
      productType: product.title,
      productAppearance: product.title,
      viableModes: [normalizeModeForFamily({
        presentationMode: "styled-on-surface",
        cameraAngle: "eye-level three-quarter",
        heroAction: `${product.title} displayed naturally`,
        naturalEnvironment: "clean product setting",
        suggestedProps: "",
      }, fallbackFamily, product.title)],
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
  const rules = FAMILY_RULES[analysis.productFamily]
  const idx = productPinCount % analysis.viableModes.length
  const picked = analysis.viableModes[idx]

  // Merge AI constraints with family rules (tighten-only, never loosen)
  const c = analysis.constraints
  let sceneScope = rules.sceneScope
  let scaleGuidance = rules.scaleGuidance
  let forbiddenElements = rules.forbiddenElements

  if (c) {
    // AI maxSceneDepth can tighten scene scope (e.g., "macro close-up" is tighter than "tabletop vignette")
    const depthOrder = ["macro close-up", "tabletop vignette", "room corner", "full room"]
    const familyScopeDepth = depthOrder.findIndex(d => rules.sceneScope.toLowerCase().includes(d.split(" ")[0]))
    const aiDepth = depthOrder.indexOf(c.maxSceneDepth)
    if (aiDepth >= 0 && aiDepth < familyScopeDepth) {
      sceneScope = `${c.maxSceneDepth} only; ${rules.sceneScope}`
    }

    // AI scaleAnchor + supportRule enrich guidance
    if (c.scaleAnchor) {
      scaleGuidance = `${rules.scaleGuidance}. Anchor with: ${c.scaleAnchor}`
    }
    if (c.supportRule) {
      scaleGuidance = `${scaleGuidance}. ${c.supportRule}`
    }

    // AI forbiddenContexts ADD to (never replace) family forbidden elements
    if (c.forbiddenContexts.length > 0) {
      forbiddenElements = `${rules.forbiddenElements}, ${c.forbiddenContexts.join(", ")}`
    }
  }

  return {
    productFamily: analysis.productFamily,
    productType: analysis.productType,
    productAppearance: analysis.productAppearance,
    sceneScope,
    scaleGuidance,
    forbiddenElements,
    ...picked,
  }
}
