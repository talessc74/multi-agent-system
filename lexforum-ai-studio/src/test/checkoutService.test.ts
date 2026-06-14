import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initiateCheckout } from '../services/checkoutService';

const mockUser = (token = 'mock-token') => ({
  getIdToken: vi.fn().mockResolvedValue(token),
});

beforeEach(() => vi.restoreAllMocks());

describe('initiateCheckout', () => {
  it('retorna a URL do Stripe quando API responde com sucesso', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/pay/abc123' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const url = await initiateCheckout(mockUser() as any, 'sim-789', 1);

    expect(url).toBe('https://checkout.stripe.com/pay/abc123');
  });

  it('retorna null quando API não devolve URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ error: 'simulationId required' }),
    }));

    const url = await initiateCheckout(mockUser() as any, 'sim-789', 1);

    expect(url).toBeNull();
  });

  it('envia o token Firebase no header Authorization', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ url: 'https://stripe.com' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await initiateCheckout(mockUser('token-xyz') as any, 'sim-001', 2);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/stripe/create-checkout-session',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-xyz',
        }),
      })
    );
  });

  it('envia simulationId e mode corretos no body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ url: 'https://stripe.com' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await initiateCheckout(mockUser() as any, 'sim-modo3', 3);

    const call = fetchMock.mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body).toEqual({ simulationId: 'sim-modo3', mode: 3 });
  });

  it('lança erro quando fetch falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    await expect(initiateCheckout(mockUser() as any, 'sim-789', 1)).rejects.toThrow('Network error');
  });
});
