import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryScreen } from '../novaversao/screens/History';
import { simDataFromHistory } from '../novaversao/simState';

// Regressão: /novaversao não tinha nenhuma forma de ver ou reabrir casos já
// simulados por um usuário logado (App.tsx tem o painel "Meu histórico" via
// getUserSimulations + loadSimulation). Ver History.tsx e
// simState.simDataFromHistory.

const { getUserSimulationsMock } = vi.hoisted(() => ({ getUserSimulationsMock: vi.fn() }));
vi.mock('../services/dbService', () => ({ getUserSimulations: getUserSimulationsMock }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('HistoryScreen', () => {
  it('sem usuário logado, pede login e não consulta o Firestore', () => {
    render(
      <HistoryScreen theme="light" onToggleTheme={() => {}} onNavigate={() => {}} user={null} onSelect={() => {}} />
    );
    expect(screen.getByText(/faça login/i)).toBeInTheDocument();
    expect(getUserSimulationsMock).not.toHaveBeenCalled();
  });

  it('mostra o estado vazio quando o usuário não tem casos', async () => {
    getUserSimulationsMock.mockResolvedValue([]);
    render(
      <HistoryScreen theme="light" onToggleTheme={() => {}} onNavigate={() => {}} user={{ uid: 'u1' } as any} onSelect={() => {}} />
    );
    await screen.findByText(/nenhum caso simulado/i);
  });

  it('getUserSimulations rejeitando não trava em "Carregando…" para sempre', async () => {
    getUserSimulationsMock.mockRejectedValue(new Error('permission-denied'));
    render(
      <HistoryScreen theme="light" onToggleTheme={() => {}} onNavigate={() => {}} user={{ uid: 'u1' } as any} onSelect={() => {}} />
    );
    await screen.findByText(/nenhum caso simulado/i);
  });

  it('lista os casos do usuário e chama onSelect com o caso clicado', async () => {
    getUserSimulationsMock.mockResolvedValue([
      { id: 'sim-1', caseDescription: 'Descrição do caso um', caseSummary: 'Resumo do caso um', area: 'LABOR', finalSuccessProbability: 72, createdAt: '2026-01-15T00:00:00.000Z' },
    ]);
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <HistoryScreen theme="light" onToggleTheme={() => {}} onNavigate={() => {}} user={{ uid: 'u1' } as any} onSelect={onSelect} />
    );

    const card = await screen.findByText('Resumo do caso um');
    await user.click(card);

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'sim-1' }));
    expect(getUserSimulationsMock).toHaveBeenCalledWith('u1');
  });
});

describe('simDataFromHistory', () => {
  it('reconstrói o SimData de um caso comum (modo forum) já desbloqueado', () => {
    const sim = {
      id: 'sim-9',
      caseDescription: 'Descrição completa',
      caseSummary: 'Resumo',
      area: 'CIVIL',
      finalSuccessProbability: 81,
      lawyerAgentName: 'Dra. X',
      judgeAgentName: 'Dr. Y',
      rounds: [{ lawyerPetition: 'p', judgeJudgment: 'j', successProbability: 81 }],
      report: { layman: 'a', professional: 'b', causeSummary: 'Resumo' },
      selectedMode: 2,
      userSide: 'AUTHOR',
    };

    const data = simDataFromHistory(sim);

    expect(data.mode).toBe(2);
    expect(data.isUnlocked).toBe(true);
    expect(data.simulationId).toBe('sim-9');
    expect(data.simulation?.finalSuccessProbability).toBe(81);
    expect(data.report?.layman).toBe('a');
  });

  it('reconhece um caso de modo 5 pela presença de mode5Result', () => {
    const sim = {
      id: 'sim-10',
      caseDescription: 'Descrição modo 5',
      area: 'TAX',
      mode5Result: { successProbability: 40, subCase: 'ACORDO', reasoning: 'r', strategistAnalysis: 'a', judgeAgentName: 'Juiz Z' },
    };

    const data = simDataFromHistory(sim);

    expect(data.mode).toBe(5);
    expect(data.mode5SubCase).toBe('ACORDO');
    expect(data.mode5Result?.successProbability).toBe(40);
    expect(data.isUnlocked).toBe(true);
  });
});
