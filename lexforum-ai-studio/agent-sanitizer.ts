// Filtro de defesa-em-profundidade para o agente jurídico que a Especialista V2
// gera em agent-creator.ts. A instrução "nunca inclua campos 'kernel' ou
// identificadores internos" (ver ESPECIALISTA_V2 / generateAgent) é só texto de
// prompt — o Gemini pode não seguir 100% das vezes. Este módulo é a barreira de
// código correspondente: roda sobre o JSON já parseado, antes de ele ser usado
// como conteúdo do agente (e persistido no Firestore em agent-resolver.ts).

const INTERNAL_IDENTIFIER_PATTERNS: RegExp[] = [
  /auditor\s*kern/i,
  /0xf1/i,
  /shaw_auditor_kern/i,
  /arquiteto especialista/i,
];

const FORBIDDEN_KEYS = new Set(['kernel']);

export interface SanitizeResult {
  agente: any;
  leaksFound: string[];
}

function sanitizeValue(value: any, path: string, leaksFound: string[]): any {
  if (Array.isArray(value)) {
    return value.map((item, i) => sanitizeValue(item, `${path}[${i}]`, leaksFound));
  }

  if (value !== null && typeof value === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
        leaksFound.push(`${path}.${key} (campo interno proibido pela própria instrução da Especialista)`);
        continue;
      }
      clean[key] = sanitizeValue(v, `${path}.${key}`, leaksFound);
    }
    return clean;
  }

  if (typeof value === 'string' && INTERNAL_IDENTIFIER_PATTERNS.some((re) => re.test(value))) {
    leaksFound.push(`${path} (identificador interno do sistema criador vazou no valor: "${value}")`);
    return '[REDIGIDO: identificador interno do sistema criador removido]';
  }

  return value;
}

/**
 * Remove, recursivamente, campos e valores que vazam a identidade interna do
 * sistema criador (Especialista V2 / "Auditor Kern 0xF1") de um agente jurídico
 * gerado. Retorna o objeto limpo e a lista do que foi encontrado/removido, para
 * quem chama decidir se loga, alerta ou apenas segue com o valor já limpo.
 */
export function sanitizeGeneratedAgent(agente: any): SanitizeResult {
  const leaksFound: string[] = [];
  const clean = sanitizeValue(agente, 'agente', leaksFound);
  return { agente: clean, leaksFound };
}
