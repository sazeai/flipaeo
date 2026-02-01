import { task } from "@trigger.dev/sdk/v3"
import { tavily } from "@tavily/core"
import { createAdminClient } from "@/utils/supabase/admin"
import { getGeminiClient } from "@/utils/gemini/geminiClient"
import { CompetitorDataSchema } from "@/lib/schemas/research"
import { ArticleOutlineSchema } from "@/lib/schemas/outline"
import { BrandDetailsSchema } from "@/lib/schemas/brand"
import { marked } from "marked"
import { generateImage } from "@/lib/fal"
import { putR2Object } from "@/lib/r2"
import { randomUUID } from "crypto"
import { jsonrepair } from "jsonrepair"
import { ArticleType } from "@/lib/prompts/article-types"
import { getArticleStrategy } from "@/lib/prompts/strategies"
import { getCurrentDateContext } from "@/lib/utils/date-context"
import { getRelevantInternalLinks } from "@/lib/internal-linking"
import { saveTopicMemory } from "@/lib/topic-memory"
import { analyzeArticleCoverage } from "@/lib/coverage/analyzer"
import { ArticleReadyEmail } from "@/lib/emails/templates/article-ready"
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/emails/client"
import { render } from "@react-email/components"

const cleanAndParse = (text: string) => {
  const clean = text.replace(/```json/g, "").replace(/```/g, "")
  try {
    return JSON.parse(clean)
  } catch (e) {
    try {
      return JSON.parse(jsonrepair(clean))
    } catch (e2) {
      console.error("JSON Parse Failed. Original:", text, "Error:", e2)
      throw new Error("Failed to parse JSON from LLM response")
    }
  }
}

// Self-correcting JSON parser with Zod validation retry
const cleanParseAndValidate = async <T>(
  text: string,
  schema: { parse: (data: unknown) => T },
  genAI: any,
  maxRetries: number = 2
): Promise<T> => {
  const parsed = cleanAndParse(text)

  try {
    return schema.parse(parsed)
  } catch (zodError: any) {
    if (maxRetries <= 0) {
      console.error("Zod validation failed after retries:", zodError)
      throw zodError
    }

    console.log(`[Self-Correction] Zod validation failed, asking Gemini to fix. Retries left: ${maxRetries}`)

    // Feed the error and invalid JSON back to Gemini to fix
    const fixPrompt = `
The following JSON failed Zod schema validation:

=== INVALID JSON ===
${JSON.stringify(parsed, null, 2)}

=== VALIDATION ERROR ===
${zodError.message || JSON.stringify(zodError.errors || zodError)}

=== YOUR TASK ===
Fix the JSON to match the required schema. Return ONLY the corrected JSON, no explanations.
Make sure all required fields are present and have the correct types.
`

    const fixResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      config: { responseMimeType: "application/json" },
      contents: [{ role: "user", parts: [{ text: fixPrompt }] }]
    })

    const fixedText = fixResponse.text || ""
    console.log(`[Self-Correction] Gemini returned fixed JSON, attempting to parse...`)

    // Recursively try to parse and validate the fixed JSON
    return cleanParseAndValidate(fixedText, schema, genAI, maxRetries - 1)
  }
}


// Clients will be initialized inside the task


// --- Prompts & Rules from Blueprint ---

const AUTHENTIC_WRITING_RULES = `
### 1. CRITICAL: NEGATIVE CONSTRAINTS (THE "ANTI-AI" FILTER)
*Violation of these rules results in immediate failure.*

- **VOCABULARY BLACKLIST:** These are the words that sounds ai fluff when you use them every start of a paragraph. we have to get rid of them and use natural talk. 
  - **Verbs:** Unleash, Unlock, Elevate, Harness, Empower, Revolutionize, Navigate, Foster, Delve, Dive.
  - **Adjectives:** Seamless, Robust, Cutting-edge, Game-changing, Revolutionary, Vital, Crucial, Unparalleled, Tapestry, Realm, Literal/Literally.
- **Correction Protocol:** If you need these words, use simple, punchy words. (e.g., instead of "utilize", use "use"; instead of "facilitate", use "help").
- **BANNED STARTERS (NO FLUFF):** Never start with: "In today's digital landscape", "Let's dive in", "Let's explore", "Let's be honest", "Imagine a world where", "In this comprehensive guide", "It is worth noting."
  - **Rule:** Never start a section with "In this section, we will..." Start immediately with the core insight.
- **LOW PRIORITY TRANSITIONS (THE "AI TIC" LIST):** if you use them again and again... it sounds spammy.. use only when you think this makes sense and will improve redability.
  - "The bigger issue?", "The catch?", "So, what's the fix?" 
  - "It's not just X, it's Y." (Unless you have a specific data point).
  - Make the statement directly. 
    - *Bad:* "The bigger issue? It's about visibility."
    - *Good:* "Crucially, this is a visibility problem." (use single standalone sentence for this)
- **CORPORATE METAPHOR BAN:**
  - **Replace:** "It's like a digital butler." -> **Use:** "It's a 24/7 ping-machine that emails when the server drops."
  - **Rule:** Use visceral, specific, or slightly "gritty" analogies.

### 2. STRUCTURAL ARCHITECTURE (VISUAL PHYSICS)
*These rules ensure the content is scannable and citation-ready. LLM prefers rich data, not heavy walls of text*

- **THE "ANSWER-FIRST" PROTOCOL:** The FIRST sentence under the H2 header must be a direct, standalone answer to the header's premise. (e.g., If H2 is "What is CAC?", Sentence 1 must be "CAC is...").
- **MAXIMUM PARAGRAPH HEIGHT:** No paragraph can exceed 3 lines of text. If it does, hit "Enter" and split it.
- **BOLDING FREQUENCY (MANDATORY):** You MUST bold at least **one key phrase per section** using **double asterisks**. Bold: statistics (e.g., **47% faster**), key terms (e.g., **token limits**), or warnings (e.g., **do not skip this step**). Never bold an entire sentence, never bold a link.

### 4. ENTITY SALIENCE (SUBJECT-FIRST SYNTAX)
- **ACTIVE VOICE ONLY:** The Target Entity must be the **Grammatical Subject**.
  - *Bad:* "Efficiency is improved by [Tool]..."
  - *Good:* "**[Tool]** improves efficiency by..."
- **LEXICAL DENSITY:** Minimize "Function Words". Maximize "Content Words" (Nouns, Verbs, Numbers).

### 5. CITATION AUTHORITY (PERPLEXITY REDUCTION)
- **"ACCORDING TO" SYNTAX:** Explicitly name sources. "According to the **2025 State of AI Report**..."
- **Constraint:** Do NOT cite competitors. Cite Neutral Super-Authorities.

### 6. RHYTHM & VOICE (THE HUMAN PULSE)
*These rules break the "robotic" cadence of AI generation. so follow them at all cost.*
- **SENTENCE VARIANCE (THE MIX):**
  - **Constraint:** Do not write three sentences of the same length in a row.
  - **The Pattern:** Mix "Staccato" (3-5 words) with "Flow" (15+ words).
- **NATURAL DIGRESSIONS:** Include brief asides in parentheses. "(This implies you have access to the API key, which isn't always given.)"
- **BURSTINESS (Paragraph VARIANCE):**
  - **Constraint:** You generally write long paragraphs. Stop it.
  - **The Mix:** For every "complex" paragraph 3-4+ lines, you must write a "fragment" sentence.
- **NON-STANDARD SYNTAX:** Occasionally start a sentence with "And," "But," or "Because" to create a conversational, expert-to-expert tone.

### 7. SUBSTANCE & AUTHORITY (THE "INFORMATION GAIN" SIGNAL)
*These rules ensure the content ranks in AI Search (AEO).*

- **ENTITY DENSITY:** Prioritize specific Named Entities over general nouns.
- *Bad:* "Use a fast Javascript framework." -> *Good:* "Use **Next.js 14** or **Astro**."
- **DEFINITION OWNERSHIP:** When defining a term, use this syntax: *"[Term] is [Definition] that helps [Audience] achieve [Outcome]."*
- **ADMIT LIMITATIONS (THE "HARD TRUTH"):** while referencing competitors and user's own brands, always mention the limitations of the tool. 
- *Example:* "This doesn't work for Google SGE yet, but it’s a beast for Perplexity." "i.e. this x tool is good for this, but we handle this better in this 'xyz' manner." (This builds massive E-E-A-T).


### 8. PERSPECTIVE & ENGAGEMENT
*These rules create trust and drive action.*

- **OWN THE PERSPECTIVE:** - If writing as a Founder, use "I" and "My team."
  - If writing as an Agency, use "We" and "Our clients."
- **SUBJECTIVE OPINION:** Instead of "The tool is effective," use "I found the tool surprisingly snappy during high-traffic tests, but it struggled with [X]."
- **AVOID PASSIVE VOICE:** Never say "It is recommended that..." Say "You should..." or "I recommend...".
- **THE "NEXT STEP" CLOSING:** AI summarizes. Humans give orders. Don't summarize; tell the reader exactly what to do next.
**Note** If you fail to follow the 'Answer-First' or 'Vocabulary Blacklist' rules, the output is considered a failure.
`

