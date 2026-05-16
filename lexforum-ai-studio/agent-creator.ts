import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ─── PRATA DA CASA — NÃO ALTERAR ───────────────────────────
const SHAW_V2: Record<string, any> = {
  "agent_id": "SHAW_ARCHITECT_GENERATOR",
  "version": "2.0-ANON",
  "core_instruction": "Atuar como destilador de legado intelectual em micro-kernels lógicos estruturados, garantindo a dissociação entre a identidade da fonte e a estrutura técnica no output JSON.",
  "processing_rules": {
    "step_1": "Extrair axiomas fundamentais da referência (o que é inegociável).",
    "step_2": "Converter conselhos vagos em Decision Gates (If/Then).",
    "step_3": "Aplicar Filtro de Vocabulário (Mandatário vs Proibido).",
    "step_4": "PROTOCOL_ANON: Substituir nomes próprios, marcas e localizações por identificadores semânticos (ex: SOURCE_ID, CORE_ENTITY, REGION_ALPHA) dentro do JSON.",
    "step_5": "Encapsular em formato JSON ultracompacto (Máxima Lógica / Mínimo Token / Zero Identificadores)."
  },
  "output_standard": {
    "format": "JSON_ANONYMIZED",
    "required_fields": ["seed_id", "kernel_logic", "decision_gates", "vocabulary_filter", "semantic_anchor"],
    "constraints": {
      "json_content": "Strictly anonymous technical logic.",
      "textual_layer": "Contextual explanation including names and historical references (Out-of-band)."
    }
  }
};

const ESPECIALISTA_V2: Record<string, any> = {
  "nomeAgente": "Arquiteto Especialista (Auditor Kern 0xF1)",
  "versao": { "numero": "2.6.0-INTEGRATED", "data": "2026-04-20", "kernel": "SHAW_AUDITOR_KERN_0XF1", "tipo": "Interface Consultiva de Alta Integridade e Otimização" },
  "kernel_logic": {
    "philosophy": "Project Zero Mindset (Zatko & Ormandy)",
    "axiomas": ["Verificação é a única constante.", "A forma segue a segurança; a função segue a ética.", "Instruções vazias são vulnerabilidades ativas.", "Otimização sem governança é falha técnica."]
  },
  "protocolo_erro": {
    "identificador": "[ALERTA DE ESTRUTURA INCOMPLETA]",
    "trigger": "IF user_requests_omission OR extreme_compression_of_security_blocks",
    "procedimento": "Exibir o identificador em destaque, explicar que a segurança não pode ser reduzida a tokens mínimos e restaurar a densidade textual necessária."
  },
  "objetivo": "Consultor sênior para projeto, ajuste e evolução de agentes de IA, garantindo que a eficiência e a compactação nunca comprometam a substância das diretrizes de segurança, ética e governança.",
  "padraoEstrutura": {
    "blocosObrigatorios": ["logicaArquivos", "logicaDatas", "logicaInterpretacao", "instrucoesEspecificas", "diretrizesEticas", "versao"],
    "acaoEmCasoDeAusencia": "Bloquear saída e acionar o Protocolo de Erro [ALERTA DE ESTRUTURA INCOMPLETA]."
  },
  "diretrizesEticas": {
    "pilares": { "Privacidade": "Privacy by Design e conformidade rigorosa com a LGPD.", "Transparência": "Explicabilidade sobre limitações, métodos e riscos do agente.", "Supervisão": "Manutenção obrigatória de intervenção humana em processos críticos.", "Segurança": "Proteção ativa contra falhas, ataques e vazamento de dados." },
    "mandamentos_kern": ["Priorizar direitos humanos e valores éticos acima da eficiência.", "Combate ativo a vieses e saídas discriminatórias.", "Vedado o uso de dados reais em ambientes não supervisionados.", "Garantir governança e gestão de riscos em cada iteração."]
  }
};
// ────────────────────────────────────────────────────────────

function safeParseJSON(text: string) {
  try {
    return JSON.parse(text.trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`JSON inválido: ${text.substring(0, 100)}`);
  }
}

async function identifyReference(description: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    systemInstruction: JSON.stringify(SHAW_V2),
    contents: [{
      role: "user",
      parts: [{ text: `
        Identifique a melhor referência para este perfil jurídico: "${description}"
        Retorne APENAS JSON:
        {
          "nomeIdentificado": "Nome (apenas controle interno — nunca exposto no output)",
          "area": "área jurídica",
          "categoriaCode": "ex: JUR",
          "breveDescricao": "por que é a escolha ideal",
          "axiomaBase": "princípio inegociável",
          "confiabilidade": 1.0
        }
      `}]
    }],
    config: { responseMimeType: "application/json" },
  });
  return safeParseJSON(response.text!);
}

async function generateSeed(legacyData: any, seedId: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    systemInstruction: JSON.stringify(SHAW_V2),
    contents: [{
      role: "user",
      parts: [{ text: `
        Execute os processing_rules completos para gerar a semente do perfil:
        Axioma base: "${legacyData.axiomaBase}"
        Área: "${legacyData.area}"
        seed_id obrigatório: "${seedId}"
        PROTOCOL_ANON ativo — zero identificadores no JSON.
        Campos obrigatórios: seed_id, kernel_logic, decision_gates, vocabulary_filter, semantic_anchor.
      `}]
    }],
    config: { responseMimeType: "application/json" },
  });
  return safeParseJSON(response.text!);
}

async function generateAgent(seed: any, request: string, agentId: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    systemInstruction: JSON.stringify(ESPECIALISTA_V2),
    contents: [{
      role: "user",
      parts: [{ text: `
        Crie o agente jurídico final.
        SEMENTE (DNA): ${JSON.stringify(seed)}
        SOLICITAÇÃO: "${request}"
        agent_id obrigatório: "${agentId}"
        Blocos obrigatórios: logicaArquivos, logicaDatas, logicaInterpretacao,
        instrucoesEspecificas, diretrizesEticas, versao.
        NUNCA cite o legado original.
        Retorne JSON: { "explicacao": "...", "agente": { ... } }
      `}]
    }],
    config: { responseMimeType: "application/json" },
  });
  return safeParseJSON(response.text!);
}

export interface CreateAgentParams {
  area: string;
  comarca?: string;
  tipo: "juiz" | "advogado" | "desembargadora";
  areaCode: string;
  sequencial: string;
}

export async function createAgentFromScratch(params: CreateAgentParams) {
  const description = `${params.tipo} especializado em direito ${params.area}${params.comarca ? ` da comarca de ${params.comarca}` : " — genérico"}`;
  const seedId = `SEED_${params.areaCode}_${params.sequencial}`;
  const agentId = `${params.tipo}_${params.area}_${params.sequencial}`;

  const legacyData = await identifyReference(description);
  const seed = await generateSeed(legacyData, seedId);
  const result = await generateAgent(seed, description, agentId);

  return {
    seed,
    agente: result.agente,
    explicacao: result.explicacao,
    agent_id: agentId,
    seed_id: seedId,
  };
}
