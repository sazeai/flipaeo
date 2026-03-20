import React from 'react';
import { CornerSquare } from './CornerSquare';

const DiscoveryVisual = () => (
  <div className="w-full h-[320px] bg-stone-50/20 border-none relative flex justify-center items-end overflow-hidden pt-12 px-4 group/card">

    {/* Stacked Cards - 3 visible layers including front */}
    <div className="absolute top-7 left-1/2 -translate-x-1/2 w-[65%] h-full bg-stone-100/50 border border-stone-200/40 rounded-t-[2rem] z-0 transition-transform duration-700 ease-out group-hover/card:-translate-y-0.5 shadow-sm"></div>
    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[80%] h-full bg-stone-50/80 border border-stone-200/40 rounded-t-[2rem] z-10 transition-transform duration-700 ease-out delay-75 group-hover/card:-translate-y-1 shadow-sm"></div>

    {/* Main Card */}
    <div className="relative z-20 w-[94%] bg-white ring-1 ring-stone-200/50 rounded-t-[2rem] shadow-[0_4px_24px_rgb(0,0,0,0.03)] p-5 flex flex-col gap-3 text-sm h-[270px] transition-transform duration-700 ease-out delay-150 group-hover/card:-translate-y-1.5">

      <div className="w-full bg-stone-50/50 border border-stone-100/50 rounded-xl p-3 flex gap-2 items-center mb-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
        <svg className="w-4 h-4 text-stone-400 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <div className="text-stone-500 text-xs font-mono tracking-widest uppercase">Ecosystem Map</div>
      </div>

      <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-stone-100/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
        <div className="text-stone-600 font-medium text-xs line-clamp-1 pr-2">"What is SEO?"</div>
        <div className="text-[10px] font-semibold text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded-md shrink-0 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]">Over-covered</div>
      </div>

      <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-stone-100/60 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
        <div className="text-stone-600 font-medium text-xs line-clamp-1 pr-2">"Traditional vs AI SEO"</div>
        <div className="text-[10px] font-semibold text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded-md shrink-0 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]">Cluttered</div>
      </div>

      <div className="flex flex-col gap-2 p-3 mt-1 rounded-xl bg-gradient-to-b from-white to-orange-50/30 border border-orange-200/50 shadow-[0_4px_12px_rgba(249,115,22,0.03)] relative overflow-hidden group/item">
        <div className="absolute right-0 top-0 w-24 h-24 bg-brand-500/5 blur-2xl rounded-full"></div>
        <div className="flex justify-between items-center relative z-10">
          <div className="text-stone-900 font-bold font-serif italic text-sm">"How to optimize for LLMs?"</div>
          <div className="text-[10px] font-bold text-brand-600 bg-white border border-brand-100 px-2 py-0.5 rounded-md flex gap-1 items-center shadow-[0_2px_6px_rgba(249,115,22,0.08)] shrink-0">
            <svg className="w-3 h-3 text-brand-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11 2v4.25a.75.75 0 01-1.5 0V2h1.5zm0 15.75V22h1.5v-4.25a.75.75 0 01-1.5 0zM4.12 6.24l2.12 2.12a.75.75 0 11-1.06 1.06L3.06 7.3a.75.75 0 011.06-1.06zm13.64 12.58l-2.12-2.12a.75.75 0 011.06-1.06l2.12 2.12a.75.75 0 01-1.06 1.06zM2 12.5h4.25a.75.75 0 010-1.5H2v1.5zm15.75 0H22v-1.5h-4.25a.75.75 0 010 1.5zM6.24 19.88l2.12-2.12a.75.75 0 111.06 1.06l-2.12 2.12a.75.75 0 11-1.06-1.06zm12.58-13.64l-2.12 2.12a.75.75 0 01-1.06-1.06l2.12-2.12a.75.75 0 011.06 1.06zM11.75 8a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" /></svg> Gap
          </div>
        </div>
        <div className="text-[11px] text-stone-500 leading-snug relative z-10 pr-2">
          High priority opportunity. Missing from authoritative sets.
        </div>
      </div>
    </div>
  </div>
);

