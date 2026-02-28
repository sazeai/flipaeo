import { Zap, Target, PenLine, Check, X, ArrowRight } from 'lucide-react';

export interface ComparisonData {
    slug: string;
    competitorName: string;
    category: 'Bulk AI Writer' | 'Legacy SEO Tool' | 'AI Assistant';
    competitorLogo: string; // Just using a letter for now in the UI
    color: 'orange' | 'blue' | 'purple';

    // Section 1: Zero-Click Header
    heroTitle: string;
    sonicBoomSummary: string;
    quickVerdict: {
        competitorTitle: string;
        competitorDescription: string;
        flipaeoTitle: string;
        flipaeoDescription: string;
    };

    // Section 2: At-A-Glance Matrix
    matrix: Record<string, {
        competitor: string;
        flipaeo: string;
        winner: 'FlipAEO' | 'Competitor' | 'Tie'
    }>;

    // Section 3: Verdict Selector
    verdict: {
        competitorText: string;
        flipaeoText: string;
        competitorIf: string[];
        flipaeoIf: string[];
    };

    // Section 4: Deep Dive Feature Showdown
    features: {
        title: string;
        content: string;
        winner: 'FlipAEO' | 'Competitor' | 'Tie';
        comparisonImage?: string; // Placeholder for now
    }[];

    // Section 5: Pricing Analysis
    pricing: PricingComparison;

    // Section 6: FAQ
    faqs: {
        question: string;
        answer: string;
    }[];

    finalVerdict: {
        title: string;
        body: string[];
        recommendation: string;
        flipaeoCta: {
            label: string;
            href: string;
        };
        competitorCta: {
            label: string;
            href: string;
        };
    };

    moreAlternatives?: {
        title: string;
        description: string;
        href: string;
    }[];

    // Social Proof / Case Study

}

export type PricingPlan = {
    name: string;
    price: string;
    subtitle: string;
};

export type PricingComparison = {
    competitorPlans: PricingPlan[];
    flipaeoPlans: PricingPlan[];
    verdict: string;
};

