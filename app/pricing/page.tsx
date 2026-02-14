import { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { MultipleStructuredData } from '@/components/seo/StructuredData'
import Link from 'next/link'
import Button from '@/components/landing/Button'
import { Check, ShieldCheck } from 'lucide-react'
import { FAQItem } from './FAQItem'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata: Metadata = genMeta({
  title: 'Pricing',
  description: 'Simple, transparent pricing for FlipAEO. One plan with everything you need: 30 AI-generated articles/month, automated content strategy, CMS integration, and priority support. 14-day money-back guarantee.',
  keywords: ['FlipAEO pricing', 'AI content pricing', 'GEO pricing', 'content engine cost', 'article generation pricing'],
  canonical: '/pricing',
})

const planFeatures = [
  "30 AI-generated articles per month",
  "Automated content strategy",
  "CMS integration (WordPress, Webflow, Shopify)",
  "On-brand AI images",
  "Smart internal linking",
  "Answer-first content structure",
  "Real-time research with citations",
  "Priority support"
]

const faqs = [
  {
    question: "WHAT'S INCLUDED IN THE $79/MONTH PLAN?",
    answer: "You get 30 AI-generated articles per month, automated content strategy, CMS integration, on-brand AI images, smart internal linking, and priority support. Everything you need to dominate AI search."
  },
  {
    question: "IS THIS A SUBSCRIPTION?",
    answer: "Yes, FlipAEO is a monthly subscription. You can cancel anytime from your dashboard, and you'll retain access until the end of your billing period."
  },
  {
    question: "WHAT'S YOUR REFUND POLICY?",
    answer: "We offer a 14-day money-back guarantee. If you're not satisfied with the quality of your articles, we'll refund you in full."
  },
  {
    question: "WILL GOOGLE PENALIZE AI CONTENT?",
    answer: "No. Google rewards helpful, authoritative content regardless of how it's produced. FlipAEO focuses on real research, verified citations, and \"Information Gain\"—exactly what Google values."
  },
  {
    question: "WHAT CMS PLATFORMS DO YOU SUPPORT?",
    answer: "We support WordPress, Webflow, and Shopify with 1-click publishing. We also support custom webhooks for other platforms."
  }
]

const comparisonData = {
  traditional: [
    { aspect: "Cost", traditional: "$500–$2000+ per article (agencies)", flipaeo: "$79/month for 30 articles" },
    { aspect: "Research Quality", traditional: "Varies by writer/agency", flipaeo: "Multi-stage AI research with real citations" },
    { aspect: "Turnaround Time", traditional: "Days to weeks per article", flipaeo: "Minutes to hours" },
    { aspect: "Strategy", traditional: "Separate strategist required", flipaeo: "Built-in 30-day content planning" },
    { aspect: "Brand Voice", traditional: "Requires detailed briefs each time", flipaeo: "Learns and maintains your voice" },
    { aspect: "Publishing", traditional: "Manual formatting and upload", flipaeo: "1-click CMS publishing" },
  ],
  generic: [
    { aspect: "Purpose", generic: "General-purpose chatbot", flipaeo: "Purpose-built for GEO & authority" },
    { aspect: "Research", generic: "Relies on training data (may be outdated)", flipaeo: "Real-time research with verified sources" },
    { aspect: "Strategy", generic: "None—you decide what to write", flipaeo: "Competitor analysis + gap identification" },
    { aspect: "Internal Linking", generic: "Manual", flipaeo: "Semantic auto-linking" },
    { aspect: "Citations", generic: "Often hallucinated or missing", flipaeo: "Verified, high-authority sources" },
    { aspect: "Publishing", generic: "Copy-paste required", flipaeo: "Direct CMS integration" },
  ]
}

export default function PricingPage() {
  return (
    <div className="min-h-screen w-full flex flex-col overflow-x-hidden font-sans selection:bg-brand-100 selection:text-brand-900">
      <Navbar />
      <main className="flex-grow flex flex-col items-center w-full pt-6 md:pt-12">

        {/* Pricing Overview Hero */}
        <section className="w-full py-12 md:py-20 px-4">
          <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 pt-1.5 pb-2 rounded-full border border-brand-400 bg-white text-stone-900 text-[11px] font-normal mb-6 shadow-sm">
              <span className="font-bold tracking-widest uppercase">Simple Pricing</span>
            </div>
            <h1 className="font-serif text-stone-900 text-4xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight mb-6">
              One Plan. Zero Complexity.
            </h1>
            <p className="font-sans text-stone-500 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
              Everything you need to win AI search. No hidden fees. No complicated tiers.
            </p>

            <div className="flex flex-wrap justify-center gap-3 md:gap-6">
              <div className="flex items-center gap-2 text-stone-600 text-sm font-medium">
                <Check size={16} className="text-brand-500" />
                <span>14-day guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 text-sm font-medium">
                <Check size={16} className="text-brand-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 text-sm font-medium">
                <Check size={16} className="text-brand-500" />
                <span>No hidden fees</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Card Section */}
        <section className="max-w-5xl mx-auto px-6 pb-20 w-full relative">

          {/* Card Wrapper matching PricingSection.tsx design */}
          <div className="w-full bg-brand-200 rounded-[20px] p-2 shadow-[inset_0_0_0_1px_#c4b5fd]">

            <div className="relative w-full bg-[#fffaf5] border border-brand-100/50 rounded-[17px] overflow-hidden flex flex-col md:flex-row">



              {/* Left: Price Column */}
              <div className="w-full md:w-[40%] bg-gradient-to-b from-brand-100/80 to-white border-b md:border-b-0 md:border-r border-brand-100 p-8 md:p-12 flex flex-col items-center text-center relative">

                {/* Handwritten Note Effect */}
                <div className="absolute top-8 right-4 md:-right-6 md:top-20 z-10 pointer-events-none transform rotate-12 md:rotate-0 hidden sm:block">
                  <div className="relative">
                    <span className="font-hand text-xl text-stone-400 whitespace-nowrap">Limited Time</span>
                    <svg className="absolute -bottom-6 -left-4 w-12 h-12 text-stone-300 transform rotate-12 hidden md:block" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                      <path d="M80,10 Q40,60 10,80" strokeWidth="2" markerEnd="url(#arrow-price)" />
                      <defs>
                        <marker id="arrow-price" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                          <path d="M0,0 L10,5 L0,10" fill="none" stroke="currentColor" strokeWidth="2" />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                </div>

                <div className="mb-6 mt-4 relative z-10">
                  <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wider mb-4 border border-brand-200">
                    All In One
                  </span>
                  <h2 className="font-serif text-2xl text-stone-900">
                    For ambitious entrepreneurs
                  </h2>
                </div>

                <div className="flex items-baseline justify-center gap-3 mb-2 relative z-10">
                  <span className="text-xl text-stone-400 line-through decoration-brand-300/50 decoration-2">$149</span>
                  <div className="flex items-start">
                    <span className="text-2xl font-serif text-stone-900 mt-2">$</span>
                    <span className="text-6xl md:text-7xl font-serif text-stone-900 tracking-tighter">79</span>
                  </div>
                </div>
                <span className="font-sans font-bold text-stone-400 text-xs uppercase tracking-wider mb-10">Per Month</span>

                <div className="w-full relative z-10">
                  <Link href="/login">
                    <Button variant="primary" className="max-w-2xl px-2 py-4 text-md justify-center">
                      Grow My Brand
                    </Button>
                  </Link>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-400 font-medium">
                    <ShieldCheck size={14} className="text-green-500" />
                    14-day money-back guarantee
                  </div>
                </div>
              </div>

              {/* Right: Features Column */}
              <div className="flex-1 p-8 md:p-12 bg-white flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-8 border-b border-stone-100 pb-4">
                  <span className="bg-stone-900 text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-sm">Included</span>
                  <h3 className="font-serif text-xl text-stone-900">Everything you need</h3>
                </div>

                <ul className="space-y-4">
                  {planFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 group">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0 text-brand-600 group-hover:bg-brand-100 transition-colors">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="font-sans text-stone-600 group-hover:text-stone-900 transition-colors leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Decorative Blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[90%] bg-brand-100/30 blur-3xl -z-10 rounded-full"></div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-16 w-full">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-5xl text-stone-900 mb-6 tracking-tight">
              How We Stack Up
            </h2>
            <p className="font-sans text-stone-500 text-lg max-w-2xl mx-auto">
              See why FlipAEO beats traditional agencies and generic AI tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Table 1: Container Layer Pattern */}
            <div className="bg-brand-100 rounded-[20px] p-2 shadow-[inset_0_0_0_1px_#c4b5fd]">
              <div className="bg-white rounded-[17px] overflow-hidden border border-white h-full">
                <div className="bg-stone-50/50 border-b border-stone-100 p-6">
                  <h3 className="font-serif text-xl text-stone-900">FlipAEO vs Traditional Agencies</h3>
                </div>
                <div className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-4 pl-6 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 w-1/3">Aspect</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 w-1/3">Them</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-brand-600 border-b border-stone-100 bg-brand-50/30 w-1/3">FlipAEO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.traditional.map((row, i) => (
                        <tr key={i} className="group hover:bg-stone-50/30 transition-colors">
                          <td className="p-4 pl-6 text-sm font-medium text-stone-900 border-b border-stone-50 group-last:border-0">{row.aspect}</td>
                          <td className="p-4 text-xs md:text-sm text-stone-500 border-b border-stone-50 group-last:border-0 leading-tight">{row.traditional}</td>
                          <td className="p-4 text-xs md:text-sm font-medium text-brand-900 bg-brand-50/10 border-b border-stone-50 group-last:border-0 border-l border-dashed border-stone-100 leading-tight">
                            {row.flipaeo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Table 2: Container Layer Pattern */}
            <div className="bg-brand-100 rounded-[20px] p-2 shadow-[inset_0_0_0_1px_#c4b5fd]">
              <div className="bg-white rounded-[17px] overflow-hidden border border-white h-full">
                <div className="bg-stone-50/50 border-b border-stone-100 p-6">
                  <h3 className="font-serif text-xl text-stone-900">FlipAEO vs Generic AI Tools</h3>
                </div>
                <div className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-4 pl-6 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 w-1/3">Aspect</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 w-1/3">Generic</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-brand-600 border-b border-stone-100 bg-brand-50/30 w-1/3">FlipAEO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.generic.map((row, i) => (
                        <tr key={i} className="group hover:bg-stone-50/30 transition-colors">
                          <td className="p-4 pl-6 text-sm font-medium text-stone-900 border-b border-stone-50 group-last:border-0">{row.aspect}</td>
                          <td className="p-4 text-xs md:text-sm text-stone-500 border-b border-stone-50 group-last:border-0 leading-tight">{row.generic}</td>
                          <td className="p-4 text-xs md:text-sm font-medium text-brand-900 bg-brand-50/10 border-b border-stone-50 group-last:border-0 border-l border-dashed border-stone-100 leading-tight">
                            {row.flipaeo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-3xl mx-auto px-6 py-16 w-full">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-5xl text-stone-900 mb-6 tracking-tight">
              Questions? Answered.
            </h2>
            <p className="font-sans text-stone-500 text-lg max-w-2xl mx-auto">
              Everything you need to know about FlipAEO.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>

        {/* Guarantee & Policies */}
        <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
          <div className="bg-brand-50 border border-brand-200 rounded-[20px] p-8 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-200 flex items-center justify-center text-brand-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="font-serif text-stone-900 text-lg leading-tight mb-1">Risk-Free Guarantee</p>
                <p className="font-sans text-sm text-stone-500 uppercase tracking-wide">14-day money-back. Cancel anytime.</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/refund-policy" className="font-bold uppercase text-xs text-stone-400 hover:text-stone-900 border-b border-transparent hover:border-stone-900 transition-all">Refund Policy</Link>
              <Link href="/terms" className="font-bold uppercase text-xs text-stone-400 hover:text-stone-900 border-b border-transparent hover:border-stone-900 transition-all">Terms</Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />

      {/* Structured Data - Preserved EXACTLY */}
      <MultipleStructuredData
        schemas={[
          {
            id: 'breadcrumb',
            data: {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://flipaeo.com/" },
                { "@type": "ListItem", "position": 2, "name": "Pricing", "item": "https://flipaeo.com/pricing" }
              ]
            }
          },
          {
            id: 'product',
            data: {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "FlipAEO All-in-One Plan",
              "description": "Strategic Content Engine for Generative Engine Optimization. 30 articles/month with automated strategy, CMS integration, and AI-powered research.",
              "offers": {
                "@type": "Offer",
                "price": 79,
                "priceCurrency": "USD"
              }
            }
          },
          {
            id: 'faq',
            data: {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            }
          }
        ]}
      />
    </div>
  )
}