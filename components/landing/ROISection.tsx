import React from 'react';
import { CornerDot } from './CornerDot';
import { BarChart2, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';

const ReportMockupVisual = () => (
    <div className="w-full h-full min-h-[350px] flex items-center justify-center p-4 relative">
        
        {/* Abstract background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-brand-500/5 to-transparent blur-3xl rounded-full"></div>

        <div className="w-full max-w-[420px] bg-white rounded-xl shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-stone-200 p-6 relative z-10 flex flex-col gap-6">
            
            <div className="flex justify-between items-start border-b border-stone-100 pb-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-1">Automated Weekly Report</span>
                    <span className="font-serif text-lg text-stone-800 leading-tight">EcomPin Summary</span>
                </div>
                <div className="flex gap-1 items-center px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-100">
                    <TrendingUp size={12} strokeWidth={2.5} /> +24% Traffic
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="px-4 py-3 bg-stone-50 border border-stone-100 rounded-lg flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Assets Generated</span>
                    <span className="font-serif text-2xl text-stone-900">40</span>
                </div>
                <div className="px-4 py-3 bg-brand-50 border border-brand-100 rounded-lg flex flex-col gap-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-brand-100/50 rounded-full blur-xl"></div>
                    <span className="text-[10px] uppercase font-bold text-brand-600">Outbound Clicks</span>
                    <span className="font-serif text-2xl text-brand-800">112</span>
                </div>
            </div>

            <div className="w-full bg-stone-900 rounded-lg p-4 flex flex-col gap-3 shadow-inner relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-1 h-full bg-brand-400"></div>
                 <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-brand-400" />
                    <span className="text-[10px] font-mono tracking-widest text-brand-400 uppercase">Optimizer Insight</span>
                 </div>
                 <p className="font-sans text-[12px] leading-relaxed text-stone-300">
                     The <strong className="text-white">"Scandinavian"</strong> visual profile is currently yielding a 4% higher CTR than the baseline. <span className="text-stone-400">Adjusting next week's generation queue accordingly.</span>
                 </p>
            </div>

        </div>
    </div>
);

const ROISection: React.FC = () => {
    return (
        <section id="roi" className="w-full py-24 relative z-10">
            <div className="w-full max-w-[1250px] mx-auto px-3 sm:px-5">

                {/* Horizontal Pattern Bar Above Header */}
                <div className="w-full h-px bg-stone-200 mb-16"></div>

                {/* Horizontal Pattern Bar Top (Grid Boundary) */}
                <div className="relative w-full h-px bg-stone-200">
                    <CornerDot className="-left-[10px] -bottom-[10px]" />
                    <CornerDot className="-right-[10px] -bottom-[10px]" />
                </div>

                {/* Premium Wireframe Layout */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 border-x border-stone-200 relative bg-stone-50/30">
                    <CornerDot className="-left-[10px] -top-[10px]" />
                    <CornerDot className="-right-[10px] -top-[10px]" />
                    <CornerDot className="-left-[10px] -bottom-[10px]" />
                    <CornerDot className="-right-[10px] -bottom-[10px]" />

                    {/* Left Column (Copy) */}
                    <div className="p-8 md:p-16 md:border-r border-b md:border-b-0 border-stone-200 flex flex-col justify-center">
                        <span className="font-sans text-xs font-bold tracking-widest text-brand-500 uppercase mb-6 block">
                            Social Proof & ROI
                        </span>
                        <h2 className="font-serif text-3xl md:text-5xl text-stone-900 tracking-tight font-normal leading-tight mb-6">
                            Compounding organic traffic that <span className='italic text-stone-500'>outlasts paid ads.</span>
                        </h2>
                        <div className="w-12 h-12 mb-6">
                            <svg viewBox="0 0 24 24" fill="none" className="text-stone-300 w-full h-full">
                                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" fill="currentColor"/>
                            </svg>
                        </div>
                        <p className="font-sans text-stone-500 text-lg leading-relaxed">
                            A standard social media ad dies the moment you stop paying. A highly-optimized Pinterest asset has a half-life of months, sometimes years. <strong>EcomPin builds a permanent library of visual entry-points to your store,</strong> driving high-intent buyers long after the pin is published.
                        </p>
                    </div>

                    {/* Right Column (Visual) */}
                    <div className="bg-stone-50/50 flex flex-col justify-center relative overflow-hidden">
                        <ReportMockupVisual />
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

export default ROISection;
