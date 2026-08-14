/** Mesmo dicionário de App.tsx (formatAreaLabel/areaLabels) — mantido em
 * módulo próprio para não duplicar o literal em cada tela nova. */
export const AREA_LABELS: Record<string, string> = {
  CONSUMER: 'Direito do Consumidor',
  LABOR: 'Direito do Trabalho',
  CIVIL: 'Direito Cível',
  SOCIAL_SECURITY: 'Direito Previdenciário',
  FAMILY: 'Direito de Família',
  MARITIME: 'Direito Marítimo',
  CRIMINAL: 'Direito Penal',
  TAX: 'Direito Tributário',
  ENVIRONMENTAL: 'Direito Ambiental',
  ADMINISTRATIVE: 'Direito Administrativo',
  CORPORATE: 'Direito Empresarial',
  CHILDREN_AND_ADOLESCENT: 'Direito da Criança e do Adolescente',
  DISABILITY_RIGHTS: 'Direito das Pessoas com Deficiência',
  EDUCATIONAL: 'Direito Educacional',
  INTERNATIONAL: 'Direito Internacional',
  INTERNATIONAL_LAW: 'Direito Internacional',
  FINANCIAL: 'Direito Financeiro',
  FINANCIAL_CRIMES: 'Crimes Financeiros',
  CRIMINAL_FINANCIAL: 'Direito Penal Econômico',
  HUMAN_RIGHTS: 'Direitos Humanos',
  INTELLECTUAL_PROPERTY: 'Propriedade Intelectual',
  REAL_ESTATE: 'Direito Imobiliário',
  OTHER: 'Geral / Outros',
};

export const formatAreaLabel = (area: string): string =>
  AREA_LABELS[area] ?? area.charAt(0).toUpperCase() + area.slice(1).toLowerCase().replace(/_/g, ' ');

export const AGENT_SPEC_MAP: Record<string, string> = {
  LABOR: 'Trabalhista',
  CONSUMER: 'Consumerista',
  CIVIL: 'Civilista',
  FAMILY: 'Família',
  CRIMINAL: 'Criminal',
  TAX: 'Tributarista',
};
