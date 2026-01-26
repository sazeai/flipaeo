import React from 'react';
import { ShieldCheck, Search, Link2, Calendar, Sliders, BarChart3, CheckCircle2, ShoppingBag, Layout, Globe } from 'lucide-react';

// --- Feature Visuals (High Fidelity CSS/SVG) ---

const ReadinessVisual = () => (
  <div className="w-full h-full flex items-center justify-center p-6">
    <div className="w-full max-w-[240px] bg-white border border-stone-100 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-stone-50 pb-2">
        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">Category Score</span>
        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">CRITICAL GAPS</span>
      </div>

      <div className="flex items-end gap-1">
        <span className="text-4xl font-serif text-stone-900 leading-none">42</span>
        <span className="text-sm text-stone-400 font-medium mb-1">/100</span>
      </div>

      <div className="space-y-3">
        {/* Metric 1 */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] font-medium text-stone-500">
            <span>Brand Mentions</span>
            <span>0/10</span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="w-0 h-full bg-stone-300"></div>
          </div>
        </div>
        {/* Metric 2 */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] font-medium text-stone-500">
            <span>Competitor Dominance</span>
            <span className="text-red-500">High</span>
          </div>
          <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="w-[85%] h-full bg-red-400"></div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-start mt-1">
        <div className="w-3 h-3 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <div className="w-1 h-1 bg-brand-500 rounded-full"></div>
        </div>
        <p className="text-[8px] text-stone-500 leading-snug">
          Your brand is missing from 85% of informational queries in this category.
        </p>
      </div>
    </div>
  </div>
);

const VoiceVisual = () => (
  <div className="w-full h-full flex items-center justify-center p-6">
    <div className="w-full max-w-[380px] bg-white border border-stone-100 shadow-sm rounded-xl p-5 flex flex-col justify-center gap-5">
      {/* Slider 1 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-stone-400">
          <span>Professional</span>
          <span>85%</span>
        </div>
        <div className="relative w-full h-1.5 bg-stone-100 rounded-full">
          <div className="absolute left-0 top-0 bottom-0 w-[85%] bg-stone-300 rounded-full"></div>
          <div className="absolute left-[85%] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-stone-300 rounded-full shadow-sm"></div>
        </div>
      </div>
      {/* Slider 2 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-brand-500">
          <span>Witty</span>
          <span>40%</span>
        </div>
        <div className="relative w-full h-1.5 bg-brand-50 rounded-full">
          <div className="absolute left-0 top-0 bottom-0 w-[40%] bg-brand-300 rounded-full"></div>
          <div className="absolute left-[40%] top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-500 border-2 border-white rounded-full shadow-sm ring-1 ring-brand-200"></div>
        </div>
      </div>
      {/* Slider 3 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-stone-400">
          <span>Technical</span>
          <span>90%</span>
        </div>
        <div className="relative w-full h-1.5 bg-stone-100 rounded-full">
          <div className="absolute left-0 top-0 bottom-0 w-[90%] bg-stone-800 rounded-full"></div>
          <div className="absolute left-[90%] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-stone-800 rounded-full shadow-sm"></div>
        </div>
      </div>
    </div>
  </div>
);

const ResearchVisual = () => (
  <div className="w-full h-full flex items-center justify-center p-6">
    <div className="w-full max-w-[240px] bg-stone-900 rounded-lg p-3 shadow-lg flex flex-col gap-2 font-mono text-[8px] leading-relaxed border border-stone-800">
      <div className="flex gap-1.5 mb-1 border-b border-stone-800 pb-2">
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
      </div>

      {/* Line 1 */}
      <div className="text-stone-400">
        <span className="text-blue-400"></span> Initial Scan... Found 12 generic articles.
      </div>

      {/* Line 2 */}
      <div className="bg-red-500/10 border-l-2 border-red-500 pl-2 py-1 text-red-200 my-1">
        <span className="font-bold">CRITIC:</span> Missing pricing data. Claims unverified.
      </div>

      {/* Line 3 */}
      <div className="text-stone-300">
        <span className="text-blue-400"></span> AGENT: Hunting specific pricing tables...
      </div>

      {/* Line 4 */}
      <div className="bg-green-500/10 border-l-2 border-green-500 pl-2 py-1 text-green-200 mt-1 animate-pulse">
        <span className="font-bold">ACQUIRED:</span> 2026 Benchmarks found.
      </div>
    </div>
  </div>
);

