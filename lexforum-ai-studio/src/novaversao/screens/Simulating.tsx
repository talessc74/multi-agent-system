import React, { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { MODE_CONFIG } from '../../config/modeConfig';
import { simulateForum, simulateMode5, generateReport } from '../../lib/gemini';
import { saveSimulation, subscribeSimRecovery, getSimRecovery } from '../../services/dbService';
import type { SimulationResult } from '../../types';
import { Nav } from '../components/Nav';
import type { NvRoute } from '../router';
import type { SimData } from '../simState';
import { parseGeminiError } from '../geminiError';
import type { SimError } from '../geminiError';

interface SimulatingProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (route: NvRoute) => void;
  simData: SimData;
  setSimData: React.Dispatch<React.SetStateAction<SimData>>;
  user: User | null;
}

const themeColor = (cfg: (typeof MODE_CONFIG)[number], theme: 'dark' | 'light') =>
  theme === 'light' ? cfg.colorLight : cfg.color;

const STAGES = [
  { key: 'WRITING', label: 'Advogado-agente construindo a tese' },
  { key: 'DELIVERING', label: 'Protocolando a petição' },
  { key: 'JUDGING', label: 'Juiz-agente avaliando' },
  { key: 'REVIEWING', label: 'Revisando fundamentos' },
];

