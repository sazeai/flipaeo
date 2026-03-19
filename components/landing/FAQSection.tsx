"use client";

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const FAQS = [
  {
    question: "Will Google penalize this content?",
    answer: "No. Google rewards helpful, authoritative content regardless of how it's produced. Unlike generic AI that hallucinates, our engine performs deep research, cites real sources, and focuses on 'Information Gain'—the exact signals Google's algorithms prioritize."
  },
  {
    question: "How is this different from other AI blog writers?",
    answer: "Other AI writers are just tools. FlipAEO is a system that grows your SEO muscle over time. Every article we create links back to your previous articles, cites authoritative sources, and strengthens your entire site's authority. The more you publish, the more powerful each new article becomes. It's not just writing—it's a system that grows your SEO muscle over time."
  },
  {
    question: "Why does the content feel so human?",
    answer: "We built an 'Anti-AI Filter' into every article. It blocks robotic words like 'unleash', 'seamless', and 'cutting-edge'. It forces sentence variety—short punches mixed with longer thoughts. Every paragraph starts with a direct answer, not fluff. And we pull real data from live research, so there's no hallucination. The result? Content that reads like a senior marketer wrote it, not a chatbot."
  },
  {
    question: "Do I need to edit the articles?",
    answer: "Our users typically spend 2-5 minutes polishing. Because we handle the research, formatting, and internal linking automatically, you're acting more like an Editor-in-Chief than a writer. The heavy lifting is 100% done for you."
  },
  {
    question: "Does it integrate with my site?",
    answer: "Yes. We have direct 1-click publishing integrations for WordPress, Shopify and Webflow. Images, formatting, and meta tags are all synced automatically."
  },
  {
    question: "Can I cancel if it's not for me?",
    answer: "Absolutely. We offer a 14-day money-back guarantee. If you don't see the quality in your initial articles, we'll refund you. No questions asked."
  },
  {
    question: "Is the content plagiarism-free?",
    answer: "Yes. Every article is generated from scratch based on real-time research. We also run a built-in uniqueness check to ensure your content is original and safe to publish."
  },
  {
    question: "What languages do you support?",
    answer: "Currently, we specialize in high-quality English (US/UK) content to ensure maximum nuance and authority. Multi-language support is on our roadmap for Q4."
  },
];

const FAQItem = ({ item }: { item: typeof FAQS[0] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // Outer Container (The "Halo" or "Frame")
    <div
      className={`
                group w-full rounded-[20px] p-1 transition-all duration-300 cursor-pointer
                ${isOpen
          ? 'bg-brand-100 shadow-[inset_0_0_0_1px_#c4b5fd]'
          : 'bg-white border border-stone-200 hover:border-brand-200 hover:shadow-xs'
        }
            `}
      onClick={() => setIsOpen(!isOpen)}
    >
      {/* Inner Container (The "Canvas") */}
      <div className={`
                w-full bg-stone-100 rounded-[17px] border-stone-200 border transition-all duration-300 overflow-hidden relative
                ${isOpen ? 'border-brand-100' : 'border-stone-100'}
            `}>

        {/* Clickable Header Area - Adjusted padding for better vertical balance */}
        <div className="flex items-center justify-between px-6 py-5">
          <h3 className={`font-sans font-medium text-base md:text-xl pr-8 leading-snug transition-colors duration-300 ${isOpen ? 'text-stone-900' : 'text-stone-600 group-hover:text-stone-900'}`}>
            {item.question}
          </h3>

          {/* Interactive Icon */}
          <div className={`
                        flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300
                        ${isOpen
              ? 'bg-brand-50 border-brand-200 text-brand-600 rotate-90'
              : 'bg-stone-50 border-stone-200 text-stone-400 rotate-0 group-hover:bg-brand-50 group-hover:border-brand-200 group-hover:text-brand-500'}
                    `}>
            {isOpen ? <X size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
          </div>
        </div>

        {/* Expandable Content Area */}
        <div
          className={`
                        grid transition-all duration-500 ease-in-out
                        ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
                    `}
        >
          <div className="overflow-hidden px-6 pb-6">

            <p className="text-stone-500 leading-relaxed text-base font-medium">
              {item.answer}
            </p>

          </div>
        </div>

      </div>
    </div>
  );
};

import { CornerSquare } from './CornerSquare';

export const FAQSection: React.FC = () => {
  // Generate FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <>
      <section id="faq" className="w-full py-24 relative z-10">
        <div className="w-full max-w-[1250px] mx-auto px-3 sm:px-5">

          {/* Horizontal Pattern Bar Above Header */}
          <div className="w-full h-3 sm:h-4 border-y border-stone-200 mb-16" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px)' }}></div>

          {/* Header - Left/Right Premium Setup */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 justify-between items-start md:items-end mb-16 w-full px-4 md:px-8">
            <div className="flex-1">
              <span className="font-sans text-xs font-bold tracking-widest text-brand-500 uppercase mb-4 block">
                Common Questions
              </span>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 tracking-tight font-normal leading-[1]">
                Doubts about FlipAEO?<br /><span className='italic text-stone-500'>Let's clear them.</span>
              </h2>
            </div>
            <div className="flex-1 md:max-w-xl pb-0 md:pb-2">
              <p className="font-sans text-stone-500 text-lg leading-relaxed">
                We know you've been burned by "magic buttons" before. Here is exactly how we protect your brand and authority.
              </p>
            </div>
          </div>

          {/* Horizontal Pattern Bar Top (Grid Boundary) */}
          <div className="relative w-full h-3 sm:h-4 border-y border-stone-200" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px)' }}>

            <CornerSquare className="-left-[5px] -bottom-[5px]" />
            <CornerSquare className="-right-[5px] -bottom-[5px]" />
          </div>

          {/* FAQ List wrapped in the wireframe border */}
          <div className="w-full border-x border-stone-200 bg-white p-8 md:p-16 relative">
            <CornerSquare className="-left-[5px] -bottom-[5px]" />
            <CornerSquare className="-right-[5px] -bottom-[5px]" />

            <div className="max-w-3xl mx-auto flex flex-col gap-4">
              {FAQS.map((faq, index) => (
                <FAQItem key={index} item={faq} />
              ))}
            </div>
          </div>

          {/* Horizontal Pattern Bar Bottom (Grid Boundary) */}
          <div className="relative w-full h-3 sm:h-4 border-b border-stone-200" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px)' }}>

          </div>

        </div>
      </section>

      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
};

export default FAQSection;

