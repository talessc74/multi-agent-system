import { describe, it, expect } from 'vitest';
import { sanitizeGeneratedAgent } from '../agent-sanitizer';

describe('sanitizeGeneratedAgent', () => {
  it('remove o campo "kernel" quando o Gemini o inclui em "versao" apesar da instrução', () => {
    const agente = {
      nomeAgente: 'Dr. Ricardo Almeida',
      versao: { numero: '1.0', data: '2026-09-14', tipo: 'Final', kernel: 'SHAW_AUDITOR_KERN_0XF1' },
    };

    const { agente: clean, leaksFound } = sanitizeGeneratedAgent(agente);

    expect(clean.versao).not.toHaveProperty('kernel');
    expect(clean.versao.numero).toBe('1.0');
    expect(leaksFound).toHaveLength(1);
    expect(leaksFound[0]).toContain('kernel');
  });

  it('redige um valor de string que contém "Auditor Kern 0xF1"', () => {
    const agente = {
      nomeAgente: 'Dr. Ricardo Almeida',
      objetivo: 'Consultor moldado pelo Auditor Kern 0xF1 para atuar em causas cíveis.',
    };

    const { agente: clean, leaksFound } = sanitizeGeneratedAgent(agente);

    expect(clean.objetivo).not.toContain('Auditor Kern');
    expect(leaksFound).toHaveLength(1);
  });

  it('redige "0xF1" mesmo sem a palavra "Auditor Kern" ao lado', () => {
    const agente = { instrucoesEspecificas: { mainObjective: 'Ref. interna: kernel 0xF1.' } };

    const { agente: clean, leaksFound } = sanitizeGeneratedAgent(agente);

    expect(clean.instrucoesEspecificas.mainObjective).not.toContain('0xF1');
    expect(leaksFound).toHaveLength(1);
  });

  it('redige "Arquiteto Especialista" (nome do sistema criador) sem confundir com "advogado especialista"', () => {
    const agente = {
      nomeAgente: 'Moldado pelo Arquiteto Especialista para o caso.',
      objetivo: 'Advogado especialista em Direito do Consumidor.',
    };

    const { agente: clean, leaksFound } = sanitizeGeneratedAgent(agente);

    expect(clean.nomeAgente).not.toContain('Arquiteto Especialista');
    expect(clean.objetivo).toBe('Advogado especialista em Direito do Consumidor.');
    expect(leaksFound).toHaveLength(1);
  });

  it('não altera nada e não reporta vazamento quando o agente está limpo', () => {
    const agente = {
      nomeAgente: 'Dr. Ricardo Almeida',
      versao: { numero: '1.0', data: '2026-09-14', tipo: 'Final' },
      instrucoesEspecificas: { mainObjective: 'Atuar em causas cíveis com rigor técnico.' },
      diretrizesEticas: { titulo: 'Ética e Governança' },
    };

    const { agente: clean, leaksFound } = sanitizeGeneratedAgent(agente);

    expect(clean).toEqual(agente);
    expect(leaksFound).toHaveLength(0);
  });

  it('percorre arrays e objetos aninhados em qualquer profundidade', () => {
    const agente = {
      instrucoesEspecificas: {
        restricoes: [
          'Restrição normal.',
          { detalhe: 'Vazamento escondido: Auditor Kern 0xF1.' },
        ],
      },
    };

    const { agente: clean, leaksFound } = sanitizeGeneratedAgent(agente);

    expect((clean.instrucoesEspecificas.restricoes[1] as any).detalhe).not.toContain('Auditor Kern');
    expect(leaksFound).toHaveLength(1);
    expect(leaksFound[0]).toContain('restricoes[1].detalhe');
  });

  it('preserva agente null/undefined sem lançar erro', () => {
    expect(sanitizeGeneratedAgent(null).agente).toBeNull();
    expect(sanitizeGeneratedAgent(undefined).agente).toBeUndefined();
  });
});
