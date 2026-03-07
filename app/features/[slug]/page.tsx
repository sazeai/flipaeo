import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { GridBackground } from '@/components/landing/GridBackground';
import { ArrowRight, Check, X, Zap, Sparkles, ChevronRight } from 'lucide-react';
import { StructuredData } from '@/components/seo/StructuredData';
import { features } from '../data';
import { defaultSEO } from '@/config/seo';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const feature = features[slug];
    if (!feature) return { title: 'Feature Not Found | FlipAEO' };

    return {
        title: `${feature.featureName} — ${feature.heroTitle} | FlipAEO`,
        description: feature.heroSubtitle,
        alternates: { canonical: `${defaultSEO.siteUrl}/features/${slug}` }
    };
}

export async function generateStaticParams() {
    return Object.keys(features).map((slug) => ({ slug }));
}

export default async function FeaturePage({ params }: Props) {
    const { slug } = await params;
    const feature = features[slug];
    if (!feature) notFound();

    const {
        featureName, heroTitle, heroBadge, heroSubtitle,
        pitch, inputOutput, pipeline, deliverable, useCases,
        comparison, faqTitle, faqSubtitle, faqs, cta, connectedFeatures
    } = feature;

    const connectedCards = connectedFeatures.items
        .filter((item: { slug: string }) => features[item.slug])
        .map((item: { slug: string; relationship: string }) => ({
            ...item,
            name: features[item.slug].featureName,
            badge: features[item.slug].heroBadge,
            subtitle: features[item.slug].heroSubtitle.substring(0, 80).trim() + '...'
        }));

    return (
        <div className="relative min-h-screen w-full flex flex-col font-sans bg-stone-50/20">
            <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <GridBackground />
            </div>

            <Navbar />

            <main className="flex-grow flex flex-col items-center w-full relative pt-24 pb-24 z-10 overflow-hidden">
                <StructuredData data={{
                    "@context": "https://schema.org",
                    "@type": "WebApplication",
                    name: `FlipAEO ${featureName}`,
                    description: heroSubtitle,
                    url: `${defaultSEO.siteUrl}/features/${slug}`,
                    applicationCategory: "BusinessApplication",
                    applicationSubCategory: "Content Marketing Software",
                    browserRequirements: "Requires JavaScript. Requires HTML5.",
                    operatingSystem: "All",
                    featureList: pitch.highlights,
                    offers: {
                        "@type": "Offer",
                        price: "79",
                        priceCurrency: "USD",
                        availability: "https://schema.org/InStock",
                        url: `${defaultSEO.siteUrl}/pricing`
                    },
                    publisher: {
                        "@type": "Organization",
                        name: "FlipAEO",
                        url: defaultSEO.siteUrl
                    }
                }} />
                <StructuredData data={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: faqs.map((faq: { question: string; answer: string }) => ({
                        "@type": "Question", name: faq.question,
                        acceptedAnswer: { "@type": "Answer", text: faq.answer }
                    }))
                }} />
                <StructuredData data={{
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    itemListElement: [
                        { "@type": "ListItem", position: 1, name: "Home", item: defaultSEO.siteUrl },
                        { "@type": "ListItem", position: 2, name: "Features", item: `${defaultSEO.siteUrl}/features` },
                        { "@type": "ListItem", position: 3, name: featureName, item: `${defaultSEO.siteUrl}/features/${slug}` }
                    ]
                }} />

                {/* ═══ [01] HERO ═══ */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16 text-center pt-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-brand-200 text-brand-600 text-[11px] font-bold tracking-widest uppercase mb-8 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{heroBadge}</span>
                    </div>
                    <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-stone-900 leading-[1.1] mb-6 tracking-tight max-w-4xl mx-auto">
                        {heroTitle}
                    </h1>
                    <p className="font-sans text-lg md:text-xl text-stone-500 max-w-2xl mx-auto leading-snug mb-8">
                        {heroSubtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href={cta.buttonHref} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200">
                            {cta.buttonLabel}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a href="#pipeline" className="text-sm font-medium text-stone-500 hover:text-brand-600 transition-colors">
                            See how it works ↓
                        </a>
                    </div>
                </section>

                {/* ═══ [02] THE PITCH (Zero-Click Answer) ═══ */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="bg-white rounded-xl border border-brand-200 overflow-hidden shadow-xs">
                        <div className="bg-brand-50/50 px-6 py-4 border-b border-brand-100 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-brand-600 fill-brand-600" />
                            <h2 className="font-display text-sm text-brand-900 uppercase tracking-wider">{pitch.question}</h2>
                        </div>
                        <div className="p-6 md:p-8">
                            <p className="text-stone-700 text-sm md:text-base leading-relaxed mb-6 font-medium">{pitch.answer}</p>
                            <div className="border-t border-stone-100 pt-6">
                                <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Highlights</div>
                                <ul className="grid md:grid-cols-2 gap-3">
                                    {pitch.highlights.map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
                                            <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ [03] INPUT → OUTPUT (Two-Column) ═══ */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4 tracking-tight">{inputOutput.title}</h2>
                        <p className="text-stone-500 text-lg max-w-2xl mx-auto">{inputOutput.subtitle}</p>
                    </div>

                    <div className="grid md:grid-cols-[1fr_auto_1fr] gap-0 items-stretch">
                        {/* Input Card */}
                        <div className="bg-stone-100/70 border border-stone-200 rounded-2xl p-8">
                            <div className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-6">{inputOutput.input.label}</div>
                            <ul className="space-y-4">
                                {inputOutput.input.items.map((item: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-stone-700">
                                        <div className="w-5 h-5 rounded-md bg-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-[10px] font-bold text-stone-500">{i + 1}</span>
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Arrow */}
                        <div className="hidden md:flex items-center justify-center px-6">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-px h-8 bg-brand-200" />
                                <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center">
                                    <ArrowRight className="w-4 h-4 text-brand-600" />
                                </div>
                                <div className="w-px h-8 bg-brand-200" />
                            </div>
                        </div>
                        <div className="flex md:hidden items-center justify-center py-4">
                            <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center rotate-90">
                                <ArrowRight className="w-4 h-4 text-brand-600" />
                            </div>
                        </div>

                        {/* Output Card */}
                        <div className="bg-brand-50/50 border border-brand-200 rounded-2xl p-8">
                            <div className="text-[10px] font-bold tracking-widest text-brand-500 uppercase mb-6">{inputOutput.output.label}</div>
                            <ul className="space-y-4">
                                {inputOutput.output.items.map((item: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-stone-700">
                                        <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ═══ [04] THE PIPELINE (Vertical Timeline) ═══ */}
                <section id="pipeline" className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4 tracking-tight">{pipeline.title}</h2>
                        <p className="text-stone-500 text-lg max-w-2xl mx-auto">{pipeline.subtitle}</p>
                    </div>

                    <div className="relative max-w-3xl mx-auto">
                        {/* Vertical Line */}
                        <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-brand-200 via-brand-300 to-brand-100" />

                        <div className="space-y-0">
                            {pipeline.phases.map((phase: { phase: string; name: string; duration: string; description: string; techDetail: string }, i: number) => (
                                <div key={i} className="relative pl-16 md:pl-20 pb-10 last:pb-0">
                                    {/* Node */}
                                    <div className="absolute left-4 md:left-6 top-1 w-4 h-4 rounded-full bg-brand-500 border-[3px] border-white shadow-[0_0_0_2px_theme(colors.brand.200)] z-10" />

                                    {/* Phase Label + Duration */}
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">{phase.phase} — {phase.name}</span>
                                        <span className="text-[10px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{phase.duration}</span>
                                    </div>

                                    {/* Content */}
                                    <p className="text-sm text-stone-700 leading-relaxed mb-2">{phase.description}</p>
                                    <p className="text-xs text-stone-400 leading-relaxed italic">{phase.techDetail}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ [05] WHAT YOU GET (Deliverable Grid) ═══ */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4 tracking-tight">{deliverable.title}</h2>
                        <p className="text-stone-500 text-lg max-w-2xl mx-auto">{deliverable.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deliverable.items.map((item: { icon: string; label: string; detail: string }, i: number) => (
                            <div key={i} className="bg-white border border-stone-200 rounded-xl p-6 hover:border-brand-200 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-4">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                                <div className="text-[10px] font-bold tracking-widest text-brand-400 uppercase mb-2">{item.label}</div>
                                <p className="text-sm text-stone-600 leading-relaxed">{item.detail}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══ [06] USE CASES ═══ */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4 tracking-tight">{useCases.title}</h2>
                        <p className="text-stone-500 text-lg max-w-2xl mx-auto">{useCases.subtitle}</p>
                    </div>

                    <div className="space-y-4 max-w-3xl mx-auto">
                        {useCases.items.map((item: { persona: string; goal: string; result: string }, i: number) => (
                            <div key={i} className="bg-white border border-stone-200 rounded-xl p-6 hover:border-brand-200 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-bold text-brand-600">{String.fromCodePoint(0x1F464)}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[11px] font-bold text-brand-500 uppercase tracking-widest mb-1">{item.persona}</div>
                                        <p className="text-sm font-medium text-stone-800 mb-2">{item.goal}</p>
                                        <p className="text-sm text-stone-500 leading-relaxed">{item.result}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══ [07] VS. THE OLD WAY (Dark Comparison) ═══ */}
                <section className="w-full mb-16">
                    <div className="bg-stone-900 py-16 md:py-20">
                        <div className="max-w-5xl mx-auto px-6">
                            <div className="text-center mb-12">
                                <h2 className="font-serif text-3xl md:text-4xl text-white mb-4 tracking-tight">{comparison.title}</h2>
                                <p className="text-stone-400 text-lg max-w-2xl mx-auto">{comparison.subtitle}</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Old Way */}
                                <div className="bg-stone-800/50 border border-stone-700 rounded-2xl p-8">
                                    <div className="text-[10px] font-bold tracking-widest text-stone-500 uppercase mb-6">{comparison.oldWay.label}</div>
                                    <ul className="space-y-4">
                                        {comparison.oldWay.items.map((item: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-stone-400">
                                                <X className="w-4 h-4 text-red-400/60 shrink-0 mt-0.5" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* New Way */}
                                <div className="bg-brand-600/10 border border-brand-500/20 rounded-2xl p-8">
                                    <div className="text-[10px] font-bold tracking-widest text-brand-400 uppercase mb-6">{comparison.newWay.label}</div>
                                    <ul className="space-y-4">
                                        {comparison.newWay.items.map((item: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-stone-300">
                                                <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ [08] FAQ ═══ */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4 tracking-tight">{faqTitle}</h2>
                        <p className="text-stone-500 text-lg max-w-2xl mx-auto">{faqSubtitle}</p>
                    </div>

                    <div className="max-w-3xl mx-auto bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
                        {faqs.map((faq: { question: string; answer: string }, idx: number) => (
                            <div key={idx} className="p-6">
                                <h3 className="text-sm font-display text-stone-900 mb-2 flex items-center gap-2">
                                    <span className="text-brand-500">Q.</span>
                                    {faq.question}
                                </h3>
                                <p className="text-stone-500 text-sm leading-relaxed pl-6">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══ [09] CTA (Dark) ═══ */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="bg-stone-900 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-brand-500/10 blur-3xl rounded-full" />
                        <div className="relative z-10">
                            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4 tracking-tight">{cta.headline}</h2>
                            <p className="text-stone-400 text-lg max-w-2xl mx-auto mb-8">{cta.subheadline}</p>
                            <Link href={cta.buttonHref} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-colors shadow-lg shadow-brand-600/20 hover:shadow-xl hover:-translate-y-0.5 duration-200">
                                {cta.buttonLabel}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ═══ [10] CONNECTED FEATURES ═══ */}
                {connectedCards.length > 0 && (
                    <section className="w-full max-w-5xl mx-auto px-6 mb-24">
                        <div className="text-center mb-12">
                            <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4 tracking-tight">{connectedFeatures.title}</h2>
                            <p className="text-stone-500 text-lg max-w-2xl mx-auto">{connectedFeatures.subtitle}</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            {connectedCards.map((card: { slug: string; relationship: string; name: string; badge: string; subtitle: string }) => (
                                <Link
                                    key={card.slug}
                                    href={`/features/${card.slug}`}
                                    className="group block bg-white rounded-xl border border-stone-200 p-6 hover:border-brand-200 hover:bg-stone-50 transition-colors"
                                >
                                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">{card.relationship}</div>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-1">{card.badge}</div>
                                            <div className="text-sm font-semibold text-stone-900 group-hover:text-brand-700 transition-colors mb-2">{card.name}</div>
                                            <div className="text-xs text-stone-500 leading-relaxed">{card.subtitle}</div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-brand-600 transition-colors shrink-0 mt-1" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

            </main>

            <Footer />
        </div>
    );
}
