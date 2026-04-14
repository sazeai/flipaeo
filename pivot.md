FlipAEO Pivot Plan

Fwe will amrkgin the code relaetd to agentic writer.. we ar eno buidling agentic intereset automation marketing tool



Here is the final, definitive Product Requirements Document (PRD) for our new psotioning as a Pinterest Marketing Agent for E-Commerce.

We have stripped away the AI hype, the "yes-man" pivots, and the dashboard vanity metrics. This PRD is for a highly defensible, agentic workflow that legacy tools like BlogToPin.com, Tailwindapp.com, and others are structurally incapable of copying without rebuilding their entire codebase.

This is your blueprint.

Product Requirements Document (PRD)

Product Name: EcomPin
Concept: An Autonomous, Closed-Loop Pinterest Marketing Agent for E-Commerce.
Target Audience: Shopify and Etsy store owners selling high-ticket physical products ($50+ AOV).
Pricing Model: Value-based (e.g., $79/mo for 100 autonomous pins).

1. Executive Summary

Legacy Pinterest tools (Tailwind, BlogToPin) are "dumb schedulers." They rely on the user to design the image, write the copy, and interpret the analytics. This results in high user churn (27%+) because users are bad at designing for Pinterest's visual AI, and managing the dashboard is a chore.

EcomPin is not only a dashboard; it is an AI employee. It ingests a raw e-commerce catalog, programmatically generates hyper-realistic lifestyle photography using ai image generation models (preserving the physical product), formats them into editorial pins, publishes them, and most importantly: it autonomously reads the Pinterest Analytics API to see which visual aesthetics get Outbound Clicks, and alters its own future generation prompts to double-down on winners.

2. Core Philosophy & "Anti-Features"

To prevent scope creep and maintain our moat, we must strictly adhere to what we are not building:

NO Canva-style Editor: Users cannot drag and drop text. Humans make ugly, unreadable pins that fail OCR (Optical Character Recognition). We enforce strict, algorithm-approved editorial templates.

NO Manual Scheduling Grid: Users do not pick times or dates. The system manages the drip rate to maintain Pinterest Account Trust Scores and prevent shadowbanning.

NO Vanity Analytics Dashboard: We do not show the user "Impressions" line graphs. We only report one metric: Outbound Clicks (Traffic). The AI handles the micro-optimizations behind the scenes saved in database, (if needed we will be suign this datasbe in future to dipalay if user demands, otherwise it willl be purely be sued for decision makign by the AI).

NO Bloggers: We only accept Shopify/Etsy connections. Bloggers churn. E-commerce owners pay $79/mo happily if the tool generates $300 in sales.

3. The User Journey (The "Set and Forget" Flow)

The entire user interface should take less than 5 minutes to set up.

Onboarding (OAuth): User connects their Shopify/Etsy account and their Pinterest Business account.

Brand Settings:

User uploads their brand logo.
Enters their Brand Name , Brand Description, Store/Brand URL.

User selects their brand font (from a curated list of 10 highly legible, OCR-approved Google Fonts).

User selects their primary aesthetic boundaries (e.g., "Keep it modern, avoid grunge").

The Engine Starts: The user closes the tab. The SaaS takes over completely.

Weekly Report (Email): User receives an email: "EcomPin generated 25 pins this week, resulting in 42 Outbound Clicks to your Shopify store. The 'Minimalist Cafe' aesthetic is currently winning. We are re-allocating next week's generation budget to focus on that aesthetic."

4. System Architecture (The 4-Node Autonomous Engine)

This is the technical heart of the SaaS. It is an asynchronous background engine, orchestrated by a queue system (e.g., Trigger.dev which we already have inbuilt in this project which is used for other purpose currently).

Node 1: The Ingestion & Tagging Node

Action: Syncs with the Shopify/Etsy API.

Process: Pulls the raw product image (usually a shoe/bag on a white background), the Product Title, the Price, and the exact Product URL.
For edge cases, we will use cusotm data option, so that user can upload their own product image, price, description and product url(optional).

Node 2: The Generative "Editorial" Node (The Secret Sauce)

Step A (The Image): Sends the extracted product asset to an advanced sota image model from google.{{i ahve alrady prepared this part, check app/api/generate-pin/route.ts}}

Prompt logic: Dynamic Image Prompts (The "AI Art Director")
Instead of hardcoding the marble background, the system now calls gemini-2.5-flash first. It passes the uploaded image and asks Gemini to act as an "Art Director". Gemini analyzes the product and writes a highly tailored, photorealistic 8k prompt specifically for that item.
Crucially, it explicitly decides where to leave negative space (top, bottom, center, or edges).

we will build a intellingetn logic whihc will learn from the working pins on pintereset which was publsihed by us in previous time. the logic will be stored in database and will be used to generate new prompts. for example if the pin with "Product resting on a clean marble countertop, morning sunlight, soft shadows, photorealistic, 8k --ar 2:3" is working well then the logic will increase the probability of generating this type of prompt in future. if the pin is not working well then the logic will decrease the probability of generating this type of prompt in future.

