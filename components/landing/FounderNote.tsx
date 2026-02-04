"use client";

import Button from './Button';
import { Quote } from 'lucide-react';
import Link from 'next/link';

export default function FounderNote() {
    return (
        <section className="w-full py-20 px-4 md:px-6 flex justify-center relative">

            {/* Background Decoration - Subtle blur behind the letter */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-4xl h-[80%] bg-orange-100/40 blur-3xl -z-10 rounded-full opacity-60"></div>

            {/* Main Letter Container */}
            <div className="w-full max-w-4xl relative">

                {/* The "Paper" Card */}
                <div className="
                    relative w-full bg-white 
                    border border-stone-300/50 
                    rounded-[15px] 
                    p-1
                    overflow-hidden
                    relative w-full
            
                "> <div className="
              w-full bg-stone-100/50 backdrop-blur-sm
              rounded-[12px] p-6 sm:p-8
              border border-stone-100
            ">



                        {/* Watermark Icon */}
                        <div className="absolute top-12 left-12 opacity-[0.03] pointer-events-none">
                            <Quote size={120} className="text-stone-900" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">

                            {/* Header */}
                            <div className="mb-8">
                                <div className="inline-block w-12 h-1 bg-gradient-to-r from-brand-400 to-brand-100 rounded-full mb-6"></div>
                                <h3 className="font-sans text-xs font-bold tracking-[0.2em] text-stone-400 uppercase">
                                    A personal note
                                </h3>
                            </div>

                            {/* The Message */}
                            <blockquote className="max-w-2xl mb-12">
                                <p className="font-serif text-3xl md:text-4xl leading-[1.3] text-stone-800 mb-6">
                                    "Your first two articles are on me. If you love the quality, we can talk business."
                                </p>
                                <p className="font-serif text-xl md:text-2xl leading-relaxed text-stone-400 italic">
                                    "If not — no hard feelings. That’s okay too."
                                </p>
                            </blockquote>

                            {/* Signature Block */}
                            <div className="flex flex-col items-center gap-8 w-full border-t border-stone-100 pt-10">

                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="relative w-14 h-14">
                                        <div className="absolute inset-0 bg-stone-100 rounded-full animate-pulse"></div>
                                        <img
                                            src="/founder.webp"
                                            alt="Harvansh"
                                            className="w-full h-full object-cover rounded-full border-2 border-white shadow-md relative z-10"
                                        />
                                        {/* Verified Check */}
                                        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full z-20">
                                            <div className="bg-brand-500 rounded-full p-0.5">
                                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white">
                                                    <path d="M20 6L9 17l-5-5" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left">
                                        <div className="font-serif text-lg text-stone-900 leading-none mb-1">
                                            Harvansh
                                        </div>
                                        <div className="font-sans text-xs font-medium text-stone-400 uppercase tracking-wide">
                                            Founder of FlipAEO
                                        </div>
                                    </div>

                                    {/* Vertical Divider */}
                                    <div className="h-8 w-px bg-stone-200 mx-2 hidden sm:block"></div>

                                    {/* Handwriting Signature */}
                                    <div className="hidden sm:block font-hand text-3xl text-stone-400 -rotate-2 transform translate-y-1">
                                        Harvansh
                                    </div>
                                </div>

                                {/* CTA Action */}
                                <div className="flex flex-col items-center gap-3">
                                    <Link href="/login">
                                        <Button
                                            variant="primary"
                                            className="px-10 py-3 text-base shadow-hero "

                                        >
                                            Claim My 2 Free Articles
                                        </Button>
                                    </Link>

                                    <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                                        No credit card required
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>

                {/* Decorative Elements - "Papers" underneath to give depth */}
                <div className="absolute top-2 left-4 right-4 bottom-[-10px] bg-white border border-stone-200 rounded-[32px] -z-10 scale-[0.98] opacity-60"></div>
                <div className="absolute top-4 left-8 right-8 bottom-[-20px] bg-white border border-stone-200 rounded-[32px] -z-20 scale-[0.96] opacity-30"></div>

            </div>
        </section>
    );
};

