import { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { generateBreadcrumbJsonLd, generateMetadata } from '@/lib/seo'
import { MultipleStructuredData } from '@/components/seo/StructuredData'
import { seoUtils } from '@/config/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Refund Policy',
  description:
    'Read about EcomPin\'s refund policy, including our 14-day money-back guarantee and eligibility requirements.',
  keywords: ['EcomPin refund policy', 'money-back guarantee', 'subscription refund', 'Pinterest marketing refund'],
  canonical: '/refund-policy',
})

export default function RefundPolicy() {
  return (
    <div className="min-h-screen w-full flex flex-col overflow-x-hidden font-sans bg-stone-50/50">
      <Navbar />
      <main className="flex-grow flex flex-col items-center w-full pt-12">
        {/* Hero */}
        <section className="w-full py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block bg-stone-100 text-stone-800 border border-stone-200 rounded-full px-4 py-1.5 mb-6 text-sm font-medium tracking-wide">
              <span className="font-display font-bold text-xs uppercase tracking-widest">LEGAL</span>
            </div>
            <h1 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl sm:text-5xl md:text-6xl leading-tight uppercase mb-4">Refund Policy</h1>
            <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">Understand our 14-day money-back guarantee and refund process.</p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 py-12 w-full">
          <div className="space-y-8 p-6 md:p-12">
            <div className="">
              <p>
                Thank you for choosing{' '}
                <a href="https://ecompin.com" className="text-indigo-600">EcomPin</a>{' '}
                for your Pinterest marketing needs. We stand behind our platform with a 14-day money-back guarantee. Please review our refund policy below.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">1. 14-Day Money-Back Guarantee</h2>
              <p>
                We offer a <strong>14-day money-back guarantee</strong> on all new subscriptions. If you're not satisfied with the quality of your initial pins or workflows within the first 14 days, we'll refund your subscription payment in full.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">2. Refund Scenarios</h2>
              <ul className="list-disc list-inside pl-5">
                <li><strong>Not Satisfied with Quality:</strong> If the generated pins or creative direction do not meet your expectations within the first 14 days, you're eligible for a full refund.</li>
                <li><strong>Technical Issues:</strong> If you encounter technical problems that prevent pin generation, approval, or scheduled publishing, you may be eligible for a refund.</li>
                <li><strong>Service Not Delivered:</strong> If you've paid for a subscription but your assets were not generated or made available, you're entitled to a refund.</li>
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
                    <li>Approved assets have already been published extensively or used in paid creative production.</li>
                    <li>Dissatisfaction due to unrealistic expectations or failure to provide accurate product, catalog, or brand information.</li>
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
                <li>You'll retain access to all previously generated pins and approved assets.</li>
                <li>No further charges will be made after the current period ends.</li>
              </ul>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">6. How to Request a Refund</h2>
              <p>
                To request a refund, please contact our support team at{' '}
                <a href="mailto:support@ecompin.com" className="text-blue-500 hover:underline">support@ecompin.com</a> with:
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
                <li><strong>Pin Regeneration:</strong> If you're unhappy with specific creatives, we can regenerate them with adjusted visual direction at no extra cost.</li>
                <li><strong>Brand Direction Adjustment:</strong> We can refine your brand settings to better match your preferred aesthetic and copy style.</li>
                <li><strong>Subscription Pause:</strong> If you need a break, we can pause your subscription instead of canceling.</li>
              </ul>
            </div>

            <div className="">
              <p>
                If you have any questions about our refund policy, please contact us at{' '}
                <a href="mailto:support@ecompin.com" className="text-blue-500 hover:underline">support@ecompin.com</a>.
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
