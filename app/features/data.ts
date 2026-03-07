
export interface FeatureData {
    slug: string;
    featureName: string;
    featureIcon: string;
    primaryKeyword: string;
    secondaryKeywords: string[];

    heroTitle: string;
    heroBadge: string;
    heroSubtitle: string;

    pitch: {
        question: string;
        answer: string;
        highlights: string[];
    };

    inputOutput: {
        title: string;
        subtitle: string;
        input: { label: string; items: string[] };
        output: { label: string; items: string[] };
    };

    pipeline: {
        title: string;
        subtitle: string;
        phases: {
            phase: string;
            name: string;
            duration: string;
            description: string;
            techDetail: string;
        }[];
    };

    deliverable: {
        title: string;
        subtitle: string;
        items: { icon: string; label: string; detail: string }[];
    };

    useCases: {
        title: string;
        subtitle: string;
        items: { persona: string; goal: string; result: string }[];
    };

    comparison: {
        title: string;
        subtitle: string;
        oldWay: { label: string; items: string[] };
        newWay: { label: string; items: string[] };
    };

    faqTitle: string;
    faqSubtitle: string;
    faqs: { question: string; answer: string }[];

    cta: {
        headline: string;
        subheadline: string;
        buttonLabel: string;
        buttonHref: string;
    };

    connectedFeatures: {
        title: string;
        subtitle: string;
        items: { slug: string; relationship: string }[];
    };
}

