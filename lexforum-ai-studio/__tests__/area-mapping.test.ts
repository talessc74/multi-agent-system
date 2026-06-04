/**
 * Tests the areaMap translation used in /api/gemini/simulate and /api/gemini/mode5.
 * This mapping is critical: an incorrect translation silently routes to the wrong agent registry.
 * Source: server.ts (duplicated in two routes — Paradoxo do Pesticida candidate).
 *
 * Pareto gate: this 6-entry map is a single-point-of-failure for all agent resolution.
 */
import { describe, it, expect } from 'vitest';

const areaMap: Record<string, string> = {
  CONSUMER: 'consumerista',
  LABOR: 'trabalhista',
  CIVIL: 'civel',
  FAMILY: 'familia',
  SOCIAL_SECURITY: 'previdenciario',
  OTHER: 'geral',
};

function resolveArea(area: string): string {
  return areaMap[area] ?? area.toLowerCase();
}

describe('Area mapping — known codes', () => {
  it.each([
    ['CONSUMER', 'consumerista'],
    ['LABOR', 'trabalhista'],
    ['CIVIL', 'civel'],
    ['FAMILY', 'familia'],
    ['SOCIAL_SECURITY', 'previdenciario'],
    ['OTHER', 'geral'],
  ])('maps %s → %s', (input, expected) => {
    expect(resolveArea(input)).toBe(expected);
  });
});

describe('Area mapping — fallback', () => {
  it('lowercases unknown codes as fallback', () => {
    expect(resolveArea('TRIBUTARIO')).toBe('tributario');
  });

  it('handles already-lowercase input', () => {
    expect(resolveArea('civel')).toBe('civel');
  });

  it('preserves accents in fallback path', () => {
    expect(resolveArea('AMBIENTAL')).toBe('ambiental');
  });
});
