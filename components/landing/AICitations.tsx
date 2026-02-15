"use client"

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const PROOF_POINTS = [
    {
        title: "1,300% Organic Growth",
        tag: "Traffic",
        description: "We started from zero. In 90-100 days, we reached 1.3k+ consistent monthly clicks without spending a dollar on ads.",
        image: "/case-study/proof-1.webp",
        alt: "Google Search Console performance graph showing 1,300% growth in organic clicks for BringBack.pro over 90 days",
        span: "md:col-span-2"
    },
    {
        title: "Ranking #1 on Google",
        tag: "SERP Dominance",
        description: "We don't just write; we rank. FlipAEO content is outranking major competitors for high-volume, high-intent keywords.",
        image: "/case-study/proof-2.webp",
        alt: "Google Rankings showing BringBack.pro claiming the #1 spot for high-intent keywords like 'combine photos', outranking major competitors",
        align: "object-top",
        span: "md:col-span-2"
    },
    {
        title: "Real AI Traffic",
        tag: "Analytics Proof",
        description: "The proof is in the data. See ChatGPT referral traffic driving real, high-intent users directly to our site.",
        image: "/case-study/proof-3.webp",
        alt: "Google Analytics data proving significant referral traffic coming directly from ChatGPT to BringBack.pro",
        span: "md:col-span-2"
    },
    {
        title: "Cited by Gemini",
        tag: "AI Consensus",
        description: "Not just ChatGPT. Google's own AI model, Gemini, puts BringBack in the Top recommendation when we asked a natural user query.",
        image: "/case-study/proof-4.webp",
        alt: "Google Gemini AI response recommending BringBack.pro as the 'Best All-Around AI Tool' for photo restoration in response to a user query",
        align: "object-top",
        span: "md:col-span-3"
    },
    {
        title: "Cited by ChatGPT ",
        tag: "AI Authority",
        description: "The ultimate proof of quality: ChatGPT mentions bringback ai in their answers to user.",
        image: "/case-study/proof-5.webp",
        alt: "ChatGPT conversation citing BringBack.pro as a verified source in its answer to a user query about photo tools",
        align: "object-top",
        span: "md:col-span-3"
    }
];

export const AICitations: React.FC = () => {
    return (
        <section className="w-full py-24 px-4 border-t border-stone-100 relative">
            <div className="absolute top-0 right-[20%] lg:right-[35%] translate-y-1/2 flex flex-col items-center md:rotate-6 pointer-events-none ">
                <p className="font-hand text-base md:text-lg text-stone-500 mb-2 w-40 text-center leading-none">
                    Testimonials? But we have proofs!
                </p>
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-[30px] h-[30px] md:w-[60px] md:h-[60px] text-stone-700 ml-8">
                    <path
                        d="M20,20 Q60,10 60,60"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                    />
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                        </marker>
                    </defs>
                </svg>
            </div>
            <div className="max-w-[1126px] mx-auto ">
                {/* "Human" Break Element */}


                {/* Header */}
                <div className="text-center mb-16 max-w-3xl mx-auto items-center">
                    <span className="font-sans text-xs font-bold tracking-widest text-stone-400 uppercase mb-4 block">
                        Live Case Study
                    </span>

                    <h2 className="font-serif text-4xl md:text-6xl text-stone-900 mb-6 tracking-tight font-normal">
                        We Drink Our<br /><span className='italic text-stone-500'>Own Champagne</span>
                    </h2>
                    <p className="font-sans text-stone-500 text-lg leading-relaxed ">
                        We didn’t just build a tool - we proved it. We used FlipAEO to <span className="text-stone-900 font-medium">scale</span> our own SaaS, <a href="https://bringback.pro" target="_blank" className="text-stone-900 font-medium underline decoration-stone-300 hover:decoration-stone-900 transition-all">BringBack.pro</a>, from zero to market leader. No ads, no backlinks - just pure, high-intent authority.
                    </p>
                </div>

                {/* Grid - 3 Up / 2 Up */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-10">
                    {PROOF_POINTS.map((item, i) => (
                        <div key={i} className={`flex flex-col gap-4 group ${item.span || "md:col-span-2"}`}>

                            {/* Image Container */}
                            <div className={`relative w-full aspect-[16/10] bg-stone-50 rounded-2xl overflow-hidden border border-stone-100`}>
                                <Image
                                    src={item.image}
                                    alt={item.alt || item.title}
                                    fill
                                    className={`object-contain p-2 ${item.align || "object-center"} transition-transform duration-700 group-hover:scale-[1.01]`}
                                />
                            </div>

                            {/* Content */}
                            <div className="space-y-2 px-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-serif text-xl text-stone-900 tracking-tight">
                                        {item.title}
                                    </h3>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 border border-stone-200 px-2 py-0.5 rounded-full">
                                        {item.tag}
                                    </span>
                                </div>
                                <p className="text-stone-500 leading-relaxed text-sm">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>



            </div>
        </section>
    );
};
