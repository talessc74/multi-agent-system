import React from 'react';

interface SessionStatusBarProps {
  area: string;
  statusText: string;
  statusColor: string;
  isComplete?: boolean;
}

export function SessionStatusBar({ area, statusText, statusColor, isComplete = false }: SessionStatusBarProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      background: 'rgba(26,30,38,0.6)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: '12px',
        color: 'var(--text-secondary)',
      }}>
        {area}
      </span>
      <span style={{
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: isComplete ? 'var(--success)' : statusColor,
      }}>
        {statusText}
      </span>
    </div>
  );
}
