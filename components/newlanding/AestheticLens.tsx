'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import Image from 'next/image';

interface LensFrameProps {
  rawImage: string;
  lifestyleImage: string;
  title: string;
  board: string;
  scrollYProgress: any;
  index: number;
}

function LensFrame({ rawImage, lifestyleImage, title, board, scrollYProgress, index }: LensFrameProps) {
  // Stagger the animations slightly based on index
  const start = 0.1 + (index * 0.1);
  const end = 0.4 + (index * 0.1);

  // 1. The Magic Window (Pin Frame) sliding up
  const frameY = useTransform(scrollYProgress, [start, end], ["100%", "0%"]);
  const imageY = useTransform(scrollYProgress, [start, end], ["-100%", "0%"]);
  const scannerOpacity = useTransform(scrollYProgress, [end - 0.05, end], [1, 0]);

  return (
    <div className="relative w-full h-full z-10 shrink-0 overflow-hidden bg-white">
      {/* State 1: Raw Reality (Static Background) */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={rawImage}
          fill
          className="object-cover"
          alt="Raw Product"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* State 2: Magic Window (Sliding Frame) */}
      <motion.div
        style={{ y: frameY }}
        className="absolute inset-0 overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.1)] border-t border-[rgba(55,50,47,0.1)] z-10"
      >
        {/* Counter-translated Lifestyle Image */}
        <motion.div style={{ y: imageY }} className="absolute inset-0">
          <Image
            src={lifestyleImage}
            fill
            className="object-cover"
            alt="Lifestyle Transformation"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Leading Edge Scanner Line */}
        <motion.div
          style={{ opacity: scannerOpacity }}
          className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_15px_3px_rgba(255,255,255,0.7)] z-20"
        />
      </motion.div>
    </div>
  );
}

export default function AestheticLens() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const frames = [
    {
      rawImage: "https://pub-ce176698d5924cc7b0e437dc2d7e09e1.r2.dev/user-uploads/42868219-1f23-4834-9c13-09e987e069dd/1776255787094-pceq41vac8n.jpg",
      lifestyleImage: "https://pub-a387be9b4cf24ef9bf157de685582222.r2.dev/pin-images/42868219-1f23-4834-9c13-09e987e069dd/128fbc6b-f568-4e63-94fb-f2c5b4199b5c-raw.png",
      title: "Minimalist Leather Tote",
      board: "Autumn Aesthetics",
      step: "01"
    },
    {
      rawImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
      lifestyleImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
      title: "Premium Headphones",
      board: "Tech Essentials",
      step: "02"
    },
    {
      rawImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
      lifestyleImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop",
      title: "Crimson Running Shoes",
      board: "Urban Active",
      step: "03"
    }
  ];

  return (
    <div ref={containerRef} className="relative w-full h-[300vh]">
      <div className="sticky top-0 w-full flex items-center justify-center overflow-hidden">

        {/* Enterprise Grid Container */}
        <div className="w-full max-w-[1400px] mx-auto">


          <div className="w-full grid grid-cols-1 md:grid-cols-3 border border-[rgba(55,50,47,0.12)] bg-[#FAFAFA]">
            {frames.map((frame, i) => (
              <div
                key={i}
                className={`relative flex flex-col ${i !== 2 ? 'border-b md:border-b-0 md:border-r border-[rgba(55,50,47,0.12)]' : ''} ${i !== 0 ? 'hidden md:flex' : 'flex'}`}
              >
                {/* Lens Frame */}
                <div className="w-full aspect-[3/4] md:aspect-auto md:h-[60vh] md:min-h-[500px]">
                  <LensFrame
                    {...frame}
                    scrollYProgress={scrollYProgress}
                    index={i}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