// Type-specific intro templates (V3: The "Golden HTML Stack" Edition)
const INTRO_TEMPLATES: Record<string, string> = {
  informational: `
GOAL: Write a "High-Impact Definition Stack" opening.

**MANDATORY STRUCTURE (THE GOLDEN ORDER):**

1. **The Bridge Answer (Paragraph 1 - THE BOT LAYER):**
   - **Constraint:** The VERY FIRST sentence must be the direct definition of the main [Topic/Keyword].
   - **Syntax:** "[Topic] is [Definition] that [Function/Outcome]."
   - **Length:** 40-60 words (Dense).
   - **Style:** Objective, technical, zero-fluff.
   - *Example:* "AEO (Answer Engine Optimization) is the strategic process of formatting web content for LLM retrieval. Unlike SEO, it prioritizes structured data and citation over ranking."

2. **The Attribute List (The SGE Box - THE SCAN LAYER):**
   - Immediately follow the definition with a bulleted list of **Key Characteristics**.
   - **Header:** "**Key Characteristics:**" or "**Core Components:**"
   - **Content:** 3-4 atomic facts or specs that define the entity. (e.g., "Primary Goal," "Key Technology," "Target Audience").

3. **The Contextual Hook (Paragraph 2 - THE HUMAN LAYER):**
   - NOW, use a "Dynamic Style" to hook the reader's curiosity.
   - **Pick ONE Style:**
     - *The Data Anomaly:* "We analyzed server logs and found that **42% of pages** were ignored..."
     - *The Boring Technical:* "Most configurations fail due to a single checkbox in the **.env file**..."
     - *The Direct Reality:* "People often ask if this matters. The answer depends on your **crawling budget**."

4. **The Value Promise (The Thesis):**
   - End the intro with a specific outcome.
   - **Syntax:** "By the end of this guide, you will [Action] using [Method], without [Common Pain Point]."

**SCANNABILITY & BOLDING RULES:**
- **Visual Speed Bumps:** Bold ONLY specific **numbers**, **proper nouns**, or **contrasting states**.
  - Bad: **This tool helps you save time.** (Full sentence bolding = Amateur)
  - Good: This tool reduces latency by **40%** using **Vector Caching**.
- **Paragraph Limit:** No paragraph can exceed **3 lines of text**.

**NEGATIVE CONSTRAINTS (THE "ZERO-FLUFF" FILTER):**
- **BANNED PHRASES:** Delete "In this article", "We will explore", "Let's dive in", "It is important to note".
- **BANNED STRUCTURES:** Do not start with "Welcome". Do not start with a Rhetorical Question.
`,

  commercial: `
GOAL: Write a "High-Trust Recommendation Stack" opening.

**MANDATORY STRUCTURE (THE GOLDEN ORDER):**

1. **The Bridge Answer (The Verdict - THE BOT LAYER):**
   - **Constraint:** Immediately state the "Winners" for specific use cases. Do not build suspense.
   - **Syntax:** "The best [Category] for [User A] is **[Product A]**, while **[Product B]** is superior for [User B]."
   - **Length:** 40-60 words (Dense).
   - *Example:* "The best CRM for small agencies is **HubSpot** due to its free tier, while **Salesforce** is required for enterprise scale. For sheer automation speed, **Pipedrive** wins."

2. **The "At A Glance" Table (The SGE Box):**
   - A Markdown table comparing the Top 3 options.
   - **Columns:** Product | Best For | Starting Price.
   - **Constraint:** Keep cell content short (1-3 words).

3. **The Buying Reality (Paragraph 2 - THE HUMAN LAYER):**
   - Use a "Dynamic Style" to prove you actually tested the tools.
   - **Pick ONE Style:**
     - *The Anti-Persona:* "If you have a team of **50+**, do not buy **[Product A]**. You will spend more time managing permissions than selling."
     - *The Budget Realist:* "There is no reason to pay **$200/month** for [Enterprise Tool] if you only need [Basic Feature]."
     - *The Specific Glitch:* "I tried to run a [Workflow] through [Tool A] and it crashed. It is great for X, but not Y."

4. **The Value Promise (The Thesis):**
   - End with a clear roadmap.
   - **Syntax:** "By the end of this guide, you will know exactly which tool fits your **[Specific Constraint]**."

**SCANNABILITY & BOLDING RULES:**
- **Visual Speed Bumps:** Bold specific **Prices**, **Product Names**, and **Target Audiences**.
  - ❌ Bad: **HubSpot is great for small teams.**
  - ✅ Good: **HubSpot** is best for **small teams** starting at **$0/mo**.
- **Paragraph Limit:** No paragraph can exceed **3 lines**.

**NEGATIVE CONSTRAINTS:**
- **BANNED OPENERS:** NO "Choosing the right tool is a journey." NO "Top 10 Best [Topic] in 2026." NO "In today's competitive market."
- **BANNED PHRASES:** NO "Our expert team has evaluated..." (Show, don't tell).
`,

  howto: `
GOAL: Write an "Action-First Protocol" opening.

**MANDATORY STRUCTURE (THE GOLDEN ORDER):**

1. **The Bridge Answer (The Solution Summary - THE BOT LAYER):**
   - **Constraint:** Summarize the *exact* solution method immediately. Do not tease it.
   - **Syntax:** "To [Outcome], you must [Core Action A] and [Core Action B] using [Tool]. This process takes **[Time]** and requires **[Difficulty Level]**."
   - **Length:** 40-60 words (Dense).
   - *Example:* "To fix Error 503, you must flush your DNS cache and restart the NGINX worker process. This typically takes **5 minutes** and requires **Root Access**."

2. **The Prerequisites Checklist (The SGE Box):**
   - A bulleted list of strictly technical requirements before starting.
   - **Header:** "**Prerequisites:**" or "**What You Need:**"
   - **Content:** Specific Tools, Versions, API Keys, Permissions, or Estimated Cost.

3. **The Trench Hook (Paragraph 2 - THE HUMAN LAYER):**
   - Address the specific pain point, error message, or "Gotcha" moment.
   - **Pick ONE Style:**
     - *The Specific Error:* "If you are staring at **Error: 401 Unauthorized**, you likely missed the API scope configuration."
     - *The Efficiency Hack:* "Most tutorials tell you to do this manually, but that wastes **4 hours**. We will script it."
     - *The Safety Warning:* "Warning: If you skip Step 3, you will corrupt your **production database**."

4. **The Value Promise (The Thesis):**
   - End with the specific transformation.
   - **Syntax:** "By the end of this guide, you will have [Completed State], ready for [Next Stage]."

**SCANNABILITY & BOLDING RULES:**
- **Visual Speed Bumps:** Bold specific **Tools**, **Time Estimates**, and **Error Codes**.
  - Bad: **This process takes five minutes.**
  - Good: This process takes **5 minutes** and requires **Python 3.10+**.
- **Paragraph Limit:** No paragraph can exceed **3 lines**.

**NEGATIVE CONSTRAINTS:**
- **BANNED OPENERS:** NO "Have you ever wanted to learn...", "In this guide...", "Getting started is easy."
- **BANNED TONE:** No "cheerleading." Be an instructor, not a friend.
`,
}

// Helper to get intro template by article type
const getIntroTemplate = (articleType: ArticleType): string => {
  return INTRO_TEMPLATES[articleType] || INTRO_TEMPLATES.informational
}

// --- IN-CONTENT IMAGE TEMPLATES (Tested & Working) ---
const IMAGE_TEMPLATES: Record<string, string> = {
  concept: `Clean editorial illustration on a white background, 16: 9 ratio.A large [MAIN_VISUAL_ELEMENT] in the center acting like an analysis tool.Around it, four labeled indicators connected with thin lines.

Text labels placed clearly near each indicator:
    - [LABEL_1]
    - [LABEL_2]
    - [LABEL_3]
    - [LABEL_4]

At the top center, bold heading text:
    "[SHORT_HEADING_MAX_6_WORDS]"

Flat vector style.Minimal color palette.High clarity text.No gradients.Professional blog illustration.`,

  how_to: `Modern flat illustration on a white background showing [SCENE_DESCRIPTION].On the right side, a vertical checklist panel with check icons.

Checklist text:
    - [STEP_1]
    - [STEP_2]
    - [STEP_3]
    - [STEP_4]

Top left bold heading text:
    "[SHORT_HEADING_MAX_6_WORDS]"

Clean sans serif typography.Flat UI style.Clear readable text.`,

  comparison: `Split screen illustration on a white background.Left side labeled "Before" showing[BAD_STATE_DESCRIPTION].Right side labeled "After" showing[GOOD_STATE_DESCRIPTION].

Text labels under each side:
    - Before
    - After

Small tags near elements on each side describing the difference.

Top center heading text:
    "[SHORT_HEADING_MAX_6_WORDS]"

Flat vector style.High contrast.Editorial blog illustration.`,

  process: `Clean infographic style illustration on a white background.A horizontal flow from left to right with 3 - 4 steps connected by arrows.

Text under each step:
    - [STEP_1_NAME]
    - [STEP_2_NAME]
    - [STEP_3_NAME]

Top heading text:
    "[SHORT_HEADING_MAX_6_WORDS]"

Minimal flat design.Thin arrows.Clean typography.No gradients.`,

  insight: `Editorial style illustration on a white background. [SCENE_WITH_PERSON_OBSERVING].Over the main element, semi- transparent overlays highlight key aspects.

Overlay labels:
- [INSIGHT_1]
- [INSIGHT_2]
- [INSIGHT_3]

Top right heading text:
"[SHORT_HEADING_MAX_6_WORDS]"

Soft flat vector style. Muted colors. Clean readable text.`
}

// Generate section image prompt with integrated text safety
const generateSectionImagePrompt = async (
  section: { heading: string; instruction_note: string; image_type?: string },
  articleTitle: string,
  genAI: any
): Promise<string> => {
  const imageType = section.image_type || 'concept'
  const template = IMAGE_TEMPLATES[imageType] || IMAGE_TEMPLATES.concept

  const prompt = `You are an AI Art Director creating an in-content blog image.

SECTION CONTEXT:
- Heading: "${section.heading}"
- Content Focus: ${section.instruction_note}
- Article: "${articleTitle}"

IMAGE TYPE: ${imageType.toUpperCase()}

USE THIS TEMPLATE STRUCTURE:
${template}

TEXT FORMATTING (Flux 2 Turbo):
- Use handwritten/felt-tip pen style descriptions for better text rendering
- Keep labels concise (max 3-5 words) for readability
- Place text in quotation marks when describing what should appear in the image

YOUR TASK:
1. Fill in the template placeholders based on the section context
2. Rewrite any complex words to image - safe alternatives
3. Keep ALL text labels to max 3 words
4. Keep heading to max 6 words
5. Describe visual elements specifically

OUTPUT: Return ONLY the complete image prompt.No explanations.`

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "text/plain" }
  })

  return response.text || `Clean flat illustration for a blog section about ${section.heading} `
}

