import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
}));

import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getSimRecovery, subscribeSimRecovery } from '../services/dbService';

const mockRef = { id: 'mock-ref' } as any;

beforeEach(() => vi.clearAllMocks());

// ─── getSimRecovery ───────────────────────────────────────────────────────────

describe('getSimRecovery', () => {
  it('retorna status e result quando documento existe', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ status: 'complete', result: { finalSuccessProbability: 72 } }),
    } as any);

    const result = await getSimRecovery('session-uuid-abc');

    expect(result).toEqual({ status: 'complete', result: { finalSuccessProbability: 72 } });
    expect(doc).toHaveBeenCalledWith(expect.anything(), 'simRecovery', 'session-uuid-abc');
  });

  it('retorna null quando documento não existe', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

    const result = await getSimRecovery('session-inexistente');

    expect(result).toBeNull();
  });

  it('retorna null quando status é "pending"', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ status: 'pending' }),
    } as any);

    const result = await getSimRecovery('session-pendente');

    // Pending deve ser tratado pelo caller, mas o dado retornado deve ser transparente
    expect(result).toEqual({ status: 'pending', result: undefined });
  });

  it('retorna null em caso de erro no Firestore', async () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    vi.mocked(getDoc).mockRejectedValue(new Error('Firestore indisponível'));

    const result = await getSimRecovery('session-abc');

    expect(result).toBeNull();
  });
});

// ─── subscribeSimRecovery ─────────────────────────────────────────────────────

describe('subscribeSimRecovery', () => {
  it('chama onChange com status e result quando snapshot existe', () => {
    vi.mocked(doc).mockReturnValue(mockRef);

    const fakeUnsubscribe = vi.fn();
    vi.mocked(onSnapshot).mockImplementation((_ref, onNext: any, _onError: any) => {
      onNext({
        exists: () => true,
        data: () => ({ status: 'complete', result: { finalSuccessProbability: 88 } }),
      });
      return fakeUnsubscribe;
    });

    const onChange = vi.fn();
    const unsubscribe = subscribeSimRecovery('session-uuid-xyz', onChange);

    expect(onChange).toHaveBeenCalledWith('complete', { finalSuccessProbability: 88 });
    expect(typeof unsubscribe).toBe('function');
  });

  it('não chama onChange quando snapshot não existe', () => {
    vi.mocked(doc).mockReturnValue(mockRef);

    vi.mocked(onSnapshot).mockImplementation((_ref, onNext: any, _onError: any) => {
      onNext({ exists: () => false });
      return vi.fn();
    });

    const onChange = vi.fn();
    subscribeSimRecovery('session-uuid-xyz', onChange);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('chama onChange com "error" quando onSnapshot emite erro', () => {
    vi.mocked(doc).mockReturnValue(mockRef);

    vi.mocked(onSnapshot).mockImplementation((_ref, _onNext: any, onError: any) => {
      onError(new Error('Firestore desconectado'));
      return vi.fn();
    });

    const onChange = vi.fn();
    subscribeSimRecovery('session-uuid-xyz', onChange);

    expect(onChange).toHaveBeenCalledWith('error');
  });

  it('retorna função de unsubscribe válida', () => {
    vi.mocked(doc).mockReturnValue(mockRef);
    const fakeUnsubscribe = vi.fn();
    vi.mocked(onSnapshot).mockReturnValue(fakeUnsubscribe);

    const unsubscribe = subscribeSimRecovery('session-uuid-xyz', vi.fn());
    unsubscribe();

    expect(fakeUnsubscribe).toHaveBeenCalledOnce();
  });
});
