import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { NvRoute } from '../router';
import { NvLink } from './NvLink';

interface NavProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (route: NvRoute) => void;
  user?: User | null;
  onRequireLogin: () => void;
}

export const Nav: React.FC<NavProps> = ({ theme, onToggleTheme, onNavigate, user, onRequireLogin }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--nv-paper)',
        borderBottom: scrolled ? '1px solid var(--nv-line)' : '1px solid transparent',
        transition: 'padding 0.2s ease',
      }}
    >
      <div
        className="nv-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: scrolled ? '13px 40px' : '20px 40px',
          transition: 'padding 0.2s ease',
        }}
      >
        <NvLink to={{ screen: 'home' }} onNavigate={onNavigate} style={{ textDecoration: 'none' }}>
          <span
            style={{
              fontFamily: 'var(--nv-serif)',
              fontStyle: 'normal',
              fontWeight: 700,
              fontSize: scrolled ? 17 : 20,
              color: 'var(--nv-ink)',
              transition: 'font-size 0.2s ease',
            }}
          >
            EAI<em style={{ fontStyle: 'italic', color: 'var(--nv-red)' }}>✓?</em>
          </span>
        </NvLink>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* Meus casos — sempre visível; abre login se não autenticado
              (mesmo contrato de src/components/Navbar.tsx, o header da
              versão anterior) */}
          {user ? (
            <NvLink
              to={{ screen: 'history' }}
              onNavigate={onNavigate}
              style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-ink-2)', textDecoration: 'none' }}
            >
              Meus casos
            </NvLink>
          ) : (
            <button
              type="button"
              onClick={onRequireLogin}
              style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'transparent', border: 'none', padding: 0, color: 'var(--nv-ink-3)', cursor: 'pointer' }}
            >
              Meus casos
            </button>
          )}
          {!user && (
            <button
              type="button"
              onClick={onRequireLogin}
              style={{
                fontFamily: 'var(--nv-mono)',
                fontSize: 10.5,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'transparent',
                border: '1px solid var(--nv-line-2)',
                borderRadius: 3,
                padding: '7px 12px',
                color: 'var(--nv-ink)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Entrar
            </button>
          )}
          <button
            type="button"
            onClick={onToggleTheme}
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Alternar tema claro/escuro"
            style={{
              fontFamily: 'var(--nv-mono)',
              fontSize: 10.5,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'transparent',
              border: '1px solid var(--nv-line-2)',
              borderRadius: 3,
              padding: '7px 12px',
              color: 'var(--nv-ink-2)',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? 'Escuro' : 'Claro'}
          </button>
        </div>
      </div>
    </nav>
  );
};
