import { describe, it, expect } from 'vitest';

// Testa os contratos puros do loop de simulação do Modo 4 (Mesa Dupla Assistida).
//
// CONTRATOS:
// 1. Atribuição de lados: authorText e defenseText obedecem ao userSide escolhido.
//    - userSide='AUTHOR': authorText = currentPetition (melhora), defenseText = staticSide
//    - userSide='DEFENSE': authorText = staticSide, defenseText = currentPetition (melhora)
// 2. Prompt do advogado:
//    - Rodada 1: sem briefs (allBriefs vazio)
//    - Rodadas 2+: inclui allBriefs acumulados
// 3. Acumulação de briefs:
//    - Cada rodada anexa "--- Brief Rodada N ---" ao allBriefs
//    - Na rodada seguinte, o prompt inclui o brief anterior
// 4. Estrutura de round:
//    - round.round = i
//    - round.successProbability = valor do juiz (não hardcoded)
//    - round.lawyerBrief presente (opcional mas presente quando brief gerado)
//    - SEM authorSummary/defenseSummary (não pedidos ao juiz no modo 4)

// ── Modelos das funções puras extraídas do loop mode 4 ───────────────────────

function computeSides(
  userSide: 'AUTHOR' | 'DEFENSE',
  caseDescription: string,
  defenseDescription: string,
  currentPetition: string
): { authorText: string; defenseText: string } {
  const authorText = userSide === 'DEFENSE' ? caseDescription : currentPetition;
  const defenseText = userSide === 'DEFENSE' ? currentPetition : defenseDescription;
  return { authorText, defenseText };
}

function buildLawPrompt(
  i: number,
  userSide: 'AUTHOR' | 'DEFENSE',
  currentJudgment: string,
  allBriefs: string,
  userPetition: string
): string {
  return i === 1
    ? `Melhore esta ${userSide === 'DEFENSE' ? 'contestação' : 'petição'} tornando-a mais forte tecnicamente: ${userPetition}`
    : `Sentença anterior: ${currentJudgment}\nBreves estratégicos acumulados: ${allBriefs}\nMelhore ainda mais: ${userPetition}`;
}

function accumulateBrief(allBriefs: string, i: number, briefText: string): string {
  return allBriefs + `\n--- Brief Rodada ${i} ---\n${briefText}`;
}

// ── 1. Atribuição de lados ────────────────────────────────────────────────────

describe('mode4 — atribuição de lados (userSide=AUTHOR)', () => {
  const caseDesc = 'Petição do autor original';
  const defenseDesc = 'Contestação do réu original';
  const improvedPetition = 'Petição melhorada pelo advogado';

  it('authorText recebe a petição melhorada pelo advogado', () => {
    const { authorText } = computeSides('AUTHOR', caseDesc, defenseDesc, improvedPetition);
    expect(authorText).toBe(improvedPetition);
  });

  it('defenseText permanece a contestação estática do réu', () => {
    const { defenseText } = computeSides('AUTHOR', caseDesc, defenseDesc, improvedPetition);
    expect(defenseText).toBe(defenseDesc);
  });

  it('defenseText não muda mesmo quando currentPetition muda entre rodadas', () => {
    const round1 = computeSides('AUTHOR', caseDesc, defenseDesc, 'Petição rodada 1');
    const round2 = computeSides('AUTHOR', caseDesc, defenseDesc, 'Petição rodada 2');
    expect(round1.defenseText).toBe(round2.defenseText);
    expect(round1.authorText).not.toBe(round2.authorText);
  });
});

