import { useEffect, useRef, useState } from 'react';

/**
 * Perceived ticker speed is px/s, not animation-duration — a wide track
 * needs a longer duration to look the same speed as a narrow one. Measures
 * the track (which renders the item list twice back-to-back) and derives
 * duration from half its width, so translateX(-50%) always loops at a
 * constant ~pxPerSecond regardless of content length or viewport.
 * See BRIEFING_REDESIGN_V5_HANDOFF.md §8.5.
 */
export function useTickerSpeed(pxPerSecond: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      const halfWidth = el.scrollWidth / 2;
      if (halfWidth > 0) setDuration(halfWidth / pxPerSecond);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pxPerSecond]);

  return { trackRef, duration };
}
