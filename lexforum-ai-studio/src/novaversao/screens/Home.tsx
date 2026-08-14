import React, { useEffect, useRef, useState } from 'react';
import { MODE_CONFIG } from '../../config/modeConfig';
import { getStats } from '../../services/dbService';
import type { GlobalStats } from '../../services/dbService';
import { Nav } from '../components/Nav';
import { MarketTicker } from '../components/MarketTicker';
import { ConfidenceTicker } from '../components/ConfidenceTicker';
import { CountUp } from '../components/CountUp';
import { NvLink } from '../components/NvLink';
import type { NvRoute } from '../router';

interface HomeProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (route: NvRoute) => void;
}

const themeColor = (cfg: (typeof MODE_CONFIG)[number], theme: 'dark' | 'light') =>
  theme === 'light' ? cfg.colorLight : cfg.color;

// Modos agrupados por situação do usuário — herdado da V2, ver briefing §7.1.4
const MODE_GROUPS: { label: string; modes: number[] }[] = [
  { label: 'Você está em um conflito em aberto', modes: [1, 2] },
  { label: 'Você já tem os dois lados prontos', modes: [3, 4] },
  { label: 'Já existe uma decisão ou proposta', modes: [5] },
];

const priceFor = (mode: number) => ([3, 5].includes(mode) ? 'R$ 5,90' : 'R$ 9,90');

const STEPS = [
  {
    n: '01',
    title: 'Conte o que aconteceu',
    sub: 'Com suas palavras — fatos, contexto e documentos, se tiver.',
    body: 'O sistema lê sua descrição como um advogado leria o relato de um cliente na primeira reunião.',
  },
  {
    n: '02',
    title: 'A IA simula os dois lados',
    sub: 'Um agente peticiona, outro julga.',
    body: 'Sem enrolação, sem parcialidade — o mesmo confronto de teses que aconteceria numa audiência real.',
  },
  {
    n: '03',
    title: 'Veja sua chance real',
    sub: 'Probabilidade de êxito, fundamentos e próximos passos.',
    body: 'Um número, não um palpite — com a jurisprudência que sustenta ele.',
  },
];