export const features: Record<string, FeatureData> = {

    'ai-seo-writer': {
        slug: 'ai-seo-writer',
        featureName: 'AI SEO Writer',
        featureIcon: 'PenTool',
        primaryKeyword: 'AI SEO Writer',
        secondaryKeywords: ['ai content writer', 'seo article generator', 'ai blog writer', 'automated seo content'],

        heroTitle: 'The AI Writer That Researches Before It Writes',
        heroBadge: 'CORE ENGINE',
        heroSubtitle: 'Most AI writers generate from stale training data. FlipAEO runs live web research, builds a structured outline, then writes section-by-section with your brand voice — producing articles that contain data your competitors don\'t have.',

        pitch: {
            question: 'What is the FlipAEO AI SEO Writer?',
            answer: 'A multi-agent content pipeline that autonomously researches, outlines, writes, generates images, and formats publish-ready SEO articles. It uses live Tavily web research (not just LLM training data), the "Context Snowball" writing method to prevent quality degradation, and your Style DNA profile to match your brand voice.',
            highlights: [
                'Live web research via Tavily — not hallucinated facts from training data',
                'Section-by-section Snowball writing prevents mid-article quality collapse',
                'Style DNA ensures every article sounds like your brand, not ChatGPT',
                'Automatic H2/H3/H4 hierarchy, bold entities, data tables, and citation links',
                'AI-generated in-content images with Text Safety Firewall'
            ]
        },

        inputOutput: {
            title: 'What Goes In, What Comes Out',
            subtitle: 'The concrete input-to-output contract of the AI Writer.',
            input: {
                label: 'YOU PROVIDE',
                items: [
                    'A target keyword (e.g. "best crm for startups")',
                    'Your brand profile (Style DNA, brand context)',
                    'Article type: informational, commercial, or how-to',
                    'Optional: specific title, supporting keywords, cluster context'
                ]
            },
            output: {
                label: 'YOU RECEIVE',
                items: [
                    '2,500–4,000 word research-backed article',
                    'Proper H2 → H3 → H4 heading hierarchy',
                    'Bold key entities + inline data tables',
                    'Up to 3 AI-generated contextual images',
                    'External citation links to authority sources',
                    'Internal links to your existing content',
                    'SEO meta title + meta description',
                    'Featured image (AI-generated)'
                ]
            }
        },

        pipeline: {
            title: 'The 7-Phase Pipeline',
            subtitle: 'What actually happens when you click "Generate" — mapped from generate-blog.ts.',
            phases: [
                {
                    phase: '01',
                    name: 'Brand Context Load',
                    duration: '~2s',
                    description: 'Fetches your brand profile, Style DNA, and internal links pool from the database. This context shapes every decision downstream.',
                    techDetail: 'Pulls brand_details + style_dna + internal_links with semantic embeddings for contextual linking.'
                },
                {
                    phase: '02',
                    name: 'Deep Web Research',
                    duration: '~30s',
                    description: 'Tavily searches the live web for your keyword. Broad search gathers the competitive landscape. Then the Critic Agent identifies what data is MISSING from top results.',
                    techDetail: '2-phase: Broad Search → Critic Gap Analysis → Sniper Search for missing data → Final Synthesis into a structured fact sheet.'
                },
                {
                    phase: '03',
                    name: 'Outline Architecture',
                    duration: '~20s',
                    description: 'Gemini 2.5 Flash generates a structured outline with H2/H3/H4 hierarchy, per-section keyword targets, image positions, external citation placements, and internal link assignments.',
                    techDetail: 'Outline passes Zod schema validation with self-correcting retry. Link Enrichment cross-references existing articles to prevent topic overlap.'
                },
                {
                    phase: '04',
                    name: 'Section-by-Section Writing',
                    duration: '~90s',
                    description: 'Each section is written individually with full context from previous sections (the Context Snowball). Your Style DNA is injected into every sentence. No single-prompt degradation.',
                    techDetail: 'Each section receives: system prompt (outline + Style DNA + brand context) + user prompt (previous section tail + current section instructions).'
                },
                {
                    phase: '05',
                    name: 'Image Generation',
                    duration: '~30s',
                    description: 'Up to 3 sections flagged for visuals get AI-generated images via Fal.ai. The Text Safety Firewall rewrites any prompt that would produce broken typography.',
                    techDetail: 'Image prompts are generated by Gemini, filtered through the Firewall, then sent to Fal.ai. Images uploaded to cloud storage and injected into article markdown.'
                },
                {
                    phase: '06',
                    name: 'Polish & Meta Generation',
                    duration: '~10s',
                    description: 'Generates SEO meta title, meta description, and featured image. Assembles the final markdown with all sections, images, links, and formatting.',
                    techDetail: 'Final article saved to DB. If connected to CMS (WordPress/Webflow/Shopify), auto-publishes as draft or live post.'
                },
                {
                    phase: '07',
                    name: 'Notification & Delivery',
                    duration: '~2s',
                    description: 'Sends email notification that your article is ready. Updates content plan status if this article was part of a scheduled plan.',
                    techDetail: 'Uses Resend for transactional email with the ArticleReadyEmail React template.'
                }
            ]
        },

        deliverable: {
            title: 'What You Get After Clicking Generate',
            subtitle: 'Every article comes ready to copy-paste into your CMS and hit publish.',
            items: [
                { icon: 'FileText', label: 'PUBLISH-READY ARTICLE', detail: 'A complete long-form article you can publish immediately — no editing required. Reads like it was written by a senior content writer, not a chatbot.' },
                { icon: 'Image', label: 'CUSTOM IMAGES INCLUDED', detail: 'Up to 3 original images already placed inside the article. No stock photos, no searching for visuals — it\'s done for you.' },
                { icon: 'Search', label: 'SEO-READY FROM DAY ONE', detail: 'Meta title, meta description, and featured image are pre-written. Internal and external links are already placed. Just publish.' },
                { icon: 'Mail', label: 'EMAIL WHEN IT\'S DONE', detail: 'You don\'t need to watch it generate. Walk away, and you\'ll get an email notification the moment your article is ready to review.' }
            ]
        },

        useCases: {
            title: 'Who Uses the AI Writer',
            subtitle: 'Real scenarios where teams switch from manual writing to FlipAEO.',
            items: [
                { persona: 'Solo SaaS Founder', goal: 'Publish 3 blog posts per week without hiring a content writer', result: 'Generates research-backed articles in 5 minutes — equivalent to a $200/article freelancer.' },
                { persona: 'SEO Agency', goal: 'Scale client content deliverables without scaling headcount', result: 'Produce 30+ articles per month per client with brand-matched voice and live research data.' },
                { persona: 'Content Marketing Manager', goal: 'Maintain publishing consistency during team vacations or understaffing', result: 'Queue articles with One-Click mode — the pipeline runs autonomously while you focus on strategy.' },
                { persona: 'E-Commerce Brand', goal: 'Create product category pages and buyer guides that rank', result: 'Commercial article type generates comparison-style, product-focused content with data tables.' },
                { persona: 'Local Business Owner', goal: 'Build topical authority in your service area without writing expertise', result: 'Enter your keywords, get publish-ready articles with proper heading structure and internal linking.' }
            ]
        },

        comparison: {
            title: 'The Old Way vs. FlipAEO',
            subtitle: 'What changes when you stop writing manually or prompting ChatGPT.',
            oldWay: {
                label: 'MANUAL / CHATGPT',
                items: [
                    '4–6 hours per article (research + writing + formatting)',
                    'No live data — LLM generates from stale training data',
                    'Single-prompt generation degrades after paragraph 4',
                    'Generic voice — sounds like every other AI article',
                    'No images unless you create them separately',
                    'Manual meta tags, manual internal linking',
                    'Copy-paste into CMS, fix formatting manually'
                ]
            },
            newWay: {
                label: 'WITH FLIPAEO',
                items: [
                    '2–5 minutes per article (fully autonomous)',
                    'Live Tavily research with Critic gap analysis',
                    'Section-by-section Snowball prevents quality degradation',
                    'Style DNA enforces your brand voice on every sentence',
                    'Up to 3 AI-generated images auto-inserted',
                    'Auto meta tags, auto internal + external linking',
                    'Direct CMS publish (WordPress, Webflow, Shopify)'
                ]
            }
        },

        faqTitle: 'AI SEO Writer FAQ',
        faqSubtitle: 'Technical answers about the content generation pipeline.',
        faqs: [
            { question: 'Does it just use ChatGPT under the hood?', answer: 'No. The pipeline uses Gemini 2.5 Flash for outline and writing, Tavily for live web research, and Fal.ai for image generation. It\'s a multi-agent system, not a single LLM prompt.' },
            { question: 'How does it avoid AI-sounding language?', answer: 'Your Style DNA profile is injected into every writing prompt. The Code of Authenticity explicitly bans phrases like "In today\'s fast-paced digital landscape" and "Let\'s dive in." The output sounds like your brand, not a chatbot.' },
            { question: 'Can I edit the outline before writing starts?', answer: 'Yes. Standard mode pauses after outline generation so you can review, reorder, add, or remove sections. One-click mode skips this and runs the full pipeline autonomously.' },
            { question: 'What if the research data is wrong?', answer: 'Tavily searches the live web, so data is current. The Critic Agent cross-validates findings and flags contradictions. However, we recommend reviewing factual claims for sensitive topics.' },
            { question: 'Does it handle keyword cannibalization?', answer: 'Yes. The Link Enrichment phase checks your existing published content via semantic embeddings. If a section overlaps with an existing article, it injects a link instruction instead of re-covering the topic.' },
            { question: 'Can I generate in languages other than English?', answer: 'Currently optimized for English. Multi-language support is on the roadmap.' }
        ],

        cta: {
            headline: 'Generate Your First Article in 5 Minutes.',
            subheadline: 'No prompt engineering required. Enter a keyword, get a publish-ready article.',
            buttonLabel: 'Start Writing Free',
            buttonHref: '/login'
        },

        connectedFeatures: {
            title: 'Connected Features',
            subtitle: 'The AI Writer is the production engine. These features feed and extend it.',
            items: [
                { slug: 'topic-cluster-generator', relationship: 'Feeds articles into' },
                { slug: 'auto-blogging-software', relationship: 'Powers' },
                { slug: 'undetectable-ai-content', relationship: 'Applies to output' }
            ]
        }
    },

    'ai-search-visibility': {
        slug: 'ai-search-visibility',
        featureName: 'AI Search Visibility',
        featureIcon: 'Eye',
        primaryKeyword: 'AI Search Visibility',
        secondaryKeywords: ['get cited by chatgpt', 'perplexity seo', 'ai answer engine optimization', 'appear in ai search results'],

        heroTitle: 'Get Your Brand Cited by ChatGPT, Perplexity & Gemini',
        heroBadge: 'AI SEARCH',
        heroSubtitle: 'Your competitors are already showing up in AI-generated answers. If your brand isn\'t getting cited when people ask AI about your industry, you\'re losing traffic you\'ll never see in Google Analytics. FlipAEO creates the kind of content that AI engines actually reference.',

        pitch: {
            question: 'Why is my brand invisible in AI search?',
            answer: 'AI search engines like Perplexity, ChatGPT, and Gemini don\'t crawl the web like Google. They cite sources that are structured clearly, backed by data, and written as authoritative references. Most blog content isn\'t built for this. FlipAEO creates content that\'s specifically structured to get picked up and cited by AI answer engines.',
            highlights: [
                'AI engines cite content with clear data, specific facts, and structured answers — not generic blog posts',
                'Every FlipAEO article is researched from live web data, making it a credible, citable source',
                'Proper heading hierarchy and entity markup help AI engines understand and extract your content',
                'Internal linking builds topical authority — the #1 signal AI engines use to choose which sources to cite',
                'Your brand name and domain appear naturally throughout, increasing citation likelihood'
            ]
        },

        inputOutput: {
            title: 'What Goes In, What Comes Out',
            subtitle: 'How FlipAEO content gets your brand into AI answers.',
            input: {
                label: 'YOU PROVIDE',
                items: [
                    'Your brand profile and industry niche',
                    'The questions your audience is asking AI (target queries)',
                    'Your competitors (the brands currently getting cited instead of you)',
                    'Your existing content library to build on'
                ]
            },
            output: {
                label: 'WHAT HAPPENS',
                items: [
                    'Content optimized to be cited by AI answer engines, not just ranked on Google',
                    'Articles structured as authoritative references with data, facts, and clear answers',
                    'Topical clusters that build the domain authority AI engines look for',
                    'Your brand and expertise woven into every answer so AI cites YOU, not your competitor',
                    'Growing "Share of Answer" — the percentage of AI queries where your brand appears'
                ]
            }
        },

        pipeline: {
            title: 'How FlipAEO Makes Your Brand Citable',
            subtitle: 'The specific things that make AI engines choose your content over everyone else\'s.',
            phases: [
                { phase: '01', name: 'Answer-First Structure', duration: 'Every article', description: 'Each article leads with a direct, clear answer to the target query. AI engines pull from content that answers questions concisely — not content that buries the answer in paragraph 8.', techDetail: 'The pitch section on each article acts as a zero-click answer that AI can extract directly.' },
                { phase: '02', name: 'Data-Backed Claims', duration: 'Every article', description: 'FlipAEO researches the live web before writing. Every claim is backed by specific data, statistics, and named sources — exactly what AI engines need to feel confident citing your content.', techDetail: 'Vague statements like "many experts agree" get replaced with specific facts AI can verify.' },
                { phase: '03', name: 'Entity-Rich Content', duration: 'Every article', description: 'Your brand name, product names, and industry terms are embedded naturally throughout. When AI engines encounter your brand repeatedly across authoritative content, they start citing it.', techDetail: 'Bold key entities, structured data, and consistent brand mentions build recognition.' },
                { phase: '04', name: 'Topical Authority Building', duration: 'Across your blog', description: '30-article topic clusters cover your niche comprehensively. AI engines favor sources that demonstrate deep expertise on a subject — not sites with a few scattered blog posts.', techDetail: 'Interlinked clusters signal to AI that your site is the go-to resource for this topic.' },
                { phase: '05', name: 'Freshness & Frequency', duration: 'Ongoing', description: 'AI engines prioritize recent, regularly updated sources. Auto-blogging ensures your content is always fresh, signaling to AI that your site is active and current.', techDetail: 'Stale blogs get deprioritized. Consistent publishing keeps your content in the citation pool.' }
            ]
        },

        deliverable: {
            title: 'What Changes When Your Brand Becomes Citable',
            subtitle: 'The results you see as AI engines start referencing your content.',
            items: [
                { icon: 'MessageSquare', label: 'AI STARTS MENTIONING YOUR BRAND', detail: 'When someone asks Perplexity or ChatGPT a question in your niche, your brand shows up in the answer — with a link back to your site.' },
                { icon: 'TrendingUp', label: 'TRAFFIC FROM A CHANNEL YOU CAN\'T BUY', detail: 'AI search traffic can\'t be bought with ads. It comes from being authoritative. Once you\'re in, competitors can\'t outbid you.' },
                { icon: 'Users', label: 'YOUR COMPETITORS LOSE GROUND', detail: 'AI citations are zero-sum. When your brand starts getting cited, it\'s often replacing a competitor who had that slot before.' },
                { icon: 'Shield', label: 'FUTURE-PROOF YOUR SEO STRATEGY', detail: 'Google traffic is declining as AI search grows. Brands that optimize for AI citations now will own the next decade of search.' }
            ]
        },

        useCases: {
            title: 'Who Needs AI Search Visibility',
            subtitle: 'If your customers are using AI to make decisions, you need to be in those answers.',
            items: [
                { persona: 'SaaS Founder', goal: 'Get your product recommended when people ask AI "what\'s the best tool for X"', result: 'Topical authority content makes AI engines recognize your brand as the go-to answer for your category.' },
                { persona: 'E-Commerce Brand', goal: 'Show up when shoppers ask AI for product recommendations in your niche', result: 'Data-rich product content and buyer guides become the sources AI cites when recommending products.' },
                { persona: 'B2B Company', goal: 'Be cited as an industry authority when prospects research solutions through AI', result: 'Comprehensive thought leadership content positions your brand as the expert AI engines trust.' },
                { persona: 'Agency (for clients)', goal: 'Offer AI search optimization as a new service to justify higher retainers', result: 'Measurable "Share of Answer" growth gives clients a new KPI beyond traditional keyword rankings.' }
            ]
        },

        comparison: {
            title: 'Traditional SEO vs. AI Search Optimization',
            subtitle: 'Ranking on Google page 1 doesn\'t mean AI will cite you.',
            oldWay: {
                label: 'TRADITIONAL SEO ONLY',
                items: [
                    'Optimizes for Google\'s ranking algorithm only',
                    'Keyword-stuffed content that AI engines can\'t extract clean answers from',
                    'Thin content that covers topics superficially',
                    'No topical authority — random blog posts on disconnected topics',
                    'Invisible in Perplexity, ChatGPT, Gemini answers',
                    'Losing traffic as users shift to AI search'
                ]
            },
            newWay: {
                label: 'WITH FLIPAEO',
                items: [
                    'Optimized for both Google AND AI answer engines',
                    'Answer-first content structure that AI can extract and cite',
                    'Deep, data-backed articles that establish genuine authority',
                    'Topic clusters that signal comprehensive niche expertise',
                    'Your brand appears in AI-generated answers with backlinks',
                    'Capturing the fastest-growing search channel'
                ]
            }
        },

        faqTitle: 'AI Search Visibility FAQ',
        faqSubtitle: 'Questions about getting your brand cited by AI search engines.',
        faqs: [
            { question: 'How long does it take to start appearing in AI answers?', answer: 'Most brands see initial citations within 4-8 weeks of consistent publishing. Topical authority compounds — the more quality content in a cluster, the faster AI engines start trusting your domain.' },
            { question: 'Does Google SEO still matter?', answer: 'Absolutely. Google is still the biggest traffic source. But AI search is growing 10x faster. FlipAEO content is optimized for both — you don\'t have to choose.' },
            { question: 'Which AI platforms will cite my content?', answer: 'Perplexity is the most citation-heavy (it always shows sources). ChatGPT, Gemini, and SearchGPT also cite sources, especially for factual and product-related queries.' },
            { question: 'Can I track whether AI is actually citing my brand?', answer: 'Yes. FlipAEO includes visibility monitoring that shows your Share of Answer across AI platforms and how it changes over time.' }
        ],

        cta: {
            headline: 'Start Showing Up in AI Search.',
            subheadline: 'Your competitors are already getting cited. Don\'t let them own the AI answer box in your niche.',
            buttonLabel: 'Get Visible',
            buttonHref: '/login'
        },

        connectedFeatures: {
            title: 'Connected Features',
            subtitle: 'AI visibility is built on content quality. These features create the content that gets cited.',
            items: [
                { slug: 'ai-seo-writer', relationship: 'Creates citable content via' },
                { slug: 'topic-cluster-generator', relationship: 'Builds topical authority with' },
                { slug: 'auto-blogging-software', relationship: 'Maintains freshness via' }
            ]
        }
    },

    'auto-blogging-software': {
        slug: 'auto-blogging-software',
        featureName: 'Strategic Auto-Blogging',
        featureIcon: 'RefreshCw',
        primaryKeyword: 'Auto Blogging Software',
        secondaryKeywords: ['automated blog posting', 'auto blog generator', 'scheduled content automation', 'hands-free blogging'],

        heroTitle: 'A Content Engine That Publishes While You Sleep',
        heroBadge: 'AUTOMATION',
        heroSubtitle: 'Not "auto-blogging" in the spam sense. This is strategic automation: a 30-article content plan generated from competitive intelligence, each article produced just-in-time with live research, and published to your CMS on a consistent schedule.',

        pitch: {
            question: 'How is this different from other auto-blogging tools?',
            answer: 'Most auto-bloggers batch-generate thin articles from LLM training data and dump them on a schedule. FlipAEO generates each article just-in-time using the full 7-phase AI Writer pipeline — live Tavily research, structured outlining, Snowball writing, image generation. Every article is individually researched, not a cookie-cutter template.',
            highlights: [
                'Strategic 30-article plans from competitive gap analysis — not random topics',
                'Just-in-time generation ensures live research data at time of publishing',
                'Full 7-phase AI Writer pipeline for every article (not batch-generated slop)',
                'Configurable publishing velocity: daily, M/W/F, or custom schedule',
                'Direct CMS publishing to WordPress, Webflow, or Shopify'
            ]
        },

        inputOutput: {
            title: 'What Goes In, What Comes Out',
            subtitle: 'The automation contract.',
            input: {
                label: 'YOU CONFIGURE',
                items: [
                    'Your brand profile and niche context',
                    'Publishing schedule (e.g. Mon/Wed/Fri at 10 AM)',
                    'CMS connection (WordPress, Webflow, or Shopify)',
                    'Draft Mode (review first) or Auto-Publish (hands-free)'
                ]
            },
            output: {
                label: 'THE SYSTEM DELIVERS',
                items: [
                    'Strategic 30-article content plan from Topical Authority Audit',
                    'Each article auto-generated just-in-time with live research',
                    'Published to your CMS at the scheduled date/time',
                    'Consistent publishing velocity week after week',
                    'Email notifications as each article completes'
                ]
            }
        },

        pipeline: {
            title: 'The Automation Pipeline',
            subtitle: 'What runs in the background without your involvement.',
            phases: [
                { phase: '01', name: 'Strategic Plan Generation', duration: '~5 min', description: 'The Topic Cluster Generator runs a full Topical Authority Audit and produces a 30-article plan with cluster hierarchy, keyword targets, and internal linking maps.', techDetail: 'Runs generate-plan.ts: sitemap sync → topical audit → strategic plan → semantic deduplication.' },
                { phase: '02', name: 'Calendar Scheduling', duration: 'Instant', description: 'Articles are distributed across your calendar based on configured publishing velocity. Pillar articles are scheduled first, then spokes.', techDetail: 'Respects cluster hierarchy: Pillars → Primary Spokes → Supporting articles.' },
                { phase: '03', name: 'Just-in-Time Article Generation', duration: '2-5 min each', description: 'When a scheduled date arrives, the AI Writer activates: live research, outline, section-by-section writing, images, meta generation.', techDetail: 'Full generate-blog.ts pipeline runs for each article independently. No pre-generation.' },
                { phase: '04', name: 'CMS Publishing', duration: '~10s', description: 'The formatted article is pushed to your connected CMS. Draft Mode creates an unpublished draft. Auto-Publish pushes it live immediately.', techDetail: 'Native API integrations. Article arrives with formatting, categories, tags, and featured image.' },
                { phase: '05', name: 'Status Updates', duration: '~2s', description: 'Content plan status is updated, email notification sent, and the calendar moves to the next scheduled article.', techDetail: 'Plan item marked "completed." Next article in queue activates when its date arrives.' }
            ]
        },

        deliverable: {
            title: 'What You Get Without Lifting a Finger',
            subtitle: 'Set it up once. Your blog grows on autopilot.',
            items: [
                { icon: 'FileText', label: 'ARTICLES THAT PUBLISH THEMSELVES', detail: 'Full articles appear on your blog on schedule. You don\'t write them, edit them, or upload them — they just show up, published.' },
                { icon: 'Calendar', label: 'A BLOG THAT NEVER GOES QUIET', detail: 'Whether you\'re on vacation, in meetings, or focused on product — your blog keeps publishing like clockwork.' },
                { icon: 'BarChart3', label: 'GROWING ORGANIC TRAFFIC', detail: 'Each published article targets a specific keyword from your strategy. Over weeks, your search traffic compounds without extra effort.' },
                { icon: 'Link', label: 'ARTICLES THAT LINK TO EACH OTHER', detail: 'Every new article links back to your existing content. Your blog becomes an interconnected hub, not a pile of disconnected posts.' }
            ]
        },

        useCases: {
            title: 'Who Uses Auto-Blogging',
            subtitle: 'Teams that need consistent publishing without constant manual effort.',
            items: [
                { persona: 'Bootstrapped Startup', goal: 'Build organic traffic without a content team budget', result: 'Set up one 30-article plan, configure weekly publishing, and let the system build your blog while you build product.' },
                { persona: 'SEO Agency (Multi-Client)', goal: 'Deliver ongoing content for 10+ clients without hiring more writers', result: 'Each client gets their own brand profile and automated plan — articles publish under their domain and voice.' },
                { persona: 'Affiliate Marketer', goal: 'Scale niche sites with consistent high-quality content', result: 'Auto-publish 3-5 articles per week per niche site with commercial and informational mix.' },
                { persona: 'Marketing Director', goal: 'Maintain publishing velocity during team transitions or hiring freezes', result: 'The content engine doesn\'t take PTO. Articles generate and publish on schedule regardless of team capacity.' }
            ]
        },

        comparison: {
            title: 'The Old Way vs. FlipAEO',
            subtitle: 'Why traditional auto-blogging has a bad reputation.',
            oldWay: {
                label: 'TRADITIONAL AUTO-BLOGGERS',
                items: [
                    'Batch-generate 30 thin articles from keyword lists',
                    'No research — content from LLM training data only',
                    'All articles generated Day 1, published over weeks (stale data)',
                    'Random topics with no strategic clustering',
                    'Generic 500-word posts that Google ignores',
                    'No images, no internal linking, no meta optimization'
                ]
            },
            newWay: {
                label: 'WITH FLIPAEO',
                items: [
                    'Strategic 30-article plan from competitive gap analysis',
                    'Live Tavily research for every article',
                    'Just-in-time generation ensures fresh data at publish date',
                    'Cluster-aware sequencing (Pillar → Spokes)',
                    '2,500-4,000 word articles with images and citations',
                    'Full SEO optimization: meta, internal links, formatting'
                ]
            }
        },

        faqTitle: 'Auto-Blogging FAQ',
        faqSubtitle: 'Questions about hands-free content publishing.',
        faqs: [
            { question: 'Is this the same as autoblogging spam?', answer: 'No. Traditional autobloggers scrape or spin existing content. FlipAEO runs the full 7-phase AI Writer pipeline for each article — live research, structured outlining, section-by-section writing, image generation. Each article is individually crafted.' },
            { question: 'Can I review articles before they publish?', answer: 'Yes. Draft Mode pushes articles to your CMS as unpublished drafts. You review and publish manually. Auto-Publish mode publishes immediately for fully hands-free operation.' },
            { question: 'What happens if generation fails for one article?', answer: 'Built-in retry logic attempts generation again. If it fails twice, the article is flagged for manual attention and the next scheduled article proceeds normally.' },
            { question: 'Can I add manual articles to the schedule?', answer: 'Yes. You can mix automated articles from the plan with manually added topics on the same calendar.' }
        ],

        cta: {
            headline: 'Build Your Content Engine.',
            subheadline: 'Set up a 30-article content plan and let the system publish while you focus on growth.',
            buttonLabel: 'Start Automating',
            buttonHref: '/login'
        },

        connectedFeatures: {
            title: 'Connected Features',
            subtitle: 'Auto-blogging orchestrates the full content engine.',
            items: [
                { slug: 'topic-cluster-generator', relationship: 'Powered by' },
                { slug: 'ai-seo-writer', relationship: 'Built on' },
                { slug: 'ai-content-calendar', relationship: 'Displayed in' }
            ]
        }
    },

    'undetectable-ai-content': {
        slug: 'undetectable-ai-content',
        featureName: 'Undetectable AI Content',
        featureIcon: 'Shield',
        primaryKeyword: 'Undetectable AI Content',
        secondaryKeywords: ['ai content detection bypass', 'humanize ai content', 'ai writing that passes detection', 'undetectable ai writing'],

        heroTitle: 'AI-Generated Content That Reads Like a Human Expert Wrote It',
        heroBadge: 'AUTHENTICITY ENGINE',
        heroSubtitle: 'The problem isn\'t AI content. The problem is AI content that SOUNDS like AI content. Style DNA, the Code of Authenticity, and section-by-section Snowball writing produce articles that AI detectors can\'t flag — because they genuinely read like human writing.',

        pitch: {
            question: 'How does FlipAEO produce undetectable AI content?',
            answer: 'Three systems work together: Style DNA injects your brand\'s specific voice patterns into every sentence. The Code of Authenticity bans 50+ AI cliché phrases. And the Snowball writing method generates each section individually with accumulated context, preventing the repetitive patterns that AI detectors look for.',
            highlights: [
                'Style DNA enforces your brand\'s unique voice — not generic "AI voice"',
                'Code of Authenticity explicitly bans 50+ AI cliché phrases',
                'Section-by-section writing prevents the repetitive patterns detectors look for',
                'Varied sentence length, active voice, and specific examples — not vague platitudes',
                'The result reads like a knowledgeable human expert, not a language model'
            ]
        },

        inputOutput: {
            title: 'What Goes In, What Comes Out',
            subtitle: 'How authenticity is built into the pipeline.',
            input: {
                label: 'THE SYSTEM USES',
                items: [
                    'Your Style DNA profile (extracted from your existing content)',
                    'Code of Authenticity ban list (50+ flagged phrases)',
                    'Section-by-section Snowball architecture',
                    'Brand context: industry jargon, tone, perspective, examples'
                ]
            },
            output: {
                label: 'THE ARTICLE READS LIKE',
                items: [
                    'A knowledgeable industry expert sharing insights',
                    'Natural sentence rhythm — varied lengths, active voice',
                    'Specific examples and data, not vague generalizations',
                    'Your brand\'s tone and perspective, not "helpful AI assistant"',
                    'Zero instances of "In today\'s digital landscape" or "Let\'s dive in"'
                ]
            }
        },

        pipeline: {
            title: 'How Authenticity Is Engineered',
            subtitle: 'Three systems that work together to eliminate the "AI voice."',
            phases: [
                { phase: '01', name: 'Style DNA Extraction', duration: 'One-time setup', description: 'During onboarding, FlipAEO analyzes your existing content to extract your brand\'s unique voice patterns: sentence structure, vocabulary preferences, tone, and perspective.', techDetail: 'Style DNA is stored as a paragraph-length profile in brand_details and injected into every writing prompt.' },
                { phase: '02', name: 'Code of Authenticity Injection', duration: 'Built into every prompt', description: 'Every writing prompt includes an explicit ban list of 50+ AI cliché triggers. The LLM is instructed to avoid these patterns and use natural alternatives.', techDetail: 'Includes: "In today\'s fast-paced," "Let\'s dive in," "game-changer," "tapestry," "leverage," etc.' },
                { phase: '03', name: 'Snowball Writing Architecture', duration: 'During writing phase', description: 'Instead of generating the full article in one prompt (which creates repetitive patterns), each section is written individually with rolling context from previous sections.', techDetail: 'Each section gets: previous section tail (500 chars) + full outline context + section-specific instructions. This prevents pattern repetition across sections.' },
                { phase: '04', name: 'Fact-Grounded Content', duration: 'During research phase', description: 'Live Tavily research injects real data, statistics, and examples — replacing the vague generalizations that AI detectors flag as synthetic.', techDetail: 'Specific data points (e.g. "42% of marketers reported...") are naturally woven into the text, not bolted on.' }
            ]
        },

        deliverable: {
            title: 'What Your Published Content Looks Like',
            subtitle: 'The difference between FlipAEO output and typical AI content.',
            items: [
                { icon: 'Fingerprint', label: 'SOUNDS LIKE YOUR BRAND', detail: 'Readers think your team wrote it. Your tone, your vocabulary, your perspective — consistent across every single article.' },
                { icon: 'Eye', label: 'READERS STAY AND READ', detail: 'No robotic phrasing that makes visitors bounce. Content flows naturally, keeps readers engaged, and doesn\'t trigger the "this is AI" reflex.' },
                { icon: 'Shield', label: 'SAFE FOR CLIENT DELIVERY', detail: 'Agencies and freelancers can confidently deliver this content to clients. No awkward conversations about AI-generated copy.' }
            ]
        },

        useCases: {
            title: 'Who Needs Undetectable Content',
            subtitle: 'Anyone whose audience or platform penalizes detectable AI writing.',
            items: [
                { persona: 'Freelance Writer', goal: 'Use AI assistance without clients flagging your content as AI-generated', result: 'Style DNA matches your personal writing voice — clients see your tone, not a chatbot\'s.' },
                { persona: 'University Marketing Team', goal: 'Produce thought leadership content that passes institutional AI policies', result: 'Code of Authenticity eliminates the cliché patterns that plagiarism tools flag. Content reads like faculty expertise.' },
                { persona: 'Brand Content Lead', goal: 'Scale content production without the "AI slop" quality drop', result: 'Every article sounds like your senior writer produced it — consistent brand voice across 30+ articles per month.' },
                { persona: 'News & Media Publisher', goal: 'Supplement editorial capacity without losing editorial standards', result: 'Section-by-section writing with real research data produces content that reads like investigative journalism, not a press release rewrite.' }
            ]
        },

        comparison: {
            title: 'The Old Way vs. FlipAEO',
            subtitle: 'Why "humanizing" AI content after generation doesn\'t work.',
            oldWay: {
                label: 'POST-HOC HUMANIZATION',
                items: [
                    'Generate with ChatGPT, then run through a "humanizer" tool',
                    'Humanizer swaps words with synonyms — sounds unnatural',
                    'Original content still has repetitive structure underneath',
                    'No brand voice — just shuffled generic text',
                    'Detectors are trained on humanizer output patterns too',
                    'Two-step process: generate garbage, then polish garbage'
                ]
            },
            newWay: {
                label: 'WITH FLIPAEO',
                items: [
                    'Authenticity built INTO the generation, not applied AFTER',
                    'Style DNA shapes every sentence during creation',
                    'Section-by-section writing prevents pattern repetition at source',
                    'Real research data replaces vague AI generalizations',
                    'No post-processing needed — output is authentic from the start',
                    'One-step process: generate content that\'s already authentic'
                ]
            }
        },

        faqTitle: 'Undetectable AI Content FAQ',
        faqSubtitle: 'Questions about AI detection and content authenticity.',
        faqs: [
            { question: 'Does FlipAEO guarantee content passes AI detectors?', answer: 'No tool can guarantee 100% bypass of all detectors, as detection methods evolve constantly. What we guarantee is that the content is structurally different from typical AI output — it uses your voice, real data, and varied patterns that detectors aren\'t trained to flag.' },
            { question: 'Is it ethical to create undetectable AI content?', answer: 'We believe the goal isn\'t to "trick" readers — it\'s to produce content that genuinely reads well. AI clichés and repetitive patterns are bad writing regardless of detection. Authentic voice, real data, and natural flow make better content for humans AND search engines.' },
            { question: 'What is the Code of Authenticity?', answer: 'An explicit ban list of 50+ phrases commonly flagged as AI-generated: "In today\'s digital landscape," "Let\'s dive in," "game-changer," "it\'s important to note that," etc. These are removed at the prompt level, not post-processed.' },
            { question: 'Does Style DNA improve over time?', answer: 'Your Style DNA profile is extracted during onboarding. You can update it anytime by providing new writing samples or adjusting the profile parameters.' }
        ],

        cta: {
            headline: 'Write Content That Sounds Like You.',
            subheadline: 'Not like a chatbot. Not like a synonym shuffler. Like your brand.',
            buttonLabel: 'Set Up Your Voice',
            buttonHref: '/login'
        },

        connectedFeatures: {
            title: 'Connected Features',
            subtitle: 'Authentic voice is applied across every content feature.',
            items: [
                { slug: 'ai-seo-writer', relationship: 'Applied within' },
                { slug: 'one-click-article-writer', relationship: 'Applied within' },
                { slug: 'auto-blogging-software', relationship: 'Applied within' }
            ]
        }
    },

    'one-click-article-writer': {
        slug: 'one-click-article-writer',
        featureName: 'One-Click Article Writer',
        featureIcon: 'Zap',
        primaryKeyword: 'One-Click Article Writer',
        secondaryKeywords: ['instant article generator', 'one click blog post', 'fast ai article writer', 'quick content generator'],

        heroTitle: 'Keyword In, Finished Article Out. One Click.',
        heroBadge: 'SPEED MODE',
        heroSubtitle: 'Skip the outline review. Skip the manual edits. Enter a keyword, click generate, and get a fully researched, formatted, image-enhanced article in 2-5 minutes. Same 7-phase pipeline, zero human checkpoints.',

        pitch: {
            question: 'What is One-Click Article Generation?',
            answer: 'One-Click mode runs the full AI Writer pipeline without pausing for human review. Standard mode pauses after outline generation so you can edit. One-Click mode skips that checkpoint and runs research → outline → writing → images → meta → delivery in one autonomous sequence.',
            highlights: [
                'Same 7-phase pipeline as standard mode — no quality shortcuts',
                'Zero human checkpoints: keyword in, finished article out',
                'Average generation time: 2-5 minutes end-to-end',
                'Ideal for content at scale: batch multiple keywords at once',
                'Full output: article + images + meta + internal links'
            ]
        },

        inputOutput: {
            title: 'What Goes In, What Comes Out',
            subtitle: 'The fastest path from keyword to published article.',
            input: {
                label: 'YOU PROVIDE',
                items: [
                    'A target keyword',
                    'Article type (informational, commercial, how-to)',
                    'Optional: title override, supporting keywords',
                    'That\'s it. Click generate.'
                ]
            },
            output: {
                label: 'YOU RECEIVE (2-5 MIN LATER)',
                items: [
                    'Complete 2,500-4,000 word article',
                    'AI-generated images placed contextually',
                    'SEO meta title + description',
                    'Internal + external citation links',
                    'Email notification when complete'
                ]
            }
        },

        pipeline: {
            title: 'Same Pipeline, No Pauses',
            subtitle: 'One-Click runs the identical 7-phase process — it just doesn\'t stop for review.',
            phases: [
                { phase: '01', name: 'Brand Context', duration: '~2s', description: 'Loads your Style DNA and brand profile.', techDetail: 'Identical to standard mode.' },
                { phase: '02', name: 'Deep Research', duration: '~30s', description: 'Tavily broad search + Critic gap analysis + synthesis.', techDetail: 'No shortcuts — full 2-phase research with sniper search.' },
                { phase: '03', name: 'Auto-Outline', duration: '~20s', description: 'Outline generated AND immediately approved. No pause for review.', techDetail: 'Standard mode pauses here. One-Click proceeds directly.' },
                { phase: '04', name: 'Snowball Writing', duration: '~90s', description: 'Section-by-section writing with rolling context.', techDetail: 'Identical writing quality to standard mode.' },
                { phase: '05', name: 'Image + Meta', duration: '~30s', description: 'AI images generated, meta tags created, article assembled.', techDetail: 'Same Fal.ai pipeline and Text Safety Firewall.' },
                { phase: '06', name: 'Delivery', duration: '~2s', description: 'Article saved, email sent, CMS published if configured.', techDetail: 'Total: 2-5 minutes from keyword to finished article.' }
            ]
        },

        deliverable: {
            title: 'What You Get in 2-5 Minutes',
            subtitle: 'The same result as standard mode — without the wait.',
            items: [
                { icon: 'FileText', label: 'FINISHED ARTICLE, NO REVIEW STEP', detail: 'A complete, publish-ready article lands in your dashboard. You didn\'t review an outline, you didn\'t approve anything — it just ran.' },
                { icon: 'Layers', label: 'BATCH 10 KEYWORDS AT ONCE', detail: 'Enter a list of keywords and walk away. Come back to 10 finished articles. Perfect for bulk content production.' },
                { icon: 'Zap', label: 'SAME QUALITY, ZERO BABYSITTING', detail: 'The output is identical to standard mode. The only difference: you didn\'t have to sit through the outline step.' },
                { icon: 'Clock', label: '2-5 MINUTES PER ARTICLE', detail: 'From keyword to finished, published article. Stack 20 keywords and have them all done in under two hours.' }
            ]
        },

        useCases: {
            title: 'Who Uses One-Click Mode',
            subtitle: 'When speed matters more than manual editing.',
            items: [
                { persona: 'Content Ops Manager', goal: 'Generate 20 articles in a single afternoon for a product launch', result: 'Batch keywords, click generate, come back to 20 finished articles — no outline review bottleneck.' },
                { persona: 'SEO Specialist', goal: 'Rapidly test content topics without investing editing time upfront', result: 'Generate first drafts in 2-5 minutes each, review results, then invest editorial time only on pieces that perform.' },
                { persona: 'Dropshipping Entrepreneur', goal: 'Build out product category blogs across multiple stores simultaneously', result: 'Queue 50+ keywords across brands — articles generate concurrently at full quality.' },
                { persona: 'Content Agency Intern', goal: 'Produce first drafts for senior editors to review and polish', result: 'One-Click generates complete, well-researched drafts. Editors polish rather than write from scratch.' }
            ]
        },

        comparison: {
            title: 'Standard Mode vs. One-Click',
            subtitle: 'When to use each mode.',
            oldWay: {
                label: 'STANDARD MODE',
                items: [
                    'Pauses after outline for your review and edits',
                    'Best for: flagship articles, sensitive topics',
                    'You can reorder sections, add context, remove headings',
                    'Takes longer due to human review step',
                    'Recommended for: 1-5 articles per session'
                ]
            },
            newWay: {
                label: 'ONE-CLICK MODE',
                items: [
                    'Runs the entire pipeline without stopping',
                    'Best for: content at scale, batch generation',
                    'Outline is auto-approved — no manual editing',
                    '2-5 minutes per article, fully autonomous',
                    'Recommended for: 10+ articles per session'
                ]
            }
        },

        faqTitle: 'One-Click Mode FAQ',
        faqSubtitle: 'Questions about autonomous article generation.',
        faqs: [
            { question: 'Is the quality lower in One-Click mode?', answer: 'No. The pipeline is identical. The only difference is that the outline review checkpoint is skipped. Research depth, writing quality, and image generation are the same.' },
            { question: 'Can I batch multiple keywords?', answer: 'Yes. You can queue multiple keywords and they\'ll be processed concurrently (up to 3 at a time).' },
            { question: 'What if the outline is bad?', answer: 'The outline generation uses the same Zod validation and self-correcting parser. Bad outlines are automatically retried. In rare cases, you can regenerate the article.' },
            { question: 'Can I edit the article after generation?', answer: 'Yes. You can edit any generated article in the FlipAEO editor or in your CMS after publishing.' }
        ],

        cta: {
            headline: 'Generate 10 Articles in an Hour.',
            subheadline: 'Enter keywords, click generate, come back to finished articles.',
            buttonLabel: 'Try One-Click',
            buttonHref: '/login'
        },

        connectedFeatures: {
            title: 'Connected Features',
            subtitle: 'One-Click mode is the speed layer on top of the core engine.',
            items: [
                { slug: 'ai-seo-writer', relationship: 'Speed mode of' },
                { slug: 'auto-blogging-software', relationship: 'Used by' },
                { slug: 'undetectable-ai-content', relationship: 'Includes' }
            ]
        }
    },

    'topic-cluster-generator': {
        slug: 'topic-cluster-generator',
        featureName: 'Topic Cluster Generator',
        featureIcon: 'Target',
        primaryKeyword: 'Topic Cluster Generator',
        secondaryKeywords: ['topical authority builder', 'content cluster tool', 'pillar content strategy', 'seo topic clusters'],

        heroTitle: 'Build Topical Authority With an AI-Generated Content Architecture',
        heroBadge: 'STRATEGY ENGINE',
        heroSubtitle: 'Stop guessing what to write about. The Topic Cluster Generator runs a Topical Authority Audit against your competitors, finds the content gaps, and produces a 30-article plan with Pillar → Spoke hierarchy and internal linking maps.',

        pitch: {
            question: 'What does the Topic Cluster Generator do?',
            answer: 'It reverse-engineers your competitors\' content coverage to find topics they rank for that you don\'t cover. Then it generates a structured 30-article content plan organized into Pillar-Spoke clusters, with keyword targets, article types, and internal linking blueprints.',
            highlights: [
                'Topical Authority Audit scans your competitors\' content programmatically',
                'Gap Matrix shows exactly which topics competitors cover that you don\'t',
                'Generates 30-article plans with Pillar → Primary Spoke → Supporting hierarchy',
                'Each article gets keyword targets, article type, and linking instructions',
                'Semantic deduplication prevents overlap with your existing published content'
            ]
        },

        inputOutput: {
            title: 'What Goes In, What Comes Out',
            subtitle: 'From brand profile to full content strategy.',
            input: {
                label: 'YOU PROVIDE',
                items: [
                    'Your brand profile and website URL',
                    'Your niche/industry context',
                    'Competitor brands (or let the system discover them)',
                    'Existing content library (auto-synced from sitemap)'
                ]
            },
            output: {
                label: 'YOU RECEIVE',
                items: [
                    'Topical Authority Audit with gap analysis',
                    '30-article content plan with cluster hierarchy',
                    'Per-article keyword targets + article type assignments',
                    'Internal linking map (which articles link to which)',
                    'Pillar suggestions with projected authority scores'
                ]
            }
        },

        pipeline: {
            title: 'The Strategy Pipeline',
            subtitle: 'How a content plan is born — mapped from generate-plan.ts.',
            phases: [
                { phase: '01', name: 'Sitemap Sync', duration: '~30s', description: 'Crawls your website\'s sitemap to index all existing published content. Builds your internal links pool and lists existing article titles for deduplication.', techDetail: 'Syncs URLs to internal_links table with embeddings for semantic search.' },
                { phase: '02', name: 'Topical Authority Audit', duration: '~3 min', description: 'Scans your niche to map the full topic landscape. Analyzes your coverage vs. competitors. Produces a Gap Matrix showing uncovered topics ranked by importance.', techDetail: 'Runs runAuditTask: niche mapping → user coverage scan → competitor deep scan → gap matrix → pillar suggestions.' },
                { phase: '03', name: 'Strategic Plan Generation', duration: '~2 min', description: 'Uses audit gaps + pillar suggestions to generate a 30-article plan. Articles are organized into Pillar → Primary Spoke → Supporting hierarchies with keyword targets.', techDetail: 'LLM generates plan using: brand context + competitor gaps + existing content (for deduplication) + pillar suggestions.' },
                { phase: '04', name: 'Semantic Deduplication', duration: '~10s', description: 'Cross-references every planned article against your existing content using semantic embeddings. Removes any topics you\'ve already covered.', techDetail: 'Prevents keyword cannibalization. Existing sitemap titles + published articles are filtered out.' },
                { phase: '05', name: 'Calendar Distribution', duration: 'Instant', description: 'Articles are assigned to your publishing calendar based on cluster priority and configured velocity.', techDetail: 'Pillars scheduled first, spokes follow. Respects configured publishing cadence.' }
            ]
        },

        deliverable: {
            title: 'What You Get After the Audit',
            subtitle: 'A complete content roadmap you can start executing immediately.',
            items: [
                { icon: 'Map', label: 'KNOW EXACTLY WHAT TO WRITE', detail: '30 article topics, prioritized by impact. No more guessing which blog post to write next — the plan tells you.' },
                { icon: 'Target', label: 'KNOW WHAT COMPETITORS COVER', detail: 'See the specific topics your competitors rank for that you haven\'t written about yet. Fill those gaps before they do.' },
                { icon: 'GitBranch', label: 'ORGANIZED BY TOPIC CLUSTERS', detail: 'Articles are grouped into related clusters so your blog builds authority on entire topics, not just individual keywords.' },
                { icon: 'TrendingUp', label: 'A CLEAR PUBLISHING ROADMAP', detail: 'Every article has a keyword, a type (how-to, comparison, guide), and a recommended publish order. Just follow the plan.' }
            ]
        },

        useCases: {
            title: 'Who Needs Topic Clusters',
            subtitle: 'Teams that want to stop guessing and start building topical authority systematically.',
            items: [
                { persona: 'SEO Director', goal: 'Build a defensible topical moat in your niche before competitors catch up', result: 'Gap Matrix reveals exactly which high-value topics competitors rank for that you don\'t cover yet.' },
                { persona: 'Content Marketing VP', goal: 'Present a data-backed content roadmap to the leadership team', result: '30-article plan with cluster hierarchy, keyword targets, and projected authority scores — not guesswork.' },
                { persona: 'Solo Blogger', goal: 'Know exactly what to write next instead of staring at a blank editorial calendar', result: 'AI-generated plan tells you the optimal article sequence, from Pillar posts down to Supporting content.' },
                { persona: 'Digital Marketing Agency', goal: 'Deliver unique content strategies for each client in minutes, not days', result: 'Per-client Topical Authority Audits produce custom 30-article plans based on their specific competitive landscape.' }
            ]
        },

        comparison: {
            title: 'The Old Way vs. FlipAEO',
            subtitle: 'How content strategy usually gets done.',
            oldWay: {
                label: 'MANUAL STRATEGY',
                items: [
                    'Brainstorm topics in a Google Sheet',
                    'Manual keyword research in Ahrefs/SEMrush',
                    'No systematic competitor gap analysis',
                    'Cluster structure is ad-hoc — no linking plan',
                    'Deduplication is "I think I wrote about that already"',
                    'Takes 2-3 days for a quarterly content plan'
                ]
            },
            newWay: {
                label: 'WITH FLIPAEO',
                items: [
                    'Automated competitor scanning + gap analysis',
                    'AI-generated keyword targets per article',
                    'Systematic Pillar → Spoke clustering with linking map',
                    'Semantic deduplication against your entire content library',
                    'Projected authority scores show expected ROI',
                    'Full 30-article plan in ~5 minutes'
                ]
            }
        },

        faqTitle: 'Topic Cluster Generator FAQ',
        faqSubtitle: 'Questions about content strategy automation.',
        faqs: [
            { question: 'How does it find my competitors?', answer: 'You can provide competitor URLs manually, or the Topical Authority Audit discovers them automatically by analyzing who ranks for your niche\'s core topics.' },
            { question: 'Can I edit the plan after generation?', answer: 'Yes. The plan is fully editable. You can add, remove, reorder, or modify any article in the plan before activating auto-blogging.' },
            { question: 'What if I already have 200 published articles?', answer: 'The sitemap sync indexes all existing content. Semantic deduplication ensures the plan only suggests topics you haven\'t covered yet.' },
            { question: 'How does it decide article type?', answer: 'Based on search intent analysis. "Best X for Y" queries get commercial type. "How to X" queries get how-to type. Informational is the default for explanatory topics.' }
        ],

        cta: {
            headline: 'Get Your 30-Article Content Plan.',
            subheadline: 'Competitive gap analysis + cluster strategy in 5 minutes.',
            buttonLabel: 'Generate Strategy',
            buttonHref: '/login'
        },

        connectedFeatures: {
            title: 'Connected Features',
            subtitle: 'The strategy engine feeds the production engine.',
            items: [
                { slug: 'auto-blogging-software', relationship: 'Feeds into' },
                { slug: 'ai-seo-writer', relationship: 'Provides keywords to' },
                { slug: 'ai-content-calendar', relationship: 'Populates' }
            ]
        }
    },

    'ai-content-calendar': {
        slug: 'ai-content-calendar',
        featureName: 'AI Content Calendar',
        featureIcon: 'Calendar',
        primaryKeyword: 'AI Content Calendar',
        secondaryKeywords: ['automated content calendar', 'content scheduling tool', 'ai publishing schedule', 'content planning calendar'],

        heroTitle: 'A Publishing Calendar That Fills Itself',
        heroBadge: 'SCHEDULING',
        heroSubtitle: 'The Content Calendar is where strategy meets execution. It holds your 30-article plan, shows what\'s scheduled, what\'s generating, and what\'s published — then automatically triggers the AI Writer when each date arrives.',

        pitch: {
            question: 'What is the AI Content Calendar?',
            answer: 'It\'s the scheduling and execution layer between your content plan and published articles. When the Topic Cluster Generator creates a 30-article plan, articles land on the calendar. When their scheduled date arrives, the AI Writer automatically generates and publishes them.',
            highlights: [
                'Visual calendar showing article status: Planned → Generating → Published',
                'Automatic triggering: articles generate when their scheduled date arrives',
                'Configurable velocity: daily, 3x/week, weekly, or custom schedule',
                'Drag-and-drop rescheduling for manual control',
                'Mix automated plan articles with manually added topics'
            ]
        },

        inputOutput: {
            title: 'What Goes In, What Comes Out',
            subtitle: 'The scheduling contract.',
            input: {
                label: 'POPULATED BY',
                items: [
                    'Topic Cluster Generator (30-article plans)',
                    'Manual article additions (your own topics)',
                    'Your configured publishing velocity',
                    'Your timezone and preferred publish times'
                ]
            },
            output: {
                label: 'THE CALENDAR PROVIDES',
                items: [
                    'Visual month/week view of all scheduled content',
                    'Real-time status tracking per article',
                    'Automatic generation triggering on scheduled dates',
                    'Publishing history and velocity metrics',
                    'Email alerts for completed articles'
                ]
            }
        },

        pipeline: {
            title: 'How the Calendar Operates',
            subtitle: 'The scheduling lifecycle from plan to published.',
            phases: [
                { phase: '01', name: 'Plan Import', duration: 'Instant', description: 'When a content plan is generated, all 30 articles are placed on the calendar with status "Planned." Each gets a target date based on your velocity.', techDetail: 'Pillar articles are prioritized, followed by primary spokes, then supporting articles.' },
                { phase: '02', name: 'Date Arrival', duration: 'Automatic', description: 'When a scheduled date arrives, the calendar triggers the AI Writer for that article. Status changes to "Generating."', techDetail: 'Cron-based triggering respects your timezone and configured publish time.' },
                { phase: '03', name: 'Generation Monitoring', duration: '2-5 min', description: 'The calendar shows real-time generation progress. Article moves through research → outlining → writing → published.', techDetail: 'Status updates from generate-blog.ts are reflected in the calendar UI in real-time.' },
                { phase: '04', name: 'Completion', duration: '~2s', description: 'Article is published to your CMS. Calendar status changes to "Published." Email notification sent.', techDetail: 'Plan completion percentage updates. Next article in queue waits for its scheduled date.' }
            ]
        },

        deliverable: {
            title: 'What You See in Your Calendar',
            subtitle: 'A publishing schedule that actually gets followed.',
            items: [
                { icon: 'CalendarDays', label: 'VISUAL PUBLISHING SCHEDULE', detail: 'See your entire content plan on a calendar. Know exactly what\'s publishing this week, next week, and next month at a glance.' },
                { icon: 'Eye', label: 'REAL-TIME STATUS UPDATES', detail: 'Every article shows its current status — scheduled, being written, or already published. No guesswork about where things stand.' },
                { icon: 'GripVertical', label: 'RESCHEDULE WITH A DRAG', detail: 'Plans change. Drag an article to a different date and the whole schedule adjusts. No spreadsheet editing required.' },
                { icon: 'BarChart3', label: 'PUBLISHING CONSISTENCY SCORE', detail: 'Track how consistently you\'re actually publishing. See articles per week, completion rate, and whether you\'re ahead or behind schedule.' }
            ]
        },

        useCases: {
            title: 'Who Needs an AI Content Calendar',
            subtitle: 'Anyone who\'s ever abandoned a publishing schedule after two weeks.',
            items: [
                { persona: 'Solopreneur', goal: 'Publish consistently without content creation being a full-time job', result: 'Calendar fills itself from your strategy plan. Articles generate and publish while you run your business.' },
                { persona: 'Marketing Team Lead', goal: 'Give the team visibility into what\'s publishing and when', result: 'Month/week calendar view shows every article\'s status: planned, generating, or published.' },
                { persona: 'Agency Project Manager', goal: 'Coordinate content publishing across 5+ client brands', result: 'Each brand has its own calendar with independent velocity settings — managed from one dashboard.' },
                { persona: 'E-Commerce Marketing Manager', goal: 'Align blog publishing with product launches and seasonal campaigns', result: 'Drag-and-drop rescheduling lets you time content around sales events while keeping the automation running.' }
            ]
        },

        comparison: {
            title: 'The Old Way vs. FlipAEO',
            subtitle: 'Most content calendars are just spreadsheets.',
            oldWay: {
                label: 'SPREADSHEET CALENDARS',
                items: [
                    'Google Sheet with dates and topic ideas',
                    'Nothing actually generates the articles',
                    'Nothing tracks whether articles are done',
                    'Manual copy-paste to CMS on publish day',
                    'Velocity tracking is "count the rows"',
                    'Falls apart after week 2'
                ]
            },
            newWay: {
                label: 'WITH FLIPAEO',
                items: [
                    'Calendar auto-populated from AI-generated strategy',
                    'Articles generate automatically on scheduled dates',
                    'Real-time status: planned → generating → published',
                    'Direct CMS publishing — no manual transfer',
                    'Built-in velocity tracking and completion metrics',
                    'Consistent publishing runs for months autonomously'
                ]
            }
        },

        faqTitle: 'Content Calendar FAQ',
        faqSubtitle: 'Questions about automated scheduling.',
        faqs: [
            { question: 'Can I pause the calendar?', answer: 'Yes. You can pause auto-generation at any time. Scheduled articles will wait until you resume.' },
            { question: 'What if I want to publish manually?', answer: 'Use Draft Mode. Articles are generated and pushed to your CMS as drafts. You review and publish on your own schedule.' },
            { question: 'Can multiple plans run on the same calendar?', answer: 'Currently one plan per brand at a time. When a plan completes, you can generate a new one.' },
            { question: 'Does it work with all CMS platforms?', answer: 'Direct integrations with WordPress, Webflow, and Shopify. Other platforms can use the article export feature.' }
        ],

        cta: {
            headline: 'Set Your Publishing Schedule.',
            subheadline: 'Fill your calendar with strategy-driven content that generates and publishes itself.',
            buttonLabel: 'Build Your Calendar',
            buttonHref: '/login'
        },

        connectedFeatures: {
            title: 'Connected Features',
            subtitle: 'The calendar is the orchestration layer.',
            items: [
                { slug: 'topic-cluster-generator', relationship: 'Populated by' },
                { slug: 'auto-blogging-software', relationship: 'Triggers' },
                { slug: 'ai-seo-writer', relationship: 'Executes via' }
            ]
        }
    },
};

