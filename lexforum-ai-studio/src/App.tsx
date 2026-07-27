/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scale,
  Gavel,
  FileText,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Search,
  HeartHandshake,
  MessageCircle,
  Swords,
  Shield,
  ArrowRight,
  Loader2,
  ChevronRight,
  TrendingUp,
  Lock,
  Unlock,
  CheckCircle2,
  Image as ImageIcon,
  File as FileIcon,
  X,
  Plus,
  Cpu,
  Database,
  Activity,
  History
} from 'lucide-react';
import { SimulationResult, ReportContent, AppState, Attachment, Mode5Input, Mode5Result, ChatMessage } from './types';
import { validateCausa, simulateForum, generateReport, simulateMode5, generateCounterHypotheses, expandHypothesis } from './lib/gemini';
import { auth, loginWithGoogle, logoutUser, getGoogleRedirectResult } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getStats, getAreaStats, saveSimulation, getUserSimulations, hasUserPaidForSession, createOrUpdateUser, getUserAccessLevel, getSimulationById, registrarAcessoLaudo, subscribeSimRecovery, getSimRecovery } from './services/dbService';
import TermosPage from './pages/TermosPage';
import ChatPanel, { SheetState } from './components/ChatPanel';
import { useTheme } from './hooks/useTheme';
import type { ModeConfig } from './config/modeConfig';
import { getChatStatus, createChatCheckoutSession, sendChatMessage, getChatHistory } from './services/chatService';


const CensoredText = ({ text, enabled }: { text: string; enabled: boolean }) => {
  if (!enabled) return <>{text}</>;

  const words = text.split(' ');
  const visibleCount = Math.ceil(words.length * 0.4); // primeiros 40% sempre visíveis

  const visibleText = words.slice(0, visibleCount).join(' ');
  const hiddenWords  = words.slice(visibleCount);

  const result: React.ReactNode[] = [];
  if (visibleText) result.push(<span key="visible">{visibleText} </span>);

  // Últimos 60% censurados em blocos determinísticos (sem Math.random)
  const CHUNK_SIZES = [4, 6, 3, 5, 4, 7, 3];
  let i = 0;
  let chunkIdx = 0;
  while (i < hiddenWords.length) {
    const size  = CHUNK_SIZES[chunkIdx % CHUNK_SIZES.length];
    const chunk = hiddenWords.slice(i, i + size).join(' ');
    if (chunk) {
      result.push(
        <span
          key={`c-${i}`}
          className="bg-black text-black select-none mx-0.5 rounded-none px-1 inline-block leading-none h-[1.1em] align-middle border-y border-white/5 shadow-sm"
          title="CONTEÚDO CENSURADO"
        >
          {chunk.replace(/./g, 'X')}
        </span>
      );
    }
    i += size;
    chunkIdx++;
  }

  return <>{result}</>;
};


import { Logo } from './components/Logo';
import { Navbar } from './components/Navbar';
import BoardroomPage from './pages/BoardroomPage';
import { ContextZone } from './components/ContextZone';
import { ModeNavbar } from './components/ModeNavbar';
import { SessionStatusBar } from './components/SessionStatusBar';
import { ProgressDots } from './components/ProgressDots';
import { FlowStepper } from './components/FlowStepper';
import { MODE_CONFIG } from './config/modeConfig';
import LoginModal from './components/LoginModal';
import { initiateCheckout } from './services/checkoutService';

const cleanJudgmentText = (text: string) => {
  if (!text) return "";
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      if (parsed.judgment) return (parsed.judgment as string).trim();
      const parts = [
        parsed.author_summary ? `AUTOR: ${parsed.author_summary}` : '',
        parsed.defense_summary ? `DEFESA: ${parsed.defense_summary}` : ''
      ].filter(Boolean);
      if (parts.length > 0) return parts.join('\n').trim();
    }
  } catch {}
  let cleaned = text.replace(/```json\s*\{\s*"success_probability"\s*:\s*\d+\s*\}\s*```/gs, '');
  cleaned = cleaned.replace(/\{\s*"success_probability"\s*:\s*\d+\s*\}/gs, '');
  cleaned = cleaned.trim();
  if (cleaned.length < 5 && text.includes('success_probability')) {
    return "A análise técnica foi processada e a probabilidade de êxito calculada com base nos fundamentos apresentados pelo Magistrado.";
  }
  return cleaned;
};

