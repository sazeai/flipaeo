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

export default function ManifestoSection() {
  return (
    <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
      {/* Header Section */}
      <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[616px] lg:w-[616px] px-4 sm:px-6 py-4 sm:py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4 shadow-none">
          <Badge
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2L8 4L6 6L4 4L6 2Z" stroke="#37322F" strokeWidth="1" fill="none" />
                <path d="M6 6L8 8L6 10L4 8L6 6Z" stroke="#37322F" strokeWidth="1" fill="none" />
              </svg>
            }
            text="The Problem"
          />
          <div className="w-full max-w-[598.06px] lg:w-[598.06px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            Sound Familiar? You Found a "Time-Saving" Boilerplate...
          </div>
          <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
            And then you spent your first day as a code janitor.
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="self-stretch flex justify-center items-start">
        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          {/* Left decorative pattern */}
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              />
            ))}
          </div>
        </div>

        <div className="flex-1 border-l border-r border-[rgba(55,50,47,0.12)] p-6 sm:p-8 md:p-12 lg:p-16">
          <div className="max-w-4xl mx-auto">
            {/* Story Section */}
            <div className="mb-8 sm:mb-12">
              <p className="text-[#605A57] text-base sm:text-lg font-normal leading-relaxed font-sans mb-6">
                You're fired up about a new idea. You grab a popular boilerplate to get a head start. But your git log
                for day one looks like this:
              </p>

              {/* Git Log Visual */}
              <div className="bg-[#2F3037] rounded-lg p-4 sm:p-6 font-mono text-sm overflow-x-auto">
                <div className="space-y-2 text-white">
                  <div className="flex items-center gap-3">
                    <span className="text-red-400">❌</span>
                    <span className="text-gray-300">(feat): remove GraphQL and Apollo client</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400">❌</span>
                    <span className="text-gray-300">(refactor): rip out Redux/Zustand for my own state management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400">❌</span>
                    <span className="text-gray-300">(chore): delete 15 example pages and 80 components</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400">❌</span>
                    <span className="text-gray-300">
                      (fix): untangle a web of providers just to change the page title
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400">❌</span>
                    <span className="text-gray-300">
                      (style): fight the component library to change a simple button color
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conclusion */}
            <div className="text-center">
              <p className="text-[#49423D] text-lg sm:text-xl font-semibold leading-relaxed font-sans mb-4">
                The industry calls this a head start.
              </p>
              <p className="text-[#605A57] text-base sm:text-lg font-normal leading-relaxed font-sans">
                We call it technical debt before you've even written a feature.
              </p>
            </div>
          </div>
        </div>

        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          {/* Right decorative pattern */}
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 100 }).map((_, i) => (
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
