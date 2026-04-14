"use client";

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const FAQS = [
  {
    question: "Will the AI alter or distort my actual product?",
    answer: "No. EcomPin utilizes advanced ControlNet architecture. We do not generate your product from scratch; we precisely extract your physical item and generate the environment around it. Your product's branding, shape, and details remain 100% accurate."
  },
  {
    question: "Why don't I get a drag-and-drop editor to design my pins?",
    answer: "EcomPin is designed for performance, not manual design. We enforce strict, algorithm-approved editorial layouts because they are mathematically proven to pass Pinterest's visual OCR scanners. We remove the guesswork so you can focus on your store."
  },
  {
    question: "Will posting AI content hurt my account standing?",
    answer: "No. In fact, repetitive manual scheduling of the exact same image often triggers spam filters. Because EcomPin generates 100% unique pixel arrangements and unique AI copywriting for every single post, it mimics high-quality, organic creation perfectly."
  }
];

const FAQItem = ({ item }: { item: typeof FAQS[0] }) => {
  return (
    <details
      className="group w-full rounded-[20px] p-1 transition-all duration-300 open:bg-brand-100 open:shadow-[inset_0_0_0_1px_#c4b5fd] bg-white border border-stone-200 hover:border-brand-200"
    >
      <summary className="list-none outline-none cursor-pointer flex items-center justify-between">
        {/* Inner Container (The "Canvas") */}
        <div className="w-full bg-stone-100 rounded-[17px] border border-stone-100 transition-all duration-300 flex items-center justify-between px-6 py-3.5 relative overflow-hidden group-open:border-brand-100">
          <h3 className="font-sans font-medium text-base md:text-xl pr-8 leading-snug transition-colors duration-300 text-stone-600 group-hover:text-stone-900 group-open:text-stone-900">
            {item.question}
          </h3>

          {/* Interactive Icon */}
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-300 bg-stone-50 border-stone-200 text-stone-400 rotate-0 group-hover:bg-brand-50 group-hover:border-brand-200 group-hover:text-brand-500 group-open:bg-brand-50 group-open:border-brand-200 group-open:text-brand-600 group-open:rotate-90">
            <Plus size={16} strokeWidth={2.5} className="group-open:hidden transition-transform duration-300" />
            <X size={16} strokeWidth={2.5} className="hidden group-open:block transition-transform duration-300" />
          </div>
        </div>
      </summary>

      {/* Expandable Content Area */}
      <div className="px-6 py-5 bg-stone-100/50 rounded-b-[17px] -mt-4 pt-8 transition-all duration-500 opacity-0 group-open:opacity-100">
        <p className="text-stone-500 leading-relaxed text-base font-medium">
          {item.answer}
        </p>
      </div>
    </details>
  );
};

import { CornerDot } from './CornerDot';

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
          <div className="relative w-full h-px bg-stone-200 mb-16">
            <CornerDot className="-left-[10px] -bottom-[10px]" />
            <CornerDot className="-right-[10px] -bottom-[10px]" />
          </div>

          {/* Header - Left/Right Premium Setup */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 justify-between items-start md:items-end mb-16 w-full px-4 md:px-8">
            <div className="flex-1">
              <span className="font-sans text-xs font-bold tracking-widest text-brand-500 uppercase mb-4 block">
                Common Questions
              </span>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 tracking-tight font-normal leading-[1]">
                Doubts about EcomPin?<br /><span className='italic text-stone-500'>Let's clear them.</span>
              </h2>
            </div>
            <div className="flex-1 md:max-w-xl pb-0 md:pb-2">
              <p className="font-sans text-stone-500 text-lg leading-relaxed">
                We know you've been burned by "magic buttons" before. Here is exactly how we protect your brand and account.
              </p>
            </div>
          </div>

          {/* Horizontal Pattern Bar Top (Grid Boundary) */}
          <div className="relative w-full h-px bg-stone-200">

            <CornerDot className="-left-[10px] -bottom-[10px]" />
            <CornerDot className="-right-[10px] -bottom-[10px]" />
          </div>

          {/* FAQ List wrapped in the wireframe border */}
          <div className="w-full border-x border-stone-200  p-8 md:p-16 relative">
            <CornerDot className="-left-[10px] -top-[10px]" />
            <CornerDot className="-right-[10px] -top-[10px]" />
            <CornerDot className="-left-[10px] -bottom-[10px]" />
            <CornerDot className="-right-[10px] -bottom-[10px]" />

            <div className="max-w-3xl mx-auto flex flex-col gap-4">
              {FAQS.map((faq, index) => (
                <FAQItem key={index} item={faq} />
              ))}
            </div>
          </div>

          {/* Horizontal Pattern Bar Bottom (Grid Boundary) */}
          <div className="relative w-full h-px bg-stone-200">
            <CornerDot className="-left-[10px] -top-[10px]" />
            <CornerDot className="-right-[10px] -top-[10px]" />
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

