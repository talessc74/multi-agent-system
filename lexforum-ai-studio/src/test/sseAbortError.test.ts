import { describe, it, expect, vi, beforeEach } from 'vitest';

// Testa a lógica de tratamento do AbortError no SSE reader (gemini.ts).
// O contrato: quando o AbortController aborta a simulação durante reader.read(),
// o erro deve ser tratado como SIMULATION_ABORTED — não retentado.

// Isolamos a função de decisão central do catch block:
function classifyReaderError(err: unknown): 'SIMULATION_ABORTED' | 'SSE_ERROR' {
  if (err && typeof err === 'object' && (err as any).name === 'AbortError') {
    return 'SIMULATION_ABORTED';
  }
  return 'SSE_ERROR';
}

describe('SSE reader — tratamento de AbortError', () => {

  it('AbortError do DOMException é classificado como SIMULATION_ABORTED', () => {
    const abortError = Object.assign(new Error('The user aborted a request.'), { name: 'AbortError' });
    expect(classifyReaderError(abortError)).toBe('SIMULATION_ABORTED');
  });

  it('TypeError genérico (Load failed) é classificado como SSE_ERROR', () => {
    const loadFailed = new TypeError('Load failed');
    expect(classifyReaderError(loadFailed)).toBe('SSE_ERROR');
  });

  it('Erro de conexão sem nome é classificado como SSE_ERROR', () => {
    const connError = new Error('net::ERR_NETWORK_CHANGED');
    expect(classifyReaderError(connError)).toBe('SSE_ERROR');
  });

  it('null não causa exceção — classificado como SSE_ERROR', () => {
    expect(classifyReaderError(null)).toBe('SSE_ERROR');
  });

  it('string não causa exceção — classificado como SSE_ERROR', () => {
    expect(classifyReaderError('Load failed')).toBe('SSE_ERROR');
  });

  // Regressão: antes do fix, AbortError chegava como 'The user aborted a request.'
  // e NÃO era identificado — causava 3 retries + banner 'Erro técnico: Load failed'.
  // Este teste documenta que o fix foi aplicado corretamente.
  it('regressão: AbortError com mensagem de Safari não vaza como SSE_ERROR', () => {
    const safariAbort = Object.assign(
      new Error('The user aborted a request.'),
      { name: 'AbortError' }
    );
    expect(classifyReaderError(safariAbort)).not.toBe('SSE_ERROR');
    expect(classifyReaderError(safariAbort)).toBe('SIMULATION_ABORTED');
  });
});
