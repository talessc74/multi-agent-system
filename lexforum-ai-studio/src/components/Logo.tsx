import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTitle?: boolean;
  variant?: 'dark' | 'light';
}

export function Logo({ className = "", size = 'md', showText = true, showTitle = true, variant = 'dark' }: LogoProps) {
  const sizes = {
    sm: { text: 'text-xl', sub: 'text-[5px]' },
    md: { text: 'text-2xl', sub: 'text-[7px]' },
    lg: { text: 'text-4xl', sub: 'text-[9px]' },
    xl: { text: 'text-7xl', sub: 'text-[12px]' },
  };

  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center ${showText ? 'gap-3' : 'gap-0'} ${className}`}>
      <div className="flex items-center">
        <span className={`${sizes[size].text} font-playfair font-bold leading-none tracking-tighter`} style={{ color: 'var(--text-primary)' }}>
          EAI
        </span>
        <span className={`${sizes[size].text} font-playfair font-bold leading-none`} style={{ color: 'var(--accent)' }}>
          ✓?
        </span>
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
