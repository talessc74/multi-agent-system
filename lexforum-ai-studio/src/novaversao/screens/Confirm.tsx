import React from 'react';
import { MODE_CONFIG } from '../../config/modeConfig';
import { Nav } from '../components/Nav';
import type { NvRoute } from '../router';
import type { SimData } from '../simState';
import { formatAreaLabel, AGENT_SPEC_MAP } from '../areaLabels';

interface ConfirmProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (route: NvRoute) => void;
  simData: SimData;
}

const themeColor = (cfg: (typeof MODE_CONFIG)[number], theme: 'dark' | 'light') =>
  theme === 'light' ? cfg.colorLight : cfg.color;

export const ConfirmScreen: React.FC<ConfirmProps> = ({ theme, onToggleTheme, onNavigate, simData }) => {
  const cfg = MODE_CONFIG[simData.mode];
  const color = themeColor(cfg, theme);
  const area = simData.detectedArea ?? 'OTHER';
  const agentSpec = AGENT_SPEC_MAP[area] ?? 'Especializado';

  return (
    <>
      <Nav theme={theme} onToggleTheme={onToggleTheme} onNavigate={onNavigate} />
      <div className="nv-container" style={{ padding: '48px 40px 60px', maxWidth: 680 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${color}`, padding: '7px 14px', marginBottom: 24 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
          <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--nv-ink)' }}>
            {formatAreaLabel(area)}
          </span>
        </div>

        {area === 'OTHER' && (
          <p style={{ fontSize: 13, color: 'var(--nv-red)', background: 'var(--nv-red-soft)', padding: '12px 14px', marginBottom: 20 }}>
            Área jurídica não identificada com precisão. Você pode continuar ou voltar e descrever o caso com mais detalhes.
          </p>
        )}

        <h1 style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 32, color: 'var(--nv-ink)', margin: '0 0 24px' }}>
          O sistema entendeu
          <br />
          sua causa.
        </h1>

        {simData.caseSummary && (
          <div style={{ borderLeft: `3px solid ${color}`, background: 'var(--nv-paper-2)', padding: '24px 26px', marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', margin: '0 0 12px' }}>
              Núcleo central · gerado automaticamente
            </p>
            <p style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontSize: 17, lineHeight: 1.6, color: 'var(--nv-ink)', margin: 0 }}>
              &ldquo;{simData.caseSummary}&rdquo;
            </p>
          </div>
        )}

        {simData.attachmentsUnreadable && (
          <p style={{ fontSize: 13, color: 'var(--nv-red)', background: 'var(--nv-red-soft)', padding: '12px 14px', marginBottom: 20 }}>
            Um ou mais documentos não puderam ser lidos. A análise pode estar incompleta — verifique se o PDF possui texto selecionável.
          </p>
        )}

        <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nv-ink-2)', margin: '32px 0 12px' }}>
          Agentes escalados
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
          <div style={{ borderLeft: `3px solid ${color}`, background: 'var(--nv-paper-2)', padding: 16, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--nv-ink)', margin: '0 0 4px' }}>Advogado</p>
            <p style={{ fontSize: 13, color: 'var(--nv-ink-2)', margin: 0 }}>{agentSpec}</p>
          </div>
          <div style={{ borderLeft: `3px solid ${color}`, background: 'var(--nv-paper-2)', padding: 16, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--nv-ink)', margin: '0 0 4px' }}>Magistrado</p>
            <p style={{ fontSize: 13, color: 'var(--nv-ink-2)', margin: 0 }}>{agentSpec}</p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--nv-line)', paddingTop: 28, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', marginBottom: 16 }}>
            Deseja iniciar o fórum?
          </p>
          <button
            type="button"
            onClick={() => onNavigate({ screen: 'simulating', mode: simData.mode })}
            style={{
              fontFamily: 'var(--nv-mono)',
              fontSize: 13,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'var(--nv-ink)',
              color: 'var(--nv-paper)',
              border: 'none',
              borderRadius: 2,
              padding: '16px 32px',
              cursor: 'pointer',
              marginBottom: 14,
            }}
          >
            Iniciar fórum →
          </button>
          <br />
          <button
            type="button"
            onClick={() => onNavigate({ screen: 'input', mode: simData.mode })}
            style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--nv-ink-3)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
          >
            ← Corrigir causa
          </button>
        </div>
      </div>
    </>
  );
};
