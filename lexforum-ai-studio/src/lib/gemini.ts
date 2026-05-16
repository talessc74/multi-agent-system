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

export async function simulateForum(
  caseDescription: string, 
  area: LegalArea, 
  attachments: Attachment[], 
  specificJudge: string | null,
  onProgress: (step: SimStep, data?: { lawyerName?: string; judgeName?: string; round?: number; rounds?: any; regionIndex?: number }) => void
): Promise<SimulationResult> {
  const regionIndex = Math.floor(Math.random() * 6);
  onProgress('SEED_CREATED', { regionIndex });
  
  // Fake some progress steps since the real simulation is now server side and monolithic
  // In a real production app, you might use SSE or WebSockets for progress
  onProgress('WRITING', { round: 1 });
  
  const response = await fetch('/api/gemini/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseDescription, area, attachments, specificJudge })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(JSON.stringify(err));
  }
  
  const data = await response.json();
  
  // Update progress for all rounds at once since we did them on server
  onProgress('IDLE', { 
    lawyerName: data.lawyerAgentName, 
    judgeName: data.judgeAgentName,
    round: data.rounds.length,
    rounds: data.rounds 
  });
  
  return data;
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
