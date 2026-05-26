import React from 'react';

interface ContextZoneProps {
  color: string;
  colorRgb: string;
  description: string;
  bring: string[];
  receive: string[];
}

export function ContextZone({ color, colorRgb, description, bring, receive }: ContextZoneProps) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${color}`,
        background: `rgba(${colorRgb}, 0.04)`,
        padding: '20px 24px',
        marginBottom: '20px',
      }}
    >
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '13px',
          lineHeight: '1.65',
          marginBottom: '20px',
        }}
      >
        {description}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <p
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: color,
              marginBottom: '10px',
            }}
          >
            O que trazer
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {bring.map((item, i) => (
              <li
                key={i}
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  padding: '4px 0',
                  borderBottom: i < bring.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: color,
              marginBottom: '10px',
            }}
          >
            O que receber
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {receive.map((item, i) => (
              <li
                key={i}
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  padding: '4px 0',
                  borderBottom: i < receive.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
