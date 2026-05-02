import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="w-full bg-[#F9F8F7] relative z-10 font-sans">
      <div className="w-full max-w-[1400px] mx-auto border-x border-[rgba(55,50,47,0.12)] relative bg-[#F9F8F7]">

        {/* Simplified Grid Footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-t border-[rgba(55,50,47,0.12)] relative">

          {/* Brand Section */}
          <div className="md:col-span-4 p-8 md:p-12 lg:p-16 md:border-r border-[rgba(55,50,47,0.12)]">
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FAFAFA] border border-[rgba(55,50,47,0.08)] transition-transform hover:scale-105 group p-1.5">
                <Image src="/ecompin-logo.svg" alt="logo" width={50} height={50} className="w-20 h-20" />
              </div>
              <span className="font-serif text-[1.4rem] tracking-tighter font-medium text-[#111]">EcomPin</span>
            </div>
            <p className="text-[14px] text-[#888] leading-[1.6]">
              The visual marketing engine for physical product brands.
            </p>
          </div>

          {/* Links Sections */}
          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-2 gap-8 p-8 md:p-12 lg:p-16">
            <div className="flex flex-col gap-4">
              <h4 className="font-serif text-[14px] text-[#111]">Product</h4>
              <ul className="flex flex-col gap-2">
                <li><Link href="/#how-it-works" className="text-[13px] text-[#888] hover:text-[#111] transition-colors">How it Works</Link></li>
                <li><Link href="/#showcase" className="text-[13px] text-[#888] hover:text-[#111] transition-colors">Showcase</Link></li>
                <li><Link href="/pricing" className="text-[13px] text-[#888] hover:text-[#111] transition-colors">Pricing</Link></li>
                <li><Link href="/login" className="text-[13px] text-[#888] hover:text-[#111] transition-colors">Log in</Link></li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-serif text-[14px] text-[#111]">Legal</h4>
              <ul className="flex flex-col gap-2">
                <li><Link href="/privacy-policy" className="text-[13px] text-[#888] hover:text-[#111] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-[13px] text-[#888] hover:text-[#111] transition-colors">Terms of Service</Link></li>
                <li><Link href="/refund-policy" className="text-[13px] text-[#888] hover:text-[#111] transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[rgba(55,50,47,0.12)] p-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6 bg-[#F9F8F7]">
          <div className="text-[11px] font-mono text-[#AAA] tracking-tight">
            © 2026 EcomPin
          </div>

          <div className="flex items-center gap-2 px-4 py-1.5 bg-white border border-[rgba(55,50,47,0.06)] rounded-full">
            <div className="w-1.5 h-1.5 bg-[#00A67E] rounded-full animate-pulse"></div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#555]">All Systems Online</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
