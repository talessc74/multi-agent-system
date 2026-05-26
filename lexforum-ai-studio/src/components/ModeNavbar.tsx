import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface ModeNavbarProps {
  onBack: () => void;
  modeName: string;
  color: string;
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

export function ModeNavbar({ onBack, modeName, color }: ModeNavbarProps) {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <header
      style={{
        height: '56px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
      }}
    >
      <button
        onClick={onBack}
        aria-label="Voltar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          minHeight: '44px',
          padding: '0 4px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        ← Voltar
      </button>

      <span
        style={{
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: color,
          border: `1px solid ${color}`,
          padding: '3px 8px',
        }}
      >
        {modeName}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={toggle}
          aria-label="Alternar tema"
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            borderRadius: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {isLight ? <MoonIcon /> : <SunIcon />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            className="font-playfair"
            style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}
          >
            EAI
          </span>
          <span
            className="font-playfair"
            style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}
          >
            ✓?
          </span>
        </div>
      </div>
    </header>
  );
}
