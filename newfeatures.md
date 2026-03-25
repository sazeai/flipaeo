# PinLoop AI — New Features & Strategic Pivots

> Extracted from the co-founder discussion in `PRDUPDATE.md`. Each item is a concrete feature or architectural change that needs implementation.

---

## 🔄 Strategic Pivot: "Supervised Autonomy"

The core product shifts from **100% autonomous publishing** to a **"Silver Platter" model** — the AI does 99% of the work, but the user retains final approval before anything goes live.

### Feature 1: Pin Approval Inbox ("Tinder for Pins")

Instead of auto-publishing to Pinterest, generated pins land in a **Pending Approval** queue.

- Weekly email notification: _"PinLoop has generated 20 new pins for next week. Click here to approve."_
- Clean grid UI of finished pins — **no editor, no drag-and-drop**
- Each pin has: ✅ **Approve** / ❌ **Reject** — that's it
- Bulk actions: "Approve All" / "Send to Queue"
- **Target UX: 45 seconds per week** for the user

### Feature 2: Rejection Feedback Loop (AI Training from Human Preference)

When a user rejects a pin, prompt a **single multiple-choice question:**

> _Why?_ → `Bad Image` | `Bad Text` | `Wrong Vibe`

- Log the rejection reason against the `aesthetic_tag`, `template_id`, and `target_keyword`
- Feed this into the prompt weight engine alongside Pinterest click analytics
- The AI learns from **human taste**, not just performance metrics
- This is the moat — competitors like BlogToPin/Tailwind can never replicate personalized aesthetic learning

### Feature 3: Trust Ladder → Full Autopilot Toggle

Progressive trust escalation over time:

| Phase | Duration | Behavior |
|---|---|---|
| **Supervised** | Month 1-2 | All pins require manual approval |
| **Autopilot Unlock** | Month 3+ | Show toggle: _"You've approved 98/100 pins. Enable Full Autopilot?"_ |
| **Autopilot Active** | Ongoing | Auto-publish pins above 95% confidence threshold |

- The toggle lives in Settings
- Can be reverted at any time
- Autopilot still logs everything for the user to review retroactively

---

## 📦 Content Volume: The Context Matrix

**Problem:** A store with 10 products ≠ 10 pins. That's not worth $99/mo.

**Solution:** 1 product × 10 unique lifestyle angles = 10 pins per product.

### Feature 4: Context Matrix Generator

For each product, the AI generates pins across a **matrix of:**
- **Aesthetics** (Minimalist, Dark Academia, Scandi, Cottagecore, Streetwear...)
- **Seasons** (Spring Collection, Holiday Gift Guide, Back to School...)
- **Long-tail keywords** (from Pinterest Trends API — see Feature 8)

Example for "Black Leather Tote Bag":
1. "Minimalist Work Bag" — Office Aesthetic
2. "Fall Fashion Accessories" — Autumn Streetwear
3. "Travel Tote for Women" — Airport Lounge
4. "Gift for Her" — Holiday Gift-Wrapped

### Feature 5: Programmatic De-Duplication

Prevent the AI from generating identical pins across weeks.

- **Database state tracking:** Every generated pin logs `sku_id` + `aesthetic_tag` + `template_id` + `target_keyword`
- **Exclusion injection:** Before generating, query previous pins for that SKU and inject into the prompt:
  > _"Do NOT use these aesthetics: [Scandi, Dark Academia]. Do NOT target these keywords: [Minimalist Desk]. Choose a completely new visual environment."_
- Guarantees **programmatic uniqueness** without relying on AI memory

---

## 💰 Billing & Economics

### Feature 6: Fair Use Rejection Cap

**Don't** deduct rejected pins from the user's 100-pin quota.

- COGS per pin: ~$0.05 (fal.ai ~$0.03 + LLM ~$0.001 + Satori $0.00)
- 100 pins = $5.00 base cost → **96% gross margin** at $99/mo
- Set a **150-generation hard cap** per billing cycle (100 published + 50 redraws)
- If cap is hit: pause generation and prompt user to update Brand Settings (AI is misaligned)
- Maximum loss per user per month: ~$7.50

### Feature 7: Asset Vault Billing Model

Charge for **"Assets Generated"** not **"Assets Published."**

