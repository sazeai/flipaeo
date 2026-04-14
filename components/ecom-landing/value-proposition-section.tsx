import type React from "react"

// Reusable Badge Component
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)] shadow-xs">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

export default function ValuePropositionSection() {
  return (
    <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
      {/* Header Section */}
      <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[616px] lg:w-[616px] px-4 sm:px-6 py-4 sm:py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4 shadow-none">
          <Badge
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 1L8 3L6 5L4 3L6 1Z" stroke="#37322F" strokeWidth="1" fill="none" />
                <path d="M6 7L8 9L6 11L4 9L6 7Z" stroke="#37322F" strokeWidth="1" fill="none" />
                <path d="M6 5V7" stroke="#37322F" strokeWidth="1" />
              </svg>
            }
            text="The Value"
          />
          <div className="w-full max-w-[598.06px] lg:w-[598.06px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            This Boilerplate Isn't for People Who Can't Build It. It's for People Who Won't.
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="self-stretch flex justify-center items-start">
        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          {/* Left decorative pattern */}
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 140 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              />
            ))}
          </div>
        </div>

        <div className="flex-1 border-l border-r border-[rgba(55,50,47,0.12)] p-6 sm:p-8 md:p-12 lg:p-16">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <p className="text-[#605A57] text-base sm:text-lg font-normal leading-relaxed font-sans">
              You don't pay for this boilerplate because you lack the skill.
            </p>

            <p className="text-[#605A57] text-base sm:text-lg font-normal leading-relaxed font-sans">
              You pay for it because your time is worth more than the cost of reinventing the wheel.
            </p>

            <p className="text-[#605A57] text-base sm:text-lg font-normal leading-relaxed font-sans">
              You pay for it because your creative energy is finite and should be spent on your product's unique
              features, not on boilerplate code.
            </p>

            <p className="text-[#605A57] text-base sm:text-lg font-normal leading-relaxed font-sans">
              You pay for it because you know that the difference between a shipped project and a dead one is momentum.
            </p>

            <div className="bg-white rounded-lg p-6 sm:p-8 border border-[rgba(55,50,47,0.08)] shadow-[0px_2px_4px_rgba(50,45,43,0.06)]">
              <p className="text-[#49423D] text-lg sm:text-xl font-semibold leading-relaxed font-sans mb-4">
                This isn't a shortcut for beginners. It's an accelerator for professionals.
              </p>

              <p className="text-[#605A57] text-base sm:text-lg font-normal leading-relaxed font-sans mb-4">
                It's for the developer who understands that the real challenge isn't connecting APIs; it's staying
                focused long enough to bring an idea to life.
              </p>
            </div>

            <div className="text-center pt-4">
              <p className="text-[#49423D] text-lg sm:text-xl font-semibold leading-relaxed font-sans mb-2">
                For $25, you don't buy a folder of code.
              </p>
              <p className="text-[#605A57] text-base sm:text-lg font-normal leading-relaxed font-sans">
                You buy back your Saturday. You buy back your momentum. You buy a direct path to line one of your idea.
              </p>
            </div>
          </div>
        </div>

        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          {/* Right decorative pattern */}
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 140 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
