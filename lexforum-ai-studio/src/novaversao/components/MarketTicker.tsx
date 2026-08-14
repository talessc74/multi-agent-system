import React from 'react';
import { MARKET_CASES } from '../data/marketTicker';
import { useTickerSpeed } from '../hooks/useTickerSpeed';

const PX_PER_SECOND = 37; // matched to the confidence ticker — briefing §8.5

export const MarketTicker: React.FC = () => {
  const { trackRef, duration } = useTickerSpeed(PX_PER_SECOND);
  const items = [...MARKET_CASES, ...MARKET_CASES];

  return (
    <div>
      <div className="nv-container" style={{ paddingTop: 24, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px 20px' }}>
        <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nv-ink)', fontWeight: 600 }}>
          O que o EAI? avalia
        </span>
        <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, color: 'var(--nv-ink-3)' }}>
          Exemplos ilustrativos de força argumentativa — não são casos reais de usuários
        </span>
      </div>
      <div className="nv-void nv-ticker-wrap" style={{ marginTop: 18, padding: '14px 0' }}>
        <div
          ref={trackRef}
          className="nv-ticker-track"
          style={{ animationDuration: `${duration}s` }}
          aria-hidden="true"
        >
          {items.map((c, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, padding: '0 22px', borderRight: '1px solid var(--nv-void-line)', whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 11.5, letterSpacing: '0.08em', color: 'var(--nv-void-fg-dim)' }}>{c.categoria}</span>
              <span style={{ fontFamily: 'var(--nv-sans)', fontSize: 11.5, color: 'var(--nv-void-fg)' }}>{c.descricao}</span>
              <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 11.5, fontWeight: 600, color: c.dir === 'up' ? '#5FBF8F' : '#E0755F' }}>
                {c.pct}% {c.dir === 'up' ? '▲' : '▼'}
              </span>
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        Exemplos de áreas avaliadas pelo EAI?: trabalhista, trânsito, consumidor, locação, vizinhança,
        bancário, saúde, família, cível e previdenciário, com índice de força argumentativa entre 42% e 95%.
      </p>
    </div>
  );
};
