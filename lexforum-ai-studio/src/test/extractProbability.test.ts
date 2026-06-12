import { describe, it, expect } from 'vitest';

// Isolate the pure function without loading the rest of gemini.server.ts
// (which requires a live GEMINI_API_KEY at import time).
// We inline the identical implementation here so the contract is explicit.
function extractProbability(text: string): number {
  if (!text) return 50;
  const match = text.match(/"success_probability"\s*:\s*(\d+)/);
  if (match) return parseInt(match[1]);
  return 50;
}

describe('extractProbability', () => {
  // ── Happy paths ──────────────────────────────────────────────────────────

  it('extrai probabilidade de JSON limpo', () => {
    expect(extractProbability('{"success_probability":72}')).toBe(72);
  });

  it('extrai probabilidade com espaços em volta do valor', () => {
    expect(extractProbability('{ "success_probability" : 35 }')).toBe(35);
  });

  it('extrai 0 corretamente (valor limite inferior)', () => {
    expect(extractProbability('{"success_probability":0}')).toBe(0);
  });

  it('extrai 100 corretamente (valor limite superior)', () => {
    expect(extractProbability('{"success_probability":100}')).toBe(100);
  });

  it('extrai probabilidade quando JSON está embutido em texto livre', () => {
    const text = 'Considerando os argumentos: {"success_probability":60} — decisão final.';
    expect(extractProbability(text)).toBe(60);
  });

  // ── Fallback de 50 ───────────────────────────────────────────────────────

  it('retorna 50 quando texto está vazio', () => {
    expect(extractProbability('')).toBe(50);
  });

  it('retorna 50 quando não há JSON na resposta', () => {
    expect(extractProbability('Argumento procedente. A parte autora tem razão.')).toBe(50);
  });

  it('retorna 50 quando JSON está incompleto', () => {
    expect(extractProbability('{"success_probability":')).toBe(50);
  });

  it('retorna 50 quando a chave é diferente', () => {
    expect(extractProbability('{"probability":80}')).toBe(50);
  });

  // ── Regressão: JSON com múltiplas chaves ─────────────────────────────────
  // O regex anterior exigia que success_probability fosse a ÚNICA chave.
  // Com responseMimeType:'application/json', o Gemini retorna JSON completo
  // com judgment, author_summary, defense_summary — o regex antigo não casava
  // e o fallback retornava 50 para todas as simulações.
  it('extrai probabilidade de JSON completo com múltiplas chaves', () => {
    const jsonCompleto = '{"success_probability":73,"author_summary":"arg forte","defense_summary":"arg fraco","judgment":"Procedente."}';
    expect(extractProbability(jsonCompleto)).toBe(73);
  });

  it('extrai probabilidade de JSON com chaves em ordem diferente', () => {
    const jsonOrdemDiferente = '{"judgment":"Improcedente.","author_summary":"fraco","success_probability":28,"defense_summary":"sólido"}';
    expect(extractProbability(jsonOrdemDiferente)).toBe(28);
  });

  // ── Regressão: bug modo 2 ────────────────────────────────────────────────
  // Antes da correção, o modelo retornava texto livre sem JSON e a função
  // devolvia 50 como fallback, travando o modo 2 sempre em 50%.
  // Com responseMimeType:'application/json', o JSON chega sempre estruturado.
  // Este teste documenta o comportamento do fallback para esse cenário.
  it('retorna 50 quando Gemini retorna texto livre sem JSON (cenário pré-fix)', () => {
    const textoLivre = 'Com base nos argumentos de defesa, a probabilidade de êxito é elevada.';
    expect(extractProbability(textoLivre)).toBe(50);
  });
});
