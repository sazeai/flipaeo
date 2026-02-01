This is the final, production-grade architecture for **Content Plan Deduplication** designed for your specific stack (Supabase, `internal_links`, `articles`) and scaling requirements.

I have addressed your two specific concerns:

1. **Source of Truth:** You are right. We must use `internal_links` for **published** content (what Google sees) AND `articles` for **planned/queued** content (what you are working on). We will combine them into a single "Unified History."
2. **De-Duplication Logic:** I will remove the abstract "clustering" jargon. We will use a concrete **"Semantic Distance Check" (The Vector Bouncer)**. This is a simple database query that asks: *"Is this new idea mathematically too close to anything we have done before?"*

### The Strategy: "The Bouncer" (Post-Generation Filtering)

We cannot rely on the LLM alone to avoid duplicates (it hallucinates). We let the LLM generate ideas, and then we use your database to "block" the ones that are too similar to existing content.

---

### Step 1: Database Setup (The "Vector Check" Function)

You need a function in Supabase that can check a *new* keyword against *both* your tables (`internal_links` and `articles`) simultaneously.

Run this SQL in your Supabase SQL Editor. This creates the "Bouncer" logic inside your database.

```sql
-- Function to check for semantic duplicates across BOTH tables
create or replace function check_content_duplication(
  check_embedding vector(1536), 
  match_threshold float, 
  brand_uuid uuid
)
returns table (
  source_type text,
  existing_title text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  -- 1. Check Published Content (Internal Links - The "Live" stuff)
  select 
    'published' as source_type,
    title as existing_title,
    1 - (embedding <=> check_embedding) as similarity
  from internal_links
  where brand_id = brand_uuid
  and 1 - (embedding <=> check_embedding) > match_threshold
  
  UNION ALL
  
  -- 2. Check Planned/Draft Content (Articles - The "In Progress" stuff)
  select 
    'planned' as source_type,
    keyword as existing_title,
    1 - (topic_embedding <=> check_embedding) as similarity
  from articles
  where brand_id = brand_uuid
  and topic_embedding is not null
  and 1 - (topic_embedding <=> check_embedding) > match_threshold
  
  -- Return the single closest match
  order by similarity desc
  limit 1;
end;
$$;

```

**Why this solves your concern:**

* It checks `internal_links` (Sitemap data) so we don't duplicate live articles.


* It checks `articles` (Planned data) so we don't duplicate what you planned last month but haven't published yet.



---

### Step 2: The "Bouncer" Logic (Code Implementation)

Now we modify your `generatePlanTask` in `generate-plan.ts`. We will inject a verification step *after* the plan is generated but *before* it is saved.

**The Workflow:**

1. **Generate:** LLM gives us 30 items.
2. **Filter:** We loop through them and run `check_content_duplication`.
3. **Refine:** If 5 items are rejected, we ask the LLM to "Replace these 5 specific items."

**The Code Implementation:**

```typescript
import { generateEmbedding } from "@/lib/internal-linking" // You already have this

// 1. The Bouncer Function
async function filterDuplicates(planItems: any[], brandId: string, supabase: any) {
    const verifiedPlan = [];
    const rejectedItems = [];

    for (const item of planItems) {
        // Generate vector for the NEW plan item's main keyword
        const embedding = await generateEmbedding(item.main_keyword);
        
        // Call the SQL function we created above
        // Threshold 0.88 = Highly similar (Semantic Duplicate)
        const { data: duplicates, error } = await supabase.rpc('check_content_duplication', {
            check_embedding: embedding,
            match_threshold: 0.88, 
            brand_uuid: brandId
        });

        if (duplicates && duplicates.length > 0) {
            // DUPLICATE FOUND!
            console.log(`❌ Rejected "${item.main_keyword}" - Too similar to existing: "${duplicates[0].existing_title}" (${duplicates[0].source_type})`);
            rejectedItems.push({
                rejected_keyword: item.main_keyword,
                reason: `Too similar to existing content: "${duplicates[0].existing_title}"`
            });
        } else {
            // UNIQUE - Keep it
            verifiedPlan.push(item);
        }
    }

    return { verifiedPlan, rejectedItems };
}

// 2. Integration into your 'generatePlanTask'
// ... inside your task run function ...

// === PHASE 2: STRATEGIC PLAN GENERATION ===
let planResult = await generateStrategicPlan({ ... }); // Initial Generation

// === PHASE 3: THE BOUNCER (DEDUPLICATION) ===
console.log(`[Bouncer] Checking ${planResult.plan.length} items for duplicates...`);

let { verifiedPlan, rejectedItems } = await filterDuplicates(planResult.plan, brandId, supabase);

// === PHASE 4: THE REPLACEMENT LOOP (If duplicates found) ===
if (rejectedItems.length > 0) {
    console.log(`[Bouncer] Found ${rejectedItems.length} duplicates. Requesting replacements...`);
    
    // Ask LLM to generate replacement items ONLY for the rejected ones
    // We pass the "Reason" so the LLM knows WHY it was rejected (e.g., "Don't suggest 'AI Work' again")
    const replacementPlan = await generateReplacements({
        originalContext: brandData,
        rejectedItems: rejectedItems, // e.g. [{ keyword: "AI in Work", reason: "Similar to 'AI Changing Work'" }]
        count: rejectedItems.length
    });
    
    // Verify the *replacements* too (Safety Check)
    const secondaryCheck = await filterDuplicates(replacementPlan, brandId, supabase);
    
    // Add the safe replacements to our final list
    verifiedPlan = [...verifiedPlan, ...secondaryCheck.verifiedPlan];
}

// Save the CLEAN plan
await supabase.from("content_plans").update({
    plan_data: verifiedPlan,
    // ...
})

```

---

### Step 3: Explanation of the JSON Logic

You shared this plan item:

```json
{
  "main_keyword": "how ai is changing the way we work",
  "cluster": "AI Fundamentals",
  "user_intent": "Informational"
}

```

**Scenario: How the Bouncer Handles This**

1. **Existing Article:** Suppose `internal_links` has a URL: `flipaeo.com/blog/ai-future-workforce` with the title **"The Future of AI in the Workforce"**.
2. **The Check:**
* The LLM generates your item: "how ai is changing the way we work".
* Your code generates the **Embedding** (Vector) for this phrase.
* The Database compares this Vector to "The Future of AI in the Workforce" Vector.


3. **The Result:** The semantic similarity score comes back as **0.92** (Very High).
4. **The Action:**
* The Bouncer **REJECTS** "how ai is changing the way we work".
* The Bouncer tells the LLM: *"Rejected 'how ai is changing the way we work' because it is too close to 'The Future of AI in the Workforce'. Give me a DIFFERENT topic in the 'AI Fundamentals' cluster."*
* The LLM suggests: **"The History of Neural Networks"** (Score 0.40 - Safe).



### Summary Checklist for Scaling

1. **Run the SQL:** Add `check_content_duplication` to your database.
2. **Add the Loop:** Insert the `filterDuplicates` function into your `generate-plan.ts` file right after the `generateStrategicPlan` call.
3. **Relax:** You now have a system that checks **Published** (Live) AND **Planned** (Draft) content automatically. It scales to 10,000 articles because vector search is instant.