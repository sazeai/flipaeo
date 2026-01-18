
import React from 'react';
import { ExternalLink, MousePointer2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const ShowcaseSection: React.FC = () => {
    return (
        <section className="w-full py-24 px-4 flex flex-col items-center relative overflow-hidden">
            {/* Background decoration */}

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8 max-w-4xl relative z-10">
                <div className="inline-block bg-white border-2 border-black shadow-neo-sm px-4 py-1 mb-8 transform rotate-1">
                    <span className="font-display font-black text-xs uppercase tracking-widest">Live Proof</span>
                </div>
                <h2 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl md:text-6xl leading-[1] mb-6 uppercase">
                    Don't just take our words.<br />See the output.
                </h2>
                <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl">
                    Real article, published on real domain without any human touch-up. This is what you get out of the box.
                </p>
            </div>

            {/* The Browser Window Card */}
            <div className="relative w-full max-w-4xl mx-auto group mt-8">

                {/* === ANNOTATIONS === */}

                {/* Annotation 1: Custom Cover Image (Top Left) */}
                <div className="hidden md:flex flex-col items-end absolute -left-48 top-32 z-20 opacity-0 animate-fade-in-delay-1" style={{ animationDelay: '0.5s', opacity: 1 }}>
                    <span className="font-serif italic text-xl text-gray-500 mb-2 rotate-[-5deg]">Custom cover image</span>
                    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" className="text-gray-400 rotate-12 translate-x-6">
                        <path d="M5 5 Q 30 5, 50 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" markerEnd="url(#arrow-tl)" />
                        <defs>
                            <marker id="arrow-tl" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                                <path d="M0 0 L3 3 L0 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </marker>
                        </defs>
                    </svg>
                </div>

                {/* Annotation 2: SEO Structure (Right Side) */}
                <div className="hidden md:flex flex-col items-start absolute -right-52 top-40 z-20 opacity-0 animate-fade-in-delay-2" style={{ animationDelay: '1s', opacity: 1 }}>
                    <span className="font-serif italic text-xl text-gray-500 rotate-[5deg] mb-2">SEO structure (H2, H3)</span>
                    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" className="text-gray-400 rotate-[-12deg] self-start ml-[-10px] -translate-x-6">
                        <path d="M55 5 Q 30 5, 10 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" markerEnd="url(#arrow-tr)" />
                        <defs>
                            <marker id="arrow-tr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                                <path d="M0 0 L3 3 L0 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </marker>
                        </defs>
                    </svg>
                </div>

                {/* Annotation 3: Internal Links (Left Side) */}
                <div className="hidden md:flex flex-col items-end absolute -left-56 bottom-48 z-20 opacity-0 animate-fade-in-delay-3" style={{ animationDelay: '1.5s', opacity: 1 }}>
                    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" className="text-gray-400 translate-x-6">
                        <path d="M5 35 Q 30 35, 50 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" markerEnd="url(#arrow-bl)" />
                        <defs>
                            <marker id="arrow-bl" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                                <path d="M0 0 L3 3 L0 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </marker>
                        </defs>
                    </svg>
                    <span className="font-serif italic text-xl text-gray-500 mt-2 rotate-[-3deg]">Internal & external links</span>
                </div>

                {/* Annotation 4: FAQ / Rich Data (Bottom Right) */}
                <div className="hidden md:flex flex-col items-start absolute -right-48 bottom-20 z-20 opacity-0 animate-fade-in-delay-4" style={{ animationDelay: '2s', opacity: 1 }}>
                    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" className="text-gray-400 mb-1 -translate-x-6">
                        <path d="M55 35 Q 30 35, 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" markerEnd="url(#arrow-br)" />
                        <defs>
                            <marker id="arrow-br" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                                <path d="M0 0 L3 3 L0 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </marker>
                        </defs>
                    </svg>
                    <span className="font-serif italic text-xl text-gray-500 rotate-[-4deg]">Rich Data & FAQs</span>
                </div>


                <Link href="https://www.unrealshot.com/blog/how-to-use-ai-headshots-to-level-up-your-resume" target="_blank" className="block relative z-10">
                    <div className="w-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col aspect-[3/2]">

                        {/* Browser Top Bar */}
                        <div className="bg-gray-100 border-b-2 border-black p-3 flex items-center gap-4">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400 border border-black"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400 border border-black"></div>
                            </div>
                            {/* URL Bar */}
                            <div className="flex-1 bg-white border-2 border-black rounded px-3 py-1.5 flex items-center justify-between text-xs font-mono text-gray-500 overflow-hidden">
                                <div className="flex items-center truncate">
                                    <span className="text-green-600">🔒 https://</span><span className="text-black font-semibold">www.unrealshot.com</span><span className="truncate">/blog/how-to-use-ai-headshots-to-level-up-your-resume</span>
                                </div>
                                <ExternalLink className="w-3 h-3 text-black opacity-50 flex-shrink-0 ml-2" />
                            </div>
                        </div>

                        {/* Content Area - Simulated Article Preview */}
                        <div className="p-4 md:p-12 flex flex-col items-center text-center flex-1 justify-center relative overflow-hidden">

                            {/* Cover Image Background */}
                            <div className="absolute inset-0 z-0">
                                <Image
                                    src="/images/use-ai-headshots-to-level-up-your-resume.webp"
                                    alt="Article Cover"
                                    fill
                                    className="object-cover opacity-20"
                                    priority
                                />
                            </div>





                            <h3 className="font-display font-black text-xl md:text-5xl uppercase leading-none mb-4 md:mb-8 max-w-2xl relative z-10 text-balance">
                                How to Use AI Headshots to Level Up Your Resume
                            </h3>

                            <div className="flex items-center gap-3 text-sm font-medium text-gray-500 mb-8 relative z-10">
                                <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">12 Min Read</span>
                                <span>•</span>
                                <span>Updated Jan 2026</span>
                            </div>

                            {/* Visual separation line */}
                            <div className="w-24 h-1 sm:h-1.5 bg-black mb-8"></div>

                            <div className="inline-flex items-center gap-2 bg-black text-white px-4 sm:px-6 py-1.5 sm:py-3 font-bold text-base sm:text-lg border-2 border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_#FFD8A8]">
                                Read Live Article
                                <ExternalLink className="w-5 h-5" />
                            </div>

                        </div>
                    </div>
                </Link>
            </div>

        </section>
    );
};