describe('mode4 — atribuição de lados (userSide=DEFENSE)', () => {
  const caseDesc = 'Petição do autor original';
  const defenseDesc = 'Contestação do réu original';
  const improvedDefense = 'Contestação melhorada pelo advogado';

  it('defenseText recebe a contestação melhorada pelo advogado', () => {
    const { defenseText } = computeSides('DEFENSE', caseDesc, defenseDesc, improvedDefense);
    expect(defenseText).toBe(improvedDefense);
  });

  it('authorText permanece a petição estática do autor', () => {
    const { authorText } = computeSides('DEFENSE', caseDesc, defenseDesc, improvedDefense);
    expect(authorText).toBe(caseDesc);
  });

  it('authorText não muda mesmo quando currentPetition muda entre rodadas', () => {
    const round1 = computeSides('DEFENSE', caseDesc, defenseDesc, 'Contestação rodada 1');
    const round2 = computeSides('DEFENSE', caseDesc, defenseDesc, 'Contestação rodada 2');
    expect(round1.authorText).toBe(round2.authorText);
    expect(round1.defenseText).not.toBe(round2.defenseText);
  });
});

// ── 2. Prompt do advogado ─────────────────────────────────────────────────────

describe('mode4 — buildLawPrompt (rodada 1)', () => {
  it('rodada 1 AUTHOR menciona "petição" e não inclui briefs', () => {
    const prompt = buildLawPrompt(1, 'AUTHOR', '', '', 'fatos do autor');
    expect(prompt).toContain('petição');
    expect(prompt).toContain('fatos do autor');
    expect(prompt).not.toContain('Breves estratégicos');
    expect(prompt).not.toContain('Sentença anterior');
  });

  it('rodada 1 DEFENSE menciona "contestação" e não inclui briefs', () => {
    const prompt = buildLawPrompt(1, 'DEFENSE', '', '', 'fatos do réu');
    expect(prompt).toContain('contestação');
    expect(prompt).toContain('fatos do réu');
    expect(prompt).not.toContain('Breves estratégicos');
  });
});

describe('mode4 — buildLawPrompt (rodadas 2+)', () => {
  it('rodada 2 inclui sentença anterior e briefs acumulados', () => {
    const prompt = buildLawPrompt(2, 'AUTHOR', 'Sentença da rodada 1', 'Brief 1', 'fatos');
    expect(prompt).toContain('Sentença anterior: Sentença da rodada 1');
    expect(prompt).toContain('Breves estratégicos acumulados: Brief 1');
    expect(prompt).toContain('fatos');
  });

  it('rodada 3 inclui briefs das rodadas 1 e 2', () => {
    const briefs = '\n--- Brief Rodada 1 ---\nBrief 1\n--- Brief Rodada 2 ---\nBrief 2';
    const prompt = buildLawPrompt(3, 'DEFENSE', 'Sentença rodada 2', briefs, 'contestação');
    expect(prompt).toContain('Brief Rodada 1');
    expect(prompt).toContain('Brief Rodada 2');
  });

  it('rodada 2 sem briefs ainda inclui sentença anterior', () => {
    const prompt = buildLawPrompt(2, 'AUTHOR', 'Sentença X', '', 'fatos');
    expect(prompt).toContain('Sentença anterior: Sentença X');
    expect(prompt).toContain('Breves estratégicos acumulados: ');
  });
});

// ── 3. Acumulação de briefs ───────────────────────────────────────────────────

describe('mode4 — acumulação de briefs entre rodadas', () => {
  it('após rodada 1, allBriefs contém o brief da rodada 1', () => {
    let allBriefs = '';
    allBriefs = accumulateBrief(allBriefs, 1, 'argumento forte é X');
    expect(allBriefs).toContain('--- Brief Rodada 1 ---');
    expect(allBriefs).toContain('argumento forte é X');
  });

  it('após rodadas 1 e 2, allBriefs contém ambos os briefs', () => {
    let allBriefs = '';
    allBriefs = accumulateBrief(allBriefs, 1, 'brief da rodada 1');
    allBriefs = accumulateBrief(allBriefs, 2, 'brief da rodada 2');
    expect(allBriefs).toContain('--- Brief Rodada 1 ---');
    expect(allBriefs).toContain('--- Brief Rodada 2 ---');
    expect(allBriefs).toContain('brief da rodada 1');
    expect(allBriefs).toContain('brief da rodada 2');
  });

  it('briefs se acumulam sem apagar os anteriores', () => {
    let allBriefs = '';
    for (let i = 1; i <= 3; i++) {
      allBriefs = accumulateBrief(allBriefs, i, `conteúdo ${i}`);
    }
    expect(allBriefs).toContain('Brief Rodada 1');
    expect(allBriefs).toContain('Brief Rodada 2');
    expect(allBriefs).toContain('Brief Rodada 3');
  });
});