function formatSimDate(createdAt: unknown): string {
  if (!createdAt) return '—';
  if (typeof createdAt === 'object' && createdAt !== null) {
    if ('toDate' in createdAt) {
      return (createdAt as any).toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    if ('_seconds' in createdAt) {
      return new Date((createdAt as any)._seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    }
  }
  const d = new Date(createdAt as string | number);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function LaudoMobile({ state, modeColor, onRestart, onSelectHypothesis, onGoToMode4, onShowHypotheses, onOpenChat }: { state: any; modeColor: string; onRestart: () => void; onSelectHypothesis?: (hyp: string) => void; onGoToMode4?: () => void; onShowHypotheses?: () => void; onOpenChat?: () => void; }) {
  const { theme } = useTheme();
  const ctaTextColor = theme === 'light' ? '#FFFFFF' : '#000000';
  const [activeVolume, setActiveVolume] = React.useState<'I' | 'II'>('I');
  const finalPct = state.selectedMode === 5 ? (state.mode5Result?.successProbability ?? 0) : (state.simulation?.finalSuccessProbability ?? 0);
  const effectiveSide = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
  const displayPct = (state.selectedMode === 4 && effectiveSide === 'DEFENSE') ? 100 - finalPct : finalPct;
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [isExpanding, setIsExpanding] = React.useState(false);
  const [showMode4Preview, setShowMode4Preview] = React.useState(false);
  const handlePrint = () => {
    setIsPrinting(true);
    document.body.classList.add('eai-printing');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('eai-printing');
    }, 300);
  };
  return (
    <div className="flex flex-col md:hidden eai-laudo-mobile" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-primary)' }}>
      <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', margin: '12px 20px 0', flexShrink: 0 }}>
        <button onClick={() => setActiveVolume('I')} style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: activeVolume === 'I' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', border: 'none', background: activeVolume === 'I' ? 'var(--bg-primary)' : 'transparent', borderRadius: activeVolume === 'I' ? '8px' : 0, margin: activeVolume === 'I' ? '4px' : 0, transition: 'all 0.2s' }}>Volume I: Orientação</button>
        <button onClick={() => setActiveVolume('II')} style={{ flex: 1, padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: activeVolume === 'II' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', border: 'none', background: activeVolume === 'II' ? 'var(--bg-primary)' : 'transparent', borderRadius: activeVolume === 'II' ? '8px' : 0, margin: activeVolume === 'II' ? '4px' : 0, transition: 'all 0.2s' }}>Volume II: Técnico</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 'calc(96px + env(safe-area-inset-bottom))', scrollbarWidth: 'none' }}>
        <div style={{ textAlign: 'center', padding: '24px 20px 16px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px' }}>Índice de força argumentativa</p>
          <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '56px', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1, color: modeColor, margin: '0 0 6px' }}>{state.selectedMode === 5 ? `${state.mode5Result?.successProbability ?? 0}%` : `${displayPct}%`}</p>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: '240px', margin: '0 auto' }}>Estimativa baseada na sua descrição. Não é probabilidade estatística.</p>
        </div>
        {(state.selectedMode === 3 || state.selectedMode === 4) && (() => {
          const isDefenseBar = state.selectedMode === 4 && effectiveSide === 'DEFENSE';
          const barFill = isDefenseBar ? displayPct : finalPct;
          const leftLabel = isDefenseBar ? `Réu ${displayPct}%` : `${finalPct}% Autor`;
          const rightLabel = isDefenseBar ? `Autor ${100 - displayPct}%` : `Réu ${100 - finalPct}%`;
          return (
            <div style={{ margin: '0 20px 16px', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: modeColor }}>{leftLabel}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{rightLabel}</span>
              </div>
              <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${barFill}%`, height: '100%', borderRadius: '4px', background: `linear-gradient(to right, ${modeColor}, var(--success))`, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })()}
        {state.selectedMode === 5 && state.mode5Result && (() => {
          const rec = state.mode5Result.recommendation;
          const recColor = rec === 'RECORRER' ? 'var(--danger)' : rec === 'ACEITAR' ? 'var(--success)' : 'rgb(var(--warning-rgb))';
          const RecIcon = rec === 'RECORRER' ? Scale : rec === 'ACEITAR' ? CheckCircle2 : HeartHandshake;
          const recLabel = rec === 'RECORRER' ? 'Recorrer' : rec === 'ACEITAR' ? 'Aceitar' : 'Negociar';
          return (
            <div style={{ margin: '0 20px 16px', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Recomendação</p>
              <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '22px', fontStyle: 'italic', fontWeight: 700, color: recColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <RecIcon style={{ width: '20px', height: '20px' }} /> {recLabel}
              </p>
            </div>
          );
        })()}
        {activeVolume === 'I' && (
          <div style={{ padding: '0 20px 16px' }}>
            {state.selectedMode === 5 && state.mode5Result && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '8px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Análise do Juiz Estrategista</p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{state.mode5Result.strategistAnalysis}</p>
              </div>
            )}
            {state.selectedMode !== 5 && state.report && (state.report.layman || state.report.professional) && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--success)', marginBottom: '12px' }}>Orientação ao Cliente</p>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}><ReactMarkdown>{state.report.layman || state.report.professional || ''}</ReactMarkdown></div>
              </div>
            )}
            {(state.selectedMode === 1 || state.selectedMode === 2) && state.report?.causeSummary && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Resumo da Causa</p>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}><ReactMarkdown>{state.report.causeSummary}</ReactMarkdown></div>
              </div>
            )}
            {(state.detectedArea === 'FAMILY' || state.detectedArea === 'SOCIAL_SECURITY') && (
              <div style={{ padding: '16px', background: 'rgba(var(--warning-rgb),0.05)', border: '1px solid rgba(var(--warning-rgb),0.2)', borderRadius: '12px', marginTop: '16px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(var(--warning-rgb),0.8)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}><HeartHandshake style={{ width: '14px', height: '14px' }} /> Recursos de Apoio</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 6px' }}>Em situação de violência, ligue <strong style={{ color: 'var(--text-primary)' }}>180</strong>: Central de Atendimento à Mulher.</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 6px' }}>Em sofrimento emocional, ligue <strong style={{ color: 'var(--text-primary)' }}>188</strong>: CVV.</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>Apoio jurídico gratuito: <strong style={{ color: 'var(--text-primary)' }}>Defensoria Pública</strong> ou <strong style={{ color: 'var(--text-primary)' }}>CRAS</strong>.</p>
              </div>
            )}

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center', padding: '16px 0 4px' }}>O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado.</p>
          </div>
        )}
        {activeVolume === 'II' && (
          <div style={{ padding: '0 20px 16px' }}>
            {state.selectedMode === 5 && state.mode5Result && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Fundamentação Jurídica</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: 'monospace' }}>{state.mode5Result.reasoning}</p>
              </div>
            )}
            {state.selectedMode !== 5 && state.report?.professional && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Laudo Técnico Estratégico</p>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}><ReactMarkdown>{state.report.professional}</ReactMarkdown></div>
              </div>
            )}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center', padding: '16px 0 4px' }}>O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado.</p>
          </div>
        )}
      </div>
      <div style={{ position: 'sticky', bottom: 0, padding: '12px 20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', background: 'linear-gradient(to bottom, transparent 0%, var(--bg-primary) 35%)', flexShrink: 0 }}>

        {/* Carregando hipóteses */}
        {state.showHypotheses && !state.counterHypotheses?.length && !state.expandedHypothesis && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', marginBottom: '10px' }}>
            <Loader2 className="animate-spin" style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Gerando hipóteses...</span>
          </div>
        )}

        {/* Hipóteses prontas */}
        {state.counterHypotheses && state.counterHypotheses.length > 0 && !state.expandedHypothesis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 4px' }}>Como o réu pode reagir:</p>
            {isExpanding ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <Loader2 className="animate-spin" style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Expandindo argumento...</span>
              </div>
            ) : (
              state.counterHypotheses.map((hyp: string, i: number) => (
                <button
                  key={i}
                  onClick={async () => { setIsExpanding(true); await onSelectHypothesis?.(hyp); setIsExpanding(false); }}
                  style={{ padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Opção {String.fromCharCode(65 + i)}</span>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{hyp}</p>
                </button>
              ))
            )}
          </div>
        )}

        {/* Hipótese expandida — só exibe se NÃO estiver já no Modo 4 */}
        {state.expandedHypothesis && state.selectedMode !== 5 && state.selectedMode !== 4 && (
          <button
            onClick={onGoToMode4}
            style={{ width: '100%', padding: '16px', background: modeColor, color: ctaTextColor, border: 'none', fontSize: '13px', fontWeight: 700, borderRadius: '14px', cursor: 'pointer', marginBottom: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            Simular contraditório no Modo 4 →
          </button>
        )}

        {/* Barra normal */}
        {!state.showHypotheses && !state.expandedHypothesis && (
          <>
            <button onClick={handlePrint} disabled={isPrinting} style={{ width: '100%', padding: '16px', background: modeColor, color: ctaTextColor, border: 'none', fontSize: '15px', fontWeight: 700, borderRadius: '14px', cursor: isPrinting ? 'not-allowed' : 'pointer', opacity: isPrinting ? 0.8 : 1, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {isPrinting ? <><Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} /> Gerando PDF...</> : 'Exportar PDF'}
            </button>
            {isPrinting && (
              <button onClick={() => setIsPrinting(false)} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', borderRadius: '10px', cursor: 'pointer', marginTop: '8px' }}>
                Cancelar
              </button>
            )}
            {(state.selectedMode === 1) && (
              <>
                <button
                  onClick={() => setShowMode4Preview(prev => !prev)}
                  style={{ width: '100%', padding: '14px 16px', marginTop: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Scale style={{ width: '14px', height: '14px' }} /> Ver como a outra parte vai reagir</span>
                  <span>{showMode4Preview ? '↑' : '→'}</span>
                </button>

                {showMode4Preview && (
                  <div style={{ marginTop: '8px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Mesa Dupla Assistida</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>Advogado e juiz simulam os dois lados do seu caso. Você recebe análise completa com estratégia de ação.</p>
                    <button
                      onClick={() => { setShowMode4Preview(false); onShowHypotheses?.(); }}
                      style={{ width: '100%', padding: '14px', background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    >
                      Escolher hipótese →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {onOpenChat && (
          <button onClick={onOpenChat} style={{ width: '100%', padding: '14px', background: modeColor, color: ctaTextColor, border: 'none', fontSize: '14px', fontWeight: 700, borderRadius: '14px', cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <MessageCircle style={{ width: '16px', height: '16px' }} /> Falar com os agentes
          </button>
        )}
        <button onClick={onRestart} style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, borderRadius: '14px', cursor: 'pointer', marginTop: '10px' }}>Nova simulação</button>
      </div>
    </div>
  );
}

export default function App() {
  const { theme } = useTheme();
  // MODE_CONFIG[...].color is calibrated for dark backgrounds only; colorLight
  // is the ~4.5:1-contrast variant for the light theme (same pattern as
  // BoardroomPage's modeColor/modeColorRgb).
  const themeColor = (cfg: ModeConfig) => (theme === 'light' ? cfg.colorLight : cfg.color);
  const themeColorRgb = (cfg: ModeConfig) => (theme === 'light' ? cfg.colorRgbLight : cfg.colorRgb);
  const ctaTextColor = theme === 'light' ? '#FFFFFF' : '#000000';
  const [user, setUser] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  // ADR-006: nenhum destes três é um valor real até fetchInitialStats() resolver —
  // statsLoading controla o estado visual enquanto isso não acontece.
  const [globalStats, setGlobalStats] = useState({ simulations: 0, winRate: 0, precision: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [state, setState] = useState<AppState>({
    step: 'boardroom',
    selectedMode: 0,
    caseDescription: '',
    defenseDescription: '',
    attachments: [],
    defenseAttachments: [],
    userSide: undefined,
    detectedArea: 'OTHER',
    caseSummary: null,
    specificJudge: null,
    simulation: null,
    report: null,
    isUnlocked: false,
  simulationId: null as string | null,
    simStep: 'IDLE',
    currentRound: 0,
  selectedProfile: 'leigo',
  activeAgents: [],
  showForgeMonitor: false,
  // ADR-006: vazio até getAreaStats() resolver — nunca um fallback com
  // números plausíveis (ver statsLoading para o estado visual).
  regionalStats: [],
  error: null
});

  // Handle Google redirect result (Safari mobile compatibility)
  useEffect(() => {
    getGoogleRedirectResult().then((result) => {
      if (result?.user) {
        setUser(result.user);
      }
    }).catch(() => {});
  }, []);

  // Auth & Stats listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await createOrUpdateUser(u.uid, u.email);
        const history = await getUserSimulations(u.uid);
        setUserHistory(history ?? []);
      } else {
        setUserHistory([]);
      }
    });
    
    const fetchInitialStats = async () => {
      try {
        const stats = await getStats();
        if (stats) {
          setGlobalStats({
            simulations: stats.totalSimulations,
            winRate: Number(stats.winRate.toFixed(1)),
            precision: Number(((stats.totalWins / Math.max(stats.totalSimulations, 1)) * 100).toFixed(1))
          });
        }

        const regional = await getAreaStats();
        if (regional && regional.length > 0) {
          setState(prev => ({ ...prev, regionalStats: regional }));
        }
      } finally {
        // ADR-006: sai do estado de carregamento mesmo se o fetch falhar —
        // regionalStats/globalStats então ficam vazios/zerados, nunca com
        // um fallback plausível.
        setStatsLoading(false);
      }
    };

    fetchInitialStats();
    return () => unsub();
  }, []);

const [loading, setLoading] = useState(false);
const [retryCount, setRetryCount] = useState(0);
const recoverySessionIdRef = useRef<string | null>(null);
const simAbortRef = useRef<AbortController | null>(null);
const recoveryUnsubRef = useRef<(() => void) | null>(null);
const isRecoveringRef = useRef(false);
const [isExpandingHypothesis, setIsExpandingHypothesis] = useState(false);
const [chatSheetState, setChatSheetState] = useState<SheetState>('closed');
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
const [chatQuestionsUsed, setChatQuestionsUsed] = useState(0);
const [chatQuestionsLimit, setChatQuestionsLimit] = useState(5);
const [chatIsSending, setChatIsSending] = useState(false);
const [chatError, setChatError] = useState<string | null>(null);
const [openChatAfterLoad, setOpenChatAfterLoad] = useState(false);
const [isEditingMode4, setIsEditingMode4] = useState(false);
const [promoCode, setPromoCode] = useState('');
const [promoStatus, setPromoStatus] = useState<{ valid: boolean; discountLabel?: string; finalAmountFormatted?: string; finalAmount?: number } | null>(null);
const [promoLoading, setPromoLoading] = useState(false);
const [showPromoInput, setShowPromoInput] = useState(false);
const fromPreviousSimulation = !!(state.caseDescription && state.defenseDescription && state.userSide);
const [attachmentError, setAttachmentError] = useState<string | null>(null);
const [defenseAttachmentError, setDefenseAttachmentError] = useState<string | null>(null);
const [mode5AttachmentError, setMode5AttachmentError] = useState<string | null>(null);
const scrollRef = useRef<HTMLDivElement>(null);
const fileInputRef = useRef<HTMLInputElement>(null);

const handleGeminiError = (err: any) => {
  console.error("Gemini Error Context:", err);
  let errorMessage = 'Ocorreu um erro ao processar sua causa. Por favor, tente novamente.';
  let isQuota = false;

  // Try to parse error if it's a string containing JSON (sometimes happens with SDK)
  let errorObj = err;
  if (typeof err === 'string') {
    try {
      errorObj = JSON.parse(err);
    } catch {}
  }

  const code = errorObj?.error?.code || errorObj?.code || errorObj?.status;
  const message = errorObj?.error?.message || errorObj?.message || (typeof err === 'string' ? err : '');

  if (code === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('spending cap')) {
    isQuota = true;
    errorMessage = 'O sistema está temporariamente indisponível. Tente novamente em alguns minutos.';
  } else if (message) {
    const cleanMessage = message.startsWith('<!DOCTYPE') || message.startsWith('<html') 
      ? 'Erro de Gateway/Conexão. O serviço de IA está temporariamente indisponível.' 
      : message;
    errorMessage = `Erro técnico: ${cleanMessage.slice(0, 150)}${cleanMessage.length > 150 ? '...' : ''}`;
  }

  if (err?.message === 'MAX_RETRIES_EXCEEDED') {
    if (recoverySessionIdRef.current) {
      startRecovery(recoverySessionIdRef.current);
    } else {
      setState(prev => ({
        ...prev,
        step: 'input',
        error: {
          code: 503,
          message: 'Sua conexão caiu durante a simulação. Tentamos reconectar 3 vezes sem sucesso. Seus dados estão preservados — clique em Tentar Novamente.',
          isQuota: false,
          isRetryable: true
        }
      }));
      setRetryCount(0);
    }
    return;
  }

  setState(prev => ({
    ...prev,
    error: {
      code: code || 500,
      message: errorMessage,
      isQuota
    }
  }));
};

const displayRecoveredResult = async (result: SimulationResult) => {
  // Guarda de concorrência: impede double-call via visibilitychange + onSnapshot simultâneos
  if (isRecoveringRef.current) return;
  if (!result?.rounds?.length) return;
  isRecoveringRef.current = true;

  simAbortRef.current?.abort();
  recoveryUnsubRef.current?.();
  recoveryUnsubRef.current = null;

  try {
    const isDefenseMode = state.selectedMode === 4 && (state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR')) === 'DEFENSE';
    let bestRound = result.rounds[0];
    for (const round of result.rounds) {
      if (isDefenseMode
        ? round.successProbability <= bestRound.successProbability
        : round.successProbability >= bestRound.successProbability) bestRound = round;
    }
    const finalData = { ...result, finalSuccessProbability: bestRound.successProbability };
    setState(prev => ({ ...prev, simulation: finalData }));

    let reportData = null;
    try {
      const _es = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
      reportData = await generateReport(bestRound.lawyerPetition, bestRound.judgeJudgment, _es);
    } catch {}

    setState(prev => ({ ...prev, step: 'result', report: reportData, error: null, simStep: 'IDLE' }));
    setLoading(false);
    setRetryCount(0);

    try {
      const simId = await saveSimulation(user?.uid || null, state.caseDescription, finalData, state.caseSummary, reportData, null, state.selectedMode, state.userSide, state.userPole);
      if (simId) setState(prev => ({ ...prev, simulationId: simId }));
    } catch {}
  } finally {
    isRecoveringRef.current = false;
  }
};

const startRecovery = (sessionId: string) => {
  setState(prev => ({ ...prev, simStep: 'RECOVERING' }));
  setRetryCount(0);

  const unsubscribe = subscribeSimRecovery(sessionId, (status, result) => {
    if (status === 'complete' && result) {
      displayRecoveredResult(result as SimulationResult);
    } else if (status === 'error') {
      recoveryUnsubRef.current?.();
      recoveryUnsubRef.current = null;
      handleGeminiError(new Error('Simulação encerrada com erro no servidor.'));
      setLoading(false);
    }
  });

  recoveryUnsubRef.current = unsubscribe;

  setTimeout(() => {
    if (recoveryUnsubRef.current) {
      recoveryUnsubRef.current();
      recoveryUnsubRef.current = null;
      setState(prev => {
        if (prev.step === 'simulating') {
          return {
            ...prev,
            step: 'input',
            error: {
              code: 503,
              message: 'Sua conexão caiu durante a simulação. Não foi possível recuperar o resultado. Seus dados estão preservados — tente novamente.',
              isQuota: false,
              isRetryable: true
            }
          };
        }
        return prev;
      });
      setLoading(false);
    }
  }, 5 * 60 * 1000);
};

  // Auto-scroll simulation rounds
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.simulation?.rounds]);

  // Safari recovery: when user returns to the app, check Firestore immediately
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      if (state.step !== 'simulating') return;
      const sessionId = recoverySessionIdRef.current;
      if (!sessionId) return;

      const recovery = await getSimRecovery(sessionId);
      if (recovery?.status === 'complete' && recovery.result) {
        displayRecoveredResult(recovery.result as SimulationResult);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [state.step]);

  // Wake Lock: impede a tela de apagar durante a simulação (Safari 16.4+)
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;

    const acquire = async () => {
      try { lock = await (navigator as any).wakeLock.request('screen'); } catch {}
    };
    const release = () => { lock?.release().catch(() => {}); lock = null; };

    if (state.step === 'simulating') {
      acquire();
      // Re-acquire após retorno de background (Wake Lock é liberado automaticamente)
      document.addEventListener('visibilitychange', acquire);
    } else {
      release();
      document.removeEventListener('visibilitychange', acquire);
    }

    return () => { release(); document.removeEventListener('visibilitychange', acquire); };
  }, [state.step]);

  // EDR-009: a cópia da UI promete "máx 10MB por arquivo · total 20MB" —
  // esses limites precisam ser aplicados aqui, não só anunciados.
  const MAX_ARQUIVOS = 5;
  const MAX_BYTES_TOTAL = 20 * 1024 * 1024;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setAttachmentError(null);

    const newAttachments: Attachment[] = [];
    const fileList: File[] = Array.from(files);
    let totalBytes = state.attachments.reduce((sum, a) => sum + a.size, 0);

    for (const file of fileList) {
      if (file.size > 10 * 1024 * 1024) {
        setAttachmentError(`${file.name} excede 10MB. Limite por arquivo: 10MB.`);
        continue;
      }
      if (state.attachments.length + newAttachments.length >= MAX_ARQUIVOS) {
        setAttachmentError(`Máximo de ${MAX_ARQUIVOS} arquivos permitidos.`);
        break;
      }
      if (totalBytes + file.size > MAX_BYTES_TOTAL) {
        setAttachmentError(`Limite total de 20MB excedido.`);
        break;
      }

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64
      });
      totalBytes += file.size;
    }

    setState(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (index: number) => {
    setState(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleValidate = async () => {
    const descToValidate = state.selectedMode === 5
      ? state.mode5Input?.caseDescription || ''
      : state.caseDescription;
    const attsToValidate = state.selectedMode === 5
      ? state.mode5Input?.attachments || []
      : state.attachments;
    if (!descToValidate.trim()) return;
    setLoading(true);
    try {
      const data = await validateCausa(descToValidate, attsToValidate);
      setState(prev => ({
        ...prev,
        step: 'confirm',
        detectedArea: data.area || 'OTHER',
        specificJudge: data.specificJudge,
        caseSummary: data.summary,
        selectedProfile: data.detectedProfile || prev.selectedProfile,
        userPole: data.userPole || 'AUTOR',
        attachmentsUnreadable: attsToValidate.length > 0 && data.documentsReadable === false,
        error: null
      }));
    } catch (err) {
      handleGeminiError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSimulation = (sim: any) => {
    setState(prev => ({
      ...prev,
      step: 'result',
      caseDescription: sim.caseDescription,
      detectedArea: sim.area || 'OTHER',
      caseSummary: sim.caseSummary,
      selectedMode: sim.mode5Result ? 5 : (sim.selectedMode ?? prev.selectedMode),
      userSide: sim.userSide ?? prev.userSide,
      userPole: sim.userPole ?? prev.userPole,
      simulation: {
        area: sim.area,
        rounds: sim.rounds || [],
        finalSuccessProbability: sim.finalSuccessProbability,
        lawyerAgentName: sim.lawyerAgentName,
        judgeAgentName: sim.judgeAgentName
      },
      report: sim.report,
      mode5Result: sim.mode5Result ?? prev.mode5Result,
      isUnlocked: true,
      simulationId: sim.id ?? null
    }));
    // O chat é por simulação — trocar de caso não pode herdar mensagens,
    // contador de perguntas ou erro da conversa do caso anterior.
    setChatSheetState('closed');
    setChatMessages([]);
    setChatQuestionsUsed(0);
    setChatQuestionsLimit(5);
    setChatError(null);
    setShowHistory(false);
  };

  const handleSimulate = async () => {
    if (state.selectedMode === 5) {
      if (!state.mode5Input) {
        console.error('[Mode5] state.mode5Input está undefined no handleSimulate');
        handleGeminiError(new Error('Dados do Modo 5 não encontrados. Tente novamente.'));
        return;
      }
      setLoading(true);
      setState(prev => ({ ...prev, step: 'simulating', simStep: 'JUDGING', isUnlocked: false, simulationId: null }));
      setState(prev => ({
        ...prev,
        activeAgents: [
          { name: 'Juiz Estrategista', type: 'Magistrado', id: `MODE5_JUDGE_${Date.now()}`, activatedAt: Date.now() }
        ]
      }));
      try {
        const result = await simulateMode5(
          state.mode5Input,
          state.detectedArea,
          state.mode5Input.attachments || [],
          state.specificJudge,
          (step: string) => {
            setState(prev => ({ ...prev, simStep: step as any }));
          }
        );
        setState(prev => ({ ...prev, step: 'result', mode5Result: result, simStep: 'IDLE' }));
        const mode5SimResult: SimulationResult = {
          area: state.detectedArea,
          rounds: [],
          finalSuccessProbability: result.successProbability,
          lawyerAgentName: undefined,
          judgeAgentName: result.judgeAgentName,
        };
        const simId = await saveSimulation(
          user?.uid || null,
          state.mode5Input?.caseDescription || '',
          mode5SimResult,
          null,
          null,
          {
            successProbability: result.successProbability,
            recommendation: result.recommendation,
            strategistAnalysis: result.strategistAnalysis,
            reasoning: result.reasoning,
            subCase: state.mode5Input?.subCase,
            judgeAgentName: result.judgeAgentName,
          }
        );
        if (simId) setState(prev => ({ ...prev, simulationId: simId }));
        if (user) {
          const history = await getUserSimulations(user.uid);
          setUserHistory(history ?? []);
        }
      } catch (err) {
        handleGeminiError(err);
        setState(prev => ({ ...prev, step: 'input', simStep: 'IDLE' }));
      } finally {
        setLoading(false);
      }
      return;
    }
    recoverySessionIdRef.current = null;
    recoveryUnsubRef.current?.();
    recoveryUnsubRef.current = null;
    isRecoveringRef.current = false;
    simAbortRef.current = new AbortController();
    setLoading(true);
    setState(prev => ({
      ...prev,
      step: 'simulating',
      isUnlocked: false,
      simulationId: null,
      expandedHypothesis: null,
      counterHypotheses: [],
      showHypotheses: false,
    }));
    try {
      const data = await simulateForum(
        state.caseDescription, 
        state.detectedArea, 
        state.attachments, 
        state.specificJudge,
        (step, progressData) => {
          setState(prev => {
            let newStats = [...prev.regionalStats];
            let newActiveAgents = [...prev.activeAgents];

            if (step === 'SEED_CREATED' && progressData?.regionIndex !== undefined) {
              const idx = progressData.regionIndex;
              if (newStats[idx]) {
                newStats[idx] = {
                  ...newStats[idx],
                  seeds: newStats[idx].seeds + 1,
                  active: newStats[idx].active + 1
                };
              }
            }

            // Só captura o sessionId da primeira tentativa — retries geram novas sessões no servidor
            if (step === 'SEED_CREATED' && progressData?.sessionId && !recoverySessionIdRef.current) {
              recoverySessionIdRef.current = progressData.sessionId;
            }

            // Update agents list when they transition to visible roles
            if (progressData?.lawyerName && !newActiveAgents.find(a => a.type === 'Advogado')) {
              newActiveAgents.push({ name: progressData.lawyerName, type: 'Advogado', id: `LAW_${Date.now()}`, activatedAt: Date.now() });
            } else if (progressData?.lawyerName) {
              newActiveAgents = newActiveAgents.map(a => a.type === 'Advogado' ? { ...a, name: progressData.lawyerName! } : a);
            }
            if (progressData?.judgeName && !newActiveAgents.find(a => a.type === 'Magistrado')) {
              newActiveAgents.push({ name: progressData.judgeName, type: 'Magistrado', id: `JUI_${Date.now()}`, activatedAt: Date.now() });
            } else if (progressData?.judgeName) {
              newActiveAgents = newActiveAgents.map(a => a.type === 'Magistrado' ? { ...a, name: progressData.judgeName! } : a);
            }

            const incomingRounds = progressData?.rounds || [];
            const existingRounds = prev.simulation?.rounds || [];
            const mergedRounds = incomingRounds.length === 1
              ? [...existingRounds.filter(r => r.round !== incomingRounds[0].round), ...incomingRounds]
              : incomingRounds.length > 1
                ? incomingRounds
                : existingRounds;

            return {
              ...prev,
              simStep: step,
              currentRound: progressData?.round || prev.currentRound,
              regionalStats: newStats,
              activeAgents: newActiveAgents,
              error: null,
              simulation: progressData
                ? {
                    ...(prev.simulation || { area: state.detectedArea, rounds: [], finalSuccessProbability: 0 }),
                    lawyerAgentName: progressData.lawyerName || prev.simulation?.lawyerAgentName,
                    judgeAgentName: progressData.judgeName || prev.simulation?.judgeAgentName,
                    rounds: mergedRounds
                  } as SimulationResult
                : prev.simulation
            };
          });
        },
        state.selectedMode,
        state.defenseDescription,
        state.defenseAttachments,
        state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR'),
        (attempt) => { setRetryCount(attempt); },
        simAbortRef.current?.signal
      );
      if (!data.rounds || data.rounds.length === 0) {
        throw new Error('Simulação retornou sem rodadas. Tente novamente.');
      }

      // Select the best round: DEFENSE mode4 wants lowest author probability (= best for defense)
      const isDefenseMode = state.selectedMode === 4 && (state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR')) === 'DEFENSE';
      let bestRound = data.rounds[0];
      for (const round of data.rounds) {
        if (isDefenseMode
          ? round.successProbability <= bestRound.successProbability
          : round.successProbability >= bestRound.successProbability) {
          bestRound = round;
        }
      }

      // Update data to reflect the best round's probability as the final one
      const finalData = {
        ...data,
        finalSuccessProbability: bestRound.successProbability
      };
      
      setState(prev => ({ ...prev, simulation: finalData }));
      
      // After simulation, get report based on BEST round
      // generateReport failure must NOT block result display — show result with null report
      let reportData = null;
      try {
        const _clientSide = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
        reportData = await generateReport(
          bestRound.lawyerPetition,
          bestRound.judgeJudgment,
          _clientSide
        );
      } catch (reportErr) {
        console.error('[handleSimulate] generateReport falhou — exibindo resultado sem laudo:', reportErr);
      }
      setState(prev => ({ ...prev, step: 'result', report: reportData, error: null }));

      // Secondary ops are isolated — any Firebase failure must NOT revert result screen
      try {
        const simId = await saveSimulation(user?.uid || null, state.caseDescription, finalData, state.caseSummary, reportData, null, state.selectedMode, state.userSide, state.userPole);
        if (simId) {
          setState(prev => ({ ...prev, simulationId: simId }));
        }
      } catch (e) {
        console.error('[handleSimulate] saveSimulation falhou:', e);
      }

      if (user) {
        try {
          const history = await getUserSimulations(user.uid);
          setUserHistory(history ?? []);
        } catch (e) {
          console.error('[handleSimulate] getUserSimulations falhou:', e);
        }
      }

      try {
        const newStatsResult = await getStats();
        if (newStatsResult) {
          setGlobalStats({
            simulations: newStatsResult.totalSimulations,
            winRate: Number(newStatsResult.winRate.toFixed(1)),
            precision: Number(((newStatsResult.totalWins / Math.max(newStatsResult.totalSimulations, 1)) * 100).toFixed(1))
          });
        }
      } catch (e) {
        console.error('[handleSimulate] getStats falhou:', e);
      }
    } catch (err: any) {
      if (err?.message === 'SIMULATION_ABORTED') return;
      handleGeminiError(err);
      if (err?.message !== 'MAX_RETRIES_EXCEEDED') {
        setState(prev => ({ ...prev, step: 'input' }));
      }
    } finally {
      if (!recoveryUnsubRef.current) setLoading(false);
    }
  };

  const formatAreaLabel = (area: string): string =>
    areaLabels[area] ?? area.charAt(0).toUpperCase() + area.slice(1).toLowerCase().replace(/_/g, " ");

  const areaLabels: Record<string, string> = {
    CONSUMER: "Direito do Consumidor",
    LABOR: "Direito do Trabalho",
    CIVIL: "Direito Cível",
    SOCIAL_SECURITY: "Direito Previdenciário",
    FAMILY: "Direito de Família",
    MARITIME: "Direito Marítimo",
    CRIMINAL: "Direito Penal",
    TAX: "Direito Tributário",
    ENVIRONMENTAL: "Direito Ambiental",
    ADMINISTRATIVE: "Direito Administrativo",
    CORPORATE: "Direito Empresarial",
    CHILDREN_AND_ADOLESCENT: "Direito da Criança e do Adolescente",
    DISABILITY_RIGHTS: "Direito das Pessoas com Deficiência",
    EDUCATIONAL: "Direito Educacional",
    INTERNATIONAL: "Direito Internacional",
    INTERNATIONAL_LAW: "Direito Internacional",
    FINANCIAL: "Direito Financeiro",
    FINANCIAL_CRIMES: "Crimes Financeiros",
    CRIMINAL_FINANCIAL: "Direito Penal Econômico",
    HUMAN_RIGHTS: "Direitos Humanos",
    INTELLECTUAL_PROPERTY: "Propriedade Intelectual",
    REAL_ESTATE: "Direito Imobiliário",
    OTHER: "Geral / Outros"
  };

  const handleShowHistory = async () => {
    if (user) {
      const history = await getUserSimulations(user.uid);
      setUserHistory(history ?? []);
    }
    setShowHistory(true);
  };

  const MODE_NAMES: Record<number, string> = {
    0: 'Modo Livre',
    1: 'Tese Estratégica',
    2: 'Defesa sob Ataque',
    3: 'Mesa Dupla: Juiz',
    4: 'Mesa Dupla: Assistida',
    5: 'Revisão Pós-Conflito',
  };

  // Redireciona para o Stripe Checkout
  const handleCheckout = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!state.simulationId) {
      console.error('[Checkout] simulationId não encontrado');
      return;
    }
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          simulationId: state.simulationId,
          mode: state.selectedMode,
          ...(promoCode.trim() ? { promoCode: promoCode.trim().toUpperCase() } : {}),
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('[Checkout] URL não retornada');
      }
    } catch (err) {
      console.error('[Checkout] Erro:', err);
    }
  };

  const validatePromoCode = async (code: string) => {
    if (!code.trim()) { setPromoStatus(null); return; }
    setPromoLoading(true);
    try {
      const token = user ? await user.getIdToken() : null;
      const res = await fetch('/api/stripe/validate-promo-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: code.trim().toUpperCase(), mode: state.selectedMode }),
      });
      const data = await res.json();
      setPromoStatus(data);
    } catch {
      setPromoStatus({ valid: false });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleOpenChat = async () => {
    if (!state.simulationId) return;
    setChatError(null);
    try {
      const status = await getChatStatus(state.simulationId);
      if (!status.isPaid) {
        const url = await createChatCheckoutSession(state.simulationId);
        window.location.href = url;
        return;
      }
      // Recarrega o histórico real a cada abertura — se o usuário já
      // conversou antes (nesta sessão ou em outra), as perguntas e
      // respostas anteriores aparecem; se não, o painel abre vazio com
      // as perguntas restantes.
      const history = await getChatHistory(state.simulationId);
      setChatMessages(history);
      setChatQuestionsUsed(status.questionsUsed);
      setChatQuestionsLimit(status.questionsLimit);
      setChatSheetState('half');
    } catch (err) {
      console.error('[Chat] Erro ao abrir chat:', err);
      setChatError('Não foi possível abrir o chat. Tente novamente.');
    }
  };

  const handleSendChatMessage = async (agentType: 'lawyer' | 'judge', message: string) => {
    if (!state.simulationId || chatIsSending) return;
    setChatError(null);
    const userMsg: ChatMessage = { role: 'user', content: message, agentType, agentName: 'Você', timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatIsSending(true);
    try {
      await sendChatMessage(state.simulationId, agentType, message, (event) => {
        if (event.type === 'message' && event.content) {
          const agentMsg: ChatMessage = {
            role: 'agent', content: event.content,
            agentType: event.agentType ?? agentType,
            agentName: event.agentName ?? agentType,
            timestamp: Date.now(),
          };
          setChatMessages(prev => [...prev, agentMsg]);
          if (event.questionsRemaining !== undefined) {
            setChatQuestionsUsed(u => u + 1);
          }
        } else if (event.type === 'error') {
          setChatError(event.message ?? 'Erro ao enviar mensagem. Tente novamente.');
          setChatMessages(prev => prev.slice(0, -1));
        }
      });
    } catch (err) {
      console.error('[Chat] Erro ao enviar mensagem:', err);
      setChatError('Erro ao enviar mensagem. Tente novamente.');
      setChatMessages(prev => prev.slice(0, -1));
    } finally {
      setChatIsSending(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    getUserAccessLevel(user.uid).then(level => {
      if (level === 'beta') {
        setState(prev => ({ ...prev, isUnlocked: true }));
      }
    });
    const params = new URLSearchParams(window.location.search);
    const simId = params.get('sim');
    const chatParam = params.get('chat');
    if (chatParam === '1') setOpenChatAfterLoad(true);
    if (!simId) return;
    hasUserPaidForSession(user.uid, simId).then(async paid => {
      if (paid) {
        await registrarAcessoLaudo(user.uid, simId);
        getSimulationById(simId).then(sim => {
          if (sim) loadSimulation(sim);
          else setState(prev => ({ ...prev, isUnlocked: true, simulationId: simId }));
        });
        window.history.replaceState({}, '', '/');
      }
    });
  }, [user, state.step]);

  useEffect(() => {
    if (openChatAfterLoad && state.step === 'result' && state.isUnlocked && state.simulationId) {
      setOpenChatAfterLoad(false);
      handleOpenChat();
    }
  }, [openChatAfterLoad, state.step, state.isUnlocked, state.simulationId]);

  if (window.location.pathname === '/termos') return <TermosPage />;

  return (
    <>
      {/* ── MODO 5 — Revisão Pós-Conflito ───────────────────────── */}
      {state.step === 'input' && state.selectedMode === 5 && (
        <div className="flex flex-col md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-primary)' }}>
          <ModeNavbar
            onBack={() => setState(prev => ({ ...prev, step: 'boardroom' }))}
            modeName={MODE_CONFIG[5].headline}
            color={themeColor(MODE_CONFIG[5])}
          />
          <FlowStepper currentStep="input" modeColor={themeColor(MODE_CONFIG[5])} />
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 100px' }}>
            {state.error && (
              <div style={{ marginBottom: '16px', padding: '16px', background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{state.error.message}</p>
                <button onClick={() => setState(prev => ({ ...prev, error: null }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: themeColor(MODE_CONFIG[5]), marginBottom: '12px' }}>
              {MODE_CONFIG[5].tagline}
            </p>
            <ContextZone
              color={themeColor(MODE_CONFIG[5])}
              colorRgb={themeColorRgb(MODE_CONFIG[5])}
              description={MODE_CONFIG[5].description}
              bring={MODE_CONFIG[5].bring}
              receive={MODE_CONFIG[5].receive}
            />
            {/* Seletor de subcaso */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setState(prev => ({ ...prev, mode5Input: { subCase: 'RECURSO', caseDescription: prev.mode5Input?.caseDescription || '', sentencaOuProposta: prev.mode5Input?.sentencaOuProposta || '', attachments: prev.mode5Input?.attachments || [] } }))}
                style={{ flex: 1, padding: '14px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '12px', border: state.mode5Input?.subCase === 'RECURSO' ? `2px solid ${themeColor(MODE_CONFIG[5])}` : '2px solid var(--border)', background: state.mode5Input?.subCase === 'RECURSO' ? 'color-mix(in srgb, var(--success) 10%, transparent)' : 'var(--bg-card)', color: state.mode5Input?.subCase === 'RECURSO' ? themeColor(MODE_CONFIG[5]) : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Scale style={{ width: '14px', height: '14px' }} /> Recorrer
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, mode5Input: { subCase: 'ACORDO', caseDescription: prev.mode5Input?.caseDescription || '', sentencaOuProposta: prev.mode5Input?.sentencaOuProposta || '', attachments: prev.mode5Input?.attachments || [] } }))}
                style={{ flex: 1, padding: '14px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '12px', border: state.mode5Input?.subCase === 'ACORDO' ? `2px solid ${themeColor(MODE_CONFIG[5])}` : '2px solid var(--border)', background: state.mode5Input?.subCase === 'ACORDO' ? 'color-mix(in srgb, var(--success) 10%, transparent)' : 'var(--bg-card)', color: state.mode5Input?.subCase === 'ACORDO' ? themeColor(MODE_CONFIG[5]) : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <HeartHandshake style={{ width: '14px', height: '14px' }} /> Acordo
              </button>
            </div>
            {state.mode5Input?.subCase && (
              <>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${themeColor(MODE_CONFIG[5])}`, marginBottom: '12px' }}>
                  <div style={{ padding: '16px 20px 4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Relato do Caso</span>
                  </div>
                  <textarea
                    value={state.mode5Input?.caseDescription || ''}
                    onChange={(e) => setState(prev => ({ ...prev, mode5Input: { ...prev.mode5Input!, caseDescription: e.target.value } }))}
                    placeholder="Descreva o contexto do conflito, o que aconteceu e qual é sua posição..."
                    style={{ width: '100%', minHeight: '130px', background: 'transparent', padding: '8px 20px 16px', outline: 'none', fontSize: '15px', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: 'var(--text-primary)', resize: 'vertical', border: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${themeColor(MODE_CONFIG[5])}`, marginBottom: '12px' }}>
                  <div style={{ padding: '16px 20px 4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      {state.mode5Input.subCase === 'RECURSO' ? 'Sentença Recebida' : 'Proposta de Acordo'}
                    </span>
                  </div>
                  <textarea
                    value={state.mode5Input?.sentencaOuProposta || ''}
                    onChange={(e) => setState(prev => ({ ...prev, mode5Input: { ...prev.mode5Input!, sentencaOuProposta: e.target.value } }))}
                    placeholder={state.mode5Input.subCase === 'RECURSO' ? 'Cole aqui o texto da sentença ou decisão recebida...' : 'Descreva os termos da proposta de acordo recebida...'}
                    style={{ width: '100%', minHeight: '130px', background: 'transparent', padding: '8px 20px 16px', outline: 'none', fontSize: '15px', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: 'var(--text-primary)', resize: 'vertical', border: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${themeColor(MODE_CONFIG[5])}`, marginBottom: '12px' }}>
                  <div style={{ padding: '12px 20px 12px' }}>
                    <input type="file" id="m5-file-new" className="hidden" multiple accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        setMode5AttachmentError(null);
                        const newAtts: import('./types').Attachment[] = [];
                        for (const file of files) {
                          if (file.size > 10 * 1024 * 1024) { setMode5AttachmentError(`${file.name} excede 10MB. Limite por arquivo: 10MB.`); continue; }
                          const data = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
                          newAtts.push({ name: file.name, type: file.type, size: file.size, data });
                        }
                        setState(prev => ({ ...prev, mode5Input: { ...prev.mode5Input!, attachments: [...(prev.mode5Input?.attachments || []), ...newAtts] } }));
                      }}
                    />
                    {(state.mode5Input?.attachments || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        {(state.mode5Input?.attachments || []).map((file, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px 10px', border: '1px solid var(--border)' }}>
                            <FileIcon style={{ width: '12px', height: '12px', color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                            <button onClick={() => setState(prev => ({ ...prev, mode5Input: { ...prev.mode5Input!, attachments: (prev.mode5Input?.attachments || []).filter((_, j) => j !== i) } }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}><X style={{ width: '12px', height: '12px' }} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label htmlFor="m5-file-new" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Plus style={{ width: '14px', height: '14px' }} />
                        {state.mode5Input.subCase === 'RECURSO' ? 'Anexar sentença ou documentos' : 'Anexar proposta ou documentos'}
                      </label>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px' }}>máx 10MB por arquivo · PDF, JPEG ou PNG</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock style={{ width: '9px', height: '9px' }} /> Texto anonimizado antes do processamento</span>
                      {mode5AttachmentError && <span style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '4px', display: 'block', paddingLeft: '4px' }}>{mode5AttachmentError}</span>}
                    </div>
                  </div>
                </div>
              </>
            )}
            <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', lineHeight: '1.6' }}>
              O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado.
            </p>
          </div>
          <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)', flexShrink: 0 }}>
            <button
              disabled={!state.mode5Input?.subCase || !state.mode5Input?.caseDescription?.trim() || !state.mode5Input?.sentencaOuProposta?.trim() || loading}
              onClick={handleValidate}
              style={{ width: '100%', padding: '16px', background: themeColor(MODE_CONFIG[5]), color: ctaTextColor, border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '14px', cursor: !state.mode5Input?.subCase || !state.mode5Input?.caseDescription?.trim() || !state.mode5Input?.sentencaOuProposta?.trim() || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: !state.mode5Input?.subCase || !state.mode5Input?.caseDescription?.trim() || !state.mode5Input?.sentencaOuProposta?.trim() || loading ? 0.5 : 1 }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : MODE_CONFIG[5].cta}
            </button>
          </div>
        </div>
      )}

      {/* ── MODO 4 — Mesa Dupla: Assistida ──────────────────────── */}
      {state.step === 'input' && state.selectedMode === 4 && (
        <div className="flex flex-col md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-primary)' }}>
          <ModeNavbar
            onBack={() => setState(prev => ({ ...prev, step: 'boardroom' }))}
            modeName={MODE_CONFIG[4].headline}
            color={themeColor(MODE_CONFIG[4])}
          />
          <FlowStepper currentStep="input" modeColor={themeColor(MODE_CONFIG[4])} />
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 100px' }}>
            {state.error && (
              <div style={{ marginBottom: '16px', padding: '16px', background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{state.error.message}</p>
                <button onClick={() => setState(prev => ({ ...prev, error: null }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: themeColor(MODE_CONFIG[4]), marginBottom: '12px' }}>
              {MODE_CONFIG[4].tagline}
            </p>
            <ContextZone
              color={themeColor(MODE_CONFIG[4])}
              colorRgb={themeColorRgb(MODE_CONFIG[4])}
              description={MODE_CONFIG[4].description}
              bring={MODE_CONFIG[4].bring}
              receive={MODE_CONFIG[4].receive}
            />
            {fromPreviousSimulation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(var(--warning-rgb),0.05)', border: '1px solid rgba(var(--warning-rgb),0.2)', marginBottom: '16px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--warning-rgb),0.7)' }}>
                <span style={{ flex: 1 }}>Continuando a partir da sua simulação anterior.</span>
                {!isEditingMode4 && (
                  <button onClick={() => setIsEditingMode4(true)} style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', border: '1px solid rgba(var(--warning-rgb),0.3)', padding: '6px 12px', color: 'rgba(var(--warning-rgb),0.7)', background: 'none', cursor: 'pointer', borderRadius: '10px' }}>
                    Editar campos
                  </button>
                )}
              </div>
            )}
            {/* Seletor de lado */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setState(prev => ({ ...prev, userSide: 'AUTHOR' }))}
                style={{ flex: 1, padding: '14px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '12px', border: state.userSide === 'AUTHOR' ? `2px solid ${themeColor(MODE_CONFIG[4])}` : '2px solid var(--border)', background: state.userSide === 'AUTHOR' ? `rgba(var(--warning-rgb),0.1)` : 'var(--bg-card)', color: state.userSide === 'AUTHOR' ? themeColor(MODE_CONFIG[4]) : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Swords style={{ width: '14px', height: '14px' }} /> Acusação
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, userSide: 'DEFENSE' }))}
                style={{ flex: 1, padding: '14px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '12px', border: state.userSide === 'DEFENSE' ? `2px solid ${themeColor(MODE_CONFIG[4])}` : '2px solid var(--border)', background: state.userSide === 'DEFENSE' ? `rgba(var(--warning-rgb),0.1)` : 'var(--bg-card)', color: state.userSide === 'DEFENSE' ? themeColor(MODE_CONFIG[4]) : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Shield style={{ width: '14px', height: '14px' }} /> Defesa
              </button>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${themeColor(MODE_CONFIG[4])}`, marginBottom: '12px' }}>
              <div style={{ padding: '16px 20px 4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Petição do Autor</span>
              </div>
              <textarea
                value={state.caseDescription}
                onChange={(e) => setState(prev => ({ ...prev, caseDescription: e.target.value }))}
                readOnly={fromPreviousSimulation && !isEditingMode4}
                placeholder="Cole ou descreva a petição inicial do autor..."
                style={{ width: '100%', minHeight: '140px', background: 'transparent', padding: '8px 20px 16px', outline: 'none', fontSize: '15px', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: 'var(--text-primary)', resize: 'vertical', border: 'none', boxSizing: 'border-box', opacity: fromPreviousSimulation && !isEditingMode4 ? 0.6 : 1, cursor: fromPreviousSimulation && !isEditingMode4 ? 'not-allowed' : 'auto' }}
              />
              <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)' }}>
                <input type="file" id="author-file-m4-mobile" className="hidden" multiple accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    setAttachmentError(null);
                    const newAtts: import('./types').Attachment[] = [];
                    for (const file of files) {
                      if (file.size > 10 * 1024 * 1024) { setAttachmentError(`${file.name} excede 10MB. Limite por arquivo: 10MB.`); continue; }
                      const data = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
                      newAtts.push({ name: file.name, type: file.type, size: file.size, data });
                    }
                    setState(prev => ({ ...prev, attachments: [...prev.attachments, ...newAtts] }));
                  }}
                />
                {state.attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {state.attachments.map((file, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px 10px', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <button onClick={() => setState(prev => ({ ...prev, attachments: prev.attachments.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}><X style={{ width: '12px', height: '12px' }} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="author-file-m4-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Plus style={{ width: '14px', height: '14px' }} />
                    Anexar provas do autor
                  </label>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px' }}>máx 10MB por arquivo · PDF, JPEG ou PNG</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock style={{ width: '9px', height: '9px' }} /> Texto anonimizado antes do processamento</span>
                  {attachmentError && <span style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '4px', display: 'block', paddingLeft: '4px' }}>{attachmentError}</span>}
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${themeColor(MODE_CONFIG[4])}`, marginBottom: '12px' }}>
              <div style={{ padding: '16px 20px 4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Contestação do Réu</span>
              </div>
              <textarea
                value={state.defenseDescription}
                onChange={(e) => setState(prev => ({ ...prev, defenseDescription: e.target.value }))}
                readOnly={fromPreviousSimulation && !isEditingMode4}
                placeholder="Cole ou descreva a contestação do réu..."
                style={{ width: '100%', minHeight: '140px', background: 'transparent', padding: '8px 20px 16px', outline: 'none', fontSize: '15px', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: 'var(--text-primary)', resize: 'vertical', border: 'none', boxSizing: 'border-box', opacity: fromPreviousSimulation && !isEditingMode4 ? 0.6 : 1, cursor: fromPreviousSimulation && !isEditingMode4 ? 'not-allowed' : 'auto' }}
              />
              <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)' }}>
                <input type="file" id="defense-file-m4-mobile" className="hidden" multiple accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    setDefenseAttachmentError(null);
                    const newAtts: import('./types').Attachment[] = [];
                    for (const file of files) {
                      if (file.size > 10 * 1024 * 1024) { setDefenseAttachmentError(`${file.name} excede 10MB. Limite por arquivo: 10MB.`); continue; }
                      const data = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
                      newAtts.push({ name: file.name, type: file.type, size: file.size, data });
                    }
                    setState(prev => ({ ...prev, defenseAttachments: [...prev.defenseAttachments, ...newAtts] }));
                  }}
                />
                {state.defenseAttachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {state.defenseAttachments.map((file, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px 10px', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <button onClick={() => setState(prev => ({ ...prev, defenseAttachments: prev.defenseAttachments.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}><X style={{ width: '12px', height: '12px' }} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="defense-file-m4-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Plus style={{ width: '14px', height: '14px' }} />
                    Anexar provas do réu
                  </label>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px' }}>máx 10MB por arquivo · PDF, JPEG ou PNG</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock style={{ width: '9px', height: '9px' }} /> Texto anonimizado antes do processamento</span>
                  {defenseAttachmentError && <span style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '4px', display: 'block', paddingLeft: '4px' }}>{defenseAttachmentError}</span>}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', lineHeight: '1.6' }}>
              O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado.
            </p>
          </div>
          <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)', flexShrink: 0 }}>
            <button
              disabled={!state.caseDescription.trim() || !state.defenseDescription.trim() || !state.userSide || loading}
              onClick={handleValidate}
              style={{ width: '100%', padding: '16px', background: themeColor(MODE_CONFIG[4]), color: ctaTextColor, border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '14px', cursor: !state.caseDescription.trim() || !state.defenseDescription.trim() || !state.userSide || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: !state.caseDescription.trim() || !state.defenseDescription.trim() || !state.userSide || loading ? 0.5 : 1 }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : MODE_CONFIG[4].cta}
            </button>
          </div>
        </div>
      )}

      {/* ── MODO 3 — Mesa Dupla: Juiz ────────────────────────────── */}
      {state.step === 'input' && state.selectedMode === 3 && (
        <div className="flex flex-col md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-primary)' }}>
          <ModeNavbar
            onBack={() => setState(prev => ({ ...prev, step: 'boardroom' }))}
            modeName={MODE_CONFIG[3].headline}
            color={themeColor(MODE_CONFIG[3])}
          />
          <FlowStepper currentStep="input" modeColor={themeColor(MODE_CONFIG[3])} />
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 100px' }}>
            {state.error && (
              <div style={{ marginBottom: '16px', padding: '16px', background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{state.error.message}</p>
                <button onClick={() => setState(prev => ({ ...prev, error: null }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: themeColor(MODE_CONFIG[3]), marginBottom: '12px' }}>
              {MODE_CONFIG[3].tagline}
            </p>
            <ContextZone
              color={themeColor(MODE_CONFIG[3])}
              colorRgb={themeColorRgb(MODE_CONFIG[3])}
              description={MODE_CONFIG[3].description}
              bring={MODE_CONFIG[3].bring}
              receive={MODE_CONFIG[3].receive}
            />
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${themeColor(MODE_CONFIG[3])}`, marginBottom: '12px' }}>
              <div style={{ padding: '16px 20px 4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Argumento da Acusação</span>
              </div>
              <textarea
                value={state.caseDescription}
                onChange={(e) => setState(prev => ({ ...prev, caseDescription: e.target.value }))}
                placeholder="Descreva a posição e os argumentos do autor..."
                style={{ width: '100%', minHeight: '140px', background: 'transparent', padding: '8px 20px 16px', outline: 'none', fontSize: '15px', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: 'var(--text-primary)', resize: 'vertical', border: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)' }}>
                <input type="file" id="author-file-m3" className="hidden" multiple accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    setAttachmentError(null);
                    const newAtts: import('./types').Attachment[] = [];
                    for (const file of files) {
                      if (file.size > 10 * 1024 * 1024) { setAttachmentError(`${file.name} excede 10MB. Limite por arquivo: 10MB.`); continue; }
                      const data = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
                      newAtts.push({ name: file.name, type: file.type, size: file.size, data });
                    }
                    setState(prev => ({ ...prev, attachments: [...prev.attachments, ...newAtts] }));
                  }}
                />
                {state.attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {state.attachments.map((file, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px 10px', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <button onClick={() => setState(prev => ({ ...prev, attachments: prev.attachments.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}><X style={{ width: '12px', height: '12px' }} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="author-file-m3" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Plus style={{ width: '14px', height: '14px' }} />
                    Anexar provas do autor
                  </label>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px' }}>máx 10MB por arquivo · PDF, JPEG ou PNG</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock style={{ width: '9px', height: '9px' }} /> Texto anonimizado antes do processamento</span>
                  {attachmentError && <span style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '4px', display: 'block', paddingLeft: '4px' }}>{attachmentError}</span>}
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${themeColor(MODE_CONFIG[3])}`, marginBottom: '12px' }}>
              <div style={{ padding: '16px 20px 4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Argumento da Defesa</span>
              </div>
              <textarea
                value={state.defenseDescription}
                onChange={(e) => setState(prev => ({ ...prev, defenseDescription: e.target.value }))}
                placeholder="Descreva a posição e os argumentos do réu..."
                style={{ width: '100%', minHeight: '140px', background: 'transparent', padding: '8px 20px 16px', outline: 'none', fontSize: '15px', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: 'var(--text-primary)', resize: 'vertical', border: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)' }}>
                <input type="file" id="defense-file-m3" className="hidden" multiple accept="image/*,application/pdf"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    setDefenseAttachmentError(null);
                    const newAtts: import('./types').Attachment[] = [];
                    for (const file of files) {
                      if (file.size > 10 * 1024 * 1024) { setDefenseAttachmentError(`${file.name} excede 10MB. Limite por arquivo: 10MB.`); continue; }
                      const data = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
                      newAtts.push({ name: file.name, type: file.type, size: file.size, data });
                    }
                    setState(prev => ({ ...prev, defenseAttachments: [...prev.defenseAttachments, ...newAtts] }));
                  }}
                />
                {state.defenseAttachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {state.defenseAttachments.map((file, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px 10px', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <button onClick={() => setState(prev => ({ ...prev, defenseAttachments: prev.defenseAttachments.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}><X style={{ width: '12px', height: '12px' }} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="defense-file-m3" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Plus style={{ width: '14px', height: '14px' }} />
                    Anexar provas do réu
                  </label>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px' }}>máx 10MB por arquivo · PDF, JPEG ou PNG</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock style={{ width: '9px', height: '9px' }} /> Texto anonimizado antes do processamento</span>
                  {defenseAttachmentError && <span style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '4px', display: 'block', paddingLeft: '4px' }}>{defenseAttachmentError}</span>}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', lineHeight: '1.6' }}>
              O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado.
            </p>
          </div>
          <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)', flexShrink: 0 }}>
            <button
              disabled={!state.caseDescription.trim() || !state.defenseDescription.trim() || loading}
              onClick={handleValidate}
              style={{ width: '100%', padding: '16px', background: themeColor(MODE_CONFIG[3]), color: ctaTextColor, border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '14px', cursor: !state.caseDescription.trim() || !state.defenseDescription.trim() || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: !state.caseDescription.trim() || !state.defenseDescription.trim() || loading ? 0.5 : 1 }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : MODE_CONFIG[3].cta}
            </button>
          </div>
        </div>
      )}

      {/* ── MODO 2 — Defesa sob Ataque ───────────────────────────── */}
      {state.step === 'input' && state.selectedMode === 2 && (
        <div className="flex flex-col md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-primary)' }}>
          <ModeNavbar
            onBack={() => setState(prev => ({ ...prev, step: 'boardroom' }))}
            modeName={MODE_CONFIG[2].headline}
            color={themeColor(MODE_CONFIG[2])}
          />
          <FlowStepper currentStep="input" modeColor={themeColor(MODE_CONFIG[2])} />
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 0' }}>
            {state.error && (
              <div style={{ marginBottom: '16px', padding: '16px', background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{state.error.message}</p>
                <button onClick={() => setState(prev => ({ ...prev, error: null }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: themeColor(MODE_CONFIG[2]), marginBottom: '12px' }}>
              {MODE_CONFIG[2].tagline}
            </p>
            <ContextZone
              color={themeColor(MODE_CONFIG[2])}
              colorRgb={themeColorRgb(MODE_CONFIG[2])}
              description={MODE_CONFIG[2].description}
              bring={MODE_CONFIG[2].bring}
              receive={MODE_CONFIG[2].receive}
            />
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${themeColor(MODE_CONFIG[2])}`, marginBottom: '12px' }}>
              <textarea
                value={state.caseDescription}
                onChange={(e) => setState(prev => ({ ...prev, caseDescription: e.target.value }))}
                placeholder="Descreva a acusação recebida e sua versão dos fatos..."
                style={{ width: '100%', minHeight: '180px', background: 'transparent', padding: '20px', outline: 'none', fontSize: '16px', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: 'var(--text-primary)', resize: 'vertical', border: 'none', boxSizing: 'border-box' }}
              />
              {state.attachments.length > 0 && (
                <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {state.attachments.map((file, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px 10px', border: '1px solid var(--border)' }}>
                      <FileIcon style={{ width: '12px', height: '12px', color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <button onClick={() => removeAttachment(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}><X style={{ width: '12px', height: '12px' }} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)' }}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,application/pdf" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Plus style={{ width: '14px', height: '14px' }} />
                    Anexar provas de defesa
                  </button>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px' }}>máx 10MB por arquivo · PDF, JPEG ou PNG</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock style={{ width: '9px', height: '9px' }} /> Texto anonimizado antes do processamento</span>
                  {attachmentError && <span style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '4px', display: 'block', paddingLeft: '4px' }}>{attachmentError}</span>}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', lineHeight: '1.6' }}>
              O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado.
            </p>
          </div>
          <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)', flexShrink: 0 }}>
            <button
              disabled={state.caseDescription.trim().length <= 10 || loading}
              onClick={handleValidate}
              style={{ width: '100%', padding: '16px', background: themeColor(MODE_CONFIG[2]), color: ctaTextColor, border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '14px', cursor: state.caseDescription.trim().length <= 10 || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: state.caseDescription.trim().length <= 10 || loading ? 0.5 : 1 }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : MODE_CONFIG[2].cta}
            </button>
          </div>
        </div>
      )}

      {/* ── MODO 1 — Tese Estratégica ────────────────────────────── */}
      {state.step === 'input' && state.selectedMode === 1 && (
        <div className="flex flex-col md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-primary)' }}>
          <ModeNavbar
            onBack={() => setState(prev => ({ ...prev, step: 'boardroom' }))}
            modeName={MODE_CONFIG[1].headline}
            color={themeColor(MODE_CONFIG[1])}
          />
          <FlowStepper currentStep="input" modeColor={themeColor(MODE_CONFIG[1])} />
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 0' }}>
            {state.error && (
              <div style={{ marginBottom: '16px', padding: '16px', background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{state.error.message}</p>
                <button onClick={() => setState(prev => ({ ...prev, error: null }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: themeColor(MODE_CONFIG[1]), marginBottom: '12px' }}>
              {MODE_CONFIG[1].tagline}
            </p>
            <ContextZone
              color={themeColor(MODE_CONFIG[1])}
              colorRgb={themeColorRgb(MODE_CONFIG[1])}
              description={MODE_CONFIG[1].description}
              bring={MODE_CONFIG[1].bring}
              receive={MODE_CONFIG[1].receive}
            />
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${themeColor(MODE_CONFIG[1])}`, marginBottom: '12px' }}>
              <textarea
                value={state.caseDescription}
                onChange={(e) => setState(prev => ({ ...prev, caseDescription: e.target.value }))}
                placeholder="Descreva os fatos com suas próprias palavras..."
                style={{ width: '100%', minHeight: '180px', background: 'transparent', padding: '20px', outline: 'none', fontSize: '16px', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic', color: 'var(--text-primary)', resize: 'vertical', border: 'none', boxSizing: 'border-box' }}
              />
              {state.attachments.length > 0 && (
                <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {state.attachments.map((file, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px 10px', border: '1px solid var(--border)' }}>
                      <FileIcon style={{ width: '12px', height: '12px', color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <button onClick={() => removeAttachment(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}><X style={{ width: '12px', height: '12px' }} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)' }}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,application/pdf" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Plus style={{ width: '14px', height: '14px' }} />
                    Anexar documentos
                  </button>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px' }}>máx 10MB por arquivo · PDF, JPEG ou PNG</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', paddingLeft: '4px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><Lock style={{ width: '9px', height: '9px' }} /> Texto anonimizado antes do processamento</span>
                  {attachmentError && <span style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '4px', display: 'block', paddingLeft: '4px' }}>{attachmentError}</span>}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', lineHeight: '1.6' }}>
              O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado.
            </p>
          </div>
          <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)', flexShrink: 0 }}>
            <button
              disabled={state.caseDescription.trim().length <= 10 || loading}
              onClick={handleValidate}
              style={{ width: '100%', padding: '16px', background: themeColor(MODE_CONFIG[1]), color: ctaTextColor, border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '14px', cursor: state.caseDescription.trim().length <= 10 || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: state.caseDescription.trim().length <= 10 || loading ? 0.5 : 1 }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : MODE_CONFIG[1].cta}
            </button>
          </div>
        </div>
      )}

      {/* ── LOADING MOBILE — Simulação em curso ─────────────────── */}
      {state.step === 'simulating' && (() => {
        const simCfg = MODE_CONFIG[state.selectedMode];
        const modeColor = simCfg ? themeColor(simCfg) : (theme === 'light' ? '#996E00' : '#00FFEF');
        const simStepMap: Record<string, number> = {
          WRITING: 0,
          DELIVERING: 1,
          JUDGING: 2,
          REVIEWING: 3,
        };
        const currentStep = (simStepMap[state.simStep] ?? 0) as 0 | 1 | 2 | 3;
        const statusText =
          state.simStep === 'WRITING' ? 'Peticionando' :
          state.simStep === 'DELIVERING' ? 'Protocolando' :
          state.simStep === 'JUDGING' ? `Julgando · Rodada ${state.currentRound}` :
          state.simStep === 'REVIEWING' ? 'Revisando' :
          'Iniciando simulação';
        const steps = [
          { Icon: FileText,   name: 'Peticionando', desc: 'Advogado elaborando argumentos' },
          { Icon: ArrowRight, name: 'Protocolando', desc: 'Transmissão ao sistema' },
          { Icon: Gavel,      name: 'Julgando',      desc: 'Magistrado analisando' },
          { Icon: Search,     name: 'Revisando',     desc: 'Consolidando análise' },
        ];
        return (
          <div className="flex flex-col md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-primary)' }}>
            <style>{`@keyframes eai-spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
              <ModeNavbar
                onBack={() => {}}
                modeName={MODE_CONFIG[state.selectedMode]?.headline ?? ''}
                color={modeColor}
              />
            </div>
            <SessionStatusBar
              area={formatAreaLabel(state.detectedArea)}
              statusText={statusText}
              statusColor={modeColor}
            />
            <ProgressDots currentStep={currentStep} modeColor={modeColor} />
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 100px', scrollbarWidth: 'none', minHeight: 0 }}>
              <div style={{ width: '64px', height: '64px', border: `3px solid var(--border)`, borderTop: `3px solid ${modeColor}`, borderRadius: '50%', margin: '32px auto 0', animation: 'eai-spin 1s linear infinite' }} />
              <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '22px', fontStyle: 'italic', textAlign: 'center', marginTop: '20px', color: 'var(--text-primary)' }}>
                Processando inteligência
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '8px', marginBottom: '32px' }}>
                Os agentes estão analisando sua causa
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 4px' }}>
                {steps.map((s, index) => {
                  const isActive = index === currentStep;
                  const isDone = index < currentStep;
                  return (
                    <div key={index} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 16px',
                      background: 'var(--bg-card)',
                      border: `1px solid ${isActive ? modeColor : 'var(--border)'}`,
                      borderRadius: '10px',
                      opacity: isDone ? 0.5 : 1,
                      transition: 'border-color 0.2s ease, opacity 0.2s ease',
                    }}>
                      <s.Icon style={{ width: '20px', height: '20px', flexShrink: 0, color: isActive ? modeColor : 'var(--text-muted)' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{s.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{s.desc}</p>
                      </div>
                      {isActive && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: modeColor }}>Em curso</span>
                      )}
                      {isDone && (
                        <CheckCircle2 style={{ width: '14px', height: '14px', color: 'var(--success)' }} />
                      )}
                      {!isActive && !isDone && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Aguarda</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── CONFIRMAÇÃO MOBILE — Área identificada ───────────────── */}
      {state.step === 'confirm' && (() => {
        const confirmCfg = MODE_CONFIG[state.selectedMode];
        const modeColor = confirmCfg ? themeColor(confirmCfg) : (theme === 'light' ? '#996E00' : '#00FFEF');
        const modeColorRgb = confirmCfg ? themeColorRgb(confirmCfg) : (theme === 'light' ? '153,110,0' : '255,184,0');
        const agentTypeByArea: Record<string, string> = {
          LABOR: 'Trabalhista',
          CONSUMER: 'Consumerista',
          CIVIL: 'Civilista',
          FAMILY: 'Família',
          CRIMINAL: 'Criminal',
          TAX: 'Tributarista',
        };
        const agentType = agentTypeByArea[state.detectedArea] ?? 'Especializado';
        return (
          <div className="flex flex-col md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-primary)' }}>
            <style>{`@keyframes eai-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
            <ModeNavbar
              onBack={() => setState(prev => ({ ...prev, step: 'input' }))}
              modeName={MODE_CONFIG[state.selectedMode]?.headline ?? ''}
              color={modeColor}
            />
            <FlowStepper currentStep="confirm" modeColor={modeColor} />
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '24px 16px 100px', scrollbarWidth: 'none' }}>
              {/* Badge animado */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `rgba(${modeColorRgb},0.12)`, border: `1px solid rgba(${modeColorRgb},0.3)`, borderRadius: '8px', padding: '8px 14px', marginBottom: '16px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: modeColor, animation: 'eai-pulse 2s infinite', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: modeColor }}>
                  {formatAreaLabel(state.detectedArea)}
                </span>
              </div>
              {/* Título */}
              <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '24px', fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.3 }}>
                O sistema entendeu sua causa.
              </p>
              {/* Aviso área não identificada — PR-02 */}
              {state.detectedArea === 'OTHER' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(var(--warning-rgb),0.08)', border: '1px solid rgba(var(--warning-rgb),0.3)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                  <Search style={{ width: '16px', height: '16px', flexShrink: 0, color: 'rgb(var(--warning-rgb))' }} />
                  <p style={{ fontSize: '12px', color: 'rgb(var(--warning-rgb))', lineHeight: 1.5, margin: 0 }}>
                    Área jurídica não identificada com precisão. Você pode continuar ou descrever o caso com mais detalhes.
                  </p>
                </div>
              )}
              {/* Card resumo */}
              {state.caseSummary && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${modeColor}`, borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>NÚCLEO CENTRAL · GERADO AUTOMATICAMENTE</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{state.caseSummary}</p>
                </div>
              )}
              {/* Aviso documento ilegível — PR-04 */}
              {state.attachmentsUnreadable && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(var(--warning-rgb),0.08)', border: '1px solid rgba(var(--warning-rgb),0.3)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                  <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0, color: 'rgb(var(--warning-rgb))' }} />
                  <p style={{ fontSize: '12px', color: 'rgb(var(--warning-rgb))', lineHeight: 1.5, margin: 0 }}>
                    Um ou mais documentos não puderam ser lidos. A análise pode estar incompleta, verifique se o PDF possui texto selecionável.
                  </p>
                </div>
              )}
              {/* Agentes */}
              <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: modeColor, marginBottom: '8px' }}>AGENTES ESCALADOS</p>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${modeColor}`, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <Scale style={{ width: '20px', height: '20px', margin: '0 auto 6px', color: modeColor }} />
                  <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: modeColor, margin: '0 0 2px' }}>ADVOGADO</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>{agentType}</p>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${modeColor}`, borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <Gavel style={{ width: '20px', height: '20px', margin: '0 auto 6px', color: modeColor }} />
                  <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: modeColor, margin: '0 0 2px' }}>MAGISTRADO</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>{agentType}</p>
                </div>
              </div>
              {/* Informativo */}
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, marginBottom: '16px' }}>
                A simulação processará em rodadas. O laudo completo está disponível após o resultado.
              </p>
            </div>
            {/* CTA sticky */}
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)', background: 'var(--bg-primary)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleSimulate}
                style={{ width: '100%', padding: '16px', background: modeColor, color: ctaTextColor, border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', borderRadius: '14px', cursor: 'pointer' }}
              >
                Iniciar Fórum →
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, step: 'input' }))}
                style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', borderRadius: '14px', cursor: 'pointer' }}
              >
                ← Corrigir causa
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── ARENA MOBILE — Rodadas (resultado bloqueado) ─────────── */}
      {/* ── RESULTADO MOBILE — Índice + Paywall (Tarefa 5) ──────── */}
      {state.step === 'result' && !state.isUnlocked && (() => {
        const lockedCfg = MODE_CONFIG[state.selectedMode];
        const modeColor = lockedCfg ? themeColor(lockedCfg) : (theme === 'light' ? '#996E00' : '#00FFEF');
        const rounds = state.simulation?.rounds ?? [];
        const finalPct = state.selectedMode === 5 ? (state.mode5Result?.successProbability ?? 0) : (state.simulation?.finalSuccessProbability ?? 0);
        const effectiveSide = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
        const displayPct = (state.selectedMode === 4 && effectiveSide === 'DEFENSE') ? 100 - finalPct : finalPct;

        return (
          <div className="flex flex-col md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg-primary)' }}>
            <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
              <ModeNavbar
                onBack={() => {}}
                modeName={MODE_CONFIG[state.selectedMode]?.headline ?? ''}
                color={modeColor}
              />
            </div>
            <SessionStatusBar
              area={formatAreaLabel(state.detectedArea)}
              statusText="Simulação concluída"
              statusColor={modeColor}
              isComplete
            />
            <ProgressDots currentStep={3} modeColor={modeColor} />
            <div style={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              paddingBottom: 'calc(96px + env(safe-area-inset-bottom))',
              scrollbarWidth: 'none',
            }}>
              {/* GAUGE */}
              <div style={{ textAlign: 'center', padding: '32px 20px 20px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>
                  Índice de força argumentativa
                </p>
                <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '72px', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, color: modeColor, margin: '0 0 10px' }}>
                  {displayPct}%
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: '260px', margin: '0 auto' }}>
                  Estimativa baseada na sua descrição. Não é probabilidade estatística. Resultados reais variam.
                </p>
              </div>
              {/* VEREDITO BAR — dual para modos 3/4, unilateral para os demais */}
              {(state.selectedMode === 3 || state.selectedMode === 4) ? (() => {
                const isDefenseBar = state.selectedMode === 4 && effectiveSide === 'DEFENSE';
                const barFill = isDefenseBar ? displayPct : finalPct;
                const leftLabel = isDefenseBar ? `Réu ${displayPct}%` : `${finalPct}% Autor`;
                const rightLabel = isDefenseBar ? `Autor ${100 - displayPct}%` : `Réu ${100 - finalPct}%`;
                return (
                  <div style={{ margin: '0 20px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: modeColor }}>{leftLabel}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{rightLabel}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${barFill}%`, height: '100%', borderRadius: '4px', background: `linear-gradient(to right, ${modeColor}, var(--success))`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })() : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', margin: '0 20px 20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', flexShrink: 0, minWidth: '36px' }}>Autor</span>
                  <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${finalPct}%`, height: '100%', borderRadius: '3px', background: `linear-gradient(to right, ${modeColor}, var(--success))` }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, flexShrink: 0, color: modeColor }}>{finalPct}%</span>
                </div>
              )}
              {/* SEÇÕES */}
              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {state.selectedMode === 4 && (state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR')) === 'DEFENSE'
                        ? 'Argumento do réu'
                        : 'Argumento do autor'}
                    </span>
                  </div>
                  {rounds.length > 0 && (
                    <div style={{ padding: '0 16px 14px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: '80px', overflow: 'hidden', position: 'relative' }}>
                      {rounds[0].lawyerPetition}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', background: 'linear-gradient(to bottom, transparent, var(--bg-card))' }} />
                    </div>
                  )}
                </div>
                {['Argumento do réu', 'Fundamentos jurídicos', 'Riscos e próximos passos'].map((titulo) => (
                  <div key={titulo} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', opacity: 0.55 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{titulo}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <Lock style={{ width: '11px', height: '11px' }} /><span>Laudo</span>
                      </div>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center', padding: '8px 0 4px' }}>
                  O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado.
                </p>
                {(state.detectedArea === 'FAMILY' || state.detectedArea === 'SOCIAL_SECURITY') && (
                  <div style={{ padding: '16px', background: 'rgba(var(--warning-rgb),0.05)', border: '1px solid rgba(var(--warning-rgb),0.2)', borderRadius: '12px', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(var(--warning-rgb),0.8)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}><HeartHandshake style={{ width: '13px', height: '13px' }} /> Recursos de Apoio</span>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 6px' }}>Em situação de violência, ligue <strong style={{ color: 'var(--text-primary)' }}>180</strong>: Central de Atendimento à Mulher.</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 6px' }}>Em sofrimento emocional, ligue <strong style={{ color: 'var(--text-primary)' }}>188</strong>: CVV.</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>Apoio jurídico gratuito: <strong style={{ color: 'var(--text-primary)' }}>Defensoria Pública</strong> ou <strong style={{ color: 'var(--text-primary)' }}>CRAS</strong>.</p>
                  </div>
                )}
              </div>
            </div>
            {/* CTA FIXO */}
            <div style={{ position: 'sticky', bottom: 0, padding: '12px 20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', background: 'linear-gradient(to bottom, transparent 0%, var(--bg-primary) 35%)', flexShrink: 0 }}>
              <button
                onClick={handleCheckout}
                style={{ width: '100%', padding: '16px', background: modeColor, color: ctaTextColor, border: 'none', fontSize: '15px', fontWeight: 700, letterSpacing: '0.3px', borderRadius: '14px', cursor: 'pointer' }}
              >
                Desbloquear Laudo Completo: {promoStatus?.valid && promoStatus.finalAmountFormatted ? promoStatus.finalAmountFormatted : ([3, 5].includes(state.selectedMode) ? 'R$ 5,90' : 'R$ 9,90')}
              </button>
              <div style={{ marginTop: '8px' }}>
                {!showPromoInput ? (
                  <button type="button" onClick={() => setShowPromoInput(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'underline', width: '100%', textAlign: 'center', padding: '4px 0' }}>
                    Tenho um código promocional
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoStatus(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') validatePromoCode(promoCode); }}
                      placeholder="CÓDIGO PROMO"
                      style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => validatePromoCode(promoCode)}
                      disabled={promoLoading || !promoCode.trim()}
                      style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-active)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em' }}
                    >
                      {promoLoading ? 'Validando…' : 'Aplicar'}
                    </button>
                  </div>
                )}
                {promoStatus && (
                  <p style={{ fontSize: '11px', textAlign: 'center', margin: '4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: promoStatus.valid ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {promoStatus.valid
                      ? <><CheckCircle2 style={{ width: '12px', height: '12px' }} /> {promoStatus.discountLabel} aplicado: {promoStatus.finalAmountFormatted}</>
                      : <><X style={{ width: '12px', height: '12px' }} /> Código inválido ou expirado</>}
                  </p>
                )}
              </div>
              <button
                onClick={() => window.location.reload()}
                style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, borderRadius: '14px', cursor: 'pointer', marginTop: '10px' }}
              >
                Reiniciar simulação
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── LAUDO MOBILE — Desbloqueado (Tarefa 6) ───────────────── */}
      {state.step === 'result' && state.isUnlocked && (
        <LaudoMobile
          state={state}
          modeColor={MODE_CONFIG[state.selectedMode] ? themeColor(MODE_CONFIG[state.selectedMode]) : (theme === 'light' ? '#996E00' : '#00FFEF')}
          onRestart={() => window.location.reload()}
          onSelectHypothesis={async (hyp: string) => {
            setState((prev: any) => ({ ...prev, selectedHypothesis: hyp }));
            const expanded = await expandHypothesis(
              state.simulation?.rounds.slice(-1)[0]?.lawyerPetition || '',
              hyp,
              state.detectedArea
            );
            setState((prev: any) => ({ ...prev, expandedHypothesis: expanded }));
          }}
          onGoToMode4={() => setState((prev: any) => ({
            ...prev,
            step: 'input',
            selectedMode: 4,
            defenseDescription: state.expandedHypothesis!,
            caseDescription: state.simulation?.rounds.slice(-1)[0]?.lawyerPetition || '',
            userSide: 'AUTHOR',
          }))}
          onShowHypotheses={async () => {
            const lastPetition = state.simulation?.rounds.slice(-1)[0]?.lawyerPetition || '';
            setState((prev: any) => ({ ...prev, showHypotheses: true }));
            const hypotheses = await generateCounterHypotheses(lastPetition, state.detectedArea, state.selectedMode);
            setState((prev: any) => ({ ...prev, counterHypotheses: hypotheses.length ? hypotheses : [] }));
          }}
          onOpenChat={user ? handleOpenChat : undefined}
        />
      )}

      {/* ── CHAT PANEL ───────────────────────────────────────────── */}
      {state.step === 'result' && state.isUnlocked && user && (
        <ChatPanel
          lawyerName={state.simulation?.lawyerAgentName ?? 'Advogado'}
          judgeName={state.simulation?.judgeAgentName ?? 'Juiz'}
          area={state.detectedArea}
          sheetState={chatSheetState}
          onSheetChange={setChatSheetState}
          messages={chatMessages}
          questionsUsed={chatQuestionsUsed}
          questionsLimit={chatQuestionsLimit}
          isSending={chatIsSending}
          onSend={handleSendChatMessage}
          error={chatError}
          onClearError={() => setChatError(null)}
        />
      )}

      {state.step === 'boardroom' ? (
        <BoardroomPage
          onEnter={(mode) => {
            setState(prev => ({ ...prev, step: 'input', selectedMode: mode }));
            setPromoCode('');
            setPromoStatus(null);
          }}
          onLogout={() => logoutUser()}
          onShowHistory={handleShowHistory}
          user={user}
        />
      ) : (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-white/10 flex flex-col overflow-x-hidden print:bg-white print:text-black">
      <Navbar
        user={user}
        onLogin={() => setShowLoginModal(true)}
        onLogout={logoutUser}
        onShowHistory={handleShowHistory}
      >
        {state.step !== 'input' && (
          <button
            onClick={() => setState(prev => ({ ...prev, showForgeMonitor: !prev.showForgeMonitor }))}
            className={`flex items-center gap-2 px-3 py-1.5 border transition-all ${state.showForgeMonitor ? '' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-active)]'}`}
            style={state.showForgeMonitor ? { background: 'var(--success)', borderColor: 'var(--success)', color: ctaTextColor } : undefined}
          >
            <Cpu className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Monitor de Agentes</span>
          </button>
        )}
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Status da Simulação</span>
          <span className="text-xs font-mono font-bold" style={{ color: state.step === 'simulating' ? 'rgb(var(--warning-rgb))' : 'var(--success)' }}>
            {state.step === 'input' ? 'AGUARDANDO CAUSA' :
             state.step === 'confirm' ? 'ANALISANDO ÁREA' :
             state.step === 'simulating' ? 'SIMULAÇÃO EM CURSO' : 'SIMULAÇÃO CONCLUÍDA'}
          </span>
        </div>
        <div className="w-[1px] h-8 bg-[var(--border)]" />
        <button
          className="px-4 py-2 border border-[var(--text-primary)] text-[11px] uppercase tracking-widest hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors"
          onClick={() => window.location.reload()}
        >
          Nova Consulta
        </button>
      </Navbar>

      <main className="hidden md:flex-1 md:grid grid-cols-12 gap-0 overflow-hidden min-h-[calc(100vh-64px)]">
        <div className="col-span-12 lg:col-span-9 p-8 flex flex-col gap-6 lg:border-r border-[var(--border)] overflow-y-auto print:col-span-12 print:p-0 print:border-none">
          <AnimatePresence mode="wait">
            {state.error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 border rounded-sm flex items-start gap-4 shadow-2xl relative"
                style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--danger) 20%, transparent)' }}
              >
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                <div className="space-y-2 flex-1">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--danger)' }}>Falha na Operação</h3>
                  <p className="text-sm font-serif italic text-[var(--text-secondary)]">{state.error.message}</p>
                  {state.error.isQuota && (
                    <div className="pt-4 border-t mt-4" style={{ borderColor: 'color-mix(in srgb, var(--danger) 10%, transparent)' }}>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest leading-relaxed">
                        O sistema está temporariamente indisponível. Estamos cientes e já trabalhando na solução. Tente novamente em alguns minutos.
                      </p>
                    </div>
                  )}
                  {state.error?.isRetryable && (
                    <button
                      onClick={() => {
                        setState(prev => ({ ...prev, error: null }));
                        handleSimulate();
                      }}
                      className="mt-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                      style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                    >
                      Tentar Novamente
                    </button>
                  )}
                  <button
                    onClick={() => setState(prev => ({ ...prev, error: null }))}
                    className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {state.step === 'input' && state.selectedMode === 4 && (
              <motion.div
                key="input-modo4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <FlowStepper currentStep="input" modeColor={themeColor(MODE_CONFIG[4])} variant="inline" />
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setState(prev => ({ ...prev, step: 'boardroom' }))}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      <ArrowRight className="w-3 h-3 rotate-180" />
                      Voltar
                    </button>
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[color-mix(in_srgb,rgb(var(--warning-rgb))_60%,transparent)] border border-[color-mix(in_srgb,rgb(var(--warning-rgb))_20%,transparent)] px-2 py-0.5">
                      Mesa Dupla: Assistida
                    </span>
                  </div>
                  {fromPreviousSimulation && (
                    <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-active)] text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-3">
                      <ArrowRight className="w-3 h-3 rotate-180" />
                      Continuando a partir da sua simulação anterior.
                      {!isEditingMode4 && (
                        <button
                          onClick={() => setIsEditingMode4(true)}
                          className="text-[10px] font-bold uppercase tracking-widest border border-[var(--border-active)] px-3 py-1.5 hover:border-[var(--border-active)] hover:text-[var(--text-primary)] transition-all text-[var(--text-muted)]"
                        >
                          Editar campos
                        </button>
                      )}
                    </div>
                  )}
                  <h1 className="text-5xl font-serif italic tracking-tight leading-[1.1] text-[var(--text-primary)]">
                    Insira os dois lados e <br /><span className="text-[var(--text-primary)] font-bold">escolha o seu.</span>
                  </h1>
                  <p className="text-[var(--text-muted)] max-w-lg text-sm uppercase tracking-widest font-medium">
                    O advogado do seu lado recebe assistência da IA em cada rodada.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] relative shadow-2xl shadow-black/50">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ background: 'var(--text-muted)' }} />
                    <div className="px-8 pt-6 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Petição do Autor</span>
                    </div>
                    <textarea
                      value={state.caseDescription}
                      onChange={(e) => setState(prev => ({ ...prev, caseDescription: e.target.value }))}
                      placeholder="Cole ou descreva a petição inicial do autor..."
                      readOnly={fromPreviousSimulation && !isEditingMode4}
                      className={`w-full min-h-[300px] bg-transparent px-8 pb-4 outline-none text-lg font-serif italic text-[var(--text-primary)] resize-y placeholder:opacity-10${fromPreviousSimulation && !isEditingMode4 ? ' opacity-60 cursor-not-allowed' : ''}`}
                    />
                    {state.attachments.length > 0 && (
                      <div className="px-8 pb-2 flex flex-wrap gap-2">
                        {state.attachments.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-sm border border-[var(--border)]">
                            <FileIcon className="w-3 h-3 text-[var(--text-muted)]" />
                            <span className="text-[10px] font-bold uppercase tracking-tight max-w-[100px] truncate text-[var(--text-secondary)]">{file.name}</span>
                            <button onClick={() => setState(prev => ({ ...prev, attachments: prev.attachments.filter((_, j) => j !== i) }))} className="text-[var(--text-muted)] hover:text-[var(--danger)]"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="px-8 pb-6 border-t border-[var(--border)] pt-3">
                      <input type="file" id="author-file-m4" className="hidden" multiple accept="image/*,application/pdf"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          setAttachmentError(null);
                          const newAtts: Attachment[] = [];
                          for (const file of files) {
                            if (file.size > 10 * 1024 * 1024) {
                              setAttachmentError(`${file.name} excede 10MB. Limite por arquivo: 10MB.`);
                              continue;
                            }
                            const data = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
                            newAtts.push({ name: file.name, type: file.type, size: file.size, data });
                          }
                          setState(prev => ({ ...prev, attachments: [...prev.attachments, ...newAtts] }));
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <label htmlFor="author-file-m4" className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors w-fit">
                          <Plus className="w-3 h-3" /> Anexar Provas do Autor
                        </label>
                        <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1">máx 10MB por arquivo · total 20MB</span>
                        <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Texto anonimizado antes do processamento</span>
                        {attachmentError && <span className="text-[10px] text-[var(--danger)] mt-1 block pl-1">{attachmentError}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] border border-[var(--border)] relative shadow-2xl shadow-black/50">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[color-mix(in_srgb,rgb(var(--warning-rgb))_60%,transparent)]" />
                    <div className="px-8 pt-6 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Contestação do Réu</span>
                    </div>
                    <textarea
                      value={state.defenseDescription}
                      onChange={(e) => setState(prev => ({ ...prev, defenseDescription: e.target.value }))}
                      placeholder="Cole ou descreva a contestação do réu..."
                      readOnly={fromPreviousSimulation && !isEditingMode4}
                      className={`w-full min-h-[300px] bg-transparent px-8 pb-4 outline-none text-lg font-serif italic text-[var(--text-primary)] resize-y placeholder:opacity-10${fromPreviousSimulation && !isEditingMode4 ? ' opacity-60 cursor-not-allowed' : ''}`}
                    />
                    {state.defenseAttachments.length > 0 && (
                      <div className="px-8 pb-2 flex flex-wrap gap-2">
                        {state.defenseAttachments.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-sm border border-[var(--border)]">
                            <FileIcon className="w-3 h-3 text-[var(--text-muted)]" />
                            <span className="text-[10px] font-bold uppercase tracking-tight max-w-[100px] truncate text-[var(--text-secondary)]">{file.name}</span>
                            <button onClick={() => setState(prev => ({ ...prev, defenseAttachments: prev.defenseAttachments.filter((_, j) => j !== i) }))} className="text-[var(--text-muted)] hover:text-[var(--danger)]"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="px-8 pb-6 border-t border-[var(--border)] pt-3">
                      <input type="file" id="defense-file-m4" className="hidden" multiple accept="image/*,application/pdf"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          setDefenseAttachmentError(null);
                          const newAtts: Attachment[] = [];
                          for (const file of files) {
                            if (file.size > 10 * 1024 * 1024) {
                              setDefenseAttachmentError(`${file.name} excede 10MB. Limite por arquivo: 10MB.`);
                              continue;
                            }
                            const data = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
                            newAtts.push({ name: file.name, type: file.type, size: file.size, data });
                          }
                          setState(prev => ({ ...prev, defenseAttachments: [...prev.defenseAttachments, ...newAtts] }));
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <label htmlFor="defense-file-m4" className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors w-fit">
                          <Plus className="w-3 h-3" /> Anexar Provas do Réu
                        </label>
                        <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1">máx 10MB por arquivo · total 20MB</span>
                        <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Texto anonimizado antes do processamento</span>
                        {defenseAttachmentError && <span className="text-[10px] text-[var(--danger)] mt-1 block pl-1">{defenseAttachmentError}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setState(prev => ({ ...prev, userSide: 'AUTHOR' }))}
                    className={`px-6 py-3 border text-[11px] uppercase tracking-widest font-bold transition-all ${state.userSide === 'AUTHOR' ? '' : 'border-[var(--border-active)] text-[var(--text-muted)] hover:border-[var(--border-active)]'}`}
                    style={state.userSide === 'AUTHOR' ? { background: themeColor(MODE_CONFIG[4]), color: ctaTextColor, borderColor: themeColor(MODE_CONFIG[4]) } : undefined}
                  >
                    Sou o Autor
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, userSide: 'DEFENSE' }))}
                    className={`px-6 py-3 border text-[11px] uppercase tracking-widest font-bold transition-all ${state.userSide === 'DEFENSE' ? '' : 'border-[var(--border-active)] text-[var(--text-muted)] hover:border-[var(--border-active)]'}`}
                    style={state.userSide === 'DEFENSE' ? { background: 'rgb(var(--warning-rgb))', color: ctaTextColor, borderColor: 'rgb(var(--warning-rgb))' } : undefined}
                  >
                    Sou o Réu
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    disabled={!state.caseDescription.trim() || !state.defenseDescription.trim() || !state.userSide || loading}
                    onClick={handleValidate}
                    className="px-8 py-4 disabled:opacity-50 text-[11px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl" style={{ background: themeColor(MODE_CONFIG[4]), color: ctaTextColor }}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar Causa"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {state.step === 'input' && state.selectedMode === 5 && (
              <motion.div
                key="input-modo5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <FlowStepper currentStep="input" modeColor={themeColor(MODE_CONFIG[5])} variant="inline" />
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setState(prev => ({ ...prev, step: 'boardroom' }))}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      <ArrowRight className="w-3 h-3 rotate-180" />
                      Voltar
                    </button>
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] px-2 py-0.5" style={{ color: `rgba(${themeColorRgb(MODE_CONFIG[5])},0.7)`, border: `1px solid rgba(${themeColorRgb(MODE_CONFIG[5])},0.25)` }}>
                      Revisão Pós-Conflito
                    </span>
                  </div>
                  <h1 className="text-5xl font-serif italic tracking-tight leading-[1.1] text-[var(--text-primary)]">
                    Sentença ou proposta? <br /><span className="text-[var(--text-primary)] font-bold">O Juiz Estrategista avalia.</span>
                  </h1>
                  <p className="text-[var(--text-muted)] max-w-lg text-sm uppercase tracking-widest font-medium flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setState(prev => ({ ...prev, mode5Input: { subCase: 'RECURSO', caseDescription: prev.mode5Input?.caseDescription || '', sentencaOuProposta: prev.mode5Input?.sentencaOuProposta || '', attachments: [] } }))}
                    className={`p-6 border text-left transition-all space-y-2 ${state.mode5Input?.subCase === 'RECURSO' ? '' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-active)]'}`}
                    style={state.mode5Input?.subCase === 'RECURSO' ? { background: themeColor(MODE_CONFIG[5]), borderColor: themeColor(MODE_CONFIG[5]), color: ctaTextColor } : undefined}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Scale className="w-3.5 h-3.5" /> Tenho uma Sentença</span>
                    <span className="text-xs opacity-60">Quero saber se vale recorrer</span>
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, mode5Input: { subCase: 'ACORDO', caseDescription: prev.mode5Input?.caseDescription || '', sentencaOuProposta: prev.mode5Input?.sentencaOuProposta || '', attachments: [] } }))}
                    className={`p-6 border text-left transition-all space-y-2 ${state.mode5Input?.subCase === 'ACORDO' ? '' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-active)]'}`}
                    style={state.mode5Input?.subCase === 'ACORDO' ? { background: themeColor(MODE_CONFIG[5]), borderColor: themeColor(MODE_CONFIG[5]), color: ctaTextColor } : undefined}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><HeartHandshake className="w-3.5 h-3.5" /> Tenho uma Proposta de Acordo</span>
                    <span className="text-xs opacity-60">Quero saber se aceito ou vou a julgamento</span>
                  </button>
                </div>

                {state.mode5Input?.subCase && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] relative shadow-2xl shadow-black/50">
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ background: 'var(--text-muted)' }} />
                      <div className="px-8 pt-6 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Relato do Caso</span>
                      </div>
                      <textarea
                        value={state.mode5Input?.caseDescription || ''}
                        onChange={(e) => setState(prev => ({ ...prev, mode5Input: { ...prev.mode5Input!, caseDescription: e.target.value } }))}
                        placeholder="Descreva o contexto do conflito, o que aconteceu e qual é sua posição..."
                        className="w-full min-h-[180px] bg-transparent px-8 pb-4 outline-none text-lg font-serif italic text-[var(--text-primary)] resize-y placeholder:opacity-10"
                      />
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border)] relative shadow-2xl shadow-black/50">
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: `rgba(${themeColorRgb(MODE_CONFIG[5])},0.6)` }} />
                      <div className="px-8 pt-6 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          {state.mode5Input.subCase === 'RECURSO' ? 'Sentença Recebida' : 'Proposta de Acordo'}
                        </span>
                      </div>
                      <textarea
                        value={state.mode5Input?.sentencaOuProposta || ''}
                        onChange={(e) => setState(prev => ({ ...prev, mode5Input: { ...prev.mode5Input!, sentencaOuProposta: e.target.value } }))}
                        placeholder={state.mode5Input.subCase === 'RECURSO' ? 'Cole aqui o texto da sentença ou decisão recebida...' : 'Descreva os termos da proposta de acordo recebida...'}
                        className="w-full min-h-[180px] bg-transparent px-8 pb-6 outline-none text-lg font-serif italic text-[var(--text-primary)] resize-y placeholder:opacity-10"
                      />
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border)] relative shadow-2xl shadow-black/50">
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: `rgba(${themeColorRgb(MODE_CONFIG[5])},0.6)` }} />
                      <div className="px-8 pt-6 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          Anexar Documentos
                        </span>
                      </div>
                      <div className="px-8 pb-6 pt-2">
                        <input
                          type="file"
                          id="mode5-file"
                          className="hidden"
                          multiple
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            setMode5AttachmentError(null);
                            const newAtts: Attachment[] = [];
                            for (const file of files) {
                              if (file.size > 10 * 1024 * 1024) {
                                setMode5AttachmentError(`${file.name} excede 10MB. Limite por arquivo: 10MB.`);
                                continue;
                              }
                              const data = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
                              newAtts.push({ name: file.name, type: file.type, size: file.size, data });
                            }
                            setState(prev => ({ ...prev, mode5Input: { ...prev.mode5Input!, attachments: [...(prev.mode5Input?.attachments || []), ...newAtts] } }));
                          }}
                        />
                        {(state.mode5Input?.attachments || []).length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {(state.mode5Input?.attachments || []).map((file, i) => (
                              <div key={i} className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 border border-[var(--border)]">
                                <FileIcon className="w-3 h-3 text-[var(--text-muted)]" />
                                <span className="text-[10px] font-bold uppercase tracking-tight max-w-[100px] truncate text-[var(--text-secondary)]">{file.name}</span>
                                <button
                                  onClick={() => setState(prev => ({ ...prev, mode5Input: { ...prev.mode5Input!, attachments: (prev.mode5Input?.attachments || []).filter((_, j) => j !== i) } }))}
                                  className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <label htmlFor="mode5-file" className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors w-fit">
                            <Plus className="w-3 h-3" /> Anexar Sentença ou Documentos
                          </label>
                          <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1">máx 10MB por arquivo · total 20MB · PDF, JPEG ou PNG</span>
                          <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Texto anonimizado antes do processamento</span>
                          {mode5AttachmentError && <span className="text-[10px] text-[var(--danger)] mt-1 block pl-1">{mode5AttachmentError}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2" style={{ backgroundColor: `rgba(${themeColorRgb(MODE_CONFIG[5])},0.05)`, border: `1px solid rgba(${themeColorRgb(MODE_CONFIG[5])},0.2)`, color: `rgba(${themeColorRgb(MODE_CONFIG[5])},0.7)` }}>
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado.
                    </div>

                    {(state.detectedArea === 'FAMILY' ||
                      state.detectedArea === 'SOCIAL_SECURITY') && (
                      <div className="p-6 space-y-3 mt-4" style={{ backgroundColor: `rgba(${themeColorRgb(MODE_CONFIG[5])},0.05)`, border: `1px solid rgba(${themeColorRgb(MODE_CONFIG[5])},0.2)` }}>
                        <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: `rgba(${themeColorRgb(MODE_CONFIG[5])},0.8)` }}>
                          <HeartHandshake className="w-3.5 h-3.5" /> Recursos de Apoio
                        </span>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          Se você está em situação de violência, ligue{' '}
                          <strong className="text-[var(--text-primary)]">180</strong>: Central de Atendimento à Mulher.
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          Em sofrimento emocional, ligue{' '}
                          <strong className="text-[var(--text-primary)]">188</strong>: CVV, Centro de Valorização da Vida.
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          Para apoio jurídico gratuito, procure a{' '}
                          <strong className="text-[var(--text-primary)]">Defensoria Pública</strong> ou o{' '}
                          <strong className="text-[var(--text-primary)]">CRAS</strong> da sua cidade.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        disabled={!state.mode5Input?.caseDescription?.trim() || !state.mode5Input?.sentencaOuProposta?.trim() || loading}
                        onClick={handleValidate}
                        className="px-8 py-4 disabled:opacity-50 text-[11px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl" style={{ background: themeColor(MODE_CONFIG[5]), color: ctaTextColor }}
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Consultar Juiz Estrategista'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {state.step === 'input' && state.selectedMode === 3 && (
              <motion.div
                key="input-modo3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <FlowStepper currentStep="input" modeColor={themeColor(MODE_CONFIG[3])} variant="inline" />
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setState(prev => ({ ...prev, step: 'boardroom' }))}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      <ArrowRight className="w-3 h-3 rotate-180" />
                      Voltar
                    </button>
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] px-2 py-0.5" style={{ color: `rgba(${themeColorRgb(MODE_CONFIG[3])},0.7)`, border: `1px solid rgba(${themeColorRgb(MODE_CONFIG[3])},0.25)` }}>
                      Mesa Dupla: Juiz
                    </span>
                  </div>
                  <h1 className="text-5xl font-serif italic tracking-tight leading-[1.1] text-[var(--text-primary)]">
                    Insira os dois lados para o <br /><span className="text-[var(--text-primary)] font-bold">julgamento direto.</span>
                  </h1>
                  <p className="text-[var(--text-muted)] max-w-lg text-sm uppercase tracking-widest font-medium">
                    O magistrado analisa a petição e a contestação sem intervenção de advogado.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] relative shadow-2xl shadow-black/50">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ background: 'var(--text-muted)' }} />
                    <div className="px-8 pt-6 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Petição do Autor</span>
                    </div>
                    <textarea
                      value={state.caseDescription}
                      onChange={(e) => setState(prev => ({ ...prev, caseDescription: e.target.value }))}
                      placeholder="Cole ou descreva a petição inicial do autor..."
                      className="w-full min-h-[300px] bg-transparent px-8 pb-4 outline-none text-lg font-serif italic text-[var(--text-primary)] resize-y placeholder:opacity-10"
                    />
                    {state.attachments.length > 0 && (
                      <div className="px-8 pb-2 flex flex-wrap gap-2">
                        {state.attachments.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-sm border border-[var(--border)]">
                            <FileIcon className="w-3 h-3 text-[var(--text-muted)]" />
                            <span className="text-[10px] font-bold uppercase tracking-tight max-w-[100px] truncate text-[var(--text-secondary)]">{file.name}</span>
                            <button onClick={() => setState(prev => ({ ...prev, attachments: prev.attachments.filter((_, j) => j !== i) }))} className="text-[var(--text-muted)] hover:text-[var(--danger)]"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="px-8 pb-6 border-t border-[var(--border)] pt-3">
                      <input type="file" id="author-file" className="hidden" multiple accept="image/*,application/pdf"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          setAttachmentError(null);
                          const newAtts: Attachment[] = [];
                          for (const file of files) {
                            if (file.size > 10 * 1024 * 1024) {
                              setAttachmentError(`${file.name} excede 10MB. Limite por arquivo: 10MB.`);
                              continue;
                            }
                            const data = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
                            newAtts.push({ name: file.name, type: file.type, size: file.size, data });
                          }
                          setState(prev => ({ ...prev, attachments: [...prev.attachments, ...newAtts] }));
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <label htmlFor="author-file" className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors w-fit">
                          <Plus className="w-3 h-3" /> Anexar Provas do Autor
                        </label>
                        <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1">máx 10MB por arquivo · total 20MB</span>
                        <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Texto anonimizado antes do processamento</span>
                        {attachmentError && <span className="text-[10px] text-[var(--danger)] mt-1 block pl-1">{attachmentError}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] border border-[var(--border)] relative shadow-2xl shadow-black/50">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: `rgba(${themeColorRgb(MODE_CONFIG[3])},0.6)` }} />
                    <div className="px-8 pt-6 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Contestação do Réu</span>
                    </div>
                    <textarea
                      value={state.defenseDescription}
                      onChange={(e) => setState(prev => ({ ...prev, defenseDescription: e.target.value }))}
                      placeholder="Cole ou descreva a contestação do réu..."
                      className="w-full min-h-[300px] bg-transparent px-8 pb-4 outline-none text-lg font-serif italic text-[var(--text-primary)] resize-y placeholder:opacity-10"
                    />
                    {state.defenseAttachments.length > 0 && (
                      <div className="px-8 pb-2 flex flex-wrap gap-2">
                        {state.defenseAttachments.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-sm border border-[var(--border)]">
                            <FileIcon className="w-3 h-3 text-[var(--text-muted)]" />
                            <span className="text-[10px] font-bold uppercase tracking-tight max-w-[100px] truncate text-[var(--text-secondary)]">{file.name}</span>
                            <button onClick={() => setState(prev => ({ ...prev, defenseAttachments: prev.defenseAttachments.filter((_, j) => j !== i) }))} className="text-[var(--text-muted)] hover:text-[var(--danger)]"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="px-8 pb-6 border-t border-[var(--border)] pt-3">
                      <input type="file" id="defense-file" className="hidden" multiple accept="image/*,application/pdf"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          setDefenseAttachmentError(null);
                          const newAtts: Attachment[] = [];
                          for (const file of files) {
                            if (file.size > 10 * 1024 * 1024) {
                              setDefenseAttachmentError(`${file.name} excede 10MB. Limite por arquivo: 10MB.`);
                              continue;
                            }
                            const data = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file); });
                            newAtts.push({ name: file.name, type: file.type, size: file.size, data });
                          }
                          setState(prev => ({ ...prev, defenseAttachments: [...prev.defenseAttachments, ...newAtts] }));
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <label htmlFor="defense-file" className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors w-fit">
                          <Plus className="w-3 h-3" /> Anexar Provas do Réu
                        </label>
                        <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1">máx 10MB por arquivo · total 20MB</span>
                        <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Texto anonimizado antes do processamento</span>
                        {defenseAttachmentError && <span className="text-[10px] text-[var(--danger)] mt-1 block pl-1">{defenseAttachmentError}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    disabled={!state.caseDescription.trim() || !state.defenseDescription.trim() || loading}
                    onClick={handleValidate}
                    className="px-8 py-4 disabled:opacity-50 text-[11px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl" style={{ background: themeColor(MODE_CONFIG[3]), color: ctaTextColor }}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar Causa"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {state.step === 'input' && state.selectedMode < 3 && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="hidden md:grid grid-cols-12 gap-8 lg:gap-12"
              >
                <div className="col-span-12 xl:col-span-9 space-y-12">
                  <FlowStepper currentStep="input" modeColor={MODE_CONFIG[state.selectedMode] ? themeColor(MODE_CONFIG[state.selectedMode]) : (theme === 'light' ? '#996E00' : '#00FFEF')} variant="inline" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setState(prev => ({ ...prev, step: 'boardroom' }))}
                        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <ArrowRight className="w-3 h-3 rotate-180" />
                        Voltar
                      </button>
                      {state.selectedMode > 0 && (
                        <span
                          className="text-[9px] font-bold uppercase tracking-[0.25em] px-2 py-0.5"
                          style={{
                            color: `rgba(${MODE_CONFIG[state.selectedMode] ? themeColorRgb(MODE_CONFIG[state.selectedMode]) : (theme === 'light' ? '153,110,0' : '255,184,0')},0.7)`,
                            border: `1px solid rgba(${MODE_CONFIG[state.selectedMode] ? themeColorRgb(MODE_CONFIG[state.selectedMode]) : (theme === 'light' ? '153,110,0' : '255,184,0')},0.25)`
                          }}
                        >
                          {MODE_NAMES[state.selectedMode]}
                        </span>
                      )}
                    </div>
                    <h1 className="text-5xl font-serif italic tracking-tight leading-[1.1] text-[var(--text-primary)]">
                      {state.selectedMode === 2
                        ? <>Descreva a acusação recebida e <br /><span className="text-[var(--text-primary)] font-bold">sua versão dos fatos.</span></>
                        : <>Descreva sua causa para iniciar a <br /><span className="text-[var(--text-primary)] font-bold">simulação de fórum.</span></>
                      }
                    </h1>
                    <p className="text-[var(--text-muted)] max-w-lg text-sm uppercase tracking-widest font-medium">
                      {state.selectedMode === 2
                        ? 'Nossa IA constrói sua defesa técnica e o juiz avalia em até 3 ciclos.'
                        : 'Para quem tem uma situação e quer entender, antes de qualquer passo, se os argumentos estão do seu lado.'
                      }
                    </p>
                  </div>

                  <div className="bg-[var(--bg-card)] border border-[var(--border)] relative group shadow-2xl shadow-black/50">
                    <textarea
                      value={state.caseDescription}
                      onChange={(e) => setState(prev => ({ ...prev, caseDescription: e.target.value }))}
                      placeholder="Descreva aqui os detalhes da causa, fatos principais e argumentos jurídicos. Nossa IA processa textos longos sem limite de caracteres..."
                      className="w-full min-h-[400px] h-auto bg-transparent p-8 outline-none transition-all text-2xl font-serif italic text-[var(--text-primary)] resize-y placeholder:opacity-30"
                    />

                    {/* Attachments List */}
                    {state.attachments.length > 0 && (
                      <div className="px-8 pb-4 flex flex-wrap gap-3">
                        {state.attachments.map((file, i) => (
                          <div key={i} className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-sm border border-[var(--border)] group/file">
                            {file.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 text-[var(--text-muted)]" /> : <FileIcon className="w-3 h-3 text-[var(--text-muted)]" />}
                            <span className="text-[10px] font-bold uppercase tracking-tight max-w-[120px] truncate text-[var(--text-tertiary)]">{file.name}</span>
                            <button
                              onClick={() => removeAttachment(i)}
                              className="text-[var(--text-muted)] hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          multiple
                          accept="image/*,application/pdf"
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-3 px-4 py-2 border border-[var(--border)] hover:bg-[var(--accent-muted)] transition-all text-[var(--text-muted)] group-hover:text-[var(--text-tertiary)]"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Anexar Provas</span>
                          </button>
                          <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1">máx 10MB por arquivo · total 20MB</span>
                        <span className="text-[8px] text-[var(--text-muted)] normal-case tracking-normal pl-1 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Texto anonimizado antes do processamento</span>
                          {attachmentError && <span className="text-[10px] text-red-400 mt-1 block pl-1">{attachmentError}</span>}
                        </div>
                        <div className="w-[1px] h-4 bg-[var(--border)] mx-2"></div>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-bold">PDF, JPEG ou PNG</p>
                      </div>

                      <button
                        disabled={state.caseDescription.trim().length <= 10 || loading}
                        onClick={handleValidate}
                        className="px-8 py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] disabled:opacity-50 text-[11px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar Causa"}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[var(--border)] divide-y md:divide-y-0 md:divide-x divide-[var(--border)] shadow-xl shadow-black/30">
                    {[
                      { title: "PROVA ROBUSTA", desc: "Análise multimídia de documentos e evidências anexadas." },
                      { title: "TABULA RASA", desc: "Juízes sem memória garantem imparcialidade técnica a cada round." },
                      { title: "LEGAL BRIEFS", desc: "Advogados utilizam resumos estratégicos para evolução processual." }
                    ].map((feat, i) => (
                      <div key={i} className="p-6 bg-[var(--bg-card)] space-y-2">
                        <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--text-primary)]">{feat.title}</h4>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-12 xl:col-span-3 flex flex-col gap-6">
                  {/* Resumo Analítico - Global Stats */}
                  <div className="bg-[var(--bg-card)] text-[var(--text-primary)] p-8 rounded-sm space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group border border-[var(--border)]">
                    <div className="absolute inset-0 -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" style={{ background: 'var(--border)' }}></div>
                    <div className="flex justify-between items-center opacity-30">
                      <span className="text-[9px] uppercase tracking-widest font-bold">Performance Global EAI?</span>
                      <TrendingUp className="w-4 h-4" />
                    </div>

                    {/* ADR-006: nunca renderiza globalStats antes de resolver — evita
                        mostrar um "0%"/valor zerado como se fosse dado real. */}
                    {statsLoading ? (
                      <div className="space-y-1 py-4">
                        <div className="text-[11px] font-medium opacity-40 uppercase tracking-widest text-[var(--success)]">Ganhos de Causa via EAI?</div>
                        <div className="text-lg font-mono text-[var(--text-muted)] animate-pulse">Carregando estatísticas...</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1">
                          <div className="text-[11px] font-medium opacity-40 uppercase tracking-widest text-[var(--success)]">Ganhos de Causa via EAI?</div>
                          <div className="text-6xl font-serif italic text-[var(--text-primary)]">
                            {globalStats.winRate}%
                          </div>
                        </div>

                        <div className="flex justify-between items-end border-t border-[var(--border)] pt-6">
                          <div className="space-y-1">
                            <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Simulações Concluídas</div>
                            <div className="text-2xl font-mono text-[var(--text-tertiary)]">{globalStats.simulations.toLocaleString()}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Precisão Média</div>
                            <div className="text-2xl font-mono text-[var(--success)] font-bold">{globalStats.precision}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-[var(--bg-card)] border border-[var(--border)] p-8 space-y-8 flex-1">
                    <div className="space-y-1">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--text-tertiary)]">Disponibilidade de Agentes de IA</h3>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-mono">Status Global Agents / Judicial Regions</p>
                    </div>

                    {/* ADR-006: loading e "sem dados" nunca reaproveitam o mesmo
                        visual da lista real — evita parecer estatística de verdade. */}
                    <div className="space-y-5">
                      {statsLoading ? (
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-mono text-center py-6 animate-pulse">
                          Carregando disponibilidade...
                        </div>
                      ) : state.regionalStats.length === 0 ? (
                        <div className="text-center py-6 space-y-2">
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-mono">
                            Sem simulações reais nesta área ainda
                          </p>
                          <p className="text-[9px] text-[var(--text-muted)] opacity-70 normal-case tracking-normal font-serif italic">
                            Preferimos mostrar isso a inventar uma estatística.
                          </p>
                        </div>
                      ) : (() => {
                        const maxSeeds = Math.max(...state.regionalStats.map(r => r.seeds), 1);
                        return state.regionalStats.map((stat, i) => (
                          <div key={i} className="space-y-2 group cursor-default">
                            <div className="flex justify-between items-end">
                              <span className="text-[11px] font-bold text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors">{stat.region}</span>
                              <span className="text-[11px] font-mono text-[var(--success)]">{stat.active} vitórias</span>
                            </div>
                            <div className="h-[2px] bg-[var(--border)] overflow-hidden rounded-full">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(stat.seeds / maxSeeds) * 100}%` }}
                                transition={{ duration: 1.5, delay: i * 0.1 }}
                                className="h-full bg-[var(--text-muted)] group-hover:bg-[var(--success)]/50 transition-colors"
                              />
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter text-[var(--text-muted)]">
                              <motion.span key={stat.seeds} initial={{ opacity: 0.5, y: -2 }} animate={{ opacity: 1, y: 0 }}>
                                {stat.seeds} simulações
                              </motion.span>
                              <span>{stat.seeds > 0 ? ((stat.active / stat.seeds) * 100).toFixed(1) : '0.0'}% êxito</span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    {!statsLoading && state.regionalStats.length > 0 && (
                      <div className="pt-6 border-t border-[var(--border)] space-y-4">
                        <div className="bg-[var(--bg-secondary)] p-4 space-y-2 border border-[var(--border)]">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Total de Vitórias</span>
                            <span className="text-xs font-mono text-[var(--success)] font-bold">
                              {state.regionalStats.reduce((acc, s) => acc + s.active, 0)} VITÓRIAS
                            </span>
                          </div>
                          <div className="text-[9px] text-[var(--text-muted)] leading-relaxed font-serif italic">
                            A simulação aciona agentes especializados conforme a área do conflito identificada na etapa de validação.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-primary)]">Ambiente de Simulação</span>
                      <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase">Agentes de IA · EAI?</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {state.step === 'confirm' && (() => {
              const confirmCfgDesktop = MODE_CONFIG[state.selectedMode];
              const dcColor = confirmCfgDesktop ? themeColor(confirmCfgDesktop) : (theme === 'light' ? '#996E00' : '#00FFEF');
              const dcColorRgb = confirmCfgDesktop ? themeColorRgb(confirmCfgDesktop) : (theme === 'light' ? '153,110,0' : '255,184,0');
              const agentSpecMap: Record<string, string> = {
                LABOR: 'Trabalhista', CONSUMER: 'Consumerista', CIVIL: 'Civilista',
                FAMILY: 'Família', CRIMINAL: 'Criminal', TAX: 'Tributarista',
              };
              const agentSpec = agentSpecMap[state.detectedArea] ?? 'Especializado';
              return (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden md:block space-y-8 py-16 text-center max-w-3xl mx-auto"
              >
                <FlowStepper currentStep="confirm" modeColor={dcColor} variant="inline" />
                {/* Badge de área — identifica o modo e a área detectada */}
                <div className="inline-flex items-center gap-2 px-4 py-2"
                  style={{ background: `rgba(${dcColorRgb},0.12)`, border: `1px solid rgba(${dcColorRgb},0.3)` }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: dcColor }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: dcColor }}>
                    {formatAreaLabel(state.detectedArea)}
                  </span>
                </div>

                {/* Aviso área não identificada — PR-02 */}
                {state.detectedArea === 'OTHER' && (
                  <div className="flex items-start gap-3 text-left px-5 py-4"
                    style={{ background: 'rgba(var(--warning-rgb),0.07)', border: '1px solid rgba(var(--warning-rgb),0.25)', borderRadius: '8px' }}>
                    <Search className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'rgb(var(--warning-rgb))' }} />
                    <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--warning-rgb))', margin: 0 }}>
                      Área jurídica não identificada com precisão. Você pode continuar ou descrever o caso com mais detalhes.
                    </p>
                  </div>
                )}

                <h1 className="text-4xl font-serif italic tracking-tight text-[var(--text-primary)]">
                  O sistema entendeu<br />sua causa.
                </h1>

                {state.caseSummary && (
                  <div className="p-8 shadow-2xl shadow-black/50 mt-8 text-left"
                    style={{ background: 'var(--bg-card)', borderWidth: '1px 1px 1px 3px', borderStyle: 'solid', borderColor: `rgba(${dcColorRgb},0.15) rgba(${dcColorRgb},0.15) rgba(${dcColorRgb},0.15) ${dcColor}` }}>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] mb-4 border-b border-[var(--border)] pb-2">Núcleo Central · Gerado automaticamente</h4>
                    <p className="text-xl font-sans text-[var(--text-secondary)] leading-relaxed">
                      "{state.caseSummary}"
                    </p>
                  </div>
                )}

                {/* Aviso documento ilegível — PR-04 */}
                {state.attachmentsUnreadable && (
                  <div className="flex items-start gap-3 text-left px-5 py-4"
                    style={{ background: 'rgba(var(--warning-rgb),0.07)', border: '1px solid rgba(var(--warning-rgb),0.25)', borderRadius: '8px' }}>
                    <AlertTriangle className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'rgb(var(--warning-rgb))' }} />
                    <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--warning-rgb))', margin: 0 }}>
                      Um ou mais documentos não puderam ser lidos. A análise pode estar incompleta, verifique se o PDF possui texto selecionável.
                    </p>
                  </div>
                )}

                {/* Agentes escalados */}
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-4" style={{ color: dcColor }}>Agentes Escalados</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 space-y-2"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeftWidth: '3px', borderLeftColor: dcColor }}>
                    <Scale className="w-6 h-6 mx-auto" style={{ color: dcColor }} />
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: dcColor }}>Advogado</p>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{agentSpec}</p>
                  </div>
                  <div className="p-5 space-y-2"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeftWidth: '3px', borderLeftColor: dcColor }}>
                    <Gavel className="w-6 h-6 mx-auto" style={{ color: dcColor }} />
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: dcColor }}>Magistrado</p>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{agentSpec}</p>
                  </div>
                </div>

                <div className="mt-10 border-t border-[var(--border)] pt-8 space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--text-muted)] text-center">
                    Deseja iniciar o fórum?
                  </p>
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={handleSimulate}
                      className="w-full max-w-xs px-8 py-5 text-[11px] uppercase tracking-[0.25em] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-black/50"
                      style={{ background: dcColor, color: ctaTextColor }}
                    >
                      Iniciar Fórum
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setState(prev => ({ ...prev, step: 'input' }))}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <ArrowRight className="w-3 h-3 rotate-180" />
                      Corrigir causa
                    </button>
                  </div>
                </div>
              </motion.div>
              );
            })()}

            {(state.step === 'simulating' || (state.step === 'result' && !state.isUnlocked)) && (() => {
              const simDesktopCfg = MODE_CONFIG[state.selectedMode];
              const modeColor = simDesktopCfg ? themeColor(simDesktopCfg) : (theme === 'light' ? '#996E00' : '#00FFEF');
              return (
              <motion.div
                key="simulating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden md:block space-y-8"
              >
                <div className="flex justify-between items-end border-b border-[var(--border)] pb-6">
                  <div>
                    <h2 className="text-3xl font-serif italic text-[var(--text-primary)]">Arena de Simulação</h2>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] mt-1">
                      Sessão de Simulação{state.simulationId ? ` · ${state.simulationId.slice(-6).toUpperCase()}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(r => (
                      <div
                        key={r}
                        className={`w-3 h-3 rounded-full border border-[var(--border)] ${
                          (state.simulation?.rounds.length || 0) >= r ? 'bg-[var(--success)]' : 'bg-[var(--bg-secondary)]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div
                  ref={scrollRef}
                  className="space-y-12 max-h-[700px] overflow-y-auto pr-4 scrollbar-thin overflow-x-hidden"
                >
                  {state.simulation?.rounds.map((round, i) => (
                    <div key={i} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">RODADA {i + 1}</span>
                        <div className="h-px bg-[var(--border)] flex-1" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Modo 4: lado estático */}
                        {state.selectedMode === 4 && (
                          <div className="border p-6 rounded-sm shadow-xl shadow-black/40 relative overflow-hidden opacity-50" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                            <div className="absolute top-0 left-0 w-1 h-full" style={{ background: 'var(--text-muted)' }}></div>
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-sm font-bold uppercase tracking-tight text-[var(--text-muted)]">
                                {state.userSide === 'AUTHOR' ? 'Contestação do Réu' : 'Petição do Autor'}
                              </span>
                              <span className="px-2 py-0.5 border border-[var(--border)] text-[var(--text-muted)] text-[9px] uppercase tracking-widest font-bold">Estático</span>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] italic font-serif line-clamp-4">
                              {state.userSide === 'AUTHOR' ? state.defenseDescription : state.caseDescription}
                            </p>
                          </div>
                        )}
                        {/* Agent: Lawyer */}
                        <div className="border p-6 rounded-sm shadow-xl shadow-black/40 relative overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                           <div className="absolute top-0 left-0 w-1 h-full" style={{ background: modeColor }}></div>
                           <div className="flex justify-between items-center mb-6">
                             <div className="flex flex-col">
                               <span className="text-[9px] font-mono text-[var(--text-muted)]">AGT_LAW_{state.detectedArea}</span>
                               <span className="text-sm font-bold uppercase tracking-tight text-[var(--text-secondary)]">Advogado Especializado</span>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                               <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold" style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>Petição</span>
                               {state.selectedMode === 4 && (
                                 <span className="px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold" style={{ background: 'rgb(var(--warning-rgb))', color: ctaTextColor }}>
                                   {state.userSide === 'AUTHOR' ? 'IA Assistindo Autor' : 'IA Assistindo Réu'}
                                 </span>
                               )}
                             </div>
                           </div>
                           <div className="text-xs text-[var(--text-secondary)] leading-relaxed italic font-serif mb-6 line-clamp-4">
                             "<CensoredText text={round.lawyerPetition} enabled={!state.isUnlocked} />"
                           </div>

                           {round.lawyerBrief && (
                             <div className="mb-6 p-4 border rounded-sm" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                               <div className="flex items-center gap-2 mb-2">
                                 <TrendingUp className="w-3 h-3 text-[var(--text-muted)]" />
                                 <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Brief Estratégico (Memória)</span>
                               </div>
                               <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-mono italic">
                                 <CensoredText text={round.lawyerBrief} enabled={!state.isUnlocked} />
                               </p>
                             </div>
                           )}

                           <div className="flex justify-between items-end">
                             <div className="flex-1 max-w-[120px]">
                               <div className="text-[8px] uppercase font-bold text-[var(--text-muted)] mb-1">Impacto Técnico</div>
                               <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                                 <div className="h-full" style={{ width: `${60 + i * 15}%`, background: 'var(--text-secondary)' }}></div>
                               </div>
                             </div>
                             <span className="text-[9px] font-mono font-bold text-[var(--text-muted)]">MEMÓRIA OK</span>
                           </div>
                        </div>

                        {/* Agent: Judge */}
                        <div className="border p-6 rounded-sm shadow-xl shadow-black/40 relative overflow-hidden backdrop-blur-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                           <div className="absolute top-0 left-0 w-1 h-full" style={{ background: 'rgba(var(--warning-rgb),0.6)' }}></div>
                           <div className="flex justify-between items-center mb-6">
                             <div className="flex flex-col">
                               <span className="text-[9px] font-mono text-[var(--text-muted)]">AGT_JUDGE_{state.detectedArea}</span>
                               <span className="text-sm font-bold uppercase tracking-tight text-[var(--text-secondary)]">Magistrado Técnico</span>
                             </div>
                             <span className="px-2 py-0.5 border text-[9px] uppercase tracking-widest font-bold text-[var(--text-primary)]" style={{ borderColor: 'var(--border-active)' }}>{(state.selectedMode === 1 || state.selectedMode === 2) ? 'Avaliação Técnica' : 'Sentença'}</span>
                           </div>
                           <div className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans mb-6">
                             "<CensoredText text={cleanJudgmentText(round.judgeJudgment) || round.judgeJudgment || ''} enabled={!state.isUnlocked} />"
                           </div>
                           <div className="flex justify-between items-end">
                             <div className="px-3 py-1.5 flex flex-col" style={{ background: 'var(--bg-secondary)' }}>
                               {(() => {
                                 const _es = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
                                 const _rp = (state.selectedMode === 4 && _es === 'DEFENSE') ? 100 - round.successProbability : round.successProbability;
                                 return (
                                   <>
                                     <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">Prob. {_es === 'DEFENSE' ? 'Réu' : 'Autor'}</span>
                                     <span className="text-lg font-serif italic font-bold text-[var(--text-primary)]">{_rp}%</span>
                                   </>
                                 );
                               })()}
                             </div>
                             <span className="text-[9px] font-mono font-bold text-[var(--text-muted)]">ISENÇÃO 100%</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {state.simStep === 'RECOVERING' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 px-4 py-2 border text-[10px] font-bold uppercase tracking-widest"
                      style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--success) 20%, transparent)', color: 'var(--success)' }}
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Verificando sua simulação...
                    </motion.div>
                  )}
                  {retryCount > 0 && state.simStep !== 'RECOVERING' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 px-4 py-2 border text-[10px] font-bold uppercase tracking-widest"
                      style={{ background: 'rgba(var(--warning-rgb),0.1)', borderColor: 'rgba(var(--warning-rgb),0.2)', color: 'rgb(var(--warning-rgb))' }}
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Reconectando, tentativa {retryCount} de 3
                    </motion.div>
                  )}

                  {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="relative">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
                        <div className="absolute inset-0 blur-md animate-pulse rounded-full" style={{ background: 'var(--border)' }}></div>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)]">Processando Inteligência...</div>
                    </div>
                  )}
                </div>

                {state.step === 'result' && !state.isUnlocked && (() => {
                  const finalPct = state.selectedMode === 5
                    ? (state.mode5Result?.successProbability ?? 0)
                    : (state.simulation?.finalSuccessProbability ?? 0);
                  const effectiveSide = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
                  const displayPct = (state.selectedMode === 4 && effectiveSide === 'DEFENSE') ? 100 - finalPct : finalPct;
                  return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 p-10 border shadow-[0_0_100px_rgba(0,0,0,0.25)] relative overflow-hidden"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-active)' }}
                  >
                    <div className="absolute top-0 right-0 p-4">
                      <Lock className="w-24 h-24 -rotate-12" style={{ color: 'var(--border)' }} />
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                      {displayPct > 0 && (
                        <div className="flex flex-col items-center mb-4">
                          <span className="text-7xl font-serif italic font-bold text-[var(--text-primary)]">
                            {displayPct}%
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mt-1">
                            Índice de força argumentativa
                          </span>
                          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mt-1">
                            Estimativa baseada na sua descrição. Resultados reais variam.
                          </span>
                        </div>
                      )}
                      <h3 className="text-3xl font-serif italic text-[var(--text-primary)]">Simulação de Rodadas Concluída.</h3>
                      <p className="text-sm text-[var(--text-muted)] max-w-lg leading-relaxed uppercase tracking-widest font-medium">
                        O laudo estratégico completo com fundamentos técnicos, valor estimado da causa e próximos passos processuais foi gerado.
                      </p>
                      <button
                        onClick={handleCheckout}
                        className="px-12 py-5 text-sm font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-2xl shadow-black/30"
                        style={{ background: modeColor, color: ctaTextColor }}
                      >
                        Desbloquear Laudo Completo: {promoStatus?.valid && promoStatus.finalAmountFormatted ? promoStatus.finalAmountFormatted : ([3, 5].includes(state.selectedMode) ? 'R$ 5,90' : 'R$ 9,90')}
                      </button>
                      <div>
                        {!showPromoInput ? (
                          <button type="button" onClick={() => setShowPromoInput(true)} className="text-[11px] underline cursor-pointer bg-transparent border-none" style={{ color: 'var(--text-muted)' }}>
                            Tenho um código promocional
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={promoCode}
                              onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoStatus(null); }}
                              onKeyDown={e => { if (e.key === 'Enter') validatePromoCode(promoCode); }}
                              placeholder="CÓDIGO PROMO"
                              className="flex-1 px-3 py-2 border text-[12px] font-semibold tracking-wider uppercase outline-none"
                              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            />
                            <button
                              type="button"
                              onClick={() => validatePromoCode(promoCode)}
                              disabled={promoLoading || !promoCode.trim()}
                              className="px-4 py-2 border text-[11px] font-bold tracking-wide cursor-pointer"
                              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            >
                              {promoLoading ? 'Validando…' : 'Aplicar'}
                            </button>
                          </div>
                        )}
                        {promoStatus && (
                          <p className="text-[11px] text-center mt-1 font-semibold" style={{ color: promoStatus.valid ? 'var(--success)' : 'var(--danger)' }}>
                            {promoStatus.valid ? (
                              <><CheckCircle2 className="w-3 h-3 inline mr-1" />{promoStatus.discountLabel} aplicado: {promoStatus.finalAmountFormatted}</>
                            ) : (
                              <><X className="w-3 h-3 inline mr-1" />Código inválido ou expirado</>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-8 border-t pt-6 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" style={{ color: 'var(--success)' }} /> Pagamento seguro</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" style={{ color: 'var(--success)' }} /> Acesso Vitalício</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" style={{ color: 'var(--success)' }} /> Formato Profissional</span>
                      </div>
                    </div>
                  </motion.div>
                  );
                })()}

                {(state.detectedArea === 'FAMILY' ||
                  state.detectedArea === 'SOCIAL_SECURITY') && (
                  <div className="p-6 space-y-3 mt-4" style={{ backgroundColor: `rgba(${(MODE_CONFIG[state.selectedMode] ? themeColorRgb(MODE_CONFIG[state.selectedMode]) : '255,184,0')},0.05)`, border: `1px solid rgba(${(MODE_CONFIG[state.selectedMode] ? themeColorRgb(MODE_CONFIG[state.selectedMode]) : '255,184,0')},0.2)` }}>
                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: `rgba(${(MODE_CONFIG[state.selectedMode] ? themeColorRgb(MODE_CONFIG[state.selectedMode]) : '255,184,0')},0.8)` }}>
                      <HeartHandshake className="w-3.5 h-3.5" /> Recursos de Apoio
                    </span>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Se você está em situação de violência, ligue{' '}
                      <strong className="text-[var(--text-primary)]">180</strong>: Central de Atendimento à Mulher.
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Em sofrimento emocional, ligue{' '}
                      <strong className="text-[var(--text-primary)]">188</strong>: CVV, Centro de Valorização da Vida.
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Para apoio jurídico gratuito, procure a{' '}
                      <strong className="text-[var(--text-primary)]">Defensoria Pública</strong> ou o{' '}
                      <strong className="text-[var(--text-primary)]">CRAS</strong> da sua cidade.
                    </p>
                  </div>
                )}

                {state.step === 'result' && !state.isUnlocked && state.selectedMode === 5 && state.mode5Result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 space-y-6"
                  >
                    <div className="p-6 border space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block">Análise do Juiz Estrategista</span>
                      <p className="text-lg font-sans text-[var(--text-secondary)] leading-relaxed">
                        <CensoredText text={state.mode5Result.strategistAnalysis} enabled={true} />
                      </p>
                    </div>
                    <div className="p-6 border space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block">Fundamentação Jurídica</span>
                      <p className="text-sm font-mono text-[var(--text-secondary)] leading-relaxed">
                        <CensoredText text={state.mode5Result.reasoning} enabled={true} />
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
              );
            })()}

            {state.step === 'result' && state.isUnlocked && (
              <motion.div
                key="full-result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12 pb-32"
              >
                {state.mode5Result && (() => {
                  const rec5 = state.mode5Result.recommendation;
                  const rec5Color = rec5 === 'RECORRER' ? 'var(--danger)' : rec5 === 'ACEITAR' ? 'var(--success)' : 'rgb(var(--warning-rgb))';
                  const Rec5Icon = rec5 === 'RECORRER' ? Scale : rec5 === 'ACEITAR' ? CheckCircle2 : HeartHandshake;
                  const rec5Label = rec5 === 'RECORRER' ? 'Recorrer' : rec5 === 'ACEITAR' ? 'Aceitar' : 'Negociar';
                  const m5ColorRgb = themeColorRgb(MODE_CONFIG[5]);
                  return (
                  <div className="space-y-8 mb-12">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-8">
                      <h2 className="text-5xl font-serif italic tracking-tight text-[var(--text-primary)]">
                        Laudo <span className="font-bold">Estratégico</span>
                      </h2>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Recomendação</span>
                        <span className="text-2xl font-bold font-serif italic flex items-center gap-2" style={{ color: rec5Color }}>
                          <Rec5Icon className="w-5 h-5" /> {rec5Label}
                        </span>
                        {(() => {
                          const pct = state.mode5Result.successProbability;
                          const isRecurso = state.mode5Result.subCase === 'RECURSO';

                          const getLabel = (p: number) => {
                            if (isRecurso) {
                              if (p <= 20) return { label: 'Reforma improvável', color: 'var(--danger)' };
                              if (p <= 50) return { label: 'Recorrer com cautela', color: 'rgb(var(--warning-rgb))' };
                              if (p <= 75) return { label: 'Bons fundamentos', color: 'var(--success)' };
                              return { label: 'Recurso é o caminho', color: 'var(--success)' };
                            } else {
                              if (p <= 30) return { label: 'Aceitar o acordo', color: 'var(--danger)' };
                              if (p <= 55) return { label: 'Negociar melhores termos', color: 'rgb(var(--warning-rgb))' };
                              if (p <= 80) return { label: 'Julgamento favorável', color: 'var(--success)' };
                              return { label: 'Vantagem clara: rejeitar o acordo', color: 'var(--success)' };
                            }
                          };

                          const { label, color } = getLabel(pct);

                          return (
                            <div className="space-y-2 w-full max-w-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                                  {isRecurso ? 'Chance de reforma' : 'Êxito em julgamento'}
                                </span>
                                <span className="text-[10px] font-bold text-[var(--text-secondary)]">{pct}%</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden w-full" style={{ background: 'var(--border)' }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, background: color }}
                                />
                              </div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
                              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-2 font-bold print:text-black/40">
                                Índice de força argumentativa: não probabilidade estatística.
                              </p>
                              <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mt-1 print:text-black/30">
                                Estimativa baseada na sua descrição. Resultados reais variam.
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="p-8 border space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block">Análise do Juiz Estrategista</span>
                      <p className="text-lg font-sans text-[var(--text-secondary)] leading-relaxed">
                        <CensoredText text={state.mode5Result.strategistAnalysis} enabled={!state.isUnlocked} />
                      </p>
                    </div>

                    <div className="p-8 border space-y-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block">Fundamentação Jurídica</span>
                      <p className="text-sm font-mono text-[var(--text-secondary)] leading-relaxed">
                        <CensoredText text={state.mode5Result.reasoning} enabled={!state.isUnlocked} />
                      </p>
                    </div>

                    {state.mode5Result.tokenCount && (
                      <div className="text-[9px] font-mono text-[var(--text-muted)] text-right">
                        Tokens consumidos nesta análise: {state.mode5Result.tokenCount.toLocaleString()}
                      </div>
                    )}

                    <div className="p-4 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2" style={{ backgroundColor: `rgba(${m5ColorRgb},0.05)`, border: `1px solid rgba(${m5ColorRgb},0.2)`, color: `rgba(${m5ColorRgb},0.7)` }}>
                      <AlertTriangle className="w-3.5 h-3.5" /> O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado.
                    </div>

                    {(state.detectedArea === 'FAMILY' ||
                      state.detectedArea === 'SOCIAL_SECURITY') && (
                      <div className="p-6 space-y-3 mt-4" style={{ backgroundColor: `rgba(${m5ColorRgb},0.05)`, border: `1px solid rgba(${m5ColorRgb},0.2)` }}>
                        <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: `rgba(${m5ColorRgb},0.8)` }}>
                          <HeartHandshake className="w-3.5 h-3.5" /> Recursos de Apoio
                        </span>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          Se você está em situação de violência, ligue{' '}
                          <strong className="text-[var(--text-primary)]">180</strong>: Central de Atendimento à Mulher.
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          Em sofrimento emocional, ligue{' '}
                          <strong className="text-[var(--text-primary)]">188</strong>: CVV, Centro de Valorização da Vida.
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          Para apoio jurídico gratuito, procure a{' '}
                          <strong className="text-[var(--text-primary)]">Defensoria Pública</strong> ou o{' '}
                          <strong className="text-[var(--text-primary)]">CRAS</strong> da sua cidade.
                        </p>
                      </div>
                    )}
                  </div>
                  );
                })()}

                <div className="hidden print:block print:fixed print:top-0 print:left-0 print:right-0 print:bg-white print:pb-3 print:mb-0 print:z-50 border-b-2 border-black">
                  <div className="flex justify-between items-center">
                    <Logo variant="light" size="sm" showTitle={false} />
                    <div className="text-right">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-black/40">Relatório Estratégico de Performance</div>
                      <div className="text-[9px] font-mono text-black/20">EMITIDO EM: {new Date().toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                </div>
                {/* Reserva o espaço ocupado pelo cabeçalho fixo acima — sem isso, o
                    conteúdo da primeira página impressa ficaria por baixo dele. */}
                <div className="hidden print:block" style={{ height: '56px' }} />

                {state.selectedMode === 1 && (
                  <div className="p-6 border mb-8 no-print" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Esta análise avalia a força dos seus argumentos de forma independente.
                      Para simular o contraditório com a outra parte, continue abaixo.
                    </p>
                  </div>
                )}

                {state.selectedMode === 1 && state.isUnlocked && (
                  <div className="space-y-6 mb-8 no-print">

                    {!state.showHypotheses && !state.counterHypotheses?.length && (
                      <button
                        onClick={async () => {
                          const lastPetition = state.simulation?.rounds.slice(-1)[0]?.lawyerPetition || '';
                          setState(prev => ({ ...prev, showHypotheses: true }));
                          const hypotheses = await generateCounterHypotheses(lastPetition, state.detectedArea, state.selectedMode);
                          setState(prev => ({ ...prev, counterHypotheses: hypotheses.length ? hypotheses : [] }));
                        }}
                        className="w-full p-4 border text-[11px] font-bold uppercase tracking-widest transition-all text-left flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <span className="flex items-center gap-2">
                          {state.selectedMode === 1
                            ? <><Scale className="w-4 h-4" /> Quer ver como a outra parte vai reagir?</>
                            : <><Swords className="w-4 h-4" /> Quer ver como o outro lado vai contra-atacar?</>}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {state.showHypotheses && !state.counterHypotheses?.length && (
                      <div className="flex items-center gap-3 p-4 border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
                        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">
                          Gerando hipóteses do outro lado...
                        </span>
                      </div>
                    )}

                    {state.counterHypotheses && state.counterHypotheses.length > 0 && !state.expandedHypothesis && (
                      <div className="space-y-4 p-6 border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
                          {state.selectedMode === 1
                            ? 'Hipóteses de defesa do Réu: escolha a mais provável:'
                            : 'Hipóteses de ataque do Autor: escolha a mais provável:'}
                        </div>
                        <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest italic mb-4">
                          Estas são hipóteses baseadas nos fatos narrados. Escolha a que melhor representa o que você espera do outro lado.
                        </p>
                        {isExpandingHypothesis ? (
                          <div className="flex items-center gap-3 py-6 px-4">
                            <Loader2 className="animate-spin h-4 w-4 text-[var(--text-muted)] shrink-0" />
                            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Desenvolvendo argumento do outro lado...</span>
                          </div>
                        ) : (
                          state.counterHypotheses.map((hyp, i) => (
                            <button
                              key={i}
                              disabled={isExpandingHypothesis}
                              onClick={async () => {
                                setState(prev => ({ ...prev, selectedHypothesis: hyp }));
                                setIsExpandingHypothesis(true);
                                const expanded = await expandHypothesis(
                                  state.simulation?.rounds.slice(-1)[0]?.lawyerPetition || '',
                                  hyp,
                                  state.detectedArea
                                );
                                setState(prev => ({ ...prev, expandedHypothesis: expanded }));
                                setIsExpandingHypothesis(false);
                              }}
                              className="w-full p-4 border text-left transition-all space-y-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent-muted)]"
                              style={{ borderColor: 'var(--border)' }}
                            >
                              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                Opção {String.fromCharCode(65 + i)}
                              </span>
                              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{hyp}</p>
                            </button>
                          ))
                        )}
                        <div className="border" style={{ borderColor: 'var(--border)' }}>
                          <button
                            disabled={isExpandingHypothesis}
                            onClick={() => setState(prev => ({ ...prev, selectedHypothesis: 'D' }))}
                            className="w-full p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent-muted)]"
                          >
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Opção D</span>
                            <p className="text-sm text-[var(--text-secondary)]">Eu sei o que o outro lado vai alegar</p>
                          </button>
                          {state.selectedHypothesis === 'D' && (
                            <div className="px-4 pb-4 space-y-3">
                              <textarea
                                placeholder="Descreva o argumento do outro lado..."
                                className="w-full min-h-[120px] bg-transparent border p-3 text-sm font-serif italic outline-none resize-y placeholder:opacity-30 text-[var(--text-secondary)]"
                                style={{ borderColor: 'var(--border)' }}
                                onChange={(e) => setState(prev => ({ ...prev, expandedHypothesis: e.target.value }))}
                              />
                              <button
                                disabled={isExpandingHypothesis}
                                onClick={async () => {
                                  if (!state.expandedHypothesis?.trim()) return;
                                  setIsExpandingHypothesis(true);
                                  const expanded = await expandHypothesis(
                                    state.simulation?.rounds.slice(-1)[0]?.lawyerPetition || '',
                                    state.expandedHypothesis,
                                    state.detectedArea
                                  );
                                  setState(prev => ({ ...prev, expandedHypothesis: expanded }));
                                  setIsExpandingHypothesis(false);
                                }}
                                className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                style={{ background: MODE_CONFIG[state.selectedMode] ? themeColor(MODE_CONFIG[state.selectedMode]) : (theme === 'light' ? '#996E00' : '#00FFEF'), color: ctaTextColor }}
                              >
                                Usar este argumento →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {state.expandedHypothesis && (
                      <div className="space-y-4 p-6 border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-active)' }}>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                          Argumento do outro lado: expandido
                        </div>
                        <p className="text-sm font-sans text-[var(--text-secondary)] leading-relaxed">
                          {state.expandedHypothesis}
                        </p>
                        <button
                          onClick={() => setState(prev => ({
                            ...prev,
                            step: 'input',
                            selectedMode: 4,
                            defenseDescription: state.selectedMode === 1 ? state.expandedHypothesis! : state.simulation?.rounds.slice(-1)[0]?.lawyerPetition || '',
                            caseDescription: state.selectedMode === 1 ? state.simulation?.rounds.slice(-1)[0]?.lawyerPetition || '' : state.expandedHypothesis!,
                            userSide: state.selectedMode === 1 ? 'AUTHOR' : 'DEFENSE',
                          }))}
                          className="w-full py-4 text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 hover:opacity-90"
                          style={{ background: MODE_CONFIG[state.selectedMode] ? themeColor(MODE_CONFIG[state.selectedMode]) : (theme === 'light' ? '#996E00' : '#00FFEF'), color: ctaTextColor }}
                        >
                          Simular o contraditório no Modo 4
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <p className="text-[9px] text-[var(--text-muted)] text-center uppercase tracking-widest">
                          Você será direcionado para a Mesa Dupla Assistida com os campos pré-carregados.
                        </p>
                      </div>
                    )}

                  </div>
                )}

                {state.selectedMode !== 5 && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-8 gap-6 print:border-black/10" style={{ borderColor: 'var(--border)' }}>
                  <h2 className="text-3xl md:text-5xl font-serif italic tracking-tight print:text-black text-[var(--text-primary)]">
                    Laudo <span className="font-bold">Estratégico</span>
                  </h2>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold tracking-widest print:text-black/40 text-[var(--text-muted)]">Probabilidade Final</span>
                    {(state.selectedMode === 3 || state.selectedMode === 4) && state.simulation ? (
                      <>
                        <span className="text-[10px] uppercase font-bold tracking-widest mt-1 text-[var(--text-muted)]">
                          {state.simulation.finalSuccessProbability >= 55 ? '↓ AUTOR FAVORECIDO' : state.simulation.finalSuccessProbability <= 45 ? '↓ RÉU FAVORECIDO' : '↓ RESULTADO EQUILIBRADO'}
                        </span>
                        <span className="text-4xl font-serif italic font-bold print:text-black" style={{ color: 'var(--success)' }}>
                          {state.simulation.finalSuccessProbability >= 55 ? state.simulation.finalSuccessProbability : 100 - state.simulation.finalSuccessProbability}%
                        </span>
                      </>
                    ) : (
                      <span className="text-4xl font-serif italic font-bold print:text-black" style={{ color: 'var(--success)' }}>
                        {(state.simulation?.rounds && state.simulation.rounds.length > 0) ? `${state.simulation.finalSuccessProbability}` : "--"}%
                      </span>
                    )}
                    <p className="text-[10px] uppercase tracking-widest mt-2 font-bold print:text-black/40 text-[var(--text-muted)]">
                      Índice de força argumentativa: não probabilidade estatística.
                    </p>
                    <p className="text-[9px] uppercase tracking-widest mt-1 print:text-black/30 text-[var(--text-muted)]">
                      Estimativa baseada na sua descrição. Resultados reais variam.
                    </p>
                  </div>
                </div>
                )}

                {state.selectedMode !== 5 && state.caseSummary && (
                  <div className="p-8 border print:bg-gray-50 print:border-black/10 print:p-6 mb-8" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                    <h4 className="text-[10px] uppercase font-bold tracking-[0.3em] print:text-black/60 mb-3 text-[var(--text-muted)]">Objeto da Simulação (Entendimento do Sistema)</h4>
                    <p className="text-xl font-serif italic leading-relaxed print:text-black text-[var(--text-primary)]">
                      "{state.caseSummary}"
                    </p>
                  </div>
                )}

                {(state.selectedMode === 3 || state.selectedMode === 4) && state.simulation?.rounds[0] && (() => {
                  const verdictCfg = MODE_CONFIG[state.selectedMode];
                  const verdictColor = verdictCfg ? themeColor(verdictCfg) : (theme === 'light' ? '#996E00' : '#00FFEF');
                  const verdictColorRgb = verdictCfg ? themeColorRgb(verdictCfg) : (theme === 'light' ? '153,110,0' : '255,184,0');
                  return (
                  <div className="space-y-6 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                        <div className="text-[9px] font-bold uppercase tracking-widest mb-3 text-[var(--text-muted)]">Argumento do Autor</div>
                        <p className="text-sm font-sans leading-relaxed text-[var(--text-secondary)]">
                          {(state.selectedMode === 4 && state.userSide === 'AUTHOR')
                            ? (state.simulation.rounds[0].lawyerPetition || '-')
                            : (state.caseDescription || '-')}
                        </p>
                      </div>
                      <div className="p-6" style={{ background: 'var(--bg-secondary)', border: `1px solid rgba(${verdictColorRgb},0.2)` }}>
                        <div className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: `rgba(${verdictColorRgb},0.6)` }}>Argumento do Réu</div>
                        <p className="text-sm font-sans leading-relaxed text-[var(--text-secondary)]">
                          {(state.selectedMode === 4 && state.userSide === 'DEFENSE')
                            ? (state.simulation.rounds[0].lawyerPetition || '-')
                            : (state.defenseDescription || '-')}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 border space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-2 text-[var(--text-muted)]">Veredito Imparcial</div>
                      <div className="flex items-center gap-0 h-8 rounded-sm overflow-hidden">
                        <div className="h-full flex items-center justify-end pr-3 transition-all" style={{ width: `${state.simulation.finalSuccessProbability}%`, background: 'var(--text-muted)' }}>
                          <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: ctaTextColor }}>{state.simulation.finalSuccessProbability}% AUTOR</span>
                        </div>
                        <div className="h-full flex items-center justify-start pl-3 transition-all" style={{ width: `${100 - state.simulation.finalSuccessProbability}%`, background: verdictColor }}>
                          <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: ctaTextColor }}>RÉU {100 - state.simulation.finalSuccessProbability}%</span>
                        </div>
                      </div>
                      <p className="text-lg font-serif italic text-[var(--text-secondary)]">
                        {state.simulation.finalSuccessProbability >= 55
                          ? `O Autor vence com ${state.simulation.finalSuccessProbability}% de probabilidade de procedência.`
                          : state.simulation.finalSuccessProbability <= 45
                          ? `O Réu vence: probabilidade de procedência do Autor é de apenas ${state.simulation.finalSuccessProbability}%.`
                          : `Resultado equilibrado: ${state.simulation.finalSuccessProbability}% para o Autor, ${100 - state.simulation.finalSuccessProbability}% para o Réu.`}
                      </p>
                    </div>
                  </div>
                  );
                })()}

                {state.simulation?.rounds && state.simulation.rounds.length > 0 && (
                  <div className="space-y-4 mb-8 print:hidden">
                    <div className="text-[9px] font-bold uppercase tracking-widest border-b pb-3 text-[var(--text-muted)]" style={{ borderColor: 'var(--border)' }}>
                      Histórico de Rodadas
                    </div>
                    {state.simulation.rounds.map((round, i) => (
                      <div key={i} className="p-6 border space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-mono font-bold text-[var(--text-muted)]">RODADA {i + 1}</span>
                          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                          {(() => {
                            const _es = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
                            const _rp = (state.selectedMode === 4 && _es === 'DEFENSE') ? 100 - round.successProbability : round.successProbability;
                            return <span className="text-[9px] font-mono font-bold text-[var(--text-muted)]">APROVEITAMENTO ({_es === 'DEFENSE' ? 'RÉU' : 'AUTOR'}) {_rp}%</span>;
                          })()}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-[8px] font-bold uppercase tracking-widest mb-2 text-[var(--text-muted)]">
                              {state.selectedMode === 4
                                ? (state.userSide === 'AUTHOR' ? 'Advogado do Autor' : 'Advogado do Réu')
                                : 'Advogado'}
                            </div>
                            <p className="text-xs leading-relaxed font-serif italic line-clamp-6 text-[var(--text-secondary)]">
                              "{round.lawyerPetition}"
                            </p>
                          </div>
                          <div>
                            <div className="text-[8px] font-bold uppercase tracking-widest mb-2 text-[var(--text-muted)]">Magistrado Técnico</div>
                            <p className="text-xs leading-relaxed font-sans line-clamp-6 text-[var(--text-secondary)]">
                              "{cleanJudgmentText(round.judgeJudgment) || round.judgeJudgment || ''}"
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-16 print:gap-8">
                  {/* Volume 1: Orientação ao Cliente */}
                  {state.selectedMode !== 5 && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-[color-mix(in_srgb,var(--success)_30%,transparent)] pb-4 print:border-black/10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] px-4 py-1.5 rounded-sm print:bg-black print:text-white w-fit" style={{ background: 'var(--success)', color: ctaTextColor }}>
                          VOLUME I: ORIENTAÇÃO AO CLIENTE
                        </span>
                        <span className="text-[8px] font-mono text-[color-mix(in_srgb,var(--success)_50%,transparent)] uppercase tracking-widest pl-1">Linguagem Acessível e Prática</span>
                      </div>
                      <div className="flex-1" />
                      <div className="flex flex-col items-end print:hidden">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[color-mix(in_srgb,var(--success)_60%,transparent)]">Agente Responsável</div>
                        <div className="text-[11px] font-serif italic text-[var(--text-muted)]">Estrategista de Acessibilidade</div>
                      </div>
                    </div>
                    <div className={`laudo-prose prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none font-sans text-lg leading-[1.6] text-[var(--text-primary)] font-light bg-[color-mix(in_srgb,var(--success)_5%,transparent)] p-8 border border-[color-mix(in_srgb,var(--success)_20%,transparent)] shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0`}>
                      <ReactMarkdown>
                        {state.report?.layman || ''}
                      </ReactMarkdown>
                    </div>
                  </section>
                  )}

                  {/* Volume 2: Fundamentação Técnica Estratégica */}
                  {state.selectedMode !== 5 && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4 print:border-black/10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] bg-[var(--bg-secondary)] text-[var(--text-primary)] px-4 py-1.5 rounded-sm print:bg-black print:text-white w-fit">
                          VOLUME II: LAUDO TÉCNICO ESTRATÉGICO
                        </span>
                        <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest pl-1">Fundamentação Jurídica e Normativa</span>
                      </div>
                      <div className="flex-1" />
                      <div className="flex flex-col items-end print:hidden">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Agente Responsável</div>
                        <div className="text-[11px] font-serif italic text-[var(--text-muted)]">Analista Processual Sênior</div>
                      </div>
                    </div>
                    <div className={`laudo-prose p-10 border border-[var(--border)] font-sans text-[13px] leading-loose text-[var(--text-secondary)] shadow-2xl relative overflow-hidden prose ${theme === 'dark' ? 'prose-invert' : ''} prose-sm max-w-none print:bg-white print:text-black/80 print:border-none print:shadow-none print:p-0`} style={{ background: 'var(--bg-secondary)' }}>
                      <ReactMarkdown>
                        {state.report?.professional || ''}
                      </ReactMarkdown>
                    </div>
                  </section>
                  )}

                  {/* Resumo da Causa — Modos 1 e 2 */}
                  {(state.selectedMode === 1 || state.selectedMode === 2) && state.report?.causeSummary && (
                  <section className="space-y-6 pt-12 border-t-2 border-[var(--border)] print:border-black/20 print:pt-8">
                    <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4 print:border-black/10">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] bg-[var(--bg-secondary)] text-[var(--text-primary)] px-4 py-1.5 rounded-sm print:bg-black print:text-white w-fit">
                          RESUMO DA SUA CAUSA
                        </span>
                        <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest pl-1">Para apresentar a um advogado, não é peça processual</span>
                      </div>
                      <div className="flex-1" />
                      <button
                        onClick={() => {
                          const blob = new Blob([state.report?.causeSummary || ''], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'resumo-da-causa.txt';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-[var(--border-active)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors print:hidden"
                      >
                        Baixar Resumo da Causa
                      </button>
                    </div>
                    <div className={`p-8 bg-[var(--bg-secondary)] border border-[var(--border)] font-sans text-[13px] leading-loose text-[var(--text-secondary)] print:bg-gray-50 print:border-black/10 print:text-black prose ${theme === 'dark' ? 'prose-invert' : ''} prose-sm max-w-none`}>
                      <ReactMarkdown>
                        {state.report.causeSummary}
                      </ReactMarkdown>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold print:text-black/40 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 print:hidden" /> Este resumo não é uma peça processual. Não substitui consulta com advogado.
                    </p>
                  </section>
                  )}

                  {/* Volume 3: Anexos Processuais (Audit Trail) */}
                  {state.selectedMode !== 5 && (
                  <section className="space-y-6 pt-12 border-t-2 border-[var(--border)] print:border-black/20 print:pt-8 print:break-before-page">
                    <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-6 print:border-black/10">
                      <span className="text-[12px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)] print:text-black/60">
                        ANEXO I: HISTÓRICO DE EVOLUÇÃO DAS PEÇAS E JULGAMENTOS
                      </span>
                      <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-[0.2em] print:text-black/30 italic">
                        Memorial Descritivo do Ciclo de Debate Estratégico (Lawyer VS Judge Dynamics)
                      </span>
                    </div>
                    
                    <div className="space-y-12 print:space-y-10">
                      {state.simulation?.rounds.map((round, idx) => (
                        <div key={idx} className="border-l-4 border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--bg-secondary)] p-10 space-y-8 rounded-r-md print:border-black/20 print:bg-white print:p-0 print:border-l-0 print:space-y-6">
                          <div className="flex justify-between items-center border-b border-[var(--border)] pb-4 print:border-black/10">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono print:bg-black print:text-white" style={{ background: 'var(--success)', color: ctaTextColor }}>
                                {round.round}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] print:text-black">Ciclo de Aperfeiçoamento Processual</span>
                                <span className="text-[9px] font-mono text-[var(--text-muted)] print:text-black/40">ID_PROTOCOLO: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              {(() => {
                                const _es = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
                                const _rp = (state.selectedMode === 4 && _es === 'DEFENSE') ? 100 - round.successProbability : round.successProbability;
                                return (
                                  <>
                                    <div className="text-[9px] font-bold text-[var(--success)] uppercase tracking-widest print:text-black">Aproveitamento ({_es === 'DEFENSE' ? 'Réu' : 'Autor'})</div>
                                    <div className="text-xl font-serif italic text-[var(--text-primary)] print:text-black">{_rp}%</div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 print:gap-8">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Scale className="w-4 h-4 text-[var(--success)] print:text-black" />
                                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest print:text-black">Petição e Pedidos do Advogado</span>
                              </div>
                              <div className={`laudo-prose prose ${theme === 'dark' ? 'prose-invert' : ''} prose-sm max-w-none p-6 bg-[var(--bg-card)] border border-[var(--border)] text-[13px] leading-relaxed text-[var(--text-secondary)] font-sans print:text-black print:bg-gray-50 print:border-black/10 print:p-4`}>
                                <ReactMarkdown>{round.lawyerPetition}</ReactMarkdown>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Gavel className="w-4 h-4 text-[var(--text-muted)] print:text-black" />
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest print:text-black/60">Análise e Decisão do Magistrado</span>
                              </div>
                              <div className={`laudo-prose prose ${theme === 'dark' ? 'prose-invert' : ''} prose-sm max-w-none p-6 bg-[var(--bg-secondary)] border border-dashed border-[var(--border)] text-[13px] leading-relaxed text-[var(--text-muted)] font-sans print:text-black print:bg-gray-50 print:border-black/10 print:p-4`}>
                                <ReactMarkdown>{cleanJudgmentText(round.judgeJudgment)}</ReactMarkdown>
                              </div>
                            </div>
                          </div>

                          {round.lawyerBrief && (
                            <div className="mt-4 p-6 rounded-sm border print:border-black/5 print:bg-gray-100" style={{ background: 'color-mix(in srgb, var(--success) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--success) 10%, transparent)' }}>
                               <div className="flex items-center gap-2 mb-3">
                                 <History className="w-4 h-4 text-[color-mix(in_srgb,var(--success)_40%,transparent)] print:text-black/40" />
                                 <span className="text-[9px] font-bold uppercase tracking-widest text-[color-mix(in_srgb,var(--success)_40%,transparent)] print:text-black/60">Insight Estratégico Retido para o Próximo Ciclo</span>
                               </div>
                               <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-mono italic print:text-black/80">
                                 {round.lawyerBrief}
                               </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="col-span-12 lg:col-span-3 bg-[var(--bg-secondary)] p-8 flex flex-col gap-10 overflow-y-auto border-l border-[var(--border)] no-print">
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-6 border-b border-[var(--border)] pb-3 flex items-center justify-between text-[var(--text-tertiary)]">
              Boardroom <span className="text-[8px] font-mono opacity-20">{`v2.4.0 · ${import.meta.env.VITE_GIT_HASH || 'dev'}`}</span>
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  // ADR-006: antes da validação (step 'input'), detectedArea ainda é
                  // o valor padrão 'OTHER' — não renderiza como se fosse detectado.
                  { n: "ÁREA IDENTIFICADA", s: state.step === 'input' ? 'Aguardando causa' : areaLabels[state.detectedArea], icon: ShieldCheck },
                  { n: "ESPECIALIZAÇÃO", s: state.step === 'input' ? 'Aguardando causa' : "Juiz de IA especializado em " + areaLabels[state.detectedArea], icon: Gavel },
                ].map((m, i) => (
                  <div key={i} className="bg-[var(--bg-card)] p-4 border border-[var(--border)] space-y-1">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{m.n}</div>
                    <div className="text-[11px] text-[var(--text-primary)] font-medium italic font-serif leading-tight">{m.s}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Agentes Ativados na Sessão</h4>
                <div className="grid grid-cols-1 gap-3">
                  {state.activeAgents.length > 0 ? (
                    state.activeAgents.map((agent, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={agent.id}
                        className="bg-[var(--bg-card)] p-3 border border-[var(--border)] space-y-1 relative group overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'var(--success)' }} />
                        <div className="flex justify-between items-start">
                          <div className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: 'color-mix(in srgb, var(--success) 60%, transparent)' }}>{agent.type}</div>
                          <div className="text-[7px] font-mono text-[var(--text-muted)]">0x{(i * 133).toString(16).toUpperCase()}</div>
                        </div>
                        <div className="text-[10px] text-[var(--text-primary)] font-medium italic font-serif leading-tight">{agent.name}</div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-[9px] text-[var(--text-muted)] italic p-4 border border-dashed border-[var(--border)] text-center opacity-70">
                      Aguardando ativação de agentes...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="flex-1 flex flex-col min-h-0">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] mb-6 border-b border-[var(--border)] pb-3 text-[var(--text-muted)] flex justify-between items-center">
              <span>Fluxo Estratégico</span>
              {state.simStep !== 'IDLE' && state.currentRound > 0 && (
                <span className="text-[9px] bg-[var(--accent-muted)] px-2 py-0.5 rounded-full text-[var(--text-tertiary)]">ROUND {state.currentRound}</span>
              )}
            </h3>

            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-10 py-4">
                <div className="flex flex-col items-center gap-6 relative">
                  {/* Vertical line connecting steps */}
                  <div className="absolute top-5 bottom-5 left-[23px] w-px bg-[var(--border)]" />

                  <div className={`flex items-center gap-5 transition-all duration-500 w-full p-4 rounded-sm border ${state.simStep === 'WRITING' ? 'bg-[var(--accent-muted)] border-[var(--border-active)] scale-105 shadow-xl' : 'opacity-40 border-transparent'}`}>
                    <div className={`w-12 h-12 rounded-full border border-[var(--text-primary)] flex items-center justify-center shrink-0 z-10 transition-colors ${state.simStep === 'WRITING' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'}`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Peticionando</span>
                      <span className="text-[9px] text-[var(--text-muted)] uppercase font-mono italic">Advogado Especializado</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-5 transition-all duration-500 w-full p-4 rounded-sm border ${state.simStep === 'DELIVERING' ? 'bg-[var(--accent-muted)] border-[var(--border-active)] scale-105 shadow-xl' : 'opacity-40 border-transparent'}`}>
                    <div className={`w-12 h-12 rounded-full border border-[var(--text-primary)] flex items-center justify-center shrink-0 z-10 transition-colors ${state.simStep === 'DELIVERING' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'}`}>
                      <ArrowRight className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Protocolando</span>
                      <span className="text-[9px] text-[var(--text-muted)] uppercase font-mono italic">Barramento Digital</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-5 transition-all duration-500 w-full p-4 rounded-sm border ${state.simStep === 'JUDGING' ? 'bg-[var(--accent-muted)] border-[var(--border-active)] scale-105 shadow-xl' : 'opacity-40 border-transparent'}`}>
                    <div className={`w-12 h-12 rounded-full border border-[var(--text-primary)] flex items-center justify-center shrink-0 z-10 transition-colors ${state.simStep === 'JUDGING' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'}`}>
                      <Gavel className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Julgando</span>
                      <span className="text-[9px] text-[var(--text-muted)] uppercase font-mono italic">Magistrado Técnico</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-5 transition-all duration-500 w-full p-4 rounded-sm border ${state.simStep === 'REVIEWING' ? 'bg-[var(--accent-muted)] border-[var(--border-active)] scale-105 shadow-xl' : 'opacity-40 border-transparent'}`}>
                    <div className={`w-12 h-12 rounded-full border border-[var(--text-primary)] flex items-center justify-center shrink-0 z-10 transition-colors ${state.simStep === 'REVIEWING' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'}`}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Revisando</span>
                      <span className="text-[9px] text-[var(--text-muted)] uppercase font-mono italic">Memória & Estratégia</span>
                    </div>
                  </div>
                </div>

                <div className={`transition-all duration-500 ${state.simStep !== 'IDLE' ? 'opacity-100' : 'opacity-0'}`}>
                  <div className="p-4 rounded-sm border" style={{ background: 'color-mix(in srgb, var(--success) 5%, transparent)', borderColor: 'color-mix(in srgb, var(--success) 20%, transparent)' }}>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] leading-relaxed text-center animate-pulse" style={{ color: 'var(--success)' }}>
                      {state.simStep === 'WRITING' && `>> R${state.currentRound}: Redigindo tese jurídica...`}
                      {state.simStep === 'DELIVERING' && `>> R${state.currentRound}: Transmitindo dados...`}
                      {state.simStep === 'JUDGING' && `>> R${state.currentRound}: Avaliando fundamentos...`}
                      {state.simStep === 'REVIEWING' && state.currentRound > 0 && `>> R${state.currentRound}: Processando precedentes...`}
                      {state.simStep === 'REVIEWING' && state.currentRound === 0 && `>> Inicializando Agentes...`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-auto pt-8">
            {/* Contextual Summary for active process */}
            {(state.step === 'simulating' || state.step === 'result') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[var(--text-primary)] p-6 rounded-sm space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.15)] relative overflow-hidden group border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div className="absolute inset-0 -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" style={{ background: 'var(--border)' }}></div>
                <div className="flex justify-between items-center opacity-30">
                  <span className="text-[9px] uppercase tracking-widest font-bold">Resumo do Caso Atual</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-medium opacity-40 uppercase tracking-widest" style={{ color: 'var(--success)' }}>Índice de Força Argumentativa</div>
                  <div className="text-5xl font-serif italic text-[var(--text-primary)]">
                    { (state.simulation?.rounds && state.simulation.rounds.length > 0)
                      ? (() => {
                          const _fp = state.selectedMode === 5 ? (state.mode5Result?.successProbability ?? 0) : (state.simulation?.finalSuccessProbability ?? 0);
                          const _effectiveSide = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
                          if (state.selectedMode === 4 && _effectiveSide === 'DEFENSE') return 100 - _fp;
                          return _fp >= 50 ? _fp : 100 - _fp;
                        })()
                      : "--"
                    }%
                  </div>
                </div>
                <div className="text-[10px] font-mono font-bold border-t pt-4 flex justify-between" style={{ color: 'color-mix(in srgb, var(--success) 60%, transparent)', borderColor: 'var(--border)' }}>
                   <span>SESSÃO: {state.simulation?.lawyerAgentName ? 'SEED_ACTIVE' : 'INITIALIZING'}</span>
                   <span>VEREDITO: {state.step === 'result' ? 'CONCLUÍDO' : 'PENDENTE'}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Forge Monitor Overlay */}
      <AnimatePresence>
        {state.showForgeMonitor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[var(--bg-primary)]/95 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <div className="w-full max-w-6xl h-full flex flex-col gap-8">
              <div className="flex justify-between items-end border-b border-[var(--border)] pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                    <h2 className="text-2xl font-serif italic text-[var(--text-primary)]">Central de Monitoramento de Agentes de IA</h2>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.4em] font-bold">Central de Monitoramento · EAI?</p>
                </div>
                <button
                  onClick={() => setState(prev => ({ ...prev, showForgeMonitor: false }))}
                  className="px-6 py-2 border border-[var(--border-active)] text-[10px] uppercase font-bold tracking-widest hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
                >
                  Fechar Dashboard
                </button>
              </div>

              <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
                {/* Metrics */}
                <div className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-6 space-y-4">
                    <div className="flex items-center gap-2 text-[var(--success)]">
                      <Activity className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Agentes em Ação</span>
                    </div>
                    <div className="text-4xl font-serif italic text-[var(--text-primary)]">{state.activeAgents.length}</div>
                    <div className="text-[9px] text-[var(--text-muted)] leading-relaxed uppercase font-bold tracking-tighter">
                      Instâncias processando tokens judiciais em tempo real
                    </div>
                  </div>

                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-6 space-y-4">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Database className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Simulações por Área</span>
                    </div>
                    <div className="text-4xl font-serif italic text-[var(--text-secondary)]">
                      {state.regionalStats.reduce((acc, s) => acc + s.seeds, 0)}
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)] leading-relaxed uppercase font-bold tracking-tighter">
                      Total de simulações indexadas por área jurídica
                    </div>
                  </div>

                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-6 space-y-4">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <History className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Sessões Totais</span>
                    </div>
                    <div className="text-4xl font-serif italic text-[var(--text-secondary)]">{globalStats.simulations.toLocaleString()}</div>
                    <div className="text-[9px] text-[var(--text-muted)] leading-relaxed uppercase font-bold tracking-tighter">
                      Cargas de treinamento processadas desde a v1.0
                    </div>
                  </div>
                </div>

                {/* Regional Grid */}
                <div className="col-span-12 lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4 h-fit overflow-y-auto pr-2 max-h-full custom-scrollbar">
                  {(() => {
                    const maxSeeds = Math.max(...state.regionalStats.map(r => r.seeds), 1);
                    return state.regionalStats.map((reg, i) => (
                    <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] p-5 space-y-4 relative group">
                      <div className="absolute top-2 right-4 text-[8px] font-mono opacity-20 italic">REG_{i+1}</div>
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-[var(--text-secondary)]">{reg.region}</div>
                        <div className="h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(reg.seeds / maxSeeds) * 100}%` }}
                            className="h-full"
                            style={{ background: 'color-mix(in srgb, var(--success) 50%, transparent)' }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <div className="flex flex-col">
                          <span className="text-[var(--text-muted)] uppercase tracking-tighter">Simulações</span>
                          <span className="text-[var(--text-secondary)]">{reg.seeds}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[var(--text-muted)] uppercase tracking-tighter">Vitórias</span>
                          <span className="text-[var(--success)]">{reg.active}</span>
                        </div>
                      </div>
                    </div>
                  ));
                  })()}
                </div>

                {/* Execution Log */}
                <div className="col-span-12 lg:col-span-3 border-l border-[var(--border)] pl-8 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Live Logs</span>
                    <span className="text-[8px] font-mono text-[var(--success)] animate-pulse">RECORDING...</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 font-mono text-[9px] text-[var(--text-muted)] custom-scrollbar pr-4">
                    {state.activeAgents.map((agent, i) => (
                      <div key={i} className="border-b border-[var(--border)] pb-2">
                        <div className="mb-1" style={{ color: 'color-mix(in srgb, var(--success) 60%, transparent)' }}>[{new Date(agent.activatedAt).toLocaleTimeString()}] INSTANCE_SYNC</div>
                        <div>Target: <span className="text-[var(--text-secondary)]">{agent.name}</span></div>
                        <div>Type: <span className="text-[var(--text-muted)]">{agent.type}</span></div>
                        <div>ID: <span className="text-[var(--text-muted)]">{agent.id}</span></div>
                      </div>
                    ))}
                    {state.activeAgents.length === 0 && (
                      <div className="italic opacity-20">Nenhuma iteração ativa no buffer...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {state.step === 'result' && !state.isUnlocked && (
        <footer className="fixed bottom-0 left-0 w-full min-h-40 border-t border-[var(--border-active)] bg-[var(--bg-primary)] flex items-center z-[100] shadow-[0_-20px_100px_rgba(0,0,0,0.9)] no-print">
          <div className="w-1/2 p-10 border-r border-[var(--border)] hidden md:block overflow-hidden relative">
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 text-[var(--text-muted)]">Preview do Relatório Estratégico</h4>
            <div className="space-y-3 opacity-[0.05]">
              <div className="h-3 bg-[var(--text-primary)] w-full"></div>
              <div className="h-3 bg-[var(--text-primary)] w-5/6"></div>
              <div className="h-3 bg-[var(--text-primary)] w-1/2"></div>
              <div className="h-3 bg-[var(--text-primary)] w-full"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent pointer-events-none"></div>
          </div>
          <div className="flex-1 md:w-1/2 p-10 flex items-center justify-between gap-12">
            <div className="space-y-1 flex-1">
              <h4 className="text-2xl font-serif italic leading-tight text-[var(--text-primary)]">Desbloquear o Laudo Completo</h4>
              <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-widest leading-relaxed">Liberação imediata via cartão. Estratégia técnica detalhada.</p>
              <div className="pt-1">
                {!showPromoInput ? (
                  <button type="button" onClick={() => setShowPromoInput(true)} className="text-[11px] text-[var(--text-secondary)] underline cursor-pointer bg-transparent border-none">
                    Tenho um código promocional
                  </button>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoStatus(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') validatePromoCode(promoCode); }}
                      placeholder="CÓDIGO PROMO"
                      className="flex-1 max-w-[160px] px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-active)] text-[var(--text-primary)] text-[11px] font-semibold tracking-wider uppercase outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => validatePromoCode(promoCode)}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-active)] text-[var(--text-primary)] text-[10px] font-bold tracking-wide cursor-pointer"
                    >
                      {promoLoading ? 'Validando…' : 'Aplicar'}
                    </button>
                  </div>
                )}
                {promoStatus && (
                  <p className="text-[10px] mt-1 font-semibold flex items-center gap-1" style={{ color: promoStatus.valid ? 'var(--success)' : 'var(--danger)' }}>
                    {promoStatus.valid ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {promoStatus.valid ? `${promoStatus.discountLabel}: ${promoStatus.finalAmountFormatted}` : 'Código inválido ou expirado'}
                  </p>
                )}
              </div>
            </div>
            <button
               onClick={handleCheckout}
               className="px-10 py-5 text-[11px] font-bold uppercase tracking-[0.3em] hover:scale-[1.02] transition-transform shrink-0 shadow-2xl shadow-black flex flex-col items-center leading-none"
               style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
            >
              <span>DESBLOQUEAR: {promoStatus?.valid && promoStatus.finalAmountFormatted ? promoStatus.finalAmountFormatted : ([3, 5].includes(state.selectedMode) ? 'R$ 5,90' : 'R$ 9,90')}</span>
              <span className="text-[8px] opacity-40 mt-1">Sessão única</span>
            </button>
          </div>
        </footer>
      )}

      {state.step === 'result' && state.isUnlocked && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none no-print">
           <div className="pointer-events-auto p-1 flex gap-px shadow-[0_0_50px_rgba(0,0,0,0.25)] scale-125 lg:scale-100 border text-[var(--text-primary)]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
             <button
              onClick={() => {
                const btn = document.getElementById('btn-export-pdf');
                if (btn) btn.textContent = 'Gerando...';
                setTimeout(() => {
                  window.print();
                  if (btn) btn.textContent = 'Exportar PDF';
                }, 300);
              }}
              id="btn-export-pdf"
              className="px-10 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-[var(--bg-secondary)]"
             >
                Exportar PDF
             </button>
             <div className="w-px" style={{ background: 'var(--border)' }}></div>
             {user && (
               <>
                 <button
                   onClick={handleOpenChat}
                   className="px-10 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-[var(--bg-secondary)] flex items-center gap-2"
                 >
                   <MessageCircle className="w-3.5 h-3.5" /> Chat
                 </button>
                 <div className="w-px" style={{ background: 'var(--border)' }}></div>
               </>
             )}
             <button
              onClick={() => window.location.reload()}
              className="px-10 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-[var(--bg-secondary)]"
             >
                Reiniciar
             </button>
             <div className="w-px" style={{ background: 'var(--border)' }}></div>
             <a
               href="mailto:suporte@eaijuridico.com.br"
               className="px-10 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-[var(--bg-secondary)]"
             >
               Contato
             </a>
           </div>
        </div>
      )}

        </div>
      )}

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--bg-primary)]/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif italic text-[var(--text-primary)] tracking-tight">Meus Casos</h2>
                  <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-[0.2em] font-bold mt-1">Histórico de simulações processadas</p>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <X className="w-6 h-6 text-[var(--text-muted)]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {userHistory.length === 0 ? (
                  <div className="py-20 text-center">
                    <History className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                    <p className="text-[var(--text-muted)] text-sm italic">Nenhum caso simulado encontrado sob esta credencial.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {userHistory.map((sim: any) => (
                      <button
                        key={sim.id}
                        onClick={() => loadSimulation(sim)}
                        className="w-full text-left p-6 bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--border-active)] hover:bg-[var(--bg-card)] transition-all group relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-5">
                          <div className="max-w-[70%]">
                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] mb-2 block" style={{ color: 'color-mix(in srgb, var(--success) 60%, transparent)' }}>
                              {formatSimDate(sim.createdAt)}
                            </span>
                            <h3 className="text-lg font-serif italic text-[var(--text-secondary)] leading-tight line-clamp-1">
                              {sim.caseSummary || sim.caseDescription}
                            </h3>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-3xl font-mono font-bold text-[var(--text-primary)] tracking-tighter tabular-nums">{sim.finalSuccessProbability}%</span>
                            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[var(--text-muted)]">Probabilidade</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-[0.2em]">
                          <span className="px-2 py-0.5 border border-[var(--border)] bg-[var(--bg-secondary)]">
                            {formatAreaLabel(sim.area) || "Direito Geral"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-3 h-3" style={{ color: 'color-mix(in srgb, var(--success) 50%, transparent)' }} />
                            {sim.rounds?.length || 0} Etapas de Julgamento
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      )}
    </>
  );
}
