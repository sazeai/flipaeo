import { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { generateBreadcrumbJsonLd, generateMetadata } from '@/lib/seo'
import { MultipleStructuredData } from '@/components/seo/StructuredData'
import { seoUtils } from '@/config/seo'


export const metadata: Metadata = generateMetadata({
  title: 'About Us',
  description:
    'Learn about FlipAEO—the Strategic Content Engine helping brands get cited by AI search engines through Generative Engine Optimization (GEO).',
  canonical: '/about',
})

export default function AboutUs() {
  return (
    <div className="min-h-screen w-full flex flex-col overflow-x-hidden font-sans bg-stone-50/50">
      <Navbar />
      <main className="flex-grow flex flex-col items-center w-full pt-12">
        {/* Hero */}
        <section className="w-full py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block bg-stone-100 text-stone-800 border border-stone-200 rounded-full px-4 py-1.5 mb-6 text-sm font-medium tracking-wide">
              <span className="font-display font-bold text-xs uppercase tracking-widest">About Us</span>
            </div>
            <h1 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl sm:text-5xl md:text-6xl leading-tight uppercase mb-4">About FlipAEO</h1>
            <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">The story behind the Strategic Content Engine for the post-SEO era.</p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-4xl mx-auto px-4 py-12 w-full">
          <div className="space-y-12 p-8 md:p-12">

            {/* Intro */}
            <div className="prose prose-lg max-w-none">
              <h2 className="font-display text-3xl font-bold text-stone-900 mb-6">The Story of FlipAEO</h2>
              <h3 className="font-display text-2xl font-bold mt-8 mb-4">From 80k Monthly Traffic to a "Dream SaaS"</h3>
            </div>

            {/* The Origin */}
            <h2 className="font-display text-2xl font-bold mb-4">The Origin: The Blogger Who Cracked the Code</h2>
            <p className="font-sans text-gray-700 text-lg leading-relaxed mb-4">
              Back in late 2022, long before I wrote a single line of code, I was a blogger in the AI niche. I was obsessed with one thing: <strong>Traffic.</strong>
            </p>
            <p className="font-sans text-gray-700 text-lg leading-relaxed mb-4">
              In early 2024, I hit a massive milestone. I took a brand new blog from 0 to 80,000 monthly visitors in just 40 days. I wasn't just writing; I was outranking massive competitors with huge budgets.
            </p>
            <p className="font-sans text-gray-700 text-lg leading-relaxed">
              My secret wasn't luck. It was a <strong>specific, repeatable workflow</strong> I had mastered using AI tools like ChatGPT and Gemini. I figured out the exact prompts and structures needed to make AI write content that didn't just "read well"—it dominated search results.
            </p>

            {/* The Gap */}
            <div>
              <h2 className="font-display text-2xl font-bold mb-4">The Gap: The Idea vs. The Skill</h2>
              <p className="font-sans text-gray-700 text-lg leading-relaxed mb-4">
                I knew I had a goldmine. I wanted to turn this manual workflow into a software that anyone could use. I wanted to automate the "expert touch."
              </p>
              <p className="font-sans text-gray-700 text-lg leading-relaxed">
                But there was one problem: I had no background in development. I knew what to build, but I didn't know how to build it.
              </p>
            </div>

            {/* The Journey */}
            <div className="bg-gray-50 border-2 border-black p-6 md:p-8 shadow-neo-sm">
              <h2 className="font-display text-2xl font-bold mb-4">The Journey: Learning to Build</h2>
              <p className="font-sans text-gray-700 text-lg leading-relaxed mb-4">
                In October 2024, I stopped just writing and started building. I launched my first SaaS, <a href="https://unrealshot.com" target="_blank" className="underline decoration-2 decoration-brand-yellow hover:bg-brand-yellow font-bold text-black" rel="noreferrer">Unrealshot AI</a>. It grew purely through organic SEO—proving again that my content strategies worked. I built <a href="https://bringback.pro" target="_blank" className="underline decoration-2 decoration-brand-yellow hover:bg-brand-yellow font-bold text-black" rel="noreferrer">BringBack.pro</a>, which is still growing today.
              </p>
              <p className="font-sans text-gray-700 text-lg leading-relaxed">
                2025 was my "boot camp." I built many products. Most of them failed. But with every failure, I learned the tech. I learned how to structure a database, how to manage servers, and how to turn logic into code.
              </p>
            </div>

            {/* The Birth */}
            <div>
              <h2 className="font-display text-2xl font-bold mb-4">The Birth of FlipAEO</h2>
              <p className="font-sans text-gray-700 text-lg leading-relaxed mb-4">
                By December 2025, I was finally ready. I dusted off that idea I had been dreaming about for two years: An AI Blog Writer that uses my exact, high-ranking workflow.
              </p>
              <p className="font-sans text-gray-700 text-lg leading-relaxed">
                I didn't just want a text generator. I wanted to encode my <strong>80k-traffic expertise</strong> into a system. I poured every lesson from my blogging days and every technical skill from my developer days into FlipAEO.
              </p>
            </div>

            {/* The Proof */}
            <div className="relative pl-8 border-l-4 border-brand-green/50">
              <h2 className="font-display text-2xl font-bold mb-4">The Proof: Eating My Own Dog Food</h2>
              <p className="font-sans text-gray-700 text-lg leading-relaxed mb-4">
                I didn't just launch it. I tested it. I used FlipAEO to generate content for my other active business, BringBack.pro.
              </p>
              <p className="font-sans text-gray-700 text-lg leading-relaxed">
                I let the system run, posted the articles, and waited. The results were exactly what I hoped for: The traffic spiked. The rankings climbed. The "Wow" moment was real.
              </p>
            </div>

            {/* Why This Matters */}
            <div>
              <h2 className="font-display text-2xl font-bold mb-4">Why This Matters to You</h2>
              <p className="font-sans text-gray-700 text-lg leading-relaxed mb-4">
                FlipAEO isn't a tool built by a corporation guessing what SEOs need. It is a tool built by a blogger who needed it, built by a founder who uses it, and designed for entrepreneurs who want results—not just content.
              </p>
              <p className="font-display text-xl font-bold mt-8 uppercase tracking-wide">
                Welcome to the post-SEO era.
              </p>
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
