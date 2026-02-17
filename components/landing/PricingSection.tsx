import React from 'react';
import { Bot, Zap, Globe, Image as ImageIcon, Link2, ShieldCheck } from 'lucide-react';
import Button from './Button';
import Link from 'next/link'

const FeatureItem = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex gap-4 items-start group">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white border border-brand-100 flex items-center justify-center text-brand-500">
            <Icon size={20} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
            <h4 className="font-serif text-lg text-stone-900 leading-tight mb-1">
                {title}
            </h4>
            <p className="text-sm text-stone-500 leading-relaxed">
                {description}
            </p>
        </div>
    </div>
);

const PricingSection: React.FC = () => {
    return (
        <section id="pricing" className="w-full max-w-5xl mx-auto px-6 py-20 md:py-32 relative">

            {/* Section Header */}
            <div className="flex flex-col items-center text-center mb-16">
                <h2 className="font-serif text-4xl md:text-6xl text-stone-900 mb-6 tracking-tight font-normal">
                    Stop Renting SEO Writers. <br /><span className='italic text-stone-500'>Own an AI Visibility Engine.</span>
                </h2>

                <p className="font-sans text-stone-500 text-lg leading-relaxed max-w-3xl">
                    Get the output of a $2,500/mo SEO Agency for the price of a dinner. <br className="hidden md:block" />
                    We don't just write 'blogs'—we build the Strategic Content Infrastructure your brand needs.
                </p>
            </div>

            {/* Wrapper Card (Two-Layer Effect) */}
            <div className="w-full bg-brand-200 rounded-[20px] p-2 shadow-[inset_0_0_0_1px_#c4b5fd]">

                {/* The Inner Pricing Card */}
                <div className="relative w-full bg-[#fffaf5] border border-brand-100/50 rounded-[17px] overflow-hidden flex flex-col md:flex-row">



                    {/* Left Side: Pricing & CTA */}
                    <div className="w-full md:w-[40%] bg-gradient-to-b from-brand-100/80 to-white border-b md:border-b-0 md:border-r border-brand-100 p-8 md:p-12 flex flex-col items-center text-center relative">



                        <div className="mb-6 mt-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wider mb-4 border border-brand-200">
                                All In One
                            </span>
                            <h3 className="font-serif text-2xl text-stone-900">
                                The Authority Engine Plan
                            </h3>
                        </div>

                        <div className="flex items-baseline justify-center gap-3 mb-2">
                            <span className="text-xl text-stone-400 line-through decoration-brand-300/50 decoration-2">
                                $149
                            </span>
                            <span className="text-6xl md:text-7xl font-serif text-stone-900 tracking-tighter">
                                $79
                            </span>
                        </div>
                        <p className="text-stone-500 text-sm mb-10">per month</p>



                        <div className="flex justify-center">
                            <Link href="/login">
                                <Button variant="primary" className="w-full px-10 py-4 text-lg">
                                    Deploy My Content Engine
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-6 flex items-center gap-2 text-xs text-stone-400 font-medium">
                            <ShieldCheck size={14} className="text-green-500" />
                            14-day money-back guarantee
                        </div>
                    </div>

                    {/* Right Side: Features */}
                    <div className="flex-1 p-8 md:p-12 bg-white">
                        <h3 className="font-sans text-xs font-bold text-stone-400 uppercase tracking-widest mb-8 border-b border-stone-100 pb-4">
                            Included Powerhouse Access
                        </h3>

                        <div className="space-y-6">
                            <FeatureItem
                                icon={Bot}
                                title="30 Citation-Optimized Authority Articles"
                                description="Generated and published on auto-pilot. High quality, human-like output that passes AI detection."
                            />
                            <FeatureItem
                                icon={Zap}
                                title="Competitor Research & Gap-Analysis"
                                description="Hands-free planning based on competitor gaps and real-time search intent analysis."
                            />
                            <FeatureItem
                                icon={Link2}
                                title="Semantic Internal Linking"
                                description="Powerful semantic suggestions to boost site structure and topical authority."
                            />
                            <FeatureItem
                                icon={ShieldCheck}
                                title="Google and LLM-Ready Structure"
                                description="Answer-first content optimized for Perplexity, ChatGPT, and Google featured snippets."
                            />
                            <FeatureItem
                                icon={Globe}
                                title="1-Click CMS Publishing"
                                description="Connects directly with WordPress, Webflow, and Shopify. We handle the formatting."
                            />
                            <FeatureItem
                                icon={ImageIcon}
                                title="On-Brand AI Images"
                                description="Visuals generated to match your brand's unique style automatically for every post." />
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative background blur behind the card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[90%] bg-brand-100/30 blur-3xl -z-10 rounded-full"></div>

        </section>
    );
};

export default PricingSection;