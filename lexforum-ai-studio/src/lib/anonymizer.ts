// Direct identifiers — substituted with typed labels
const DIRECT_ID_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, label: '[CPF]' },
  { pattern: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, label: '[CNPJ]' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: '[EMAIL]' },
  { pattern: /\b(\(?\d{2}\)?\s?)(\d{4,5}-?\d{4})\b/g, label: '[TELEFONE]' },
  { pattern: /\b(Rua|Av\.|Avenida|Travessa|Alameda|Rod\.|Rodovia)\s+[A-ZÀ-Ú][^\n,]{3,50}/gi, label: '[ENDEREÇO]' },
  { pattern: /\bprocesso\s+n[°º.]?\s*[\d\.\-\/]+/gi, label: '[NÚMERO DO PROCESSO]' },
  { pattern: /\b\d{4,5}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g, label: '[NÚMERO DO PROCESSO]' },
  // RG patterns (common Brazilian formats)
  { pattern: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dxX]\b/g, label: '[RG]' },
  // PIS/NIT/PASEP
  { pattern: /\b\d{3}\.?\d{5}\.?\d{2}-?\d{1}\b/g, label: '[PIS/NIT]' },
];

// Quasi-identifiers — high-specificity fields that enable re-identification by correlation (adr-local-004)
// Strategy: generalize rather than remove, to preserve analytical utility
const QUASI_ID_PATTERNS: Array<{ pattern: RegExp; replacement: string | ((m: string) => string) }> = [
  // Exact monetary values → generalized to range brackets
  {
    pattern: /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g,
    replacement: (m: string) => {
      const raw = m.replace(/R\$\s*/, '').replace(/\./g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (isNaN(val)) return '[VALOR]';
      if (val < 1000) return '[VALOR: até R$1k]';
      if (val < 10000) return '[VALOR: R$1k–10k]';
      if (val < 50000) return '[VALOR: R$10k–50k]';
      if (val < 200000) return '[VALOR: R$50k–200k]';
      return '[VALOR: acima de R$200k]';
    },
  },
  // Exact dates → year only (month+day+year is quasi-identifier)
  {
    pattern: /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g,
    replacement: '[DATA: $3]',
  },
  // Written dates (e.g. "15 de março de 2023")
  {
    pattern: /\b\d{1,2}\s+de\s+\w+\s+de\s+(\d{4})\b/gi,
    replacement: '[DATA: $1]',
  },
  // Small municipality names (high specificity — cities with < ~50k inhabitants)
  // Conservative: only remove after known geographic markers
  {
    pattern: /\b(comarca|município|cidade)\s+de\s+[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?\b/gi,
    replacement: '[LOCALIDADE]',
  },
  // Named individuals (Fulano de Tal / Mr. X patterns — heuristic for proper names in legal context)
  {
    pattern: /\b(autor|réu|requerente|requerido|reclamante|reclamado|apelante|apelado)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,3})/g,
    replacement: (m: string, role: string) => `${role} [NOME]`,
  },
];

export function anonymizeText(text: string): string {
  if (!text) return text;
  let result = text;

  for (const { pattern, label } of DIRECT_ID_PATTERNS) {
    result = result.replace(pattern, label);
  }

  for (const { pattern, replacement } of QUASI_ID_PATTERNS) {
    result = result.replace(pattern, replacement as any);
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
  report: { layman: string; professional: string; causeSummary?: string } | null;
}) {
  return {
    caseDescription: anonymizeText(data.caseDescription),
    caseSummary: data.caseSummary ? anonymizeText(data.caseSummary) : null,
    rounds: data.rounds.map(anonymizeRound),
    report: data.report ? {
      layman: anonymizeText(data.report.layman || ''),
      professional: anonymizeText(data.report.professional || ''),
      causeSummary: data.report.causeSummary ? anonymizeText(data.report.causeSummary) : undefined,
    } : null,
  };
}
