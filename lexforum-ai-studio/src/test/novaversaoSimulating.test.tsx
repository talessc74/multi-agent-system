import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { SimulatingScreen } from '../novaversao/screens/Simulating';
import { initialSimData } from '../novaversao/simState';
import type { SimData } from '../novaversao/simState';

// Regressão: a tela de Simulating do /novaversao navegava para o Resultado
// sem nunca chamar saveSimulation, então simulationId ficava null para
// sempre e o botão "Desbloquear laudo completo" virava um no-op silencioso —
// ninguém conseguia pagar. Ver Simulating.tsx.

const { simulateForumMock, simulateMode5Mock, generateReportMock } = vi.hoisted(() => ({
  simulateForumMock: vi.fn(),
  simulateMode5Mock: vi.fn(),
  generateReportMock: vi.fn(),
}));
vi.mock('../lib/gemini', () => ({
  simulateForum: simulateForumMock,
  simulateMode5: simulateMode5Mock,
  generateReport: generateReportMock,
}));

const { saveSimulationMock } = vi.hoisted(() => ({ saveSimulationMock: vi.fn() }));
vi.mock('../services/dbService', () => ({ saveSimulation: saveSimulationMock }));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderScreen(simData: SimData, setSimData: (fn: (prev: SimData) => SimData) => void, user: any = null) {
  return render(
    <SimulatingScreen
      theme="light"
      onToggleTheme={() => {}}
      onNavigate={() => {}}
      simData={simData}
      setSimData={setSimData as any}
      user={user}
    />
  );
}

describe('SimulatingScreen — saveSimulation garante simulationId', () => {
  it('modo forum (1-4): chama saveSimulation com userId null quando anônimo e grava o simulationId retornado', async () => {
    simulateForumMock.mockResolvedValue({
      rounds: [{ lawyerPetition: 'petição', judgeJudgment: 'julgamento', successProbability: 70 }],
    });
    generateReportMock.mockResolvedValue({ layman: 'x', professional: 'y', causeSummary: 'z' });
    saveSimulationMock.mockResolvedValue('sim-abc-123');

    let latest: SimData = initialSimData(1);
    latest.caseDescription = 'descrição da causa com mais de dez caracteres';
    const setSimData = (fn: (prev: SimData) => SimData) => {
      latest = fn(latest);
    };

    renderScreen(latest, setSimData, null);

    await waitFor(() => expect(saveSimulationMock).toHaveBeenCalledTimes(1));
    expect(saveSimulationMock).toHaveBeenCalledWith(
      null,
      'descrição da causa com mais de dez caracteres',
      expect.objectContaining({ finalSuccessProbability: 70 }),
      null,
      expect.objectContaining({ layman: 'x' }),
      null,
      1,
      null,
      null
    );
    await waitFor(() => expect(latest.simulationId).toBe('sim-abc-123'));
  });

  it('modo forum: usa o uid do usuário logado, não null, quando autenticado', async () => {
    simulateForumMock.mockResolvedValue({
      rounds: [{ lawyerPetition: 'p', judgeJudgment: 'j', successProbability: 55 }],
    });
    generateReportMock.mockResolvedValue(null);
    saveSimulationMock.mockResolvedValue('sim-xyz');

    let latest: SimData = initialSimData(1);
    latest.caseDescription = 'outra descrição válida da causa aqui';
    const setSimData = (fn: (prev: SimData) => SimData) => {
      latest = fn(latest);
    };

    renderScreen(latest, setSimData, { uid: 'user-42' });

    await waitFor(() => expect(saveSimulationMock).toHaveBeenCalledTimes(1));
    expect(saveSimulationMock.mock.calls[0][0]).toBe('user-42');
  });

  it('modo 5: também chama saveSimulation e grava simulationId', async () => {
    simulateMode5Mock.mockResolvedValue({
      successProbability: 60,
      recommendation: 'r',
      strategistAnalysis: 'a',
      reasoning: 're',
      judgeAgentName: 'Juiz X',
    });
    saveSimulationMock.mockResolvedValue('sim-mode5-1');

    let latest: SimData = initialSimData(5);
    latest.caseDescription = 'descrição do caso modo 5';
    latest.mode5SentencaOuProposta = 'texto da decisão recebida aqui';
    const setSimData = (fn: (prev: SimData) => SimData) => {
      latest = fn(latest);
    };

    renderScreen(latest, setSimData, null);

    await waitFor(() => expect(saveSimulationMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(latest.simulationId).toBe('sim-mode5-1'));
  });

  it('falha em saveSimulation não impede a navegação para o resultado (isolamento, mesma regra de App.tsx)', async () => {
    simulateForumMock.mockResolvedValue({
      rounds: [{ lawyerPetition: 'p', judgeJudgment: 'j', successProbability: 80 }],
    });
    generateReportMock.mockResolvedValue(null);
    saveSimulationMock.mockRejectedValue(new Error('network down'));

    let latest: SimData = initialSimData(1);
    latest.caseDescription = 'mais uma descrição válida de causa';
    const onNavigate = vi.fn();
    const setSimData = (fn: (prev: SimData) => SimData) => {
      latest = fn(latest);
    };

    render(
      <SimulatingScreen
        theme="light"
        onToggleTheme={() => {}}
        onNavigate={onNavigate}
        simData={latest}
        setSimData={setSimData as any}
        user={null}
      />
    );

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith({ screen: 'result', mode: 1 }));
    expect(latest.simulationId).toBeNull();
  });
});
