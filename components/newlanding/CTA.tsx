import React from 'react';

export default function CTA() {
  return (
    <section className="w-full relative z-10" id="cta">
      <div className="w-full bg-[#111] overflow-hidden relative flex flex-col items-center justify-center text-center p-10 md:p-24">



        <div className="relative z-10 max-w-3xl">
          <div className="mb-8 items-center justify-center flex">
            <span className="font-mono text-[10px] text-white/60 uppercase tracking-[0.2em] px-4 py-2 border border-white/10 bg-white/5 rounded-full backdrop-blur-sm">
              Next-Gen Pinterest Marketing
            </span>
          </div>

          <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-white mb-8">
            Scale your brand<br />on autopilot.
          </h2>

          <p className="text-[1.1rem] md:text-[1.25rem] text-white/60 font-normal tracking-tight mb-12 max-w-xl mx-auto leading-[1.5]">
            Connect your Shopify or Etsy store in 60 seconds and watch EcomPin start scaling your Pinterest presence immediately.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-10 py-5 bg-white text-[#111] text-[12px] font-mono uppercase tracking-widest hover:bg-[#eee] transition-colors flex justify-center items-center gap-3 group">
              Get Started Now
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="w-full sm:w-auto px-10 py-5 bg-transparent border border-white/20 text-white text-[12px] font-mono uppercase tracking-widest hover:bg-white/5 transition-colors">
              Book a Demo
            </button>
          </div>
        </div>

        {/* Bottom border decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10"></div>
      </div>
    </section>
  );
}