export const comparisons: Record<string, ComparisonData> = {
    'flipaeo-vs-byword': {
        slug: 'flipaeo-vs-byword',
        competitorName: 'Byword',
        category: 'Bulk AI Writer',
        competitorLogo: 'B',
        color: 'orange',

        heroTitle: 'FlipAEO vs. Byword: The Honest Comparison for 2026',
        sonicBoomSummary: "If you want 1,000 articles/min for programmatic spam, choose Byword. If you want highly structured, researched content clusters designed to rank in ChatGPT and Google AI Overviews, choose FlipAEO.",
        quickVerdict: {
            competitorTitle: "For Mass Scale (Byword):",
            competitorDescription: "Byword is the industry standard for high-volume programmatic SEO. If your goal is to publish 1,000+ template-based articles per month to capture long-tail traffic on a budget, Byword is the superior choice.",
            flipaeoTitle: "For AI Citations (FlipAEO):",
            flipaeoDescription: "FlipAEO is the only tool built for Answer Engine Optimization (AEO). If your goal is to build a high-authority brand that gets cited by ChatGPT and Perplexity, FlipAEO's structured \"Entity Clusters\" (30 deep articles/mo) will outperform Byword's bulk templates."
        },

        matrix: {
            coreEngine: {
                competitor: "Programmatic Wrapper (GPT-4)",
                flipaeo: "RAG Optimization Engine",
                winner: "FlipAEO"
            },
            researchMethod: {
                competitor: "Live Web Scrape (Surface Level)",
                flipaeo: "Semantic Gap Analysis & Shadow Questions",
                winner: "FlipAEO"
            },
            outputStructure: {
                competitor: "Standard Blog Format",
                flipaeo: "Entity-Rich Markdown & Data Tables",
                winner: "FlipAEO"
            },
            citationFocus: {
                competitor: "Google Blue Links (Volume)",
                flipaeo: "LLM Citations (Authority)",
                winner: "FlipAEO"
            },
            priceModel: {
                competitor: "Credits / Article",
                flipaeo: "Flat Subscription",
                winner: "FlipAEO"
            },
            topicalAudit: {
                competitor: "None (User provides keywords)",
                flipaeo: "AI Gap Analysis (Blue Ocean Topics)",
                winner: "FlipAEO"
            },
            interlinking: {
                competitor: "Basic / Plugin Dependent",
                flipaeo: "Semantic Clusters (Auto-Interlinked)",
                winner: "FlipAEO"
            },
            contentRefresh: {
                competitor: "Manual Rewrite Only",
                flipaeo: "Strategic Top-Up & Re-Optimization",
                winner: "FlipAEO"
            },
            schemaMarkup: {
                competitor: "Basic Article Schema",
                flipaeo: "Rich Entity & FAQ Schema",
                winner: "FlipAEO"
            },
            cmsIntegrations: {
                competitor: "WordPress, Webflow, Ghost, Zapier",
                flipaeo: "Manual Export / API (Coming Soon)",
                winner: "Competitor"
            }
        },

        verdict: {
            competitorText: "Choose Byword.ai if you need to generate 1,000+ programmatic articles per month to capture long-tail Google traffic. It is the industry standard for \"bulk SEO\" and connects directly to WordPress and Webflow to flood your site with content.",
            flipaeoText: "Choose FlipAEO if you need to get cited by ChatGPT, Perplexity, and Gemini. FlipAEO is not a bulk generator; it is a RAG-Optimization Engine. We generate 30 highly structured, data-dense \"Entity Clusters\" per month designed specifically to win the \"Zero-Click\" citation in AI search.",
            competitorIf: [
                "You need 1,000+ pages of generic filler content instantly.",
                "You are building a 'Churn and Burn' affiliate site.",
                "You care about word count volume more than answer accuracy."
            ],
            flipaeoIf: [
                "You are building a legitimate brand that needs to establish authority.",
                "You want to capture traffic from ChatGPT, Perplexity, and Gemini.",
                "You need content that is internally linked and clustered automatically."
            ]
        },

        features: [
            {
                title: "Quantity vs. Structural Integrity",
                content: "Byword is undeniably fast. It can pump out thousands of articles in minutes. But speed is a liability in the AEO era. LLMs have limited context windows. If you feed an LLM a 3,000-word fluff article (Byword), it hallucinates or ignores it. If you feed it a structured table and list (FlipAEO), it cites you. FlipAEO engineers content specifically for machine readability, not just keyword stuffing.",
                winner: "FlipAEO"
            },
            {
                title: "Keyword Stuffing vs. Entity Mapping",
                content: "Legacy programmatic tools like Byword scan the top 10 results and try to mimic them. They look for 'keywords.' FlipAEO looks for 'Entities' (People, Places, Concepts). Google Gemini and Perplexity prefer Entities over Keywords because they represent facts, not just strings of text. FlipAEO maps these entities to ensure your content is understood as the authoritative source.",
                winner: "FlipAEO"
            },
            {
                title: "The 'Post-Publish' Reality",
                content: "With Byword, you get 1,000 pages you have to edit. The 'Cost of Cleanup' is massive. With FlipAEO, you get 30 pages that are ready to deploy. We focus on 'Topical Purity'—generating highly researched, connected entity clusters that fill semantic gaps LLMs are hungry for, drastically reducing your editing time.",
                winner: "FlipAEO"
            },
            {
                title: "Velocity & Integrations",
                content: "If you need to publish 500+ articles in a single day and push them directly to WordPress, Webflow, or Zapier, Byword is the clear winner. Their infrastructure is built for massive scale and seamless piping. FlipAEO is currently built for strategic, lower-volume 'Topical Authority' campaigns and requires manual export or API usage.",
                winner: "Competitor"
            }
        ],

        pricing: {
            competitorPlans: [
                {
                    name: "Starter",
                    price: "$99/month",
                    subtitle: "25 articles/month; best for individuals getting started"
                },
                {
                    name: "Standard",
                    price: "$299/month",
                    subtitle: "80 articles/month; most popular for growing teams"
                },
                {
                    name: "Scale",
                    price: "$999/month",
                    subtitle: "300 articles/month; for agencies and large operations"
                }
            ],
            flipaeoPlans: [
                {
                    name: "Core",
                    price: "$79/month",
                    subtitle: "30 Entity Clusters/month; built for AI citations (not bulk)"
                }
            ],
            verdict: "Byword is priced for programmatic volume (more output tiers). FlipAEO is priced for citation performance: fewer, higher-structure deliverables designed to be referenced in ChatGPT, Perplexity, Gemini, and AI Overviews."
        },

        faqs: [
            {
                question: "Can FlipAEO replace Byword for programmatic SEO?",
                answer: "If your goal is spamming thousands of pages, no. FlipAEO is for 'Strategic Content Infrastructure'. We replace the need for bulk spam with high-authority, cited answers."
            },
            {
                question: "Why does formatting matter for AI Search?",
                answer: "AI engines like Perplexity and Gemini parse structured data (tables, lists, bold definitions) much faster than long paragraphs. FlipAEO optimizes for this 'machine-readability'."
            },
            {
                question: "Does FlipAEO write long-form content?",
                answer: "Yes, but it's 'dense' long-form. We don't fluff up word counts. We provide comprehensive answers that cover the topic depth required for authority."
            }
        ],

        finalVerdict: {
            title: "Our Recommendation",
            body: [
                "This isn’t a “which AI writer is better?” decision. It’s a strategy decision: do you want to win with volume in traditional Google blue links, or do you want to win citations in AI answers where most clicks are disappearing?",
                "Byword is built for programmatic throughput. If you already have templates, a massive keyword list, and a workflow to publish hundreds of pages a month (and review them), Byword’s tiered plans make sense for scaling output.",
                "FlipAEO is built for Answer Engine Optimization. Instead of paying for more words, you pay for more structure: entity-first clusters, data-dense formatting, and content designed to be referenced by ChatGPT, Perplexity, Gemini, and Google AI Overviews."
            ],
            recommendation: "Final Recommendation: Choose FlipAEO if your goal is AI citations and authority. Choose Byword if your goal is bulk pSEO volume.",
            flipaeoCta: {
                label: "Try FlipAEO",
                href: "/pricing"
            },
            competitorCta: {
                label: "Start Byword Free",
                href: "https://byword.ai"
            }
        },

        moreAlternatives: [
            {
                title: "Browse All Comparisons",
                description: "Explore more alternatives across bulk writers, SEO tools, and AI assistants.",
                href: "/alternatives"
            },
            {
                title: "FlipAEO Pricing",
                description: "See what’s included in the Entity Cluster subscription.",
                href: "/pricing"
            },
        ],


    }
};
