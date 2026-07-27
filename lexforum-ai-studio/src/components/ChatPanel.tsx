import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Send, MessageCircle } from 'lucide-react';
import type { ChatMessage } from '../types';
import { useTheme } from '../hooks/useTheme';

export type SheetState = 'closed' | 'collapsed' | 'half' | 'full';

interface Props {
  lawyerName: string;
  judgeName: string;
  area: string;
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
  collapsed: '78px',
  half: '58vh',
  full: '100dvh',
};

const DOT_COLOR = 'var(--accent)';

export default function ChatPanel({
  lawyerName, judgeName, area,
  sheetState, onSheetChange,
  messages, questionsUsed, questionsLimit,
  isSending, onSend,
  error, onClearError,
}: Props) {
  const { theme } = useTheme();
  const onAccentText = theme === 'light' ? '#FFFFFF' : '#000000';
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
      {/* Sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: HEIGHTS[sheetState],
          zIndex: 310,
          background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border)',
          borderRadius: sheetState === 'full' ? '0' : '20px 20px 0 0',
          display: 'flex', flexDirection: 'column',
          transition: 'height 0.32s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle + header */}
        <div
          style={{ flexShrink: 0, padding: '10px 16px 0', cursor: 'pointer' }}
          onClick={() => {
            if (sheetState === 'collapsed') onSheetChange('half');
            else if (sheetState === 'half') onSheetChange('full');
          }}
        >
          <div style={{ width: '36px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0 auto 10px' }} />

          {/* Collapsed */}
          {sheetState === 'collapsed' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={16} style={{ color: DOT_COLOR }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Falar com os agentes
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: questionsLimit }).map((_, i) => (
                  <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: i < questionsRemaining ? DOT_COLOR : 'var(--border)', transition: 'background 0.2s' }} />
                ))}
              </div>
            </div>
          )}

          {/* Half / Full */}
          {sheetState !== 'collapsed' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px' }}>
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>{area}</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>Falar com os agentes</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: questionsLimit }).map((_, i) => (
                    <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: i < questionsRemaining ? DOT_COLOR : 'var(--border)', transition: 'background 0.2s' }} />
                  ))}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onSheetChange('closed'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)', display: 'flex' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Agent chips */}
        {sheetState !== 'collapsed' && (
          <div style={{ display: 'flex', gap: '8px', padding: '0 16px 10px', flexShrink: 0 }}>
            {([['lawyer', lawyerName], ['judge', judgeName]] as const).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setSelectedAgent(type)}
                style={{
                  padding: '7px 14px',
                  border: `1px solid ${selectedAgent === type ? DOT_COLOR : 'var(--border)'}`,
                  borderRadius: '20px',
                  background: selectedAgent === type ? 'var(--accent-muted)' : 'transparent',
                  color: selectedAgent === type ? DOT_COLOR : 'var(--text-muted)',
                  fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  maxWidth: '48%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {sheetState !== 'collapsed' && <div style={{ height: '1px', background: 'var(--border)', flexShrink: 0 }} />}

        {/* Messages */}
        {sheetState !== 'collapsed' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
            {/* Error banner */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '10px',
                background: 'color-mix(in srgb, var(--danger) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '13px', color: 'var(--danger)', flex: 1 }}>{error}</span>
                {onClearError && (
                  <button onClick={onClearError} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0 0 0 10px', display: 'flex' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {messages.length === 0 && !isSending && questionsRemaining > 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <MessageCircle size={22} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                <p style={{ fontSize: '13px', margin: '0 0 4px' }}>
                  Tire dúvidas sobre o caso com {agentDisplayName}.
                </p>
                <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>
                  {questionsRemaining} {questionsRemaining === 1 ? 'pergunta restante' : 'perguntas restantes'}
                </p>
              </div>
            )}

            {questionsRemaining === 0 && messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <MessageCircle size={22} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                <p style={{ fontSize: '13px', margin: 0 }}>Limite de perguntas atingido para esta sessão.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                {msg.role === 'agent' && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {msg.agentName}
                  </span>
                )}
                <div style={{
                  maxWidth: '85%', padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? DOT_COLOR : 'var(--bg-card)',
                  color: msg.role === 'user' ? onAccentText : 'var(--text-secondary)',
                  fontSize: '14px', lineHeight: 1.55,
                  border: msg.role === 'agent' ? '1px solid var(--border)' : 'none',
                }}>
                  {msg.role === 'agent'
                    ? <ReactMarkdown
                        components={{
                          p: ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
                          strong: ({ children }) => <strong style={{ color: 'var(--text-primary)' }}>{children}</strong>,
                          h3: ({ children }) => <p style={{ margin: '8px 0 4px', fontWeight: 700, color: 'var(--text-primary)' }}>{children}</p>,
                          ul: ({ children }) => <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>{children}</ul>,
                          li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                        }}
                      >{msg.content}</ReactMarkdown>
                    : msg.content
                  }
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isSending && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {agentDisplayName}
                </span>
                <div style={{ padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 1, 2].map((j) => (
                    <div key={j} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: `chatDot 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        {sheetState !== 'collapsed' && (
          <div style={{
            flexShrink: 0, padding: '10px 12px',
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
            background: 'var(--bg-primary)', borderTop: '1px solid var(--border)',
            display: 'flex', gap: '8px', alignItems: 'center',
          }}>
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => { if (sheetState === 'half') onSheetChange('full'); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={questionsRemaining > 0 ? `Pergunta para ${agentDisplayName}...` : 'Limite atingido'}
              disabled={questionsRemaining <= 0 || isSending}
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '22px', color: 'var(--text-primary)',
                fontSize: '14px', outline: 'none',
                opacity: questionsRemaining <= 0 ? 0.5 : 1,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending || questionsRemaining <= 0}
              style={{
                width: '40px', height: '40px', flexShrink: 0,
                borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: inputValue.trim() && !isSending && questionsRemaining > 0 ? DOT_COLOR : 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <Send size={16} style={{ color: inputValue.trim() && !isSending && questionsRemaining > 0 ? onAccentText : 'var(--text-muted)' }} />
            </button>
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      {showPrivacy && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'color-mix(in srgb, var(--bg-primary) 75%, transparent)', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', padding: '24px 20px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Aviso de privacidade: Chat
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '20px' }}>
              Suas mensagens são processadas pelo Gemini e anonimizadas antes de serem armazenadas. Este chat é uma simulação educativa — não substitui orientação jurídica profissional.
            </p>
            <button onClick={handlePrivacyAccept} style={{ width: '100%', padding: '14px', background: DOT_COLOR, color: onAccentText, border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginBottom: '10px' }}>
              Entendi, enviar pergunta
            </button>
            <button onClick={() => setShowPrivacy(false)} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '12px', fontSize: '13px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Keyframe for typing dots */}
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