const LinkingVisual = () => (
  <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-stone-50/30">
    <div className="relative w-full max-w-[240px] h-40 flex flex-col items-center justify-center">

      {/* Central Hub */}
      <div className="relative z-10 bg-white border border-stone-200 shadow-md rounded-lg p-2.5 flex items-center gap-2 mb-8">
        <div className="w-6 h-6 bg-stone-900 rounded flex items-center justify-center text-white">
          <Link2 size={12} />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-stone-900">Pillar Page</span>
          <span className="text-[7px] text-stone-400">Authority: High</span>
        </div>
        {/* Connecting lines originating from here */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-8 bg-stone-300"></div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-24 h-8 border-t border-r border-l border-stone-300 rounded-t-lg -mt-[1px]"></div>
      </div>

      {/* Branches */}
      <div className="flex gap-4 z-10">
        {/* Branch 1 */}
        <div className="bg-white border border-brand-200 shadow-sm rounded px-2 py-1.5 flex flex-col items-center relative group">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-50 text-brand-600 text-[6px] font-bold px-1 rounded border border-brand-100">
            SEMANTIC MATCH
          </div>
          <span className="text-[8px] font-medium text-stone-700">Sub-topic A</span>
        </div>

        {/* Branch 2 */}
        <div className="bg-white border border-stone-100 shadow-sm rounded px-2 py-1.5 flex flex-col items-center opacity-60">
          <span className="text-[8px] font-medium text-stone-500">Sub-topic B</span>
        </div>

        {/* Branch 3 */}
        <div className="bg-white border border-brand-200 shadow-sm rounded px-2 py-1.5 flex flex-col items-center relative group">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-50 text-brand-600 text-[6px] font-bold px-1 rounded border border-brand-100">
            CONTEXT LINK
          </div>
          <span className="text-[8px] font-medium text-stone-700">Sub-topic C</span>
        </div>
      </div>

    </div>
  </div>
);

const CredibilityVisual = () => (
  <div className="w-full h-full flex items-center justify-center p-8">
    <div className="w-full max-w-[240px] bg-white p-4 rounded-lg shadow-sm border border-stone-100 relative">
      <p className="text-[10px] text-stone-500 leading-loose">
        The market is projected to reach <span className="relative inline-block cursor-help group">
          <span className="bg-blue-50 text-blue-700 font-bold px-1 rounded border border-blue-100 border-b-2">
            $15.2B by 2026
          </span>

          {/* Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-stone-900 text-white rounded p-2 text-[8px] opacity-100 shadow-xl z-20 flex flex-col gap-1">
            <span className="font-bold text-stone-300 uppercase text-[7px] tracking-wider mb-0.5 border-b border-stone-700 pb-1">Verified Source</span>
            <span className="font-serif italic text-white">statista.com/stats/market-share...</span>
            <span className="text-green-400 font-bold flex items-center gap-1 mt-0.5">
              <ShieldCheck size={8} /> DR 92 TRUSTED
            </span>
            {/* Triangle */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900"></span>
          </span>

        </span>, growing at a CAGR of 12%.
      </p>
      <div className="absolute -right-1 -bottom-2 transform rotate-12 bg-white border border-stone-200 shadow-sm px-2 py-0.5 rounded text-[8px] font-mono text-stone-400">
        citation_check: PASS
      </div>
    </div>
  </div>
);

const PlanVisual = () => (
  <div className="w-full h-full flex items-center justify-center p-6">
    <div className="relative w-full max-w-[200px] bg-white border border-stone-100 rounded-lg p-3 shadow-sm flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-50 pb-2 mb-2">
        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Growth Roadmap</span>
        <Calendar size={10} className="text-stone-300" />
      </div>

      {/* Timeline */}
      <div className="relative border-l border-stone-100 ml-1.5 space-y-3 py-1">

        {/* Item 1 */}
        <div className="relative pl-4">
          <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-stone-300 ring-2 ring-white"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-stone-300 line-through">Deep Research</span>
            <span className="text-[7px] text-stone-300">Completed</span>
          </div>
        </div>

        {/* Item 2 */}
        <div className="relative pl-4">
          <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-brand-500 ring-2 ring-brand-100 shadow-sm animate-pulse"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-stone-800">Cluster Deployment</span>
            <div className="h-1 w-12 bg-stone-100 rounded-full mt-1 overflow-hidden">
              <div className="h-full w-2/3 bg-brand-400"></div>
            </div>
          </div>
        </div>

        {/* Item 3 */}
        <div className="relative pl-4 opacity-50">
          <div className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-stone-200 ring-2 ring-white"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-stone-500">Authority Compounding</span>
            <span className="text-[7px] text-stone-400">Day 30+</span>
          </div>
        </div>

      </div>
    </div>
  </div>
);

// --- New Features (07 & 08) ---

const AnswerFirstVisual = () => (
  <div className="w-full h-full flex items-center justify-center p-6">
    <div className="w-full max-w-[220px] bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
      {/* Window Header */}
      <div className="bg-stone-900 px-3 py-1.5 flex justify-between items-center">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-stone-700"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-stone-700"></div>
        </div>
        <span className="text-[7px] font-mono text-stone-400">STRUCTURE_ANALYSIS</span>
      </div>

      {/* Content Body */}
      <div className="p-3 flex flex-col gap-3">

        {/* Direct Answer Block */}
        <div className="border border-brand-200 bg-brand-50/50 rounded p-2">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[7px] font-bold text-stone-800 border-b border-brand-300 pb-0.5">DIRECT_ANSWER_BLOCK</span>
          </div>
          <div className="space-y-1">
            <div className="w-full h-1 bg-brand-200 rounded-full"></div>
            <div className="w-full h-1 bg-brand-200 rounded-full"></div>
            <div className="w-3/4 h-1 bg-brand-200 rounded-full"></div>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="text-[6px] text-brand-600 font-bold">45 Words</span>
            <span className="text-[6px] text-brand-600 font-bold">NLP Score 0.99</span>
          </div>
        </div>

        {/* Semantic Context */}
        <div className="bg-stone-50 rounded p-2 space-y-1">
          <div className="w-full h-1 bg-stone-200 rounded-full"></div>
          <div className="w-2/3 h-1 bg-stone-200 rounded-full"></div>
          <div className="flex justify-center my-1">
            <span className="text-[6px] bg-white border border-stone-200 px-1 rounded text-stone-400">SEMANTIC_CONTEXT</span>
          </div>
          <div className="w-full h-1 bg-stone-200 rounded-full"></div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 pt-2 flex justify-between items-center">
          <span className="text-[7px] font-bold text-stone-800 uppercase">Readability: Grade 8</span>
          <span className="text-[7px] font-bold text-green-600 flex items-center gap-0.5">
            <CheckCircle2 size={6} /> OPTIMIZED
          </span>
        </div>

      </div>
    </div>
  </div>
);

const CMSVisual = () => (
  <div className="w-full h-full flex items-center justify-center p-6 relative">
    <div className="flex flex-col items-center gap-4 w-full max-w-[200px]">

      {/* Source Node */}
      <div className="relative z-10 bg-stone-900 text-white px-4 py-2 rounded-lg shadow-lg flex flex-col items-center">
        <span className="text-[8px] font-bold tracking-widest text-brand-400 mb-0.5">SOURCE</span>
        <span className="font-serif font-bold text-lg leading-none">FlipAEO</span>
        {/* Output Nodes Connector */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4 bg-stone-900"></div>
      </div>

      {/* Connection Lines Container */}
      <div className="w-full h-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-stone-300 border-l border-r border-stone-300 border-dashed bg-transparent"></div>
        {/* Diagonal Lines */}
        <div className="absolute top-0 left-1/2 w-20 h-full border-t-2 border-r-2 border-stone-300 rounded-tr-xl border-dashed transform -translate-x-[2px]"></div>
        <div className="absolute top-0 right-1/2 w-20 h-full border-t-2 border-l-2 border-stone-300 rounded-tl-xl border-dashed transform translate-x-[2px]"></div>
      </div>

      {/* Destinations */}
      <div className="flex justify-between w-full gap-2">
        {/* Wordpress */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-white border-2 border-stone-800 rounded-lg flex items-center justify-center shadow-sm group hover:-translate-y-1 transition-transform">
            <span className="font-serif font-bold text-xl text-stone-800">W</span>
          </div>
          <span className="text-[8px] font-bold border border-stone-200 px-1 py-0.5 rounded bg-white">Wordpress</span>
        </div>

        {/* Shopify */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-green-50 border-2 border-green-600 rounded-lg flex items-center justify-center shadow-sm group hover:-translate-y-1 transition-transform">
            <ShoppingBag size={18} className="text-green-700" />
          </div>
          <span className="text-[8px] font-bold border border-stone-200 px-1 py-0.5 rounded bg-white">Shopify</span>
        </div>

        {/* Webflow */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 bg-blue-50 border-2 border-blue-600 rounded-lg flex items-center justify-center shadow-sm group hover:-translate-y-1 transition-transform">
            <div className="font-bold text-blue-700 italic text-sm">wf</div>
          </div>
          <span className="text-[8px] font-bold border border-stone-200 px-1 py-0.5 rounded bg-white">Webflow</span>
        </div>
      </div>

    </div>
  </div>
)


const FEATURES = [
  {
    id: '01',
    title: 'AI Readiness & Category Intelligence',
    description: 'We analyze how search engines and AI models understand your category. Find the exact gaps where competitors are winning and your brand is invisible.',
    visual: ReadinessVisual,
    colSpan: 'col-span-1'
  },
  {
    id: '02',
    title: 'Brand Voice Consistency',
    description: 'Your tone, positioning, and language stay consistent across every article. No generic AI voice. No reset every month.',
    visual: VoiceVisual,
    colSpan: 'col-span-1'
  },
  {
    id: '03',
    title: "Multi-Stage 'Expert' Research",
    description: 'We do not summarize the internet. We verify claims, surface missing data, and fill the gaps competitors avoid. This is what turns content into something AI systems trust enough to cite.',
    visual: ResearchVisual,
    colSpan: 'col-span-1'
  },
  {
    id: '04',
    title: 'Semantic Internal Linking',
    description: 'Every article knows why it exists and what it supports. We connect content by intent and meaning, Not random links or SEO templates. Nothing published stands alone.',
    visual: LinkingVisual,
    colSpan: 'col-span-1'
  },
  {
    id: '05',
    title: 'Instant Credibility & Trust',
    description: 'Every important claim is backed by real sources. Not after publishing, Not manually. Authority is part of the content, not an afterthought.',
    visual: CredibilityVisual,
    colSpan: 'col-span-1'
  },
  {
    id: '06',
    title: '30-Day Authority-Driven Content Plan',
    description: 'We do not ask “What should we write this month?” We decide What comes first, What unlocks the next article and what should wait. This is how authority compounds instead of stalling.',
    visual: PlanVisual,
    colSpan: 'col-span-1'
  },
  {
    id: '07',
    title: 'Answer-First Generation',
    description: 'Articles are written to explain clearly and completely, not to pad keywords. Built for how humans read and how AI systems evaluate trust.',
    visual: AnswerFirstVisual,
    colSpan: 'col-span-1'
  },
  {
    id: '08',
    title: 'Automated CMS Publishing',
    description: 'Automatically publish to Wordpress, Webflow, Shopify or export clean markdown. No formatting fixes. No workflow friction.',
    visual: CMSVisual,
    colSpan: 'col-span-1'
  }
];

const FeatureCard: React.FC<{ feature: typeof FEATURES[0] }> = ({ feature }) => (
  <div className="h-full bg-brand-100 rounded-[20px] p-2 shadow-[inset_0_0_0_1px_#c4b5fd] group hover:-translate-y-1 transition-transform duration-300">

    {/* Inner White Card Base */}
    <div className="h-full bg-white rounded-[17px] overflow-hidden border border-white flex flex-col shadow-sm relative">

      {/* 1. Visual Area (Top ~55%) */}
      {/* Clean white stage for the graphic to pop */}
      <div className="h-64 w-full relative flex items-center justify-center bg-white">
        {/* Subtle active grid pattern on hover */}
        <div className="absolute inset-0 opacity-0.15 transition-opacity duration-500"
          style={{ backgroundImage: 'radial-gradient(#e7e5e4 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        </div>
        <div className="scale-90 transform transition-transform duration-500 group-hover:scale-95">
          {feature.visual && <feature.visual />}
        </div>
      </div>

      {/* 2. Ingested Content Card (Bottom) */}
      {/* The "Gray Box" idea: Creating a 'Card within a Card' look for the technical specs */}
      <div className="flex-1 px-2 pb-2">
        <div className="h-full bg-[#fafaf9] rounded-[17px] p-6 border border-stone-100 flex flex-col justify-between group-hover:bg-brand-100/50 group-hover:border-brand-100/70 transition-colors duration-300">

          <div>
            {/* Header Row */}
            <div className="flex items-center gap-3 mb-3">
              {/* Feature Number Pill */}
              <span className="flex items-center justify-center h-6 px-2 rounded-md bg-white border border-stone-200 text-[10px] font-bold tracking-wider text-stone-400 shadow-sm group-hover:text-brand-500 group-hover:border-brand-200 transition-colors">
                {feature.id}
              </span>
            </div>

            <h3 className="font-serif text-2xl text-stone-900 leading-[1.1] mb-3 group-hover:text-stone-950">
              {feature.title}
            </h3>

            <p className="font-sans text-[13px] text-stone-500 leading-relaxed font-medium">
              {feature.description}
            </p>
          </div>


        </div>
      </div>

    </div>
  </div>
);

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="w-full max-w-5xl mx-auto py-20 md:py-32 px-6">

      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-16">


        <h2 className="font-serif text-4xl md:text-6xl text-stone-900 mb-6 tracking-tight font-normal">
          How we make you win <br /><span className='italic'>Modern AI Search</span>
        </h2>

        <p className="font-sans text-stone-500 text-lg leading-relaxed max-w-2xl">
          A focused system that removes guesswork from growth. Every feature exists to answer one question “What should exist next for this brand to win”

        </p>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {FEATURES.map((feature, index) => (
          <FeatureCard key={index} feature={feature} />
        ))}
      </div>

    </section>
  );
};

export default FeaturesSection;