Constraint: Must force a 2:3 aspect ratio with negative space at the top/bottom. which we are already doing in /api/generate-pin/route.ts

Step B (The Copy): Sends the Shopify Product Title to an LLM. currently i am suing the ai model to udnertsand what is the user product. and then i am generating the pin image. so here we will ave both features the current one and teh new one with shopify product and etsy product title and description. 

Nest we will generate the pin title and description using LLM to publsih on pinterest(may be we will do it after we have succeful pin generated, we will have to check this). Prompt: "Write a minimalist, 3-5 word editorial title for this product. Write a 2-sentence Pinterest description packed with SEO keywords."

Step C (The Final Assembly): Passes the fal.ai generated image and the LLM text into an HTML-to-Image API (like Vercel Satori, Placid, or pure Puppeteer).

Result: The API renders a perfect 1000x1500 JPEG with the brand's font layered elegantly over the AI background, including a subtle shopname.com ↗ at the bottom. i ahve alrady build this tech too in app/api/render-pin/route.ts

Node 3: The Drip Publisher Node

Action: Pushes the final asset to the Pinterest API.

Logic: Limits posting to 1-3 times per day per account. Bypasses the "Trust Sandbox" by never posting the same URL or Image hash twice. we will use the trigger.dev to schedule the pin publishing. also we need to make sure we dont make the user acocutn go shadow banned... 
This is where our "Sandbox / Account Health" protocol silently works.
Our system checks their Pinterest account age and recent activity via API.
If they are posting too much, it automatically spaces the pins out by 3 days to prevent spam flagging.
It auto-assigns the pin to the most relevant board based on keyword matching.
The Output: "Your pin is queued for algorithmic perfection. We will publish it when your account trust score is highest."
how it will work ---
An automated account warm-up sequence. When a user connects a new Pinterest account, your SaaS takes over.
Days 1-14: It auto-generates and pins high-quality, native content with zero URLs to build algorithmic trust.
Days 15-30: It slowly drips in 30% URL pins.
Days 31+: It unlocks full scheduling.
Why it wins: You are selling "guaranteed algorithmic trust." E-commerce brands will gladly pay $79/month just to not get shadowbanned while starting out.

Node 4: The Analytic Brain (The Closed-Loop Moat)

Action: Runs a trigger.dev task every 24 hours(just like we are doign in the old saas in here trigger/scheduler.ts ) to ping the Pinterest Analytics API for pins generated by our system.

Logic:

Pin A (generated with x prompt) = 5 Clicks.

Pin B (generated with y prompt) = 0 Clicks.

The Adjustment: The system updates the database weights for that specific user's catalog. It permanently decreases the probability of the X prompt being used, and increases the Y prompt.

This is why BlogToPin loses. Your SaaS gets mathematically better at generating sales every single day without the user touching it.

5. Minimum Viable Product (MVP) Tech Stack

As a solo developer, you cannot build this on bare metal. You must glue managed services together.

Frontend/Auth/DB: Next.js + Supabase + TailwindCSS. (Clean, minimal dashboard just for OAuth and billing which we already have fully built in the exsiting project, we will just use that).

Background Jobs/Orchestration: Trigger.dev. 

E-commerce Sync: Shopify Admin API & Etsy API.

Image Generation (Diffusion + ControlNet): Google's gemini api for text , Gemini 2.5 Flash and for image generation gemini-3.1-flash-image-preview

Image Assembly (Text Overlay): Vercel Satori (Free, renders HTML/CSS to SVG/PNG instantly), i already built this in app/api/render-pin/route.ts

Publishing/Analytics: Pinterest Developers API.

6. Preemptive Q&A (Why we are doing it this way)

Q: What if the AI generates a weird looking image or messes up the product?
A: We solve this in Onboarding. We tell the user: "We generate 100 pins a month. 10 of them might look weird due to AI artifacts. We don't care, and neither should you. We are optimizing for the 5 pins that go viral and drive $1,000 in sales. This is a volume-and-data game, not a perfection game."

Q: Why don't we let the user manually approve every pin before it goes live?
A: Because human approval breaks the autonomous loop. If they have to log in every day to click "Approve," they will treat it like a chore, get bored, and churn. If the user absolutely demands control, we build a feature where they can "Delete" a live pin from our simple feed, but we NEVER stop the publishing queue to wait for their permission.

Q: BlogToPin is $25/mo. Why are we charging $99/mo?
A: BlogToPin is selling a tool. We are selling an outcome (Lifestyle photography + SEO Management). Hiring a photographer on Fiverr for 10 lifestyle photos costs $150. We are generating hundreds of unique lifestyle variations, perfectly formatted, and auto-optimizing them for less than $100. If we target the right Shopify stores, $99 is an impulse buy.

Final Developer Directive

here is the Node 2 which i ahve build successfully and tested. now we have to plan and build remaning product. pahse by phase.

1. app\pin-generator\page.tsx its the fornt end ... but we are goign autonomous.
2. The Library (@vercel/og) renders the text onto the image
current datasbe database_schema.sql or supabase\migrations and some in utils\supabase\migrations whihc you can utilize by removing , replacing or updating for our new product.
