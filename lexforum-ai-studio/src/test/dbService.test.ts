import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  FieldValue: class {},
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  increment: vi.fn((n: number) => n),
  getDocs: vi.fn(),
  getCountFromServer: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
}));

vi.mock('../lib/anonymizer', () => ({
  anonymizeSimulation: vi.fn((data: any) => data),
}));

import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import {
  hasUserPaidForSession,
  getUserAccessLevel,
  registrarAceiteTermos,
  createOrUpdateUser,
  getSimulationById,
  getStats,
} from '../services/dbService';

const mockRef = { id: 'mock-ref' } as any;

beforeEach(() => vi.clearAllMocks());

// ─── hasUserPaidForSession ────────────────────────────────────────────────────

describe('hasUserPaidForSession', () => {
  it('retorna true quando documento de pagamento existe', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as any);

    const result = await hasUserPaidForSession('uid-123', 'sim-456');

    expect(result).toBe(true);
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'uid-123', 'payments', 'sim-456');
  });

  it('retorna false quando documento de pagamento não existe', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

    const result = await hasUserPaidForSession('uid-123', 'sim-999');

    expect(result).toBe(false);
  });

  it('retorna false em caso de erro no Firestore', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockRejectedValue(new Error('Firestore indisponível'));

    const result = await hasUserPaidForSession('uid-123', 'sim-456');

    expect(result).toBe(false);
  });
});

// ─── getUserAccessLevel ───────────────────────────────────────────────────────

describe('getUserAccessLevel', () => {
  it('retorna o accessLevel do documento do usuário', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ accessLevel: 'beta' }),
    } as any);

    const result = await getUserAccessLevel('uid-beta');

    expect(result).toBe('beta');
  });

  it('retorna "free" quando usuário não existe no Firestore', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

    const result = await getUserAccessLevel('uid-novo');

    expect(result).toBe('free');
  });

  it('retorna "free" quando accessLevel ausente no documento', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({}),
    } as any);

    const result = await getUserAccessLevel('uid-sem-level');

    expect(result).toBe('free');
  });

  it('retorna "free" em caso de erro no Firestore', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockRejectedValue(new Error('Firestore indisponível'));

    const result = await getUserAccessLevel('uid-qualquer');

    expect(result).toBe('free');
  });
});

// ─── registrarAceiteTermos ────────────────────────────────────────────────────

describe('registrarAceiteTermos', () => {
  it('chama updateDoc no caminho correto com os campos de aceite', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    await registrarAceiteTermos('uid-123');

    expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'uid-123');
    expect(updateDoc).toHaveBeenCalledWith(mockRef, {
      termosAceitosEm: 'SERVER_TIMESTAMP',
      termosVersao: '1.2',
    });
  });

  it('resolve sem lançar erro quando updateDoc falha (comportamento atual)', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(updateDoc).mockRejectedValue(new Error('Firestore indisponível'));

    // A função swallows o erro — documentando esse comportamento explicitamente.
    // Se isso mudar, o teste vai quebrar e o time será notificado.
    await expect(registrarAceiteTermos('uid-123')).resolves.toBeUndefined();
  });
});

// ─── createOrUpdateUser ───────────────────────────────────────────────────────

describe('createOrUpdateUser', () => {
  it('cria documento quando usuário não existe', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    await createOrUpdateUser('uid-novo', 'novo@teste.com');

    expect(setDoc).toHaveBeenCalledWith(
      mockRef,
      expect.objectContaining({ email: 'novo@teste.com', accessLevel: 'free' })
    );
  });

  it('NÃO sobrescreve documento quando usuário já existe', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as any);

    await createOrUpdateUser('uid-existente', 'existente@teste.com');

    expect(setDoc).not.toHaveBeenCalled();
  });

  it('persiste null quando email não fornecido', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    await createOrUpdateUser('uid-sem-email', null);

    expect(setDoc).toHaveBeenCalledWith(
      mockRef,
      expect.objectContaining({ email: null })
    );
  });
});

// ─── getSimulationById ────────────────────────────────────────────────────────

describe('getSimulationById', () => {
  it('retorna simulação com id quando documento existe', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      id: 'sim-abc',
      data: () => ({ area: 'LABOR', finalSuccessProbability: 72 }),
    } as any);

    const result = await getSimulationById('sim-abc');

    expect(result).toEqual({ id: 'sim-abc', area: 'LABOR', finalSuccessProbability: 72 });
  });

  it('retorna null quando documento não existe', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

    const result = await getSimulationById('sim-nao-existe');

    expect(result).toBeNull();
  });

  it('retorna null em caso de erro no Firestore', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockRejectedValue(new Error('Firestore indisponível'));

    const result = await getSimulationById('sim-abc');

    expect(result).toBeNull();
  });
});

// ─── getStats ─────────────────────────────────────────────────────────────────
// Regressão: getStats() inventava { totalSimulations: 14282, totalWins: 10682,
// winRate: 74.8 } sempre que o doc 'stats/global' não existia — um valor
// plausível fabricado, indistinguível de dado real para quem lê a tela, e não
// coberto pela guarda de loading do ADR-006 (a Promise resolvia "com sucesso").

describe('getStats', () => {
  it('retorna os números reais do documento quando ele existe', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ totalSimulations: 42, totalWins: 30 }),
    } as any);

    const result = await getStats();

    expect(result).toEqual({ totalSimulations: 42, totalWins: 30, winRate: (30 / 42) * 100 });
  });

  it('NÃO inventa 14282/10682/74.8 quando o documento não existe', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

    const result = await getStats();

    expect(result).toBeNull();
  });

  it('propaga o erro em vez de retornar o fallback fabricado (comportamento existente de handleFirestoreError)', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockRejectedValue(new Error('Firestore indisponível'));

    await expect(getStats()).rejects.toThrow();
  });

  it('winRate é 0 (não 74.8) quando o doc existe mas totalSimulations é 0', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ totalSimulations: 0, totalWins: 0 }),
    } as any);

    const result = await getStats();

    expect(result).toEqual({ totalSimulations: 0, totalWins: 0, winRate: 0 });
  });
});
