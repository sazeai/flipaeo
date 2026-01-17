import React from 'react';
import {
  BrainCircuit,
  Fingerprint,
  Check,
  X,
  Sparkles,
  AlertCircle,
  Database,
  Bot,
  FileText
} from 'lucide-react';

// --- VISUAL GRAPHICS COMPONENTS (Defined BEFORE usage to avoid hoisting errors) ---

const VisibilityScanGraphic = () => (
  <div className="w-full max-w-sm bg-white border-2 border-black shadow-neo overflow-hidden flex flex-col relative min-h-[300px]">
    {/* Header */}
    <div className="h-10 border-b-2 border-black bg-gray-50 flex items-center justify-between px-4">
      <span className="font-mono text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category_Intelligence.json</span>
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-gray-300 border border-black"></div>
        <div className="w-2 h-2 rounded-full bg-gray-300 border border-black"></div>
      </div>
    </div>

    {/* Dashboard Content */}
    <div className="p-6 flex flex-col gap-6 bg-white">
      {/* Score Card */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">AI Readiness Score</div>
          <div className="font-display font-black text-4xl">42<span className="text-xl text-gray-400">/100</span></div>
        </div>
        <div className="px-2 py-1 bg-red-100 border border-black text-[10px] font-bold text-red-700 rounded">
          CRITICAL GAPS
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-3">
        {/* Metric 1 */}
        <div className="flex items-center justify-between p-3 border border-gray-100 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white border border-black flex items-center justify-center">
              <Database className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-900">Brand Mentions</div>
              <div className="text-[9px] text-gray-500">In top 10 search results</div>
            </div>
          </div>
          <div className="font-mono font-bold text-sm">0/10</div>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center justify-between p-3 border border-gray-100 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white border border-black flex items-center justify-center">
              <Bot className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-900">Competitor Dominance</div>
              <div className="text-[9px] text-gray-500">Share of voice</div>
            </div>
          </div>
          <div className="font-mono font-bold text-sm">High</div>
        </div>
      </div>

      {/* Footer Insight */}
      <div className="mt-auto border-t border-dashed border-gray-200 pt-4">
        <div className="flex gap-2 text-[10px]">
          <AlertCircle className="w-4 h-4 text-brand-orange" />
          <span className="font-medium text-gray-600 leading-tight">Your brand is missing from 85% of informational queries in this category.</span>
        </div>
      </div>
    </div>
  </div>
);

const BrandVoiceGraphic = () => (
  <div className="w-full max-w-[260px] bg-white border-2 border-black p-6 shadow-neo">
    <div className="space-y-4">
      {/* Slider 1 */}
      <div>
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>PROFESSIONAL</span>
          <span>85%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 border-2 border-black rounded-full relative">
          <div className="absolute top-0 left-0 bottom-0 w-[85%] bg-[#C8FFC8] border-r-2 border-black rounded-l-full"></div>
          <div className="absolute top-1/2 left-[85%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-black rounded-full shadow-sm"></div>
        </div>
      </div>
      {/* Slider 2 */}
      <div>
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>WITTY</span>
          <span>40%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 border-2 border-black rounded-full relative">
          <div className="absolute top-0 left-0 bottom-0 w-[40%] bg-brand-yellow border-r-2 border-black rounded-l-full"></div>
          <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-black rounded-full shadow-sm"></div>
        </div>
      </div>
      {/* Slider 3 */}
      <div>
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>TECHNICAL</span>
          <span>90%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 border-2 border-black rounded-full relative">
          <div className="absolute top-0 left-0 bottom-0 w-[90%] bg-black border-r-2 border-black rounded-l-full"></div>
          <div className="absolute top-1/2 left-[90%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-black rounded-full shadow-sm"></div>
        </div>
      </div>
    </div>
  </div>
);

const ResearchGraphic = () => (
  <div className="w-full max-w-[300px] bg-white border-2 border-black p-4 shadow-neo flex flex-col gap-3 relative">
    {/* Header */}
    <div className="flex items-center justify-between border-b-2 border-black pb-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full border border-black"></div>
        <span className="font-mono text-[10px] font-bold">DEEP_RESEARCH.logs</span>
      </div>
    </div>

    {/* Content */}
    <div className="space-y-2 font-mono text-[10px]">
      <div className="bg-gray-50 p-2 border border-dashed border-black/20 text-gray-400">
        &gt; Initial Scan... Found 12 generic articles.
      </div>
      <div className="bg-red-50 p-2 border border-black text-red-800 font-medium animate-pulse">
        &gt; CRITIC: Missing pricing data.
      </div>
      <div className="bg-blue-50 p-2 border border-black text-blue-800">
        &gt; AGENT: Hunting specific pricing tables...
      </div>
      <div className="bg-green-50 p-2 border-2 border-black text-green-800 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        &gt; ACQUIRED: 2026 Benchmarks found.
      </div>
    </div>
  </div>
);

const InternalLinkGraphic = () => (
  <div className="relative w-full max-w-[280px] h-[220px] bg-white border-2 border-black p-4 shadow-neo flex items-center justify-center">
    {/* Nodes */}
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-12 w-full justify-center">
      <div className="w-12 h-12 bg-gray-100 border-2 border-black rounded-lg flex items-center justify-center opacity-60">
        <FileText className="w-5 h-5 text-gray-400" />
      </div>
      <div className="w-12 h-12 bg-gray-100 border-2 border-black rounded-lg flex items-center justify-center opacity-60">
        <FileText className="w-5 h-5 text-gray-400" />
      </div>
    </div>

    {/* Center New Node */}
    <div className="w-16 h-16 bg-[#E8C8FF] border-2 border-black rounded-lg flex items-center justify-center z-20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
      <div className="absolute -top-3 -right-3 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 border border-black transform rotate-6">NEW</div>
      <Check className="w-8 h-8 text-black" />
    </div>

    {/* Connection Lines (SVG) */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
      {/* Dynamic connecting lines */}
      <path d="M140 110 L90 50" stroke="black" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_1s_linear_infinite]" />
      <path d="M140 110 L190 50" stroke="black" strokeWidth="2" strokeDasharray="4 4" className="animate-[dash_1s_linear_infinite]" />
    </svg>

    <div className="absolute bottom-4 text-center w-full">
      <span className="font-mono text-[9px] bg-black text-white px-2 py-0.5">CONTEXTUAL_LINKING: ACTIVE</span>
    </div>
  </div>
);

const CitationsGraphic = () => (
  <div className="w-full max-w-[300px] h-48 bg-gray-50 border-2 border-black p-0 shadow-neo relative overflow-hidden flex flex-col">
    {/* Browser Bar */}
    <div className="bg-white border-b-2 border-black px-3 py-2 flex items-center gap-2">
      <div className="w-2 h-2 rounded-full border border-black bg-gray-200"></div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full border border-black/10"></div>
    </div>

    {/* Content Area */}
    <div className="p-4 relative">
      <div className="w-3/4 h-2 bg-gray-200 mb-2"></div>
      <div className="w-full h-2 bg-gray-200 mb-2"></div>

      {/* Highlighted Citation */}
      <div className="inline-block relative group cursor-help">
        <span className="bg-[#C8D6FF] border-b-2 border-blue-400 px-0.5 font-bold text-xs">According to Statista (2024),</span>

        {/* Tooltip Popup */}
        <div className="absolute bottom-full mb-2 left-0 w-48 bg-black text-white p-2 rounded text-[9px] border-2 border-white shadow-lg z-20">
          <div className="font-bold text-[#C8D6FF] mb-1">VERIFIED SOURCE</div>
          <div className="opacity-80 truncate">statista.com/stats/market-share...</div>
          <div className="mt-1 flex gap-1">
            <span className="bg-green-500 text-black px-1 rounded-[1px] font-bold">DR 92</span>
            <span className="bg-green-500 text-black px-1 rounded-[1px] font-bold">TRUSTED</span>
          </div>
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black"></div>
        </div>
      </div>

      <span className="inline-block w-1/3 h-2 bg-gray-200 ml-1"></span>
    </div>
  </div>
);

const AuthorityPlanGraphic = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
    {/* Connecting Lines (SVG) */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      {/* Root to Left Branch */}
      <path d="M50% 35% L30% 60%" stroke="black" strokeWidth="2" fill="none" />
      {/* Root to Right Branch */}
      <path d="M50% 35% L70% 60%" stroke="black" strokeWidth="2" fill="none" />
      {/* Right Branch to Leaf */}
      <path d="M70% 75% L70% 85%" stroke="black" strokeWidth="2" strokeDasharray="4 4" fill="none" />
    </svg>

    {/* Level 1: Anchor Article */}
    <div className="relative z-10 flex flex-col items-center mb-8">
      <div className="bg-[#D6F5F2] border-2 border-black shadow-neo px-4 py-2 flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-black" />
        <span className="font-bold text-xs uppercase">Anchor Article</span>
      </div>
      <span className="text-[9px] font-mono bg-black text-white px-1.5 py-0.5">DAY 01: UNLOCKED</span>
    </div>

    {/* Level 2: Clusters */}
    <div className="relative z-10 flex w-full justify-between px-8 md:px-16">
      {/* Left Cluster */}
      <div className="flex flex-col items-center">
        <div className="w-24 bg-white border-2 border-black p-2 flex flex-col gap-1 items-center opacity-100">
          <div className="w-full h-1.5 bg-gray-200"></div>
          <div className="w-2/3 h-1.5 bg-gray-200"></div>
          <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-gray-500">
            <div className="w-2 h-2 border border-black bg-green-400 rounded-full"></div>
            Cluster A
          </div>
        </div>
      </div>

      {/* Right Cluster */}
      <div className="flex flex-col items-center transform translate-y-2">
        <div className="w-24 bg-white border-2 border-black p-2 flex flex-col gap-1 items-center shadow-sm">
          <div className="w-full h-1.5 bg-gray-800"></div>
          <div className="w-2/3 h-1.5 bg-gray-800"></div>
          <div className="mt-1 flex items-center gap-1 text-[9px] font-bold">
            <div className="w-2 h-2 border border-black bg-orange-400 rounded-full"></div>
            Cluster B
          </div>
        </div>
        {/* Connection to hidden leaf */}
        <div className="absolute top-full mt-2">
          <div className="w-8 h-10 border-2 border-black border-dashed bg-gray-50 flex items-center justify-center">
            <div className="w-3 h-3 text-gray-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AnswerFirstGraphic = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
    {/* Blueprint Background */}
    <div className="absolute inset-0 bg-[#F5F5F5] border-2 border-dashed border-gray-300"></div>
    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:16px_16px]"></div>

    {/* The Analysis Card */}
    <div className="relative z-10 w-full max-w-[280px] bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">

      {/* Header */}
      <div className="bg-black text-white px-3 py-2 flex justify-between items-center text-[10px] font-mono tracking-wider">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span>STRUCTURE_ANALYSIS</span>
        </div>
        <span className="opacity-70">v2.4.0</span>
      </div>

      {/* Content Body */}
      <div className="p-4 flex flex-col gap-4">

        {/* Block 1: The Direct Answer */}
        <div className="relative border-2 border-brand-orange bg-orange-50/50 p-2">
          {/* Label Overlay */}
          <div className="absolute -top-2.5 left-2 bg-brand-orange text-black text-[8px] font-bold px-1.5 border border-black">
            DIRECT_ANSWER_BLOCK
          </div>

          {/* Skeleton Text */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="w-full h-1.5 bg-brand-orange/20 rounded-sm"></div>
            <div className="w-full h-1.5 bg-brand-orange/20 rounded-sm"></div>
            <div className="w-3/4 h-1.5 bg-brand-orange/20 rounded-sm"></div>
          </div>

          {/* Metrics */}
          <div className="mt-2 flex gap-2 border-t border-brand-orange/20 pt-1.5">
            <div className="flex flex-col">
              <span className="text-[7px] text-gray-400 font-bold uppercase">Length</span>
              <span className="text-[9px] font-mono font-bold text-brand-orange">45 Words</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] text-gray-400 font-bold uppercase">NLP Score</span>
              <span className="text-[9px] font-mono font-bold text-brand-orange">0.99</span>
            </div>
          </div>
        </div>

        {/* Block 2: Supporting Context */}
        <div className="relative border border-gray-200 bg-gray-50 p-2 opacity-60">
          <div className="flex flex-col gap-1.5">
            <div className="w-full h-1.5 bg-gray-300 rounded-sm"></div>
            <div className="w-full h-1.5 bg-gray-300 rounded-sm"></div>
            <div className="w-5/6 h-1.5 bg-gray-300 rounded-sm"></div>
            <div className="w-full h-1.5 bg-gray-300 rounded-sm"></div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 border border-gray-300 px-2 py-0.5 text-[8px] font-mono text-gray-500 shadow-sm">
            SEMANTIC_CONTEXT
          </div>
        </div>

      </div>

      {/* Footer Status */}
      <div className="bg-gray-50 border-t-2 border-black px-3 py-2 flex items-center justify-between text-[9px] font-bold">
        <span>READABILITY: GRADE 8</span>
        <div className="flex items-center gap-1 text-[#95BF47]">
          <Check className="w-3 h-3" />
          <span>OPTIMIZED</span>
        </div>
      </div>

    </div>
  </div>
);

