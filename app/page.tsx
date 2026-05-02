
import { Metadata } from 'next'
import { commonPageMetadata, generateWebApplicationJsonLd } from '@/lib/seo'
import { Store } from 'lucide-react'
import { ReactNode } from 'react';
import { StructuredData } from '@/components/seo/StructuredData'
import Footer from '@/components/newlanding/Footer';
import { GridBackground } from "@/components/landing/GridBackground"
import AestheticLens from '@/components/newlanding/AestheticLens';
import HowItWorks from '@/components/newlanding/HowItWorks';
import Showcase from '@/components/newlanding/Showcase';
import TargetAudience from '@/components/newlanding/TargetAudience';
import Pricing from '@/components/newlanding/Pricing';
import CTA from '@/components/newlanding/CTA';
import StaggerReveal from '@/components/newlanding/StaggerReveal';
import Navbar from '@/components/newlanding/Navbar';


export const metadata: Metadata = commonPageMetadata.home()

// --- Custom SVGs ---

const LogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <circle cx="12" cy="5" r="2" fill="currentColor" />
    <circle cx="12" cy="19" r="2" fill="currentColor" />
    <circle cx="5" cy="12" r="2" fill="currentColor" />
    <circle cx="19" cy="12" r="2" fill="currentColor" />
    <path d="M12 7.5V10.5M12 13.5V16.5M7.5 12H10.5M13.5 12H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
    <path d="M10 1L12.5 7.5L19 10L12.5 12.5L10 19L7.5 12.5L1 10L7.5 7.5L10 1Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SectionContainer = ({ children, className = "" }: { children: ReactNode, className?: string }) => (
  <div className="self-stretch flex justify-center items-stretch relative z-10 -mt-[1px]">
    <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden shrink-0">
      {/* Left decorative pattern */}
      <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
          ></div>
        ))}
      </div>
    </div>

    <div className={`flex-1 flex flex-col items-center px-4 sm:px-8 md:px-12 border-l border-r border-[rgba(55,50,47,0.12)] pt-12 ${className}`}>
      {children}
    </div>

    <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden shrink-0">
      {/* Right decorative pattern */}
      <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
        {Array.from({ length: 150 }).map((_, i) => (
          <div
            key={i}
            className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
          ></div>
        ))}
      </div>
    </div>
  </div>
);