- Month 1 (warmup): AI generates the full 100 pins, but only publishes ~30 (1/day drip)
- Remaining 70 go into a **Scheduled Vault** for Months 2-3
- Transparent onboarding copy: _"To protect your account from Pinterest spam filters, Month 1 publishing is throttled to 1 pin/day. Your AI will still generate your full quota of 100 pins."_
- The value was created — the photoshoots were "done"

---

## 🔍 Pinterest API Deep Integration

### Feature 8: Autonomous Trends Engine (Pinterest Trends API)

**The biggest upgrade.** Replace blind aesthetic guessing with **real search demand data.**

- When a product is queued for generation, first call **`/v5/trends/keywords`** with the product entity
- Filter results by volume index (>50) and trajectory (trending up)
- Take top 3 trending keywords → inject into the Art Director prompt:
  > _"The current high-volume Pinterest search trends are: [indoor plant aesthetic, spring gardening, pink decor]. Choose ONE and design around it."_
- **Result:** Pins are engineered to intercept documented, high-volume searches happening that week

### Feature 9: Rich Product Pins (Catalogs API)

Standard image pins just show a picture + link. **Product Pins** show real-time price, stock, and a native "Shop" button.

- Use **`/v5/catalogs`** API to ingest the user's Shopify XML product feed into Pinterest
- When publishing a lifestyle pin, bind it to the catalog `Item ID`
- Result: Beautiful AI lifestyle image + hard-coded conversion metadata of a native Product Pin
- Significantly higher conversion rate than standard pins

### Feature 10: Audience Insights (Demographic Shifting)

Automatically adjust aesthetic generation based on who actually engages with the account.

- Monthly ping to **`/v5/audience_insights`** API
- Read demographic breakdown (age, gender, interests)
- If 80% of engaged audience is Gen-Z → permanently penalize "Corporate/Millennial" aesthetics, prioritize "Streetwear/Lo-Fi"
- Stored as a user-level generation profile that evolves over time

### Feature 11: Programmatic Board Optimization

Pinterest SEO relies heavily on board titles. Dumping 100 pins into one "My Products" board kills SEO.

- Use **`/v5/boards`** API to check if a keyword-optimized board exists
- If not → **auto-create** a new board (e.g., "Indoor Plant Aesthetic Ideas") with SEO description
- Assign each pin to the most relevant board based on its target keyword
- Already partially built in the drip publisher — needs enhancement with Trends API keywords

---

## 📝 Landing Page Messaging Update

### Feature 12: "Executive Control" Positioning

| Old Pitch | New Pitch |
|---|---|
| _"Close your laptop. The AI does everything."_ | _"We do 99% of the grunt work. You retain 100% of the creative control."_ |

Updated landing page copy direction:
> _"PinLoop AI is your tireless Art Director. We generate the lifestyle photos, write the SEO copy, and format the editorial layouts. Every Monday, we hand you a silver platter of perfect, ready-to-publish pins. You just click 'Approve' and get back to running your business."_

---

## Implementation Priority (Suggested)

| Priority | Feature | Impact | Effort |
|---|---|---|---|
| 🔴 P0 | Pin Approval Inbox (#1) | Unblocks user trust — required for sales | High |
| 🔴 P0 | Rejection Feedback Loop (#2) | Core moat — trains AI on taste | Medium |
| 🟠 P1 | Context Matrix Generator (#4) | Solves "10 products" objection | Medium |
| 🟠 P1 | De-Duplication System (#5) | Prevents repeat content | Medium |
| 🟠 P1 | Autonomous Trends Engine (#8) | Biggest quality leap — data-driven pins | High |
| 🟡 P2 | Trust Ladder / Autopilot (#3) | Retention — Month 3+ feature | Low |
| 🟡 P2 | Fair Use Cap (#6) | Billing guardrail | Low |
| 🟡 P2 | Asset Vault Model (#7) | Warmup billing logic | Low |
| 🟢 P3 | Rich Product Pins (#9) | Conversion boost | Medium |
| 🟢 P3 | Audience Insights (#10) | Personalization — Month 2+ | Medium |
| 🟢 P3 | Board Optimization (#11) | SEO boost — partially built | Low |
| 🟢 P3 | Landing Page Update (#12) | Messaging alignment | Low |
