
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { GridBackground } from '@/components/landing/GridBackground';
import { ArrowRight, Check, X, Zap, Target, PenLine } from 'lucide-react';
import { StructuredData } from '@/components/seo/StructuredData';
import { comparisons } from '../data';

interface Props {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const comparison = comparisons[slug];

    if (!comparison) {
        return {
            title: 'Comparison Not Found | FlipAEO',
        };
    }

    return {
        title: `${comparison.heroTitle} | FlipAEO`,
        description: comparison.sonicBoomSummary,
    };
}

export default async function ComparisonPage({ params }: Props) {
    const { slug } = await params;
    const comparison = comparisons[slug];

    if (!comparison) {
        notFound();
    }

    const {
        competitorName,
        heroTitle,
        sonicBoomSummary,
        quickVerdict,
        matrix,
        verdict,
        features,
        pricing,
        faqs,
        finalVerdict,
        moreAlternatives,
        competitorLogo,
        color
    } = comparison;

    const { competitorPlans, flipaeoPlans, verdict: pricingVerdict } = pricing;
    const moreAlternativeCards = (moreAlternatives && moreAlternatives.length > 0)
        ? moreAlternatives
        : [
            {
                title: "Browse All Comparisons",
                description: "Explore more alternatives across bulk writers, SEO tools, and AI assistants.",
                href: "/alternatives"
            }
        ];

    return (
        <div className="relative min-h-screen w-full flex flex-col font-sans bg-stone-50/20">
            <Navbar />

            <main className="flex-grow flex flex-col items-center w-full relative pt-24 pb-24 z-10 w-full overflow-hidden">
                <StructuredData
                    data={{
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        name: heroTitle,
                        description: sonicBoomSummary,
                        mainEntity: {
                            "@type": "FAQPage",
                            mainEntity: faqs.map(faq => ({
                                "@type": "Question",
                                name: faq.question,
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: faq.answer
                                }
                            }))
                        }
                    }}
                />

                {/* Section 1: Quick Verdict Header */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="text-center mb-10">
                        <h1 className="font-serif text-3xl md:text-5xl text-stone-900 leading-[1.1] mb-6 tracking-tight">
                            FlipAEO vs. {competitorName}
                        </h1>
                        <p className="text-stone-500 text-sm">The Honest Comparison for 2026</p>
                    </div>

                    <div className="bg-white rounded-lg border border-brand-200  overflow-hidden">
                        <div className="bg-brand-50/50 px-6 py-4 border-b border-brand-100 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-brand-600 fill-brand-600" />
                            <h2 className="text-sm font-bold text-brand-900 uppercase tracking-wider">The 30-Second Verdict</h2>
                        </div>
                        
                        <div className="p-6 md:p-8">
                            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                                {/* Competitor Column */}
                                <div>
                                    <h3 className="font-bold text-stone-900 text-lg mb-3 flex items-center gap-2">
                                        {quickVerdict?.competitorTitle || `For Mass Scale (${competitorName}):`}
                                    </h3>
                                    <p className="text-stone-600 text-sm leading-relaxed">
                                        {quickVerdict?.competitorDescription || sonicBoomSummary}
                                    </p>
                                </div>

                                {/* FlipAEO Column */}
                                <div>
                                    <h3 className="font-bold text-brand-700 text-lg mb-3 flex items-center gap-2">
                                        {quickVerdict?.flipaeoTitle || "For AI Citations (FlipAEO):"}
                                    </h3>
                                    <p className="text-stone-900 text-sm leading-relaxed font-medium">
                                        {quickVerdict?.flipaeoDescription || sonicBoomSummary}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Feature Comparison Table */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="flex items-center gap-3 mb-6 border-b border-stone-200 pb-2">
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">[02]</span>
                        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Feature Comparison</h2>
                    </div>

                    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden ">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 bg-stone-50 border-b border-stone-200 divide-x divide-stone-200">
                            <div className="col-span-4 p-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Feature</div>
                            <div className="col-span-3 p-4 text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-4 h-4 rounded bg-stone-200 flex items-center justify-center text-[8px] text-stone-600">{competitorLogo}</span>
                                {competitorName}
                            </div>
                            <div className="col-span-3 p-4 text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-2 bg-brand-50/30">
                                <span className="w-4 h-4 rounded bg-brand-200 flex items-center justify-center text-[8px] text-brand-700">F</span>
                                FlipAEO
                            </div>
                            <div className="col-span-2 p-4 text-xs font-bold text-stone-400 uppercase tracking-wider text-center">Winner</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-stone-100">
                            {Object.entries(matrix).map(([key, value], idx) => (
                                <div key={key} className="grid grid-cols-12 divide-x divide-stone-100 hover:bg-stone-50/50 transition-colors">
                                    <div className="col-span-4 p-4 text-sm font-medium text-stone-900 flex items-center">
                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </div>
                                    <div className="col-span-3 p-4 text-sm text-stone-500 leading-tight flex items-center">
                                        {value.competitor}
                                    </div>
                                    <div className="col-span-3 p-4 text-sm font-medium text-stone-900 bg-brand-50/5 leading-tight flex items-center border-l border-brand-100/50">
                                        {value.flipaeo}
                                    </div>
                                    <div className="col-span-2 p-4 flex items-center justify-center">
                                        {value.winner === 'FlipAEO' && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded border border-brand-100">
                                                <Target className="w-3 h-3" />
                                                FlipAEO
                                            </div>
                                        )}
                                        {value.winner === 'Competitor' && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded border border-stone-200">
                                                <span className="text-[10px]">{competitorLogo}</span>
                                                {competitorName}
                                            </div>
                                        )}
                                        {value.winner === 'Tie' && (
                                            <div className="text-xs font-medium text-stone-400">
                                                Draw
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 3: Pricing Analysis */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="flex items-center gap-3 mb-6 border-b border-stone-200 pb-2">
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">[03]</span>
                        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Pricing Analysis</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg border border-stone-200 overflow-hidden ">
                                <div className="px-6 py-5 border-b border-stone-200 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-lg border border-stone-200">
                                        {competitorLogo}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-stone-900">{competitorName}</h3>
                                    </div>
                                </div>

                                <div className="divide-y divide-stone-100">
                                    {competitorPlans.map((plan) => (
                                        <div key={plan.name} className="px-6 py-5 flex items-start justify-between gap-6">
                                            <div>
                                                <div className="text-sm font-semibold text-stone-900">{plan.name}</div>
                                                <div className="text-sm text-stone-500 mt-1 leading-relaxed">{plan.subtitle}</div>
                                            </div>
                                            <div className="text-sm font-bold text-stone-900 whitespace-nowrap">{plan.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border-2 border-brand-500 overflow-hidden shadow-md relative">
                                <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                                    Our Pick
                                </div>

                                <div className="px-6 py-5 border-b border-brand-100 bg-brand-50/30 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg border border-brand-200">
                                        F
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-stone-900">FlipAEO</h3>
                                        <span className="text-sm font-medium text-brand-600">Best Value for AEO</span>
                                    </div>
                                </div>

                                <div className="divide-y divide-stone-100">
                                    {flipaeoPlans.map((plan) => (
                                        <div key={plan.name} className="px-6 py-5 flex items-start justify-between gap-6">
                                            <div>
                                                <div className="text-sm font-semibold text-stone-900">{plan.name}</div>
                                                <div className="text-sm text-stone-500 mt-1 leading-relaxed">{plan.subtitle}</div>
                                            </div>
                                            <div className="text-sm font-bold text-brand-700 whitespace-nowrap">{plan.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-stone-200 p-6 ">
                            <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                                <Zap className="w-4 h-4 text-brand-600" />
                                Pricing Verdict
                            </div>
                            <p className="text-stone-600 text-sm leading-relaxed">
                                {pricingVerdict}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 4: Detailed Feature Breakdown */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="flex items-center gap-3 mb-8 border-b border-stone-200 pb-2">
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">[04]</span>
                        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Detailed Feature Breakdown</h2>
                    </div>

                    <div className="space-y-6">
                        {features.map((feature, i) => (
                            <div key={i} className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                                <div className="bg-stone-50/50 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-stone-900">{feature.title}</h3>
                                    {feature.winner === 'FlipAEO' && (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-brand-50 text-brand-700 text-[10px] font-bold uppercase border border-brand-100">
                                            <Target className="w-3 h-3" />
                                            FlipAEO Wins
                                        </div>
                                    )}
                                    {feature.winner === 'Competitor' && (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-stone-100 text-stone-600 text-[10px] font-bold uppercase border border-stone-200">
                                            <span className="text-[8px]">{competitorLogo}</span>
                                            {competitorName} Wins
                                        </div>
                                    )}
                                    {feature.winner === 'Tie' && (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-stone-100 text-stone-400 text-[10px] font-bold uppercase border border-stone-200">
                                            Draw
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <p className="text-stone-600 text-sm leading-relaxed">
                                        {feature.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section 5: Which Should You Choose? */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="flex items-center gap-3 mb-6 border-b border-stone-200 pb-2">
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">[05]</span>
                        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Which Should You Choose?</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 bg-white rounded-lg border border-stone-200 overflow-hidden">
                        <div className="p-8 border-b md:border-b-0 md:border-r border-stone-200 bg-brand-50/10">
                            <h3 className="text-brand-600 font-bold mb-6">Choose FlipAEO if...</h3>
                            <ul className="space-y-4">
                                {verdict.flipaeoIf.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-stone-700 text-sm">
                                        <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-8">
                            <h3 className="text-stone-900 font-bold mb-6">Choose {competitorName} if...</h3>
                            <ul className="space-y-4">
                                {verdict.competitorIf.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-stone-500 text-sm">
                                        <div className="w-4 h-4 rounded-full border border-stone-300 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-stone-300"></div>
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Section 6: FAQ */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-24">
                    <div className="flex items-center gap-3 mb-6 border-b border-stone-200 pb-2">
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">[06]</span>
                        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Frequently Asked Questions</h2>
                    </div>

                    <div className="bg-white rounded-lg border border-stone-200 divide-y divide-stone-100">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="p-6">
                                <h3 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
                                    <span className="text-brand-500">Q.</span>
                                    {faq.question}
                                </h3>
                                <p className="text-stone-500 text-sm leading-relaxed pl-6">
                                    {faq.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="flex items-center gap-3 mb-6 border-b border-stone-200 pb-2">
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">[07]</span>
                        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Final Verdict</h2>
                    </div>

                    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-stone-200 flex items-center gap-2">
                            <Target className="w-4 h-4 text-brand-600" />
                            <h3 className="text-sm font-bold text-stone-900">{finalVerdict.title}</h3>
                        </div>

                        <div className="p-6 space-y-4">
                            {finalVerdict.body.map((paragraph, idx) => (
                                <p key={idx} className="text-stone-600 text-sm leading-relaxed">
                                    {paragraph}
                                </p>
                            ))}

                            <p className="text-stone-900 text-sm leading-relaxed font-medium">
                                {finalVerdict.recommendation}
                            </p>

                            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                                <Link
                                    href={finalVerdict.flipaeoCta.href}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
                                >
                                    {finalVerdict.flipaeoCta.label}
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    href={finalVerdict.competitorCta.href}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-white border border-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-50 transition-colors"
                                    target={finalVerdict.competitorCta.href.startsWith('http') ? "_blank" : undefined}
                                    rel={finalVerdict.competitorCta.href.startsWith('http') ? "noreferrer" : undefined}
                                >
                                    {finalVerdict.competitorCta.label}
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full max-w-5xl mx-auto px-6 mb-24">
                    <div className="flex items-center gap-3 mb-6 border-b border-stone-200 pb-2">
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">[08]</span>
                        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">More Alternatives</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {moreAlternativeCards.map((card) => (
                            <Link
                                key={card.title}
                                href={card.href}
                                className="group block bg-white rounded-lg border border-stone-200 p-5 hover:border-brand-200 hover:bg-stone-50 transition-colors"
                                target={card.href.startsWith('http') ? "_blank" : undefined}
                                rel={card.href.startsWith('http') ? "noreferrer" : undefined}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-semibold text-stone-900 group-hover:text-brand-700 transition-colors">
                                            {card.title}
                                        </div>
                                        <div className="text-sm text-stone-500 mt-1 leading-relaxed">
                                            {card.description}
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-brand-600 transition-colors shrink-0 mt-0.5" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
