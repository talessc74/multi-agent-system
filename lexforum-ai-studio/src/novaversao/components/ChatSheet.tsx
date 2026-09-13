import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../../types';
import type { SheetState } from '../../components/ChatPanel';

interface ChatSheetProps {
  lawyerName: string;
  judgeName: string;
  area: string;
  color: string;
  sheetState: SheetState;
  onSheetChange: (s: SheetState) => void;
  messages: ChatMessage[];
  questionsUsed: number;
  questionsLimit: number;
  error?: string | null;
  onClearError?: () => void;
  isSending: boolean;
  onSend: (agentType: 'lawyer' | 'judge', message: string) => void;
}

const HEIGHTS: Record<SheetState, string> = {
  closed: '0px',
  collapsed: '68px',
  half: '58vh',
  full: '100dvh',
};

/** Mesmo contrato de ChatPanel.tsx (produção), mas na linguagem visual V5 —
 * sem pill bubbles, sem box-shadow, sem border-radius de "card". Traço fino,
 * mono para rótulos, um dossiê de conversa, não um widget de chat de SaaS. */
export function ChatSheet({
  lawyerName, judgeName, area, color,
  sheetState, onSheetChange,
  messages, questionsUsed, questionsLimit,
  isSending, onSend,
  error, onClearError,
}: ChatSheetProps) {
  const [selectedAgent, setSelectedAgent] = useState<'lawyer' | 'judge'>('lawyer');
  const [inputValue, setInputValue] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const questionsRemaining = questionsLimit - questionsUsed;
  const isOpen = sheetState !== 'closed';

  useEffect(() => {
    if (sheetState === 'full' || sheetState === 'half') {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages, sheetState]);

  const handleSend = () => {
    const msg = inputValue.trim();
    if (!msg || isSending || questionsRemaining <= 0) return;
    if (!privacyAccepted && messages.length === 0) {
      setPendingMessage(msg);
      setShowPrivacy(true);
      return;
    }
    onSend(selectedAgent, msg);
    setInputValue('');
  };

  const handlePrivacyAccept = () => {
    setPrivacyAccepted(true);
    setShowPrivacy(false);
    if (pendingMessage) {
      onSend(selectedAgent, pendingMessage);
      setInputValue('');
      setPendingMessage('');
    }
  };

  if (!isOpen) return null;

  const agentDisplayName = selectedAgent === 'lawyer' ? lawyerName : judgeName;

  return (
    <>
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: HEIGHTS[sheetState],
          zIndex: 310,
          background: 'var(--nv-paper)',
          borderTop: '1px solid var(--nv-line-2)',
          display: 'flex', flexDirection: 'column',
          transition: 'height 0.32s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{ flexShrink: 0, padding: '10px 20px 0', cursor: 'pointer' }}
          onClick={() => {
            if (sheetState === 'collapsed') onSheetChange('half');
            else if (sheetState === 'half') onSheetChange('full');
          }}
        >
          <div style={{ width: 32, height: 3, background: 'var(--nv-line-2)', margin: '0 auto 10px' }} />

          {sheetState === 'collapsed' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 }}>
              <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--nv-ink)' }}>
                Falar com os agentes
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: questionsLimit }).map((_, i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < questionsRemaining ? color : 'var(--nv-line-2)' }} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10 }}>
              <div>
                <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', margin: 0 }}>{area}</p>
                <p style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--nv-ink)', margin: '2px 0 0' }}>Falar com os agentes</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({ length: questionsLimit }).map((_, i) => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < questionsRemaining ? color : 'var(--nv-line-2)' }} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onSheetChange('closed'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--nv-ink-3)', fontFamily: 'var(--nv-mono)', fontSize: 16, lineHeight: 1 }}
                  aria-label="Fechar chat"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {sheetState !== 'collapsed' && (
          <>
            <div style={{ display: 'flex', gap: 8, padding: '0 20px 12px', flexShrink: 0 }}>
              {([['lawyer', lawyerName], ['judge', judgeName]] as const).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedAgent(type)}
                  style={{
                    padding: '6px 12px',
                    border: `1px solid ${selectedAgent === type ? color : 'var(--nv-line-2)'}`,
                    background: selectedAgent === type ? 'var(--nv-red-soft)' : 'transparent',
                    color: selectedAgent === type ? 'var(--nv-ink)' : 'var(--nv-ink-3)',
                    fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.03em', fontWeight: 600,
                    cursor: 'pointer',
                    maxWidth: '48%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--nv-line)', flexShrink: 0 }} />
          </>
        )}

        {sheetState !== 'collapsed' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--nv-red)', background: 'var(--nv-red-soft)', padding: '10px 14px', flexShrink: 0 }}>
                <span style={{ fontSize: 12.5, color: 'var(--nv-ink)', flex: 1 }}>{error}</span>
                {onClearError && (
                  <button type="button" onClick={onClearError} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nv-ink-3)', padding: '0 0 0 10px' }}>
                    ×
                  </button>
                )}
              </div>
            )}

            {messages.length === 0 && !isSending && questionsRemaining > 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontSize: 13, color: 'var(--nv-ink-2)', margin: '0 0 4px' }}>
                  Tire dúvidas sobre o caso com {agentDisplayName}.
                </p>
                <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, color: 'var(--nv-ink-3)', margin: 0 }}>
                  {questionsRemaining} {questionsRemaining === 1 ? 'pergunta restante' : 'perguntas restantes'}
                </p>
              </div>
            )}

            {questionsRemaining === 0 && messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontSize: 13, color: 'var(--nv-ink-3)', margin: 0 }}>Limite de perguntas atingido para esta sessão.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
                {msg.role === 'agent' && (
                  <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 9.5, fontWeight: 600, color: 'var(--nv-ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {msg.agentName}
                  </span>
                )}
                <div
                  style={{
                    maxWidth: '85%',
                    padding: msg.role === 'user' ? '10px 14px' : '0',
                    borderLeft: msg.role === 'agent' ? `2px solid ${color}` : 'none',
                    paddingLeft: msg.role === 'agent' ? 12 : undefined,
                    border: msg.role === 'user' ? '1px solid var(--nv-line-2)' : undefined,
                    background: msg.role === 'user' ? 'var(--nv-paper-2)' : 'transparent',
                    color: 'var(--nv-ink)',
                    fontSize: 13.5, lineHeight: 1.6,
                  }}
                >
                  {msg.role === 'agent'
                    ? <ReactMarkdown
                        components={{
                          p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
                          strong: ({ children }) => <strong style={{ color: 'var(--nv-ink)' }}>{children}</strong>,
                          h3: ({ children }) => <p style={{ margin: '8px 0 4px', fontWeight: 700, color: 'var(--nv-ink)' }}>{children}</p>,
                          ul: ({ children }) => <ul style={{ paddingLeft: 16, margin: '4px 0' }}>{children}</ul>,
                          li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                        }}
                      >{msg.content}</ReactMarkdown>
                    : msg.content}
                </div>
              </div>
            ))}

            {isSending && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 9.5, fontWeight: 600, color: 'var(--nv-ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {agentDisplayName}
                </span>
                <div style={{ borderLeft: `2px solid ${color}`, paddingLeft: 12, display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map((j) => (
                    <span key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--nv-ink-3)', animation: `nv-chat-dot 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {sheetState !== 'collapsed' && (
          <div style={{ flexShrink: 0, padding: '10px 16px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--nv-line)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => { if (sheetState === 'half') onSheetChange('full'); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={questionsRemaining > 0 ? `Pergunta para ${agentDisplayName}…` : 'Limite atingido'}
              disabled={questionsRemaining <= 0 || isSending}
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--nv-paper-2)', border: '1px solid var(--nv-line-2)',
                color: 'var(--nv-ink)', fontSize: 14, outline: 'none',
                opacity: questionsRemaining <= 0 ? 0.5 : 1,
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending || questionsRemaining <= 0}
              style={{
                fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600,
                padding: '10px 16px', flexShrink: 0, border: 'none', cursor: 'pointer',
                background: inputValue.trim() && !isSending && questionsRemaining > 0 ? 'var(--nv-ink)' : 'var(--nv-line-2)',
                color: 'var(--nv-paper)',
              }}
            >
              Enviar
            </button>
          </div>
        )}
      </div>

      {showPrivacy && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'color-mix(in srgb, var(--nv-void) 55%, transparent)', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: 'var(--nv-paper)', borderTop: '1px solid var(--nv-line-2)', padding: '24px 20px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
            <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', margin: '0 0 12px' }}>
              Aviso de privacidade — chat
            </p>
            <p style={{ fontSize: 13.5, color: 'var(--nv-ink-2)', lineHeight: 1.65, margin: '0 0 20px' }}>
              Suas mensagens são processadas pelo Gemini e anonimizadas antes de serem armazenadas. Este chat é uma simulação educativa — não substitui orientação jurídica profissional.
            </p>
            <button
              type="button"
              onClick={handlePrivacyAccept}
              style={{ width: '100%', padding: 14, background: 'var(--nv-ink)', color: 'var(--nv-paper)', border: 'none', fontFamily: 'var(--nv-mono)', fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}
            >
              Entendi, enviar pergunta
            </button>
            <button
              type="button"
              onClick={() => setShowPrivacy(false)}
              style={{ width: '100%', padding: 12, background: 'transparent', border: '1px solid var(--nv-line-2)', color: 'var(--nv-ink-3)', fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes nv-chat-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
