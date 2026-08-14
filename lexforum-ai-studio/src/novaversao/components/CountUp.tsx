import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  decimals?: number;
  suffix?: string;
}

const fmt = (n: number, decimals: number) =>
  decimals > 0
    ? n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(n).toLocaleString('pt-BR');

/**
 * The final value is what's in the DOM on first render — JS only animates
 * the climb up to it once the element enters the viewport. If JS never
 * runs, or IntersectionObserver isn't supported, the correct number is
 * already there. See BRIEFING_REDESIGN_V5_HANDOFF.md §10.3.
 */
export const CountUp: React.FC<CountUpProps> = ({ value, decimals = 0, suffix = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    let raf = 0;
    const animate = () => {
      const duration = 1400;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(value * eased);
        if (t < 1) raf = requestAnimationFrame(step);
        else setDisplay(value);
      };
      raf = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    setDisplay(0);
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref}>
      {fmt(display, decimals)}
      {suffix}
    </span>
  );
};
