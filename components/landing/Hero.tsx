import React from 'react';
import { Button } from './Button';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';

export const Hero: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center max-w-5xl mx-auto pt-6 md:pt-10 relative z-10">

      {/* Background Glow (Subtle) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-orange/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      {/* Badge */}
      <div className="inline-flex items-center justify-center bg-brand-orange border-2 border-black shadow-neo-sm px-4 py-1.5 transform -rotate-2 mb-8 hover:rotate-0 transition-transform duration-300 cursor-default">
        <span className="font-display font-bold uppercase tracking-wider text-sm">
          THE POST-SEO ERA
        </span>
      </div>

      {/* Headline */}
      <h1 className="font-display font-black text-5xl md:text-6xl lg:text-[6rem] leading-[0.9] tracking-tighter mb-8 text-black uppercase">
        Don’t just rank<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black">
          Be the Source AI cites
        </span>
      </h1>

      {/* Subtext */}
      <p className="font-sans text-gray-600 text-lg md:text-2xl max-w-3xl mb-12 leading-relaxed font-semibold px-4">
        <span className="font-bold text-black border-b-[3px] border-brand-orange/30">FlipAEO is the Strategic Content Engine for dominating AEO and GEO.</span> We engineer the exact content required to make your brand the #1 citation in AI search results.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto px-4">
        <Link href="/login">
          <Button variant="primary" size="lg" className="font-semibold w-full sm:w-auto px-6 py-3 text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all border-2 border-black">
            Build My Growth Strategy
          </Button>
        </Link>
        <Link href="#how-it-works">
          <Button variant="secondary" size="lg" className="font-semibold w-full sm:w-auto px-6 py-3 text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all border-2 border-black">
            See the engine →
          </Button>
        </Link>
      </div>

      {/* SOCIAL PROOF / TRUST SIGNALS */}
      <div className="flex flex-col items-center gap-4 animate-fade-in-up">

        {/* Avatar Stack + Rating - Minimal Layout */}
        <div className="flex items-center gap-4">

          {/* Avatar Stack */}
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-white overflow-hidden hover:-translate-y-0.5 transition-transform">
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i + 42}`}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* Rating & Count */}
          <div className="flex flex-col items-start">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className="w-4 h-4 text-brand-orange fill-brand-orange" />
              ))}
            </div>
            <span className="font-display font-semibold text-sm uppercase tracking-wide text-black">
              90+ Articles created
            </span>
          </div>
        </div>

        {/* Micro-Copy - Simple Text */}
        <p className="font-mono text-xs text-gray-500 tracking-wide">
          Cancel anytime <span className="text-black mx-1">·</span> 14-day guarantee
        </p>

      </div>

    </div>
  );
};