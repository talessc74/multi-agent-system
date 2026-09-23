import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Nav } from '../novaversao/components/Nav';

// Regressão: o Nav do V5 escondia "Meus casos" inteiramente quando
// deslogado e não tinha nenhum jeito de logar pela home — um usuário
// recorrente sem sessão ativa ficava sem porta de entrada (ver
// src/components/Navbar.tsx, o header da versão anterior, que sempre
// resolveu isso: "Meus Casos" sempre visível + botão "Entrar" próprio).

describe('Nav (V5)', () => {
  it('sem usuário logado, mostra "Entrar" e "Meus casos" aciona login', async () => {
    const onRequireLogin = vi.fn();
    const user = userEvent.setup();

    render(
      <Nav theme="light" onToggleTheme={() => {}} onNavigate={() => {}} user={null} onRequireLogin={onRequireLogin} />
    );

    const entrar = screen.getByRole('button', { name: /entrar/i });
    await user.click(entrar);
    expect(onRequireLogin).toHaveBeenCalledTimes(1);

    const meusCasos = screen.getByRole('button', { name: /meus casos/i });
    await user.click(meusCasos);
    expect(onRequireLogin).toHaveBeenCalledTimes(2);
  });

  it('com usuário logado, não mostra "Entrar" e "Meus casos" é um link real para /historico', () => {
    render(
      <Nav theme="light" onToggleTheme={() => {}} onNavigate={() => {}} user={{ uid: 'u1' } as any} onRequireLogin={() => {}} />
    );

    expect(screen.queryByRole('button', { name: /entrar/i })).not.toBeInTheDocument();
    const meusCasos = screen.getByRole('link', { name: /meus casos/i });
    expect(meusCasos).toHaveAttribute('href', '/historico');
  });
});
