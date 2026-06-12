import type { LegalArea, SimulationResult, ReportContent, Attachment, Mode5Input, Mode5Result } from "../types";

export type SimStep = 'WRITING' | 'DELIVERING' | 'JUDGING' | 'REVIEWING' | 'IDLE' | 'SEED_CREATED';

export async function validateCausa(caseDescription: string, attachments: Attachment[]) {
  const response = await fetch('/api/gemini/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseDescription, attachments })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(JSON.stringify(err));
  }
  return response.json();
}

export function simulateForum(
  caseDescription: string,
  area: LegalArea,
  attachments: Attachment[],
  specificJudge: string | null,
  onProgress: (step: SimStep, data?: { lawyerName?: string; judgeName?: string; round?: number; rounds?: any; regionIndex?: number; sessionId?: string }) => void,
  mode: number = 1,
  defenseDescription: string = '',
  defenseAttachments: Attachment[] = [],
  userSide?: 'AUTHOR' | 'DEFENSE',
  onRetry?: (attempt: number) => void,
  signal?: AbortSignal
): Promise<SimulationResult> {
  const MAX_RETRIES = 3;

  const attemptFetch = (attempt: number): Promise<SimulationResult> =>
    new Promise(async (resolve, reject) => {
      if (attempt === 1) {
        const regionIndex = Math.floor(Math.random() * 6);
        onProgress('SEED_CREATED', { regionIndex });
      }

      let response: Response;
      try {
        response = await fetch('/api/gemini/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caseDescription, area, attachments, specificJudge, mode, defenseDescription, defenseAttachments, userSide }),
          signal,
        });
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          reject(new Error('SIMULATION_ABORTED'));
          return;
        }
        reject(new Error(err.message || 'Erro na simulação SSE'));
        return;
      }

      if (!response.ok || !response.body) {
        reject(new Error('Erro na simulação SSE'));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let settled = false;

      const processBlock = (block: string) => {
        let eventName = 'message';
        let dataStr = '';
        for (const line of block.split('\n')) {
          if (line.startsWith('event: ')) eventName = line.slice(7);
          else if (line.startsWith('data: ')) dataStr = line.slice(6);
        }
        if (!dataStr) return;

        try {
          const data = JSON.parse(dataStr);
          if (eventName === 'progress') {
            const { step, round } = data;
            onProgress(step as SimStep, { round });
          } else if (eventName === 'agents') {
            onProgress('SEED_CREATED', { lawyerName: data.lawyerName, judgeName: data.judgeName, sessionId: data.sessionId });
          } else if (eventName === 'round') {
            onProgress('REVIEWING', { round: data.round, rounds: [data] });
          } else if (eventName === 'done') {
            onProgress('IDLE', {
              lawyerName: data.lawyerAgentName,
              judgeName: data.judgeAgentName,
              round: data.rounds.length,
              rounds: data.rounds,
            });
            settled = true;
            resolve(data);
          } else if (eventName === 'error') {
            settled = true;
            reject(new Error(data.message || 'Erro na simulação SSE'));
          }
        } catch {
          if (!settled) {
            settled = true;
            reject(new Error('Erro na simulação SSE'));
          }
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary: number;
          while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const block = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            if (block.trim()) processBlock(block);
          }
        }
        if (!settled) reject(new Error('Conexão SSE encerrada inesperadamente'));
      } catch (err: any) {
        if (!settled) {
          if (err?.name === 'AbortError') {
            reject(new Error('SIMULATION_ABORTED'));
          } else {
            reject(new Error(err.message || 'Erro na simulação SSE'));
          }
        }
      }
    });

  const runWithRetry = async (attempt: number): Promise<SimulationResult> => {
    try {
      return await attemptFetch(attempt);
    } catch (err: any) {
      if (err?.message === 'SIMULATION_ABORTED') throw err;
      if (attempt < MAX_RETRIES) {
        onRetry?.(attempt + 1);
        await new Promise(res => setTimeout(res, 1500 * attempt));
        return runWithRetry(attempt + 1);
      }
      throw new Error('MAX_RETRIES_EXCEEDED');
    }
  };

  return runWithRetry(1);
}

export async function generateReport(lastPetition: string, lastJudgment: string): Promise<ReportContent> {
  const response = await fetch('/api/gemini/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lastPetition, lastJudgment })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(JSON.stringify(err));
  }
  return response.json();
}

export async function generateCounterHypotheses(
  petition: string,
  area: string,
  mode: number
): Promise<string[]> {
  try {
    const response = await fetch('/api/counter-hypotheses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petition, area, mode })
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.hypotheses) ? data.hypotheses : [];
  } catch {
    return [];
  }
}

export async function expandHypothesis(
  petition: string,
  hypothesis: string,
  area: string
): Promise<string> {
  try {
    const response = await fetch('/api/expand-hypothesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ petition, hypothesis, area })
    });
    if (!response.ok) return '';
    const data = await response.json();
    return typeof data.expanded === 'string' ? data.expanded : '';
  } catch {
    return '';
  }
}

export function simulateMode5(
  mode5Input: Mode5Input,
  area: LegalArea,
  attachments: Attachment[],
  specificJudge: string | null,
  onProgress?: (step: string) => void
): Promise<Mode5Result> {
  return new Promise(async (resolve, reject) => {
    let response: Response;
    try {
      response = await fetch('/api/gemini/mode5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode5Input, area, attachments, specificJudge })
      });
    } catch (err: any) {
      reject(new Error(err.message || 'Erro no Modo 5'));
      return;
    }

    if (!response.ok || !response.body) {
      reject(new Error('Erro no Modo 5'));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let settled = false;

    const processBlock = (block: string) => {
      let eventName = 'message';
      let dataStr = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event: ')) eventName = line.slice(7);
        else if (line.startsWith('data: ')) dataStr = line.slice(6);
      }
      if (!dataStr) return;
      try {
        const data = JSON.parse(dataStr);
        if (eventName === 'progress') {
          onProgress?.(data.step);
        } else if (eventName === 'done') {
          settled = true;
          resolve(data);
        } else if (eventName === 'error') {
          settled = true;
          reject(new Error(data.message || 'Erro no Modo 5'));
        }
      } catch {
        if (!settled) {
          settled = true;
          reject(new Error('Erro no Modo 5'));
        }
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary: number;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          if (block.trim()) processBlock(block);
        }
      }
    } catch (err: any) {
      if (!settled) reject(new Error(err.message || 'Erro no Modo 5'));
    }
  });
}