const CMSGraphic = () => (
  <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
    {/* Animated Connection Lines */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 ml-0 md:ml-[72px] -translate-y-6 md:translate-y-0">
      {/* Source Center: 50% width (150px in 300px box), Top section ~60px down */}
      {/* Dest Center Left: ~60px, Bottom ~160px */}
      <path d="M150 70 L80 160" stroke="black" strokeWidth="2" strokeDasharray="6 6" className="animate-[dash_2s_linear_infinite]" />
      {/* Dest Center Mid: ~150px, Bottom ~160px */}
      <path d="M150 70 L150 160" stroke="black" strokeWidth="2" strokeDasharray="6 6" className="animate-[dash_2s_linear_infinite]" />
      {/* Dest Center Right: ~240px, Bottom ~160px */}
      <path d="M150 70 L220 160" stroke="black" strokeWidth="2" strokeDasharray="6 6" className="animate-[dash_2s_linear_infinite]" />
    </svg>

    {/* Source Hub (FlipAEO) */}
    <div className="relative z-10 mb-16 transform -translate-y-2">
      <div className="w-32 h-12 bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] flex items-center justify-center relative">
        <span className="font-display font-black text-xl">FlipAEO</span>
        {/* Source Label */}
        <div className="absolute -right-3 -top-4 bg-brand-orange text-black border-2 border-black text-[9px] font-bold px-2 py-0.5 transform rotate-6 shadow-neo-sm">
          SOURCE
        </div>
      </div>
    </div>

    {/* Destination Hubs */}
    <div className="relative z-10 flex gap-4 md:gap-8 items-end">

      {/* WordPress */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 bg-white border-2 border-black shadow-neo flex items-center justify-center p-2.5 hover:-translate-y-1 transition-transform">
          <img src="/brands/wordpress.svg" alt="WordPress" className="w-full h-full object-contain" />
        </div>
        <span className="font-mono text-[10px] font-bold bg-white border border-black px-1">Wordpress</span>
      </div>

      {/* Shopify */}
      <div className="flex flex-col items-center gap-2 -translate-y-4 z-10">
        <div className="w-16 h-16 bg-[#95BF47]/20 border-2 border-black shadow-neo flex items-center justify-center p-3 hover:-translate-y-1 transition-transform">
          <img src="/brands/shopify.svg" alt="Shopify" className="w-full h-full object-contain" />
        </div>
        <span className="font-mono text-[10px] font-bold bg-white border border-black px-1">Shopify</span>
      </div>

      {/* Webflow */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 bg-white border-2 border-black shadow-neo flex items-center justify-center p-2.5 hover:-translate-y-1 transition-transform">
          <img src="/brands/webflow.svg" alt="Webflow" className="w-full h-full object-contain" />
        </div>
        <span className="font-mono text-[10px] font-bold bg-white border border-black px-1">Webflow</span>
      </div>

    </div>


  </div>
);

// --- MAIN FEATURE COMPONENT ---

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      id: "01",
      title: "AI Readiness & Category Intelligence",
      description: "We analyze how search engines and AI models understand your category. Find the exact gaps where competitors are winning and your brand is invisible.",
      color: "bg-[#FAFA9D]", // Yellow
      Graphic: VisibilityScanGraphic
    },
    {
      id: "02",
      title: "Brand Voice Consistency",
      description: "Your tone, positioning, and language stay consistent across every article. No generic AI voice. No reset every month.",
      color: "bg-[#C8FFC8]", // Soft Green
      Graphic: BrandVoiceGraphic
    },
    {
      id: "03",
      title: "Multi-Stage 'Expert' Research",
      description: "We do not summarize the internet. We verify claims, Surface missing data and fill the gaps competitors avoid. This is what turns content into something AI systems trust enough to cite.",
      color: "bg-[#FFC8C8]", // Soft Red
      Graphic: ResearchGraphic
    },
    {
      id: "04",
      title: "Semantic Internal Linking",
      description: "Every article knows why it exists and what it supports. We connect content by intent and meaning, Not random links or SEO templates. Nothing published stands alone.",
      color: "bg-[#E8C8FF]", // Soft Purple
      Graphic: InternalLinkGraphic
    },
    {
      id: "05",
      title: "Instant Credibility & Trust",
      description: "Every important claim is backed by real sources. Not after publishing, Not manually. Authority is part of the content, not an afterthought.",
      color: "bg-[#C8D6FF]", // Soft Blue
      Graphic: CitationsGraphic
    },
    {
      id: "06",
      title: "30-Day Authority-Driven Content Plan",
      description: "We do not ask “What should we write this month?” We decide What comes first, What unlocks the next article and what should wait. This is how authority compounds instead of stalling.",
      color: "bg-[#D6F5F2]", // Teal
      Graphic: AuthorityPlanGraphic
    },
    {
      id: "07",
      title: "Answer-First Generation",
      description: "Articles are written to explain clearly and completely, not to pad keywords. Built for how humans read and how AI systems evaluate trust.",
      color: "bg-[#FFD8A8]", // Orange
      Graphic: AnswerFirstGraphic
    },
    {
      id: "08",
      title: "Automated CMS Publishing",
      description: "Automatically publish to Wordpress, Webflow, Shopify or export clean markdown. No formatting fixes. No workflow friction. Strategy stays the hard part, execution disappears.",
      color: "bg-gray-100", // Gray
      Graphic: CMSGraphic
    }
  ];

  return (
    <section id="features" className="w-full py-24 px-4 flex flex-col items-center relative overflow-hidden">


      {/* Header */}
      <div className="flex flex-col items-center text-center mb-20 md:mb-32 max-w-4xl mx-auto relative z-10">
        <div className="inline-block bg-white border-2 border-black shadow-neo-sm px-4 py-1 mb-6 transform rotate-1 hover:rotate-0 transition-transform">
          <span className="font-display font-black text-xs uppercase tracking-widest">Features</span>
        </div>
        <h2 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl md:text-6xl leading-[1] mb-6 uppercase">
          How we make you win<br />modern AI search
        </h2>
        <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl">
          A focused system that removes guesswork from growth. Every feature exists to answer one question “What should exist next for this brand to win”
        </p>
      </div>

      {/* Features List - Zig Zag Layout */}
      <div className="w-full max-w-6xl flex flex-col gap-24 md:gap-32 relative z-10">
        {features.map((feature, index) => (
          <FeatureRow
            key={feature.id}
            feature={feature}
            isReversed={index % 2 !== 0}
          />
        ))}
      </div>

    </section>
  );
};