const StrategyVisual = () => (
  <div className="w-full h-[320px] bg-stone-50/20 border-none relative flex justify-center items-end overflow-hidden pt-12 px-4 group/card">
    <div className="absolute top-7 left-1/2 -translate-x-1/2 w-[65%] h-full bg-stone-100/50 border border-stone-200/40 rounded-t-[2rem] z-0 transition-transform duration-700 ease-out group-hover/card:-translate-y-0.5 shadow-sm"></div>
    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[80%] h-full bg-stone-50/80 border border-stone-200/40 rounded-t-[2rem] z-10 transition-transform duration-700 ease-out delay-75 group-hover/card:-translate-y-1 shadow-sm"></div>

    <div className="relative z-20 w-[94%] bg-white ring-1 ring-stone-200/50 rounded-t-[2rem] shadow-[0_4px_24px_rgb(0,0,0,0.03)] p-6 flex flex-col gap-0 text-sm h-[270px] transition-transform duration-700 ease-out delay-150 group-hover/card:-translate-y-1.5">

      <div className="font-medium text-stone-900 text-base mb-1 flex items-center">
        <span className="bg-gradient-to-br from-brand-50 to-brand-100/50 px-2 py-0.5 ring-1 ring-brand-200/50 rounded-md text-brand-800 mr-2 shadow-[inner_0_1px_1px_rgba(255,255,255,0.5)]">Authority</span>Map
      </div>
      <div className="text-stone-500 text-xs mb-6 pr-4">
        Establishing foundational coverage before competing for high-value core terms.
      </div>

      <div className="flex w-full h-5 bg-stone-50/80 ring-1 ring-stone-200/60 rounded-lg overflow-hidden relative mb-6 group/bar shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="w-[35%] h-full bg-brand-500 flex items-center justify-center text-[9px] text-white font-bold tracking-widest relative z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
          PHASE 1
        </div>
        <div className="w-[45%] h-full bg-stone-100/80 border-l border-white/50 flex items-center justify-center text-[9px] text-stone-400 font-bold tracking-widest" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #f5f5f4, #f5f5f4 2px, transparent 2px, transparent 6px)' }}>
          PENDING
        </div>
        <div className="w-[20%] h-full bg-stone-50/50 border-l border-white/50 flex items-center justify-center text-[9px] text-stone-400/70 font-bold tracking-widest shadow-inner">
          LOCKED
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md flex shrink-0 items-center justify-center ring-1 ring-brand-200/60 bg-gradient-to-b from-brand-50 to-white shadow-[0_2px_4px_rgba(249,115,22,0.05)] relative overflow-hidden">
            <svg className="w-3 h-3 text-brand-500 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-bold text-stone-800 leading-tight mb-0.5">Foundational Answers</div>
            <div className="text-[10px] text-stone-400">Long-tail specific queries</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md flex shrink-0 items-center justify-center ring-1 ring-stone-200/80 bg-gradient-to-b from-white to-stone-50 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_4px_rgba(249,115,22,0.3)] animate-pulse"></div>
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-bold text-stone-800 leading-tight mb-0.5">Pillar Guides</div>
            <div className="text-[10px] text-stone-400">Connecting definitions</div>
          </div>
        </div>
        <div className="flex items-center gap-3 opacity-60">
          <div className="w-6 h-6 rounded-md flex shrink-0 items-center justify-center ring-1 ring-stone-200/50 bg-stone-50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
            <svg className="w-3 h-3 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div className="flex flex-col">
            <div className="text-xs font-bold text-stone-800 leading-tight mb-0.5">Core Industry Terms</div>
            <div className="text-[10px] text-stone-400">Needs domain authority</div>
          </div>
        </div>
      </div>

    </div>
  </div>
);

const ExecutionVisual = () => (
  <div className="w-full h-[320px] bg-stone-50/20 border-none relative flex justify-center items-end overflow-hidden pt-12 px-4 group/card">
    <div className="absolute top-7 left-1/2 -translate-x-1/2 w-[65%] h-full bg-stone-100/50 border border-stone-200/40 rounded-t-[2rem] z-0 transition-transform duration-700 ease-out group-hover/card:-translate-y-0.5 shadow-sm"></div>
    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[80%] h-full bg-stone-50/80 border border-stone-200/40 rounded-t-[2rem] z-10 transition-transform duration-700 ease-out delay-75 group-hover/card:-translate-y-1 shadow-sm"></div>

    <div className="relative z-20 w-[94%] bg-white ring-1 ring-stone-200/50 rounded-t-[2rem] shadow-[0_4px_24px_rgb(0,0,0,0.03)] p-6 flex flex-col gap-0 text-sm h-[270px] transition-transform duration-700 ease-out delay-150 group-hover/card:-translate-y-1.5">

      <div className="relative space-y-7 before:absolute before:inset-y-3 before:left-[17.5px] before:w-[1.5px] before:bg-gradient-to-b before:from-stone-200 before:to-transparent mt-2">

        <div className="flex items-start gap-4 relative">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-stone-200/80 bg-gradient-to-b from-white to-stone-50 shadow-[0_2px_6px_rgba(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,1)] z-10 text-stone-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div className="flex flex-col pt-1.5">
            <div className="text-stone-800 font-bold text-xs mb-0.5">Brief Generated</div>
            <div className="text-[10px] text-stone-400 leading-tight">Structured to resolve specific query</div>
          </div>
        </div>

        <div className="flex items-start gap-4 relative">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-brand-200/60 bg-gradient-to-b from-brand-50 to-white shadow-[0_4px_8px_rgba(249,115,22,0.05),inset_0_1px_1px_rgba(255,255,255,1)] z-10 text-brand-600">
            <svg className="w-4 h-4 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
          <div className="flex flex-col pt-1.5">
            <div className="text-stone-900 font-bold text-sm mb-1">Authentic Expert Draft</div>
            <div className="text-[11px] text-stone-500 leading-relaxed pr-2">Brand voice applied. Fluff strictly removed. Direct answer prioritized.</div>
          </div>
        </div>

        <div className="flex items-start gap-4 relative opacity-60">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-stone-200/50 bg-stone-50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] z-10 text-stone-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="flex flex-col pt-1.5">
            <div className="text-stone-700 font-bold text-xs mb-0.5">Ready for CMS</div>
            <div className="text-[10px] text-stone-400 leading-tight">Publish instantly clean code</div>
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
        <div className="w-full grid grid-cols-1 md:grid-cols-3 border-x border-stone-200  relative bg-stone-50/50">

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
          <div className="w-full p-4 md:p-8 border-b md:border-r border-stone-200 flex flex-col gap-8 group">
            <div className="w-full h-[320px] overflow-hidden rounded-lg relative border border-stone-100 bg-stone-50">
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
          <div className="w-full p-4 md:p-8 border-b md:border-r border-stone-200 flex flex-col gap-8 group transition-colors hover:bg-stone-50/50">
            <div className="w-full h-[320px] overflow-hidden rounded-lg border border-stone-100 relative">
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
          <div className="w-full p-4 md:p-8 border-b border-stone-200 flex flex-col gap-8 group transition-colors hover:bg-stone-50/50">
            <div className="w-full h-[320px] overflow-hidden rounded-lg border border-stone-100 relative bg-stone-50">
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