'use client';

import React from 'react';
import { ExternalLink, Video, Ghost, Search, Camera, ArrowUpRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/landing/Button';
import { cn } from '@/lib/utils';

// Track showcase article clicks in Google Analytics
const trackShowcaseClick = (article: { domain: string; title: string; href: string }) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'showcase_article_click', {
            event_category: 'engagement',
            event_label: article.domain,
            article_title: article.title,
            article_url: article.href,
        });
    }
};

interface ArticleProps {
    title: string;
    domain: string;
    href: string;
    icon: React.ReactNode;
    color: string;
}

const articles: ArticleProps[] = [
    {
        domain: 'launchdirectories.com',
        title: 'How to Promote Your Chrome Extension Online',
        href: 'https://launchdirectories.com/blog/how-to-promote-your-chrome-extension-online',
        icon: <Image src="/brands/launchdirectories.jpg" alt="Launch Directories" width={48} height={48} className="w-full h-full object-cover" />,
        color: 'bg-white'
    },
    {
        domain: 'bringback.pro',
        title: 'Can You Animate Photos of Deceased Relatives Safely?',
        href: 'https://bringback.pro/blog/can-you-animate-photos-of-deceased-relatives-safely',
        icon: <Image src="/brands/bringback.png" alt="BringBack" width={48} height={48} className="w-full h-full object-cover" />,
        color: 'bg-white'
    },
    {
        domain: 'flipaeo.com',
        title: 'The Complete Guide to AI SEO & AEO in 2026',
        href: 'https://flipaeo.com/blog/the-complete-guide-to-ai-seo-aeo-in-2026',
        icon: <Image src="/site-logo.png" alt="FlipAEO" width={48} height={48} className="w-full h-full object-cover" />,
        color: 'bg-brand-orange'
    },
    {
        domain: 'unrealshot.com',
        title: 'How to Use AI Headshots to Level Up Your Resume',
        href: 'https://www.unrealshot.com/blog/how-to-use-ai-headshots-to-level-up-your-resume',
        icon: <Image src="/brands/unrealshot.jpg" alt="Unreal Shot" width={48} height={48} className="w-full h-full object-cover" />,
        color: 'bg-white'
    }
];

export const ShowcaseSection: React.FC = () => {
    return (
        <section className="w-full py-24 px-4 flex flex-col items-center relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-16 max-w-4xl relative z-10">
                <div className="inline-flex items-center gap-2 bg-brand-yellow border-2 border-black px-4 py-1 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse border border-black" />
                    <span className="font-display font-black text-xs uppercase tracking-widest text-black">Live Examples</span>
                </div>
                <h2 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl md:text-6xl leading-[1] mb-6 uppercase">
                    SEE REAL EXAMPLES OF BLOGS<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-black">WRITTEN BY OUR AI</span>
                </h2>
                <p className="font-sans text-gray-500 text-lg md:text-xl leading-relaxed">
                    See what our AI writes when you're not looking. Full articles published on real domains, completely untouched by human editors.
                </p>
            </div>

            {/* Articles Grid */}
            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {articles.map((article, index) => (
                    <Link
                        key={index}
                        href={article.href}
                        target="_blank"
                        onClick={() => trackShowcaseClick(article)}
                        className="group relative flex flex-col bg-white border-2 border-black p-8 transition-all duration-200 hover:-translate-y-1 hover:translate-x-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative", article.color)}>
                                    {article.icon}
                                </div>
                                <span className="font-mono text-sm font-bold text-black border-b-2 border-transparent group-hover:border-brand-yellow transition-colors">{article.domain}</span>
                            </div>
                            <div className="w-8 h-8 border-2 border-black flex items-center justify-center bg-white group-hover:bg-black group-hover:text-white transition-colors duration-200">
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>

                        <h3 className="font-display text-2xl md:text-3xl leading-[1.1] text-black mb-4 group-hover:underline decoration-2 underline-offset-4 decoration-brand-yellow">
                            {article.title}
                        </h3>

                        <div className="mt-auto flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gray-500">
                            <span>Read Article</span>
                            <div className="h-[2px] w-8 bg-black/20 group-hover:bg-black transition-colors" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* CTA */}
            <div className="mt-16 relative z-10">
                <Link href="/dashboard">
                    <Button
                        variant="primary"
                        size="lg"
                        className="text-sm sm:text-lg px-4 sm:px-6 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px]"
                        icon={<ArrowRight className="w-4 h-4 sm:w-6 sm:h-6" />}
                    >
                        Start Creating Content Like This
                    </Button>
                </Link>
            </div>
        </section>
    );
};