interface FeatureRowProps {
  feature: {
    id: string;
    title: string;
    description: string;
    color: string;
    Graphic: React.FC;
  };
  isReversed: boolean;
}

const FeatureRow: React.FC<FeatureRowProps> = ({ feature, isReversed }) => {
  const { Graphic } = feature;

  return (
    <div className={`flex flex-col md:flex-row items-center gap-12 md:gap-24 ${isReversed ? 'md:flex-row-reverse' : ''}`}>

      {/* Text Side */}
      <div className="flex-1 flex flex-col items-start text-left">
        <div className={`inline-flex items-center justify-center h-10 px-3 mb-6 border-2 border-black ${feature.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
          <span className="font-mono font-bold text-sm uppercase tracking-wider">Feature {feature.id}</span>
        </div>
        <h3 className="font-display font-black text-3xl md:text-4xl mb-6 uppercase leading-tight">
          {feature.title}
        </h3>
        <p className="font-sans text-gray-600 leading-relaxed font-medium text-lg max-w-xl">
          {feature.description}
        </p>
      </div>

      {/* Graphic Side */}
      <div className="flex-1 w-full relative">
        <div className={`relative w-full aspect-[4/3] md:aspect-square lg:aspect-[4/3] border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex items-center justify-center group`}>
          {/* Background Pattern */}
          <div className={`absolute inset-0 ${feature.color} opacity-20 bg-dot-pattern`}></div>

          {/* Graphic Content */}
          <div className="relative w-full h-full p-8 md:p-12 flex items-center justify-center">
            <Graphic />
          </div>

          {/* Hover Effect overlay */}
          <div className="absolute inset-0 border-4 border-transparent group-hover:border-black/5 transition-all duration-300 pointer-events-none rounded-xl"></div>
        </div>
      </div>

    </div>
  );
};
