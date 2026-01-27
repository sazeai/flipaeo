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
          One-click AI content is <br /><span className='italic text-stone-500'>killing your growth</span>
        </h2>
        <p className="font-sans text-stone-500 text-lg leading-relaxed max-w-2xl">
          You’re publishing more than ever, yet traffic stays flat. Modern search engines can tell the difference between real answers and mass-produced content.
        </p>
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
              AI Search Ignores you
            </h3>
            <p className="font-sans text-stone-500 leading-relaxed">
              You publish dozens of articles. AI search still doesn’t recognize your brand. When people ask real questions in your category, AI recommends competitors - not YOU.
            </p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex flex-col gap-6 md:px-10 md:border-r border-brand-200">
          <div className="mb-2">
            <DotGridIcon />
          </div>
          <div>
            <h3 className="font-sans text-2xl font-medium text-stone-900 mb-4 tracking-tight">
              You sound like a bot
            </h3>
            <p className="font-sans text-stone-500 leading-relaxed">
              Modern AI Search engines & LLMs spot generic AI content in 3 seconds. It has no brand voice, no unique data, and no soul. It doesn't build authority; it just adds to the noise.
            </p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="flex flex-col gap-6 md:pl-10">
          <div className="mb-2">
            <DotGridIcon />
          </div>
          <div>
            <h3 className="font-sans text-2xl font-medium text-stone-900 mb-4 tracking-tight">
              Impressions? Zero clicks
            </h3>
            <p className="font-sans text-stone-500 leading-relaxed">
              You rank for keywords that don’t move the business. Without real visibility data guiding the roadmap, you’re guessing while competitors own the answers.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ProblemSection;