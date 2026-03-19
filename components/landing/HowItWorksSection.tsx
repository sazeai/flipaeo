import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { CornerSquare } from './CornerSquare';

const DiscoveryVisual = () => (
  <div className="w-full h-40 bg-stone-50/50 border border-stone-100 rounded-lg overflow-hidden relative flex items-center justify-center">
    {/* Clean Grid Background */}
    <div className="absolute inset-0 opacity-40"
      style={{ backgroundImage: 'radial-gradient(#a8a29e 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
    </div>

    {/* The Data Landscape */}
    <div className="relative w-full h-full group">
      {/* Distraction/Noise Dots (Subtle) */}
      <div className="absolute top-8 left-12 w-1.5 h-1.5 bg-stone-300 rounded-full opacity-50"></div>
      <div className="absolute top-16 left-24 w-1 h-1 bg-stone-300 rounded-full opacity-50"></div>
      <div className="absolute bottom-10 right-16 w-1.5 h-1.5 bg-stone-300 rounded-full opacity-50"></div>
      <div className="absolute top-12 right-10 w-1 h-1 bg-stone-300 rounded-full opacity-50"></div>

      {/* The Target: Perfectly Centered */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
        <div className="relative cursor-default">
          {/* Active Pulse Ring */}
          <div className="absolute -inset-6 bg-brand-100/50 rounded-full animate-pulse"></div>
          <div className="absolute -inset-2 bg-brand-200/50 rounded-full animate-ping opacity-20"></div>

          {/* Core Dot */}
          <div className="relative w-3.5 h-3.5 bg-brand-500 rounded-full shadow-[0_2px_8px_rgba(249,115,22,0.4)] border-2 border-white z-20"></div>

          {/* High-Fidelity Data Tooltip */}
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white border border-stone-200 shadow-xl rounded-lg p-3 w-40 flex flex-col gap-2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center border-b border-stone-100 pb-1.5">
              <span className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">Keyword Opportunity</span>
            </div>
            <div className="flex items-center justify-between text-[10px] gap-2">
              <div className="flex flex-col">
                <span className="text-stone-400 font-medium text-[9px]">Volume</span>
                <span className="text-stone-900 font-bold">12,400</span>
              </div>
              <div className="w-px h-4 bg-stone-100"></div>
              <div className="flex flex-col items-end">
                <span className="text-stone-400 font-medium text-[9px]">Difficulty</span>
                <span className="text-green-600 font-bold bg-green-50 px-1 rounded">Low</span>
              </div>
            </div>
            {/* Arrow Pointer */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-2.5 h-2.5 bg-white border-b border-r border-stone-200 transform rotate-45"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Visual 2: The "Symmetrical Architecture"
 * A perfectly centered tree diagram showing flow from Pillar to Clusters.
 */
const StrategyVisual = () => (
  <div className="w-full h-40 bg-white border border-stone-100 rounded-lg overflow-hidden relative flex flex-col items-center justify-center pt-2">
    {/* Background Web Pattern */}
    <div className="absolute inset-0 opacity-[0.03]"
      style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }}>
    </div>

    {/* Pillar Node (Parent) */}
    <div className="relative z-10 mb-6">
      <div className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] rounded-full">
        <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>
        <div className="text-[10px] font-bold text-stone-800 tracking-tight">Core Pillar Page</div>
      </div>
    </div>

    {/* Tree Connectors (SVG) */}
    <div className="relative w-48 h-10 -mt-6 mb-0 pointer-events-none z-0">
      <svg className="w-full h-full overflow-visible">
        {/* Main Stem */}
        <path d="M96,15 L96,35" stroke="#e7e5e4" strokeWidth="1.5" fill="none" />
        {/* Crossbar */}
        <path d="M24,35 L168,35" stroke="#e7e5e4" strokeWidth="1.5" fill="none" />
        {/* Drops */}
        <path d="M24,35 L24,45" stroke="#e7e5e4" strokeWidth="1.5" fill="none" />
        <path d="M96,35 L96,45" stroke="#e7e5e4" strokeWidth="1.5" fill="none" />
        <path d="M168,35 L168,45" stroke="#e7e5e4" strokeWidth="1.5" fill="none" />

        {/* Moving Energy Particles */}
        <circle r="1.5" fill="#f97316">
          <animateMotion dur="3s" repeatCount="indefinite" path="M96,15 L96,35 L24,35 L24,45" keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
        </circle>
        <circle r="1.5" fill="#f97316">
          <animateMotion dur="3s" repeatCount="indefinite" path="M96,15 L96,35 L168,35 L168,45" keyPoints="0;1" keyTimes="0;1" calcMode="linear" />
        </circle>
      </svg>
    </div>

    {/* Cluster Nodes (Children) */}
    <div className="grid grid-cols-3 gap-6 w-56 relative z-10">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-8 bg-stone-50 border border-stone-100 rounded-md flex items-center justify-center shadow-sm relative group">
          <div className="w-8 h-1.5 bg-stone-200 rounded-full group-hover:bg-brand-200 transition-colors"></div>
          {/* Hover tooltip for effect */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Visual 3: The "Chat Interaction"
 * A realistic AI Chat interface showing the brand being cited. 
 * Replaces the "dummy" lines with readable, context-aware content.
 */
const ExecutionVisual = () => (
  <div className="w-full h-40 bg-stone-50/50 border border-stone-100 rounded-lg overflow-hidden relative flex items-center justify-center">

    {/* Chat Container */}
    <div className="w-full max-w-[260px] flex flex-col gap-3 p-4">

      {/* User Message */}
      <div className="self-end flex items-center gap-2 max-w-[90%] animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="bg-white border border-stone-100 text-stone-600 text-[9px] px-3 py-2 rounded-2xl rounded-tr-sm shadow-sm">
          How do I increase organic traffic?
        </div>
        <div className="w-5 h-5 bg-stone-200 rounded-full border border-white shadow-sm flex-shrink-0"></div>
      </div>

      {/* AI Response */}
      <div className="self-start flex items-start gap-2 max-w-[95%] animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
        <div className="w-5 h-5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full border border-white shadow-sm flex items-center justify-center flex-shrink-0 text-white">
          <Sparkles size={8} fill="currentColor" />
        </div>

        <div className="flex flex-col gap-2">
          {/* AI Text Bubble */}
          <div className="bg-white border border-stone-100 p-2.5 rounded-2xl rounded-tl-sm shadow-sm relative overflow-hidden">
            <p className="text-[9px] text-stone-600 leading-relaxed">
              The most effective method is <span className="text-stone-900 font-bold bg-brand-100/50 px-1 rounded">Answer Engine Optimization</span>. It focuses on...
            </p>
          </div>

          {/* The Citation Card (The Hero Element) */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-3 h-px bg-stone-300"></div>
            <div className="flex items-center gap-2 bg-white border border-brand-200 pl-1.5 pr-2.5 py-1 rounded-full shadow-sm hover:scale-105 transition-transform cursor-default">
              <div className="w-3.5 h-3.5 bg-brand-500 rounded-full flex items-center justify-center text-white text-[6px] font-bold">
                F
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[7px] font-bold text-stone-900">Source: FlipAEO</span>
              </div>
              <CheckCircle2 size={8} className="text-green-500 ml-1" />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
);

const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="w-full py-24 relative z-10">
      <div className="w-full max-w-[1250px] mx-auto px-3 sm:px-5">

        {/* Horizontal Pattern Bar Above Header */}
        <div className="w-full h-3 sm:h-4 border-y border-stone-200 mb-16" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px)' }}></div>

        {/* Header - Left/Right Premium Setup */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 justify-between items-start md:items-end mb-16 w-full px-4 md:px-8">
          <div className="flex-1">
            <span className="font-sans text-xs font-bold tracking-widest text-brand-500 uppercase mb-4 block">
              The Process
            </span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 tracking-tight font-normal leading-[1]">
              A Proven System for  <br /><span className='italic text-stone-500'>Compounding Traffic</span>
            </h2>
          </div>
          <div className="flex-1 md:max-w-xl pb-0 md:pb-2">
            <p className="font-sans text-stone-500 text-lg leading-relaxed">
              Clear answers, real authority, and active publishing perfectly designed for modern AI search engines and human readers.
            </p>
          </div>
        </div>

        {/* Horizontal Pattern Bar Top (Grid Boundary) */}
        <div className="relative w-full h-3 sm:h-4 border-y border-stone-200" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px)' }}>

          <CornerSquare className="-left-[5px] -bottom-[5px]" />
          <CornerSquare className="-right-[5px] -bottom-[5px]" />
        </div>

        {/* Premium Wireframe Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 border-x border-stone-200 bg-white relative">

          {/* Main Grid Corners */}
          <CornerSquare className="-left-[5px] -top-[5px]" />
          <CornerSquare className="-right-[5px] -top-[5px]" />
          <CornerSquare className="-left-[5px] -bottom-[5px]" />
          <CornerSquare className="-right-[5px] -bottom-[5px]" />

          {/* Junctions */}
          <div className="hidden md:block absolute top-0 left-[33.33%] -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerSquare className="-left-[4px] -top-[4px]" />
          </div>
          <div className="hidden md:block absolute top-0 left-[66.66%] -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerSquare className="-left-[4px] -top-[4px]" />
          </div>
          <div className="hidden md:block absolute bottom-0 left-[33.33%] -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerSquare className="-left-[4px] -top-[4px]" />
          </div>
          <div className="hidden md:block absolute bottom-0 left-[66.66%] -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerSquare className="-left-[4px] -top-[4px]" />
          </div>

          {/* Step 1 Card */}
          <div className="w-full p-8 md:p-12 border-b md:border-r border-stone-200 flex flex-col gap-8 group transition-colors hover:bg-stone-50/50">
            <div className="w-full h-40 overflow-hidden rounded-lg relative border border-stone-100 bg-stone-50">
              <DiscoveryVisual />
            </div>
            <div className="flex flex-col gap-4 mt-auto">
              <div className="flex items-center">
                <div className="px-3 py-1 rounded-sm border border-brand-200 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-widest">
                  Step 1
                </div>
              </div>
              <h3 className="font-serif text-2xl text-stone-900 leading-tight">
                We map the questions that matter
              </h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">
                We understand your category the way AI systems and real users do. What questions already exist. What’s over-covered. What’s missing entirely. This becomes the foundation.
              </p>
            </div>
          </div>

          {/* Step 2 Card */}
          <div className="w-full p-8 md:p-12 border-b md:border-r border-stone-200 flex flex-col gap-8 group transition-colors hover:bg-stone-50/50">
            <div className="w-full h-40 overflow-hidden rounded-lg bg-white border border-stone-100 relative">
              <StrategyVisual />
            </div>
            <div className="flex flex-col gap-4 mt-auto">
              <div className="flex items-center">
                <div className="px-3 py-1 rounded-sm border border-brand-200 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-widest">
                  Step 2
                </div>
              </div>
              <h3 className="font-serif text-2xl text-stone-900 leading-tight">
                We build a strategy that compounds
              </h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">
                Not everything should be written now. We decide what comes first, what supports it, and what unlocks authority later. Each topic earns the right for the next one to exist.
              </p>
            </div>
          </div>

          {/* Step 3 Card */}
          <div className="w-full p-8 md:p-12 border-b border-stone-200 flex flex-col gap-8 group transition-colors hover:bg-stone-50/50">
            <div className="w-full h-40 overflow-hidden rounded-lg border border-stone-100 relative bg-stone-50">
              <ExecutionVisual />
            </div>
            <div className="flex flex-col gap-4 mt-auto">
              <div className="flex items-center">
                <div className="px-3 py-1 rounded-sm border border-brand-200 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-widest">
                  Step 3
                </div>
              </div>
              <h3 className="font-serif text-2xl text-stone-900 leading-tight">
                Deliver answer-first authentic content
              </h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">
                Once the strategy is clear, execution becomes simple. Articles are written to fully resolve the question, match your brand voice, and publish cleanly without friction.
              </p>
            </div>
          </div>

        </div>

        {/* Quote Section incorporated into the Wireframe */}
        <div className="w-full bg-stone-50/30 border-x border-b border-stone-200 p-8 md:p-16 flex flex-col items-center justify-center relative">
          {/* Corners */}
          <CornerSquare className="-left-[5px] -bottom-[5px]" />
          <CornerSquare className="-right-[5px] -bottom-[5px]" />

          {/* Abstract quote visuals */}
          <div className="absolute top-8 left-8 text-stone-200 opacity-50">
            <span className="font-serif text-8xl leading-none">"</span>
          </div>

          <div className="text-center max-w-4xl relative z-10 mt-4">
            <p className="font-serif text-2xl md:text-3xl text-stone-800 leading-relaxed italic">
              This is not only content automation for speed. It’s a system designed to earn <span className="relative inline-block px-2 italic font-medium text-stone-900">
                <span className="relative z-10">visibility, trust, and long-term growth.</span>
              </span>
            </p>
          </div>
        </div>

        {/* Horizontal Pattern Bar Bottom (Grid Boundary) */}
        <div className="relative w-full h-3 sm:h-4 border-y border-stone-200" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px)' }}>
          <CornerSquare className="-left-[5px] -top-[5px]" />
          <CornerSquare className="-right-[5px] -top-[5px]" />
        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;