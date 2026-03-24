import React from 'react';
import { CornerSquare } from './CornerSquare';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

const BeforeAfterVisual = () => (
    <div className="w-full h-full min-h-[400px] flex flex-col md:flex-row relative overflow-hidden rounded-xl border border-stone-200">
        
        {/* BEFORE */}
        <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 relative border-b md:border-b-0 md:border-r border-stone-200">
            <div className="absolute top-4 left-4 bg-stone-100 text-stone-500 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded">
                Before
            </div>
            
            {/* Simulated Product on White Background */}
            <div className="w-48 h-48 bg-stone-50 border border-stone-100 rounded-lg shadow-sm flex items-center justify-center relative overflow-hidden">
                <ImageIcon className="w-12 h-12 text-stone-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                     <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] pattern-dots stroke-stone-300 fill-stone-300">
                         <rect width="100%" height="100%" fill="url(#polka-dots)" />
                     </svg>
                </div>
            </div>
            <p className="mt-4 text-[11px] font-mono text-stone-400">INPUT: raw_product.jpg</p>
        </div>

        {/* AFTER */}
        <div className="flex-1 bg-stone-900 flex flex-col items-center justify-center p-8 relative overflow-hidden group">
            <div className="absolute top-4 right-4 bg-brand-500 text-white text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded shadow-md z-20">
                After (PinLoop AI)
            </div>
            
            {/* Abstract Lifestyle Render */}
            <div className="absolute inset-0 w-full h-full opacity-60 mix-blend-overlay">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-stone-800 to-stone-900"></div>
                <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-500/20 via-transparent to-transparent"></div>
            </div>

            <div className="w-56 h-72 bg-gradient-to-br from-stone-800 to-stone-900 ring-1 ring-white/10 rounded-lg shadow-2xl flex flex-col items-center justify-between p-4 relative z-10 transform transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-2">
                <div className="w-full flex justify-between items-start opacity-50">
                    <div className="w-8 h-1 bg-white/30 rounded-full"></div>
                    <div className="w-4 h-4 rounded-full border border-white/20"></div>
                </div>
                
                {/* The 'Product' inside the lifestyle scene */}
                <div className="w-32 h-32 bg-stone-700/50 backdrop-blur-sm border border-white/10 rounded shadow-inner flex items-center justify-center relative">
                     <Sparkles className="w-8 h-8 text-brand-400 opacity-80" />
                     {/* Light leak effect */}
                     <div className="absolute -left-4 -top-4 w-16 h-16 bg-brand-500/30 blur-2xl rounded-full"></div>
                </div>

                <div className="w-full space-y-2 opacity-80">
                   <div className="w-full h-2 bg-white/20 rounded-full"></div>
                   <div className="w-2/3 h-2 bg-white/20 rounded-full"></div>
                </div>
            </div>
            
            <p className="mt-6 text-[11px] font-mono text-stone-400 relative z-10">OUTPUT: lifestyle_editorial_asset.webp</p>
        </div>

    </div>
);

const AhaSection: React.FC = () => {
    return (
        <section id="aha" className="w-full py-24 relative z-10">
            <div className="w-full max-w-[1250px] mx-auto px-3 sm:px-5">

                {/* Horizontal Pattern Bar Above Header */}
                <div className="w-full h-3 sm:h-4 border-y border-stone-200 mb-16" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px)' }}></div>

                {/* Header - Left/Right Premium Setup */}
                <div className="flex flex-col md:flex-row gap-8 md:gap-16 justify-between items-start md:items-end mb-16 w-full px-4 md:px-8">
                    <div className="flex-1">
                        <span className="font-sans text-xs font-bold tracking-widest text-brand-500 uppercase mb-4 block">
                            The "Aha!" Moment
                        </span>
                        <h2 className="font-serif text-4xl md:text-5xl lg:text-5xl text-stone-900 tracking-tight font-normal leading-tight">
                            Turn a standard product image <br /><span className='italic text-stone-500'>into a high-end lifestyle asset.</span>
                        </h2>
                    </div>
                    <div className="flex-1 md:max-w-xl pb-0 md:pb-2">
                        <p className="font-sans text-stone-500 text-lg leading-relaxed">
                            You don't need expensive lifestyle photoshoots. PinLoop's AI Art Director analyzes your physical product and places it in highly contextual, photorealistic environments. It preserves your exact product details while generating an aesthetic that Pinterest users actually want to click.
                        </p>
                    </div>
                </div>

                {/* Horizontal Pattern Bar Top (Grid Boundary) */}
                <div className="relative w-full h-3 sm:h-4 border-y border-stone-200" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px)' }}>
                    <CornerSquare className="-left-[5px] -bottom-[5px]" />
                    <CornerSquare className="-right-[5px] -bottom-[5px]" />
                </div>

                {/* Premium Wireframe Grid */}
                <div className="w-full border-x border-stone-200 relative p-4 md:p-8 bg-stone-50/30">
                    <CornerSquare className="-left-[5px] -top-[5px]" />
                    <CornerSquare className="-right-[5px] -top-[5px]" />
                    <CornerSquare className="-left-[5px] -bottom-[5px]" />
                    <CornerSquare className="-right-[5px] -bottom-[5px]" />

                    <div className="w-full max-w-5xl mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl">
                        <BeforeAfterVisual />
                    </div>
                </div>

                {/* Horizontal Pattern Bar Bottom (Grid Boundary) */}
                <div className="relative w-full h-3 sm:h-4 border-y border-stone-200" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px)' }}>
                    <CornerSquare className="-left-[5px] -top-[5px]" />
                    <CornerSquare className="-right-[5px] -top-[5px]" />
                </div>

            </div>
        </section>
    );
};

export default AhaSection;
