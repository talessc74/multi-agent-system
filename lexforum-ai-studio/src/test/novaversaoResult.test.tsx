import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultScreen } from '../novaversao/screens/Result';
import { initialSimData } from '../novaversao/simState';
import type { SimData } from '../novaversao/simState';

const { initiateCheckoutMock } = vi.hoisted(() => ({ initiateCheckoutMock: vi.fn() }));
vi.mock('../services/checkoutService', () => ({ initiateCheckout: initiateCheckoutMock }));

vi.mock('../services/dbService', () => ({
  hasUserPaidForSession: vi.fn().mockResolvedValue(false),
  registrarAcessoLaudo: vi.fn(),
  getSimulationById: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  window.history.pushState({}, '', '/novaversao/simular/1/resultado');
});

function baseSimData(): SimData {
  const d = initialSimData(1);
  d.simulationId = 'sim-123';
  d.simulation = {
    area: 'CIVEL',
    rounds: [{ lawyerPetition: 'p', judgeJudgment: 'j', successProbability: 70 }],
    finalSuccessProbability: 70,
  } as any;
  return d;
}

describe('ResultScreen — handleUnlock', () => {
  it('redireciona para a URL do Stripe quando o checkout tem sucesso', async () => {
    initiateCheckoutMock.mockResolvedValue('https://checkout.stripe.com/pay/abc');
    const user = userEvent.setup();
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(
      <ResultScreen
        theme="light"
        onToggleTheme={() => {}}
        onNavigate={() => {}}
        simData={baseSimData()}
        setSimData={() => {}}
        user={{ uid: 'user-1' } as any}
        onRequireLogin={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: /desbloquear laudo completo/i }));

    await waitFor(() => expect(window.location.href).toBe('https://checkout.stripe.com/pay/abc'));
  });

  it('não deixa a rejeição de initiateCheckout escapar sem tratamento e reabilita o botão', async () => {
    initiateCheckoutMock.mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ResultScreen
        theme="light"
        onToggleTheme={() => {}}
        onNavigate={() => {}}
        simData={baseSimData()}
        setSimData={() => {}}
        user={{ uid: 'user-1' } as any}
        onRequireLogin={() => {}}
      />
    );

    const button = screen.getByRole('button', { name: /desbloquear laudo completo/i });
    await user.click(button);

    await waitFor(() => expect(screen.getByRole('button', { name: /desbloquear laudo completo/i })).not.toBeDisabled());
    expect(consoleErrorSpy).toHaveBeenCalledWith('[Checkout] Erro:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('abre o login em vez de chamar checkout quando não há usuário', async () => {
    const onRequireLogin = vi.fn();
    const user = userEvent.setup();

    render(
      <ResultScreen
        theme="light"
        onToggleTheme={() => {}}
        onNavigate={() => {}}
        simData={baseSimData()}
        setSimData={() => {}}
        user={null}
        onRequireLogin={onRequireLogin}
      />
    );

    await user.click(screen.getByRole('button', { name: /desbloquear laudo completo/i }));

    expect(onRequireLogin).toHaveBeenCalledTimes(1);
    expect(initiateCheckoutMock).not.toHaveBeenCalled();
  });
});
