import React from 'react';
import { CornerDot } from './CornerDot';

const DotGridIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-300">
    <circle cx="4" cy="4" r="2.5" fill="currentColor" />
    <circle cx="14" cy="4" r="2.5" fill="currentColor" />
    <circle cx="24" cy="4" r="2.5" fill="currentColor" />

    <circle cx="4" cy="14" r="2.5" fill="currentColor" />
    <circle cx="14" cy="14" r="2.5" fill="currentColor" />
    <circle cx="24" cy="14" r="2.5" fill="currentColor" />

    <circle cx="4" cy="24" r="2.5" fill="currentColor" />
    <circle cx="14" cy="24" r="2.5" fill="currentColor" />
    <circle cx="24" cy="24" r="2.5" fill="currentColor" />
  </svg>
);

const ProblemSection: React.FC = () => {
  return (
    <section className="w-full pb-24 relative z-10">
      <div className="w-full max-w-[1250px] mx-auto px-3 sm:px-5">

        {/* Header - Left/Right Premium Setup */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 justify-between items-start md:items-end py-16 w-full px-4 md:px-8">
          <div className="flex-1">
            <span className="font-sans text-xs font-bold tracking-widest text-stone-400 uppercase mb-4 block">
              The Old Way
            </span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-5xl text-stone-900 tracking-tight font-normal leading-tight">
              Why traditional Pinterest marketing <br /><span className='italic text-stone-500'>is costing you traffic.</span>
            </h2>
          </div>
          <div className="flex-1 md:max-w-xl pb-0 md:pb-2">
            <p className="font-sans text-stone-500 text-lg leading-relaxed">
              Pinterest has evolved into a pure visual AI algorithm. If you are still relying on bulk-scheduling generic Canva templates, you are actively burying your own products.
            </p>
          </div>
        </div>

        {/* Horizontal Pattern Bar Top (Grid Boundary) */}
        <div className="relative w-full h-px bg-stone-200">
          <CornerDot className="-left-[10px] -bottom-[10px]" />
          <CornerDot className="-right-[10px] -bottom-[10px]" />
        </div>

        {/* Problem Grid - Bordered Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-l border-r border-stone-200 relative">



          {/* Junctions */}
          <div className="hidden md:block absolute top-0 left-[33.33%] -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerDot className="-left-[10px] -top-[10px]" />
          </div>
          <div className="hidden md:block absolute top-0 left-[66.66%] -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerDot className="-left-[10px] -top-[10px]" />
          </div>
          <div className="hidden md:block absolute bottom-0 left-[33.33%] -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerDot className="-left-[10px] -top-[10px]" />
          </div>
          <div className="hidden md:block absolute bottom-0 left-[66.66%] -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerDot className="-left-[10px] -top-[10px]" />
          </div>

          {/* Item 1 */}
          <div className="flex flex-col group p-8 md:p-12 md:border-r border-b border-stone-200 transition-colors hover:bg-stone-50/50">
            <div className="mb-8">
              <DotGridIcon />
            </div>
            <div className="mt-auto">
              <h3 className="font-serif text-2xl text-stone-900 mb-4 tracking-tight">
                The "Cluttered Design" Trap
              </h3>
              <p className="text-stone-500 leading-relaxed text-sm lg:text-base">
                Pinterest is a Visual Search Engine. When humans manually design pins, they often use heavy text overlays and neon graphics. Pinterest's AI vision models struggle to read this, flagging the pin as "low-relevance" ad material and burying it.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex flex-col group p-8 md:p-12 md:border-r border-b border-stone-200 transition-colors hover:bg-stone-50/50">
            <div className="mb-8">
              <DotGridIcon />
            </div>
            <div className="mt-auto">
              <h3 className="font-serif text-2xl text-stone-900 mb-4 tracking-tight">
                The "White Background" Blindness
              </h3>
              <p className="text-stone-500 leading-relaxed text-sm lg:text-base">
                Syncing your standard e-commerce catalog directly to Pinterest doesn't work. Users come to Pinterest for aesthetic inspiration, not a product catalog. Pure white backgrounds are actively scrolled past by actual users.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex flex-col group p-8 md:p-12 border-b border-stone-200 transition-colors hover:bg-stone-50/50">
            <div className="mb-8">
              <DotGridIcon />
            </div>
            <div className="mt-auto">
              <h3 className="font-serif text-2xl text-stone-900 mb-4 tracking-tight">
                The "Volume" Penalty
              </h3>
              <p className="text-stone-500 leading-relaxed text-sm lg:text-base">
                Traditional scheduling tools encourage you to blast the same URL 30 times a day with the exact same image. In 2026, Pinterest's strict spam filters flag this repetitive behavior, silently restricting your account's reach.
              </p>
            </div>
          </div>

        </div>

        {/* Horizontal Pattern Bar Bottom (Grid Boundary) */}
        <div className="relative w-full h-px bg-stone-200">
          <CornerDot className="-left-[10px] -top-[10px]" />
          <CornerDot className="-right-[10px] -top-[10px]" />
        </div>

      </div>
    </section>
  );
};

export default ProblemSection;