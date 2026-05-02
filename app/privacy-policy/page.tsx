import { Metadata } from 'next'
import Navbar from '@/components/newlanding/Navbar'
import Footer from '@/components/newlanding/Footer'
import { generateBreadcrumbJsonLd, generateMetadata, generateWebPageJsonLd } from '@/lib/seo'
import { MultipleStructuredData } from '@/components/seo/StructuredData'
import { seoUtils } from '@/config/seo'

export const metadata: Metadata = generateMetadata({
  title: 'Privacy Policy',
  description: 'Learn how EcomPin collects, uses, and protects your data across account, catalog, and Pinterest integrations.',
  keywords: ['EcomPin privacy policy', 'Pinterest marketing privacy', 'catalog data privacy', 'GDPR compliance'],
  canonical: '/privacy-policy',
})

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] font-sans flex flex-col items-center overflow-x-hidden selection:bg-[#111] selection:text-white relative">
      <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1000px] lg:w-[1000px] relative flex flex-col justify-start items-center min-h-screen">
        {/* Left vertical line */}
        <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>
        {/* Right vertical line */}
        <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

        <Navbar />
        <main className="flex-grow flex flex-col items-center w-full pt-32 z-10 relative">
        {/* Hero */}
        <section className="w-full py-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block bg-stone-100 text-stone-800 border border-stone-200 rounded-full px-4 py-1.5 mb-6 text-sm font-medium tracking-wide">
              <span className="font-display font-bold text-xs uppercase tracking-widest">LEGAL</span>
            </div>
            <h1 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl sm:text-5xl md:text-6xl leading-tight uppercase mb-4">Privacy Policy</h1>
            <p className="font-sans text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">Learn how EcomPin collects, uses, and protects your personal data.</p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 py-12 w-full">
          <p className="text-gray-600 mb-6">Effective Date: March 25, 2026</p>

          <div className="space-y-8 ">
            <div className="">
              <p>
                At <strong>EcomPin</strong>, we are committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, how we process user data, and your rights under <strong>applicable privacy laws, including the General Data Protection Regulation (GDPR)</strong>. By using our services, you agree to the practices described in this Privacy Policy.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">1. Information We Collect</h2>
              <p className="mb-4">We collect and process the following types of personal data:</p>
              <h3 className="text-lg font-semibold mb-2">1.1 Personal Information (Provided by You)</h3>
              <ul className="list-disc list-inside pl-5 mb-4">
                <li><strong>Email Address</strong> (for account creation and communication).</li>
                <li><strong>Brand Information</strong> (company name, store URL, aesthetic guidelines for image generation).</li>
                <li><strong>Product Catalog Data</strong> (product images, descriptions, pricing synced securely via Shopify/Etsy API).</li>
                <li><strong>Pinterest Account Data</strong> (tokens securely stored via OAuth to facilitate your approved pin scheduling and analytics).</li>
                <li><strong>Payment Information</strong> (processed securely via third-party payment providers).</li>
              </ul>
              <h3 className="text-lg font-semibold mb-2">1.2 Automatically Collected Data</h3>
              <ul className="list-disc list-inside pl-5">
                <li><strong>Device Information</strong> (browser type, operating system, and device details).</li>
                <li><strong>IP Address & Location Data</strong> (to ensure service functionality and security).</li>
                <li><strong>Usage Data</strong> (features used, session duration, and interactions).</li>
                <li><strong>Cookies & Tracking Technologies</strong> (see Section 7).</li>
              </ul>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">2. How We Use Your Information</h2>
              <p className="mb-4">We process your data for the following purposes:</p>
              <ul className="list-disc list-inside pl-5">
                <li>✅ <strong>Pinterest Publishing:</strong> To generate product lifestyle images and facilitate user-approved scheduling and publishing to Pinterest.</li>
                <li>✅ <strong>Account Management:</strong> To enable login, profile settings, and service customization.</li>
                <li>✅ <strong>Payment Processing:</strong> To process subscription payments securely.</li>
                <li>✅ <strong>Customer Support:</strong> To address inquiries and technical issues.</li>
                <li>✅ <strong>Service Improvement:</strong> To improve our AI models and user experience.</li>
                <li>✅ <strong>Security & Fraud Prevention:</strong> To prevent misuse, unauthorized access, or data breaches.</li>
              </ul>
              <p className="mt-4">We <strong>do not</strong> sell or misuse your data.</p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">3. Data Storage & Retention</h2>
              <ul className="list-disc list-inside pl-5">
                <li>📌 <strong>Account Data:</strong> Stored in <strong>Supabase</strong> until account deletion.</li>
                <li>📌 <strong>Brand Settings:</strong> Retained to improve generation consistency across your products.</li>
                <li>📌 <strong>Generated Pins:</strong> Retained on secure R2 buckets for publishing and historical records.</li>
                <li>📌 <strong>Payment Data:</strong> Not stored by us; processed by <strong>secure third-party payment providers</strong>.</li>
                <li>📌 <strong>Logs & Analytics:</strong> Retained for performance monitoring but anonymized after 30 days.</li>
              </ul>
              <p className="mt-4">If you request deletion of your account, we will permanently erase all stored personal data.</p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">4. Your Rights (GDPR & Global Compliance)</h2>
              <p className="mb-4">If you are an <strong>EU/EEA resident</strong>, you have additional GDPR rights:</p>
              <ul className="list-disc list-inside pl-5">
                <li>🔹 <strong>Right to Access:</strong> Request a copy of your personal data.</li>
                <li>🔹 <strong>Right to Rectification:</strong> Correct inaccurate or incomplete data.</li>
                <li>🔹 <strong>Right to Erasure ("Right to be Forgotten"):</strong> Request deletion of your personal data.</li>
                <li>🔹 <strong>Right to Restrict Processing:</strong> Limit how we use your data.</li>
                <li>🔹 <strong>Right to Data Portability:</strong> Request your data in a structured format.</li>
                <li>🔹 <strong>Right to Object:</strong> Stop processing for marketing purposes.</li>
                <li>🔹 <strong>Right to Withdraw Consent:</strong> If data processing is based on consent, you can withdraw it at any time.</li>
              </ul>

            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">5. Data Sharing & Third-Party Services</h2>
              <p className="mb-4">We <strong>do not sell</strong> your personal data. However, we may share data with:</p>
              <ul className="list-disc list-inside pl-5">
                <li><strong>AI Content Generation:</strong> Google GenAI and fal.ai for content creation, Tavily for search and research.</li>
                <li><strong>Cloud Storage & Infrastructure:</strong> Cloudflare R2 and Supabase for secure data storage. Trigger.dev and Upstash for background processing and serverless queuing.</li>
                <li><strong>Payment Processors:</strong> DodoPayments (for secure subscription processing).</li>
                <li><strong>Integrations:</strong> Shopify & Etsy (for product ingestion) and Pinterest (for official API publishing).</li>
                <li><strong>Analytics & Performance Monitoring:</strong> Microsoft Clarity to capture and analyze user interactions.</li>
                <li><strong>Email Communications:</strong> Resend for sending transactional notifications and reports.</li>
                <li><strong>Legal & Compliance Reasons:</strong> If required by law or court order.</li>
              </ul>
              <p className="mt-4">Each provider follows <strong>industry-standard security measures</strong> and <strong>GDPR compliance policies</strong>.</p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">6. Google Services Integration</h2>
              <p className="mb-4">EcomPin integrates with the following services to provide our core automated functionality:</p>

              <h3 className="text-lg font-semibold mb-2">6.1 Google Authentication (OAuth 2.0)</h3>
              <p className="mb-4">
                We use <strong>Google Sign-In</strong> to allow you to authenticate securely with your Google account. When you sign in with Google, we receive:
              </p>
              <ul className="list-disc list-inside pl-5 mb-4">
                <li>Your <strong>email address</strong> (for account creation and communication)</li>
                <li>Your <strong>name</strong> (for personalization)</li>
                <li>Your <strong>profile picture</strong> (optional, for display purposes)</li>
              </ul>
              <p className="mb-4">
                We do not receive or store your Google password. Google authentication is handled securely through Google's OAuth 2.0 protocol.
              </p>

              <h3 className="text-lg font-semibold mb-2">6.2 Google API Services User Data Policy Compliance</h3>
              <p className="mb-4">
                EcomPin's use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">7. Data Security Measures</h2>
              <ul className="list-disc list-inside pl-5">
                <li>🔒 <strong>Encryption:</strong> Data is encrypted in transit and at rest.</li>
                <li>🔒 <strong>Access Control:</strong> Limited access to authorized personnel only.</li>
                <li>🔒 <strong>Regular Security Audits:</strong> To prevent unauthorized data access.</li>
              </ul>
              <p className="mt-4">However, no system is <strong>100% secure</strong>, and we encourage users to take necessary precautions.</p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">8. Cookies & Tracking Technologies</h2>
              <p className="mb-4">We use cookies and similar tracking technologies to improve your experience on EcomPin.</p>
              <h3 className="text-lg font-semibold mb-2">8.1 What Cookies Do We Use?</h3>
              <ul className="list-disc list-inside pl-5 mb-4">
                <li>🔐 <strong>Authentication Cookies:</strong> Used by Supabase to keep you logged in after signing in via email or Google login.</li>
                <li>🍪 <strong>Necessary Cookies:</strong> Required for basic website functionality and security.</li>
                <li>📊 <strong>Analytics Cookies:</strong> Help us analyze site usage and improve performance.</li>
              </ul>
              <h3 className="text-lg font-semibold mb-2">8.2 Managing Cookies</h3>
              <p className="mb-4">
                You can control or disable cookies through your browser settings. However, disabling authentication cookies may log you out or limit certain features.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">9. Children's Privacy</h2>
              <p className="mb-4">We <strong>do not</strong> knowingly collect or process data from users under <strong>18 years old</strong>. If we discover such data, we will delete it immediately.</p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">10. International Data Transfers</h2>
              <p className="mb-4">
                Since we operate globally, your data <strong>may be transferred to servers outside your country</strong> (including the US & EU). We ensure these transfers comply with <strong>GDPR, SCCs (Standard Contractual Clauses), and other international laws</strong> for secure handling.
              </p>
            </div>

            <div className="">
              <h2 className="text-2xl font-bold mb-2 font-[var(--font-inter-tight)]">11. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy to reflect <strong>legal, technical, or business changes</strong>. Any updates will be posted here with an <strong>effective date</strong>. Continued use of EcomPin signifies your acceptance of the changes.
              </p>
            </div>


          </div>
        </section>
      </main>
      <Footer />
      </div>

      {/* Structured Data */}
      <MultipleStructuredData
        schemas={[
          {
            id: 'webpage',
            data: JSON.parse(
              generateWebPageJsonLd({
                title: 'Privacy Policy',
                description: 'Learn how EcomPin collects, uses, and protects your data across account, catalog, and Pinterest integrations.',
                urlPath: '/privacy-policy',
                dateModified: '2026-03-25',
              })
            ),
          },
          {
            id: 'breadcrumb',
            data: JSON.parse(
              generateBreadcrumbJsonLd([
                { name: 'Home', url: seoUtils.generateCanonicalUrl('/') },
                { name: 'Privacy Policy', url: seoUtils.generateCanonicalUrl('/privacy-policy') },
              ])
            ),
          },
        ]}
      />
    </div>
  )
}