// --- PHASE 2 HELPER: "The Critic" Gap Analysis Prompt ---
const getCriticGapPrompt = (keyword: string, articleType: ArticleType, broadContext: string) => {
  const strategy = getArticleStrategy(articleType)

  return `
You are a ruthless Research Critic.${getCurrentDateContext()}

I have gathered initial search results for the keyword: "${keyword}"

YOUR TASK:
Analyze this research data and identify EXACTLY what is MISSING that we need to write a winning article.
You MUST find at least 3 gaps - there are ALWAYS gaps in any research.

** ARTICLE TYPE: ${articleType.toUpperCase()}**
  ${strategy.research_focus}

THINK LIKE A CRITIC - Always find gaps:
- "What SPECIFIC product names are mentioned? Extract them."
  - "I see features, but where is the 2026 pricing?"
  - "They mention customer support, but is it 24/7 or email-only?"
  - "Where are the real user reviews? This is all marketing fluff."
  - "What specific statistics or benchmarks are missing?"
  - "Are there competitor comparisons that should exist but don't?"
  - "What are the actual tool/product names I should research more?"

  === INITIAL RESEARCH DATA(Summary) ===
    ${broadContext}

IMPORTANT RULES:
1. You MUST return 3 - 5 targeted queries - NEVER return an empty array
2. If the data mentions ANY product / tool names, include queries about those specific products
3. Be SPECIFIC - not "best CRM" but "Salesforce pricing 2026" or "HubSpot vs Pipedrive user reviews reddit"
4. Include at least one query for "[keyword] reddit" or "[keyword] reviews" for real user opinions

OUTPUT(Strict JSON):
{
  "gap_analysis": string,  // Brief description of what's missing (NEVER say "no gaps")
    "competitor_names": string[],  // Extract any product/company names mentioned in the research
      "targeted_queries": string[]  // 3-5 SPECIFIC search queries to fill gaps (REQUIRED)
}
`
}

// --- PHASE 2 HELPER: Final Synthesis Prompt ---
const getSynthesisPrompt = (articleType: ArticleType, keyword: string) => {
  const strategy = getArticleStrategy(articleType)

  return `
You are an expert SEO Strategist and Data Analyst.${getCurrentDateContext()}

I will provide you with TWO sets of research data:
1. BROAD LANDSCAPE DATA - General information from top search results
2. DEEP DIVE DATA - Specific gap - filling information we hunted down

YOUR GOAL:
Combine these into ONE comprehensive "Detailed Research Brief" that allows us to write a better article than all competitors combined to dominate modern ai search for answer first intent.

** KEYWORD: "${keyword}" **
** ARTICLE TYPE: ${articleType.toUpperCase()}**

  ${strategy.research_focus}

DATA CLEANING RULES:
1. Ignore UI elements like "Login", "Sign Up", "Footer", "Cookie Policy", "Alt tags".
2. Focus ONLY on educational content, tutorials, and facts.
3. PRIORITIZE the Deep Dive data - it contains the specific facts that competitors miss.

OUTPUT REQUIREMENTS(Return strict JSON):
1. "fact_sheet": Extract hard facts, statistics, dates, and specific steps.MUST include fresh data from Deep Dive.
2. "content_gap": What is STILL missing after both research phases ? This helps the writer know where to add original insight.
3. "product_matrix": (ONLY for commercial / comparison articles) Product details with REAL pricing if found.
4. "step_sequence": (ONLY for how - to / tutorial articles) Extract step - by - step sequence.
5. "prerequisites": (ONLY for how - to / tutorial articles) What the reader needs.
6. "sources_summary": All sources used.
7. "authority_links": Extract 3 - 5 HIGH - QUALITY, non - competitor URLs suitable for citation(e.g., statistics from Statista, definitions from Wikipedia, official docs, industry reports, major news, top tier publications website, and any informational blog site from the product niche).These will be used as external links in the article.

JSON SCHEMA:
{
  "fact_sheet": string[],
    "content_gap": {
    "missing_topics": string[],
      "outdated_info": string,
        "user_intent_gaps": string[]
  },
  "sources_summary": [{ "url": string, "title": string }],
    "product_matrix": [{ "name": string, "price": string, "pros": string[], "cons": string[], "unique_selling_point": string, "best_for": string }],
      "step_sequence": [{ "step": number, "title": string, "details": string, "pro_tip": string }],
        "prerequisites": string[],
          "authority_links": [{ "url": string, "title": string, "snippet": string }]
}
`
}

// --- PHASE 2 HELPER: Deep Research Lite (2-Phase Tavily + Critic) ---
const performDeepResearch = async (
  tvly: any,
  genAI: any,
  keyword: string,
  articleType: ArticleType,
  supportingKeywords: string[] = []
) => {
  console.log(`[Deep Research] Phase 1: Broad Landscape Search for "${keyword}"`)

  // Content length limits to prevent overwhelming the AI
  const MAX_CONTENT_PER_SOURCE = 3000 // chars per source
  const MAX_TOTAL_CONTEXT = 15000 // total chars for critic phase

  // === STEP 1: BROAD LANDSCAPE SEARCH ===
  const broadQuery = `${keyword} ${supportingKeywords.slice(0, 2).join(' ')} `.trim()
  const broadSearch = await tvly.search(broadQuery, {
    searchDepth: "advanced",
    includeRawContent: "markdown",
    maxResults: 5,
  })

  // Extract and CAP content from Tavily results
  const rawBroadContext = broadSearch.results.map((r: any) => {
    const content = r.rawContent || r.content || 'No content available'
    const cappedContent = content.slice(0, MAX_CONTENT_PER_SOURCE)
    return `Source: ${r.title} (${r.url}) \nContent: ${cappedContent}${content.length > MAX_CONTENT_PER_SOURCE ? '... [truncated]' : ''} `
  }).join("\n\n---\n\n")

  // Cap total context for Critic phase
  const broadContext = rawBroadContext.slice(0, MAX_TOTAL_CONTEXT)
  if (rawBroadContext.length > MAX_TOTAL_CONTEXT) {
    console.log(`[Deep Research] Context capped from ${rawBroadContext.length} to ${MAX_TOTAL_CONTEXT} characters`)
  }

  console.log(`[Deep Research] Phase 1 Complete: ${broadSearch.results.length} sources extracted`)
  console.log(`[Deep Research] Context length: ${broadContext.length} characters(capped at ${MAX_TOTAL_CONTEXT})`)

  // === STEP 2: THE CRITIC (Gap Analysis) ===
  console.log(`[Deep Research] Phase 2: The Critic - Analyzing gaps...`)

  const criticPrompt = getCriticGapPrompt(keyword, articleType, broadContext)
  const criticResp = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    config: { responseMimeType: "application/json" },
    contents: [{ role: "user", parts: [{ text: criticPrompt }] }]
  })

  let criticAnalysis: { gap_analysis?: string; targeted_queries?: string[]; competitor_names?: string[] } = {
    gap_analysis: "",
    targeted_queries: [],
    competitor_names: []
  }
  try {
    const parsed = cleanAndParse(criticResp.text || '{}')
    criticAnalysis = {
      gap_analysis: parsed.gap_analysis || "Missing specific pricing, user reviews, and competitor comparisons.",
      targeted_queries: Array.isArray(parsed.targeted_queries) && parsed.targeted_queries.length > 0
        ? parsed.targeted_queries
        : [`${keyword} pricing 2026`, `${keyword} reviews reddit`, `best ${keyword} comparison`], // Fallback queries
      competitor_names: Array.isArray(parsed.competitor_names) ? parsed.competitor_names : []
    }
  } catch (parseError) {
    console.warn(`[Deep Research] Failed to parse critic response, using fallback queries: `, parseError)
    // Use intelligent fallback queries based on keyword
    criticAnalysis = {
      gap_analysis: "Parse failed - using fallback research queries.",
      targeted_queries: [`${keyword} pricing 2026`, `${keyword} reviews reddit`, `best ${keyword} tools comparison`],
      competitor_names: []
    }
  }
  const targetedQueries: string[] = criticAnalysis.targeted_queries || []

  console.log(`[Deep Research] Critic identified gaps: `, criticAnalysis.gap_analysis)
  console.log(`[Deep Research] Competitor names found: `, (criticAnalysis.competitor_names?.length ?? 0) > 0 ? criticAnalysis.competitor_names : "None")
  console.log(`[Deep Research] Targeted queries: `, targetedQueries)

  // === STEP 3: SNIPER SEARCH (Fill the Gaps) ===
  let deepContext = ""
  if (targetedQueries.length > 0) {
    console.log(`[Deep Research] Phase 3: Sniper Search - Hunting ${targetedQueries.length} specific queries...`)

    // Execute targeted searches in parallel for speed
    const deepResults = await Promise.all(
      targetedQueries.slice(0, 4).map((q: string) =>
        tvly.search(q, {
          searchDepth: "basic",
          includeRawContent: "markdown",
          maxResults: 2
        }).catch((err: any) => {
          console.log(`[Deep Research] Sniper query failed: ${q} `, err.message)
          return { results: [] }
        })
      )
    )

    const allDeepResults = deepResults.flatMap(r => r.results)
    // Cap each gap-fill result too
    deepContext = allDeepResults.map((r: any) => {
      const content = r.rawContent || r.content || 'No content available'
      const cappedContent = content.slice(0, MAX_CONTENT_PER_SOURCE)
      return `Source(Gap Fill): ${r.title} (${r.url}) \nContent: ${cappedContent} `
    }).join("\n\n---\n\n")

    console.log(`[Deep Research] Phase 3 Complete: ${allDeepResults.length} gap - filling sources extracted`)
  }

  // === STEP 4: FINAL SYNTHESIS ===
  console.log(`[Deep Research] Phase 4: Final Synthesis...`)

  const synthesisPrompt = getSynthesisPrompt(articleType, keyword)
  const combinedData = `
  === BROAD LANDSCAPE DATA(Initial Search) ===
    ${broadContext}

=== DEEP DIVE DATA(Gap - Filling Search) ===
  ${deepContext || "No additional gap-filling data was needed."}

=== CRITIC'S GAP ANALYSIS ===
${criticAnalysis.gap_analysis || "No major gaps identified."}
`

  const synthesisStream = await genAI.models.generateContentStream({
    model: "gemini-2.5-flash",
    config: {},
    contents: [{ role: "user", parts: [{ text: synthesisPrompt + "\n\n" + combinedData }] }]
  })

  let synthesisText = ""
  for await (const c of synthesisStream) {
    synthesisText += (c as any).text || ""
  }

  console.log(`[Deep Research]Complete! Synthesized comprehensive research brief.`)
  // Use self-correcting parser for Zod validation with retry
  return cleanParseAndValidate(synthesisText, CompetitorDataSchema, genAI)
}

