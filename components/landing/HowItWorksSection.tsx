import React from 'react';
import { CornerSquare } from './CornerSquare';
import { Sparkles, Send, Activity } from 'lucide-react';

const SyncVisual = () => (
  <div className="w-full h-[240px] bg-stone-50/20 border-none relative flex justify-center items-center overflow-hidden px-4 group/card">
    <div className="w-48 h-32 bg-white border border-stone-200 rounded-xl shadow-sm flex flex-col justify-between p-4 relative z-10 transition-transform duration-500 group-hover/card:scale-105">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Shopify API</span>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="w-full h-1.5 bg-stone-100 rounded-full"></div>
        <div className="w-5/6 h-1.5 bg-stone-100 rounded-full"></div>
        <div className="w-1/2 h-1.5 bg-stone-100 rounded-full"></div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="px-2 py-0.5 bg-stone-50 border border-stone-100 rounded text-[8px] text-stone-500 font-bold">1,240 SKUs</div>
        <div className="px-2 py-0.5 bg-brand-50 border border-brand-100 rounded text-[8px] text-brand-600 font-bold">Synced</div>
      </div>
    </div>
  </div>
);

const GenerativeVisual = () => (
  <div className="w-full h-[240px] bg-stone-50/20 border-none relative flex justify-center items-center overflow-hidden px-4 group/card">
    <div className="relative w-48 h-48 flex items-center justify-center transition-transform duration-500 group-hover/card:scale-105">
      <div className="absolute inset-0 border-2 border-stone-200 border-dashed rounded-full animate-[spin_10s_linear_infinite]"></div>
      <div className="absolute inset-4 border-2 border-brand-200 border-dotted rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
      <div className="w-16 h-16 bg-white border border-stone-200 rounded-lg shadow-sm flex items-center justify-center z-10 relative">
        <Sparkles className="text-brand-500" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-400 rounded-full border-2 border-white"></div>
      </div>
      {/* Floating assets */}
      <div className="absolute top-2 left-6 w-8 h-10 bg-white border border-stone-200 rounded shadow-sm opacity-60"></div>
      <div className="absolute bottom-4 right-6 w-8 h-10 bg-white border border-stone-200 rounded shadow-sm opacity-60"></div>
      <div className="absolute top-8 right-4 w-6 h-8 bg-brand-50 border border-brand-200 rounded shadow-sm opacity-80"></div>
    </div>
  </div>
);

