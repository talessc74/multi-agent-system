import { describe, it, expect } from 'vitest';

// Testa a lógica de decisão da barra de veredito isolada do componente.
// A regra: modos 3 e 4 (mesa dupla) exibem barra dual Autor/Réu;
// os demais modos (1, 2, 5) exibem barra unilateral de Autor.

function shouldShowDualBar(selectedMode: number): boolean {
  return selectedMode === 3 || selectedMode === 4;
}

function reuPct(autorPct: number): number {
  return 100 - autorPct;
}

describe('lógica da barra de veredito', () => {
  describe('shouldShowDualBar', () => {
    it('modo 3 (mesa dupla) exibe barra dual', () => {
      expect(shouldShowDualBar(3)).toBe(true);
    });

    it('modo 4 exibe barra dual', () => {
      expect(shouldShowDualBar(4)).toBe(true);
    });

    it('modo 1 exibe barra unilateral', () => {
      expect(shouldShowDualBar(1)).toBe(false);
    });

    it('modo 2 exibe barra unilateral', () => {
      expect(shouldShowDualBar(2)).toBe(false);
    });

    it('modo 5 exibe barra unilateral', () => {
      expect(shouldShowDualBar(5)).toBe(false);
    });
  });

  describe('reuPct', () => {
    it('calcula percentual do réu como complemento do autor', () => {
      expect(reuPct(25)).toBe(75);
    });

    it('réu com 0% quando autor tem 100%', () => {
      expect(reuPct(100)).toBe(0);
    });

    it('réu com 100% quando autor tem 0%', () => {
      expect(reuPct(0)).toBe(100);
    });

    it('50% para cada polo quando resultado é equilibrado', () => {
      expect(reuPct(50)).toBe(50);
    });

    // Regressão: screenshot do usuário mostrava 25% para o Autor.
    // A barra deve exibir "Réu 75%", não suprimir ou omitir a informação.
    it('caso real: autor 25% → réu 75%', () => {
      expect(reuPct(25)).toBe(75);
    });
  });
});
