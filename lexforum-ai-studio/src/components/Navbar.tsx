import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { History } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface NavbarProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onShowHistory: () => void;
  className?: string;
  children?: React.ReactNode;
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Navbar({ user, onLogin, onLogout, onShowHistory, className = '', children }: NavbarProps) {
  const { theme, toggle } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isLight = theme === 'light';

  const navBg = isLight ? 'rgba(245, 243, 238, 0.92)' : 'rgba(10, 12, 15, 0.90)';
  const navBorder = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.07)';
  const textPrimary = isLight ? '#0A1628' : '#F0F2F5';
  const textMuted = isLight ? 'rgba(10, 22, 40, 0.55)' : 'rgba(240, 242, 245, 0.5)';
  const accentGlyph = isLight ? '#0A1628' : '#00FFEF';
  const menuBg = isLight ? '#FFFFFF' : '#1A1E26';

  useEffect(() => {
    if (!showUserMenu) return;
    const close = () => setShowUserMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showUserMenu]);

  return (
    <header
      className={`sticky top-0 z-50 no-print ${className}`}
      style={{
        height: '56px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: navBg,
        borderBottom: `1px solid ${navBorder}`,
      }}
    >
      <div className="h-full px-4 md:px-8 flex items-center justify-between">

        {/* Logo */}
        <div
          className="flex items-center cursor-pointer select-none"
          onClick={() => window.location.reload()}
          aria-label="EAI? — início"
        >
          <span
            className="font-playfair leading-none"
            style={{ fontSize: '21px', fontWeight: 700, color: textPrimary }}
          >
            EAI
          </span>
          <span
            className="font-playfair leading-none"
            style={{ fontSize: '21px', fontWeight: 700, color: accentGlyph }}
          >
            ✓?
          </span>
        </div>

        {/* Desktop-only slot (Forge Monitor, status, Nova Consulta, etc.) */}
        {children && (
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {children}
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center" style={{ gap: '4px' }}>

          {/* Meus Casos — logged-in only */}
          {user && (
            <button
              onClick={onShowHistory}
              aria-label="Meus Casos"
              className="flex items-center gap-2 transition-opacity hover:opacity-100"
              style={{
                minWidth: '44px',
                minHeight: '44px',
                padding: '0 8px',
                color: textMuted,
                opacity: 0.8,
              }}
            >
              <History className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">
                Meus Casos
              </span>
            </button>
          )}

          {/* Theme toggle — 36×36px touch area */}
          <button
            onClick={toggle}
            aria-label="Alternar tema"
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textMuted,
              borderRadius: '4px',
              flexShrink: 0,
            }}
          >
            {isLight ? <MoonIcon /> : <SunIcon />}
          </button>

          {/* User dropdown or Entrar */}
          {user ? (
            <div className="relative">
              <div
                className="flex items-center gap-2 cursor-pointer"
                style={{ minHeight: '44px', padding: '0 4px' }}
                onClick={(e) => { e.stopPropagation(); setShowUserMenu(prev => !prev); }}
              >
                <div
                  className="w-6 h-6 rounded-full overflow-hidden shrink-0"
                  style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                >
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
                  }
                </div>
                <span
                  className="hidden md:inline text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: textMuted }}
                >
                  {user.displayName?.split(' ')[0]}
                </span>
              </div>
              {showUserMenu && (
                <div
                  className="absolute right-0 top-10 flex flex-col shadow-xl z-50"
                  style={{
                    minWidth: '120px',
                    background: menuBg,
                    border: `1px solid ${navBorder}`,
                  }}
                >
                  <button
                    onClick={() => { onLogout(); setShowUserMenu(false); }}
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors text-left"
                    style={{ color: textMuted }}
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="text-[10px] font-bold uppercase tracking-widest transition-colors"
              style={{
                minWidth: '44px',
                minHeight: '44px',
                padding: '0 12px',
                border: `1px solid ${isLight ? 'rgba(10,22,40,0.4)' : 'rgba(255,255,255,0.3)'}`,
                color: isLight ? '#0A1628' : 'rgba(240,242,245,0.85)',
              }}
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