export default function Home() {
  return (
    <div className="relative min-h-screen w-full flex flex-col font-sans">

      <div className="min-h-screen flex flex-col items-center">
        <StructuredData id="home-webapplication-schema" data={JSON.parse(generateWebApplicationJsonLd())} />

        {/* Main Grid Container */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1000px] lg:w-[1000px] relative flex flex-col justify-start items-center">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Navbar */}
          <Navbar />

          {/* Hero Section */}
          <main className="flex flex-col items-center w-full relative z-10 mt-40">

            <div className="w-full border-b border-[rgba(55,50,47,0.12)] pb-12 relative flex flex-col items-center">
              <div className="text-center flex flex-col items-center z-10 px-6">
                <h1 className="font-serif text-4xl sm:text-7xl leading-[1.1] tracking-[-0.03em] text-[#111]">
                  Pinterest Automation for E-Commerce Brands.
                </h1>
                <p className="text-[1.1rem] text-[#555] font-normal tracking-tight mt-3 max-w-2xl">
                  EcomPin helps e-commerce owners organize their product catalogs, generate aesthetic lifestyle imagery, and schedule organic Pinterest Pins via a content calendar to maintain consistent, high-quality brand presence.              </p>
              </div>

              <div className="absolute bottom-0 translate-y-1/2 flex justify-center w-full z-20">
                <button className="bg-[#111] hover:bg-black text-white px-4 py-3 rounded-full flex items-center gap-2 text-[15px] font-medium shadow-md">
                  <Store />
                  Connect Your Store
                </button>
              </div>
            </div>

            {/* Hero Image Composition */}
            <AestheticLens />

          </main>

          <SectionContainer>
            {/* Case Study Section */}
            <section className="w-full max-w-[640px] mx-auto flex flex-col items-center pb-12">

              <div className="w-10 h-10 bg-[#EFEFEF] rounded-xl flex items-center justify-center mb-16">
                <LogoIcon />
              </div>

              <StaggerReveal className="w-full space-y-8 text-[17px] leading-[1.6] text-[#111] tracking-[-0.01em]">

                <p>
                  Everyone tells you Pinterest is a goldmine for e-commerce traffic, but actually growing an account feels like a second full-time job. You are told you need to post beautifully staged photos every single day, but as a busy store owner, you are exhausted just trying to keep up.
                </p>

                <div className="relative pl-12">
                  <div className="absolute left-0 top-1">
                    <div className="w-6 h-6 bg-white rounded-md shadow-sm overflow-hidden flex flex-col border border-gray-100">
                      <div className="h-1.5 bg-[#FFD500] w-full border-b border-gray-200"></div>
                      <div className="flex-1 flex flex-col justify-evenly px-1 py-0.5">
                        <div className="h-[1px] w-full bg-gray-200 rounded-full"></div>
                        <div className="h-[1px] w-full bg-gray-200 rounded-full"></div>
                        <div className="h-[1px] w-3/4 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <p>
                    You are trapped by a double-edged sword: You don&apos;t have thousands of dollars to hire a lifestyle photographer, and you don&apos;t have hours to manually schedule posts every week. So, you occasionally pin your plain, white-background catalog photos when you have a spare minute—and shoppers scroll right past them.
                  </p>
                </div>

                <div className="relative pl-12">
                  <div className="absolute left-0 top-1">
                    <div className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-100 p-px">
                      <div className="w-full h-full bg-[#007AFF] rounded-full flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 border border-white/20 rounded-full m-[1px]"></div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform -rotate-45">
                          <path d="M12 2L15 15L2 12L12 2Z" fill="white" />
                          <path d="M12 22L9 9L22 12L12 22Z" fill="#FF3B30" />
                          <circle cx="12" cy="12" r="2" fill="white" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p>
                    EcomPin is a complete autonomous engine that replaces both the photographer and the social media manager. First, it takes your plain product photos and instantly surrounds them with stunning, photorealistic lifestyle environments.
                  </p>
                </div>

                <p>
                  Your basic chair is suddenly resting in a beautifully decorated living room, complete with perfect lighting and shadows. But EcomPin doesn&apos;t just hand you an image and leave you to do the work. It writes the SEO metadata and automatically builds your entire content calendar.
                </p>

                <p>
                  You never have to scramble for content or manually schedule a pin again. Every Monday, you simply open your inbox, approve a fresh batch of gorgeous lifestyle pins in 60 seconds, and let our engine safely pace them out to your boards all week.
                </p>

                <p className="text-[#888]">
                  Your feed transforms into a high-end lifestyle magazine, and the traffic finally starts compounding.
                </p>

                <p className="text-[#888]">
                  You didn&apos;t just find a better scheduling tool. You hired a world-class marketing team that runs on autopilot.
                </p>

              </StaggerReveal>

            </section>
          </SectionContainer>

          <SectionContainer className="!max-w-[1000px] !px-0">
            <HowItWorks />
          </SectionContainer>

          <SectionContainer className="!max-w-[1000px] !px-0">
            {/* Why Choose EcomPin Section */}
            <section className="w-full flex flex-col items-center">

              <div className="text-center mb-16 px-6">
                <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-[#111] mb-4">
                  Why Choose EcomPin
                </h2>
                <p className="text-[1.1rem] text-[#555] font-normal tracking-tight">
                  The difference between hoping for traffic and actually getting it.
                </p>
              </div>

              <div className="w-full border-t border-b border-[rgba(55,50,47,0.12)] grid grid-cols-1 md:grid-cols-2">

                {/* Without EcomPin */}
                <div className="flex flex-col p-8 md:p-12 bg-[#FAFAFA] md:border-r border-[rgba(55,50,47,0.12)]">
                  <h3 className="font-mono text-xs tracking-widest text-[#888] uppercase mb-8 pb-4 border-b border-[rgba(55,50,47,0.12)]">
                    Without EcomPin
                  </h3>

                  <ul className="flex flex-col gap-5">
                    {[
                      'Frustrated store owner',
                      'Flat organic traffic',
                      'Manual design in Canva',
                      'Scattered product photos',
                      'Inconsistent posting schedule',
                      'No lifestyle imagery',
                      'Site looks like a basic catalog',
                      'Marketing takes hours'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-[0.95rem] text-[#666] leading-[1.5]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-1">
                          <path d="M18 6L6 18M6 6l12 12" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* With EcomPin */}
                <div className="flex flex-col p-8 md:p-12 bg-white">
                  <h3 className="font-mono text-xs tracking-widest text-[#111] uppercase mb-8 pb-4 border-b border-[rgba(55,50,47,0.12)]">
                    With EcomPin
                  </h3>

                  <ul className="flex flex-col gap-5">
                    {[
                      'Automated organic engine',
                      'Compounding Pinterest traffic',
                      'Zero graphic design required',
                      'Instant lifestyle scenes',
                      'Autonomous content calendar',
                      'SEO-optimized metadata',
                      'High-end brand presence',
                      'Marketing done in 60 seconds'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-[0.95rem] text-[#111] leading-[1.5]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-1">
                          <path d="M20 6L9 17l-5-5" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </section>
          </SectionContainer>

          <SectionContainer className="!max-w-[1000px] !px-0">
            <Showcase />
          </SectionContainer>

          <SectionContainer className="!max-w-[1400px] !px-0 !py-0">
            <TargetAudience />
          </SectionContainer>

          <SectionContainer className="!max-w-[1400px] !px-0 !py-0">
            <Pricing />
          </SectionContainer>

          <SectionContainer className="!max-w-full !px-0 !py-0">
            <CTA />
          </SectionContainer>

          <Footer />

        </div>
      </div>


    </div>
  )
}