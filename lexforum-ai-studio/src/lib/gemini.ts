import { LegalArea, SimulationResult, ReportContent, Attachment, Mode5Input, Mode5Result } from "../types";

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
  onProgress: (step: SimStep, data?: { lawyerName?: string; judgeName?: string; round?: number; rounds?: any; regionIndex?: number }) => void,
  mode: number = 1,
  defenseDescription: string = '',
  defenseAttachments: Attachment[] = [],
  userSide?: 'AUTHOR' | 'DEFENSE'
): Promise<SimulationResult> {
  return new Promise(async (resolve, reject) => {
    const regionIndex = Math.floor(Math.random() * 6);
    onProgress('SEED_CREATED', { regionIndex });

    let response: Response;
    try {
      response = await fetch('/api/gemini/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseDescription, area, attachments, specificJudge, mode, defenseDescription, defenseAttachments, userSide }),
      });
    } catch (err: any) {
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
          onProgress('SEED_CREATED', { lawyerName: data.lawyerName, judgeName: data.judgeName });
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
    } catch (err: any) {
      if (!settled) reject(new Error(err.message || 'Erro na simulação SSE'));
    }
  });
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
