import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks (available to vi.mock factories) ────────────────────────
const mocks = vi.hoisted(() => {
  const firestoreGet = vi.fn();
  const firestoreSet = vi.fn();
  const firestoreWhere = vi.fn();

  firestoreWhere.mockReturnValue({
    where: firestoreWhere,
    limit: vi.fn(() => ({ get: firestoreGet })),
  });

  const firestoreDb = {
    collection: vi.fn(() => ({
      where: firestoreWhere,
      doc: vi.fn(() => ({ set: firestoreSet })),
    })),
  };

  const firestore = Object.assign(vi.fn(() => firestoreDb), {
    FieldValue: { serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP') },
  });

  return {
    fsExistsSync: vi.fn(),
    fsReadFileSync: vi.fn(),
    firestoreGet,
    firestoreSet,
    firestore,
    createAgentFromScratch: vi.fn(),
  };
});

vi.mock('fs', () => ({
  default: {
    existsSync: mocks.fsExistsSync,
    readFileSync: mocks.fsReadFileSync,
  },
}));

vi.mock('firebase-admin', () => ({
  default: {
    apps: ['placeholder'],
    initializeApp: vi.fn(),
    credential: { cert: vi.fn() },
    firestore: mocks.firestore,
    auth: vi.fn(),
  },
}));

vi.mock('../agent-creator', () => ({
  createAgentFromScratch: mocks.createAgentFromScratch,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────
const CONSUMIDOR_REGISTRY = JSON.stringify({
  area: 'consumidor',
  agentes: [
    {
      agent_id: 'advogado_consumerista_v1.0',
      tipo: 'advogado',
      comarca: null,
      arquivo: 'agents/advogado_consumerista_v1.0.json',
      seed: 'SEED_JUR_001',
    },
    {
      agent_id: 'juiz_jec_v1.0',
      tipo: 'juiz',
      comarca: null,
      arquivo: 'agents/juiz_jec_v1.0.json',
      seed: 'SEED_JUR_001',
    },
    {
      agent_id: 'juiz_sp_capital_v1.0',
      tipo: 'juiz',
      comarca: 'SP-Capital',
      arquivo: 'agents/juiz_sp_capital_v1.0.json',
      seed: 'SEED_JUR_002',
    },
  ],
});

import { resolveAgent } from '../agent-resolver';

// ── Tests ─────────────────────────────────────────────────────────────────
describe('resolveAgent — local registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns matching agent when area and tipo exist in local registry', async () => {
    mocks.fsExistsSync.mockReturnValue(true);
    mocks.fsReadFileSync.mockReturnValue(CONSUMIDOR_REGISTRY);

    const result = await resolveAgent({ area: 'consumidor', tipo: 'juiz' });

    expect(result.agent_id).toBe('juiz_jec_v1.0');
    expect(result.tipo).toBe('juiz');
    expect(mocks.firestoreGet).not.toHaveBeenCalled();
  });

  it('returns comarca-specific agent when comarca matches', async () => {
    mocks.fsExistsSync.mockReturnValue(true);
    mocks.fsReadFileSync.mockReturnValue(CONSUMIDOR_REGISTRY);

    const result = await resolveAgent({ area: 'consumidor', tipo: 'juiz', comarca: 'SP-Capital' });

    expect(result.agent_id).toBe('juiz_sp_capital_v1.0');
  });

  it('falls back to generic agent when comarca has no specific match', async () => {
    mocks.fsExistsSync.mockReturnValue(true);
    mocks.fsReadFileSync.mockReturnValue(CONSUMIDOR_REGISTRY);

    const result = await resolveAgent({ area: 'consumidor', tipo: 'juiz', comarca: 'Fortaleza' });

    expect(result.agent_id).toBe('juiz_jec_v1.0');
  });

  it('resolves advogado type from registry', async () => {
    mocks.fsExistsSync.mockReturnValue(true);
    mocks.fsReadFileSync.mockReturnValue(CONSUMIDOR_REGISTRY);

    const result = await resolveAgent({ area: 'consumidor', tipo: 'advogado' });

    expect(result.agent_id).toBe('advogado_consumerista_v1.0');
  });
});

describe('resolveAgent — Firestore fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Local registry misses
    mocks.fsExistsSync.mockReturnValue(false);
  });

  it('queries Firestore when local registry is absent', async () => {
    const fsAgent = {
      agent_id: 'juiz_trabalhista_fs_v1',
      tipo: 'juiz',
      comarca: null,
      arquivo: 'agents/juiz_trabalhista_fs_v1.json',
      seed: 'SEED_FS_001',
    };
    mocks.firestoreGet.mockResolvedValue({ empty: false, docs: [{ data: () => fsAgent }] });

    const result = await resolveAgent({ area: 'trabalhista', tipo: 'juiz' });

    expect(result.agent_id).toBe('juiz_trabalhista_fs_v1');
    expect(mocks.createAgentFromScratch).not.toHaveBeenCalled();
  });

  it('creates a new agent when both local and Firestore miss', async () => {
    mocks.firestoreGet.mockResolvedValue({ empty: true, docs: [] });
    mocks.createAgentFromScratch.mockResolvedValue({
      agent_id: 'FAM_001_123456',
      seed_id: 'SEED_DYN_001',
      agente: { nomeAgente: 'Juiz de Família Dinâmico' },
    });
    mocks.firestoreSet.mockResolvedValue(undefined);

    const result = await resolveAgent({ area: 'familia', tipo: 'juiz' });

    expect(mocks.createAgentFromScratch).toHaveBeenCalledWith(
      expect.objectContaining({ area: 'familia', tipo: 'juiz' })
    );
    expect(result.agent_id).toBe('FAM_001_123456');
  });

  it('returns created agent even when Firestore save fails', async () => {
    mocks.firestoreGet.mockResolvedValue({ empty: true, docs: [] });
    mocks.createAgentFromScratch.mockResolvedValue({
      agent_id: 'CIV_001_999999',
      seed_id: 'SEED_DYN_002',
      agente: { nomeAgente: 'Juiz Cível Dinâmico' },
    });
    mocks.firestoreSet.mockRejectedValue(new Error('Firestore unavailable'));

    const result = await resolveAgent({ area: 'civel', tipo: 'juiz' });

    expect(result.agent_id).toBe('CIV_001_999999');
  });

  it('falls through to create agent when Firestore query throws', async () => {
    mocks.firestoreGet.mockRejectedValue(new Error('Firestore network error'));
    mocks.createAgentFromScratch.mockResolvedValue({
      agent_id: 'PRE_001_111111',
      seed_id: 'SEED_DYN_003',
      agente: { nomeAgente: 'Perito Previdenciário' },
    });
    mocks.firestoreSet.mockResolvedValue(undefined);

    const result = await resolveAgent({ area: 'previdenciario', tipo: 'juiz' });

    expect(result.agent_id).toBe('PRE_001_111111');
  });
});

describe('resolveAgent — userSide routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fsExistsSync.mockReturnValue(false);
    mocks.firestoreGet.mockResolvedValue({ empty: true, docs: [] });
    mocks.createAgentFromScratch.mockResolvedValue({
      agent_id: 'CON_001_555555',
      seed_id: 'SEED_DYN_004',
      agente: {},
    });
    mocks.firestoreSet.mockResolvedValue(undefined);
  });

  it('passes userSide DEFENSE to createAgentFromScratch', async () => {
    await resolveAgent({ area: 'consumidor', tipo: 'advogado', userSide: 'DEFENSE' });

    expect(mocks.createAgentFromScratch).toHaveBeenCalledWith(
      expect.objectContaining({ userSide: 'DEFENSE' })
    );
  });

  it('passes userSide AUTHOR to createAgentFromScratch', async () => {
    await resolveAgent({ area: 'consumidor', tipo: 'advogado', userSide: 'AUTHOR' });

    expect(mocks.createAgentFromScratch).toHaveBeenCalledWith(
      expect.objectContaining({ userSide: 'AUTHOR' })
    );
  });
});
