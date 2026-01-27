import React from 'react';
import Button from './Button';
import Link from 'next/link';

const CTASection: React.FC = () => {
  return (
    <section className="w-full py-12 md:py-24 flex flex-col items-center justify-center relative px-6 mb-32 md:mb-48">

      <h2 className="font-serif text-xl md:text-5xl text-stone-900 mb-16 tracking-tight font-normal text-center">
        My Competitors Are Already Ranking
      </h2>

      <div className="relative group">

        {/* The Main Button */}
        <div className="relative z-10">
          <Link href="/login">
            <Button
              variant="primary"
              className="text-3xl md:text-5xl px-6 py-4 md:px-40 md:py-10 rounded-xl"

            >
              <div className="flex items-center gap-2 md:gap-6">
                {/* Custom Keycap for "Press B" */}
                <span className="text-brand-800 font-medium tracking-tight">Help</span>
                <div className="flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-brand-500 rounded-lg border-b-4 border-brand-800 shadow-inner text-white leading-none transform translate-y-0.5">
                  <span className="text-lg md:text-xl font-semibold">Me</span>
                </div>

                <span className="text-brand-800 font-medium tracking-tight">Grow my Brand</span>
              </div>
            </Button>
          </Link>
        </div>

        {/* 
            Handwritten Annotations 
            - Using Absolute Positioning relative to the button container
            - Hidden on mobile to preserve layout integrity
         */}
        <div className="absolute inset-0 pointer-events-none">

          {/* 1. Top Left: Land more clients */}
          <div className="absolute -top-14 sm:-top-8 -left-[120px] sm:-left-[200px] w-48 flex flex-col items-end">
            <span className="font-hand text-[14px] sm:text-2xl text-stone-500 mb-1 -rotate-6 leading-none">Get cited by <br />ChatGPT & Gemini</span>
            <span className="text-stone-500 rotate-180">
              <svg className="w-[20px] h-[22px] sm:w-[39px] sm:h-[43px]" viewBox="0 0 39 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M35.3098 41.3831C38.805 33.6161 39.7653 17.8871 22.106 16.5287C12.0089 15.752 15.1157 28.9559 24.4361 27.4025C32.203 26.108 39.5817 5.6549 1.52344 4.1015M1.52344 4.1015L4.63023 7.59665M1.52344 4.1015L5.40693 1.38305" stroke="#767676ff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          {/* 2. Top Right: Outsource your work */}
          <div className="absolute -top-14 sm:-top-8 -right-[120px] sm:-right-[200px] w-48 flex flex-col items-start">
            <span className="font-hand text-[14px] sm:text-2xl text-stone-500 mb-1 rotate-6 leading-none">Become the AI's <br />'Source of Truth'</span>
            <span className="text-stone-500 rotate-x-180">
              <svg className="w-[20px] h-[22px] sm:w-[39px] sm:h-[43px]" viewBox="0 0 39 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M35.3098 41.3831C38.805 33.6161 39.7653 17.8871 22.106 16.5287C12.0089 15.752 15.1157 28.9559 24.4361 27.4025C32.203 26.108 39.5817 5.6549 1.52344 4.1015M1.52344 4.1015L4.63023 7.59665M1.52344 4.1015L5.40693 1.38305" stroke="#767676ff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          {/* 3. Bottom Left: Affordable design... */}
          <div className="absolute top-[110%] -left-[70px] sm:-left-[110px] w-56 flex flex-col items-center">
            <span className="text-stone-500 rotate-90">
              <svg className="w-[20px] h-[22px] sm:w-[39px] sm:h-[43px]" viewBox="0 0 39 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M35.3098 41.3831C38.805 33.6161 39.7653 17.8871 22.106 16.5287C12.0089 15.752 15.1157 28.9559 24.4361 27.4025C32.203 26.108 39.5817 5.6549 1.52344 4.1015M1.52344 4.1015L4.63023 7.59665M1.52344 4.1015L5.40693 1.38305" stroke="#767676ff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-hand text-[14px] sm:text-2xl text-stone-500 leading-none text-center">
              Capture high-intent <br /> AI traffic
            </span>
          </div>

          {/* 4. Bottom Center: Make money on autopilot */}
          <div className="absolute top-[110%] left-1/2 -translate-x-1/2 w-56 flex flex-col items-center">
            <span className="text-stone-500 ">
              <svg className="w-[8px] h-[26px] sm:w-[16px] sm:h-[52px]" viewBox="0 0 16 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 51C7 51.5523 7.44772 52 8 52C8.55229 52 9 51.5523 9 51L7 51ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 51L9 1L7 1L7 51L9 51Z" fill="#767676ff" />
              </svg>

            </span>
            <span className="font-hand text-[14px] sm:text-2xl text-center text-stone-500 leading-none">Publish content <br /> on autopilot</span>
          </div>

          {/* 5. Bottom Right: Increase conversion */}
          <div className="absolute top-[110%] -right-[70px] sm:-right-[110px] w-56 flex flex-col items-center">
            <span className="text-stone-500 -scale-x-100 -rotate-90">
              <svg className="w-[20px] h-[22px] sm:w-[39px] sm:h-[43px]" viewBox="0 0 39 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M35.3098 41.3831C38.805 33.6161 39.7653 17.8871 22.106 16.5287C12.0089 15.752 15.1157 28.9559 24.4361 27.4025C32.203 26.108 39.5817 5.6549 1.52344 4.1015M1.52344 4.1015L4.63023 7.59665M1.52344 4.1015L5.40693 1.38305" stroke="#767676ff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-hand text-[14px] sm:text-2xl text-stone-500 leading-none text-center">
              Future-proof your <br />SEO
            </span>
          </div>

        </div>

        {/* SVG Marker Definition */}
        <svg className="absolute w-0 h-0">
          <defs>
            <marker id="arrowhead" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
              <path d="M2,2 L10,6 L2,10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>
        </svg>

      </div>


    </section>
  );
};

export default CTASection;