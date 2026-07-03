import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  ShieldCheck,
  Gavel,
  Scale,
  History,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import LoginModal from '../components/LoginModal';
import { MODE_CONFIG, type ModeConfig } from '../config/modeConfig';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onEnter: (mode: number) => void;
  onLogout: () => void;
  onShowHistory: () => void;
  user: import('firebase/auth').User | null;
}

// ADR-007: o painel desktop lê tagline/description/bring/receive/cta do
// MODE_CONFIG (mesma fonte que o mobile já usava) — não duplica mais o
// conteúdo dos modos em um array separado.
const MODE_ICONS: Record<number, typeof FileText> = {
  1: FileText, 2: ShieldCheck, 3: Gavel, 4: Scale, 5: History,
};
const MODE_PRICES: Record<number, string> = {
  1: 'R$ 9,90', 2: 'R$ 9,90', 3: 'R$ 5,90', 4: 'R$ 9,90', 5: 'R$ 5,90',
};
const MODE_IDS = [1, 2, 3, 4, 5];

const MOBILE_MODES = [
  { mode: 1, Icon: FileText,    price: 'R$ 9,90' },
  { mode: 2, Icon: ShieldCheck, price: 'R$ 9,90' },
  { mode: 3, Icon: Gavel,       price: 'R$ 5,90' },
  { mode: 4, Icon: Scale,       price: 'R$ 9,90' },
  { mode: 5, Icon: History,     price: 'R$ 5,90' },
];

const FLOW_STEPS = [
  'Peticionando — Advogado Especializado',
  'Protocolando — Barramento Digital',
  'Julgando — Magistrado Técnico',
  'Revisando — Memória & Estratégia',
];

const FOOTER_STATS = [
  { label: 'Base de dados', value: '1.9M+ Precedentes Injetados' },
  { label: 'Processamento', value: 'Análise Semântica Multimodal' },
  { label: 'Privacidade', value: 'Criptografia RSA-4096' },
  { label: 'Versão', value: `v2.4.0 · ${import.meta.env.VITE_GIT_HASH || 'dev'}` },
  { label: 'Contato', value: 'suporte@eaijuridico.com.br' },
];

