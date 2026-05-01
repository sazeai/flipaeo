import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Securely Connect Your Catalog",
      desc: "Skip the complex integrations. Simply upload your product CSV or use our secure direct connection to import your Shopify or Etsy catalog. EcomPin securely pulls in your plain product photos, titles, and exact URLs so everything is ready to format."
    },
    {
      num: "02",
      title: "Format for Inspiration",
      desc: "Pinterest is a visual search engine, and plain catalog photos get ignored. EcomPin’s built-in creative studio analyzes your products and automatically places them into beautiful, native-looking lifestyle environments. Your products are instantly formatted to inspire."
    },
    {
      num: "03",
      title: "Review & Approve Your Drafts",
      desc: "You retain 100% editorial control over your brand. Instead of starting from scratch, just open your EcomPin inbox once a week. Review the stunning visual drafts our system prepared, click \"Approve\" on your favorites, and your week of marketing is done in 60 seconds."
    },
    {
      num: "04",
      title: "Smart Content Queuing",
      desc: "Never worry about manually publishing again. EcomPin acts as your organic content calendar. Our Smart Queue automatically paces your approved pins out over the week. This ensures consistent, high-quality organic engagement without ever overwhelming your followers' feeds."
    }
  ];

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center mb-16 px-6">
        <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-[#111] mb-4">
          A complete organic publishing workflow.
        </h2>
        <p className="text-[1.1rem] text-[#555] font-normal tracking-tight">
          Zero graphic design required.
        </p>
      </div>

      <div className="w-full border-t border-b border-[rgba(55,50,47,0.12)] flex flex-col">
        {steps.map((step, index) => (
          <div 
            key={step.num}
            className={`w-full flex flex-col md:flex-row group bg-[#FAFAFA] hover:bg-white transition-colors duration-500 ${index !== steps.length - 1 ? 'border-b border-[rgba(55,50,47,0.12)]' : ''}`}
          >
            <div className="w-full md:w-[40%] p-8 md:p-12 md:border-r border-[rgba(55,50,47,0.12)] flex flex-col justify-between">
              <span className="font-mono text-xs tracking-widest text-[#888] uppercase mb-8">
                Step {step.num}
              </span>
              <h3 className="text-2xl font-serif text-[#111] tracking-tight leading-snug">
                {step.title}
              </h3>
            </div>
            <div className="w-full md:w-[60%] p-8 md:p-12 flex items-center">
              <p className="text-[1.05rem] text-[#555] leading-[1.6]">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