const generateOutlineSystemPrompt = (keyword: string, styleDNA: any, competitorData: any, articleType: ArticleType, brandDetails: any = null, title?: string, internalLinks: any[] = []) => {
  const strategy = getArticleStrategy(articleType)

  // Extract authority links from competitor data for external linking
  const authorityLinks = competitorData.authority_links || []

  return `
You are an expert Content Architect and SEO Strategist.
Your goal is to outline a high - ranking blog post that beats the competition by filling their "Content Gaps".

** ARTICLE TYPE: ${articleType.toUpperCase()}**

  INPUT CONTEXT:
1. MAIN KEYWORD WE ARE FOCUSING ON: "${keyword}"
2. COMPETITOR & GAP DATA: "${JSON.stringify(competitorData)}"
3. ${brandDetails ? `### BRAND CONTEXT (Strategic Integration)
- Brand: ${brandDetails.product_name}
- Type: ${brandDetails.product_identity?.literally || 'Product/Service'}
- Audience: ${brandDetails.audience?.primary || 'Users seeking solutions'}
- Features: ${brandDetails.features?.join(', ') || 'N/A'}
- UVP: ${brandDetails.unique_value_proposition}
- How It Works: ${brandDetails.how_it_works || 'N/A'}

NOTE: Use this brand data as source of supporting context.
CRITICAL INSTRUCTION FOR "HOW-TO" SECTIONS:
If the user intent is to solve a problem that OUR product solves (e.g., "how to animate photos"), the "How-To" section of the outline MUST instruct the writer to use OUR product's process.
- In the 'instruction_note' for that section, you MUST specifically write: "Explain how to solve this using ${brandDetails.product_name}. Steps: [Insert relevant steps from 'How It Works' above]. Mention that for best results, proper restoration/prep is key (if applicable)."
- DO NOT suggest competitors or generic tools as the primary solution if we offer a direct one.
- For unrelated sections, keep brand mentions sparing and natural.

Plan brand mentions sparingly - only where contextually valuable, HOW to section to position us against other competitors, in comparison tables for features or anything else.
4. Don't just list competitors - explain why YOUR approach is different/better
5. Strategic mentions: Make sure you dont forcefully add user brand evrywhere, if you do this its called spamming. So, it must earn its place naturally and strategically, nothing is random here, everything needs to be planned.
` : ''
    }
${internalLinks.length > 0 ? `### INTERNAL LINKS POOL (USE 1-2 MAX)\n${internalLinks.map(l => `- Title: ${l.title} | URL: ${l.url}`).join('\n')}` : ''}

### ARTICLE REQUIREMENT STRATEGY:
${strategy.outline_instruction}

---
  Before outlining, analyze the "Keyword Intent" to determine the required depth:

1. ** The "Quick Answer" Scope ** (e.g., "how to reset iphone", "what is x", or commerical intent):
- Structure: Short, direct.
   - Depth: Mostly H2s, few H3s.
   - Total Sections: ** 7 - 10 sections ** are sufficient.
   - GOAL: Speed to solution.

2. ** The "Comprehensive Guide" Scope ** (e.g., "ultimate guide to seo", "best crm software"):
- Structure: Deep, nested.
   - Depth: Heavy use of H3s and H4s.
   - Total Sections: ** 10 - 15 sections **.
   - GOAL: Exhaustive coverage.

** INSTRUCTION:** Adjust your outline length to match the keyword intent. Do not force a 15 - section outline for a 8 - section topic.

## HEADING STYLE PROTOCOL(MANDATORY - READ CAREFULLY)

You must write headers that look like they were written by a HUMAN expert, not an AI.

🚫 ** BANNED HEADER PATTERNS(INSTANT FAIL):**
  - NO Colons: "The Evolution: From X to Y" -> FAIL
    - NO Parentheses: "Understanding Authority (The Real Metrics)" -> FAIL
      - NO Metaphors: "Unlocking the Power of..." -> FAIL
        - NO "The Art of..." or "The Future of..."
          - NO "Demystifying X" or "Navigating the Landscape"

✅ ** REQUIRED HEADER PATTERNS(USE THESE):**
- ** Direct Questions:** "What is a high authority backlink?"
  - ** Direct Statements:** "Why 'authority' is more than a DR number"
    - ** Vs / Comparison:** "Dofollow vs Nofollow: The real difference"
      - ** Action - Oriented:** "How to judge a backlink's authority"
        - ** Listicles:** "Quick checks that founders skip"
          - ** Outcome - Based:** "What results look like in the first 30 days"

            ** THE LITMUS TEST:**
              If the header sounds like a "Chapter Title" in a fantasy novel, delete it.
If it sounds like a Google Search Query, keep it.

## HEADING HIERARCHY RULES (CRITICAL FOR SEO - MUST FOLLOW)

**LEVEL DEFINITIONS:**
- **level: 2 (H2)** = Main topic pillars. Wide scope.
- **level: 3 (H3)** = Specific sub-concepts. Narrower scope.
- **level: 4 (H4)** = Granular details, lists, steps, specific features. Deep scope.

** STRUCTURE PATTERN(FOLLOW THIS):**
\`\`\`
H2: Main Topic A
  H3: Subtopic A.1
  H3: Subtopic A.2
    H4: Detail A.2.1 (if needed)
    H4: Detail A.2.2
  H3: Subtopic A.3
H2: Main Topic B
  H3: Subtopic B.1
  H3: Subtopic B.2
\`\`\`
**THE "DEPTH" MANDATE:**
1. **NO WALLS OF TEXT:** We are writing for the scroll-heavy mobile web.
2. **AGGRESSIVE FRAGMENTATION:** Break big ideas down.
   - ❌ Bad: One H2 with 500 words.
   - ✅ Good: One H2 with three H3s and two H4s.

**HIERARCHY REQUIREMENTS (STRICT):**
1. **The 60% Rule:** AT LEAST 60% of your sections MUST be level 3 or 4.
2. **The H4 Mandate:** You MUST use H4s for:
   - Specific steps in a process
   - Detailed feature breakdowns
   - Pros/Cons lists
   - Comparisons
   - "Why this matters" deep dives
3. **NEVER** have back-to-back H2s without at least one H3 in between (unless it's a very simple transition).
4. **Structure:** The output sections array is flat, but the logic is nested.
5. **Depth over Breadth:** Prefer fewer H2s with more depth (H3/H4) over many shallow H2s.
6. **Internal Link Placement:** If internal links are provided, identify 1-2 sub-sections (H3/H4) where they strictly fit.

---

## EXTERNAL LINKING STRATEGY (CRITICAL FOR SEO & E-E-A-T)

I have provided a list of "Authority Links" from our research:
${JSON.stringify(authorityLinks)}

**YOUR TASK:** 
- Select **EXACTLY A TOTAL OF 2 LINKS** (if available) for the entire article.
- Assign "external_link" to the 2 most relevant sections.
- **Rule:** If the authority links list is empty or irrelevant, you may skip this. But if valid links exist, you MUST use 2.

**EXTERNAL LINKING RULES:**
1. Do not clump links. Spread them out.
2. The "anchor_context" is critical—it tells the writer *why* to cite this.
3. Prefer citations for Specific Data/Stats or Definitions.

## INTERNAL LINKING STRATEGY (DISTRIBUTOR MODEL)

I have provided a list of "Internal Links" from our site:
${internalLinks.length > 0 ? internalLinks.map(l => `- Title: ${l.title} | URL: ${l.url}`).join('\n') : "No internal links available."}

**YOUR TASK:**
- Review the pool and select **MAXIMUM 3 LINKS** that are highly relevant.
- Assign them to the most appropriate sections using the "internal_link" field.
- **Rule:** If the pool is empty or nothing fits, SKIP it. Do not force it.
- **Rule:** Distribute them. Never more than 1 internal link per section.

---

## OUTPUT INSTRUCTIONS:
1. **Title:** ${title ? `Use the provided title: "${title}".` : 'Generate a catchy H1 based on the Keyword and Content Gap.'}
2. **Intro/Hook:** Plan a strong introduction.
   - Do NOT list this in the "sections" array.
   - It needs to hook the reader immediately.
3. **Structure:** Create a logical flow FOLLOWING the TYPE-SPECIFIC STRATEGY above.
   - **MANDATORY:** You MUST create specific sections that address the "missing_topics" identified in the Competitor Data.
   - **USER INTENT:** Ensure the structure answers the specific questions users are asking.
4. **Instruction Notes (THE DATA DISTRIBUTION RULE):**
   - You have a "Fact Sheet" in the input. You must DISTRIBUTE these facts into the most relevant sections. tell the writer to use this data in their own words.
   - **Constraint:** Do not be vague. Do not say "Include data."
   - **Requirement:** You must COPY the specific number/stat from the Fact Sheet into the instruction_note.
   - *Example:* "Explain the traffic drop. CITE DATA: 'Gartner predicts 50% drop by 2028' (from Fact Sheet)."
   - **Rule:** Do not reuse the same fact in multiple sections. Assign it to the ONE best spot.
   - **DO NOT** write style instructions. Only focus on the **Substance**.

## IN-CONTENT IMAGE SELECTION (IMPORTANT):
For EACH H2 section, decide if an image would ADD VALUE to the content:
- Set "needs_image": true if the section would benefit from a visual
- Set "image_type" to one of: "concept" | "how_to" | "comparison" | "process" | "insight"

**RULES:**
- MAX 3 sections should have needs_image: true
- ONLY H2 level sections can have images (not H3/H4)
- Skip list/tip sections (text-heavy, no visual value)
- PREFER images for: How-to steps, concept explanations, before/after comparisons, process flows

**IMAGE TYPE GUIDE:**
- "concept": Explaining an idea or mental model with labeled diagram
- "how_to": Step-by-step with checklist visual
- "comparison": Before vs after or side-by-side comparison
- "process": Flow diagram with arrows showing steps
- "insight": Person observing with overlay labels

## OUTPUT SCHEMA (Return strict JSON):
{
  "title": string,
  "intro": {
    "instruction_note": string,
    "keywords_to_include": string[]
  },
  "sections": [
    {
      "id": number (1-based index, sequential),
      "heading": string,
      "level": number (2, 3, or 4 - PRIORITIZE 3 AND 4),
      "instruction_note": string, 
      "keywords_to_include": string[],
      "external_link": { "url": string, "anchor_context": string }, // OPTIONAL
      "internal_link": { "url": string, "title": string, "anchor_context": string }, // OPTIONAL
      "needs_image": boolean, // true if this section should have an in-content image
      "image_type": "concept" | "how_to" | "comparison" | "process" | "insight" // REQUIRED if needs_image is true
    }
  ]
}

**FINAL CHECK:** Before outputting, verify that:
- You have adhered to the 60% rule (majority of sections are H3/H4)
- You have broken down complex topics into H4 lists/steps
- Does this outline solve the specific intent of "${keyword}"?
- Did you remove unnecessary fluff sections?
- Did you assign 1-2 external links to relevant sections?
- Did you mark 2-3 H2 sections with needs_image: true?
`
}


