
import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { Twitter, Linkedin, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#D6F5F2] border-t-2 border-black py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">

          {/* Left: Logo & Description */}
          <div className="flex-shrink-0 max-w-xs">
            <Logo />
            <p className="font-sans text-sm text-gray-600 mt-4">
              Strategic Content Engine for Generative Engine Optimization. Win the AI search race.
            </p>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex flex-wrap gap-12">
            {/* Product Links */}
            <div>
              <h4 className="font-display font-bold text-sm uppercase tracking-wide mb-4">Product</h4>
              <nav className="flex flex-col gap-2">
                <FooterLink href="/#benefits" label="Benefits" />
                <FooterLink href="/#how-it-works" label="How it Works" />
                <FooterLink href="/#pricing" label="Pricing" />
              </nav>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-display font-bold text-sm uppercase tracking-wide mb-4">Legal</h4>
              <nav className="flex flex-col gap-2">
                <FooterLink href="/privacy-policy" label="Privacy Policy" />
                <FooterLink href="/terms" label="Terms of Service" />
                <FooterLink href="/refund-policy" label="Refund Policy" />
              </nav>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-display font-bold text-sm uppercase tracking-wide mb-4">Company</h4>
              <nav className="flex flex-col gap-2">
                <FooterLink href="/about" label="About Us" />
                <FooterLink href="/blog" label="Blog" />
                <FooterLink href="mailto:support@flipaeo.com" label="Contact" />
              </nav>
            </div>
          </div>

          {/* Right: Social Icons */}
          <div className="flex items-center gap-4">
            <SocialIcon href="https://twitter.com/flipaeo" icon={<Twitter className="w-5 h-5" />} />
            <SocialIcon href="https://linkedin.com/company/flipaeo" icon={<Linkedin className="w-5 h-5" />} />
            <SocialIcon href="mailto:support@flipaeo.com" icon={<Mail className="w-5 h-5" />} />
          </div>

        </div>

        {/* Bottom: Copyright */}
        <div className="border-t-2 border-black/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-sans text-sm text-gray-600">
            © {new Date().getFullYear()} FlipAEO. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privacy-policy" className="text-gray-600 hover:text-black transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-black transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink: React.FC<{ href: string; label: string }> = ({ href, label }) => (
  <Link href={href} className="font-sans text-sm text-gray-600 hover:text-black hover:underline decoration-2 underline-offset-4 transition-colors">
    {label}
  </Link>
);

const SocialIcon: React.FC<{ href: string; icon: React.ReactNode }> = ({ href, icon }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-brand-yellow border-2 border-black rounded-full flex items-center justify-center hover:-translate-y-1 hover:shadow-neo-sm transition-all duration-200 text-black">
    {icon}
  </a>
);
