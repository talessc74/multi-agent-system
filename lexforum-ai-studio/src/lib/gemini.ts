import { LegalArea, SimulationResult, ReportContent, Attachment } from "../types";

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
  onProgress: (step: SimStep, data?: { lawyerName?: string; judgeName?: string; round?: number; rounds?: any; regionIndex?: number }) => void
): Promise<SimulationResult> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ caseDescription, area, attachments, specificJudge });
    const url = `/api/gemini/simulate?payload=${encodeURIComponent(payload)}`;
    const eventSource = new EventSource(url);

    const regionIndex = Math.floor(Math.random() * 6);
    onProgress('SEED_CREATED', { regionIndex });

    eventSource.addEventListener('progress', (e) => {
      const { step, round } = JSON.parse(e.data);
      onProgress(step as SimStep, { round });
    });

    eventSource.addEventListener('agents', (e) => {
      const { lawyerName, judgeName } = JSON.parse(e.data);
      onProgress('SEED_CREATED', { lawyerName, judgeName });
    });

    eventSource.addEventListener('round', (e) => {
      const roundData = JSON.parse(e.data);
      onProgress('REVIEWING', { round: roundData.round, rounds: [roundData] });
    });

    eventSource.addEventListener('done', (e) => {
      const data = JSON.parse(e.data);
      onProgress('IDLE', {
        lawyerName: data.lawyerAgentName,
        judgeName: data.judgeAgentName,
        round: data.rounds.length,
        rounds: data.rounds
      });
      eventSource.close();
      resolve(data);
    });

    eventSource.addEventListener('error', (e: any) => {
      eventSource.close();
      try {
        const err = JSON.parse(e.data);
        reject(new Error(err.message));
      } catch {
        reject(new Error('Erro na simulação SSE'));
      }
    });
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
