"use client";

import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { MultipleStructuredData } from '@/components/seo/StructuredData'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'

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
    question: "WHAT'S INCLUDED IN THE $59/MONTH PLAN?",
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
    { aspect: "Cost", traditional: "$500–$2000+ per article (agencies)", flipaeo: "$59/month for 30 articles" },
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

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`
        w-full bg-white border-2 border-black shadow-neo transition-all duration-200 overflow-hidden
        ${isOpen ? 'translate-x-[2px] translate-y-[2px] shadow-none' : 'hover:-translate-y-1 hover:shadow-neo-hover'}
      `}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between group text-left"
      >
        <span className="font-display font-black text-lg md:text-xl uppercase pr-4">{question}</span>
        <div
          className={`
            w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0 transition-all duration-200
            ${isOpen ? 'bg-brand-orange rotate-180' : 'bg-brand-yellow group-hover:bg-brand-orange'}
          `}
        >
          <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-black stroke-[3px]" />
        </div>
      </button>

      <div
        className={`
          transition-[max-height,opacity] duration-300 ease-in-out
          ${isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-6 pb-6 pt-0">
          <p className="font-sans text-gray-600 text-lg leading-relaxed border-t-2 border-black/5 pt-4">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function PricingPage() {
  return (
    <div className="landing-page min-h-screen w-full flex flex-col overflow-x-hidden font-sans">
      <Navbar />
      <main className="flex-grow flex flex-col items-center w-full pt-20 md:pt-24">
        {/* Pricing Overview Hero */}
        <section className="w-full py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block bg-black text-white border-2 border-black shadow-neo-sm px-4 py-1.5 mb-6 transform -rotate-2 hover:rotate-0 transition-transform">
              <span className="font-display font-bold text-xs uppercase tracking-widest">Simple Pricing</span>
            </div>
            <h1 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl sm:text-5xl md:text-6xl leading-tight uppercase mb-4">
              One Plan. Zero Complexity.
            </h1>
            <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-8">
              Everything you need to win AI search. No hidden fees. No complicated tiers.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-1.5 bg-[#D6F5F2] border-2 border-black text-sm font-bold uppercase tracking-wide">14-day guarantee</span>
              <span className="px-4 py-1.5 bg-[#FAFA9D] border-2 border-black text-sm font-bold uppercase tracking-wide">Cancel anytime</span>
              <span className="px-4 py-1.5 bg-white border-2 border-black text-sm font-bold uppercase tracking-wide">No hidden fees</span>
            </div>
          </div>
        </section>

        {/* Pricing Card */}
        <section className="max-w-5xl mx-auto px-4 py-12 w-full">
          <div className="bg-white border-2 md:border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative">
            {/* Launch Badge */}
            <div className="absolute -top-5 -right-2 md:-right-4 z-20">
              <div className="bg-[#FF5F57] text-white border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-3 flex flex-col items-center">
                <span className="font-display font-black text-lg uppercase leading-none">Launch Offer</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Limited Time</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2">
              {/* Left: Price */}
              <div className="bg-[#FAFA9D] p-8 md:p-12 border-b md:border-b-0 md:border-r-2 md:border-r-4 border-black relative overflow-hidden">
                {/* Texture Overlay */}
                <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none"></div>

                <div className="relative z-10">
                  <h2 className="font-display font-black text-4xl md:text-5xl uppercase mb-2">All-in-One</h2>
                  <p className="font-sans font-bold text-black/60 mb-10 text-lg">For ambitious entrepreneurs</p>

                  <div className="mb-10 p-6 bg-white border-2 border-black shadow-neo-sm rounded-xl">
                    <div className="flex flex-col items-center text-center">
                      <span className="font-sans font-bold text-gray-400 line-through text-lg decoration-2 decoration-red-500 mb-1">$79 original price</span>
                      <div className="flex items-start gap-1">
                        <span className="font-sans font-bold text-2xl mt-2">$</span>
                        <span className="font-display font-black text-7xl md:text-8xl tracking-tighter leading-none">59</span>
                      </div>
                      <span className="font-sans font-bold text-black/40 text-sm uppercase tracking-wider mt-2">Per Month</span>
                    </div>
                  </div>

                  <Link href="/subscribe">
                    <Button className="w-full h-16 text-xl font-bold bg-brand-yellow text-black border-2 border-black hover:bg-brand-orange rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase">
                      Start My Content Strategy
                    </Button>
                  </Link>
                  <p className="text-center font-sans text-xs font-bold mt-4 opacity-50 uppercase tracking-wide">14-day money-back guarantee</p>
                </div>
              </div>

              {/* Right: Features */}
              <div className="p-8 md:p-12 bg-white relative">
                {/* Decorative Window Controls */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-black bg-white"></div>
                  <div className="w-3 h-3 rounded-full border-2 border-black bg-white"></div>
                </div>

                <h3 className="font-display font-black text-2xl uppercase mb-10 flex items-center gap-3">
                  <span className="bg-black text-white px-2 py-0.5 text-lg">Included</span>
                  <span>Everything</span>
                </h3>
                <ul className="space-y-5">
                  {planFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-4 group">
                      <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:bg-[#D6F5F2] group-hover:-translate-y-1 group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                        <Check className="w-5 h-5 text-black stroke-[3px]" />
                      </div>
                      <span className="font-sans font-medium text-gray-700 pt-1">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How We Compare */}
        <section className="max-w-5xl mx-auto px-4 py-16 w-full">
          <div className="text-center mb-12">
            <div className="inline-block bg-[#D6F5F2] border-2 border-black shadow-neo-sm px-4 py-1 mb-6 transform rotate-2 hover:rotate-0 transition-transform">
              <span className="font-display font-black text-xs uppercase tracking-widest">Comparison</span>
            </div>
            <h2 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-3xl md:text-5xl leading-tight uppercase mb-4">
              How We Stack Up
            </h2>
            <p className="font-sans text-gray-600 text-lg max-w-2xl mx-auto">
              See why FlipAEO beats traditional agencies and generic AI tools.
            </p>
          </div>

          {/* Traditional Content vs FlipAEO */}
          <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 overflow-hidden">
            <div className="bg-[#FAFA9D] border-b-2 border-black p-4">
              <h3 className="font-display font-black text-lg uppercase">Traditional Content Creation vs FlipAEO</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="text-left p-4 font-display font-bold uppercase text-sm">Aspect</th>
                    <th className="text-left p-4 font-display font-bold uppercase text-sm">Traditional Approach</th>
                    <th className="text-left p-4 font-display font-bold uppercase text-sm bg-[#D6F5F2]">FlipAEO</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.traditional.map((row, i) => (
                    <tr key={i} className="border-b border-black/10 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-800">{row.aspect}</td>
                      <td className="p-4 text-gray-600">{row.traditional}</td>
                      <td className="p-4 font-semibold text-gray-800 bg-[#D6F5F2]/30">{row.flipaeo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generic AI vs FlipAEO */}
          <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-[#FAFA9D] border-b-2 border-black p-4">
              <h3 className="font-display font-black text-lg uppercase">Generic AI Tools vs FlipAEO</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="text-left p-4 font-display font-bold uppercase text-sm">Aspect</th>
                    <th className="text-left p-4 font-display font-bold uppercase text-sm">Generic AI (ChatGPT, etc.)</th>
                    <th className="text-left p-4 font-display font-bold uppercase text-sm bg-[#D6F5F2]">FlipAEO</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.generic.map((row, i) => (
                    <tr key={i} className="border-b border-black/10 hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-800">{row.aspect}</td>
                      <td className="p-4 text-gray-600">{row.generic}</td>
                      <td className="p-4 font-semibold text-gray-800 bg-[#D6F5F2]/30">{row.flipaeo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-5xl mx-auto px-4 py-16 w-full">
          <div className="text-center mb-12">
            <div className="inline-block bg-[#FAFA9D] border-2 border-black shadow-neo-sm px-4 py-1 mb-6 transform rotate-2 hover:rotate-0 transition-transform">
              <span className="font-display font-black text-xs uppercase tracking-widest">FAQ</span>
            </div>
            <h2 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-3xl md:text-5xl leading-tight uppercase mb-4">
              Questions? Answered.
            </h2>
            <p className="font-sans text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need to know about FlipAEO.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>

        {/* Guarantee & Policies */}
        <section className="max-w-5xl mx-auto px-4 pb-12 w-full">
          <div className="bg-[#FAFA9D] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-wrap items-center justify-between gap-4">
            <p className="font-display font-bold text-lg uppercase">14-day money-back guarantee. No hidden fees. Cancel anytime.</p>
            <div className="flex items-center gap-4">
              <Link href="/refund-policy" className="font-bold uppercase text-sm border-b-2 border-black hover:border-brand-orange transition-colors">Refund Policy</Link>
              <Link href="/terms" className="font-bold uppercase text-sm border-b-2 border-black hover:border-brand-orange transition-colors">Terms</Link>
            </div>
          </div>
        </section>


      </main>
      <Footer />

      {/* Structured Data */}
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
                "price": 59,
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