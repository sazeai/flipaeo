import React from 'react';
import Link from 'next/link';

const LogoIcon = ({ className = "text-black" }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Premium geometric frame */}
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="2 2" />
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />

    {/* Core nodes */}
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <circle cx="12" cy="4.5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="19.5" r="1.5" fill="currentColor" />
    <circle cx="4.5" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19.5" cy="12" r="1.5" fill="currentColor" />

    {/* Connectors */}
    <path d="M12 7V9.5M12 14.5V17M7 12H9.5M14.5 12H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function Navbar() {
  return (
    <nav className="absolute top-8 z-50 flex items-center justify-center w-full">
      {/* Background horizontal line */}
      <div className="absolute left-0 w-full h-[1px] top-1/2 -translate-y-1/2 bg-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white] -z-10 "></div>

      <div className="flex items-center bg-[#EFEFEF]/80 backdrop-blur-md px-2 py-2 rounded-full border border-black/5">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FAFAFA] border border-[rgba(55,50,47,0.08)] transition-transform hover:scale-105 group mr-1 sm:mr-3">
          <LogoIcon className="w-5 h-5 text-[#111] group-hover:text-black transition-colors" />
        </Link>

        {/* Links */}
        <div className="flex items-center gap-4 md:gap-6 px-2 md:px-4 text-[13px] font-medium text-[#555]">
          <Link href="/#how-it-works" className="hidden md:flex hover:text-[#111] transition-colors">How it Works</Link>
          <Link href="/#showcase" className="hover:text-[#111] transition-colors">Showcase</Link>
          <Link href="/pricing" className="hover:text-[#111] transition-colors">Pricing</Link>
          <Link href="/blog" className="hover:text-[#111] transition-colors">Blog</Link>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-[1px] h-4 bg-[rgba(55,50,47,0.12)] mx-3"></div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">

          <Link
            href="/login"
            className="text-[13px] font-medium text-white bg-[#111] hover:bg-black px-4 py-2 sm:py-2.5 rounded-full transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
          >
            Get Started

          </Link>
        </div>

      </div>
    </nav>
  );
}
