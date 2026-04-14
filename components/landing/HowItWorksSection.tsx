import React from 'react';
import { CornerDot } from './CornerDot';
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
        <div className="w-full h-px bg-stone-200 mb-16"></div>

        {/* Header - Left/Right Premium Setup */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 justify-between items-start md:items-end mb-16 w-full px-4 md:px-8">
          <div className="flex-1">
            <span className="font-sans text-xs font-bold tracking-widest text-brand-500 uppercase mb-4 block">
              How It Works
            </span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 tracking-tight font-normal leading-[1]">
              From plain product photos <br /><span className='italic text-stone-500'>to approved Pinterest campaigns.</span>
            </h2>
          </div>
          <div className="flex-1 md:max-w-xl pb-0 md:pb-2">
            <p className="font-sans text-stone-500 text-lg leading-relaxed">
              Sync your catalog, let PinLoop create editorial lifestyle pins around each product, approve the ones you want, and let the system publish safely while it learns what actually drives clicks.
            </p>
          </div>
        </div>

        {/* Horizontal Pattern Bar Top (Grid Boundary) */}
        <div className="relative w-full h-px bg-stone-200">
          <CornerDot className="-left-[10px] -bottom-[10px]" />
          <CornerDot className="-right-[10px] -bottom-[10px]" />
        </div>

        {/* 2x2 Wireframe Grid for 4 Steps */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 border-x border-stone-200 relative bg-stone-50/50">

          {/* Main Grid Corners */}
          <CornerDot className="-left-[10px] -top-[10px]" />
          <CornerDot className="-right-[10px] -top-[10px]" />
          <CornerDot className="-left-[10px] -bottom-[10px]" />
          <CornerDot className="-right-[10px] -bottom-[10px]" />

          {/* Junctions */}
          <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerDot className="-left-[10px] -top-[10px]" />
          </div>
          <div className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerDot className="-left-[10px] -top-[10px]" />
          </div>
          <div className="hidden md:block absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerDot className="-left-[10px] -top-[10px]" />
          </div>
          <div className="hidden md:block absolute right-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerDot className="-left-[10px] -top-[10px]" />
          </div>
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <CornerDot className="-left-[10px] -top-[10px]" />
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
                Connect Your Store
              </h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">
                Connect Shopify or Etsy, set your brand direction, and link Pinterest. PinLoop pulls in your product photos, titles, URLs, and publishing setup automatically.
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
                We Stage The Photoshoot
              </h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">
                PinLoop turns each plain product image into multiple lifestyle scenes, writes Pinterest-ready titles and descriptions, and assembles finished pins around every SKU.
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
                Review And Approve
              </h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">
                Open your review queue, scan the finished pins, approve the keepers, reject anything off-brand, and send the rest into your publishing queue in minutes.
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
                Publish Safely And Learn
              </h3>
              <p className="font-sans text-stone-500 text-sm leading-relaxed">
                Approved pins drip out at an account-safe pace. Performance data and your reject reasons feed the next generation cycle, so the creative gets sharper over time.
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

export default HowItWorksSection;