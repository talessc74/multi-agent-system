import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { MODE_CONFIG } from '../../config/modeConfig';
import { validateCausa } from '../../lib/gemini';
import { Nav } from '../components/Nav';
import { NvLink } from '../components/NvLink';
import type { NvRoute } from '../router';
import type { SimData } from '../simState';
import { filesToAttachments } from '../simState';
import { parseGeminiError } from '../geminiError';
import type { SimError } from '../geminiError';

interface InputProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (route: NvRoute) => void;
  simData: SimData;
  setSimData: React.Dispatch<React.SetStateAction<SimData>>;
  user?: User | null;
}

const themeColor = (cfg: (typeof MODE_CONFIG)[number], theme: 'dark' | 'light') =>
  theme === 'light' ? cfg.colorLight : cfg.color;

export const InputScreen: React.FC<InputProps> = ({ theme, onToggleTheme, onNavigate, simData, setSimData, user }) => {
  const cfg = MODE_CONFIG[simData.mode];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SimError | null>(null);
  const [attError, setAttError] = useState<string | null>(null);
  const [defAttError, setDefAttError] = useState<string | null>(null);
  const color = themeColor(cfg, theme);
  const isDual = cfg.inputType === 'dual';
  const isMode5 = simData.mode === 5;

  const canSubmit = isDual
    ? simData.caseDescription.trim().length >= 10 && simData.defenseDescription.trim().length >= 10
    : simData.caseDescription.trim().length >= 10 && (!isMode5 || simData.mode5SentencaOuProposta.trim().length >= 10);

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      const atts = isMode5 ? simData.attachments : simData.attachments;
      const data = await validateCausa(simData.caseDescription, atts);
      setSimData((prev) => ({
        ...prev,
        detectedArea: data.area || 'OTHER',
        specificJudge: data.specificJudge ?? null,
        caseSummary: data.summary ?? null,
        userPole: data.userPole || 'AUTOR',
        attachmentsUnreadable: atts.length > 0 && data.documentsReadable === false,
      }));
      onNavigate({ screen: 'confirm', mode: simData.mode });
    } catch (err) {
      setError(parseGeminiError(err));
    } finally {
      setLoading(false);
    }
  };

  const onFiles = async (files: FileList | null, which: 'main' | 'defense') => {
    if (!files || files.length === 0) return;
    const existing = which === 'main' ? simData.attachments : simData.defenseAttachments;
    const { attachments, error: err } = await filesToAttachments(files, existing);
    if (which === 'main') {
      setSimData((prev) => ({ ...prev, attachments }));
      setAttError(err);
    } else {
      setSimData((prev) => ({ ...prev, defenseAttachments: attachments }));
      setDefAttError(err);
    }
  };

  return (
    <>
      <Nav theme={theme} onToggleTheme={onToggleTheme} onNavigate={onNavigate} user={user} />

      <div className="nv-container" style={{ padding: '40px 40px 20px', maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-ink-2)' }}>
            {cfg.headline} · {[3, 5].includes(simData.mode) ? 'R$ 5,90' : 'R$ 9,90'}
          </span>
          <span style={{ flex: 1 }} />
          <NvLink to={{ screen: 'home' }} onNavigate={onNavigate} style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, color: 'var(--nv-ink-3)', textDecoration: 'underline' }}>
            Trocar modo
          </NvLink>
        </div>

        <h1 style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 30, color: 'var(--nv-ink)', margin: '0 0 8px' }}>
          {isDual ? 'Traga os dois lados' : 'Conte o que aconteceu'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--nv-ink-2)', lineHeight: 1.6, marginBottom: 24 }}>{cfg.description}</p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {cfg.bring.map((b) => (
            <span
              key={b}
              style={{
                fontFamily: 'var(--nv-mono)',
                fontSize: 10.5,
                letterSpacing: '0.03em',
                color: 'var(--nv-ink-2)',
                border: '1px solid var(--nv-line-2)',
                borderRadius: 2,
                padding: '5px 10px',
              }}
            >
              {b}
            </span>
          ))}
        </div>

        {isMode5 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['RECURSO', 'ACORDO'] as const).map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => setSimData((prev) => ({ ...prev, mode5SubCase: sc }))}
                style={{
                  flex: 1,
                  fontFamily: 'var(--nv-mono)',
                  fontSize: 12,
                  letterSpacing: '0.04em',
                  padding: '12px',
                  border: `1px solid ${simData.mode5SubCase === sc ? color : 'var(--nv-line-2)'}`,
                  background: simData.mode5SubCase === sc ? 'var(--nv-red-soft)' : 'transparent',
                  color: 'var(--nv-ink)',
                  cursor: 'pointer',
                }}
              >
                {sc === 'RECURSO' ? 'Recebi uma decisão' : 'Recebi uma proposta de acordo'}
              </button>
            ))}
          </div>
        )}

        {cfg.hasSelector && cfg.selectorType === 'side' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['AUTHOR', 'DEFENSE'] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setSimData((prev) => ({ ...prev, userSide: side }))}
                style={{
                  flex: 1,
                  fontFamily: 'var(--nv-mono)',
                  fontSize: 12,
                  letterSpacing: '0.04em',
                  padding: '12px',
                  border: `1px solid ${simData.userSide === side ? color : 'var(--nv-line-2)'}`,
                  background: simData.userSide === side ? 'var(--nv-red-soft)' : 'transparent',
                  color: 'var(--nv-ink)',
                  cursor: 'pointer',
                }}
              >
                {side === 'AUTHOR' ? 'Estou do lado do autor' : 'Estou do lado do réu'}
              </button>
            ))}
          </div>
        )}

        <label style={{ display: 'block', fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', marginBottom: 8 }}>
          {isDual ? 'Argumento da acusação' : isMode5 ? 'O que aconteceu' : 'Os fatos'}
        </label>
        <textarea
          value={simData.caseDescription}
          onChange={(e) => setSimData((prev) => ({ ...prev, caseDescription: e.target.value }))}
          placeholder="Descreva com suas próprias palavras — o que aconteceu, quando, e o que você já tentou fazer a respeito."
          rows={7}
          maxLength={4000}
          style={{
            width: '100%',
            fontFamily: 'var(--nv-sans)',
            fontSize: 15,
            lineHeight: 1.6,
            color: 'var(--nv-ink)',
            background: 'var(--nv-paper-2)',
            border: '1px solid var(--nv-line-2)',
            borderRadius: 2,
            padding: 16,
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 9.5, color: 'var(--nv-ink-3)' }}>MÍNIMO DE 10 CARACTERES</span>
          <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 9.5, color: 'var(--nv-ink-3)' }}>{simData.caseDescription.length} / 4000</span>
        </div>

        {isMode5 && (
          <>
            <label style={{ display: 'block', fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', marginBottom: 8 }}>
              {simData.mode5SubCase === 'RECURSO' ? 'Texto da decisão recebida' : 'Texto da proposta de acordo'}
            </label>
            <textarea
              value={simData.mode5SentencaOuProposta}
              onChange={(e) => setSimData((prev) => ({ ...prev, mode5SentencaOuProposta: e.target.value }))}
              rows={5}
              maxLength={4000}
              style={{ width: '100%', fontFamily: 'var(--nv-sans)', fontSize: 15, lineHeight: 1.6, color: 'var(--nv-ink)', background: 'var(--nv-paper-2)', border: '1px solid var(--nv-line-2)', borderRadius: 2, padding: 16, resize: 'vertical', marginBottom: 20 }}
            />
          </>
        )}

        {isDual && (
          <>
            <label style={{ display: 'block', fontFamily: 'var(--nv-mono)', fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', marginBottom: 8 }}>
              Argumento da defesa
            </label>
            <textarea
              value={simData.defenseDescription}
              onChange={(e) => setSimData((prev) => ({ ...prev, defenseDescription: e.target.value }))}
              rows={7}
              maxLength={4000}
              style={{ width: '100%', fontFamily: 'var(--nv-sans)', fontSize: 15, lineHeight: 1.6, color: 'var(--nv-ink)', background: 'var(--nv-paper-2)', border: '1px solid var(--nv-line-2)', borderRadius: 2, padding: 16, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--nv-mono)', fontSize: 9.5, color: 'var(--nv-ink-3)' }}>{simData.defenseDescription.length} / 4000</span>
            </div>
          </>
        )}

        {cfg.hasAttachment && (
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--nv-ink-2)', border: '1px dashed var(--nv-line-2)', display: 'inline-block', padding: '10px 16px', cursor: 'pointer' }}>
              + Anexar documentos
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => onFiles(e.target.files, 'main')} />
            </label>
            <div style={{ fontFamily: 'var(--nv-mono)', fontSize: 9.5, color: 'var(--nv-ink-3)', marginTop: 6 }}>máx 10MB por arquivo · total 20MB · PDF, JPEG ou PNG</div>
            <div style={{ fontFamily: 'var(--nv-mono)', fontSize: 9.5, color: 'var(--nv-ink-3)', marginTop: 2 }}>Texto anonimizado antes do processamento</div>
            {simData.attachments.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {simData.attachments.map((a, i) => (
                  <span key={i} style={{ fontFamily: 'var(--nv-mono)', fontSize: 10, color: 'var(--nv-ink-2)', background: 'var(--nv-paper-2)', padding: '4px 8px' }}>{a.name}</span>
                ))}
              </div>
            )}
            {attError && <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, color: 'var(--nv-red)', marginTop: 6 }}>{attError}</p>}
            {isDual && (
              <>
                <label style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--nv-ink-2)', border: '1px dashed var(--nv-line-2)', display: 'inline-block', padding: '10px 16px', cursor: 'pointer', marginTop: 12 }}>
                  + Anexar documentos de defesa
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => onFiles(e.target.files, 'defense')} />
                </label>
                {defAttError && <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10.5, color: 'var(--nv-red)', marginTop: 6 }}>{defAttError}</p>}
              </>
            )}
          </div>
        )}

        {error && (
          <div style={{ border: `1px solid var(--nv-red)`, background: 'var(--nv-red-soft)', padding: '14px 16px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--nv-ink)', margin: 0 }}>{error.message}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          style={{
            fontFamily: 'var(--nv-mono)',
            fontSize: 13,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            background: canSubmit ? 'var(--nv-ink)' : 'var(--nv-line-2)',
            color: 'var(--nv-paper)',
            border: 'none',
            borderRadius: 2,
            padding: '16px 28px',
            cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Analisando…' : cfg.cta}
        </button>
        <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10, color: 'var(--nv-ink-3)', marginTop: 10, marginBottom: 60 }}>RESULTADO EM 20–60S</p>
      </div>
    </>
  );
};
