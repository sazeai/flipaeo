import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#F9F8F7] relative z-10 font-sans">
      <div className="w-full max-w-[1400px] mx-auto border-x border-[rgba(55,50,47,0.12)] relative bg-[#F9F8F7]">
        
        {/* Simplified Grid Footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-t border-[rgba(55,50,47,0.12)] relative">
          
          {/* Brand Section */}
          <div className="md:col-span-4 p-8 md:p-12 lg:p-16 md:border-r border-[rgba(55,50,47,0.12)]">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#111] flex items-center justify-center text-white text-[10px] font-mono tracking-tighter">
                EP
              </div>
              <span className="font-serif text-[1.4rem] tracking-tighter font-medium text-[#111]">EcomPin</span>
            </div>
            <p className="text-[14px] text-[#888] leading-[1.6]">
              The visual marketing engine for physical product brands.
            </p>
          </div>

          {/* Links Sections */}
          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8 p-8 md:p-12 lg:p-16">
            <div className="flex flex-col gap-4">
              <h4 className="font-serif text-[14px] text-[#111]">Product</h4>
              <ul className="flex flex-col gap-2">
                <li><a href="#" className="text-[13px] text-[#888] hover:text-[#111]">Pricing</a></li>
                <li><a href="#" className="text-[13px] text-[#888] hover:text-[#111]">Features</a></li>
                <li><a href="#" className="text-[13px] text-[#888] hover:text-[#111]">Demo</a></li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-4">
              <h4 className="font-serif text-[14px] text-[#111]">Company</h4>
              <ul className="flex flex-col gap-2">
                <li><a href="#" className="text-[13px] text-[#888] hover:text-[#111]">About</a></li>
                <li><a href="#" className="text-[13px] text-[#888] hover:text-[#111]">Contact</a></li>
                <li><a href="#" className="text-[13px] text-[#888] hover:text-[#111]">Careers</a></li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-serif text-[14px] text-[#111]">Legal</h4>
              <ul className="flex flex-col gap-2">
                <li><a href="#" className="text-[13px] text-[#888] hover:text-[#111]">Privacy</a></li>
                <li><a href="#" className="text-[13px] text-[#888] hover:text-[#111]">Terms</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[rgba(55,50,47,0.12)] p-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6 bg-[#F9F8F7]">
          <div className="text-[11px] font-mono text-[#AAA] tracking-tight">
            © 2026 EcomPin BV • KVK: 97074756
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
