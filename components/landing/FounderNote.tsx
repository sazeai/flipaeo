
import React from 'react';
import { Button } from './Button';
import { ArrowRight, Quote } from 'lucide-react';
import Link from 'next/link';

export const FounderNote: React.FC = () => {
    return (
        <section className="w-full py-16 md:py-24 px-4 flex justify-center">
            <div className="w-full max-w-4xl flex flex-col items-center">

                {/* Section Label */}
                <div className="inline-flex items-center gap-2 bg-white border-2 border-black shadow-neo-sm px-4 py-1.5 mb-8 transform rotate-1 hover:rotate-0 transition-transform">
                    <span className="font-display font-bold uppercase tracking-wider text-sm text-black">
                        A Note From The Founder
                    </span>
                </div>

                {/* Main Card - The Personal Note */}
                <div className="relative w-full bg-[#FFF8E7] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12">

                    {/* Quote Icon - Top Left Accent */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-brand-orange border-2 border-black flex items-center justify-center transform -rotate-6">
                        <Quote className="w-6 h-6 text-black fill-black" />
                    </div>

                    {/* The Message */}
                    <div className="relative">
                        {/* Handwritten-style Quote */}
                        <p className="font-display text-2xl md:text-3xl lg:text-4xl leading-relaxed text-black mb-8 italic">
                            "Your first two articles are on me.
                            <br />
                            <span className="block mt-4">
                                If you love the quality, we can talk business.
                            </span>
                            <span className="block mt-4 text-gray-600">
                                If not — no hard feelings, that's okay too."
                            </span>
                        </p>

                        {/* Signature Area */}
                        <div className="flex items-end justify-between flex-wrap gap-6">
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-full border-2 border-black bg-brand-orange overflow-hidden shadow-neo-sm">
                                    <img
                                        src="/founder.webp"
                                        alt="Founder"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Name & Title */}
                                <div className="flex flex-col">
                                    <span className="font-display font-black text-lg uppercase tracking-wide text-black">
                                        Harvansh
                                    </span>
                                    <span className="font-mono text-xs text-gray-500 tracking-wide">
                                        Founder — FlipAEO
                                    </span>
                                </div>
                            </div>

                            {/* Handwritten Signature Stroke */}
                            <img
                                src="/signature-of-me.png"
                                alt="Founder Signature"
                                className="h-16 w-auto opacity-90 object-contain"
                            />
                        </div>
                    </div>

                    {/* Decorative Corner */}
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-black"></div>
                </div>

                {/* CTA Below the Note */}
                <div className="mt-10 flex flex-col items-center gap-3">
                    <Link href="/login">
                        <Button
                            variant="primary"
                            size="lg"
                            className="cursor-pointer font-semibold px-8 py-4 text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all border-2 border-black"
                        >
                            Start My Free Articles
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                    <p className="font-mono text-xs text-gray-500 tracking-wide">
                        No credit card required <span className="text-black mx-1">·</span> 2 articles free
                    </p>
                </div>

            </div>
        </section>
    );
};