const generateWritingSystemPrompt = (styleDNA: string, outline: any, currentSectionIndex: number, brandDetails: any = null, articleType: string = 'informational') => {
  // styleDNA is now a paragraph describing the writing style

  // --- GLOBAL ARTICLE MAP (THE MAP) ---
  const completedSectionsList = currentSectionIndex < 0 ? [] : outline.sections.slice(0, currentSectionIndex)
  const upcomingSectionsList = currentSectionIndex < 0 ? outline.sections : outline.sections.slice(currentSectionIndex + 1)

  const completedSections = completedSectionsList.map((s: any) => `- [COMPLETED] ${s.heading}`).join('\n')
  const upcomingSections = upcomingSectionsList.map((s: any) => `- [UPCOMING] ${s.heading}`).join('\n')

  const globalMap = `
### 0. GLOBAL ARTICLE MAP (YOUR GPS)
You are writing ONE specific section in a larger article.
DO NOT repeat what is already done. DO NOT steal thunder from what is coming.

**PREVIOUSLY COVERED (Do not repeat):**
${completedSections || "(This is the first section)"}

**COMING NEXT (Do not cover these topics):**
${upcomingSections || "(This is the last section)"}
`

  // Build brand context section with contextual guidelines
  let brandContextSection = ""
  if (brandDetails) {
    brandContextSection = `
### 5. BRAND MENTION GUIDELINES (USE JUDGMENT - NOT RIGID RULES)

**Your brand:** ${brandDetails.product_name}
**Audience:** ${brandDetails.audience?.primary || 'Users seeking solutions'}

**THE PRINCIPLE:** Mention the brand only where it adds VALUE, not artificially. se it where you need to provide solution to teh article answers.

**WHEN TO MENTION BRAND (Natural contexts):**
- When establishing authority in the intro (once)
- When comparing to competitors in a features/comparison section/tables
- When the section is SPECIFICALLY about your product's approach
- In a call-to-action at the end

**WHEN NOT TO MENTION BRAND (Forced contexts):**
- In purely educational/informational sections about general concepts
- When explaining industry-standard processes or terminology
- Multiple times in the same section or consecutive paragraphs
- Just to "remind" the reader - they already know

**THE GOOGLE TEST:**
Ask: "If Google saw this, would it look like an informative article or a sales pitch?"
Informative articles rank. Sales pitches don't.

**USE ALTERNATIVES instead of repeating "${brandDetails.product_name}":**
- "we" / "our tool" / "our platform" / "our approach"
- "our team" (for agencies/companies)
- Just describe the feature without naming the brand

**CONTEXT CHECK (USE THE PREVIOUS SECTIONS):**
Before mentioning the brand, check the CONTEXT section in your prompt.
- If brand was already mentioned in the last 2 sections → DO NOT mention again
- If brand hasn't been mentioned for 3+ sections and it's genuinely relevant → OK to mention

**AUTHORITY POSITIONING:**
- For YOUR product/brand: Use first-person plural ("We built...", "Our tool...")
- For competitor products: Use third-party framing ("According to reviews...", "Users report...")
- For general concepts: State facts confidently without fake personal claims
`
  }

  // Article-type-aware intro strategy
  const introStrategy = `
### 6. INTRO STRATEGY (ADAPT TO ARTICLE TYPE: ${articleType.toUpperCase()})

${articleType === 'informational' ? `**INFORMATIONAL ARTICLE:**
- **The "Hook"**: Lead with the direct answer in sentences 1-2 in a surprising statistic, a contrarian take, or a "Hard Truth" about the topic.
- **The "Bridge"**: Explain *why* this matters right now (urgency).
- Then provide brief context
- Example: "A reunion hug video is created by uploading two photos to an AI generator. The process takes 2-3 minutes. Here's exactly how it works..."` : ''}


${articleType === 'commercial' ? `**COMMERCIAL ARTICLE:**
- **The "Pain"**: Lead with the key insight or recommendation, Describe the specific frustration the user feels right now.
- **The "Agitation"**: "It’s not just annoying; it’s costing you time/money."
- **The "Solution"**: Introduce the fix immediately. "That's why we built [Product]..."
- Can include brief emotional context if relevant to the problem
- Example: "After testing 7 AI video tools, [Product] offers the best balance of quality and privacy. Here's what I found..."` : ''}

${articleType === 'comparison' ? `**COMPARISON ARTICLE:**
- Lead with the key differentiator
- Be fair and objective in tone
- Example: "The main difference between X and Y is [key factor]. Here's a detailed breakdown..."` : ''}


${articleType === 'how-to' ? `**HOW-TO/TUTORIAL ARTICLE:**
- **The "End State"**: Describe the completed result first. "By the end of this, you’ll have a fully functional..."
- **The "Warning"**: "Most people mess up step 3. Pay attention there."
- **The "Prerequisites"**: List them fast.` : ''}

**Everything which gives below mentioned vibes are BANNED OPENERS (IMMEDIATE REJECTION OF SUCH WORDS):**
- ❌ "In today's fast-paced digital landscape..."
- ❌ "Have you ever wondered...?"
- ❌ "Let's dive in..."
- ❌ "Imagine a world where..."
- ❌ "Imagine..." or "Picture this..." as openers
- ❌ Rhetorical questions that delay the answer
- ❌ Multiple paragraphs before getting to the point
`

  return `
You are an expert Blog Writer who knows the autneticity rules for modern ai search engine. You are NOT an AI assistant. You are a Subject Matter Expert (SME). ${getCurrentDateContext()}

${globalMap}

### 1. THE CODE OF AUTHENTICITY (NON-NEGOTIABLE)
**We write for HUMANS, not just algorithms. If you sound like a robot or violate these formatting constraints, the article will fail.**
"${AUTHENTIC_WRITING_RULES}"

### 2. WRITING STYLE & VOICE OF BRAND YOU ARE WRITING FOR (FOLLOW THESE INSTRUCTIONS PRECISELY)
"${styleDNA}"

### 3. STRATEGY & MINDSET
- **Goal:** Rank #1 on Google and get cited by ai LLMs by being more specific, helpful, and "human" than the competition to answer the user's question.
- **Method:** High information density, low word count. Every sentence must earn its place.

### 4. THE "ANTI-FLUFF" PROTOCOL (COMPETITOR TRANSFORMATION)
**How to handle data and citations to maximize OUR authority without risking plagiarism:**

1. **NEVER CITE COMPETITORS:**
   - Scan the source/fact. Is it a rival Agency, SaaS tool, or "SEO Guru"?
   - **IF YES:** Do NOT cite them by name.
   - *Technique:* Rephrase the finding as a general industry pattern.
     - ❌ Bad: "According to [XYZ competitor], 68% of sites..."
     - ✅ Good: "It is widely observed across the industry that **over 60% of sites**..." (Generalization).
     - ✅ Best: "In our own client audits, we frequently see that **most new sites**..." (Qualitative First-Party).

2. **ALWAYS CITE "SUPER-AUTHORITIES":**
   - Is the source a Neutral Giant? (e.g., Google, Microsoft, Statista, Gartner, W3C, Government bodies).
   - **IF YES:** Keep the citation. It builds E-E-A-T.
   - *Example:* "As confirmed by **Google's John Mueller**..." or "Data from **Statista** shows..."

3. **THE "FIRST-PARTY" PRIORITY:**
   - Whenever possible, prioritize insights derived from our own tool/platform over external reports.
   - Use phrases like "Our platform handles this by..." or "We built [Brand Name] to solve this specific issue..."



### 5. ARTICLE STRATEGY - supporting data (${articleType.toUpperCase()})
${introStrategy}
${brandContextSection}

### 6. THE "VISUAL RHYTHM" MANDATE (SCANNABILITY)
*The formatting is as important as the text.*

1.  **THE TABLE RULE:** If you equate/compare >2 items (features, pros/cons, prices), you **MUST** use a Markdown Table.
    *   *Why:* Tables are "Knowledge Graphs" for AI, and "Skimmable" for humans.
 If a paragraph contains **>3 numerical comparisons** or compares Features/Pros/Cons, you **MUST** convert it to a **Markdown Table**.
   - *Why:* Paragraphs lose the row/column relationship in vector space. Tables preserve it.

2.  **THE LIST RULE:**
    *   **Processes:** Use Ordered Lists (\`<ol>\`).
    *   **Components:** Use Unordered Lists (\`<ul>\`).
    *   *Constraint:* Do NOT write a list where a simple comma-separated sentence works better. Lists are for *complex* items.

3. **BOLDED ENTITIES:** - **Bold** the specific Named Entity (e.g., "**$29/mo**", "**Next.js**", "**HubSpot**").
   - This acts as an "Attention Anchor" for the AI parser.

### 6. OUTPUT FORMAT
Return **Markdown** formatted text. 
- Make use of proper H2, H3, and H4 headers for SEO appropriately.
- Do NOT include the main H2 Section Heading (system adds it).
- Start directly with the body content.
`
}

