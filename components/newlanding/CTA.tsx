import React from 'react';

export default function CTA() {
  return (
    <section className="w-full relative z-10" id="cta">
      <div className="w-full bg-[#111] overflow-hidden relative flex flex-col items-center justify-center text-center px-4 py-12">

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="mb-8 items-center justify-center flex">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              <span className="text-[12px] font-medium text-white tracking-wide">
                Next-Gen Pinterest Marketing
              </span>
            </div>
          </div>

          <h2 className="font-serif text-[3rem] md:text-[3.5rem] lg:text-[4rem] leading-[1.05] tracking-[-0.03em] text-white mb-8">
            Scale your brand<br />on autopilot.
          </h2>

          <p className="text-[1.1rem] md:text-[1.25rem] text-white/60 font-normal tracking-tight mb-12 max-w-xl mx-auto leading-[1.6]">
            Connect your Shopify or Etsy store in 60 seconds and watch EcomPin start scaling your Pinterest presence immediately.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-[#111] rounded-full flex justify-center items-center gap-3 text-[16px] font-medium transition-all shadow-[0_4px_14px_rgba(255,255,255,0.15)] hover:shadow-[0_6px_24px_rgba(255,255,255,0.25)] hover:bg-[#FAFAFA] hover:-translate-y-0.5 group">
              Get Started Now
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/20 text-white rounded-full flex justify-center items-center text-[16px] font-medium hover:bg-white/5 transition-colors hover:-translate-y-0.5">
              Book a Demo
            </button>
          </div>
        </div>

        {/* Bottom border decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10"></div>
      </div>
    </section>
  );
}
