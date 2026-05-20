export function anonymizeText(text: string): string {
  if (!text) return text;
  const patterns: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, label: '[CPF]' },
    { pattern: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, label: '[CNPJ]' },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: '[EMAIL]' },
    { pattern: /\b(\(?\d{2}\)?\s?)(\d{4,5}-?\d{4})\b/g, label: '[TELEFONE]' },
    { pattern: /\b(Rua|Av\.|Avenida|Travessa|Alameda|Rod\.|Rodovia)\s+[A-ZÀ-Ú][^\n,]{3,50}/gi, label: '[ENDEREÇO]' },
    { pattern: /\bprocesso\s+n[°º.]?\s*[\d\.\-\/]+/gi, label: '[NÚMERO DO PROCESSO]' },
  ];
  let result = text;
  for (const { pattern, label } of patterns) {
    result = result.replace(pattern, label);
  }
  return result;
}

export function anonymizeRound(round: {
  lawyerPetition: string;
  judgeJudgment: string;
  lawyerBrief?: string;
  authorSummary?: string;
  defenseSummary?: string;
  [key: string]: any;
}): typeof round {
  return {
    ...round,
    lawyerPetition: anonymizeText(round.lawyerPetition || ''),
    judgeJudgment: anonymizeText(round.judgeJudgment || ''),
    lawyerBrief: round.lawyerBrief ? anonymizeText(round.lawyerBrief) : round.lawyerBrief,
    authorSummary: round.authorSummary ? anonymizeText(round.authorSummary) : round.authorSummary,
    defenseSummary: round.defenseSummary ? anonymizeText(round.defenseSummary) : round.defenseSummary,
  };
}

export function anonymizeSimulation(data: {
  caseDescription: string;
  caseSummary: string | null;
  rounds: any[];
  report: { layman: string; professional: string } | null;
}) {
  return {
    caseDescription: anonymizeText(data.caseDescription),
    caseSummary: data.caseSummary ? anonymizeText(data.caseSummary) : null,
    rounds: data.rounds.map(anonymizeRound),
    report: data.report ? {
      layman: anonymizeText(data.report.layman || ''),
      professional: anonymizeText(data.report.professional || ''),
    } : null,
  };
}