const generateWritingUserPrompt = (previousFullText: string, currentSection: any) => {
  // Build the Link Instruction Block if section has an assigned external link
  let linkInstruction = ""

  // 1. External Link (Citation)
  if (currentSection.external_link) {
    linkInstruction += `
### MANDATORY CITATION REQUIREMENT (EXTERNAL)
You MUST include an external hyperlink in this section.
- **URL:** ${currentSection.external_link.url}
- **Context:** Used to verify "${currentSection.external_link.anchor_context}"
- **Format:** [anchor text](url) (Markdown)
- **Rule:** Link a Noun/Entity/Stat. Do NOT link a verb.
- **Rule:** Make sure its a part of running paragraph, not forced.
- **Rule:** ⛔️ PROHIBITED: Do NOT bold the anchor text. Links are already visually distinct. [**text**](url) is BANNED.
- **Constraint:** Anchor text must be SHORT (2-5 words max). Do not link full sentences.
**ANCHOR TEXT RULES:**
1. **LOWERCASE ONLY:** The anchor text must be lowercase to flow with the sentence (unless it's a proper noun).
   - ❌ Bad: "...read our guide on [The Best AI Tools]."
   - ✅ Good: "...read our guide on [the best AI tools]."
   - ⛔️ NO BOLD: [**text**](url) -> [text](url)

`
  }

  // 2. Internal Link (Cross-Reference)
  if (currentSection.internal_link) {
    linkInstruction += `
### MANDATORY INTERNAL LINK REQUIREMENT
You MUST include an internal link to our own content in this section.
- **Target Page Title for your context the article was written for:** "${currentSection.internal_link.title}"
- **URL:** ${currentSection.internal_link.url}
- **Linking Context:** ${currentSection.internal_link.anchor_context}
- **Markdown Format:** [anchor text](url) 

**ANCHOR TEXT RULES (CRITICAL - DO NOT FAIL):**
1. **⛔️ PROHIBITED:** NEVER, EVER use the "Target Page Title" as the anchor text.
2. **✅ REQUIREMENT:** You MUST write a brand new, natural phrase that fits the crrent section content and include it in the sentence structure naturally.
3. **LOWERCASE ONLY:** The anchor text must be lowercase (unless it's a proper noun).
4. **NO BOLDING:** Do not put **bold** stars inside the link syntax.
5. **FLOW IS KING:** The sentence must be grammatically correct even if the link was removed.


**EXAMPLES:**
❌ Bad (Using Title): "You should read (How Internal Linking Boosts SEO)[url]."
❌ Bad (Click Here): "For more info on SEO, [click here](url)."
✅ GOOD (Contextual): "This is why [internal linking strategies](url) are vital for growth."
✅ GOOD (Contextual): "Most experts agree that [strategic link placement](url) signals authority."
`
  }

  return `
### BEFORE YOU WRITE - CHECK THE CONTEXT to ensure smooth flow of article.

### CONTEXT SNOWBALL
Read this to ensure continuity and **AVOID REPETITION**.
"${previousFullText}".

1.  **BRAND CHECK:** If brand was just mentioned, do NOT mention it again. Use "we".
2.  **REPETITION CHECK:** Do NOT define concepts already defined. Do NOT re-state the "problem".
3.  **FLOW CHECK:** Connect smoothly to the previous paragraph.

---

### YOUR TASK: WRITE SECTION "${currentSection.heading}"
**GOAL:** High-density, skimmable, "human" content.

**CONTENT REQUIREMENTS:**
${currentSection.instruction_note}

**KEYWORDS To use naturally:** ${currentSection.keywords_to_include.join(", ")}
${linkInstruction}

### ⛔️ STYLE GUARDRAILS (VISUAL RHYTHM CHECK)
### CORE DIRECTIVES
1.  **Kill the "Wall of Text":** Never output more than 3 paragraphs in a row without a visual break (sub-header, bullet list, quote, or table).
2.  **The "Heartbeat" Rhythm:** content must mimic human speech patterns.
    * Mix short, punchy sentences (3-7 words) with longer, descriptive sentences.
    * Vary paragraph length. Some paragraphs should be deep dives (4-5 lines); others should be single-line "punch" paragraphs for emphasis.
3.  **Data Visualization:**
    * IF the input contains comparison data, budget splits, or technical specs -> YOU MUST convert this into a Markdown Table. Do not write it out in sentences.
    * IF the input contains a series of steps or features -> Convert to a bulleted or numbered list.

### FORMATTING TOOLKIT
Use these elements aggressively to break up the text:
* **Bold (**text**):** Use for key concepts or "bottom line" statements. Do not bold entire sentences; bold the *keywords*.
* **Blockquotes (>):** Use for the single most important takeaway, a surprising statistic, or a "Rule of Thumb."
* **Lists:** Use bullet points for features/benefits. Use numbered lists for steps/processes.
* **Tables:** Use for "If this, then that" logic or numerical data.
* 
* ### NEGATIVE CONSTRAINTS (WHAT TO AVOID)
* **No Symmetry:** Do not write 5 paragraphs of exactly the same length.
* **No Fluff:** Do not use generic AI transitions like "In conclusion," "Moreover," "In the dynamic landscape of..." Start sentences directly with the subject or verb.
* **No Passive Voice:** Use active verbs. (e.g., "The data shows X," not "It is shown by the data that X").

### ⚡️ STRUCTURAL OVERRIDES (THE "SNIPPET" LAYER)
**Check the Heading type:**
- IF heading starts with "How to", "Steps to", or implies a process:
  - **YOU MUST USE AN ORDERED LIST (<ol>).**
  - Do NOT write a paragraph. Break the steps down immediately.
- IF heading implies a comparison ("Vs", "Difference"):
  - **YOU MUST USE A MARKDOWN TABLE.**

### AUTHORITY POSITIONING
State facts confidently from the provided instructions notes for wiritng the section.
*   ❌ THIN: "Using automation saves time."
*   ✅ DEEP: "Automation cuts submission time from **40+ hours** to **2-3 hours**. Each manual submission requires filling **15-20 fields**. Automation handles this in the background, freeing up **37 hours** for product development."

**START WRITING the body content for "${currentSection.heading}" NOW (Direct Markdown):**
⚠️ **DO NOT include the section heading, system already adds it. Start directly with the content.**
`
}



