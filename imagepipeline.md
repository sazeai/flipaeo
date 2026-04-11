Here's the full pipeline for a single product, step by step:

1. Context Matrix — Scene Concept Generation
File: context-matrix.ts

Gemini 2.5 Flash (text-only, no vision) receives:

Product title + description
Live Pinterest trending keywords
Brand aesthetic constraints (e.g. "minimalist", "cozy")
Audience profile demographics
All past angles for this product (avoidance list)
It picks from 8 creative directions (lifestyle moment, ingredient story, flat-lay, etc.) and outputs a vivid scene concept like "Autumn picnic blanket with scattered maple leaves, thermos, and knit scarf in golden hour".

That concept is embedded into a 768-dim vector via gemini-embedding-2-preview, then checked against all past angles for this product using pgvector cosine similarity at 0.75 threshold. If too similar → retry up to 3x with escalating temperature (1.2 → 1.3 → 1.4).

2. Art Director — Scene Prompt Writing
File: generate-pin-batch.ts:213 | Vision model: YES

Gemini 2.5 Flash receives both:

The text prompt with product title + scene concept from step 1
The actual product image (fetched from URL, base64-encoded as inlineData)
Gemini sees the product image and writes an image-editing prompt that describes only the scene/environment around it — surfaces, props, lighting, camera angle, mood. It's explicitly told NOT to describe the product itself (no labels, packaging, colors). It also picks a title and template.

Output: { imagePrompt, title, templateId }

3. Fal.ai Flux-2 Flash Edit — Image Generation
File: generate-pin-batch.ts:266 | Edit model (image-to-image)

fal-ai/flux-2/flash/edit receives:

prompt: The scene-only prompt from step 2
image_urls: The original product image URL (source to preserve)
guidance_scale: 3.5 (slightly above 2.5 default)
Output: 1000×1500 PNG
The edit model uses the source image as its visual anchor and applies the scene prompt around it. Since the prompt doesn't describe the product's appearance, the model preserves the product from image_urls while transforming the background into the described scene.

Output: A styled product-in-scene image URL from fal.ai

4. Save Raw Image to R2
File: generate-pin-batch.ts:295

Downloads the fal.ai output → uploads to R2 as {userId}/{pinId}-raw.png → saves URL to DB immediately. This ensures the raw image is never lost even if the render step fails.

5. SEO Copy Generation
File: generate-pin-batch.ts:308 | No vision

Gemini 2.5 Flash (text-only) generates:

seo_title (max 100 chars, keyword-first)
seo_description (150-300 chars, editorial copy with trend keywords)
Based on product title, scene concept, and trending keywords.

6. Text Overlay Render
File: generate-pin-batch.ts:348 → route.tsx

POSTs to /api/render-pin with the raw R2 image URL + title + template choice + font + store URL.

The edge function uses Satori/ImageResponse to render a 1000×1500 PNG with:

The raw image as full-bleed background
Text overlay based on template (1-4) or no text (template-5)
CTA badge with store URL at bottom
Validates output is >10KB (not blank), then uploads to R2 as {userId}/{pinId}-final.png.

7. DB Update
File: generate-pin-batch.ts:370

Updates the pin record with rendered image URL, SEO title, SEO description, and sets status to pending_approval.

Flow summary:
Scene Concept (text LLM)
    ↓ de-dup check via embeddings
Art Director (vision LLM sees product image)
    ↓ writes scene-only prompt
Flux-2 Edit (image model preserves product, generates scene)
    ↓ save raw to R2
SEO Copy (text LLM)
    ↓
Text Render (Satori edge function overlays title)
    ↓ save final to R2
Pin → pending_approval
Vision is used once — in step 2, where Gemini sees the product photo to understand its visual context before writing the scene prompt. The fal.ai model in step 3 is not a vision LLM but an image-editing diffusion model that uses the product photo as a structural reference.