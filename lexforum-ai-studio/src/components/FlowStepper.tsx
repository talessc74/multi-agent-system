import React from 'react';

const FLOW_STEPS = [
  { key: 'input',   label: 'Descreva' },
  { key: 'confirm', label: 'Confirme' },
  { key: 'simulate', label: 'Simule'  },
];

const STEP_INDEX: Record<string, number> = {
  input:      0,
  confirm:    1,
  simulating: 2,
  result:     2,
};

interface FlowStepperProps {
  currentStep: 'input' | 'confirm' | 'simulating' | 'result';
  modeColor: string;
  /** 'bar' = barra cheia (mobile, entre Navbar e conteúdo)
   *  'inline' = discreta dentro do conteúdo (desktop) */
  variant?: 'bar' | 'inline';
}

export function FlowStepper({ currentStep, modeColor, variant = 'bar' }: FlowStepperProps) {
  const active = STEP_INDEX[currentStep] ?? 0;

  if (variant === 'inline') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
        {FLOW_STEPS.map((step, i) => {
          const isActive = i === active;
          const isDone   = i < active;
          return (
            <React.Fragment key={step.key}>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: isActive ? modeColor
                     : isDone   ? 'rgba(255,255,255,0.28)'
                                : 'rgba(255,255,255,0.12)',
                transition: 'color 0.2s ease',
              }}>
                {step.label}
              </span>
              {i < FLOW_STEPS.length - 1 && (
                <span style={{
                  fontSize: '10px',
                  color: isDone ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                  transition: 'color 0.2s ease',
                }}>
                  →
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // variant === 'bar' (default — mobile)
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '10px 20px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
      gap: 0,
    }}>
      {FLOW_STEPS.map((step, i) => {
        const isActive = i === active;
        const isDone   = i < active;
        return (
          <React.Fragment key={step.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                flexShrink: 0,
                transform: isActive ? 'scale(1.35)' : 'scale(1)',
                transition: 'transform 0.2s ease, background 0.2s ease',
                background: isActive ? modeColor
                          : isDone   ? 'rgba(255,255,255,0.28)'
                                     : 'var(--bg-card)',
                border: isActive ? `1.5px solid ${modeColor}`
                      : isDone   ? 'none'
                                 : '1.5px solid var(--border)',
              }} />
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isActive ? modeColor
                     : isDone   ? 'rgba(255,255,255,0.28)'
                                : 'var(--text-muted)',
                transition: 'color 0.2s ease',
              }}>
                {step.label}
              </span>
            </div>
            {i < FLOW_STEPS.length - 1 && (
              <div style={{
                width: '20px',
                height: '1px',
                background: i < active ? 'rgba(255,255,255,0.14)' : 'var(--border)',
                margin: '0 8px',
                flexShrink: 0,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
