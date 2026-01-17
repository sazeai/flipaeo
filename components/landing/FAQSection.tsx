"use client";

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const faqs = [
    {
      question: "WILL GOOGLE PENALIZE THIS CONTENT?",
      answer: "No. Google rewards helpful, authoritative content regardless of how it's produced. Unlike generic AI that hallucinates, our engine performs deep research, cites real sources, and focuses on 'Information Gain'—the exact signals Google's algorithms prioritize."
    },
    {
      question: "HOW IS THIS DIFFERENT FROM OTHER AI BLOG WRITERS?",
      answer: "Other AI writers are just tools. FlipAEO is a system that grows your SEO muscle over time. Every article we create links back to your previous articles, cites authoritative sources, and strengthens your entire site's authority. The more you publish, the more powerful each new article becomes. It's not just writing—it's a system that grows your SEO muscle over time."
    },
    {
      question: "WHY DOES THE CONTENT FEEL SO HUMAN?",
      answer: "We built an 'Anti-AI Filter' into every article. It blocks robotic words like 'unleash', 'seamless', and 'cutting-edge'. It forces sentence variety—short punches mixed with longer thoughts. Every paragraph starts with a direct answer, not fluff. And we pull real data from live research, so there's no hallucination. The result? Content that reads like a senior marketer wrote it, not a chatbot."
    },
    {
      question: "DO I NEED TO EDIT THE ARTICLES?",
      answer: "Our users typically spend 2-5 minutes polishing. Because we handle the research, formatting, and internal linking automatically, you're acting more like an Editor-in-Chief than a writer. The heavy lifting is 100% done for you."
    },
    {
      question: "DOES IT INTEGRATE WITH MY SITE?",
      answer: "Yes. We have direct 1-click publishing integrations for WordPress, Shopify and Webflow. Images, formatting, and meta tags are all synced automatically."
    },
    {
      question: "CAN I CANCEL IF IT'S NOT FOR ME?",
      answer: "Absolutely. We offer a 14-day money-back guarantee. If you don't see the quality in your initial articles, we'll refund you. No questions asked."
    },
    {
      question: "IS THE CONTENT PLAGIARISM-FREE?",
      answer: "Yes. Every article is generated from scratch based on real-time research. We also run a built-in uniqueness check to ensure your content is original and safe to publish."
    },
    {
      question: "WHAT LANGUAGES DO YOU SUPPORT?",
      answer: "Currently, we specialize in high-quality English (US/UK) content to ensure maximum nuance and authority. Multi-language support is on our roadmap for Q4."
    },

  ];

  // Generate FAQ Schema for SEO
  const faqSchema = {
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
  };

  return (
    <>
      <section className="w-full py-24 px-4 flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16 max-w-3xl">
          <div className="inline-block bg-[#FAFA9D] border-2 border-black shadow-neo-sm px-4 py-1 mb-8 transform rotate-2">
            <span className="font-display font-black text-xs uppercase tracking-widest">FAQ</span>
          </div>
          <h2 className="font-display text-transparent bg-clip-text bg-gradient-to-br from-gray-600 to-black text-4xl md:text-6xl leading-[1] mb-6 uppercase">
            DOUBTS ABOUT FLIPAEO?<br />LET'S CLEAR THEM.
          </h2>
          <p className="font-sans text-gray-500 text-lg md:text-xl leading-relaxed max-w-2xl">
            We know you've been burned by "magic buttons" before. Here is exactly how we protect your brand and authority.
          </p>
        </div>

        {/* FAQ List */}
        <div className="w-full max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
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

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
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
            w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0 transition-colors duration-200
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
