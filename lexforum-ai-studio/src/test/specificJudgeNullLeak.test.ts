import { describe, it, expect, vi, beforeEach } from 'vitest';

// Investiga se a string literal "null" (não o valor null de JS) consegue atravessar
// o pipeline real de gemini.server.ts sem ser filtrada, reproduzindo os bugs
// "Auditor Kern 0xF1" / "comarca null" listados no BRIEFING_2026-06-05.md.
//
// Não mocka lógica própria: importa e chama as funções REAIS exportadas por
// gemini.server.ts. Só a chamada à API do Gemini (@google/genai) é substituída.

const generateContentMock = vi.fn();

vi.mock('@google/genai', () => {
  class GoogleGenAI {
    models = { generateContent: generateContentMock };
    constructor(_opts: any) {}
  }
  return {
    GoogleGenAI,
    Type: { OBJECT: 'OBJECT', STRING: 'STRING', BOOLEAN: 'BOOLEAN' },
  };
});

beforeEach(() => {
  generateContentMock.mockReset();
});

describe('validateCausaServer — extração de specificJudge', () => {
  it('propaga a string literal "null" quando o Gemini a devolve em um campo STRING não-anulável', async () => {
    // Reproduz o comportamento real de saída estruturada: o schema declara
    // specificJudge como Type.STRING (não nullable) — ver gemini.server.ts:68.
    // Quando não há juiz/comarca no relato, o modelo não pode emitir um JSON
    // null nesse campo e escreve a palavra "null" como texto.
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({
        area: 'CIVIL',
        specificJudge: 'null',
        summary: 'Resumo qualquer.',
        detectedProfile: 'leigo',
        userPole: 'AUTOR',
      }),
    });

    const { validateCausaServer } = await import('../lib/gemini.server');
    const result = await validateCausaServer('Um caso qualquer, sem juiz mencionado.', []);

    // O código faz `parsed.specificJudge || null` — isso só filtra valores
    // falsy (undefined, '', JS null). A string não-vazia "null" passa direto.
    expect(result.specificJudge).toBe('null');
  });
});

describe('simulateForumServer — criação dinâmica de juiz (fallback sem agente do registry)', () => {
  it('injeta a string literal "null" no prompt de criação do juiz quando specificJudge não é filtrado', async () => {
    // Resposta genérica que satisfaz qualquer chamada ao longo do pipeline
    // (criação de advogado, criação de juiz, petição, sentença, brief).
    generateContentMock.mockResolvedValue({
      text: JSON.stringify({
        name: 'Agente Mock',
        instruction: 'Instrução mock.',
        success_probability: 100,
        judgment: 'Sentença mock — probabilidade máxima para encerrar após a rodada 1.',
        author_summary: 'resumo autor',
        defense_summary: 'resumo réu',
      }),
    });

    const { simulateForumServer } = await import('../lib/gemini.server');

    // Mesmo cenário do server.ts quando resolveAgent() falha/cai no fallback:
    // agentInstruction e agentName ficam undefined, e o specificJudge bruto
    // (sem o guard `!== 'null'` que existe em server.ts) é repassado direto.
    await simulateForumServer(
      'Descrição de causa cível qualquer, sem juiz específico mencionado.',
      'CIVIL_TEST_NULL_LEAK' as any,
      [],
      'null',
      undefined,
      undefined,
      undefined,
      1,
      '',
      [],
      undefined,
      undefined,
    );

    // A 2ª chamada ao Gemini é a de criação do juiz (getOrGenerateAgent('judge', ...)),
    // depois da 1ª chamada de criação do advogado.
    const judgeCreationCall = generateContentMock.mock.calls[1][0];
    const judgeCreationPrompt: string = judgeCreationCall.contents[0].parts[0].text;

    expect(judgeCreationPrompt).toContain('perfil/comarca de "null"');
  });
});