export const generateBlogPost = task({
  id: "generate-blog-post",
  // Queue configuration: Limit concurrent article generations to prevent API rate limits
  // Even if 100 articles are triggered at once, only 3 will run at a time, others wait in queue
  queue: {
    concurrencyLimit: 3, // Max 3 articles generating simultaneously across all users
  },
  run: async (payload: {
    articleId: string;
    keyword: string;
    brandId: string;
    title?: string;
    articleType?: ArticleType;
    supportingKeywords?: string[];
    cluster?: string;
    planId?: string;
    itemId?: string;
  }) => {
    const {
      articleId,
      keyword,
      brandId,
      title,
      articleType = 'informational',
      supportingKeywords = [],
      cluster = '',
      planId,
      itemId
    } = payload
    const supabase = createAdminClient()
    let phase: "research" | "outline" | "writing" | "polish" = "research"

    // Initialize clients inside the task to avoid build-time errors
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY! })
    const genAI = getGeminiClient()

    try {
      // 0. Brand is required - fetch brand details including style_dna
      if (!brandId) throw new Error("Brand ID is required")

      const { data: brandRec } = await supabase
        .from("brand_details")
        .select("brand_data")
        .eq("id", brandId)
        .single()

      if (!brandRec) throw new Error("Brand not found")
      const brandDetails = BrandDetailsSchema.parse(brandRec.brand_data)

      // style_dna is now a paragraph from brand_details, not a separate brand_voices lookup
      const styleDNA = brandDetails.style_dna || "Write in a professional yet conversational tone. Use active voice and be direct. Address the reader as 'you'. Keep sentences varied for natural rhythm. Avoid corporate jargon and be specific with examples and data."

      // --- NEW: FETCH INTERNAL LINKS POOL ---
      // Fetch user_id for this article
      const { data: articleRec } = await supabase
        .from("articles")
        .select("user_id")
        .eq("id", articleId)
        .single()

      const userId = articleRec?.user_id
      let internalLinks: any[] = []

      if (userId) {
        console.log(`🔗 [DEBUG] Searching for internal links...`)
        console.log(`🔗 [DEBUG] userId: ${userId}, brandId: ${brandId}`)
        console.log(`🔗 [DEBUG] Search query: "${title || keyword}"`)
        internalLinks = await getRelevantInternalLinks(title || keyword, keyword, userId, brandId)
        console.log(`🔗 [DEBUG] Found ${internalLinks.length} relevant internal links`)
        if (internalLinks.length > 0) {
          console.log(`🔗 [DEBUG] Internal links:`, JSON.stringify(internalLinks.slice(0, 3)))
        } else {
          console.log(`🔗 [DEBUG] No internal links found - check if internal_links table has data with embeddings for this brand`)
        }
      } else {
        console.log(`🔗 [DEBUG] No userId found for article ${articleId} - skipping internal links`)
      }

      // --- PHASE 2: RESEARCH (Deep Research - 2-Phase Tavily + Critic) ---
      await supabase.from("articles").update({ status: "researching", supporting_keywords: supportingKeywords }).eq("id", articleId)
      phase = "research"

      // Use the 2-phase deep research: Broad Search → Critic Gap Analysis → Sniper Search → Synthesis
      const competitorData = await performDeepResearch(
        tvly,
        genAI,
        keyword,
        articleType,
        supportingKeywords
      )

      await supabase
        .from("articles")
        .update({ competitor_data: competitorData, status: "outlining" })
        .eq("id", articleId)

      // --- PHASE 3: OUTLINE (The "Architect") ---
      phase = "outline"

      // Filter authority links to exclude social media and generic domains
      const filterAuthorityLinks = (links: Array<{ url: string, title: string, snippet?: string }>) => {
        const badDomains = [
          "youtube.com", "facebook.com", "twitter.com", "linkedin.com",
          "instagram.com", "tiktok.com", "pinterest.com", "reddit.com",
          "medium.com", "quora.com" // Also exclude user-generated content platforms
        ]

        return links.filter(link => {
          try {
            const domain = new URL(link.url).hostname.toLowerCase()
            return !badDomains.some(d => domain.includes(d))
          } catch {
            return false // Invalid URL, filter it out
          }
        }).slice(0, 5) // Keep top 5 candidates
      }

      // Clean authority links before passing to outline
      const cleanedCompetitorData = {
        ...competitorData,
        authority_links: filterAuthorityLinks(competitorData.authority_links || [])
      }

      console.log(`🔗 [DEBUG] External authority links BEFORE filter: ${competitorData.authority_links?.length || 0}`)
      console.log(`🔗 [DEBUG] External authority links AFTER filter: ${cleanedCompetitorData.authority_links?.length || 0}`)
      if (cleanedCompetitorData.authority_links?.length > 0) {
        console.log(`🔗 [DEBUG] Authority links passed to outline:`, JSON.stringify(cleanedCompetitorData.authority_links.slice(0, 3)))
      } else {
        console.log(`🔗 [DEBUG] No external authority links available for outline`)
      }

      const outlinePrompt = generateOutlineSystemPrompt(keyword, styleDNA, cleanedCompetitorData, articleType, brandDetails, title, internalLinks)
      const outlineConfig = {}
      const outlineContents = [
        {
          role: "user",
          parts: [{ text: outlinePrompt }],
        },
      ]

      const outlineStream = await genAI.models.generateContentStream({
        model: "gemini-3-flash-preview",
        config: outlineConfig,
        contents: outlineContents
      })

      let outlineText = ""
      for await (const c of outlineStream) {
        outlineText += (c as any).text || ""
      }

      // Use self-correcting parser for Zod validation with retry
      const outline = await cleanParseAndValidate(outlineText, ArticleOutlineSchema, genAI)

      // DEBUG: Check if LLM assigned external links to sections
      const sectionsWithExternalLinks = outline.sections.filter((s: any) => s.external_link)
      console.log(`🔗 [DEBUG] Outline parsed - ${outline.sections.length} sections`)
      console.log(`🔗 [DEBUG] Sections with external_link assigned: ${sectionsWithExternalLinks.length}`)
      if (sectionsWithExternalLinks.length > 0) {
        console.log(`🔗 [DEBUG] External links in outline:`, JSON.stringify(sectionsWithExternalLinks.map((s: any) => ({ heading: s.heading, external_link: s.external_link }))))
      } else {
        console.log(`🔗 [DEBUG] LLM did NOT assign any external_link to sections - prompt may need adjustment`)
      }

      // Use user's chosen title if provided, otherwise use AI-generated title
      const finalTitle = title || outline.title

      // IMPORTANT: Override outline.title with finalTitle to ensure consistency
      // This prevents the stored outline from having a different title than the article
      outline.title = finalTitle

      // Initialize draft with Title
      const initialDraft = `# ${finalTitle} \n\n`

      await supabase
        .from("articles")
        .update({
          outline,
          raw_content: initialDraft,
          status: "writing",
          current_step_index: 0
        })
        .eq("id", articleId)

      // --- PHASE 4: WRITING (The "Snowball" Loop) ---
      phase = "writing"

      let currentDraft = initialDraft
      let startIndex = 0
      const factSheet = competitorData.fact_sheet

      // === CHECKPOINT RESUMPTION: Fetch existing progress ===
      const { data: existingArticle } = await supabase
        .from("articles")
        .select("raw_content, current_step_index")
        .eq("id", articleId)
        .single()

      if (existingArticle?.raw_content && existingArticle.current_step_index > 0) {
        currentDraft = existingArticle.raw_content
        startIndex = existingArticle.current_step_index
        console.log(`[Checkpoint] Resuming from section index ${startIndex}`)
      }

      // 4.1 Write Intro (The Hook) - Separately
      // Only write intro if not resuming (startIndex === 0)
      if (startIndex === 0 && outline.intro) {
        const systemPrompt = generateWritingSystemPrompt(styleDNA, outline, -1, brandDetails, articleType)
        const introTemplate = getIntroTemplate(articleType)
        const userPrompt = generateWritingUserPrompt(currentDraft, {
          heading: "Introduction / Hook (COLD OPEN)",
          instruction_note: `
*** STRICT STRUCTURE REQUIREMENT ***
You MUST follow this specific intro template structure:
${introTemplate}

CRITICAL EXECUTION RULES:
1. Do NOT write a generic "Welcome" or "In this guide". Start in the middle of the action.
2. Start IMMEDIATELY with the Hook data point, or contrarian opinion.
3. Make the reader feel the problem before you offer the solution.
4. ${outline.intro.instruction_note}
`,
          keywords_to_include: outline.intro.keywords_to_include
        })

        const writeConfig = {}
        const writeContents = [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n" + userPrompt }],
          },
        ]

        const writeStream = await genAI.models.generateContentStream({
          model: "gemini-2.5-flash",
          config: writeConfig,
          contents: writeContents
        })

        let writeText = ""
        for await (const c of writeStream) {
          writeText += (c as any).text || ""
        }

        currentDraft += `${writeText} \n\n`

        // Real-time Save
        await supabase
          .from("articles")
          .update({ raw_content: currentDraft })
          .eq("id", articleId)
      }

      // Start loop from saved index for checkpoint resumption
      for (let i = startIndex; i < outline.sections.length; i++) {
        const section = outline.sections[i]

        // Update UI
        await supabase
          .from("articles")
          .update({ current_step_index: i + 1, status: "writing" })
          .eq("id", articleId)

        const systemPrompt = generateWritingSystemPrompt(styleDNA, outline, i, brandDetails, articleType)
        // THE BRIDGE: Only pass last 2000 chars to prevent "Echo Chamber" repetition
        const userPrompt = generateWritingUserPrompt(currentDraft.slice(-2000), section)

        // Using Gemini 2.0 Flash for Speed & Context
        const writeConfig = {}
        const writeContents = [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n" + userPrompt }],
          },
        ]

        const writeStream = await genAI.models.generateContentStream({
          model: "gemini-2.5-flash",
          config: writeConfig,
          contents: writeContents
        })

        let writeText = ""
        for await (const c of writeStream) {
          writeText += (c as any).text || ""
        }

        // Append to Snowball - Strip any duplicate heading the LLM might have added
        const headingHash = "#".repeat(section.level || 2)
        const headingPattern = new RegExp(`^\\s*#{1,4}\\s*${section.heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n+`, 'i')
        const cleanedWriteText = writeText.replace(headingPattern, '').trim()
        currentDraft += `${headingHash} ${section.heading} \n\n${cleanedWriteText} \n\n`

        // --- IN-CONTENT IMAGE GENERATION (if section marked for image) ---
        if (section.needs_image && section.image_type) {
          try {
            console.log(`[Section Image] Generating image for: ${section.heading}`)

            // Generate section-specific image prompt
            const sectionImagePrompt = await generateSectionImagePrompt(
              section,
              finalTitle,
              genAI
            )

            // Generate image via Fal.ai
            const sectionImageResult = await generateImage(sectionImagePrompt) as any
            const sectionImageUrl = sectionImageResult?.images?.[0]?.url

            if (sectionImageUrl) {
              // Download and upload to R2
              const sectionImgResponse = await fetch(sectionImageUrl)
              const sectionImgBuffer = Buffer.from(await sectionImgResponse.arrayBuffer())
              const sectionImgFileName = `section-images/${userId}/${brandId}/${articleId}/${Date.now()}.png`

              await putR2Object(sectionImgFileName, sectionImgBuffer)
              const r2Domain = process.env.R2_PUBLIC_DOMAIN || `${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL}`
              const sectionImageR2Url = `${r2Domain}/${sectionImgFileName}`

              // Inject image into markdown (after section content) - single newline to prevent blank space
              currentDraft += `![${section.heading}](${sectionImageR2Url})\n`
              console.log(`[Section Image] Added image for: ${section.heading}`)
            }
          } catch (imgErr) {
            console.error(`[Section Image] Failed for ${section.heading}:`, imgErr)
            // Non-blocking - continue without image
          }
        }

        // Real-time Save
        await supabase
          .from("articles")
          .update({ raw_content: currentDraft })
          .eq("id", articleId)

        // Tiny delay to be safe
        await new Promise(r => setTimeout(r, 500))
      }


      // --- PHASE 5: FINALIZE (Direct HTML Conversion - No AI Polish) ---
      // NOTE: We skip the AI polish step to prevent "regression to the mean" where
      // the polish agent normalizes unique writing style, undoing the burstiness
      // from Phase 4. Also prevents hallucination risk from large context edits.

      // Use currentDraft directly - it's already clean Markdown from Phase 4
      const finalMarkdown = currentDraft

      // Convert Markdown to HTML for public blog view cache
      const finalHtml = await marked.parse(finalMarkdown)

      // --- PHASE 6: SEO META GENERATION ---
      // 1. Generate Slug (Deterministic)
      const slugify = (text: string) => {
        return text
          .toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')     // Replace spaces with -
          .replace(/[^\w\-]+/g, '') // Remove all non-word chars
          .replace(/\-\-+/g, '-')   // Replace multiple - with single -
      }
      const slug = slugify(title || outline.title || keyword)

      // 2. Generate Meta Description (AI)
      const seoSystemPrompt = `You are an expert SEO Specialist. ${getCurrentDateContext()}
      Your task is to generate a compelling, natural, Meta Description for a blog post based on given input outline and keyword.
      INPUT:
      Title: ${finalTitle}
      Keyword: ${keyword}

      REQUIREMENTS:
      - Under 160 characters.
      - Compelling, direct answer, and includes the target keyword naturally.
      - Direct and to the point.
      - No emojis, No special characters i.e. :,;* or No hashtags.
      - If you reference any year, use the CURRENT year from the date context above. NEVER use 2024 or any past year.

      OUTPUT SCHEMA (JSON):
      {
        "meta_description": string
      }
      `

      const seoConfig = { responseMimeType: "application/json" }
      const seoContents = [{ role: "user", parts: [{ text: seoSystemPrompt }] }]

      let meta_description = ""
      try {
        const seoResponse = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          config: seoConfig,
          contents: seoContents
        })
        const seoText = seoResponse.text || ""
        const seoData = cleanAndParse(seoText)

        meta_description = seoData.meta_description
      } catch (e) {
        console.error("SEO Generation failed, using fallback", e)
        // Fallback if AI fails
        meta_description = `Read our guide on ${outline.title}. Learn about ${keyword} and more.`
      }

      // --- PHASE 7: FEATURED IMAGE GENERATION ---
      let featured_image_url = null
      try {
        const imageStyle = brandDetails?.image_style || "stock"

        // 1. Generate Image Prompt with Style-Specific Templates
        const getStyleTemplate = (style: string) => {
          switch (style.toLowerCase()) {
            case 'vector':
              return `STYLE: Hand-drawn digital illustration with a clean, flat, professional aesthetic.

VISUAL APPROACH:
- Use thick black outlines with solid color fills
- Choose a harmonious color palette that fits the topic (AI decides colors)
- Include minimalist illustrations of people, objects, or abstract shapes relevant to the topic
- Add floating elements like icons, cards, or geometric shapes for visual interest
- Background should have a subtle pattern (grid, dots, or gradient) with a prominent background color i.e. white, green, blue, etc. - You are free to decide based on context of the title.

COMPOSITION:
- Balanced layout with clear visual hierarchy
- Title or key concept should be prominent but NOT dominating
- Leave breathing room - don't overcrowd

CONSTRAINTS:
- NO photorealistic elements
- NO stock photo clichés
- Clean, modern, tech-forward aesthetic`

            case 'photorealistic':
            case 'photo':
            case 'stock':
              return `STYLE: High-quality professional editorial photography.

VISUAL APPROACH:
- Realistic, high-resolution photograph
- Soft natural lighting with slight bokeh in background
- Professional color grading (not oversaturated)
- Real people, places, or objects relevant to the topic

COMPOSITION:
- Rule of thirds placement
- Subject slightly off-center for visual interest
- Clean background that doesn't distract

CONSTRAINTS:
- NO obvious stock photo clichés (handshakes, pointing at screens, etc.)
- NO illustrations or vector elements
- Editorial quality, suitable for premium business content`

            case 'minimalist':
              return `STYLE: Ultra-minimal, clean graphic design.

VISUAL APPROACH:
- Maximum 2-3 colors in the palette
- Simple geometric shapes or single iconic element
- Lots of negative space
- Typography-inspired or abstract

CONSTRAINTS:
- NO busy backgrounds
- NO photorealistic elements
- NO cluttered compositions`

            default:
              // Default to vector for unknown styles
              return `STYLE: Clean, professional digital illustration suitable for business blogs.

VISUAL APPROACH:
- Choose the most appropriate visual style for the topic (illustration or subtle photography)
- Professional color palette that conveys trust and expertise
- Include relevant visual elements that represent the article's core message

CONSTRAINTS:
- Professional and premium aesthetic
- Suitable as a blog featured image`
          }
        }

        const styleTemplate = getStyleTemplate(imageStyle)

        const imagePromptSystem = `You are an expert AI Art Director creating a featured image for a blog post.

ARTICLE CONTEXT:
Title: ${finalTitle}
Main Keyword: ${keyword}
Topics Covered: ${outline.sections.map(s => s.heading).join(", ")}
Image Style Preference: ${imageStyle}

${styleTemplate}

TEXT OVERLAY REQUIREMENT:
- Include the text "${keyword.toUpperCase()}" as large, bold text on the image
- Position the text on the left side or center
- Use a clean, modern sans-serif font style
- Ensure high contrast between text and background for readability
- The text should be prominent but integrated with the overall design

YOUR TASK:
Generate a detailed, creative prompt that an AI image generator can use to create this featured image.
- Be SPECIFIC about colors, composition, and visual elements
- Include the text "${keyword.toUpperCase()}" as part of the image design
- Describe the scene or illustration in detail
- The prompt should be 2-3 sentences minimum

OUTPUT: Return ONLY the image generation prompt as plain text. No JSON, no explanations.`

        const imagePromptConfig = { responseMimeType: "text/plain" }
        const imagePromptContents = [{ role: "user", parts: [{ text: imagePromptSystem }] }]

        const imagePromptResponse = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          config: imagePromptConfig,
          contents: imagePromptContents
        })
        const imagePrompt = imagePromptResponse.text || `A professional featured image for a blog post about ${keyword}`

        // 2. Generate Image using Fal.ai
        const imageResult = await generateImage(imagePrompt) as any
        const imageUrl = imageResult?.images?.[0]?.url

        // 3. Upload to R2
        if (imageUrl) {
          const imageResponse = await fetch(imageUrl)
          const imageBuffer = await imageResponse.arrayBuffer()
          const imageKey = `featured-images/${articleId}/${randomUUID()}.png`

          // Upload to R2
          await putR2Object(imageKey, Buffer.from(imageBuffer), "image/png")

          // 4. Construct Public URL - Prioritize public accessibility for CMS/Editor
          const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN?.replace(/\/$/, '')
          const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
          const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, '')}` : null

          if (r2PublicDomain && !r2PublicDomain.includes('localhost')) {
            // Best option: Direct R2 public access
            featured_image_url = `${r2PublicDomain}/${imageKey}`
          } else {
            // Fallback to Proxy route via App URL
            let baseUrl = "http://localhost:3000"

            if (appUrl && !appUrl.includes('localhost')) {
              baseUrl = appUrl
            } else if (vercelUrl) {
              baseUrl = vercelUrl
            } else if (appUrl) {
              baseUrl = appUrl
            }

            featured_image_url = `${baseUrl}/api/images/${imageKey}`
          }

          console.log(`🖼️ Featured image available at: ${featured_image_url}`)
        }

      } catch (e) {
        console.error("Image Generation failed", e)
        // Non-blocking, just continue
      }

      await supabase
        .from("articles")
        .update({
          raw_content: finalMarkdown,
          final_html: finalHtml,
          status: "completed",
          meta_description,
          slug,
          featured_image_url
        })
        .eq("id", articleId)

      // --- NOTIFICATION: SEND EMAIL ---
      if (userId) {
        try {
          const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)

          if (user?.email) {
            console.log(`📧 Sending article ready email to ${user.email}`)

            const emailHtml = await render(ArticleReadyEmail({
              articleTitle: finalTitle || title || keyword,
              articleSlug: slug,
              articleId: articleId,
              featuredImageUrl: featured_image_url,
            }))

            await resend.emails.send({
              from: EMAIL_FROM,
              to: user.email,
              subject: `Your article "${finalTitle || title}" is ready 🚀`,
              html: emailHtml,
              replyTo: EMAIL_REPLY_TO
            })
          }
        } catch (emailErr) {
          console.error("Failed to send article ready email:", emailErr)
          // Non-blocking
        }
      }

      // --- PHASE 8: UPDATE CONTENT PLAN IF APPLICABLE ---
      if (payload.planId && payload.itemId) {
        try {
          // 1. Fetch current plan
          const { data: plan } = await (supabase as any)
            .from("content_plans")
            .select("*")
            .eq("id", payload.planId)
            .single()

          if (plan && plan.plan_data) {
            // 2. Update specific item status
            const updatedPlanData = plan.plan_data.map((item: any) => {
              if (item.id === payload.itemId) {
                return { ...item, status: "published" } // Mark as published when generation completes
              }
              return item
            })

            // 3. Save back
            await (supabase as any)
              .from("content_plans")
              .update({ plan_data: updatedPlanData })
              .eq("id", payload.planId)

            console.log(`Updated content plan ${payload.planId} item ${payload.itemId} to published`)
          }
        } catch (e) {
          console.error("Failed to update content plan status", e)
          // Non-blocking
        }
      }


      // --- PHASE 5: TOPIC MEMORY SAVE ---
      // Upgrade: Use "Title + Keyword" for rich semantic signal
      let topicSignal = keyword
      try {
        const { data: finalRec } = await supabase.from("articles").select("outline").eq("id", articleId).single()
        const finalOutline = finalRec?.outline as any
        if (finalOutline?.title) {
          // Combined signal captures both the specific hook (Title) and core topic (Keyword)
          topicSignal = `${finalOutline.title} : ${keyword}`
        }
      } catch (e) {
        // ignore, stick to keyword
      }

      // Pass the admin client to saveTopicMemory for background job context
      await saveTopicMemory(articleId, topicSignal, supabase)

      // --- PHASE 9: ANSWER COVERAGE INDEXING ---
      // Analyze the completed article outline to extract "Answer Units" for strategic planning
      if (userId) {
        try {
          // Use cluster from payload or derive from keyword prefix
          const coverageCluster = cluster || keyword.split(" ").slice(0, 2).join(" ")
          await analyzeArticleCoverage(
            articleId,
            outline,
            keyword,
            coverageCluster,
            userId,
            brandId,
            supabase
          )
          console.log(`✅ Coverage analysis complete for article ${articleId}`)
        } catch (coverageError) {
          console.error(`⚠️ Coverage analysis failed (non-blocking):`, coverageError)
          // Non-blocking - coverage analysis failure should not fail the article
        }
      }

      return { success: true, articleId }

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      await supabase
        .from("articles")
        .update({ status: "failed", error_message: msg, failed_at_phase: phase })
        .eq("id", payload.articleId)
      throw e
    }
  },
})
