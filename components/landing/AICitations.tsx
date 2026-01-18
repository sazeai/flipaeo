import React from 'react';
import Image from 'next/image';
import { BadgeCheck, Sparkles } from 'lucide-react';

export const AICitations: React.FC = () => {
    return (
        <section className="w-full py-24 px-4 flex flex-col items-center relative overflow-hidden">

            {/* Header Content */}
            <div className="max-w-4xl mx-auto text-center mb-16 relative z-10 flex flex-col items-center">
                <div className="inline-block bg-brand-orange border-2 border-black shadow-neo-sm px-4 py-1 mb-8">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-black" />
                        <span className="font-display font-black text-xs uppercase tracking-widest text-black">Unbelievable Results</span>
                    </div>
                </div>


                <h2 className="font-display text-4xl md:text-6xl leading-[1] mb-6 uppercase text-black">
                    Testimonials? <span className="text-gray-400 line-through decoration-red-500 decoration-4">Not Yet.</span><br />
                    But we have Proof.
                </h2>

                <p className="font-sans text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    FlipAEO was built to make your brand citable in LLMs. We launched our own fresh domain and published one article written by our own engine to prove it. <span className="font-bold text-black">It did exactly what it says.</span> Hours later, ChatGPT and Gemini were citing us as a source of truth.
                </p>
            </div>

            {/* Evidence Grid */}
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">

                {/* Proof Item 1: ChatGPT */}
                <a
                    href="https://chatgpt.com/share/696d2fba-6c68-8002-9356-7c0ca378f51f"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col transition-opacity hover:opacity-90"
                >
                    <div className="bg-white border-2 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-2 mb-4 border-b-2 border-black/10 pb-3">
                            <div className="w-3 h-3 rounded-full bg-red-500 border border-black" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500 border border-black" />
                            <div className="w-3 h-3 rounded-full bg-green-500 border border-black" />
                            <span className="ml-2 font-mono text-xs text-gray-500">chatgpt-evidence.png</span>
                            <div className="ml-auto px-2 py-0.5 bg-green-100 border border-green-500 text-green-700 text-[10px] font-bold uppercase rounded">Verified</div>
                        </div>
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 border border-black/5">
                            <Image
                                src="/proof/chatgpt-citation.webp"
                                alt="ChatGPT Citing FlipAEO"
                                fill
                                className="object-cover object-top"
                            />
                        </div>
                    </div>
                    <div className="mt-6 text-center lg:text-left pl-2">
                        <h3 className="font-display text-2xl mb-2 flex items-center justify-center lg:justify-start gap-2">
                            <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-100" />
                            ChatGPT Citation
                        </h3>
                        <p className="font-mono text-sm text-gray-500">
                            "Practical ways to own your brand's authority... backed by credible sources."
                        </p>
                    </div>
                </a>

                {/* Proof Item 2: Gemini */}
                <a
                    href="https://aistudio.google.com/app/prompts/1mVD6Sfl5qCDrN4C8o5oskcft4ylCOmsK"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col lg:mt-12 transition-opacity hover:opacity-90"
                >
                    <div className="bg-white border-2 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-2 mb-4 border-b-2 border-black/10 pb-3">
                            <div className="w-3 h-3 rounded-full bg-red-500 border border-black" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500 border border-black" />
                            <div className="w-3 h-3 rounded-full bg-green-500 border border-black" />
                            <span className="ml-2 font-mono text-xs text-gray-500">gemini-evidence.png</span>
                            <div className="ml-auto px-2 py-0.5 bg-blue-100 border border-blue-500 text-blue-700 text-[10px] font-bold uppercase rounded">Verified</div>
                        </div>
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 border border-black/5">
                            <Image
                                src="/proof/gemini-citation.webp"
                                alt="Gemini Citing FlipAEO"
                                fill
                                className="object-cover object-top"
                            />
                        </div>
                    </div>
                    <div className="mt-6 text-center lg:text-left pl-2">
                        <h3 className="font-display text-2xl mb-2 flex items-center justify-center lg:justify-start gap-2">
                            <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-100" />
                            Gemini Citation
                        </h3>
                        <p className="font-mono text-sm text-gray-500">
                            "Source of Truth: FlipAEO... mention recall and factual density are the new authority signals."
                        </p>
                    </div>
                </a>

            </div>
        </section>
    );
};
