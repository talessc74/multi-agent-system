import type { Attachment, LegalArea, Mode5Result, ReportContent, SimulationResult } from '../types';

/**
 * Form/session data for one simulation flow (Input → Confirm → Simulating
 * → Result), lifted to NovaVersaoApp so it survives the four screens
 * without threading props through the URL. Reset whenever the user picks
 * a different mode from the home page.
 */
export interface SimData {
  mode: number;
  caseDescription: string;
  defenseDescription: string;
  attachments: Attachment[];
  defenseAttachments: Attachment[];
  userSide?: 'AUTHOR' | 'DEFENSE';
  userPole?: 'AUTOR' | 'REU';
  mode5SubCase: 'RECURSO' | 'ACORDO';
  mode5SentencaOuProposta: string;
  detectedArea: LegalArea | null;
  specificJudge: string | null;
  caseSummary: string | null;
  attachmentsUnreadable: boolean;
  simulation: SimulationResult | null;
  report: ReportContent | null;
  mode5Result: Mode5Result | null;
  simStep: string;
  isUnlocked: boolean;
  simulationId: string | null;
  error: string | null;
}

export function initialSimData(mode: number): SimData {
  return {
    mode,
    caseDescription: '',
    defenseDescription: '',
    attachments: [],
    defenseAttachments: [],
    userSide: undefined,
    userPole: undefined,
    mode5SubCase: 'RECURSO',
    mode5SentencaOuProposta: '',
    detectedArea: null,
    specificJudge: null,
    caseSummary: null,
    attachmentsUnreadable: false,
    simulation: null,
    report: null,
    mode5Result: null,
    simStep: 'IDLE',
    isUnlocked: false,
    simulationId: null,
    error: null,
  };
}

/** Reconstrói o SimData de um caso do histórico (equivalente a App.tsx
 * loadSimulation) — mesma regra: isUnlocked sempre true ao reabrir, já que
 * o histórico só lista casos do próprio usuário (Firestore rules). */
export function simDataFromHistory(sim: any): SimData {
  const mode = sim.mode5Result ? 5 : (sim.selectedMode ?? 1);
  return {
    ...initialSimData(mode),
    caseDescription: sim.caseDescription ?? '',
    userSide: sim.userSide ?? undefined,
    userPole: sim.userPole ?? undefined,
    mode5SubCase: sim.mode5Result?.subCase ?? 'RECURSO',
    detectedArea: sim.area ?? 'OTHER',
    caseSummary: sim.caseSummary ?? null,
    simulation: {
      area: sim.area,
      rounds: sim.rounds || [],
      finalSuccessProbability: sim.finalSuccessProbability,
      lawyerAgentName: sim.lawyerAgentName,
      judgeAgentName: sim.judgeAgentName,
    },
    report: sim.report ?? null,
    mode5Result: sim.mode5Result ?? null,
    isUnlocked: true,
    simulationId: sim.id ?? null,
  };
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

export async function filesToAttachments(
  files: FileList,
  existing: Attachment[]
): Promise<{ attachments: Attachment[]; error: string | null }> {
  const next: Attachment[] = [...existing];
  let error: string | null = null;
  let total = existing.reduce((sum, a) => sum + a.size, 0);

  for (const file of Array.from(files)) {
    if (file.size > MAX_FILE_BYTES) {
      error = `${file.name} excede 10MB. Limite por arquivo: 10MB.`;
      continue;
    }
    if (total + file.size > MAX_TOTAL_BYTES) {
      error = `Limite total de 20MB atingido — ${file.name} não foi anexado.`;
      continue;
    }
    const data = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(file);
    });
    next.push({ name: file.name, type: file.type, size: file.size, data });
    total += file.size;
  }

  return { attachments: next, error };
}
