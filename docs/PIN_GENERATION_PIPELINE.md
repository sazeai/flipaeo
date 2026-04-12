# Pin Generation Pipeline

> Last updated: April 12, 2026

## What This Covers

This is the current automatic pin pipeline used by PinLoop.

It explains:
- which file owns each stage
- what data moves between stages
- how showcase rotation works
- how aesthetic rotation works
- what gets stored in the database
- what happens after generation

---

## End-To-End Flow

### 1. Batch Scheduler And Guard Rails

**File:** `trigger/generate-pin-batch.ts`

Runs on cron: `*/5 * * * *`

What happens first:
- load all users with `brand_settings`
- skip users with `automation_paused = true`
- skip users without an active `dodo_subscriptions` record
- enforce `150` pins per 30 days safeguard
- skip users with `>= 50` pins in `pending_approval`
- load active products that have an image
- enforce `100` monthly pin cap across the user
- enforce per-product cap: `min(15, ceil(100 / productCount))`
- skip products with `>= 10` non-final pins already sitting in the queue

Product selection rule:
- eligible products are sorted by oldest `last_generated_at`
- one product is processed per run

---

### 2. Source Product Image Resolution

**File:** `trigger/generate-pin-batch.ts`

For the selected product:
- resolve `sourceImageUrl` from `products.image_url`
- fallback to `R2_PUBLIC_DOMAIN + image_r2_key` if needed
- fetch the image once
- convert it to base64 + mime type

That same fetched image is reused by:
- Showcase Resolver
- Art Director
- fal.ai image edit model

If no valid image URL exists, the product is skipped.

---

### 3. Product Showcase Analysis

**File:** `lib/product-showcase.ts`

This is the first AI stage.

Model:
- Gemini 2.5 Flash multimodal

Input:
- product title
- product description
- actual product image

Purpose:
- decide how the product should be shown
- decide what props are allowed
- decide what visual identity must be preserved

Output:
- `productType`
- `productAppearance`
- `viableModes[]`

Each entry in `viableModes[]` contains:
- `presentationMode`
- `cameraAngle`
- `heroAction`
- `naturalEnvironment`
- `suggestedProps`

Important:
- this stage is product-aware
- this is where product-specific props are chosen
- later stages are not supposed to invent props

Current presentation mode taxonomy:
- `worn-on-model`
- `held-in-hand`
- `styled-on-surface`
- `in-use-action`
- `flat-lay-arrangement`

Example:
- a dog collar can produce modes like dog wearing it, collar on a surface, or flat-lay with leash
- a ring box can produce held-in-hand, styled-on-surface, or opening action
- a hoodie can produce worn-on-model, folded on surface, or outfit flat-lay

---

### 4. Showcase Mode Rotation

**File:** `lib/product-showcase.ts`

Function:
- `pickShowcaseForPin()`

Purpose:
- rotate through the product's viable showcase modes over time

Rotation input:
- per-product pin count (`prodPins.length`)

Rule:
- `productPinCount % viableModes.length`

What this means:
- pin 0 uses mode 0
- pin 1 uses mode 1
- pin 2 uses mode 2
- then it wraps

Important:
- showcase rotation is per product
- this is separate from aesthetic rotation

---

### 5. Scene Concept Generation

**File:** `lib/context-matrix.ts`

Function:
- `generateUniqueAngle()`

This is the second AI stage.

Inputs:
- product id, title, description
- brand aesthetic boundaries
- audience profile
- past angles for this product
- locked showcase chosen in step 4
- global user pin count

What this stage does:
- picks one aesthetic from the user's selected boundaries
- writes a short scene concept
- keeps showcase data locked
- only adds surface, background, lighting, and atmosphere
- cannot invent new props outside `showcase.suggestedProps`

What this stage does **not** decide anymore:
- how the product is posed
- which props belong with the product
- what the product looks like

Output:
- `angle` text
- `embedding` vector
- `pickedAesthetic`

Dedup logic:
- embeds the scene text using `gemini-embedding-2-preview`
- compares against past pin angles using pgvector RPC `match_pin_angles`
- similarity threshold: `0.75`
- retries up to 3 times

