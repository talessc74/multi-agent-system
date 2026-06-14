import { describe, it, expect } from 'vitest';

// Testa a guarda de índice no handler SEED_CREATED do SSE progress.
//
// CONTRATO: quando `regionalStats` está vazio (array []) e chega um evento
// SEED_CREATED com regionIndex, o código NÃO deve lançar TypeError.
// Antes do fix, newStats[idx] era undefined → acesso a .seeds → TypeError →
// React desmontava o componente → tela preta.
//
// Regressão: o bug aparecia ao clicar "Iniciar" após a remoção dos dados mock
// que inicializavam regionalStats com registros fictícios.

type RegionStat = { region: string; seeds: number; active: number };

// Modela o bloco exato que foi corrigido em App.tsx
function applyRegionalStatsSeedCreated(
  stats: RegionStat[],
  idx: number
): RegionStat[] {
  const newStats = [...stats];
  if (newStats[idx]) {
    newStats[idx] = {
      ...newStats[idx],
      seeds: newStats[idx].seeds + 1,
      active: newStats[idx].active + 1,
    };
  }
  return newStats;
}

// ── Cenário do bug ───────────────────────────────────────────────────────────

describe('regionalStats — guarda de índice (regressão tela preta)', () => {
  it('não lança quando stats está vazio e idx é 0', () => {
    expect(() => applyRegionalStatsSeedCreated([], 0)).not.toThrow();
  });

  it('não lança quando stats está vazio e idx é qualquer número', () => {
    expect(() => applyRegionalStatsSeedCreated([], 5)).not.toThrow();
    expect(() => applyRegionalStatsSeedCreated([], 99)).not.toThrow();
  });

  it('retorna array inalterado quando idx está fora dos limites', () => {
    const result = applyRegionalStatsSeedCreated([], 0);
    expect(result).toEqual([]);
  });
});

// ── Happy path ───────────────────────────────────────────────────────────────

describe('regionalStats — atualização correta quando idx válido', () => {
  const baseStats: RegionStat[] = [
    { region: 'SP', seeds: 10, active: 8 },
    { region: 'RJ', seeds: 5, active: 3 },
  ];

  it('incrementa seeds e active do índice correto', () => {
    const result = applyRegionalStatsSeedCreated(baseStats, 0);
    expect(result[0].seeds).toBe(11);
    expect(result[0].active).toBe(9);
  });

  it('não altera outros índices', () => {
    const result = applyRegionalStatsSeedCreated(baseStats, 0);
    expect(result[1]).toEqual(baseStats[1]);
  });

  it('funciona no último índice válido do array', () => {
    const result = applyRegionalStatsSeedCreated(baseStats, 1);
    expect(result[1].seeds).toBe(6);
    expect(result[1].active).toBe(4);
  });

  it('não muta o array original (imutabilidade)', () => {
    const original = [...baseStats];
    applyRegionalStatsSeedCreated(baseStats, 0);
    expect(baseStats).toEqual(original);
  });

  it('ignora idx === array.length (boundary fora)', () => {
    const result = applyRegionalStatsSeedCreated(baseStats, 2);
    expect(result).toEqual(baseStats);
  });
});