export const HomeScreen: React.FC<HomeProps> = ({ theme, onToggleTheme, onNavigate }) => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cancelled = false;
    getStats()
      .then((s) => {
        if (!cancelled && s) setStats(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = ghostRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onScroll = () => {
      el.style.transform = `translateY(${Math.min(window.scrollY * 0.15, 60)}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <Nav theme={theme} onToggleTheme={onToggleTheme} onNavigate={onNavigate} />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <header className="nv-void" style={{ position: 'relative', overflow: 'hidden', padding: '72px 0 64px' }}>
        <span
          ref={ghostRef}
          aria-hidden="true"
          className="nv-hero-ghost"
          style={{
            position: 'absolute',
            right: '-4%',
            top: '8%',
            fontFamily: 'var(--nv-serif)',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 'clamp(160px, 28vw, 420px)',
            lineHeight: 1,
            color: 'var(--nv-void-fg)',
            opacity: 0.08,
            userSelect: 'none',
            animation: 'nv-ghost-breathe 7s ease-in-out infinite',
          }}
        >
          78%
        </span>
        <div className="nv-container nv-hero-grid" style={{ position: 'relative' }}>
          <div>
            <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nv-red)', marginBottom: 20 }}>
              — Processo Nº EAI/2026 — Simulação jurídica com IA
            </p>
            <h1 style={{ fontFamily: 'var(--nv-serif)', fontWeight: 600, fontSize: 'clamp(40px, 7vw, 84px)', lineHeight: 1.02, letterSpacing: '-0.01em', color: 'var(--nv-void-fg)', margin: 0 }}>
              Antes do
              <br />
              tribunal,
              <br />
              <em style={{ fontStyle: 'italic', color: 'var(--nv-red)', fontWeight: 500 }}>o teste.</em>
            </h1>
          </div>
          <div className="nv-hero-side">
            <p style={{ fontFamily: 'var(--nv-sans)', fontSize: 15, lineHeight: 1.6, color: 'var(--nv-void-fg-dim)', margin: '0 0 20px' }}>
              Dois agentes de IA simulam sua causa — um peticiona, outro julga. Você descobre sua chance real em
              minutos.
            </p>
            <a
              href="#modos"
              style={{
                fontFamily: 'var(--nv-mono)',
                fontSize: 13,
                letterSpacing: '0.04em',
                color: 'var(--nv-void-fg)',
                textDecoration: 'underline',
                textUnderlineOffset: 4,
              }}
            >
              Começar simulação →
            </a>
          </div>
        </div>
      </header>

      <style>{`@keyframes nv-ghost-breathe { 0%, 100% { opacity: 0.055; } 50% { opacity: 0.1; } }`}</style>

      {/* ── TICKER DE CASOS ──────────────────────────────────────── */}
      <MarketTicker />

      {/* ── DISCLAIMER ───────────────────────────────────────────── */}
      <div className="nv-container" style={{ padding: '28px 40px' }}>
        <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', lineHeight: 1.7, border: '1px solid var(--nv-line)', padding: '16px 18px', margin: 0 }}>
          O EAI? é uma ferramenta de apoio analítico baseada em modelos de linguagem avançados. Não substitui o
          aconselhamento jurídico profissional. Não garante resultado judicial.
        </p>
      </div>

      {/* ── COMO FUNCIONA ────────────────────────────────────────── */}
      <section className="nv-container" style={{ padding: '56px 40px' }}>
        <h2 style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 28, color: 'var(--nv-ink)', margin: '0 0 40px' }}>
          Como funciona
        </h2>
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            style={{
              marginLeft: i * 36,
              paddingTop: i === 0 ? 0 : 28,
              paddingBottom: 28,
              borderTop: i === 0 ? 'none' : '1px solid var(--nv-line)',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 24,
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--nv-serif)',
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: 36 + i * 16,
                color: i === 2 ? 'var(--nv-red)' : 'var(--nv-ink-3)',
                lineHeight: 1,
              }}
            >
              {s.n}
            </span>
            <div style={{ maxWidth: '52ch' }}>
              <h3 style={{ fontFamily: 'var(--nv-sans)', fontWeight: 700, fontSize: 18, color: 'var(--nv-ink)', margin: '0 0 4px' }}>{s.title}</h3>
              <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.03em', color: 'var(--nv-ink-3)', margin: '0 0 10px' }}>{s.sub}</p>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--nv-ink-2)', margin: 0 }}>{s.body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── ESCOLHA SEU MODO ─────────────────────────────────────── */}
      <section id="modos" className="nv-container" style={{ padding: '32px 40px 56px' }}>
        <h2 style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 28, color: 'var(--nv-ink)', margin: '0 0 32px' }}>
          Escolha seu modo
        </h2>
        {MODE_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 36 }}>
            <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', marginBottom: 8, borderBottom: '1px solid var(--nv-line)', paddingBottom: 10 }}>
              {group.label}
            </p>
            {group.modes.map((modeId, gi) => {
              const cfg = MODE_CONFIG[modeId];
              const first = gi === 0;
              return (
                <NvLink
                  key={modeId}
                  to={{ screen: 'input', mode: modeId }}
                  onNavigate={onNavigate}
                  aria-label={`${cfg.headline} — ${cfg.tagline} — ${priceFor(modeId)}`}
                  className="nv-mode-row"
                  style={{
                    padding: first ? '22px 0' : '15px 0',
                    borderBottom: '1px solid var(--nv-line)',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <span className="nv-mode-idx" style={{ fontFamily: 'var(--nv-mono)', fontSize: first ? 15 : 12, color: 'var(--nv-ink-3)' }}>
                    {String(modeId).padStart(2, '0')}
                  </span>
                  <span className="nv-mode-name">
                    <span style={{ display: 'block', fontFamily: 'var(--nv-sans)', fontWeight: 700, fontSize: first ? 20 : 16, color: 'var(--nv-ink)' }}>
                      {cfg.headline}
                    </span>
                    <span style={{ display: 'block', fontSize: 12.5, color: 'var(--nv-ink-3)', marginTop: 2 }}>{cfg.tagline}</span>
                  </span>
                  <span className="nv-mode-price" style={{ fontFamily: 'var(--nv-mono)', fontSize: 13, color: 'var(--nv-ink-2)' }}>{priceFor(modeId)}</span>
                  <span className="nv-mode-cta" style={{ fontFamily: 'var(--nv-mono)', fontSize: 12, letterSpacing: '0.03em', color: themeColor(cfg, theme), textAlign: 'right' }}>
                    {cfg.cta}
                  </span>
                </NvLink>
              );
            })}
          </div>
        ))}
      </section>

      <ConfidenceTicker />

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="nv-void">
        <div className="nv-container nv-stats-grid" style={{ padding: '56px 40px' }}>
          <div>
            <span style={{ display: 'block', fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 600, fontSize: 44, color: 'var(--nv-void-fg)' }}>
              <CountUp value={stats?.totalSimulations ?? 0} />
            </span>
            <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-void-fg-dim)' }}>
              Simulações realizadas
            </span>
          </div>
          <div style={{ marginTop: 28 }}>
            <span style={{ display: 'block', fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 600, fontSize: 30, color: 'var(--nv-void-fg)' }}>
              <CountUp value={stats?.winRate ?? 0} decimals={0} suffix="%" />
            </span>
            <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-void-fg-dim)' }}>
              Taxa de êxito estimada
            </span>
          </div>
          <div style={{ marginTop: 28 }}>
            <span style={{ display: 'block', fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 600, fontSize: 30, color: 'var(--nv-void-fg)' }}>
              RSA-4096
            </span>
            <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-void-fg-dim)' }}>
              Privacidade · dados não vendidos
            </span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="nv-container" style={{ padding: '40px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'normal', fontWeight: 700, fontSize: 15, color: 'var(--nv-ink)' }}>
          EAI<em style={{ fontStyle: 'italic', color: 'var(--nv-red)' }}>✓?</em>
        </span>
        <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, color: 'var(--nv-ink-3)' }}>
          © {new Date().getFullYear()} EAI? — Rádio Kactus
        </span>
      </footer>
    </>
  );
};
