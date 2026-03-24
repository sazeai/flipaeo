import React from 'react';
import { Bot, Zap, Globe, Image as ImageIcon, Link2, ShieldCheck, Check } from 'lucide-react';
import Button from './Button';
import Link from 'next/link';
import { CornerDot } from './CornerDot';

const FeatureItem = ({ text }: { text: string }) => (
    <div className="flex gap-3 items-start group">
        <div className="flex-shrink-0 mt-1 w-4 h-4 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
            <Check size={10} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
            <span className="font-sans text-sm text-stone-600 leading-relaxed font-medium">
                {text}
            </span>
        </div>
    </div>
);

const PricingSection: React.FC = () => {
    return (
        <section id="pricing" className="w-full py-24 relative z-10">
            <div className="w-full max-w-[1250px] mx-auto px-3 sm:px-5">

                {/* Horizontal Pattern Bar Above Header */}
                <div className="w-full h-px bg-stone-200 mb-16"></div>

                {/* Header - Left/Right Premium Setup */}
                <div className="flex flex-col md:flex-row gap-8 md:gap-16 justify-between items-start md:items-end mb-16 w-full px-4 md:px-8">
                    <div className="flex-1">
                        <span className="font-sans text-xs font-bold tracking-widest text-brand-500 uppercase mb-4 block">
                            Pricing
                        </span>
                        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 tracking-tight font-normal leading-[1]">
                            Less than the cost of <br /><span className='italic text-stone-500'>a single photoshoot.</span>
                        </h2>
                    </div>
                    <div className="flex-1 md:max-w-xl pb-0 md:pb-2">
                        <p className="font-sans text-stone-500 text-lg leading-relaxed">
                            Stop paying thousands for photography and virtual assistant labor. Deploy a complete autonomous agent for a fraction of the cost.
                        </p>
                    </div>
                </div>

                {/* Horizontal Pattern Bar Top (Grid Boundary) */}
                <div className="relative w-full h-px bg-stone-200">
                    <CornerDot className="-left-[10px] -bottom-[10px]" />
                    <CornerDot className="-right-[10px] -bottom-[10px]" />
                </div>

                {/* Premium Wireframe Grid */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 border-x border-stone-200 relative">

                    {/* Main Grid Corners */}
                    <CornerDot className="-left-[10px] -top-[10px]" />
                    <CornerDot className="-right-[10px] -top-[10px]" />
                    <CornerDot className="-left-[10px] -bottom-[10px]" />
                    <CornerDot className="-right-[10px] -bottom-[10px]" />

                    {/* Junctions */}
                    <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                        <CornerDot className="-left-[10px] -top-[10px]" />
                    </div>
                    <div className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                        <CornerDot className="-left-[10px] -top-[10px]" />
                    </div>

                    {/* Tier 1: Growth Agent */}
                    <div className="w-full border-b md:border-b-0 md:border-r border-stone-200 p-8 md:p-16 flex flex-col">
                        <div className="mb-8">
                            <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-stone-900 leading-none mb-4">
                                Growth Agent
                            </h3>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-[64px] font-serif text-stone-900 tracking-tighter leading-none">
                                    $99
                                </span>
                            </div>
                            <p className="text-stone-500 text-sm font-bold tracking-widest uppercase mb-8">per month</p>
                            
                            <Link href="/login" className="w-full flex">
                                <Button variant="secondary" className="w-full px-6 py-4 text-base">
                                    Start 7-Day Free Trial
                                </Button>
                            </Link>
                        </div>
                        
                        <div className="space-y-5 mt-auto border-t border-stone-100 pt-8">
                            <FeatureItem text="Up to 100 Autonomous Pins generated & published/mo" />
                            <FeatureItem text="Full Shopify/Etsy Catalog Sync" />
                            <FeatureItem text="AI Art Director (Lifestyle Generation)" />
                            <FeatureItem text="Closed-Loop Analytics Optimization" />
                        </div>
                    </div>

                    {/* Tier 2: Scale Agent */}
                    <div className="w-full p-8 md:p-16 border-b border-stone-200 bg-stone-50/50 flex flex-col relative overflow-hidden">
                        {/* Popular Badge */}
                        <div className="absolute top-6 right-6 px-3 py-1 bg-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-widest border border-brand-200 rounded pb-0.5">
                            Most Popular
                        </div>

                        <div className="mb-8">
                            <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-stone-900 leading-none mb-4">
                                Scale Agent
                            </h3>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-[64px] font-serif text-stone-900 tracking-tighter leading-none">
                                    $249
                                </span>
                            </div>
                            <p className="text-stone-500 text-sm font-bold tracking-widest uppercase mb-8">per month</p>
                            
                            <Link href="/login" className="w-full flex">
                                <Button variant="primary" className="w-full px-6 py-4 text-base">
                                    Start 7-Day Free Trial
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-5 mt-auto border-t border-stone-100 pt-8">
                            <FeatureItem text="Up to 300 Autonomous Pins generated & published/mo" />
                            <FeatureItem text="Priority Background Queue Processing" />
                            <FeatureItem text="Custom Brand Colors & Font Selection" />
                            <FeatureItem text="Everything in Growth Agent" />
                        </div>
                    </div>

                </div>

                {/* Horizontal Pattern Bar Bottom (Grid Boundary) */}
                <div className="relative w-full h-px bg-stone-200">
                    <CornerDot className="-left-[10px] -top-[10px]" />
                    <CornerDot className="-right-[10px] -top-[10px]" />
                </div>

            </div>
        </section>
    );
};

export default PricingSection;
