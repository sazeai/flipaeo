# Pin Generation Pipeline — Architecture Reference

> Last updated: April 11, 2026

## Overview

PinLoop generates Pinterest pins automatically through a 9-step pipeline. This document covers every step, every file, and how Pinterest data feeds back into generation.

---

## Pipeline Steps

### Step 1: Batch Scheduler

**File:** `trigger/generate-pin-batch.ts`  
**Schedule:** Cron (`*/5 * * * *`) — processes 1 product per run  

**Quotas enforced before generation starts:**
- 150 pins/month hard cap per user
- 100-pin monthly quota distributed evenly across products
- Max 10 pending-approval pins per product (prevents backlog)

**Product selection:** Products sorted by `last_generated_at` (oldest first), so every product gets rotated through fairly.

---

### Step 2: Semantic Angle Generation (Context Matrix)

**File:** `lib/context-matrix.ts`

Generates a unique "Scene Concept" for each pin — the creative direction that makes every pin for the same product visually distinct.

**How it works:**
1. Gemini generates a lifestyle scene concept incorporating the product, brand aesthetic boundaries, and audience profile
2. The concept is embedded into a 768-dimension vector using `gemini-embedding-2-preview`
3. The vector is compared against all past angles for this product using pgvector cosine similarity
4. If similarity > 0.75 with any past angle, it's rejected and regenerated (up to 3 retries with increasing temperature)
5. Both the angle text and embedding are stored on the `pins` record for future dedup

**Example output:** `"Autumn picnic blanket with scattered maple leaves, thermos, and knit scarf in golden hour"`

**DB fields:** `pins.target_angle` (text), `pins.angle_embedding` (vector(768))

---

### Step 4: Art Director (Image Concept Plan)

**File:** `trigger/generate-pin-batch.ts` (lines ~214-270)  
**Model:** Gemini 2.5 Flash (multimodal — sees the actual product image)

The Art Director receives:
- The product image (base64)
- The product title
- The scene concept from Step 3

It generates:
| Output | Purpose |
|--------|---------|
| `imagePrompt` | Scene description for fal.ai (environment, lighting, props — NOT the product itself) |
| `title` | 3-7 word overlay text for the pin image (magazine headline style) |
| `templateId` | Which text layout template to use (template-1 through template-5) |

**Key rule:** The Art Director must NOT describe the product (labels, colors, packaging). The source image handles that — the AI only designs the world around it.

---

### Step 5: AI Image Generation

**File:** `trigger/generate-pin-batch.ts` (lines ~275-315)  
**Model:** `fal-ai/flux-2/flash/edit`  
**Parameters:** `guidance_scale: 3.5`, output size `1000x1500`

Takes the product image + Art Director's scene prompt → generates a lifestyle photograph with the product placed in the scene. The product itself is preserved from the source image.

**Output:** PNG uploaded to R2 at `pin-images/{userId}/{pinId}-raw.png`  
**Validation:** Generated image must be >10KB (rejects blank/failed images)

---

### Step 6: SEO Copy Generation (Title + Description)

**File:** `trigger/generate-pin-batch.ts` (lines ~326-370)  
**Model:** Gemini 2.5 Flash, temperature 0.6

This is where the pin's **searchable title** and **description** are generated — the primary metadata that Pinterest's algorithm indexes.

**Inputs:**
- Product name and description
- Creative angle from Step 3
- Live Pinterest trends (if available)

**Pinterest SEO principles enforced in the prompt:**
- Pinterest extracts "annotations" (1-6 word keyword phrases) from titles/descriptions and scores relevance
- Titles must contain specific, searchable terms that real users type into Pinterest search
- Generic filler words ("Aesthetic", "Lifestyle", "Home Decor Finds", "Essential", "Collection") are explicitly banned
- Descriptions must include 2-3 long-tail keyword phrases + a call-to-action

**Limits:** Title max 100 chars, description max 500 chars

**Fallback:** If Gemini's response can't be parsed, falls back to the Art Director's overlay title (Step 4).

---

### Step 7: Text Overlay Rendering

**File:** `app/api/render-pin/route.tsx`  
**Runtime:** Vercel Edge (uses `ImageResponse` / Satori — no Sharp dependency)

Composites the overlay title text onto the generated image using one of 5 templates:

| Template | Layout |
|----------|--------|
| template-1 | Top gradient + white text |
| template-2 | Center overlay (dark background) |
| template-3 | Bottom gradient + bottom text |
| template-4 | White border frame + top text |
| template-5 | Pure aesthetic (no text overlay) |

Also adds a CTA badge at the bottom with the store domain + arrow icon.

**Output:** Final rendered image uploaded to R2 at `pin-images/{userId}/{pinId}-rendered.png`  
**DB update:** `pins.rendered_image_url`, `pins.status = 'pending_approval'`

---

### Step 8: User Approval → Queue

**Files:**
- `app/api/pins/approve/route.ts` — Approve individual pins
- `app/api/pins/approve-all/route.ts` — Bulk approve all pending pins
- `app/api/pins/reject/route.ts` — Reject with reason

**Approve flow:**
1. Pin status changes: `pending_approval` → `queued`
2. A record is inserted into `pin_queue` table with `status: 'pending'`
3. Optionally assigns a Pinterest board via `boardMap`

**Reject reasons:** `bad_image`, `bad_text`, `wrong_vibe`

---

### Step 9: Drip Publisher (Anti-Ban)

**File:** `trigger/publish-pins.ts`  
**Schedule:** Every 6 hours

Uses a "Human Entropy" algorithm to mimic natural posting patterns and avoid Pinterest shadow bans:

