import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginModal from '../components/LoginModal';

vi.mock('../lib/firebase', () => ({
  loginWithGoogle: vi.fn(),
  loginWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  resetPassword: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock('../services/dbService', () => ({
  registrarAceiteTermos: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAdditionalUserInfo: vi.fn(),
}));

import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
} from '../lib/firebase';
import { registrarAceiteTermos } from '../services/dbService';
import { getAdditionalUserInfo } from 'firebase/auth';

const onClose = vi.fn();
const onSuccess = vi.fn();

const renderModal = () =>
  render(<LoginModal onClose={onClose} onSuccess={onSuccess} />);

beforeEach(() => vi.clearAllMocks());

// ─── SV-R2 ───────────────────────────────────────────────────────────────────

describe('SV-R2 — fechar modal em terms-google', () => {
  async function chegar_em_terms_google() {
    vi.mocked(loginWithGoogle).mockResolvedValue({ user: { uid: 'uid-novo' } } as any);
    vi.mocked(getAdditionalUserInfo).mockReturnValue({ isNewUser: true } as any);
    renderModal();
    await userEvent.click(screen.getByText('Continuar com Google'));
    await screen.findByText('Quase lá');
  }

  it('chama logoutUser ao fechar via botão X', async () => {
    await chegar_em_terms_google();
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(logoutUser).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('chama logoutUser ao fechar via backdrop', async () => {
    await chegar_em_terms_google();
    await userEvent.click(document.querySelector('.fixed.inset-0')!);
    expect(logoutUser).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('NÃO chama logoutUser ao fechar em modo login', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(logoutUser).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ─── Fluxo Google OAuth ───────────────────────────────────────────────────────

describe('fluxo Google OAuth', () => {
  it('redireciona usuário NOVO para terms-google', async () => {
    vi.mocked(loginWithGoogle).mockResolvedValue({ user: { uid: 'uid-novo' } } as any);
    vi.mocked(getAdditionalUserInfo).mockReturnValue({ isNewUser: true } as any);

    renderModal();
    await userEvent.click(screen.getByText('Continuar com Google'));

    expect(await screen.findByText('Quase lá')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('chama onSuccess diretamente para usuário EXISTENTE', async () => {
    vi.mocked(loginWithGoogle).mockResolvedValue({ user: { uid: 'uid-existente' } } as any);
    vi.mocked(getAdditionalUserInfo).mockReturnValue({ isNewUser: false } as any);

    renderModal();
    await userEvent.click(screen.getByText('Continuar com Google'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(registrarAceiteTermos).not.toHaveBeenCalled();
  });

  it('botão Concluir desabilitado enquanto termos não aceitos', async () => {
    vi.mocked(loginWithGoogle).mockResolvedValue({ user: { uid: 'uid-novo' } } as any);
    vi.mocked(getAdditionalUserInfo).mockReturnValue({ isNewUser: true } as any);

    renderModal();
    await userEvent.click(screen.getByText('Continuar com Google'));
    await screen.findByText('Quase lá');

    expect(screen.getByRole('button', { name: /concluir cadastro/i })).toBeDisabled();
  });

  it('aceitar termos → registrarAceiteTermos + onSuccess', async () => {
    vi.mocked(loginWithGoogle).mockResolvedValue({ user: { uid: 'uid-novo' } } as any);
    vi.mocked(getAdditionalUserInfo).mockReturnValue({ isNewUser: true } as any);
    vi.mocked(registrarAceiteTermos).mockResolvedValue(undefined);

    renderModal();
    await userEvent.click(screen.getByText('Continuar com Google'));
    await screen.findByText('Quase lá');

    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /concluir cadastro/i }));

    await waitFor(() => {
      expect(registrarAceiteTermos).toHaveBeenCalledWith('uid-novo');
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });
});

// ─── Registro por e-mail ──────────────────────────────────────────────────────

describe('registro por e-mail', () => {
  const irParaRegistro = async () => {
    renderModal();
    await userEvent.click(screen.getByText('Cadastre-se'));
  };

  it('botão Criar conta desabilitado sem aceite dos termos', async () => {
    await irParaRegistro();
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeDisabled();
  });

  it('exibe erro quando senhas não conferem', async () => {
    await irParaRegistro();
    await userEvent.type(screen.getByPlaceholderText('E-mail'), 'a@a.com');
    await userEvent.type(screen.getByPlaceholderText('Senha'), 'abc123');
    await userEvent.type(screen.getByPlaceholderText('Confirmar senha'), 'diferente');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText('As senhas não conferem.')).toBeInTheDocument();
    expect(registerWithEmail).not.toHaveBeenCalled();
  });

  it('chama onSuccess mesmo se registrarAceiteTermos falhar (SV-R3)', async () => {
    vi.mocked(registerWithEmail).mockResolvedValue({ user: { uid: 'uid-reg' } } as any);
    vi.mocked(registrarAceiteTermos).mockRejectedValue(new Error('Firestore indisponível'));

    await irParaRegistro();
    await userEvent.type(screen.getByPlaceholderText('E-mail'), 'novo@teste.com');
    await userEvent.type(screen.getByPlaceholderText('Senha'), 'senha123');
    await userEvent.type(screen.getByPlaceholderText('Confirmar senha'), 'senha123');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(screen.queryByText(/erro ao criar conta/i)).not.toBeInTheDocument();
  });

  it('cria conta e registra aceite ao submeter corretamente', async () => {
    vi.mocked(registerWithEmail).mockResolvedValue({ user: { uid: 'uid-reg' } } as any);
    vi.mocked(registrarAceiteTermos).mockResolvedValue(undefined);

    await irParaRegistro();
    await userEvent.type(screen.getByPlaceholderText('E-mail'), 'novo@teste.com');
    await userEvent.type(screen.getByPlaceholderText('Senha'), 'senha123');
    await userEvent.type(screen.getByPlaceholderText('Confirmar senha'), 'senha123');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(registerWithEmail).toHaveBeenCalledWith('novo@teste.com', 'senha123');
      expect(registrarAceiteTermos).toHaveBeenCalledWith('uid-reg');
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });
});

// ─── Login por e-mail ─────────────────────────────────────────────────────────

describe('login por e-mail', () => {
  it('chama loginWithEmail e onSuccess ao submeter', async () => {
    vi.mocked(loginWithEmail).mockResolvedValue(undefined as any);

    renderModal();
    await userEvent.type(screen.getByPlaceholderText('E-mail'), 'user@teste.com');
    await userEvent.type(screen.getByPlaceholderText('Senha'), 'minhasenha');
    await userEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      expect(loginWithEmail).toHaveBeenCalledWith('user@teste.com', 'minhasenha');
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it('exibe erro quando loginWithEmail rejeita', async () => {
    vi.mocked(loginWithEmail).mockRejectedValue(new Error('Credenciais inválidas.'));

    renderModal();
    await userEvent.type(screen.getByPlaceholderText('E-mail'), 'x@x.com');
    await userEvent.type(screen.getByPlaceholderText('Senha'), 'errada');
    await userEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    expect(await screen.findByText('Credenciais inválidas.')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
