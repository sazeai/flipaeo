'use client';

import React from 'react';
import { motion, Variants } from 'motion/react';

interface StaggerRevealProps {
  children: React.ReactNode;
  className?: string;
}

export default function StaggerReveal({ children, className = '' }: StaggerRevealProps) {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12, // Slight delay between each paragraph
        delayChildren: 0.1,
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 25 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 80, 
        damping: 20, 
        mass: 1 
      } 
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px 0px" }}
      className={className}
    >
      {React.Children.map(children, (child, index) => {
        // Skip null/undefined children
        if (!React.isValidElement(child)) return child;
        
        return (
          <motion.div key={index} variants={item}>
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
