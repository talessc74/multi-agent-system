import React from 'react';

interface ModeNavbarProps {
  onBack: () => void;
  modeName: string;
  color: string;
}

export function ModeNavbar({ onBack, modeName, color }: ModeNavbarProps) {
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
    </header>
  );
}