export const SimulatingScreen: React.FC<SimulatingProps> = ({ theme, onToggleTheme, onNavigate, simData, setSimData, user }) => {
  const cfg = MODE_CONFIG[simData.mode];
  const color = themeColor(cfg, theme);
  const [step, setStep] = useState('WRITING');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<SimError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const startedRef = useRef(false);

  // Recuperação de simulação: se a conexão SSE cair e simulateForum esgotar
  // as 3 tentativas, mas o servidor tiver terminado o processamento mesmo
  // assim, recuperamos o resultado em vez de descartar o trabalho já feito
  // — mesmo mecanismo de App.tsx (startRecovery/displayRecoveredResult).
  const recoverySessionIdRef = useRef<string | null>(null);
  const recoveryUnsubRef = useRef<(() => void) | null>(null);
  const isRecoveringRef = useRef(false);
  const simAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      simAbortRef.current?.abort();
      recoveryUnsubRef.current?.();
    };
  }, []);

  const finishForumSimulation = async (result: SimulationResult) => {
    if (isRecoveringRef.current) return;
    isRecoveringRef.current = true;
    try {
      // Melhor rodada: modo 4 defesa quer a MENOR probabilidade do autor
      // (= melhor para a defesa); todo o resto quer a maior. Mesma regra
      // de App.tsx (handleSimulate).
      const isDefenseMode = simData.mode === 4 && simData.userSide === 'DEFENSE';
      let bestRound = result.rounds[0];
      for (const round of result.rounds) {
        if (isDefenseMode ? round.successProbability <= bestRound.successProbability : round.successProbability >= bestRound.successProbability) {
          bestRound = round;
        }
      }
      const finalData: SimulationResult = { ...result, finalSuccessProbability: bestRound.successProbability };
      setSimData((prev) => ({ ...prev, simulation: finalData }));

      let report = null;
      try {
        const clientSide = simData.userSide ?? (simData.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
        report = await generateReport(bestRound.lawyerPetition, bestRound.judgeJudgment, clientSide);
      } catch {
        // generateReport não pode bloquear a exibição do resultado
      }
      setSimData((prev) => ({ ...prev, report }));

      // Salva a simulação para obter o simulationId — sem ele o botão
      // "Desbloquear" na tela de Resultado não tem o que enviar ao
      // checkout. Falha aqui não pode bloquear a exibição do resultado,
      // mesma regra de isolamento de App.tsx (handleSimulate).
      try {
        const simId = await saveSimulation(
          user?.uid || null,
          simData.caseDescription,
          finalData,
          simData.caseSummary,
          report,
          null,
          simData.mode,
          simData.userSide ?? null,
          simData.userPole ?? null
        );
        setSimData((prev) => ({ ...prev, simulationId: simId }));
      } catch (e) {
        console.error('[Simulating] saveSimulation falhou:', e);
      }

      onNavigate({ screen: 'result', mode: simData.mode });
    } finally {
      isRecoveringRef.current = false;
    }
  };

  const startRecovery = (sessionId: string) => {
    setStep('RECOVERING');
    setRetryCount(0);

    const unsubscribe = subscribeSimRecovery(sessionId, (status, result) => {
      if (status === 'complete' && result?.rounds?.length) {
        recoveryUnsubRef.current?.();
        recoveryUnsubRef.current = null;
        finishForumSimulation(result as SimulationResult);
      } else if (status === 'error') {
        recoveryUnsubRef.current?.();
        recoveryUnsubRef.current = null;
        setError(parseGeminiError(new Error('Simulação encerrada com erro no servidor.')));
      }
    });
    recoveryUnsubRef.current = unsubscribe;

    setTimeout(() => {
      if (!recoveryUnsubRef.current) return;
      recoveryUnsubRef.current();
      recoveryUnsubRef.current = null;
      setError({
        message: 'Sua conexão caiu durante a simulação. Não foi possível recuperar o resultado. Seus dados estão preservados — tente novamente.',
        isQuota: false,
        isRetryable: true,
      });
    }, 5 * 60 * 1000);
  };

  // Safari: quando a aba volta a ficar visível, confere o Firestore na hora
  // em vez de esperar o listener do onSnapshot acordar.
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      if (step !== 'RECOVERING') return;
      const sessionId = recoverySessionIdRef.current;
      if (!sessionId) return;
      const recovery = await getSimRecovery(sessionId);
      if (recovery?.status === 'complete' && recovery.result?.rounds?.length) {
        recoveryUnsubRef.current?.();
        recoveryUnsubRef.current = null;
        finishForumSimulation(recovery.result as SimulationResult);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const run = () => {
    setError(null);
    if (simData.mode === 5) {
      simulateMode5(
        {
          subCase: simData.mode5SubCase,
          caseDescription: simData.caseDescription,
          sentencaOuProposta: simData.mode5SentencaOuProposta,
          attachments: simData.attachments,
        },
        simData.detectedArea ?? 'OTHER',
        simData.attachments,
        simData.specificJudge,
        (s) => setStep(s)
      )
        .then(async (result) => {
          setSimData((prev) => ({ ...prev, mode5Result: result }));

          const mode5SimResult: SimulationResult = {
            area: simData.detectedArea ?? 'OTHER',
            rounds: [],
            finalSuccessProbability: result.successProbability,
            lawyerAgentName: undefined,
            judgeAgentName: result.judgeAgentName,
          };
          try {
            const simId = await saveSimulation(user?.uid || null, simData.caseDescription, mode5SimResult, null, null, {
              successProbability: result.successProbability,
              recommendation: result.recommendation,
              strategistAnalysis: result.strategistAnalysis,
              reasoning: result.reasoning,
              subCase: simData.mode5SubCase,
              judgeAgentName: result.judgeAgentName,
            });
            setSimData((prev) => ({ ...prev, simulationId: simId }));
          } catch (e) {
            console.error('[Simulating] saveSimulation (mode5) falhou:', e);
          }

          onNavigate({ screen: 'result', mode: simData.mode });
        })
        .catch((err) => setError(parseGeminiError(err)));
      return;
    }

    recoverySessionIdRef.current = null;
    setRetryCount(0);
    simAbortRef.current = new AbortController();

    simulateForum(
      simData.caseDescription,
      simData.detectedArea ?? 'OTHER',
      simData.attachments,
      simData.specificJudge,
      (s, progressData) => {
        setStep(s);
        // Só captura o sessionId da primeira tentativa — retries geram
        // novas sessões no servidor (mesma regra de App.tsx).
        if (s === 'SEED_CREATED' && progressData?.sessionId && !recoverySessionIdRef.current) {
          recoverySessionIdRef.current = progressData.sessionId;
        }
      },
      simData.mode,
      simData.defenseDescription,
      simData.defenseAttachments,
      simData.userSide,
      (attempt) => setRetryCount(attempt),
      simAbortRef.current.signal
    )
      .then((result: SimulationResult) => {
        if (!result.rounds || result.rounds.length === 0) {
          throw new Error('Simulação retornou sem rodadas. Tente novamente.');
        }
        return finishForumSimulation(result);
      })
      .catch((err) => {
        if (err?.message === 'MAX_RETRIES_EXCEEDED' && recoverySessionIdRef.current) {
          startRecovery(recoverySessionIdRef.current);
          return;
        }
        setError(parseGeminiError(err));
      });
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeIndex = STAGES.findIndex((s) => s.key === step);

  return (
    <>
      <Nav theme={theme} onToggleTheme={onToggleTheme} onNavigate={onNavigate} user={user} />
      <div className="nv-container" style={{ padding: '48px 40px 60px', maxWidth: 640 }}>
        <p className="nv-kicker" style={{ marginBottom: 8 }}>01</p>
        <h1 style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 28, color: 'var(--nv-ink)', margin: '0 0 8px' }}>
          Advogado-agente construindo sua tese
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--nv-ink-2)', marginBottom: 4 }}>Isso normalmente leva entre 20 e 60 segundos.</p>
        <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, color: 'var(--nv-ink-3)', marginBottom: 32 }}>{elapsed}S DECORRIDOS</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STAGES.map((s, i) => {
            const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';
            return (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  border: `1px solid ${state === 'active' ? color : 'var(--nv-line)'}`,
                  background: state === 'active' ? 'var(--nv-red-soft)' : 'transparent',
                  opacity: state === 'pending' ? 0.45 : 1,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: `1px solid ${state === 'done' ? color : 'var(--nv-line-2)'}`,
                    background: state === 'done' ? color : 'transparent',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13.5, color: 'var(--nv-ink)' }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ height: 3, background: 'var(--nv-line)', marginTop: 28, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: color,
              width: `${Math.min(100, ((activeIndex + 1) / STAGES.length) * 100)}%`,
              transition: 'width 0.6s ease',
            }}
          />
        </div>

        {step === 'RECOVERING' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--nv-line)', padding: '12px 16px', marginTop: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--nv-ink-2)' }}>
              Verificando sua simulação…
            </span>
          </div>
        )}

        {retryCount > 0 && step !== 'RECOVERING' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--nv-line)', padding: '12px 16px', marginTop: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--nv-ink-2)' }}>
              Reconectando, tentativa {retryCount} de 3
            </span>
          </div>
        )}

        {error && (
          <div style={{ border: `1px solid var(--nv-red)`, background: 'var(--nv-red-soft)', padding: '16px 18px', marginTop: 28 }}>
            <p style={{ fontSize: 13, color: 'var(--nv-ink)', margin: '0 0 12px' }}>{error.message}</p>
            {error.isRetryable && (
              <button
                type="button"
                onClick={() => {
                  setStep('WRITING');
                  setElapsed(0);
                  run();
                }}
                style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', background: 'var(--nv-ink)', color: 'var(--nv-paper)', border: 'none', padding: '10px 18px', cursor: 'pointer' }}
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
