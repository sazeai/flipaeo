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

export default function SolutionSection() {
  return (
    <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
      {/* Header Section */}
      <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[616px] lg:w-[616px] px-4 sm:px-6 py-4 sm:py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4 shadow-none">
          <Badge
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6" cy="6" r="5" stroke="#37322F" strokeWidth="1" fill="none" />
                <path d="M4 6L5.5 7.5L8 4.5" stroke="#37322F" strokeWidth="1" fill="none" />
              </svg>
            }
            text="The Solution"
          />
          <div className="w-full max-w-[598.06px] lg:w-[598.06px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            Go from zero to running in 3 minutes.
          </div>
          <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
            This isn't an exaggeration. This is the entire setup process.
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="self-stretch flex justify-center items-start">
        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          {/* Left decorative pattern */}
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 150 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              />
            ))}
          </div>
        </div>

        <div className="flex-1 border-l border-r border-[rgba(55,50,47,0.12)] p-6 sm:p-8 md:p-12 lg:p-16">
          <div className="max-w-4xl mx-auto">
            {/* Steps */}
            <div className="space-y-8 sm:space-y-12">
              {/* Step 1 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#37322F] text-white rounded-full flex items-center justify-center text-sm font-semibold font-sans">
                    1
                  </div>
                  <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                    Clone the Repo
                  </h3>
                </div>
                <p className="text-[#605A57] text-base font-normal leading-relaxed font-sans ml-11">
                  Get a clean, local copy of the codebase. No complex installers.
                </p>
                <div className="ml-11">
                  <div className="bg-[#2F3037] rounded-lg p-4 sm:p-6 font-mono text-sm overflow-x-auto">
                    <div className="text-green-400 mb-2">$ git clone [your-repo-url] my-new-app</div>
                    <div className="text-gray-300">Cloning into 'my-new-app'...</div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#37322F] text-white rounded-full flex items-center justify-center text-sm font-semibold font-sans">
                    2
                  </div>
                  <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                    Add Your Keys
                  </h3>
                </div>
                <p className="text-[#605A57] text-base font-normal leading-relaxed font-sans ml-11">
                  Open the .env.local.example file, rename it, and paste in your credentials.
                </p>
                <div className="ml-11">
                  <div className="bg-[#2F3037] rounded-lg p-4 sm:p-6 font-mono text-sm overflow-x-auto">
                    <div className="text-gray-400 mb-2"># .env.local</div>
                    <div className="text-blue-300">
                      SUPABASE_URL=<span className="text-yellow-300">"..."</span>
                    </div>
                    <div className="text-blue-300">
                      SUPABASE_ANON_KEY=<span className="text-yellow-300">"..."</span>
                    </div>
                    <div className="text-blue-300">
                      DODOPAYMENTS_SECRET_KEY=<span className="text-yellow-300">"..."</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#37322F] text-white rounded-full flex items-center justify-center text-sm font-semibold font-sans">
                    3
                  </div>
                  <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                    Run the Dev Server
                  </h3>
                </div>
                <p className="text-[#605A57] text-base font-normal leading-relaxed font-sans ml-11">
                  That's it. Your new app is running locally.
                </p>
                <div className="ml-11">
                  <div className="bg-[#2F3037] rounded-lg p-4 sm:p-6 font-mono text-sm overflow-x-auto">
                    <div className="text-green-400 mb-2">$ npm run dev</div>
                    <div className="text-green-300">✓ Ready in 2.3s</div>
                    <div className="text-green-300">✓ Auth configured</div>
                    <div className="text-green-300">✓ Payments ready</div>
                    <div className="text-blue-300">➜ Local: http://localhost:3000</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conclusion */}
            <div className="text-center mt-12 sm:mt-16">
              <p className="text-[#49423D] text-lg sm:text-xl font-semibold leading-relaxed font-sans">
                That's it. Your new app is running locally with a database, authentication, and payments ready to go.
              </p>
            </div>
          </div>
        </div>

        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          {/* Right decorative pattern */}
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 150 }).map((_, i) => (
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
