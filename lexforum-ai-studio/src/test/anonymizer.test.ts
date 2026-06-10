import { describe, it, expect } from 'vitest';
import { anonymizeText, anonymizeSimulation } from '../lib/anonymizer';

// ── Direct identifiers ───────────────────────────────────────────────────────

describe('anonymizeText — identificadores diretos', () => {
  it('substitui CPF com pontos', () => {
    expect(anonymizeText('CPF 123.456.789-09')).toContain('[CPF]');
    expect(anonymizeText('CPF 123.456.789-09')).not.toContain('123.456');
  });

  it('substitui CPF sem formatação', () => {
    expect(anonymizeText('cpf: 12345678909')).toContain('[CPF]');
  });

  it('substitui CNPJ', () => {
    expect(anonymizeText('CNPJ 12.345.678/0001-90')).toContain('[CNPJ]');
  });

  it('substitui email', () => {
    expect(anonymizeText('contato: joao@empresa.com.br')).toContain('[EMAIL]');
    expect(anonymizeText('contato: joao@empresa.com.br')).not.toContain('joao@');
  });

  it('substitui telefone com DDD', () => {
    expect(anonymizeText('(11) 99999-1234')).toContain('[TELEFONE]');
  });

  it('substitui endereço completo', () => {
    expect(anonymizeText('Rua das Flores, 123, São Paulo')).toContain('[ENDEREÇO]');
  });

  it('substitui número de processo CNJ', () => {
    expect(anonymizeText('processo n. 1234567-89.2023.8.26.0100')).toContain('[NÚMERO DO PROCESSO]');
  });

  it('substitui número de agência bancária', () => {
    expect(anonymizeText('agência 0341-7')).toContain('[AGÊNCIA BANCÁRIA]');
    expect(anonymizeText('Ag. 1234')).toContain('[AGÊNCIA BANCÁRIA]');
  });

  it('substitui número de conta bancária', () => {
    expect(anonymizeText('conta 12345-6')).toContain('[CONTA BANCÁRIA]');
    expect(anonymizeText('c/c 987654321-0')).toContain('[CONTA BANCÁRIA]');
  });

  it('preserva texto sem identificadores', () => {
    const clean = 'O contrato foi firmado entre as partes.';
    expect(anonymizeText(clean)).toBe(clean);
  });
});

// ── Quasi-identifiers ────────────────────────────────────────────────────────

describe('anonymizeText — quasi-identificadores', () => {
  it('generaliza valor monetário baixo (até R$1k)', () => {
    const result = anonymizeText('pedido de R$ 800,00 de indenização');
    expect(result).toContain('[VALOR: até R$1k]');
    expect(result).not.toContain('800');
  });

  it('generaliza valor monetário médio (R$1k–10k)', () => {
    const result = anonymizeText('indenização de R$ 5.000,00');
    expect(result).toContain('[VALOR: R$1k–10k]');
  });

  it('generaliza valor monetário alto (R$50k–200k)', () => {
    const result = anonymizeText('rescisão no valor de R$ 120.000,00');
    expect(result).toContain('[VALOR: R$50k–200k]');
  });

  it('generaliza data no formato DD/MM/YYYY', () => {
    const result = anonymizeText('demitido em 15/03/2022');
    expect(result).toContain('[DATA: 2022]');
    expect(result).not.toContain('15/03');
  });

  it('generaliza data no formato DD-MM-YYYY', () => {
    const result = anonymizeText('assinado em 01-07-2021');
    expect(result).toContain('[DATA: 2021]');
  });

  it('generaliza data por extenso', () => {
    const result = anonymizeText('aos 10 de junho de 2023, o contrato');
    expect(result).toContain('[DATA: 2023]');
    expect(result).not.toContain('10 de junho');
  });

  it('generaliza comarca', () => {
    const result = anonymizeText('comarca de Itapeva');
    expect(result).toContain('[LOCALIDADE]');
    expect(result).not.toContain('Itapeva');
  });

  it('anonimiza nome do autor', () => {
    const result = anonymizeText('autor João Carlos Silva solicita');
    expect(result).toContain('[NOME]');
    expect(result).not.toContain('João Carlos Silva');
    expect(result).toContain('autor');
  });

  it('anonimiza nome do réu', () => {
    const result = anonymizeText('réu Empresa Alfa Ltda alega');
    expect(result).not.toContain('Empresa Alfa Ltda');
  });
});

// ── anonymizeSimulation ───────────────────────────────────────────────────────

describe('anonymizeSimulation', () => {
  it('anonimiza caseDescription', () => {
    const result = anonymizeSimulation({
      caseDescription: 'CPF 123.456.789-09, R$ 5.000,00 em danos',
      caseSummary: null,
      rounds: [],
      report: null,
    });
    expect(result.caseDescription).toContain('[CPF]');
    expect(result.caseDescription).toContain('[VALOR:');
  });

  it('anonimiza caseSummary quando presente', () => {
    const result = anonymizeSimulation({
      caseDescription: 'caso',
      caseSummary: 'Email: teste@dominio.com',
      rounds: [],
      report: null,
    });
    expect(result.caseSummary).toContain('[EMAIL]');
  });

  it('anonimiza rounds', () => {
    const result = anonymizeSimulation({
      caseDescription: 'caso',
      caseSummary: null,
      rounds: [{
        lawyerPetition: 'autor Maria Silva, CPF 111.222.333-44',
        judgeJudgment: 'em 10/05/2023 defiro',
        lawyerBrief: 'contato: maria@email.com',
      }],
      report: null,
    });
    expect(result.rounds[0].lawyerPetition).toContain('[CPF]');
    expect(result.rounds[0].judgeJudgment).toContain('[DATA: 2023]');
    expect(result.rounds[0].lawyerBrief).toContain('[EMAIL]');
  });

  it('não persiste dado original no resultado', () => {
    const pii = '123.456.789-09';
    const result = anonymizeSimulation({
      caseDescription: `CPF do autor: ${pii}`,
      caseSummary: null,
      rounds: [],
      report: null,
    });
    expect(result.caseDescription).not.toContain(pii);
  });
});