Fallback if all attempts fail:
- `Premium Lifestyle aesthetic for {product.title}`

---

### 6. Aesthetic Rotation

**File:** `lib/context-matrix.ts`

Function:
- `pickAestheticForPin()`

Purpose:
- rotate across the user's selected aesthetics

Rotation input:
- global user pin count across all products

Rule:
- `globalPinCount % selectedAesthetics.length`

Important:
- this was changed from per-product rotation to global rotation
- this prevents everything from defaulting to the first selected aesthetic

Current aesthetic behavior:
- aesthetics control mood, lighting, color palette, and shadow style
- aesthetics do not control product pose
- aesthetics do not choose props
- aesthetics do not recolor the product

---

### 7. Art Director Prompt Generation

**File:** `trigger/generate-pin-batch.ts`

This is the third AI stage.

Model:
- Gemini 2.5 Flash multimodal

Inputs:
- product image
- `showcase.productAppearance`
- `showcase.presentationMode`
- `showcase.heroAction`
- `showcase.cameraAngle`
- `showcase.naturalEnvironment`
- `showcase.suggestedProps`
- scene concept from step 5
- picked aesthetic from step 6

Purpose:
- write the final fal.ai image editing prompt
- generate overlay title
- choose template id

Output JSON:
- `imagePrompt`
- `title`
- `templateId`

Hard rules in this stage:
- preserve the product's original colors, materials, and design
- use only the props listed in showcase
- apply the aesthetic only to the environment
- do not add extra objects

If Gemini parsing fails:
- `imagePrompt` falls back to `Aesthetic lifestyle shot of {product.title}, photorealistic 8k`
- title falls back to `product.title`
- template falls back to `template-5`

---

### 8. AI Image Generation And Raw Save

**File:** `trigger/generate-pin-batch.ts`

Model:
- `fal-ai/flux-2/flash/edit`

Input:
- source product image URL
- art director prompt

Current params:
- `guidance_scale: 3.5`
- `width: 1000`
- `height: 1500`
- `num_images: 1`
- `output_format: png`

Flow:
1. call fal.ai
2. receive generated image URL
3. insert a `pins` record with `status = 'generating'`
4. download the generated image
5. upload it to R2 as raw image
6. immediately save raw image URL and key back to the `pins` record

Raw file path:
- `pin-images/{userId}/{pinId}-raw.png`

Pin fields saved at this point:
- `art_director_prompt`
- `target_angle`
- `angle_embedding`
- `template_id`
- `pin_title`
- `status = generating`
- `generated_image_url`
- `generated_image_r2_key`

Why raw image is saved before render:
- if render fails later, the generated image is still preserved for inspection/debugging

---

### 9. SEO Copy Generation

**File:** `trigger/generate-pin-batch.ts`

Model:
- Gemini 2.5 Flash

Inputs:
- product title
- product description
- creative angle text

Outputs:
- `seo_title`
- `seo_description`

Rules enforced in prompt:
- title must use searchable product language
- generic filler like `Aesthetic`, `Lifestyle`, `Collection`, `Home Decor Finds` is banned
- description must include natural long-tail keyword phrases
- description ends with a CTA
- no hashtags

Saved before render:
- `pins.pin_title`
- `pins.pin_description`

If parsing fails:
- title falls back to the art director title
- description falls back to `Discover {product.title}`

---

### 10. Final Render With Text Overlay

**File:** `app/api/render-pin/route.tsx`

Runtime:
- `nodejs`

Why Node.js runtime is used:
- bundled local font files made the edge bundle too large
- Node.js runtime avoids the edge size limit problem

What this route does:
- validates the raw image URL
- only allows `https`, `*.r2.dev`, and the configured `R2_PUBLIC_DOMAIN`
- fetches the raw generated image
- validates content type and size
- applies one of the text overlay templates
- adds CTA badge with store domain if available
- returns final `1000x1500` image

Font source:
- local bundled font files loaded with `readFile`