export default function BoardroomPage({ onEnter, onLogout, onShowHistory, user }: Props) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [openMode, setOpenMode] = useState<number | null>(null);
  const [desktopMode, setDesktopMode] = useState<number>(1);
  const { theme } = useTheme();
  // A cor de marca de cada modo (cfg.color) foi calibrada só para fundo escuro
  // (ex.: o ciano do Modo 1 cai para ~1.14:1 de contraste no claro). No claro,
  // usamos a variante escurecida (colorLight/colorRgbLight, ~4.5:1).
  const modeColor = (cfg: ModeConfig) => (theme === 'light' ? cfg.colorLight : cfg.color);
  const modeColorRgb = (cfg: ModeConfig) => (theme === 'light' ? cfg.colorRgbLight : cfg.colorRgb);

  return (
    <div className="min-h-screen overflow-x-hidden selection:bg-amber-400/20" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar
        user={user}
        onLogin={() => setShowLoginModal(true)}
        onLogout={onLogout}
        onShowHistory={onShowHistory}
      />

      {/* ── MOBILE HOME ───────────────────────────────────────── */}
      <div className="md:hidden flex flex-col min-h-screen px-6 pt-16 pb-8">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] mb-6" style={{ color: 'var(--text-muted)' }}>
          SIMULADOR JURÍDICO
        </span>

        <h1 className="font-playfair italic text-[44px] leading-tight" style={{ color: 'var(--text-primary)' }}>
          A incerteza jurídica tem uma saída.
        </h1>

        <p className="text-[15px] mt-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Antes do tribunal, o teste.
        </p>

        <div className="mt-10 flex flex-col" style={{ gap: '12px' }}>
          {MOBILE_MODES.map(({ mode, Icon, price }) => {
            const cfg = MODE_CONFIG[mode];
            const isOpen = openMode === mode;
            return (
              <div key={mode} style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Header */}
                <button
                  onClick={() => setOpenMode(isOpen ? null : mode)}
                  className="w-full flex items-center gap-3 text-left"
                  style={{ padding: '20px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: '32px', height: '32px', background: `rgba(${modeColorRgb(cfg)}, 0.12)`, borderRadius: '8px' }}
                  >
                    <Icon style={{ width: '16px', height: '16px', color: modeColor(cfg) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{cfg.headline}</p>
                  </div>
                  <ChevronDown
                    style={{ width: '18px', height: '18px', color: 'var(--text-secondary)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  />
                </button>
                {/* Expanded */}
                {isOpen && (
                  <div style={{ padding: '0 20px 20px' }}>
                    <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {cfg.description}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: modeColor(cfg) }}>
                      Ideal para: <span className="normal-case font-normal tracking-normal">{cfg.tagline}</span>
                    </p>
                    <p className="text-[13px] font-mono mb-3" style={{ color: modeColor(cfg) }}>{price}</p>
                    <button
                      onClick={() => onEnter(mode)}
                      className="w-full font-bold text-[13px] flex items-center justify-center"
                      style={{ height: '48px', background: cfg.color, color: '#0A1628', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                    >
                      Começar →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-8 text-center space-y-1">
          <p className="text-[9px] uppercase tracking-[0.2em] mt-1" style={{ color: 'var(--text-muted)' }}>
            Não é consulta jurídica · Não garante vitória
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Simulação gratuita · Laudo completo R$9,90
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em] mt-1" style={{ color: 'var(--text-muted)' }}>
            {`v2.4.0 · ${import.meta.env.VITE_GIT_HASH || 'dev'}`}
          </p>
          <a href="/termos" className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Termos de Uso
          </a>
        </div>
      </div>

      {/* ── DESKTOP CONTENT ─────────────────────────────────────── */}
      <div className="hidden md:block" id="modos">

        {/* Page content */}
        <div>

          {/* Hero */}
        <section className="px-6 md:px-12 lg:px-20 pt-20 pb-12 max-w-6xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="font-playfair italic text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-10" style={{ color: 'var(--text-primary)' }}
          >
            A incerteza jurídica agora tem<br className="hidden md:block" /> uma arena de testes.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] max-w-xl leading-relaxed" style={{ color: 'var(--text-muted)' }}
          >
            ANTES DO TRIBUNAL, O TESTE.
          </motion.p>
        </section>

        {/* Disclaimer */}
        <div className="px-6 md:px-12 lg:px-20 mb-10 max-w-6xl mx-auto">
          <div className="border-l-2 border-amber-400/25 pl-4 py-1">
            <p className="text-[9px] uppercase tracking-[0.22em] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              O EAI? É UMA FERRAMENTA DE APOIO ANALÍTICO BASEADA EM MODELOS DE LINGUAGEM AVANÇADOS.
              NÃO SUBSTITUI O ACONSELHAMENTO JURÍDICO PROFISSIONAL.
            </p>
          </div>
        </div>

        {/* Mode Selector — lista + painel de detalhe (ADR-007) */}
        <section className="px-6 md:px-12 lg:px-20 pb-16 max-w-6xl mx-auto">
          <div className="grid grid-cols-12 gap-4 lg:gap-8">
            {/* Lista de modos */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-2">
              {MODE_IDS.map((mode, i) => {
                const cfg = MODE_CONFIG[mode];
                const Icon = MODE_ICONS[mode];
                const isSelected = desktopMode === mode;
                return (
                  <motion.button
                    key={mode}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.06 * i }}
                    onClick={() => setDesktopMode(mode)}
                    className="flex items-center gap-4 p-4 text-left border transition-all duration-200 rounded-xl"
                    style={{
                      borderColor: isSelected ? modeColor(cfg) : 'var(--border)',
                      background: isSelected ? `rgba(${modeColorRgb(cfg)},0.06)` : 'var(--bg-card)',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      className="w-9 h-9 flex items-center justify-center flex-shrink-0 border transition-colors duration-200 rounded-lg"
                      style={{ borderColor: isSelected ? modeColor(cfg) : 'var(--border)' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: isSelected ? modeColor(cfg) : 'var(--text-muted)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-[11px] font-bold uppercase tracking-[0.18em] leading-none mb-1 transition-colors duration-200"
                        style={{ color: isSelected ? modeColor(cfg) : 'var(--text-primary)' }}
                      >
                        {cfg.headline}
                      </h3>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{MODE_PRICES[mode]}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Painel de detalhe do modo selecionado */}
            <div className="col-span-12 lg:col-span-8">
              {(() => {
                const cfg = MODE_CONFIG[desktopMode];
                return (
                  <motion.div
                    key={desktopMode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    aria-live="polite"
                    className="border p-6 md:p-8 h-full flex flex-col rounded-xl"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: modeColor(cfg) }}>
                      {cfg.tagline}
                    </p>
                    <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
                      {cfg.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--text-muted)' }}>
                          O que trazer
                        </p>
                        <ul className="space-y-2">
                          {cfg.bring.map((item) => (
                            <li key={item} className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--text-muted)' }}>
                          O que você recebe
                        </p>
                        <ul className="space-y-2">
                          {cfg.receive.map((item) => (
                            <li key={item} className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4">
                      <span className="text-sm font-mono" style={{ color: modeColor(cfg) }}>{MODE_PRICES[desktopMode]}</span>
                      <button
                        onClick={() => onEnter(desktopMode)}
                        className="flex items-center gap-2 px-6 py-3 font-bold text-[11px] uppercase tracking-[0.2em] rounded-xl"
                        style={{ background: cfg.color, color: '#0A1628', border: 'none', cursor: 'pointer' }}
                      >
                        {cfg.cta}
                      </button>
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          </div>
        </section>

        {/* Technical Footer */}
        <div className="border-t border-white/[0.05]">
          <div className="px-6 md:px-12 lg:px-20 py-8 max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {FOOTER_STATS.map(({ label, value }) => (
                <div key={label} className="space-y-1.5">
                  <p className="text-[8px] uppercase tracking-[0.25em] font-bold" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="text-[9px] font-mono leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <a href="/termos" className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: 'var(--text-muted)' }}>
                Termos de Uso
              </a>
            </div>
          </div>
        </div>

        {/* Boardroom Panel */}
        <div className="border-t border-white/[0.05]" style={{ background: 'var(--bg-secondary)' }}>
          <div className="px-6 md:px-12 lg:px-20 py-12 max-w-6xl mx-auto">
            <p className="text-[8px] uppercase tracking-[0.4em] font-bold mb-10" style={{ color: 'var(--text-muted)' }}>
              PAINEL BOARDROOM
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Status Info */}
              <div className="space-y-0">
                {[
                  { label: 'Área identificada', value: 'Geral / Outros' },
                  { label: 'Foro/Comarca', value: 'Justiça Comum / JEC' },
                  { label: 'Agentes ativados', value: 'Aguardando ativação de agentes...' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-white/[0.05] gap-1"
                  >
                    <span className="text-[9px] uppercase tracking-[0.22em] font-bold" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Flow Steps */}
              <div>
                <p className="text-[8px] uppercase tracking-[0.3em] font-bold mb-6" style={{ color: 'var(--text-muted)' }}>
                  FLUXO ESTRATÉGICO
                </p>
                <div className="space-y-4">
                  {FLOW_STEPS.map((step, i) => (
                    <motion.div
                      key={step}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0.2 }}
                      animate={{ opacity: [0.2, 0.8, 0.2] }}
                      transition={{
                        duration: 2.8,
                        delay: i * 0.6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <ArrowRight className="w-3 h-3 text-amber-400/50 flex-shrink-0" />
                      <span className="text-[9px] uppercase tracking-[0.18em] font-medium" style={{ color: 'var(--text-muted)' }}>
                        {step}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      </div>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}
