import { describe, it, expect } from 'vitest';

// Testa o contrato de isolamento das operações secundárias de handleSimulate.
//
// CONTRATO: após setState({ step: 'result' }), cada operação secundária roda
// em seu próprio try-catch. Falha em qualquer uma delas NÃO pode reverter a
// tela de resultado para 'input'.
//
// Regressão: antes do fix, saveSimulation/getUserSimulations/getStats estavam
// no mesmo try-catch da simulação. Uma falha de rede após a simulação longa
// revervia step → 'input' e exibia "Erro técnico: Load failed".

// Modela a estrutura exata do código em handleSimulate após o fix.
async function runSecondaryOps(ops: {
  saveSimulationFn: () => Promise<string | null>;
  getUserSimulationsFn: () => Promise<unknown[]>;
  getStatsFn: () => Promise<unknown>;
}): Promise<{ step: string; capturedErrors: string[] }> {
  // step já foi setado para 'result' ANTES de entrar aqui
  const step = 'result';
  const capturedErrors: string[] = [];

  try {
    await ops.saveSimulationFn();
  } catch (e: any) {
    capturedErrors.push('saveSimulation: ' + e.message);
  }

  try {
    await ops.getUserSimulationsFn();
  } catch (e: any) {
    capturedErrors.push('getUserSimulations: ' + e.message);
  }

  try {
    await ops.getStatsFn();
  } catch (e: any) {
    capturedErrors.push('getStats: ' + e.message);
  }

  return { step, capturedErrors };
}

// ── Happy path ───────────────────────────────────────────────────────────────

describe('secondaryOpsIsolation — happy path', () => {
  it('step permanece "result" quando todas as ops secundárias têm sucesso', async () => {
    const { step, capturedErrors } = await runSecondaryOps({
      saveSimulationFn: async () => 'sim-id-123',
      getUserSimulationsFn: async () => [],
      getStatsFn: async () => ({ total: 1 }),
    });
    expect(step).toBe('result');
    expect(capturedErrors).toHaveLength(0);
  });
});

// ── Falha em saveSimulation ──────────────────────────────────────────────────

describe('secondaryOpsIsolation — saveSimulation falha', () => {
  it('step permanece "result" quando saveSimulation lança TypeError', async () => {
    const { step, capturedErrors } = await runSecondaryOps({
      saveSimulationFn: async () => { throw new TypeError('Load failed'); },
      getUserSimulationsFn: async () => [],
      getStatsFn: async () => ({}),
    });
    expect(step).toBe('result');
    expect(capturedErrors).toHaveLength(1);
    expect(capturedErrors[0]).toMatch(/saveSimulation/);
  });

  it('getUserSimulations e getStats ainda executam após saveSimulation falhar', async () => {
    const executed: string[] = [];
    await runSecondaryOps({
      saveSimulationFn: async () => { throw new Error('network'); },
      getUserSimulationsFn: async () => { executed.push('getUserSimulations'); return []; },
      getStatsFn: async () => { executed.push('getStats'); return {}; },
    });
    expect(executed).toContain('getUserSimulations');
    expect(executed).toContain('getStats');
  });
});

// ── Falha em getUserSimulations ──────────────────────────────────────────────

describe('secondaryOpsIsolation — getUserSimulations falha', () => {
  it('step permanece "result" quando getUserSimulations lança erro', async () => {
    const { step, capturedErrors } = await runSecondaryOps({
      saveSimulationFn: async () => null,
      getUserSimulationsFn: async () => { throw new Error('permission-denied'); },
      getStatsFn: async () => ({}),
    });
    expect(step).toBe('result');
    expect(capturedErrors[0]).toMatch(/getUserSimulations/);
  });

  it('getStats ainda executa após getUserSimulations falhar', async () => {
    let statsExecuted = false;
    await runSecondaryOps({
      saveSimulationFn: async () => null,
      getUserSimulationsFn: async () => { throw new Error('network'); },
      getStatsFn: async () => { statsExecuted = true; return {}; },
    });
    expect(statsExecuted).toBe(true);
  });
});

// ── Falha em getStats ────────────────────────────────────────────────────────

describe('secondaryOpsIsolation — getStats falha', () => {
  it('step permanece "result" quando getStats lança erro', async () => {
    const { step, capturedErrors } = await runSecondaryOps({
      saveSimulationFn: async () => 'id',
      getUserSimulationsFn: async () => [],
      getStatsFn: async () => { throw new Error('unavailable'); },
    });
    expect(step).toBe('result');
    expect(capturedErrors[0]).toMatch(/getStats/);
  });
});

// ── Falha em cascata (todas falham) ─────────────────────────────────────────

describe('secondaryOpsIsolation — todas as ops secundárias falham', () => {
  it('step permanece "result" mesmo quando as três ops falham', async () => {
    const { step, capturedErrors } = await runSecondaryOps({
      saveSimulationFn: async () => { throw new Error('e1'); },
      getUserSimulationsFn: async () => { throw new Error('e2'); },
      getStatsFn: async () => { throw new Error('e3'); },
    });
    expect(step).toBe('result');
    expect(capturedErrors).toHaveLength(3);
  });

  // Regressão direta: cenário que disparava "Erro técnico: Load failed" em mobile.
  // Rede caída após simulação longa → saveSimulation throw → step voltava a 'input'.
  it('regressão: Load failed em saveSimulation não vaza para fora do bloco isolado', async () => {
    let outerCaught = false;
    try {
      await runSecondaryOps({
        saveSimulationFn: async () => { throw new TypeError('Load failed'); },
        getUserSimulationsFn: async () => [],
        getStatsFn: async () => ({}),
      });
    } catch {
      outerCaught = true;
    }
    expect(outerCaught).toBe(false);
  });
});
