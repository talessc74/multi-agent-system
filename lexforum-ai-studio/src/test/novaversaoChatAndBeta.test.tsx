import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultScreen } from '../novaversao/screens/Result';
import { initialSimData } from '../novaversao/simState';
import type { SimData } from '../novaversao/simState';

// Regressão: /novaversao não tinha chat com os agentes nem o bypass de
// acesso beta (BDR-003: accessLevel === 'beta' libera laudo + chat sem
// pagar), diferente do site em produção. Ver Result.tsx.

const { initiateCheckoutMock } = vi.hoisted(() => ({ initiateCheckoutMock: vi.fn() }));
vi.mock('../services/checkoutService', () => ({ initiateCheckout: initiateCheckoutMock }));

const { getUserAccessLevelMock } = vi.hoisted(() => ({ getUserAccessLevelMock: vi.fn() }));
vi.mock('../services/dbService', () => ({
  hasUserPaidForSession: vi.fn().mockResolvedValue(false),
  registrarAcessoLaudo: vi.fn(),
  getSimulationById: vi.fn(),
  getUserAccessLevel: getUserAccessLevelMock,
}));

const { getChatStatusMock, getChatHistoryMock, createChatCheckoutSessionMock, sendChatMessageMock } = vi.hoisted(() => ({
  getChatStatusMock: vi.fn(),
  getChatHistoryMock: vi.fn(),
  createChatCheckoutSessionMock: vi.fn(),
  sendChatMessageMock: vi.fn(),
}));
vi.mock('../services/chatService', () => ({
  getChatStatus: getChatStatusMock,
  getChatHistory: getChatHistoryMock,
  createChatCheckoutSession: createChatCheckoutSessionMock,
  sendChatMessage: sendChatMessageMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  getUserAccessLevelMock.mockResolvedValue('free');
  window.history.pushState({}, '', '/novaversao/simular/1/resultado');
});

function unlockedSimData(): SimData {
  const d = initialSimData(1);
  d.simulationId = 'sim-123';
  d.isUnlocked = true;
  d.simulation = {
    area: 'CIVEL',
    rounds: [{ lawyerPetition: 'p', judgeJudgment: 'j', successProbability: 70 }],
    finalSuccessProbability: 70,
    lawyerAgentName: 'Dra. Kohn',
    judgeAgentName: 'Dr. Ferraz',
  } as any;
  return d;
}

describe('ResultScreen — beta access bypass (BDR-003)', () => {
  it('accessLevel "beta" desbloqueia o laudo mesmo sem pagamento', async () => {
    getUserAccessLevelMock.mockResolvedValue('beta');
    let latest: SimData = initialSimData(1);
    latest.simulationId = 'sim-beta';
    const setSimData = (fn: (prev: SimData) => SimData) => {
      latest = fn(latest);
    };

    render(
      <ResultScreen
        theme="light"
        onToggleTheme={() => {}}
        onNavigate={() => {}}
        simData={latest}
        setSimData={setSimData as any}
        user={{ uid: 'beta-user' } as any}
        onRequireLogin={() => {}}
      />
    );

    await waitFor(() => expect(latest.isUnlocked).toBe(true));
  });

  it('accessLevel "free" não mexe em isUnlocked', async () => {
    let latest: SimData = initialSimData(1);
    latest.simulationId = 'sim-free';
    const setSimData = (fn: (prev: SimData) => SimData) => {
      latest = fn(latest);
    };

    render(
      <ResultScreen
        theme="light"
        onToggleTheme={() => {}}
        onNavigate={() => {}}
        simData={latest}
        setSimData={setSimData as any}
        user={{ uid: 'free-user' } as any}
        onRequireLogin={() => {}}
      />
    );

    await waitFor(() => expect(getUserAccessLevelMock).toHaveBeenCalledWith('free-user'));
    expect(latest.isUnlocked).toBe(false);
  });

  it('sem usuário logado, não chama getUserAccessLevel', () => {
    render(
      <ResultScreen
        theme="light"
        onToggleTheme={() => {}}
        onNavigate={() => {}}
        simData={initialSimData(1)}
        setSimData={() => {}}
        user={null}
        onRequireLogin={() => {}}
      />
    );
    expect(getUserAccessLevelMock).not.toHaveBeenCalled();
  });
});

describe('ResultScreen — chat com os agentes', () => {
  it('não mostra "Falar com os agentes" sem usuário logado', () => {
    render(
      <ResultScreen
        theme="light"
        onToggleTheme={() => {}}
        onNavigate={() => {}}
        simData={unlockedSimData()}
        setSimData={() => {}}
        user={null}
        onRequireLogin={() => {}}
      />
    );
    expect(screen.queryByRole('button', { name: /falar com os agentes/i })).not.toBeInTheDocument();
  });

  it('paga o chat separadamente quando ainda não pago, sem tocar no checkout do laudo', async () => {
    getChatStatusMock.mockResolvedValue({ isPaid: false, questionsUsed: 0, questionsLimit: 5 });
    createChatCheckoutSessionMock.mockResolvedValue('https://checkout.stripe.com/chat/xyz');
    const user = userEvent.setup();
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(
      <ResultScreen
        theme="light"
        onToggleTheme={() => {}}
        onNavigate={() => {}}
        simData={unlockedSimData()}
        setSimData={() => {}}
        user={{ uid: 'user-1' } as any}
        onRequireLogin={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: /falar com os agentes/i }));

    await waitFor(() => expect(createChatCheckoutSessionMock).toHaveBeenCalledWith('sim-123'));
    await waitFor(() => expect(window.location.href).toBe('https://checkout.stripe.com/chat/xyz'));
    expect(initiateCheckoutMock).not.toHaveBeenCalled();
  });

  it('abre o histórico e permite enviar mensagem quando o chat já está pago', async () => {
    getChatStatusMock.mockResolvedValue({ isPaid: true, questionsUsed: 1, questionsLimit: 5 });
    getChatHistoryMock.mockResolvedValue([
      { role: 'user', content: 'Pergunta anterior', agentType: 'lawyer', agentName: 'Você' },
    ]);
    sendChatMessageMock.mockImplementation(async (_simId: string, _agentType: string, _msg: string, onEvent: any) => {
      onEvent({ type: 'message', content: 'Resposta do advogado', agentType: 'lawyer', agentName: 'Dra. Kohn', questionsRemaining: 3 });
    });
    const user = userEvent.setup();

    render(
      <ResultScreen
        theme="light"
        onToggleTheme={() => {}}
        onNavigate={() => {}}
        simData={unlockedSimData()}
        setSimData={() => {}}
        user={{ uid: 'user-1' } as any}
        onRequireLogin={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: /falar com os agentes/i }));
    await screen.findByText('Pergunta anterior');

    const input = screen.getByPlaceholderText(/pergunta para/i);
    await user.type(input, 'Nova pergunta');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    await screen.findByText('Resposta do advogado');
    expect(sendChatMessageMock).toHaveBeenCalledWith('sim-123', 'lawyer', 'Nova pergunta', expect.any(Function));
  });
});