Templates:
- `template-1` top gradient text
- `template-2` centered dark overlay text
- `template-3` bottom gradient text
- `template-4` framed top text
- `template-5` pure image, no overlay text

Template override rule:
- if `layoutMode === 'organic'`, renderer forces `template-5`

Final file path:
- `pin-images/{userId}/{pinId}-final.png`

Success DB update:
- `pins.rendered_image_url`
- `pins.rendered_image_r2_key`
- `pins.status = 'pending_approval'`

Failure handling:
- if render request fails: mark pin `failed`
- if final image is suspiciously small (`< 10000` bytes): mark pin `failed`

---

## What Happens After Generation

### 11. User Approval

Files:
- `app/api/pins/approve/route.ts`
- `app/api/pins/approve-all/route.ts`
- `app/api/pins/reject/route.ts`

Approve flow:
- `pins.status` changes from `pending_approval` to `queued`
- insert row into `pin_queue`

Reject flow:
- reject reason is stored

---

### 12. Publishing

**File:** `trigger/publish-pins.ts`

Purpose:
- drip publish approved pins to Pinterest with anti-ban timing logic

This happens after generation, not during generation.

---

### 13. Analytics Collection

**File:** `trigger/analytics-collector.ts`

Purpose:
- fetch Pinterest analytics for published pins
- update impressions, saves, and outbound clicks on `pins`

Current state:
- analytics are collected
- analytics are not yet fed back into generation decisions

---

## Current Rotation Rules

### Showcase Rotation

Owned by:
- `pickShowcaseForPin()` in `lib/product-showcase.ts`

Based on:
- per-product pin count

Purpose:
- rotate how the same product is shown over time

---

### Aesthetic Rotation

Owned by:
- `pickAestheticForPin()` in `lib/context-matrix.ts`

Based on:
- global user pin count

Purpose:
- rotate across the user's selected brand aesthetics across all products

---

### Scene Rotation

Owned by:
- `generateUniqueAngle()` in `lib/context-matrix.ts`

Based on:
- pgvector similarity against past angles for the same product

Purpose:
- prevent near-duplicate scene concepts

---

## Main Files

| File | Responsibility |
|------|----------------|
| `trigger/generate-pin-batch.ts` | main orchestrator for automatic pin generation |
| `lib/product-showcase.ts` | product-aware showcase analysis, viable modes, prop selection, showcase rotation |
| `lib/context-matrix.ts` | aesthetic rotation, scene concept generation, semantic dedup |
| `app/api/render-pin/route.tsx` | final text overlay renderer |
| `app/api/pins/approve/route.ts` | approve pending pins |
| `app/api/pins/reject/route.ts` | reject pending pins |
| `trigger/publish-pins.ts` | drip publish approved pins to Pinterest |
| `trigger/analytics-collector.ts` | collect Pinterest analytics |

---

## Main Database Fields Used In Generation

### `products`
- `id`
- `title`
- `description`
- `image_url`
- `image_r2_key`
- `is_active`

### `brand_settings`
- `id`
- `user_id`
- `brand_name`
- `font_choice`
- `store_url`
- `aesthetic_boundaries`
- `automation_paused`
- `audience_profile`
- `pin_layout_mode`

### `pins`
- `id`
- `user_id`
- `product_id`
- `brand_settings_id`
- `status`
- `art_director_prompt`
- `target_angle`
- `angle_embedding`
- `template_id`
- `pin_title`
- `pin_description`
- `generated_image_url`
- `generated_image_r2_key`
- `rendered_image_url`
- `rendered_image_r2_key`
- `pinterest_pin_id`
- `impressions`
- `saves`
- `outbound_clicks`

---

## Important Current Rules

- props are chosen in `product-showcase.ts`, not in later stages
- scene generation is only allowed to add surface, lighting, and atmosphere
- art director is only allowed to use locked props from showcase
- the product's original appearance must be preserved from the source image
- aesthetics style the environment, not the product
- product showcase rotation is per product
- aesthetic rotation is global across the user's account
- render happens in Node.js runtime, not Edge runtime
- Pinterest trends are not used in the current generation flow