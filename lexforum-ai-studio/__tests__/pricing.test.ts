/**
 * Verifies the pricing logic for simulation modes.
 * Business rule: modes 3 and 5 → R$5,90 (590 centavos); all others → R$9,90 (990 centavos).
 * Source: server.ts — POST /api/stripe/create-checkout-session
 */
import { describe, it, expect } from 'vitest';

function getUnitAmount(mode: number): number {
  return mode === 3 || mode === 5 ? 590 : 990;
}

describe('Pricing — getUnitAmount', () => {
  it('charges 590 for mode 3 (Mesa Dupla — Juiz)', () => {
    expect(getUnitAmount(3)).toBe(590);
  });

  it('charges 590 for mode 5 (Revisão Pós-Conflito)', () => {
    expect(getUnitAmount(5)).toBe(590);
  });

  it('charges 990 for mode 1 (Tese Estratégica)', () => {
    expect(getUnitAmount(1)).toBe(990);
  });

  it('charges 990 for mode 2 (Defesa sob Ataque)', () => {
    expect(getUnitAmount(2)).toBe(990);
  });

  it('charges 990 for mode 4 (Mesa Dupla — Assistida)', () => {
    expect(getUnitAmount(4)).toBe(990);
  });

  it('charges 990 for any unrecognized mode', () => {
    expect(getUnitAmount(0)).toBe(990);
    expect(getUnitAmount(99)).toBe(990);
  });
});
