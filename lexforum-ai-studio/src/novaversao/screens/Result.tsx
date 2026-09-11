import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { MODE_CONFIG } from '../../config/modeConfig';
import {
  hasUserPaidForSession,
  registrarAcessoLaudo,
  getSimulationById,
} from '../../services/dbService';
import { initiateCheckout } from '../../services/checkoutService';
import { Nav } from '../components/Nav';
import { NvLink } from '../components/NvLink';
import { RedactedText } from '../components/RedactedText';
import type { NvRoute } from '../router';
import type { SimData } from '../simState';
import { routePath } from '../router';

interface ResultProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (route: NvRoute) => void;
  simData: SimData;
  setSimData: React.Dispatch<React.SetStateAction<SimData>>;
  user: User | null;
  onRequireLogin: () => void;
}

const themeColor = (cfg: (typeof MODE_CONFIG)[number], theme: 'dark' | 'light') =>
  theme === 'light' ? cfg.colorLight : cfg.color;

export const ResultScreen: React.FC<ResultProps> = ({ theme, onToggleTheme, onNavigate, simData, setSimData, user, onRequireLogin }) => {
  const cfg = MODE_CONFIG[simData.mode];
  const color = themeColor(cfg, theme);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [showPromo, setShowPromo] = useState(false);

  const isMode5 = simData.mode === 5;
  const bestRound = simData.simulation?.rounds?.length
    ? simData.simulation.rounds[simData.simulation.rounds.length - 1]
    : null;
  const pct = isMode5 ? simData.mode5Result?.successProbability ?? 0 : simData.simulation?.finalSuccessProbability ?? 0;
  const displayPct = simData.mode === 4 && simData.userSide === 'DEFENSE' ? 100 - pct : pct;
  const price = [3, 5].includes(simData.mode) ? 'R$ 5,90' : 'R$ 9,90';

  // Volta do Stripe: ?sim=<id> na própria rota /novaversao/.../resultado
  // (success_url agora respeita returnPath — ver server.ts safeReturnPath).
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const simId = params.get('sim');
    if (!simId) return;
    hasUserPaidForSession(user.uid, simId).then(async (paid) => {
      if (!paid) return;
      await registrarAcessoLaudo(user.uid, simId);
      const sim: any = await getSimulationById(simId);
      if (sim) {
        setSimData((prev) => ({
          ...prev,
          isUnlocked: true,
          simulationId: simId,
          simulation: sim.rounds ? { area: sim.area, rounds: sim.rounds, finalSuccessProbability: sim.finalSuccessProbability, lawyerAgentName: sim.lawyerAgentName, judgeAgentName: sim.judgeAgentName } : prev.simulation,
          report: sim.report ?? prev.report,
          mode5Result: sim.mode5Result ?? prev.mode5Result,
        }));
      } else {
        setSimData((prev) => ({ ...prev, isUnlocked: true, simulationId: simId }));
      }
      window.history.replaceState({}, '', routePath({ screen: 'result', mode: simData.mode }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUnlock = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }
    if (!simData.simulationId) return;
    setCheckoutLoading(true);
    try {
      const url = await initiateCheckout(user, simData.simulationId, simData.mode, {
        promoCode: promoCode.trim() || undefined,
        returnPath: routePath({ screen: 'result', mode: simData.mode }),
      });
      if (url) window.location.href = url;
    } catch (err) {
      console.error('[Checkout] Erro:', err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <Nav theme={theme} onToggleTheme={onToggleTheme} onNavigate={onNavigate} />
      <div className="nv-container" style={{ padding: '40px 40px 60px', maxWidth: 760 }}>
        <p className="nv-kicker" style={{ marginBottom: 8 }}>
          Modo {String(simData.mode).padStart(2, '0')} · {cfg.headline}
        </p>
        <h1 style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 30, color: 'var(--nv-ink)', margin: '0 0 32px' }}>
          {simData.isUnlocked ? (
            <>
              Laudo <strong style={{ fontWeight: 700, fontStyle: 'normal' }}>estratégico</strong> completo.
            </>
          ) : (
            <>
              Seu laudo está <em>quase</em> pronto.
            </>
          )}
        </h1>

        <div style={{ marginBottom: 8 }}>
          <span style={{ display: 'block', fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(56px, 10vw, 88px)', lineHeight: 0.95, color }}>
            {displayPct}%
          </span>
          <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nv-ink-2)', display: 'block', marginTop: 6 }}>
            Índice de força argumentativa
          </span>
          <p style={{ fontSize: 13, color: 'var(--nv-ink-3)', maxWidth: '46ch', marginTop: 10 }}>
            Estimativa baseada na sua descrição. Não é probabilidade estatística. Resultados reais variam.
          </p>
        </div>

        <hr className="nv-hr" style={{ margin: '32px 0' }} />

        {!simData.isUnlocked && (
          <>
            {isMode5 ? (
              <>
                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', marginBottom: 8 }}>
                    Análise do juiz estrategista
                  </p>
                  <p style={{ fontSize: 15.5, lineHeight: 1.65, color: 'var(--nv-ink)' }}>
                    <RedactedText text={simData.mode5Result?.strategistAnalysis ?? ''} enabled seed={0} />
                  </p>
                </div>
                <div style={{ marginBottom: 28 }}>
                  <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', marginBottom: 8 }}>
                    Fundamentação jurídica
                  </p>
                  <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 13, lineHeight: 1.75, color: 'var(--nv-ink-2)' }}>
                    <RedactedText text={simData.mode5Result?.reasoning ?? ''} enabled seed={5} />
                  </p>
                </div>
              </>
            ) : (
              bestRound && (
                <>
                  <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', marginBottom: 22 }}>
                    Rodada {simData.simulation?.rounds.length} · contraditório simulado
                  </p>
                  <div style={{ marginBottom: 30 }}>
                    <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', marginBottom: 6 }}>
                      Advogado especializado · petição
                    </p>
                    <p style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontSize: 16.5, lineHeight: 1.65, color: 'var(--nv-ink)' }}>
                      &ldquo;<RedactedText text={bestRound.lawyerPetition} enabled seed={0} />&rdquo;
                    </p>
                  </div>
                  <div style={{ marginBottom: 30 }}>
                    <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', marginBottom: 6 }}>
                      Magistrado técnico · avaliação
                    </p>
                    <p style={{ fontSize: 16.5, lineHeight: 1.65, color: 'var(--nv-ink)' }}>
                      &ldquo;<RedactedText text={bestRound.judgeJudgment} enabled seed={5} />&rdquo;
                    </p>
                  </div>
                </>
              )
            )}

            <div style={{ borderTop: '1px solid var(--nv-line-2)', borderBottom: '1px solid var(--nv-line-2)', padding: '40px 0', margin: '40px 0' }}>
              <h3 style={{ fontFamily: 'var(--nv-serif)', fontWeight: 600, fontSize: 22, color: 'var(--nv-ink)', margin: '0 0 10px' }}>
                Simulação de rodadas concluída.
              </h3>
              <p style={{ fontSize: 14, color: 'var(--nv-ink-2)', lineHeight: 1.6, maxWidth: '52ch', margin: '0 0 26px' }}>
                O laudo estratégico completo com fundamentos técnicos, valor estimado da causa e próximos passos processuais foi gerado.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 18 }}>
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={checkoutLoading}
                  style={{ fontFamily: 'var(--nv-mono)', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--nv-ink)', color: 'var(--nv-paper)', border: 'none', borderRadius: 2, padding: '15px 26px', cursor: 'pointer', opacity: checkoutLoading ? 0.7 : 1 }}
                >
                  {checkoutLoading ? 'Redirecionando…' : 'Desbloquear laudo completo'}
                </button>
                <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 13, color: 'var(--nv-ink-3)' }}>
                  Investimento<strong style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--nv-ink)', fontWeight: 500, marginLeft: 4 }}>{price}</strong>
                </span>
              </div>
              {!showPromo ? (
                <button type="button" onClick={() => setShowPromo(true)} style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, color: 'var(--nv-ink-3)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                  Tenho um código promocional
                </button>
              ) : (
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="CÓDIGO PROMO"
                  style={{ fontFamily: 'var(--nv-mono)', fontSize: 12, padding: '8px 12px', border: '1px solid var(--nv-line-2)', background: 'var(--nv-paper-2)', color: 'var(--nv-ink)' }}
                />
              )}
              <div style={{ display: 'flex', gap: 0, marginTop: 24, flexWrap: 'wrap' }}>
                {['Pagamento seguro', 'Acesso vitalício', 'Formato profissional'].map((t, i) => (
                  <span key={t} style={{ fontFamily: 'var(--nv-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', padding: i === 0 ? '0 16px 0 0' : '0 16px', borderRight: i < 2 ? '1px solid var(--nv-line)' : 'none' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {simData.isUnlocked && (
          <>
            {isMode5 ? (
              <>
                <div style={{ marginBottom: 40 }}>
                  <span className="nv-kicker" style={{ display: 'inline-block', background: 'var(--nv-paper-2)', color: 'var(--nv-ink)', padding: '6px 12px', fontSize: 10.5 }}>
                    Análise do juiz estrategista
                  </span>
                  <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--nv-ink)', maxWidth: '62ch', marginTop: 18 }}>{simData.mode5Result?.strategistAnalysis}</p>
                </div>
                <div style={{ marginBottom: 40 }}>
                  <span className="nv-kicker" style={{ display: 'inline-block', background: 'var(--nv-paper-2)', color: 'var(--nv-ink)', padding: '6px 12px', fontSize: 10.5 }}>
                    Fundamentação jurídica
                  </span>
                  <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 13, lineHeight: 1.8, color: 'var(--nv-ink-2)', maxWidth: '62ch', marginTop: 18 }}>{simData.mode5Result?.reasoning}</p>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 40 }}>
                  <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--nv-paper-2)', color: 'var(--nv-ink)', display: 'inline-block', padding: '6px 12px' }}>
                    Volume I — Orientação ao cliente
                  </span>
                  <span style={{ display: 'block', fontFamily: 'var(--nv-mono)', fontSize: 9.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', margin: '8px 0 18px' }}>
                    Linguagem acessível e prática
                  </span>
                  <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--nv-ink)', maxWidth: '62ch' }}>{simData.report?.layman}</p>
                </div>
                <hr className="nv-hr" style={{ margin: '0 0 40px' }} />
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--nv-paper-2)', color: 'var(--nv-ink)', display: 'inline-block', padding: '6px 12px' }}>
                    Volume II — Laudo técnico estratégico
                  </span>
                  <span style={{ display: 'block', fontFamily: 'var(--nv-mono)', fontSize: 9.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', margin: '8px 0 18px' }}>
                    Fundamentação jurídica e normativa
                  </span>
                  <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 13, lineHeight: 1.8, color: 'var(--nv-ink-2)', maxWidth: '62ch' }}>{simData.report?.professional}</p>
                </div>
                {simData.caseSummary && [1, 2].includes(simData.mode) && (
                  <>
                    <hr className="nv-hr" style={{ margin: '0 0 40px' }} />
                    <div>
                      <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--nv-paper-2)', color: 'var(--nv-ink)', display: 'inline-block', padding: '6px 12px' }}>
                        Resumo da causa
                      </span>
                      <span style={{ display: 'block', fontFamily: 'var(--nv-mono)', fontSize: 9.5, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', margin: '8px 0 18px' }}>
                        Para apresentar a um advogado — não é peça processual
                      </span>
                      <p style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--nv-ink)', maxWidth: '62ch' }}>{simData.caseSummary}</p>
                    </div>
                  </>
                )}
              </>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 40 }}>
              <button type="button" onClick={() => window.print()} style={{ fontFamily: 'var(--nv-mono)', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--nv-ink)', color: 'var(--nv-paper)', border: 'none', borderRadius: 2, padding: '15px 26px', cursor: 'pointer' }}>
                Baixar PDF
              </button>
              <NvLink to={{ screen: 'home' }} onNavigate={onNavigate} style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-ink-2)', textDecoration: 'underline' }}>
                Nova simulação
              </NvLink>
            </div>
          </>
        )}

        <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', lineHeight: 1.7, border: '1px solid var(--nv-line)', padding: '16px 18px', marginTop: 36 }}>
          O EAI? é uma ferramenta de apoio analítico baseada em modelos de linguagem avançados. Não substitui o
          aconselhamento jurídico profissional. Não garante resultado judicial.
        </p>
      </div>
    </>
  );
};
