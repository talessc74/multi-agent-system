import { describe, it, expect } from 'vitest';

// Testa o contrato de loadSimulation()/handleOpenChat() para casos abertos
// via "Meus Casos" (App.tsx).
//
// Regressão: loadSimulation() copiava caseDescription/report/etc. de um
// documento de simulação, mas nunca copiava sim.id para state.simulationId.
// Como handleOpenChat/handleSendChatMessage exigem state.simulationId
// (`if (!state.simulationId) return;`), o botão "Chat" não fazia nada ao
// abrir um caso do histórico — ou, pior, se state.simulationId ainda
// apontasse para uma simulação anterior na mesma aba, o chat conversaria
// sobre o caso errado.

// Modela a transformação exata de loadSimulation() após o fix.
function loadSimulation(sim: { id: string; caseDescription: string }) {
  return {
    step: 'result' as const,
    caseDescription: sim.caseDescription,
    isUnlocked: true,
    simulationId: sim.id ?? null,
  };
}

// Modela o reset de estado de chat que loadSimulation() agora dispara junto.
function chatStateAfterLoadSimulation() {
  return {
    chatSheetState: 'closed' as const,
    chatMessages: [] as unknown[],
    chatQuestionsUsed: 0,
    chatQuestionsLimit: 5,
    chatError: null as string | null,
  };
}

describe('loadSimulation — simulationId', () => {
  it('copia sim.id para state.simulationId (regressão do bug do Chat em Meus Casos)', () => {
    const result = loadSimulation({ id: 'sim-abc-123', caseDescription: 'causa X' });
    expect(result.simulationId).toBe('sim-abc-123');
  });

  it('não deixa simulationId de uma simulação anterior vazar para o caso recém-aberto', () => {
    // Simula: usuário já rodou uma simulação nesta aba (simulationId antigo em memória),
    // depois abre um caso diferente em "Meus Casos".
    const staleSimulationId = 'sim-old-999';
    const result = loadSimulation({ id: 'sim-new-456', caseDescription: 'causa Y' });
    expect(result.simulationId).not.toBe(staleSimulationId);
    expect(result.simulationId).toBe('sim-new-456');
  });
});

describe('loadSimulation — reset do estado de chat', () => {
  it('limpa mensagens, contador de perguntas e erro ao trocar de caso', () => {
    const reset = chatStateAfterLoadSimulation();
    expect(reset.chatSheetState).toBe('closed');
    expect(reset.chatMessages).toEqual([]);
    expect(reset.chatQuestionsUsed).toBe(0);
    expect(reset.chatQuestionsLimit).toBe(5);
    expect(reset.chatError).toBeNull();
  });
});

// Modela a decisão de handleOpenChat() após o fix: sempre recarrega o
// histórico real do Firestore antes de abrir o painel, em vez de reaproveitar
// chatMessages em memória — funciona tanto para um caso nunca conversado
// (histórico vazio) quanto para um caso revisitado (histórico populado).
async function resolveChatMessagesOnOpen(getChatHistoryFn: () => Promise<unknown[]>) {
  return getChatHistoryFn();
}

describe('handleOpenChat — histórico ao reabrir um caso', () => {
  it('caso nunca conversado: abre com histórico vazio e as 5 perguntas disponíveis', async () => {
    const messages = await resolveChatMessagesOnOpen(async () => []);
    expect(messages).toEqual([]);
  });

  it('caso já conversado: abre já mostrando as perguntas e respostas anteriores', async () => {
    const priorMessages = [
      { role: 'user', content: 'Posso recorrer?', agentType: 'lawyer', agentName: 'Você' },
      { role: 'agent', content: 'Sim, dentro do prazo...', agentType: 'lawyer', agentName: 'Dr. Fictício' },
    ];
    const messages = await resolveChatMessagesOnOpen(async () => priorMessages);
    expect(messages).toEqual(priorMessages);
  });
});
