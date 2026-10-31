import { describe, it, expect } from 'vitest';
import { anonymizeText } from '../lib/anonymizer';

// Cobertura direta do anonymizer.ts, que nunca tinha teste próprio — só era
// mockado (identidade) em dbService.test.ts. Este arquivo é o que valida de
// verdade que o texto enviado ao Gemini (server.ts, chat-handler.ts) e o que
// é persistido no Firestore (dbService.ts) passam pelos mesmos padrões.

describe('anonymizeText', () => {
  it('redige CPF em formatos com e sem máscara', () => {
    expect(anonymizeText('Meu CPF é 123.456.789-00')).toBe('Meu CPF é [CPF]');
    expect(anonymizeText('CPF 12345678900 do autor')).toBe('CPF [CPF] do autor');
  });

  it('redige CNPJ', () => {
    expect(anonymizeText('Empresa CNPJ 12.345.678/0001-90 descumpriu')).toBe(
      'Empresa CNPJ [CNPJ] descumpriu'
    );
  });

  it('redige e-mail', () => {
    expect(anonymizeText('contato: joao.silva@exemplo.com.br')).toBe(
      'contato: [EMAIL]'
    );
  });

  it('redige telefone (dígitos sempre saem; "(" de abertura pode sobrar — \\b não casa antes de "(", achado nesta sessão, não corrigido aqui por estar fora do escopo desta mudança)', () => {
    const result = anonymizeText('me liga no (21) 98765-4321 por favor');
    expect(result).not.toMatch(/\d{4,5}-?\d{4}/);
    expect(result).toContain('[TELEFONE]');
  });

  it('redige endereço até a primeira vírgula (regex para em [^\\n,]{3,50} — número/complemento após a vírgula não é redigido)', () => {
    expect(anonymizeText('Moro na Rua das Flores, 123, apto 45')).toBe(
      'Moro na [ENDEREÇO], 123, apto 45'
    );
  });

  it('redige número de processo', () => {
    expect(anonymizeText('conforme processo nº 0001234-56.2026.8.19.0001')).toBe(
      'conforme [NÚMERO DO PROCESSO]'
    );
  });

  it('NÃO redige nome próprio, cidade/comarca, data ou valor — preserva o que a IA precisa para classificar a causa', () => {
    const text = 'Dra. Maria Silva, da comarca de Niterói, em 10/03/2026, condenou ao pagamento de R$ 5.000,00';
    expect(anonymizeText(text)).toBe(text);
  });

  it('redige múltiplos identificadores no mesmo texto', () => {
    const text = 'Sou João, CPF 123.456.789-00, email joao@ex.com, moro na Av. Brasil, 500';
    const result = anonymizeText(text);
    expect(result).toContain('[CPF]');
    expect(result).toContain('[EMAIL]');
    expect(result).toContain('[ENDEREÇO]');
    expect(result).not.toContain('123.456.789-00');
    expect(result).not.toContain('joao@ex.com');
  });

  it('é idempotente — rodar duas vezes não altera o resultado já redigido', () => {
    const once = anonymizeText('CPF 123.456.789-00');
    const twice = anonymizeText(once);
    expect(twice).toBe(once);
  });

  it('lida com string vazia ou undefined sem lançar erro', () => {
    expect(anonymizeText('')).toBe('');
    expect(anonymizeText(undefined as unknown as string)).toBe(undefined);
  });
});
