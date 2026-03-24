import React from 'react';
import { CornerDot } from './CornerDot';
import { Check, X } from 'lucide-react';

const COMPARISON_DATA = [
  {
    feature: 'Generates contextual lifestyle photography?',
    legacy: {
        value: 'No',
        desc: '(You provide the assets)',
        isPro: false,
    },
    pinloop: {
        value: 'Yes',
        desc: '(Fully programmatic)',
        isPro: true,
    }
  },
  {
    feature: 'Applies OCR-Optimized Typography?',
    legacy: {
        value: 'No',
        desc: '(Requires manual graphic design)',
        isPro: false,
    },
    pinloop: {
        value: 'Yes',
        desc: '(Mathematically sized for AI readability)',
        isPro: true,
    }
  },
  {
    feature: 'Adjusts strategy based on live analytics?',
    legacy: {
        value: 'No',
        desc: '(Relies on human interpretation)',
        isPro: false,
    },
    pinloop: {
        value: 'Yes',
        desc: '(Self-correcting machine learning)',
        isPro: true,
    }
  },
  {
    feature: 'Active weekly management time?',
    legacy: {
        value: '5 to 10 Hours',
        desc: '',
        isPro: false,
    },
    pinloop: {
        value: '0 Hours',
        desc: '',
        isPro: true,
    }
  }
];

const ComparisonSection: React.FC = () => {
    return (
        <section id="comparison" className="w-full py-24 relative z-10">
            <div className="w-full max-w-[1250px] mx-auto px-3 sm:px-5">

                {/* Horizontal Pattern Bar Above Header */}
                <div className="w-full h-px bg-stone-200 mb-16"></div>

                {/* Header - Left/Right Premium Setup */}
                <div className="flex flex-col md:flex-row gap-8 md:gap-16 justify-between items-end mb-16 w-full px-4 md:px-8">
                    <div className="flex-1">
                        <span className="font-sans text-xs font-bold tracking-widest text-brand-500 uppercase mb-4 block">
                            The Moat
                        </span>
                        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 tracking-tight font-normal leading-[1]">
                            Legacy Schedulers <br /><span className='italic text-stone-500'>vs. Autonomous AI</span>
                        </h2>
                    </div>
                </div>

                {/* Horizontal Pattern Bar Top (Grid Boundary) */}
                <div className="relative w-full h-px bg-stone-200">
                    <CornerDot className="-left-[10px] -bottom-[10px]" />
                    <CornerDot className="-right-[10px] -bottom-[10px]" />
                </div>

                {/* Premium Wireframe Table */}
                <div className="w-full border-x border-stone-200 relative bg-white">
                    <CornerDot className="-left-[10px] -top-[10px]" />
                    <CornerDot className="-right-[10px] -top-[10px]" />
                    <CornerDot className="-left-[10px] -bottom-[10px]" />
                    <CornerDot className="-right-[10px] -bottom-[10px]" />

                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr>
                                    <th className="w-2/5 p-6 md:p-8 font-serif text-xl md:text-2xl text-stone-900 border-b border-stone-200 bg-stone-50/50">Feature</th>
                                    <th className="w-1/4 p-6 md:p-8 font-sans font-bold text-sm tracking-widest uppercase text-stone-400 border-b border-l border-stone-200 bg-stone-50/50 text-center">Legacy Schedulers</th>
                                    <th className="w-[35%] p-6 md:p-8 font-serif text-2xl md:text-3xl text-brand-600 border-b border-l border-stone-200 bg-brand-50/30 text-center relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-brand-400"></div>
                                        PinLoop AI
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON_DATA.map((row, idx) => (
                                    <tr key={idx} className="group transition-colors hover:bg-stone-50/30">
                                        <td className="p-6 md:p-8 border-b border-stone-100 font-sans text-stone-600 text-sm md:text-base leading-relaxed">
                                            {row.feature}
                                        </td>
                                        <td className="p-6 md:p-8 border-b border-l border-stone-100 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1 opacity-70">
                                                <div className="flex items-center gap-2">
                                                    {row.legacy.isPro ? 
                                                        <Check size={16} className="text-green-500" strokeWidth={3} /> : 
                                                        <X size={16} className="text-stone-400" strokeWidth={3} />
                                                    }
                                                    <span className={`font-bold ${row.legacy.isPro ? 'text-stone-800' : 'text-stone-500'}`}>{row.legacy.value}</span>
                                                </div>
                                                {row.legacy.desc && <span className="text-[11px] text-stone-400">{row.legacy.desc}</span>}
                                            </div>
                                        </td>
                                        <td className="p-6 md:p-8 border-b border-l border-brand-100/50 bg-brand-50/10 text-center group-hover:bg-brand-50/30 transition-colors">
                                           <div className="flex flex-col items-center justify-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    {row.pinloop.isPro ? 
                                                        <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center border border-brand-200"><Check size={12} strokeWidth={3} /></div> : 
                                                        <X size={16} className="text-stone-400" strokeWidth={3} />
                                                    }
                                                    <span className={`font-bold ${row.pinloop.isPro ? 'text-brand-700' : 'text-stone-500'}`}>{row.pinloop.value}</span>
                                                </div>
                                                {row.pinloop.desc && <span className="text-[11px] text-brand-600/70 font-medium">{row.pinloop.desc}</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

export default ComparisonSection;
