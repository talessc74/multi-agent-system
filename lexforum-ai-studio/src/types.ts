export enum LegalArea {
  CONSUMER = "CONSUMER",
  LABOR = "LABOR",
  CIVIL = "CIVIL",
  SOCIAL_SECURITY = "SOCIAL_SECURITY",
  FAMILY = "FAMILY",
  OTHER = "OTHER",
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  data: string; // Base64
}

export interface SimulationRound {
  round: number;
  lawyerPetition: string;
  judgeJudgment: string;
  successProbability: number;
  lawyerBrief?: string;
  authorSummary?: string;
  defenseSummary?: string;
}

export interface SimulationResult {
  area: LegalArea;
  rounds: SimulationRound[];
  finalSuccessProbability: number;
  lawyerAgentName?: string;
  judgeAgentName?: string;
}

export interface ReportContent {
  layman: string;
  professional: string;
}

export interface AppState {
  step: 'boardroom' | 'input' | 'confirm' | 'simulating' | 'result';
  selectedMode: number;
  caseDescription: string;
  defenseDescription: string;
  attachments: Attachment[];
  defenseAttachments: Attachment[];
  userSide?: 'AUTHOR' | 'DEFENSE';
  detectedArea: LegalArea;
  caseSummary: string | null;
  specificJudge: string | null;
  simulation: SimulationResult | null;
  report: ReportContent | null;
  isUnlocked: boolean;
  simStep: 'IDLE' | 'WRITING' | 'DELIVERING' | 'JUDGING' | 'REVIEWING' | 'SEED_CREATED';
  selectedProfile: 'leigo' | 'profissional';
  regionalStats: { region: string; seeds: number; active: number }[];
  activeAgents: { name: string; type: string; id: string }[];
  showForgeMonitor: boolean;
  currentRound: number;
  error?: { code: number | string; message: string; isQuota: boolean } | null;
  mode5Input?: Mode5Input;
  mode5Result?: Mode5Result;
}

export type Mode5SubCase = 'RECURSO' | 'ACORDO';

export interface Mode5Input {
  subCase: Mode5SubCase;
  caseDescription: string;
  sentencaOuProposta: string;
  attachments: Attachment[];
}

export interface Mode5Result {
  subCase: Mode5SubCase;
  strategistAnalysis: string;
  recommendation: 'RECORRER' | 'ACEITAR' | 'NEGOCIAR';
  confidenceLevel: number;
  reasoning: string;
  tokenCount?: number;
}
