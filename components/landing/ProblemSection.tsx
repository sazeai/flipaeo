import React from 'react';

const DotGridIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-300">
    <circle cx="4" cy="4" r="2.5" fill="currentColor" />
    <circle cx="14" cy="4" r="2.5" fill="currentColor" />
    <circle cx="24" cy="4" r="2.5" fill="currentColor" />

    <circle cx="4" cy="14" r="2.5" fill="currentColor" />
    <circle cx="14" cy="14" r="2.5" fill="currentColor" />
    <circle cx="24" cy="14" r="2.5" fill="currentColor" />

    <circle cx="4" cy="24" r="2.5" fill="currentColor" />
    <circle cx="14" cy="24" r="2.5" fill="currentColor" />
    <circle cx="24" cy="24" r="2.5" fill="currentColor" />
  </svg>
);

const ProblemSection: React.FC = () => {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-20 md:py-24">

      {/* Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <h2 className="font-serif text-4xl md:text-6xl text-stone-900 mb-6 tracking-tight font-normal">
          Why AI Engines are <br /><span className='italic text-stone-500'>Ghosting Your Brand</span>
        </h2>
        <p className="font-sans text-stone-500 text-lg leading-relaxed max-w-2xl">
          You’re publishing more than ever, yet your brand is nowhere to be found in ChatGPT, Perplexity, or Gemini. You aren’t just losing rankings; you’re losing the trust of the engines that control the answers.        </p>
      </div>

      {/* Problem Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 relative">

        {/* Item 1 */}
        <div className="flex flex-col gap-6 md:pr-10 md:border-r border-brand-200">
          <div className="mb-2">
            <DotGridIcon />
          </div>
          <div>
            <h3 className="font-sans text-2xl font-medium text-stone-900 mb-4 tracking-tight">
              Tracking your failure won't fix it
            </h3>
            <p className="font-sans text-stone-500 leading-relaxed">
              Knowing you are invisible in a "Visibility Tracker" is like weighing yourself every hour while you're starving. A scorecard doesn't tell you how to be found,it just confirms you’re being ignored while your competitors take the traffic.            </p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex flex-col gap-6 md:px-10 md:border-r border-brand-200">
          <div className="mb-2">
            <DotGridIcon />
          </div>
          <div>
            <h3 className="font-sans text-2xl font-medium text-stone-900 mb-4 tracking-tight">
              Your Authority has "Holes."
            </h3>
            <p className="font-sans text-stone-500 leading-relaxed">
              AI search engines ignore you because your topical coverage is incomplete. When a user asks a real question, the LLM spots a "semantic gap" in your content and recommends a competitor who sounds more like an expert. You’re a partial source in a world that only cites the "Guru".            </p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="flex flex-col gap-6 md:pl-10">
          <div className="mb-2">
            <DotGridIcon />
          </div>
          <div>
            <h3 className="font-sans text-2xl font-medium text-stone-900 mb-4 tracking-tight">
              Generic content is just background noise.
            </h3>
            <p className="font-sans text-stone-500 leading-relaxed">
              One-click AI articles that read like Wikipedia summaries are killing your growth. They have no unique data, no brand voice, and no "soul". LLMs spot generic bot-filler in 3 seconds and skip you for content that actually provides a real answer.            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ProblemSection;