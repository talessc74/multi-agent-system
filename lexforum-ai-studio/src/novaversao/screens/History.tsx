import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { getUserSimulations } from '../../services/dbService';
import { Nav } from '../components/Nav';
import { NvLink } from '../components/NvLink';
import { formatAreaLabel } from '../areaLabels';
import type { NvRoute } from '../router';

interface HistoryProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (route: NvRoute) => void;
  user: User | null;
  onSelect: (sim: any) => void;
}

function formatSimDate(createdAt: unknown): string {
  if (!createdAt) return '—';
  if (typeof createdAt === 'object' && createdAt !== null) {
    if ('toDate' in (createdAt as any)) {
      return (createdAt as any).toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    if ('_seconds' in (createdAt as any)) {
      return new Date((createdAt as any)._seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    }
  }
  const d = new Date(createdAt as string | number);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export const HistoryScreen: React.FC<HistoryProps> = ({ theme, onToggleTheme, onNavigate, user, onSelect }) => {
  const [sims, setSims] = useState<any[] | null>(null);

  useEffect(() => {
    if (!user) {
      setSims([]);
      return;
    }
    let cancelled = false;
    getUserSimulations(user.uid)
      .then((list) => {
        if (!cancelled) setSims(list ?? []);
      })
      .catch((e) => {
        console.error('[History] getUserSimulations falhou:', e);
        if (!cancelled) setSims([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <>
      <Nav theme={theme} onToggleTheme={onToggleTheme} onNavigate={onNavigate} user={user} />
      <div className="nv-container" style={{ padding: '40px 40px 60px', maxWidth: 760 }}>
        <p className="nv-kicker" style={{ marginBottom: 8 }}>Sob esta credencial</p>
        <h1 style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 30, color: 'var(--nv-ink)', margin: '0 0 32px' }}>
          Meus casos
        </h1>

        {!user && (
          <p style={{ fontSize: 14, color: 'var(--nv-ink-2)' }}>
            Faça login para ver seus casos simulados.
          </p>
        )}

        {user && sims === null && (
          <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--nv-ink-3)' }}>
            Carregando…
          </p>
        )}

        {user && sims && sims.length === 0 && (
          <p style={{ fontSize: 14, color: 'var(--nv-ink-3)', fontStyle: 'italic' }}>
            Nenhum caso simulado encontrado sob esta credencial.
          </p>
        )}

        {user && sims && sims.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sims.map((sim) => {
              const pct = sim.mode5Result ? sim.mode5Result.successProbability : sim.finalSuccessProbability;
              return (
                <button
                  key={sim.id}
                  type="button"
                  onClick={() => onSelect(sim)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16,
                    textAlign: 'left',
                    padding: '20px 0',
                    borderBottom: '1px solid var(--nv-line)',
                    background: 'none',
                    border: 'none',
                    borderBottomWidth: 1,
                    borderBottomStyle: 'solid',
                    borderBottomColor: 'var(--nv-line)',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', margin: '0 0 6px' }}>
                      {formatSimDate(sim.createdAt)} · {formatAreaLabel(sim.area ?? 'OTHER')}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--nv-serif)',
                        fontStyle: 'italic',
                        fontSize: 16.5,
                        color: 'var(--nv-ink)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sim.caseSummary || sim.caseDescription}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ display: 'block', fontFamily: 'var(--nv-mono)', fontSize: 20, fontWeight: 700, color: 'var(--nv-ink)' }}>
                      {pct}%
                    </span>
                    <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-ink-3)' }}>
                      Probabilidade
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <NvLink
          to={{ screen: 'home' }}
          onNavigate={onNavigate}
          style={{ display: 'inline-block', marginTop: 32, fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-ink-2)', textDecoration: 'underline' }}
        >
          ← Voltar
        </NvLink>
      </div>
    </>
  );
};
