import type { Response } from 'express';

const SSE_TIMEOUT_MS = 120_000; // 2 minutes — Gemini SLA upper bound

export function setupSSE(res: Response): NodeJS.Timeout {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const timer = setTimeout(() => {
    if (!res.writableEnded) {
      res.write(`event: error\ndata: ${JSON.stringify({ code: 504, message: 'Stream timeout' })}\n\n`);
      res.end();
    }
  }, SSE_TIMEOUT_MS);

  res.on('close', () => clearTimeout(timer));
  return timer;
}

export function sendSSE(res: Response, event: string, data: object): void {
  if (!res.writableEnded) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}