const PublisherVisual = () => (
  <div className="w-full h-[240px] bg-stone-50/20 border-none relative flex justify-center items-center overflow-hidden px-4 group/card">
    <div className="w-full max-w-[200px] flex flex-col gap-2 transition-transform duration-500 group-hover/card:scale-105">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`w-full bg-white border border-stone-200 rounded-lg p-2 flex items-center justify-between shadow-sm ${i === 2 ? 'opacity-50' : i === 3 ? 'opacity-20' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-stone-100 rounded flex items-center justify-center">
              <ImageIcon size={10} className="text-stone-400" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="w-16 h-1 bg-stone-200 rounded-full"></div>
              <div className="w-10 h-1 bg-stone-100 rounded-full"></div>
            </div>
          </div>
          <div className="text-[8px] font-bold text-stone-400 uppercase">
            {i === 1 ? 'Just Now' : i === 2 ? 'In 4 Hrs' : 'In 8 Hrs'}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const OptimizerVisual = () => (
  <div className="w-full h-[240px] bg-stone-50/20 border-none relative flex justify-center items-center overflow-hidden px-4 group/card">
    <div className="w-48 h-32 bg-stone-900 border border-stone-800 rounded-xl shadow-lg flex flex-col justify-between p-4 relative z-10 transition-transform duration-500 group-hover/card:scale-105">
      <div className="flex justify-between items-center mb-2 border-b border-stone-700 pb-2">
        <span className="text-[10px] font-mono text-stone-400 uppercase">Aesthetic.Weight</span>
        <Activity size={12} className="text-green-400" />
      </div>
      <div className="space-y-3 mt-2">
        <div className="flex items-center justify-between text-[8px] font-mono text-stone-300">
          <span>Minimalist</span>
          <span className="text-brand-400">+12% (0.84)</span>
        </div>
        <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
          <div className="h-full w-[84%] bg-brand-500"></div>
        </div>

        <div className="flex items-center justify-between text-[8px] font-mono text-stone-500 mt-2">
          <span>Dark Academia</span>
          <span className="text-stone-600">-2% (0.41)</span>
        </div>
        <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
          <div className="h-full w-[41%] bg-stone-600"></div>
        </div>
      </div>
    </div>
  </div>
);

import { Image as ImageIcon } from 'lucide-react';

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
              The Workflow
            </span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 tracking-tight font-normal leading-[1]">
              A closed-loop system <br /><span className='italic text-stone-500'>that works entirely in the background.</span>
            </h2>
          </div>
          <div className="flex-1 md:max-w-xl pb-0 md:pb-2">
            <p className="font-sans text-stone-500 text-lg leading-relaxed">
              Automated ingestion, AI-driven aesthetic generation, and a closed-loop analytic engine that learns what drives Pinterest sales.
            </p>
          </div>
        </div>

        {/* Horizontal Pattern Bar Top (Grid Boundary) */}
        <div className="relative w-full h-3 sm:h-4 border-y border-stone-200" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px)' }}>
          <CornerSquare className="-left-[5px] -bottom-[5px]" />
          <CornerSquare className="-right-[5px] -bottom-[5px]" />
        </div>

        {/* 2x2 Wireframe Grid for 4 Steps */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 border-x border-stone-200 relative bg-stone-50/50">

          {/* Main Grid Corners */}
          <CornerSquare className="-left-[5px] -top-[5px]" />
          <CornerSquare className="-right-[5px] -top-[5px]" />
          <CornerSquare className="-left-[5px] -bottom-[5px]" />
          <CornerSquare className="-right-[5px] -bottom-[5px]" />

          {/* Junctions */}
          <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerSquare className="-left-[4px] -top-[4px]" />
          </div>
          <div className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerSquare className="-left-[4px] -top-[4px]" />
          </div>
          <div className="hidden md:block absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerSquare className="-left-[4px] -top-[4px]" />
          </div>
          <div className="hidden md:block absolute right-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerSquare className="-left-[4px] -top-[4px]" />
          </div>
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerSquare className="-left-[4px] -top-[4px]" />
          </div>

          {/* Step 1 Card */}
          <div className="w-full p-6 md:p-10 border-b md:border-b border-stone-200 md:border-r flex flex-col gap-6 group">
            <div className="w-full overflow-hidden rounded-lg relative border border-stone-100 bg-stone-50">
              <SyncVisual />
            </div>
            <div className="flex flex-col gap-3 mt-auto">
              <div className="flex items-center">
                <div className="px-3 py-1 rounded-sm border border-brand-200 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-widest">
                  Step 1
                </div>
              </div>
              <h3 className="font-serif text-2xl text-stone-900 leading-tight">
                The One-Click Sync
              </h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">
                Connect your Shopify or Etsy store. We securely ingest your product catalog, titles, and URLs. Your active work ends here.
              </p>
            </div>
          </div>

          {/* Step 2 Card */}
          <div className="w-full p-6 md:p-10 border-b border-stone-200 flex flex-col gap-6 group transition-colors hover:bg-stone-50/50">
            <div className="w-full overflow-hidden rounded-lg border border-stone-100 relative bg-white">
              <GenerativeVisual />
            </div>
            <div className="flex flex-col gap-3 mt-auto">
              <div className="flex items-center">
                <div className="px-3 py-1 rounded-sm border border-brand-200 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-widest">
                  Step 2
                </div>
              </div>
              <h3 className="font-serif text-2xl text-stone-900 leading-tight">
                The Generative Engine
              </h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">
                Our AI systematically runs your products through advanced diffusion models, creating dozens of unique, editorial-grade lifestyle variations for every single SKU.
              </p>
            </div>
          </div>

          {/* Step 3 Card */}
          <div className="w-full p-6 md:p-10 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col gap-6 group transition-colors hover:bg-stone-50/50">
            <div className="w-full overflow-hidden rounded-lg border border-stone-100 relative bg-white">
              <PublisherVisual />
            </div>
            <div className="flex flex-col gap-3 mt-auto">
              <div className="flex items-center">
                <div className="px-3 py-1 rounded-sm border border-brand-200 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-widest">
                  Step 3
                </div>
              </div>
              <h3 className="font-serif text-2xl text-stone-900 leading-tight">
                The Drip Publisher
              </h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">
                The system safely drip-publishes your new visual assets at algorithmically optimal times, ensuring every post looks like natural, organic human behavior to keep your account health pristine.
              </p>
            </div>
          </div>

          {/* Step 4 Card */}
          <div className="w-full p-6 md:p-10 flex flex-col gap-6 group transition-colors hover:bg-stone-50/50">
            <div className="w-full overflow-hidden rounded-lg border border-stone-100 relative bg-stone-50">
              <OptimizerVisual />
            </div>
            <div className="flex flex-col gap-3 mt-auto">
              <div className="flex items-center">
                <div className="px-3 py-1 rounded-sm border border-brand-200 bg-brand-50 text-brand-600 text-[10px] font-bold uppercase tracking-widest">
                  Step 4
                </div>
              </div>
              <h3 className="font-serif text-2xl text-stone-900 leading-tight">
                The Autonomous Optimizer
              </h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">
                PinLoop continuously reads your Pinterest Analytics. If the "Dark Academia" aesthetic gets clicks, and "Minimalist" gets zero, the AI learns. It automatically shifts generation to the styles that drive actual sales.
              </p>
            </div>
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