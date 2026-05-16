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
  caseDescription: string;
  attachments: Attachment[];
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
}
