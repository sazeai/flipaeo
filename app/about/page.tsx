import { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { generateBreadcrumbJsonLd, generateMetadata } from '@/lib/seo'
import { MultipleStructuredData } from '@/components/seo/StructuredData'
import { seoUtils } from '@/config/seo'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export const metadata: Metadata = generateMetadata({
  title: 'About Us',
  description:
    'Learn about FlipAEO—the Strategic Content Engine helping brands get cited by AI search engines through Generative Engine Optimization (GEO).',
  canonical: '/about',
})

export default function AboutUs() {
  return (
    <div className="landing-page min-h-screen w-full flex flex-col overflow-x-hidden font-sans">
      <Navbar />
      <main className="flex-grow flex flex-col items-center w-full pt-12">
        {/* Hero */}
        <section className="w-full py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block bg-black text-white border-2 border-black shadow-neo-sm px-4 py-1.5 mb-6 transform -rotate-2 hover:rotate-0 transition-transform">
              <span className="font-display font-bold text-xs uppercase tracking-widest">About Us</span>
            </div>
            <h1 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl sm:text-5xl md:text-6xl leading-tight uppercase mb-4">About FlipAEO</h1>
            <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">The story behind the Strategic Content Engine for the post-SEO era.</p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 py-12 w-full">
          <div className="space-y-8 bg-white border rounded-2xl p-5">
            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">Our Journey</h2>
              <p className="text-gray-700">
                We are a small team of passionate developers and content strategists, self-taught and driven by curiosity. Our journey into tech started through blogging—sharing insights about digital marketing, SEO, and the evolving landscape of search. We spent years watching how algorithms changed and how businesses struggled to keep up.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">The Shift We Saw Coming</h2>
              <p className="text-gray-700">
                Then AI search arrived. ChatGPT, Perplexity, Google AI Overviews—suddenly, the game changed completely. Users stopped clicking through search results. They started asking questions and expecting direct answers. We realized that traditional SEO was no longer enough. The future belonged to brands that could become the source AI systems cite.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">The Birth of FlipAEO</h2>
              <p className="text-gray-700">
                That's when FlipAEO was born. We built a Strategic Content Engine designed specifically for Generative Engine Optimization (GEO). Instead of chasing keywords, we reverse-engineer how AI models think—analyzing competitors, identifying visibility gaps, and creating content that AI systems recognize as authoritative.
              </p>
              <p className="text-gray-700 mt-3">
                FlipAEO doesn't just write articles. It decides what should exist, what comes next, and what actually moves authority forward. Every piece of content is researched, cited, and structured to become the answer—not just another result.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">Empowering Entrepreneurs</h2>
              <p className="text-gray-700">
                This isn't just about rankings. It's about visibility in the age of AI. We believe every entrepreneur, founder, and content marketer deserves to be found when AI answers questions in their category. FlipAEO makes that possible—automatically, strategically, and at scale.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">Today and Tomorrow</h2>
              <p className="text-gray-700">
                Today, FlipAEO serves ambitious entrepreneurs and content teams worldwide, helping them create 30+ strategic articles per month that build real authority. From automated content planning to 1-click CMS publishing, we handle the heavy lifting so you can focus on what matters—growing your business.
              </p>
              <p className="text-gray-700 mt-3">
                The post-SEO era is here. We're building the tools to help you win it.
              </p>
            </div>

            <div className="bg-[#F7F5F3] border rounded-2xl p-5">
              <p className="text-gray-800 font-medium">Thank you for trusting FlipAEO with your content strategy. We're excited to help you become the source AI cites.</p>
              <p className="text-gray-700 mt-4">Warm regards,<br />The FlipAEO Team</p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}

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
                { name: 'About', url: seoUtils.generateCanonicalUrl('/about') },
              ])
            ),
          },
        ]}
      />
    </div>
  )
}
