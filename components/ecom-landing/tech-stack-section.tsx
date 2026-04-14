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

export default function TechStackSection() {
  const techItems = [
    {
      name: "Next.js & TypeScript",
      description:
        "The undisputed core for scalable, type-safe React applications. We provide the essential setup, you provide the genius.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="20" height="20" rx="2" stroke="#37322F" strokeWidth="1.5" fill="none" />
          <path d="M8 8L16 16M8 16L16 8" stroke="#37322F" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      name: "Supabase Auth & Database",
      description:
        "Your entire backend is handled. Secure user signups, logins, and protected routes are wired up out of the box. The database is ready for your schema.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="#37322F" strokeWidth="1.5" fill="none" />
          <path d="M9 9H15M9 12H15M9 15H12" stroke="#37322F" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      name: "Dodopayments",
      description:
        "A simple, developer-first payment system. We handle the basic integration for one-time payments. You just need to add your products.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="#37322F" strokeWidth="1.5" fill="none" />
          <path d="M2 10H22" stroke="#37322F" strokeWidth="1.5" />
          <circle cx="6" cy="15" r="1" fill="#37322F" />
        </svg>
      ),
    },
    {
      name: "Shadcn/UI & Tailwind CSS",
      description:
        "A beautiful, accessible component foundation that you own. Copy and paste components, style them as you wish. There's no complex component library to fight against. No vendor lock-in.",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#37322F" strokeWidth="1.5" fill="none" />
          <path d="M2 17L12 22L22 17" stroke="#37322F" strokeWidth="1.5" />
          <path d="M2 12L12 17L22 12" stroke="#37322F" strokeWidth="1.5" />
        </svg>
      ),
    },
  ]

  return (
    <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
      {/* Header Section */}
      <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
        <div className="w-full max-w-[616px] lg:w-[616px] px-4 sm:px-6 py-4 sm:py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4 shadow-none">
          <Badge
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="10" height="10" rx="1" stroke="#37322F" strokeWidth="1" fill="none" />
                <path d="M4 4L8 8M4 8L8 4" stroke="#37322F" strokeWidth="1" />
              </svg>
            }
            text="Tech Stack"
          />
          <div className="w-full max-w-[598.06px] lg:w-[598.06px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
            Just the Good Stuff. Zero Fluff.
          </div>
          <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
            The tech stack is modern, powerful, and intentionally lean. Every choice was made to maximize your control
            and minimize complexity.
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="self-stretch flex justify-center items-start">
        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          {/* Left decorative pattern */}
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 120 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              />
            ))}
          </div>
        </div>

        <div className="flex-1 border-l border-r border-[rgba(55,50,47,0.12)] p-6 sm:p-8 md:p-12 lg:p-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {techItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-6 border border-[rgba(55,50,47,0.08)] shadow-[0px_2px_4px_rgba(50,45,43,0.06)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#F7F5F3] rounded-lg flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[#37322F] text-lg font-semibold leading-tight font-sans mb-2">{item.name}</h3>
                      <p className="text-[#605A57] text-sm font-normal leading-relaxed font-sans">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          {/* Right decorative pattern */}
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 120 }).map((_, i) => (
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
