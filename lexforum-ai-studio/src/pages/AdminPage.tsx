import React, { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, logoutUser } from '../lib/firebase';
import LoginModal from '../components/LoginModal';

interface AdminUser {
  uid: string;
  email: string | null;
  accessLevel: string;
  createdAt: string | null;
}

interface AdminSimulation {
  id: string;
  userId: string | null;
  area: string | null;
  selectedMode: number | null;
  finalSuccessProbability: number | null;
  isWin: boolean | null;
  createdAt: string | null;
}

interface Overview {
  users: AdminUser[];
  stats: { totalSimulations: number; totalWins: number; winRate: number };
  simulations: AdminSimulation[];
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', padding: '32px 24px 80px' } as React.CSSProperties,
  inner: { maxWidth: '1100px', margin: '0 auto' } as React.CSSProperties,
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '4px' } as React.CSSProperties,
  subtitle: { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px' } as React.CSSProperties,
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '40px' } as React.CSSProperties,
  kpiCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '18px' } as React.CSSProperties,
  kpiLabel: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '8px' },
  kpiValue: { fontSize: '28px', fontWeight: 700, fontFamily: 'monospace' } as React.CSSProperties,
  sectionTitle: { fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '14px', marginTop: '40px' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px' },
  th: { textAlign: 'left' as const, padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' },
  td: { padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' } as React.CSSProperties,
  badge: (bg: string) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: bg } as React.CSSProperties),
  button: { padding: '5px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '6px', border: '1px solid var(--border-active)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' } as React.CSSProperties,
  centerBox: { maxWidth: '420px', margin: '120px auto', textAlign: 'center' as const },
};

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [status, setStatus] = useState<'loading' | 'denied' | 'ok' | 'error'>('loading');
  const [data, setData] = useState<Overview | null>(null);
  const [promotingUid, setPromotingUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthResolved(true);
    });
    return unsub;
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setStatus('loading');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403 || res.status === 401) {
        setStatus('denied');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const json = await res.json();
      setData(json);
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const togglePlan = async (target: AdminUser) => {
    if (!user) return;
    const nextLevel = target.accessLevel === 'beta' ? 'free' : 'beta';
    setPromotingUid(target.uid);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/admin/users/${target.uid}/access-level`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accessLevel: nextLevel }),
      });
      await load();
    } finally {
      setPromotingUid(null);
    }
  };

  if (!authResolved) {
    return <div style={s.page} />;
  }

  if (!user) {
    return (
      <div style={s.page}>
        <div style={s.centerBox}>
          <p style={{ ...s.subtitle, marginBottom: '16px' }}>Painel Administrativo</p>
          <button style={s.button} onClick={() => setShowLoginModal(true)}>Entrar</button>
        </div>
        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} onSuccess={() => setShowLoginModal(false)} />
        )}
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div style={s.page}>
        <div style={s.centerBox}>
          <p style={s.title}>Acesso negado</p>
          <p style={s.subtitle}>{user.email} não tem permissão de administrador.</p>
          <button style={s.button} onClick={() => logoutUser()}>Sair</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={s.title}>Painel Administrativo</h1>
            <p style={s.subtitle}>Logado como {user.email}</p>
          </div>
          <button style={s.button} onClick={() => logoutUser()}>Sair</button>
        </div>

        {status === 'loading' && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Carregando…</p>}
        {status === 'error' && <p style={{ color: 'var(--danger)', fontSize: '13px' }}>Erro ao carregar dados.</p>}

        {status === 'ok' && data && (
          <>
            <div style={s.kpiRow}>
              <div style={s.kpiCard}>
                <div style={s.kpiLabel}>Usuários cadastrados</div>
                <div style={s.kpiValue}>{data.users.length}</div>
              </div>
              <div style={s.kpiCard}>
                <div style={s.kpiLabel}>Simulações concluídas</div>
                <div style={s.kpiValue}>{data.stats.totalSimulations.toLocaleString()}</div>
              </div>
              <div style={s.kpiCard}>
                <div style={s.kpiLabel}>Taxa de vitória</div>
                <div style={{ ...s.kpiValue, color: 'var(--success)' }}>{data.stats.winRate}%</div>
              </div>
              <div style={s.kpiCard}>
                <div style={s.kpiLabel}>Usuários beta</div>
                <div style={s.kpiValue}>{data.users.filter(u => u.accessLevel === 'beta').length}</div>
              </div>
            </div>

            <h2 style={s.sectionTitle}>Usuários ({data.users.length})</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>E-mail</th>
                    <th style={s.th}>Plano</th>
                    <th style={s.th}>Cadastrado em</th>
                    <th style={s.th}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map(u => (
                    <tr key={u.uid}>
                      <td style={s.td}>{u.email ?? u.uid}</td>
                      <td style={s.td}>
                        <span style={s.badge(u.accessLevel === 'beta' ? 'color-mix(in srgb, var(--success) 20%, transparent)' : 'var(--bg-secondary)')}>
                          {u.accessLevel}
                        </span>
                      </td>
                      <td style={s.td}>{formatDate(u.createdAt)}</td>
                      <td style={s.td}>
                        <button
                          style={s.button}
                          disabled={promotingUid === u.uid}
                          onClick={() => togglePlan(u)}
                        >
                          {promotingUid === u.uid ? '...' : u.accessLevel === 'beta' ? 'Rebaixar a Free' : 'Promover a Beta'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 style={s.sectionTitle}>Últimas simulações ({data.simulations.length})</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Data</th>
                    <th style={s.th}>Área</th>
                    <th style={s.th}>Modo</th>
                    <th style={s.th}>Probabilidade</th>
                    <th style={s.th}>Resultado</th>
                    <th style={s.th}>Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  {data.simulations.map(sim => (
                    <tr key={sim.id}>
                      <td style={s.td}>{formatDate(sim.createdAt)}</td>
                      <td style={s.td}>{sim.area ?? '—'}</td>
                      <td style={s.td}>{sim.selectedMode ?? '—'}</td>
                      <td style={s.td}>{sim.finalSuccessProbability != null ? `${sim.finalSuccessProbability}%` : '—'}</td>
                      <td style={s.td}>
                        <span style={{ color: sim.isWin ? 'var(--success)' : 'var(--danger)' }}>
                          {sim.isWin === null ? '—' : sim.isWin ? 'Ganhou' : 'Perdeu'}
                        </span>
                      </td>
                      <td style={s.td}>{sim.userId ? sim.userId.slice(0, 10) + '…' : 'Anônimo'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
