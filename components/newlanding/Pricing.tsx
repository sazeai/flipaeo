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
      <div className="w-full max-w-[1400px] mx-auto border-x border-[rgba(55,50,47,0.12)] grid grid-cols-1 lg:grid-cols-2 relative">
            
        {/* Left Column: Context, Price, CTA */}
        <div className="flex flex-col p-8 md:p-12 lg:p-16 xl:p-20 border-t lg:border-r border-[rgba(55,50,47,0.12)] relative bg-transparent">
            
            {/* Header Context */}
            <div className="mb-20">
                <span className="font-mono text-[10px] text-[#111] uppercase tracking-widest inline-block px-3 py-1.5 border border-[rgba(55,50,47,0.12)] bg-white mb-8">
                  The Autopilot Engine
                </span>
                <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-[#111] mb-8">
                    The standard.<br/>One plan.
                </h2>
                <p className="text-[1.1rem] text-[#555] font-normal tracking-tight max-w-[340px] leading-[1.6]">
                    Radical simplicity. Focus on growth, not pricing tiers. Let our engine drive your Pinterest organically.
                </p>
            </div>

            {/* Price & CTA */}
            <div className="mt-auto pt-10 md:pt-14 border-t border-[rgba(55,50,47,0.12)] flex flex-col gap-8">
                <div className="flex items-end gap-3">
                    <span className="text-[2rem] text-[#555] font-serif mb-2 xl:mb-3">$</span>
                    <span className="text-[6rem] xl:text-[7.5rem] leading-[0.75] text-[#111] font-serif tracking-tight -ml-1">99</span>
                    <span className="text-[12px] text-[#555] font-mono tracking-widest uppercase mb-2 xl:mb-3 ml-1">/ month</span>
                </div>

                <button className="w-full lg:max-w-[360px] p-5 bg-[#111] text-white text-[12px] font-mono uppercase tracking-widest hover:bg-[#333] transition-colors flex justify-center items-center gap-3 group">
                    Connect Your Store
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>
        </div>

        {/* Right Column: Features */}
        <div className="flex flex-col p-8 md:p-12 lg:p-16 xl:p-20 border-t lg:border-t-0 border-[rgba(55,50,47,0.12)] bg-[#FDFDFD]">
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