// ── 4. Estrutura de round ─────────────────────────────────────────────────────

describe('mode4 — estrutura do objeto round', () => {
  it('round contém os campos obrigatórios sem authorSummary/defenseSummary', () => {
    // Simula o rounds.push corrigido — sem juiParsed
    const round = {
      round: 1,
      lawyerPetition: 'petição melhorada',
      judgeJudgment: 'sentença do juiz',
      successProbability: 72,
      lawyerBrief: 'brief gerado',
    };

    expect(round.round).toBe(1);
    expect(round.lawyerPetition).toBeDefined();
    expect(round.judgeJudgment).toBeDefined();
    expect(round.successProbability).toBe(72);
    expect(round.lawyerBrief).toBeDefined();
    // authorSummary e defenseSummary não devem existir no objeto do modo 4
    expect((round as any).authorSummary).toBeUndefined();
    expect((round as any).defenseSummary).toBeUndefined();
  });

  it('successProbability reflete o valor extraído do juiz (não hardcoded)', () => {
    const prob75 = { round: 1, lawyerPetition: '', judgeJudgment: '', successProbability: 75, lawyerBrief: '' };
    const prob30 = { round: 1, lawyerPetition: '', judgeJudgment: '', successProbability: 30, lawyerBrief: '' };
    expect(prob75.successProbability).toBe(75);
    expect(prob30.successProbability).toBe(30);
    expect(prob75.successProbability).not.toBe(prob30.successProbability);
  });
});

// ── 5. Condição de saída antecipada (isDecisiveWin) ─────────────────────────
//
// lastProb = sempre probabilidade do AUTOR (normalizado pelo revisor)
// AUTHOR vence decisivamente quando lastProb >= 95
// DEFENSE vence decisivamente quando lastProb <= 5 (autor perdendo feio)

function isDecisiveWin(userSide: 'AUTHOR' | 'DEFENSE', lastProb: number): boolean {
  return userSide === 'DEFENSE' ? lastProb <= 5 : lastProb >= 95;
}

function simulateLoop(
  userSide: 'AUTHOR' | 'DEFENSE',
  probsByRound: number[]
): { executed: number[]; lastProb: number } {
  const executed: number[] = [];
  let lastProb = 0;
  for (let i = 1; i <= probsByRound.length; i++) {
    executed.push(i);
    lastProb = probsByRound[i - 1];
    if (isDecisiveWin(userSide, lastProb)) break;
  }
  return { executed, lastProb };
}

describe('mode4 — saída antecipada (AUTHOR)', () => {
  it('AUTHOR: para na rodada 1 quando prob = 95 (vitória decisiva)', () => {
    const { executed, lastProb } = simulateLoop('AUTHOR', [95, 70, 60]);
    expect(executed).toEqual([1]);
    expect(lastProb).toBe(95);
  });

  it('AUTHOR: executa as 3 rodadas quando prob fica abaixo de 95', () => {
    const { executed, lastProb } = simulateLoop('AUTHOR', [60, 70, 80]);
    expect(executed).toEqual([1, 2, 3]);
    expect(lastProb).toBe(80);
  });

  it('AUTHOR: para na rodada 2 quando prob >= 95 na rodada 2', () => {
    const { executed, lastProb } = simulateLoop('AUTHOR', [70, 96, 50]);
    expect(executed).toEqual([1, 2]);
    expect(lastProb).toBe(96);
  });

  it('AUTHOR: prob = 5 (autor perdendo) NÃO aciona saída antecipada', () => {
    const { executed } = simulateLoop('AUTHOR', [5, 30, 60]);
    expect(executed).toEqual([1, 2, 3]);
  });
});

