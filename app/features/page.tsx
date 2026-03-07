import { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { GridBackground } from '@/components/landing/GridBackground';
import { ArrowRight, Sparkles, PenTool, Eye, RefreshCw, Shield, Zap, Target, Calendar } from 'lucide-react';
import { features } from './data';
import { defaultSEO } from '@/config/seo';

export const metadata: Metadata = {
    title: 'AI SEO Features | FlipAEO',
    description: 'Explore FlipAEO\'s suite of AI features designed for modern search: AI SEO Writer, Visibility Tracking, Strategic Auto-Blogging, and more.',
    alternates: {
        canonical: `${defaultSEO.siteUrl}/features`
    }
};

const featureOrder = [
    'ai-seo-writer',
    'ai-search-visibility',
    'auto-blogging-software',
    'undetectable-ai-content',
    'one-click-article-writer',
    'topic-cluster-generator',
    'ai-content-calendar'
];

const IconMap: Record<string, React.FC<any>> = {
    'PenTool': PenTool,
    'Eye': Eye,
    'RefreshCw': RefreshCw,
    'Shield': Shield,
    'Zap': Zap,
    'Target': Target,
    'Calendar': Calendar
};

export default function FeaturesPage() {
    const orderedFeatures = featureOrder
        .filter(slug => features[slug])
        .map(slug => features[slug]);

    return (
        <div className="relative min-h-screen w-full flex flex-col font-sans bg-stone-50/20">
            <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <GridBackground />
            </div>

            <Navbar />

            <main className="flex-grow flex flex-col items-center w-full relative pt-24 pb-24 z-10">

                {/* Hero */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16 text-center pt-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-brand-200 text-brand-600 text-[11px] font-bold tracking-widest uppercase mb-8 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>FLIPAEO FEATURES</span>
                    </div>

                    <h1 className="font-serif text-4xl md:text-6xl text-stone-900 leading-[1.1] mb-6 tracking-tight max-w-4xl mx-auto">
                        Tools Built for the <br />
                        <span className="italic font-light text-brand-600">Answer Engine Era</span>
                    </h1>

                    <p className="font-sans text-lg md:text-xl text-stone-500 max-w-2xl mx-auto leading-snug mb-12">
                        Don't just write words. Engineer context. Our feature suite is designed from the ground up to guarantee your brand is crawled, understood, and cited by AI.
                    </p>
                </section>

                {/* Features Grid */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-16">
                    <div className="grid md:grid-cols-3 gap-6">
                        {orderedFeatures.map((feat, i) => {
                            const IconComponent = IconMap[feat.featureIcon] || Sparkles;
                            return (
                                <Link
                                    key={feat.slug}
                                    href={`/features/${feat.slug}`}
                                    className={`group bg-white border border-stone-200 rounded-2xl p-6 hover:border-brand-200 hover:shadow-xs transition-all duration-200 flex flex-col ${i < 3 ? 'md:col-span-1' : ''}`}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                                            <IconComponent className="w-5 h-5 text-brand-600" />
                                        </div>
                                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{feat.heroBadge}</div>
                                    </div>

                                    <h2 className="font-serif text-lg text-stone-900 mb-2 group-hover:text-brand-700 transition-colors leading-tight">
                                        {feat.featureName}
                                    </h2>

                                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600 uppercase tracking-wider group-hover:gap-3 transition-all mt-auto pt-4">
                                        Explore Feature
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* CTA */}
                <section className="w-full max-w-5xl mx-auto px-6 mb-24">
                    <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-200 rounded-2xl p-8 md:p-12 text-center">
                        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4 tracking-tight">
                            Experience the Complete Suite
                        </h2>
                        <p className="text-stone-500 text-lg max-w-2xl mx-auto mb-8">
                            Sign up today and get instant access to the AI SEO Writer, Content Calendar, and Visibility Tracking Dashboard.
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200"
                        >
                            Start Your Free Trial
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
