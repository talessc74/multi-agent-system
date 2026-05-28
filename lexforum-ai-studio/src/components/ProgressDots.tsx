import React from 'react';

const STEP_LABELS = ['Peticionando', 'Protocolando', 'Julgando', 'Revisando'];

interface ProgressDotsProps {
  currentStep: 0 | 1 | 2 | 3;
  modeColor: string;
}

export function ProgressDots({ currentStep, modeColor }: ProgressDotsProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 20px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
      gap: '6px',
    }}>
      {STEP_LABELS.map((label, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;

        return (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              flexShrink: 0,
              transform: isActive ? 'scale(1.3)' : 'scale(1)',
              transition: 'transform 0.2s ease, background 0.2s ease',
              background: isActive
                ? modeColor
                : isDone
                  ? 'rgba(255,255,255,0.25)'
                  : 'var(--bg-card)',
              border: isActive
                ? `1.5px solid ${modeColor}`
                : isDone
                  ? 'none'
                  : '1.5px solid var(--border)',
            }} />
            {index < STEP_LABELS.length - 1 && (
              <div style={{
                width: '16px',
                height: '1px',
                background: isDone ? 'rgba(255,255,255,0.15)' : 'var(--border)',
                flexShrink: 0,
              }} />
            )}
          </div>
        );
      })}
      <span style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        marginLeft: '10px',
      }}>
        {STEP_LABELS[currentStep]}
      </span>
    </div>
  );
}
