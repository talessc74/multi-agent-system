import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RedactedText } from '../novaversao/components/RedactedText';

const TEXT =
  'O autor exerceu suas funções por três anos consecutivos cumprindo jornada habitual de horas extras que jamais foram quitadas ou compensadas em banco de horas conforme demonstra o conjunto de mensagens e escalas anexadas';

describe('RedactedText', () => {
  it('renders the full text unredacted when disabled — matches production CensoredText', () => {
    const { container } = render(<RedactedText text={TEXT} enabled={false} />);
    expect(container.textContent).toBe(TEXT);
    expect(container.querySelectorAll('.nv-redact').length).toBe(0);
  });

  it('shows roughly the first 40% of words and hides the rest, same boundary as CensoredText', () => {
    const { container } = render(<RedactedText text={TEXT} enabled seed={0} />);
    const words = TEXT.split(' ');
    const expectedVisibleCount = Math.ceil(words.length * 0.4);
    const visibleText = words.slice(0, expectedVisibleCount).join(' ');
    expect(container.textContent?.startsWith(visibleText)).toBe(true);
    expect(container.querySelectorAll('.nv-redact').length).toBeGreaterThan(0);
  });

  it('never leaks the hidden words as plain visible text', () => {
    const { container } = render(<RedactedText text={TEXT} enabled seed={0} />);
    const words = TEXT.split(' ');
    const visibleCount = Math.ceil(words.length * 0.4);
    const hiddenWords = words.slice(visibleCount);
    // hidden words must only appear inside .nv-redact-fill (color:transparent),
    // never as direct text of the top-level container
    const directText = Array.from(container.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join('');
    for (const w of hiddenWords) {
      expect(directText.includes(w)).toBe(false);
    }
  });

  it('is deterministic for a given seed — no Math.random, same as CHUNK_SIZES cycling', () => {
    const a = render(<RedactedText text={TEXT} enabled seed={3} />).container.innerHTML;
    const b = render(<RedactedText text={TEXT} enabled seed={3} />).container.innerHTML;
    expect(a).toBe(b);
  });

  it('produces a pen-stroke SVG mark for every redacted chunk', () => {
    const { container } = render(<RedactedText text={TEXT} enabled seed={0} />);
    const chunks = container.querySelectorAll('.nv-redact');
    const marks = container.querySelectorAll('.nv-redact-mark');
    expect(marks.length).toBe(chunks.length);
    marks.forEach((svg) => {
      expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
    });
  });
});
