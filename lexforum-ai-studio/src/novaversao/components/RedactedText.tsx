import React from 'react';

/**
 * Visual redaction for /novaversao — same censorship boundary as the
 * production `CensoredText` (App.tsx): first ~40% of words visible, the
 * rest hidden. Only the rendering changes, from a flat black bar to a
 * pen-stroke mark (deterministic per chunk, no Math.random — see
 * .xdrs/_local/adrs/application/008-v5-redesign-rollout-path.md).
 *
 * Selective key-term marking (covering only argumentation-critical terms
 * instead of a position-based cutoff) is out of scope here — it requires
 * a change to the Gemini agent's response shape, tracked as a follow-up.
 */

const CHUNK_SIZES = [4, 6, 3, 5, 4, 7, 3];
const STROKE_ROT = [-1.6, 1.0, -0.6, 1.4, -1.1, 0.5, -1.8, 1.2];

// Small seeded PRNG (mulberry32) — deterministic per chunk, stable across
// re-renders and between server/client, unlike Math.random().
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scribblePath(seed: number, nStrokes: number): string[] {
  const rng = mulberry32(seed);
  const uniform = (min: number, max: number) => min + rng() * (max - min);
  const W = 200;
  const H = 54;
  const bandH = (H / nStrokes) * 1.55;
  const paths: string[] = [];
  for (let i = 0; i < nStrokes; i++) {
    const y = nStrokes > 1 ? (H - bandH) * (i / (nStrokes - 1)) + bandH / 2 : H / 2;
    const x0 = -uniform(5, 16);
    const xm = W * uniform(0.38, 0.6);
    const x1 = W + uniform(5, 16);
    const y0 = y + uniform(-3, 3);
    const ym = y + uniform(-4, 4);
    const y1 = y + uniform(-3, 3);
    const rot = uniform(-2.4, 2.4);
    const sw = bandH * uniform(0.88, 1.05);
    const op = uniform(0.88, 1.0);
    const d = `M ${x0.toFixed(1)},${y0.toFixed(1)} Q ${xm.toFixed(1)},${ym.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    paths.push(
      `<path d="${d}" stroke-width="${sw.toFixed(1)}" opacity="${op.toFixed(2)}" transform="rotate(${rot.toFixed(1)} ${(W / 2).toFixed(1)} ${y.toFixed(1)})"/>`
    );
  }
  return paths;
}

function ScribbleMark({ seed, nStrokes }: { seed: number; nStrokes: number }) {
  const paths = scribblePath(seed, nStrokes);
  return (
    <svg
      className="nv-redact-mark"
      viewBox="0 0 200 54"
      preserveAspectRatio="none"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: paths.join('') }}
    />
  );
}

interface RedactedTextProps {
  text: string;
  enabled: boolean;
  seed?: number;
}

export const RedactedText: React.FC<RedactedTextProps> = ({ text, enabled, seed = 0 }) => {
  if (!enabled || !text) return <>{text}</>;

  const words = text.split(' ');
  const visibleCount = Math.ceil(words.length * 0.4);
  const visibleText = words.slice(0, visibleCount).join(' ');
  const hiddenWords = words.slice(visibleCount);

  const result: React.ReactNode[] = [];
  if (visibleText) result.push(<span key="visible">{visibleText} </span>);

  let i = 0;
  let ci = 0;
  while (i < hiddenWords.length) {
    const size = CHUNK_SIZES[ci % CHUNK_SIZES.length];
    const chunk = hiddenWords.slice(i, i + size).join(' ');
    if (chunk) {
      const k = seed + ci;
      const rot = STROKE_ROT[k % STROKE_ROT.length];
      const nStrokes = chunk.length > 10 ? 3 : 2;
      result.push(
        <span
          key={`c-${i}`}
          className="nv-redact"
          style={{ transform: `rotate(${rot}deg)` }}
          role="img"
          aria-label="trecho bloqueado"
        >
          <span className="nv-redact-fill">{chunk}</span>
          <ScribbleMark seed={seed * 97 + ci * 13 + 3} nStrokes={nStrokes} />
        </span>
      );
    }
    i += size;
    ci++;
  }

  return <>{result}</>;
};
