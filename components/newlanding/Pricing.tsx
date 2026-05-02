import React from 'react';

const features = [
  "100 auto-published Pins per month",
  "1-click weekly approval inbox",
  "AI lifestyle product photography",
  "Smart-crop for existing brand photos",
  "Live Pinterest keyword targeting",
  "AI-written SEO titles & descriptions",
  "Shoppable pins with product links",
  "Live Shopify & Etsy catalog sync",
  "Auto-skips out-of-stock products",
  "Anti-spam organic daily pacing",
  "Duplicate-proof visual memory"
];

export default function Pricing() {
  return (
    <section className="w-full bg-[#FAFAFA] relative z-10 font-sans border-b border-[rgba(55,50,47,0.12)]" id="pricing">
      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 relative border-t border-[rgba(55,50,47,0.12)]">

        {/* Left Column: Context, Price, CTA */}
        <div className="flex flex-col justify-between p-8 md:p-12 lg:p-16 xl:p-20 relative bg-transparent lg:border-r border-[rgba(55,50,47,0.12)]">

          {/* Header Context */}
          <div className="flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(55,50,47,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#111] animate-pulse"></div>
              <span className="text-[12px] font-medium text-[#111] tracking-wide">
                The Autopilot Engine
              </span>
            </div>
            
            <h2 className="font-serif text-[3rem] md:text-[3.5rem] lg:text-[4rem] leading-[1.05] tracking-[-0.03em] text-[#111]">
              The standard.<br />One plan.
            </h2>
            
            <p className="text-[1.1rem] text-[#555] font-normal tracking-tight max-w-[320px] leading-[1.6]">
              Radical simplicity. Focus on growth, not pricing tiers. Let our engine drive your Pinterest organically.
            </p>
          </div>

          {/* Price & CTA */}
          <div className="mt-16 pt-10 border-t border-[rgba(55,50,47,0.08)] flex flex-col gap-8">
            <div className="flex items-start gap-1">
              <span className="text-[2.5rem] md:text-[3rem] text-[#555] font-serif leading-[1] mt-1 md:mt-3">$</span>
              <span className="text-[7rem] md:text-[8rem] leading-[0.8] text-[#111] font-serif tracking-tighter">99</span>
              <div className="flex flex-col justify-end h-full pb-2 md:pb-4 ml-1 md:ml-2">
                <span className="text-[15px] text-[#555] font-medium">/ month</span>
              </div>
            </div>

            <button className="w-full sm:max-w-[340px] bg-[#111] hover:bg-black text-white px-6 py-4 rounded-full flex items-center justify-center gap-3 text-[16px] font-medium transition-all shadow-sm hover:shadow-md group mt-2">
              Connect Your Store
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Column: Features */}
        <div className="flex flex-col p-8 md:p-12 lg:p-16 xl:p-20 bg-[#FDFDFD]">
          <h3 className="text-[1.25rem] lg:text-[1.5rem] text-[#111] font-serif tracking-tight mb-8 leading-[1.3] max-w-[380px]">
            Everything you need to replace your Pinterest marketing agency.
          </h3>

          <ul className="flex flex-col w-full">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-4 py-4 border-b border-[rgba(55,50,47,0.08)] last:border-0 text-[14px] lg:text-[15px] text-[#555] tracking-tight">
                <div className="w-5 h-5 rounded-full border border-[rgba(55,50,47,0.2)] flex items-center justify-center flex-shrink-0 text-[#111] bg-[#FAFAFA]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span className="leading-none text-[#333] pt-[1px]">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
}
