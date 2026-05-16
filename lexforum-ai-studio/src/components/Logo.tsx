import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTitle?: boolean;
  variant?: 'dark' | 'light';
}

export function Logo({ className = "", size = 'md', showText = true, showTitle = true, variant = 'dark' }: LogoProps) {
  const sizes = {
    sm: { h: 'h-5', text: 'text-xl', sub: 'text-[5px]' },
    md: { h: 'h-6', text: 'text-2xl', sub: 'text-[7px]' },
    lg: { h: 'h-10', text: 'text-4xl', sub: 'text-[9px]' },
    xl: { h: 'h-20', text: 'text-7xl', sub: 'text-[12px]' },
  };

  const isDark = variant === 'dark';
  
  // Custom SVG for the "✓?" glyphs
  const Glyph = () => (
    <svg 
      viewBox="0 0 160 100" 
      className={`${sizes[size].h} w-auto overflow-visible ml-1`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* The Checkmark "✓" */}
      <motion.path 
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        d="M15 45L40 70L80 15" 
        stroke={isDark ? "#00F2FF" : "#FF9900"} 
        strokeWidth="14" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        filter={isDark || !isDark ? "url(#glow)" : ""}
      />
      
      {/* Question Mark Base */}
      <path 
        d="M105 30C105 15 115 10 125 10C135 10 145 15 145 30C145 45 135 50 130 55C125 60 125 65 125 70" 
        stroke={isDark ? "#00F2FF" : "#FF9900"} 
        strokeWidth="14" 
        strokeLinecap="round"
        filter={isDark || !isDark ? "url(#glow)" : ""}
      />
      
      {/* Dot of Question Mark */}
      <circle 
        cx="125" cy="90" r="8" 
        fill={isDark ? "#00F2FF" : "#FF9900"}
        filter={isDark || !isDark ? "url(#glow)" : ""}
      />
    </svg>
  );

  return (
    <div className={`flex items-center ${showText ? 'gap-3' : 'gap-0'} ${className}`}>
      <div className="relative flex items-center justify-center">
        <span className={`${sizes[size].text} font-bold tracking-tighter ${isDark ? 'text-[#00F2FF]' : 'text-slate-900'} font-sans leading-none`}>
          EAI
        </span>
        <Glyph />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          {showTitle && (
            <span className={`${sizes[size].text} font-serif italic tracking-tight uppercase font-bold ${isDark ? 'text-white' : 'text-slate-900'} leading-none`}>
              EAI?
            </span>
          )}
          <span className={`${sizes[size].sub} uppercase tracking-[0.2em] font-bold ${isDark ? 'text-white/40' : 'text-slate-500'} mt-1 whitespace-nowrap`}>
            Evidence-Based Artificial Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
