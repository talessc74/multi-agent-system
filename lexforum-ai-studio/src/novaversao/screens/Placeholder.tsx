import React from 'react';
import { Nav } from '../components/Nav';
import { NvLink } from '../components/NvLink';
import type { NvRoute } from '../router';
import { MODE_CONFIG } from '../../config/modeConfig';

interface PlaceholderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (route: NvRoute) => void;
  route: Extract<NvRoute, { mode: number }>;
}

const SCREEN_LABEL: Record<string, string> = {
  input: 'Entrada de dados',
  confirm: 'Confirmação',
  simulating: 'Simulando',
  result: 'Resultado',
};

/** Tela ainda não construída nesta fase — ver Tasks #3/#4 do rollout.
 * Existe pra nenhum link do site ficar quebrado enquanto o resto é feito. */
export const PlaceholderScreen: React.FC<PlaceholderProps> = ({ theme, onToggleTheme, onNavigate, route }) => {
  const cfg = MODE_CONFIG[route.mode];
  return (
    <>
      <Nav theme={theme} onToggleTheme={onToggleTheme} onNavigate={onNavigate} />
      <div className="nv-container" style={{ padding: '80px 40px', maxWidth: 640 }}>
        <p className="nv-kicker" style={{ marginBottom: 16 }}>
          Modo {String(route.mode).padStart(2, '0')} · {cfg?.headline}
        </p>
        <h1 style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 32, color: 'var(--nv-ink)', margin: '0 0 16px' }}>
          {SCREEN_LABEL[route.screen] ?? route.screen} ainda em construção.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--nv-ink-2)', lineHeight: 1.6, marginBottom: 28 }}>
          Esta tela faz parte do rollout do redesign V5 e ainda não foi implementada nesta fase.
        </p>
        <NvLink to={{ screen: 'home' }} onNavigate={onNavigate} style={{ fontFamily: 'var(--nv-mono)', fontSize: 12, textDecoration: 'underline', color: 'var(--nv-ink-2)' }}>
          ← Voltar para a home
        </NvLink>
      </div>
    </>
  );
};
