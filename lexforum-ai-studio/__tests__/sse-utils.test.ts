import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupSSE, sendSSE } from '../sse-utils';

function makeMockRes() {
  const headers: Record<string, string> = {};
  const written: string[] = [];
  let ended = false;
  const listeners: Record<string, Array<() => void>> = {};

  return {
    setHeader: (k: string, v: string) => { headers[k] = v; },
    write: vi.fn((chunk: string) => { written.push(chunk); }),
    end: vi.fn(() => { ended = true; }),
    on: (event: string, cb: () => void) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
    },
    emit: (event: string) => listeners[event]?.forEach(cb => cb()),
    get writableEnded() { return ended; },
    _headers: headers,
    _written: written,
  };
}

describe('setupSSE', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('define headers corretos', () => {
    const res = makeMockRes();
    setupSSE(res as any);
    expect(res._headers['Content-Type']).toBe('text/event-stream');
    expect(res._headers['Cache-Control']).toBe('no-cache');
    expect(res._headers['Connection']).toBe('keep-alive');
  });

  it('envia evento de timeout e encerra stream após 120s', () => {
    const res = makeMockRes();
    setupSSE(res as any);
    vi.advanceTimersByTime(120_001);
    expect(res.end).toHaveBeenCalledOnce();
    expect(res._written.some(w => w.includes('504'))).toBe(true);
    expect(res._written.some(w => w.includes('Stream timeout'))).toBe(true);
  });

  it('não envia evento duplicado se stream já encerrado antes do timeout', () => {
    const res = makeMockRes();
    setupSSE(res as any);
    res.end(); // simulate normal completion
    vi.advanceTimersByTime(120_001);
    // end was called once (manually), timeout should not call it again
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('cancela o timer quando a conexão fecha (on close)', () => {
    const res = makeMockRes();
    const timer = setupSSE(res as any);
    res.emit('close');
    // Timer should be cleared — advancing time should NOT trigger timeout
    vi.advanceTimersByTime(120_001);
    expect(res.end).not.toHaveBeenCalled();
  });

  it('retorna um NodeJS.Timeout', () => {
    const res = makeMockRes();
    const timer = setupSSE(res as any);
    expect(timer).toBeDefined();
  });
});

describe('sendSSE', () => {
  it('escreve formato SSE correto', () => {
    const res = makeMockRes();
    sendSSE(res as any, 'progress', { step: 1 });
    expect(res.write).toHaveBeenCalledWith('event: progress\ndata: {"step":1}\n\n');
  });

  it('não escreve se stream já encerrado', () => {
    const res = makeMockRes();
    res.end();
    sendSSE(res as any, 'done', { result: 'ok' });
    expect(res.write).not.toHaveBeenCalled();
  });

  it('serializa objeto complexo corretamente', () => {
    const res = makeMockRes();
    sendSSE(res as any, 'message', { agentName: 'Dr. Silva', content: 'Resposta aqui', questionsRemaining: 4 });
    const written = res._written[0];
    expect(written).toContain('"agentName":"Dr. Silva"');
    expect(written).toContain('"questionsRemaining":4');
  });
});
