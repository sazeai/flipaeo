import { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { generateBreadcrumbJsonLd, generateMetadata } from '@/lib/seo'
import { MultipleStructuredData } from '@/components/seo/StructuredData'
import { seoUtils } from '@/config/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Refund Policy',
  description:
    'Read about our refund policy for FlipAEO, including our 14-day money-back guarantee and eligibility requirements.',
  canonical: '/refund-policy',
})

export default function RefundPolicy() {
  return (
    <div className="landing-page min-h-screen w-full flex flex-col overflow-x-hidden font-sans">
      <Navbar />
      <main className="flex-grow flex flex-col items-center w-full pt-12">
        {/* Hero */}
        <section className="w-full py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block bg-black text-white border-2 border-black shadow-neo-sm px-4 py-1.5 mb-6 transform -rotate-2 hover:rotate-0 transition-transform">
              <span className="font-display font-bold text-xs uppercase tracking-widest">Legal</span>
            </div>
            <h1 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl sm:text-5xl md:text-6xl leading-tight uppercase mb-4">Refund Policy</h1>
            <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">Understand our 14-day money-back guarantee and refund process.</p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 py-12 w-full">
          <div className="space-y-8 bg-white border rounded-2xl p-5">
            <div className="">
              <p>
                Thank you for choosing{' '}
                <a href="https://www.flipaeo.com" className="text-indigo-600">FlipAEO</a>{' '}
                for your content strategy needs. We stand behind our Strategic Content Engine with a 14-day money-back guarantee. Please review our refund policy below.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">1. 14-Day Money-Back Guarantee</h2>
              <p>
                We offer a <strong>14-day money-back guarantee</strong> on all new subscriptions. If you're not satisfied with the quality of your initial articles within the first 14 days, we'll refund your subscription payment in full. No questions asked.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">2. Refund Scenarios</h2>
              <ul className="list-disc list-inside pl-5">
                <li><strong>Not Satisfied with Quality:</strong> If the generated articles don't meet your expectations within the first 14 days, you're eligible for a full refund.</li>
                <li><strong>Technical Issues:</strong> If you encounter technical problems that prevent article generation or delivery, you may be eligible for a refund.</li>
                <li><strong>Service Not Delivered:</strong> If you've paid for a subscription but articles weren't generated, you're entitled to a refund.</li>
                <li><strong>Duplicate Charges:</strong> If you're accidentally charged more than once for the same subscription, we'll refund the duplicate charge immediately.</li>
              </ul>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">3. Refund Timeframe</h2>
              <ul className="list-disc list-inside pl-5">
                <li><strong>Request Period:</strong> You may request a refund within 14 days of your subscription start date.</li>
                <li><strong>Processing Time:</strong> Once a refund is approved, it will be processed within 5-10 business days. Please allow additional time for the refund to reflect in your account.</li>
              </ul>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">4. Conditions for Refunds</h2>
              <ul className="list-disc list-inside pl-5">
                <li><strong>Original Payment Method:</strong> Refunds will be issued to the original payment method used for the subscription.</li>
                <li><strong>Pro-rated Refunds:</strong> After the 14-day guarantee period, we may offer pro-rated refunds on a case-by-case basis.</li>
                <li>
                  <strong>Non-Refundable Situations:</strong>
                  <ul className="list-disc list-inside pl-5 mt-2">
                    <li>Refund requests made after the 14-day guarantee period (except for documented technical issues).</li>
                    <li>Content has already been published to your CMS and is in use.</li>
                    <li>Dissatisfaction due to unrealistic expectations or failure to provide accurate brand/competitor information.</li>
                    <li>Violation of our Terms of Service.</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">5. Cancellation Policy</h2>
              <p>
                You can cancel your subscription at any time from your account dashboard. When you cancel:
              </p>
              <ul className="list-disc list-inside pl-5 mt-2">
                <li>Your subscription will remain active until the end of your current billing period.</li>
                <li>You'll retain access to all previously generated articles.</li>
                <li>No further charges will be made after the current period ends.</li>
              </ul>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">6. How to Request a Refund</h2>
              <p>
                To request a refund, please contact our support team at{' '}
                <a href="mailto:support@flipaeo.com" className="text-blue-500 hover:underline">support@flipaeo.com</a> with:
              </p>
              <ul className="list-disc list-inside pl-5 mt-2">
                <li>Your account email address</li>
                <li>Reason for the refund request</li>
                <li>Any relevant details about issues you've experienced</li>
              </ul>
              <p className="mt-2">
                We aim to respond to all refund requests within 24-48 hours.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">7. Alternative Solutions</h2>
              <ul className="list-disc list-inside pl-5">
                <li><strong>Article Regeneration:</strong> If you're unhappy with specific articles, we can regenerate them with adjusted parameters at no extra cost.</li>
                <li><strong>Brand Voice Adjustment:</strong> We can refine your brand voice settings to better match your expectations.</li>
                <li><strong>Subscription Pause:</strong> If you need a break, we can pause your subscription instead of canceling.</li>
              </ul>
            </div>

            <div className="">
              <p>
                If you have any questions about our refund policy, please contact us at{' '}
                <a href="mailto:support@flipaeo.com" className="text-blue-500 hover:underline">support@flipaeo.com</a>.
                We're committed to your success and happy to help!
              </p>
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
                { name: 'Refund Policy', url: seoUtils.generateCanonicalUrl('/refund-policy') },
              ])
            ),
          },
        ]}
      />
    </div>
  )
}
