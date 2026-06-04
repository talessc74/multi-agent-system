import type { Response } from 'express';

export function setupSSE(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
}

export function sendSSE(res: Response, event: string, data: object): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