- **Warmup matrices:** 7-day rotating patterns for accounts aged 0-30 days (starts slow, ramps up)
- **Power matrices:** 4 rotation patterns for established accounts
- **Daily target** calculated from: account age + day of week + rotation position
- **Intra-day jitter:** Divides 24 hours into chunks, only publishes when the current hour falls within the right window
- **Domain velocity cap:** No two product URLs published within 4 hours
- **API jitter:** 0-45 minute random delay before each Pinterest API call

**Publishing:**
1. Calls Pinterest API `POST /v5/pins` with: image URL, title, description, link, board
2. Updates `pins.pinterest_pin_id`, `pins.published_at`, `pins.status = 'published'`
3. Updates `pin_queue.status = 'published'`

---

### Step 10: Analytics Collection (Feedback Loop)

**File:** `trigger/analytics-collector.ts`  
**Schedule:** Daily at 3:30 AM UTC

For every published pin, fetches 30-day analytics from Pinterest:
- **API:** `GET /v5/pins/{pinId}/analytics?metric_types=IMPRESSION,SAVE,OUTBOUND_CLICK`
- **Updates:** `pins.impressions`, `pins.saves`, `pins.outbound_clicks`

**Current state:** Analytics are collected and displayed in the UI but are NOT yet fed back into the generation algorithm. This is a one-way integration.

**Future opportunity:** Use analytics data to:
- Weight trending keywords that correlate with high-performing pins
- A/B test scene concepts (which angles get more saves?)
- Auto-adjust template selection based on CTR data
- Prioritize products whose pins perform best

---

## Database Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `pins` | Full pin lifecycle | `status`, `pin_title`, `pin_description`, `target_angle`, `angle_embedding` (vector 768), `generated_image_url`, `rendered_image_url`, `pinterest_pin_id`, `impressions`, `saves`, `outbound_clicks` |
| `pin_queue` | Publishing queue | `pin_id`, `status` (pending/published/cancelled), `priority` |
| `products` | Product catalog | `title`, `description`, `image_url`, `image_r2_key`, `is_active`, `product_url` |
| `brand_settings` | User brand config | `aesthetic_boundaries`, `audience_profile`, `pin_layout_mode`, `default_board_id` |
| `pinterest_connections` | OAuth tokens | `access_token`, `refresh_token`, `warmup_phase`, `account_age_days` |
| `account_health_log` | Shadow ban tracking | `pins_today`, `shadow_ban_risk`, `warmup_phase` |

---

## Data Flow Diagram

```
[Cron: generate-pin-batch]
  │
  ├─ generateUniqueAngle() ──→ targetAngle + embedding
  │   └─ uses: product, aesthetic_boundaries, audience_profile
  │   └─ dedup: pgvector cosine similarity vs past angles
  │
  ├─ Gemini Art Director ──→ imagePrompt, overlayTitle, templateId
  │   └─ input: product image + targetAngle
  │
  ├─ fal.ai flux-2/flash/edit ──→ raw lifestyle image → R2
  │   └─ input: product image + imagePrompt
  │
  ├─ Gemini SEO Copy ──→ pin_title, pin_description
  │   └─ input: product name/desc + targetAngle
  │
  └─ POST /api/render-pin ──→ rendered image with text overlay → R2
      └─ status: pending_approval

[User Action: Approve/Reject]
  │
  └─ Approve → pins.status = 'queued' + pin_queue INSERT

[Cron: publish-pins]
  │
  ├─ Entropy matrix → daily target calculation
  ├─ Domain velocity check
  ├─ Anti-ban jitter delay
  └─ Pinterest API POST /v5/pins → pins.status = 'published'

[Cron: analytics-collector — daily 3:30 AM UTC]
  │
  └─ Pinterest API GET /v5/pins/{id}/analytics
      └─ updates: impressions, saves, outbound_clicks
```

---

## Removed: Pinterest Trends API Integration

The Pinterest Trends API (`/v5/trends/keywords/US/top/growing`) was previously used to fetch platform-wide trending search terms and inject them into pin generation. **This was removed** because:

1. **Irrelevant data:** The API returns global trending topics across ALL of Pinterest (e.g. "wedding hairstyles", "keto recipes"). For an ecom product like peanut butter or face serum, these random trends added noise, not signal.
2. **Actively harmful:** Injecting unrelated trending keywords into titles/descriptions hurts Pinterest's topic relevance scoring — the algorithm expects pin metadata to match the pin's actual content.
3. **Gemini already knows search behavior:** The LLM understands what people search for when looking for specific products. It doesn't need a trends API to know "protein snacks for gym" is a real search term for peanut butter. Product-specific keyword generation comes from understanding the product itself.

The `getTrendingKeywords()` function still exists in `lib/pinterest-api.ts` (dead code) in case a future niche-filtered implementation makes sense.

**Future consideration:** Pinterest's API may eventually support category-filtered trends (e.g. "trending in Food & Drink"). If that happens, re-integrating trends scoped to the user's product niche could add value. Until then, Gemini's product-aware keyword generation is the better approach.

---

## Key Files Quick Reference

| File | What It Does |
|------|-------------|
| `trigger/generate-pin-batch.ts` | Main orchestrator — runs all generation steps |
| `lib/context-matrix.ts` | Semantic angle generation + vector dedup |
| `app/api/render-pin/route.tsx` | Edge function for text overlay rendering |
| `app/api/generate-pin/route.ts` | Manual/API pin generation (used by UI) |
| `app/api/pins/approve/route.ts` | Approve pins → queue |
| `app/api/pins/reject/route.ts` | Reject pins with reason |
| `trigger/publish-pins.ts` | Drip publisher with anti-ban entropy |
| `trigger/analytics-collector.ts` | Daily Pinterest analytics sync |
| `lib/pinterest-api.ts` | Pinterest API wrapper (trends, boards, analytics, create pin) |
| `lib/r2.ts` | Cloudflare R2 storage (upload/download images) |
