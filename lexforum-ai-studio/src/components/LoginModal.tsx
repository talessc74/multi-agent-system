import React, { useState } from 'react';
import { getAdditionalUserInfo } from 'firebase/auth';
import { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, logoutUser } from '../lib/firebase';
import { registrarAceiteTermos } from '../services/dbService';
import { X, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'terms-google'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [pendingGoogleUid, setPendingGoogleUid] = useState<string | null>(null);

  const handleClose = async () => {
    if (mode === 'terms-google') {
      try {
        await logoutUser();
      } catch (e) {
        console.error('[LoginModal] logout falhou ao fechar terms-google:', e);
      }
    }
    onClose();
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirm('');
    setError('');
    setResetSent(false);
  };

  const switchMode = (next: 'login' | 'register' | 'forgot') => {
    resetForm();
    setMode(next);
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const credential = await loginWithGoogle();
      const info = getAdditionalUserInfo(credential);
      if (info?.isNewUser) {
        setPendingGoogleUid(credential.user.uid);
        setTermosAceitos(false);
        setMode('terms-google');
      } else {
        onSuccess();
      }
    } catch (e: any) {
      setError(e.message ?? 'Erro ao entrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTermsGoogle = async () => {
    if (!pendingGoogleUid || !termosAceitos) return;
    setError('');
    setLoading(true);
    try {
      await registrarAceiteTermos(pendingGoogleUid);
      onSuccess();
    } catch (e: any) {
      setError(e.message ?? 'Erro ao registrar aceite de termos.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      onSuccess();
    } catch (e: any) {
      setError(e.message ?? 'E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    setLoading(true);
    try {
      const credential = await registerWithEmail(email, password);
      try {
        await registrarAceiteTermos(credential.user.uid);
      } catch (termosErr) {
        console.error('[handleRegister] registrarAceiteTermos falhou:', termosErr);
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message ?? 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-primary)]/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 bg-[var(--bg-card)] border border-[var(--border)] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <h2 className="font-playfair italic text-2xl text-[var(--text-primary)] mb-8">
          {mode === 'login' && 'Acesse o EAI?'}
          {mode === 'register' && 'Crie sua conta'}
          {mode === 'forgot' && 'Recuperar senha'}
          {mode === 'terms-google' && 'Quase lá'}
        </h2>

        {/* Login mode */}
        {mode === 'login' && (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : (
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )
              }
              {loading ? 'Entrando...' : 'Continuar com Google'}
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold">ou</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border border-[var(--border)] px-4 py-3 text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)] transition-colors"
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border border-[var(--border)] px-4 py-3 text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)] transition-colors"
              />

              {error && (
                <p className="text-[10px]" style={{ color: "var(--danger)" }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-colors disabled:opacity-50 mt-1"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                onClick={() => switchMode('forgot')}
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] underline underline-offset-2 transition-colors"
              >
                Esqueci minha senha
              </button>
              <p className="text-[10px] text-[var(--text-muted)]">
                Não tem conta?{' '}
                <button
                  onClick={() => switchMode('register')}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2 transition-colors"
                >
                  Cadastre-se
                </button>
              </p>
            </div>
          </>
        )}

        {/* Forgot mode */}
        {mode === 'forgot' && (
          <>
            {resetSent ? (
              <div className="flex flex-col gap-6">
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
                  Se esse e-mail estiver cadastrado, você receberá um link de recuperação em instantes. Verifique também sua caixa de spam.
                </p>
                <button
                  onClick={() => switchMode('login')}
                  className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-colors"
                >
                  Voltar para o login
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleForgot} className="flex flex-col gap-3">
                  <input
                    type="email"
                    placeholder="E-mail cadastrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent border border-[var(--border)] px-4 py-3 text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)] transition-colors"
                  />
                  {error && (
                    <p className="text-[10px]" style={{ color: "var(--danger)" }}>{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-colors disabled:opacity-50 mt-1"
                  >
                    {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </form>
                <p className="mt-6 text-[10px] text-[var(--text-muted)] text-center">
                  <button
                    onClick={() => switchMode('login')}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2 transition-colors"
                  >
                    Voltar para o login
                  </button>
                </p>
              </>
            )}
          </>
        )}

        {/* Register mode */}
        {mode === 'register' && (
          <>
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border border-[var(--border)] px-4 py-3 text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)] transition-colors"
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border border-[var(--border)] px-4 py-3 text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)] transition-colors"
              />
              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full bg-transparent border border-[var(--border)] px-4 py-3 text-[12px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)] transition-colors"
              />

              {error && (
                <p className="text-[10px]" style={{ color: "var(--danger)" }}>{error}</p>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={termosAceitos}
                  onChange={(e) => setTermosAceitos(e.target.checked)}
                />
                Li e aceito os{' '}
                <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                  Termos de Uso
                </a>
              </label>

              <button
                type="submit"
                disabled={loading || !termosAceitos}
                className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-colors disabled:opacity-50 mt-1"
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>

            <p className="mt-6 text-[10px] text-[var(--text-muted)] text-center">
              Já tem conta?{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2 transition-colors"
              >
                Entre
              </button>
            </p>
          </>
        )}

        {/* Terms acceptance for new Google users */}
        {mode === 'terms-google' && (
          <>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-6">
              Sua conta Google foi criada com sucesso. Para continuar, confirme que leu e aceita nossos termos.
            </p>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '16px' }}>
              <input
                type="checkbox"
                checked={termosAceitos}
                onChange={(e) => setTermosAceitos(e.target.checked)}
              />
              Li e aceito os{' '}
              <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                Termos de Uso
              </a>
            </label>

            {error && (
              <p className="text-[10px] mb-3" style={{ color: "var(--danger)" }}>{error}</p>
            )}

            <button
              onClick={handleAcceptTermsGoogle}
              disabled={loading || !termosAceitos}
              className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[11px] font-bold uppercase tracking-widest py-3 hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Concluir cadastro'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
