import React from 'react';
import { CONFIDENCE_ITEMS } from '../data/marketTicker';
import { useTickerSpeed } from '../hooks/useTickerSpeed';

export const ConfidenceTicker: React.FC = () => {
  const { trackRef, duration } = useTickerSpeed(37);
  const items = [...CONFIDENCE_ITEMS, ...CONFIDENCE_ITEMS];

  return (
    <div className="nv-void nv-ticker-wrap" style={{ padding: '14px 0', borderTop: '1px solid var(--nv-void-line)', borderBottom: '1px solid var(--nv-void-line)' }}>
      <div ref={trackRef} className="nv-ticker-track" style={{ animationDuration: `${duration}s` }} aria-hidden="true">
        {items.map((label, i) => (
          <span
            key={i}
            style={{
              fontFamily: 'var(--nv-mono)',
              fontSize: 11,
              letterSpacing: '0.12em',
              color: 'var(--nv-void-fg-dim)',
              padding: '0 26px',
              borderRight: '1px solid var(--nv-void-line)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <p style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        Base de precedentes cobre TRT, TJPR, STJ, JEC e outros tribunais, mais de 1,9 milhão de precedentes.
      </p>
    </div>
  );
};