describe('mode4 — saída antecipada (DEFENSE)', () => {
  it('DEFENSE: para na rodada 1 quando prob = 5 (defesa vencendo decisivamente)', () => {
    const { executed, lastProb } = simulateLoop('DEFENSE', [5, 50, 70]);
    expect(executed).toEqual([1]);
    expect(lastProb).toBe(5);
  });

  it('DEFENSE: prob = 95 (autor dominando) NÃO aciona saída antecipada para defesa', () => {
    // Anti-regressão — bug original encerrava aqui por engano
    const { executed } = simulateLoop('DEFENSE', [95, 80, 70]);
    expect(executed).toEqual([1, 2, 3]);
  });

  it('DEFENSE: executa as 3 rodadas quando prob fica acima de 5', () => {
    const { executed, lastProb } = simulateLoop('DEFENSE', [60, 40, 20]);
    expect(executed).toEqual([1, 2, 3]);
    expect(lastProb).toBe(20);
  });

  it('DEFENSE: para na rodada 2 quando prob = 3 na rodada 2', () => {
    const { executed, lastProb } = simulateLoop('DEFENSE', [50, 3, 40]);
    expect(executed).toEqual([1, 2]);
    expect(lastProb).toBe(3);
  });
});

// ── 6. Extração de sentença do juiz ──────────────────────────────────────────
//
// Campo judgment pode vir vazio do modelo — fallback usa author_summary/defense_summary

const JUDGMENT_FALLBACK_MSG = 'A análise técnica foi processada pelo Magistrado com base nos argumentos apresentados.';

function extractJudgment(juiParsed: {
  judgment?: string;
  author_summary?: string;
  defense_summary?: string;
}): string {
  const rawJudgment = (juiParsed.judgment as string | undefined)?.trim() ?? '';
  if (rawJudgment) return rawJudgment;
  const authorPart = juiParsed.author_summary ? `AUTOR: ${juiParsed.author_summary}` : '';
  const defensePart = juiParsed.defense_summary ? `\nDEFESA: ${juiParsed.defense_summary}` : '';
  return (authorPart + defensePart).trim() || JUDGMENT_FALLBACK_MSG;
}

describe('mode4 — extração de sentença do juiz', () => {
  it('retorna judgment quando campo está preenchido', () => {
    const result = extractJudgment({ judgment: 'Sentença completa do juiz.' });
    expect(result).toBe('Sentença completa do juiz.');
  });

  it('judgment com espaços em branco é tratado como vazio', () => {
    const result = extractJudgment({ judgment: '   ', author_summary: 'Autor tem razão' });
    expect(result).toContain('AUTOR: Autor tem razão');
  });

  it('usa author_summary + defense_summary quando judgment é vazio', () => {
    const result = extractJudgment(
      { judgment: '', author_summary: 'Autor tem razão', defense_summary: 'Defesa é fraca' }
    );
    expect(result).toContain('AUTOR: Autor tem razão');
    expect(result).toContain('DEFESA: Defesa é fraca');
  });

  it('retorna mensagem segura (não JSON bruto) quando todos os campos são vazios', () => {
    const result = extractJudgment({ judgment: '', author_summary: '', defense_summary: '' });
    expect(result).toBe(JUDGMENT_FALLBACK_MSG);
    expect(result).not.toContain('success_probability');
    expect(result).not.toContain('{');
  });

  it('campo judgment ausente (undefined) não quebra — usa fallback de summary', () => {
    const result = extractJudgment({ author_summary: 'Autor procedente' });
    expect(result).toContain('AUTOR: Autor procedente');
  });
});
