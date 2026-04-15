import { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { MultipleStructuredData } from '@/components/seo/StructuredData'
import Link from 'next/link'
import Button from '@/components/landing/Button'
import { Check, ShieldCheck } from 'lucide-react'
import { FAQItem } from './FAQItem'
import {
  generateBreadcrumbJsonLd,
  generateFAQJsonLd,
  generateMetadata as genMeta,
  generateProductJsonLd,
} from '@/lib/seo'
import { seoUtils } from '@/config/seo'

export const metadata: Metadata = genMeta({
  title: 'Pricing',
  description: 'Autonomous Pinterest marketing for Shopify and Etsy brands. Turn product photos into lifestyle pins, approve in one click, and drive traffic to your store.',
  keywords: ['EcomPin pricing', 'Pinterest marketing pricing', 'automated Pinterest pins', 'Pinterest traffic tool'],
  canonical: '/pricing',
})

const planFeatures = [
  "Unlimited AI Lifestyle Pin Generation",
  "AI-Supervised Drip Publishing to Pinterest",
  "Self-Improving Prompt Engine (Closed-Loop AI)",
  "Account Warmup & Shadow Ban Prevention",
  "Pinterest SEO Title & Description Generation",
  "10 Premium Brand Font Options",
  "Cloudflare R2 Image Storage",
  "Weekly Performance Report Emails",
  "24x7 Priority Support"
]

const faqs = [
  {
    question: "WHAT'S INCLUDED IN THE $79/MONTH?",
    answer: "EcomPin generates unlimited lifestyle pins from your product catalog, publishes them to Pinterest on autopilot, and self-optimizes over time. You also get account warmup protection, weekly reports, and priority support."
  },
  {
    question: "IS THIS A SUBSCRIPTION?",
    answer: "Yes, EcomPin is a monthly subscription. You can cancel anytime from your dashboard, and you'll retain access until the end of your billing period."
  },
  {
    question: "WHAT'S YOUR REFUND POLICY?",
    answer: "We offer a 14-day money-back guarantee. If you're not satisfied with the quality of your generated pins, we'll refund you in full."
  },
  {
    question: "WILL PINTEREST FLAG MY ACCOUNT?",
    answer: "No. EcomPin includes a built-in 3-phase warmup protocol that mimics organic human behavior. Our shadow ban detection automatically throttles publishing if any risk is detected."
  },
  {
    question: "WHAT STORES ARE SUPPORTED?",
    answer: "We support Shopify, Etsy, and manual product uploads. Connect your store and EcomPin will automatically sync your catalog and start generating pins."
  }
]

const comparisonData = {
  traditional: [
    { aspect: "Cost", traditional: "$500–2000/mo (VA or agency)", ecompin: "$79/month, AI-powered" },
    { aspect: "Pin Quality", traditional: "Generic Canva templates", ecompin: "AI lifestyle photography with brand fonts" },
    { aspect: "Publishing", traditional: "Manual daily pinning", ecompin: "AI-supervised drip publishing 24/7" },
    { aspect: "Strategy", traditional: "Guesswork or paid audits", ecompin: "Self-optimizing based on click data" },
    { aspect: "Account Safety", traditional: "Risk of shadow ban from over-pinning", ecompin: "3-phase warmup + auto-throttle" },
    { aspect: "Scaling", traditional: "Hire more VAs", ecompin: "Add products, engine scales automatically" },
  ],
  generic: [
    { aspect: "Purpose", generic: "Generic social media scheduler", ecompin: "Purpose-built for Pinterest e-commerce" },
    { aspect: "Images", generic: "Upload your own images", ecompin: "AI generates lifestyle scenes from product photos" },
    { aspect: "Copy", generic: "Write your own captions", ecompin: "Pinterest SEO optimized automatically" },
    { aspect: "Optimization", generic: "A/B test manually", ecompin: "Closed-loop AI learns what converts" },
    { aspect: "Account Health", generic: "No protection", ecompin: "Shadow ban detection + warmup protocol" },
    { aspect: "Setup", generic: "Hours of configuration", ecompin: "Connect store → engine runs" },
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
              Stop Pinning Manually. <br className="hidden md:block " /> <span className="italic text-stone-500">Deploy Your AI Art Director.</span>
            </h1>
            <p className="font-sans text-stone-500 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-10">
              Get the output of a full-time Pinterest VA for the price of a dinner. EcomPin generates stunning lifestyle pins, publishes them on autopilot, and self-optimizes based on real click data.
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
              <div className="w-full md:w-[40%] bg-gradient-to-b from-brand-100/80 to-white border-b md:border-b-0 md:border-r border-brand-100 p-4 sm:p-8 md:p-12 flex flex-col items-center text-center relative">

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
                    The EcomPin Engine Plan
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
                      Deploy My Pin Engine
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
                      <span className="font-sans text-stone-600 group-hover:text-stone-900 transition-colors leading-snug">{feature.replace("✅ ", "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[90%] bg-brand-100/30 blur-3xl -z-10 rounded-full"></div>
        </section>

        {/* The Closer Section - Brand Aligned Double-Layer Pattern */}
        <section className="max-w-4xl mx-auto px-6 pb-20 w-full">

          <div className="w-full bg-brand-100/100 rounded-[20px] p-2 shadow-[inset_0_0_0_1px_#c4b5fd]">
            <div className="bg-white rounded-[17px] overflow-hidden border border-white p-4 sm:p-8 md:p-12 text-center">

              <h3 className="font-serif text-3xl md:text-4xl mb-4 text-stone-900">The Math is Simple</h3>
              <p className="font-sans text-stone-500 mb-10 max-w-lg mx-auto leading-relaxed">
                Why EcomPin is the obvious choice for e-commerce brands.
              </p>

              <div className="space-y-4 font-sans text-left">

                {/* Option A: Freelancers */}
                <div className="p-5 rounded-xl bg-stone-50 border border-stone-100 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-stone-200 transition-colors">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 font-bold shadow-sm flex-shrink-0">A</div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-0.5">Pinterest VA</span>
                      <span className="text-stone-700 font-medium">Hire someone to pin daily</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <span className="text-xl font-bold text-stone-900">$1,500<span className="text-sm font-normal text-stone-400">/mo</span></span>
                    <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-100 uppercase tracking-wide">Expensive</span>
                  </div>
                </div>

                {/* Option B: DIY */}
                <div className="p-5 rounded-xl bg-stone-50 border border-stone-100 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-stone-200 transition-colors">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 font-bold shadow-sm flex-shrink-0">B</div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-0.5">Do It Yourself</span>
                      <span className="text-stone-700 font-medium">Manually creating pins in Canva</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <span className="text-xl font-bold text-stone-900">20+ Hours<span className="text-sm font-normal text-stone-400">/mo</span></span>
                    <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-100 uppercase tracking-wide">Slow</span>
                  </div>
                </div>

                {/* Option C: EcomPin */}
                <div className="relative p-6 rounded-xl bg-brand-50 border border-brand-200 flex flex-col md:flex-row items-center justify-between gap-4 mt-6 overflow-hidden">

                  <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
                    <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold flex-shrink-0">C</div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        EcomPin Engine <Check className="w-3 h-3" />
                      </span>
                      <span className="text-stone-900 font-bold text-lg">AI Pins + Auto-Publish + Self-Optimize</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end relative z-10">
                    <span className="text-3xl font-serif text-brand-600">$79<span className="text-lg font-sans text-stone-500 font-normal">/mo</span></span>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <p className="text-sm text-stone-400 italic">
                    "Even if EcomPin drives just 10 clicks/day to your store, that's 300 potential customers/month you weren't reaching before."
                  </p>
                </div>

              </div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-16 w-full">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-5xl text-stone-900 mb-6 tracking-tight">
              How We Stack Up
            </h2>
            <p className="font-sans text-stone-500 text-lg max-w-2xl mx-auto">
              See why EcomPin beats traditional agencies and generic AI tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Table 1: Container Layer Pattern */}
            <div className="bg-brand-100 rounded-[20px] p-2 shadow-[inset_0_0_0_1px_#c4b5fd]">
              <div className="bg-white rounded-[17px] overflow-hidden border border-white h-full">
                <div className="bg-stone-50/50 border-b border-stone-100 p-6">
                  <h3 className="font-serif text-xl text-stone-900">Why hire a VA when an AI engine never sleeps?</h3>
                </div>
                <div className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-4 pl-6 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 w-1/3">Aspect</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 w-1/3">Them</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-brand-600 border-b border-stone-100 bg-brand-50/30 w-1/3">EcomPin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.traditional.map((row, i) => (
                        <tr key={i} className="group hover:bg-stone-50/30 transition-colors">
                          <td className="p-4 pl-6 text-sm font-medium text-stone-900 border-b border-stone-50 group-last:border-0">{row.aspect}</td>
                          <td className="p-4 text-xs md:text-sm text-stone-500 border-b border-stone-50 group-last:border-0 leading-tight">{row.traditional}</td>
                          <td className="p-4 text-xs md:text-sm font-medium text-brand-900 bg-brand-50/10 border-b border-stone-50 group-last:border-0 border-l border-dashed border-stone-100 leading-tight">
                            {row.ecompin}
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
                  <h3 className="font-serif text-xl text-stone-900">Why generic tools fail at Pinterest (and we don't).</h3>
                </div>
                <div className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-4 pl-6 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 w-1/3">Aspect</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 w-1/3">Generic</th>
                        <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-brand-600 border-b border-stone-100 bg-brand-50/30 w-1/3">EcomPin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.generic.map((row, i) => (
                        <tr key={i} className="group hover:bg-stone-50/30 transition-colors">
                          <td className="p-4 pl-6 text-sm font-medium text-stone-900 border-b border-stone-50 group-last:border-0">{row.aspect}</td>
                          <td className="p-4 text-xs md:text-sm text-stone-500 border-b border-stone-50 group-last:border-0 leading-tight">{row.generic}</td>
                          <td className="p-4 text-xs md:text-sm font-medium text-brand-900 bg-brand-50/10 border-b border-stone-50 group-last:border-0 border-l border-dashed border-stone-100 leading-tight">
                            {row.ecompin}
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
              Everything you need to know about EcomPin.
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

      {/* Structured Data */}
      <MultipleStructuredData
        schemas={[
          {
            id: 'breadcrumb',
            data: JSON.parse(
              generateBreadcrumbJsonLd([
                { name: 'Home', url: seoUtils.generateCanonicalUrl('/') },
                { name: 'Pricing', url: seoUtils.generateCanonicalUrl('/pricing') },
              ])
            ),
          },
          {
            id: 'product',
            data: JSON.parse(
              generateProductJsonLd({
                name: 'EcomPin Engine Plan',
                description: 'Autonomous Pinterest marketing engine with lifestyle pin generation, auto-publishing, prompt optimization, and account warmup protection.',
                price: 79,
                currency: 'USD',
                features: planFeatures,
                url: '/pricing',
              })
            ),
          },
          {
            id: 'faq',
            data: JSON.parse(generateFAQJsonLd(faqs)),
          }
        ]}
      />
    </div>
  )
}