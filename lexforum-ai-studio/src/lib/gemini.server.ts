import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { LegalArea, SimulationRound, SimulationResult, ReportContent, Attachment } from "../types";

// server-side only
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const MODEL_NAME = "gemini-2.5-flash";

const dynamicAgents: Record<string, { id: string, name: string, instruction: string }> = {};

export function extractProbability(text: string): number {
  if (!text) return 50;
  const match = text.match(/{\s*"success_probability"\s*:\s*(\d+)\s*}/);
  if (match) return parseInt(match[1]);
  return 50;
}

function prepareParts(text: string, attachments: Attachment[] = []) {
  const parts: any[] = [{ text }];
  attachments.forEach(att => {
    if (att.type.startsWith('image/') || att.type === 'application/pdf') {
      const base64Data = att.data.split(',')[1];
      if (base64Data) {
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: att.type
          }
        });
      }
    }
  });
  return parts;
}

export async function validateCausaServer(caseDescription: string, attachments: Attachment[]) {
  const contents = prepareParts(
    `Analise a seguinte causa jurídica (incluindo documentos anexos).
    1. Identifique o ramo do direito brasileiro mais específico aplicável ao caso. Exemplos: CONSUMER, LABOR, CIVIL, FAMILY, SOCIAL_SECURITY, MARITIME, CRIMINAL, TAX, ENVIRONMENTAL, ADMINISTRATIVE, CORPORATE — ou qualquer outro ramo pertinente. Retorne em inglês, maiúsculas, sem espaços.
    2. Verifique se o usuário mencionou um juiz, vara ou comarca específica no relato ou nos documentos. Se sim, extraia, senão null.
    3. Crie um resumo conciso em um ou dois parágrafos do que você entendeu ser o núcleo central do problema/causa. IMPORTANTE: responda SEMPRE em português brasileiro, independentemente do idioma em que a causa foi redigida.
    4. Identifique quem é o usuário nesta ação judicial: se ele é quem MOVE a ação (polo ativo/autor) ou quem RESPONDE à ação (polo passivo/réu). Retorne 'AUTOR' ou 'REU'.
    5. Se houver documentos anexos, informe se você conseguiu extrair conteúdo útil deles (true = conteúdo legível e relevante extraído; false = documento ilegível, escaneado sem OCR, imagem de baixa qualidade ou sem conteúdo utilizável). Se não houver documentos, retorne null.

    Causa: ${caseDescription}`,
    attachments
  );

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: contents }],
    config: {
      // Validação/Relatório: máxima previsibilidade
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING, description: "Brazilian legal branch in English uppercase (e.g. CONSUMER, LABOR, CIVIL, MARITIME, CRIMINAL, TAX, ENVIRONMENTAL, ADMINISTRATIVE, CORPORATE, FAMILY, SOCIAL_SECURITY, or any other)" },
          specificJudge: { type: Type.STRING },
          summary: { type: Type.STRING },
          detectedProfile: { type: Type.STRING },
          userPole: { type: Type.STRING, description: "AUTOR se o usuário move a ação, REU se o usuário responde à ação" },
          documentsReadable: { type: Type.BOOLEAN, nullable: true, description: "true se documentos anexos tinham conteúdo utilizável, false se ilegíveis/sem OCR, null se nenhum documento foi enviado" }
        },
        required: ["area", "summary", "detectedProfile", "userPole"]
      }
    }
  });

  const text = response.text || "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Gemini Parse Error:", e, "Text:", text);
  }

  return {
    area: (parsed.area?.toUpperCase() as LegalArea) || LegalArea.OTHER,
    specificJudge: parsed.specificJudge || null,
    summary: parsed.summary || null,
    detectedProfile: (parsed.detectedProfile === 'profissional' ? 'profissional' : 'leigo') as 'leigo' | 'profissional',
    userPole: (parsed.userPole === 'REU' ? 'REU' : 'AUTOR') as 'AUTOR' | 'REU',
    documentsReadable: parsed.documentsReadable ?? null
  };
}

async function getOrGenerateAgent(type: "lawyer" | "judge", area: string, specificName: string | null) {
  let cacheKey = `${type}_${area}`;
  if (type === "judge" && specificName) cacheKey = `judge_specific_${area}_${specificName}`;

  if (dynamicAgents[cacheKey]) return dynamicAgents[cacheKey];

  const isLawyer = type === "lawyer";
  const prompt = `Você é um arquiteto de agentes jurídicos do EAI?. Sua tarefa é criar um agente jurídico especializado.
  ${isLawyer 
    ? `Advogado Especializado em ${area}. Perfil intelectual, focado em construir argumentos sólidos e desenvolver a tese jurídica a cada rodada, usando "Lawyer's Briefs" para evoluir sua estratégia.`
    : specificName
      ? `Juiz Específico focado no perfil/comarca de "${specificName}" (Área: ${area}). ATENÇÃO: Este agente é especializado EXCLUSIVAMENTE na área ${area}. Nunca simule juiz de área diferente. Nunca mencione varas cíveis, JEC, TJPR ou qualquer jurisdição incompatível com a área ${area}. Ele NUNCA tem memória de rodadas passadas. Ele deve OBRIGATORIAMENTE escrever uma fundamentação jurídica técnica e detalhada, ponderando os argumentos apresentados, e somente ao final incluir o JSON {"success_probability": int\_0\_100}.`
      : `Juiz Especializado EXCLUSIVAMENTE na área ${area}. ATENÇÃO CRÍTICA: Este agente deve atuar SOMENTE como magistrado da área ${area}. Nunca simule juiz de área diferente. Se a área for LABOR, atue como Juiz do Trabalho. Se for CONSUMER, atue como Juiz Consumerista. Se for CIVIL, atue como Juiz Cível. Nunca mencione jurisdição incompatível com a área solicitada. Ele NUNCA tem memória de rodadas passadas. Ele deve OBRIGATORIAMENTE escrever uma fundamentação jurídica técnica e detalhada, avaliando e ponderando os argumentos apresentados, e somente ao final incluir o JSON {"success_probability": int\_0\_100}.`}
  
  Retorne APENAS um JSON válido com "name" e "instruction" (prompt detalhado do agente).`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      // Geração de agente: criativo mas controlado
      temperature: 0.4,
      responseMimeType: "application/json"
    },
  });

  const text = response.text || "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Agent Gen Parse Error:", e, "Text:", text);
    parsed = {
      name: isLawyer ? "Advogado Especializado" : "Magistrado Especializado",
      instruction: isLawyer 
        ? "Atue como um advogado sênior de elite focado em estratégia processual."
        : "Atue como um juiz técnico focado em jurisprudência e análise de probabilidade."
    };
  }
  const newAgent = {
    id: `DYN_${cacheKey}`,
    name: isLawyer
      ? `Advogado ${area === "LABOR" ? "Trabalhista" : area === "CONSUMER" ? "Consumerista" : area === "CIVIL" ? "Civilista" : "Especializado"}`
      : `Magistrado ${area === "LABOR" ? "Trabalhista" : area === "CONSUMER" ? "Consumerista" : area === "CIVIL" ? "Cível" : "Especializado"}`,
    instruction: parsed.instruction || ""
  };

  dynamicAgents[cacheKey] = newAgent;
  return newAgent;
}

export async function simulateForumServer(
  caseDescription: string,
  area: LegalArea,
  attachments: Attachment[],
  specificJudge: string | null,
  agentInstruction?: string,
  agentName?: string,
  lawyerInstruction?: string,
  mode: number = 1,
  defenseDescription: string = '',
  defenseAttachments: Attachment[] = [],
  onProgress?: (step: string, round: number, roundData?: SimulationRound) => void,
  userSide?: 'AUTHOR' | 'DEFENSE'
): Promise<SimulationResult> {
  let lawAgent: { id: string; name: string; instruction: string };
  if (lawyerInstruction) {
    lawAgent = {
      id: `REGISTRY_lawyer_${area}`,
      name: `Advogado ${area === "LABOR" ? "Trabalhista" : area === "CONSUMER" ? "Consumerista" : area === "CIVIL" ? "Civilista" : "Especializado"}`,
      instruction: lawyerInstruction,
    };
  } else {
    lawAgent = await getOrGenerateAgent("lawyer", area, null);
  }

  let judgeInstruction: string;
  let judgeName: string;
  if (agentInstruction) {
    judgeInstruction = agentInstruction;
    judgeName = agentName ?? specificJudge ?? `Juiz ${area}`;
  } else {
    const juiAgent = await getOrGenerateAgent("judge", area, specificJudge);
    judgeInstruction = juiAgent.instruction;
    judgeName = juiAgent.name;
  }

  // Force correct legal area — overrides any mismatch in a cached agent's instructions
  const areaDisplayName: Record<string, string> = {
    LABOR: 'Trabalhista',
    CONSUMER: 'do Consumidor',
    CIVIL: 'Cível',
    FAMILY: 'de Família',
    SOCIAL_SECURITY: 'Previdenciário',
  };
  const areaLabel = areaDisplayName[area] ?? 'Especializado';
  judgeInstruction = `INSTRUÇÃO VINCULANTE DE SESSÃO: Você atua como Magistrado de Direito ${areaLabel} nesta simulação. Julgue o caso aplicando as normas e jurisprudência do Direito ${areaLabel} brasileiro. Você DEVE emitir um veredito com success_probability numérico, independentemente de qualquer especialização anterior.\n\n${judgeInstruction}`;
  lawAgent.instruction = `INSTRUÇÃO VINCULANTE DE SESSÃO: Você atua como Advogado especializado em Direito ${areaLabel} nesta simulação. Elabore argumentos com base nas normas e jurisprudência do Direito ${areaLabel} brasileiro.\n\n${lawAgent.instruction}`;

  const rounds: SimulationRound[] = [];
  let currentPetition = "";
  let currentJudgment = "";
  let allBriefs = "";
  let lastProb = 0;

  if (mode === 4) {
    for (let i = 1; i <= 3; i++) {
      onProgress?.('WRITING', i);

      const userPetition = userSide === 'DEFENSE' ? defenseDescription : caseDescription;
      const staticSide = userSide === 'DEFENSE' ? caseDescription : defenseDescription;
      const userAtts = userSide === 'DEFENSE' ? defenseAttachments : attachments;

      const lawPrompt = i === 1
        ? `Melhore esta ${userSide === 'DEFENSE' ? 'contestação' : 'petição'} tornando-a mais forte tecnicamente: ${userPetition}`
        : `Sentença anterior: ${currentJudgment}\nBreves estratégicos acumulados: ${allBriefs}\nMelhore ainda mais: ${userPetition}`;

      const sideContext = userSide === 'DEFENSE'
        ? '\n\nATENÇÃO: Nesta simulação você está atuando EXCLUSIVAMENTE como advogado do RÉU (DEFESA). Sua função é defender os interesses do réu, contestar os argumentos do autor e construir a melhor estratégia de defesa possível. Nunca argumente pelo lado do autor.'
        : '\n\nATENÇÃO: Nesta simulação você está atuando EXCLUSIVAMENTE como advogado do AUTOR. Sua função é defender os interesses do autor e construir a melhor estratégia para procedência do pedido.';

      const lawRes = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts: prepareParts(lawPrompt, userAtts) }],
        config: { systemInstruction: lawAgent.instruction + sideContext }
      });
      currentPetition = lawRes.text || '';

      onProgress?.('JUDGING', i);

      const authorText = userSide === 'DEFENSE' ? staticSide : currentPetition;
      const defenseText = userSide === 'DEFENSE' ? currentPetition : staticSide;

      const juiPrompt = `Analise ambos os lados e emita veredito.\n\nPETIÇÃO DO AUTOR:\n${authorText}\n\nCONTESTAÇÃO DO RÉU:\n${defenseText}\n\nRetorne JSON:\n{"success_probability":<0-100>,"author_summary":"<resumo>","defense_summary":"<resumo>","judgment":"<veredito>"}`;

      const juiRes = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: juiPrompt }] }],
        config: { systemInstruction: judgeInstruction, responseMimeType: 'application/json' }
      });

      const juiText = juiRes.text || '{}';
      let juiParsed: any = {};
      try { juiParsed = JSON.parse(juiText); } catch {}
      currentJudgment = juiParsed.judgment || juiText;
      lastProb = juiParsed.success_probability ?? extractProbability(juiText);

      onProgress?.('REVIEWING', i);

      const briefRes4 = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: `Analise a petição e a sentença da rodada ${i} e gere um resumo conciso de argumentos e citações para o próximo round.\nPetição: ${currentPetition}\nSentença: ${currentJudgment}\nBreves Anteriores: ${allBriefs}` }] }],
        config: {
          systemInstruction: `Você é um Estrategista Jurídico. Sua tarefa é analisar o progresso de um caso e gerar um "Lawyer's Brief": um resumo conciso dos argumentos chave e citações recorrentes que foram bem-sucedidos ou que precisam ser reforçados. Este resumo será usado pelo advogado na próxima rodada.`
        }
      });
      const currentBrief4 = briefRes4.text || '';
      allBriefs += `\n--- Brief Rodada ${i} ---\n${currentBrief4}`;

      rounds.push({
        round: i,
        lawyerPetition: currentPetition,
        judgeJudgment: currentJudgment,
        successProbability: lastProb,
        lawyerBrief: currentBrief4,
      });

      onProgress?.('ROUND_DONE', i, rounds[rounds.length - 1]);
      if (lastProb >= 95) break;
    }
    return { area, rounds, finalSuccessProbability: lastProb,
             lawyerAgentName: lawAgent.name, judgeAgentName: judgeName };
  }

  const maxRounds = mode === 3 ? 1 : 3;

  for (let i = 1; i <= maxRounds; i++) {
    onProgress?.('WRITING', i);

    if (mode === 3) {
      onProgress?.('JUDGING', i);
      const juiPrompt = `Você recebeu a petição do Autor e a contestação do Réu. Analise ambos os lados de forma imparcial e emita um veredito técnico fundamentado.\n\nPETIÇÃO DO AUTOR:\n${caseDescription}\n\nCONTESTAÇÃO DO RÉU:\n${defenseDescription}\n\nRetorne um JSON com o seguinte formato:\n{\n  "success_probability": <0-100, chance de procedência do AUTOR>,\n  "author_summary": "<resumo em 1-2 frases do argumento central do Autor>",\n  "defense_summary": "<resumo em 1-2 frases do argumento central do Réu>",\n  "judgment": "<veredito técnico completo fundamentado em lei>"\n}`;
      const authorParts = prepareParts(juiPrompt, attachments);
      const defenseParts = defenseAttachments.length > 0 ? prepareParts('', defenseAttachments).slice(1) : [];
      const juiRes = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts: [...authorParts, ...defenseParts] }],
        config: { systemInstruction: judgeInstruction, responseMimeType: 'application/json' }
      });
      const juiText = juiRes.text || '{}';
      let juiParsed: any = {};
      try { juiParsed = JSON.parse(juiText); } catch {}
      currentJudgment = juiParsed.judgment || juiText;
      lastProb = juiParsed.success_probability ?? extractProbability(juiText);
      onProgress?.('REVIEWING', i);
      rounds.push({ round: i, lawyerPetition: caseDescription, judgeJudgment: currentJudgment, successProbability: lastProb, authorSummary: juiParsed.author_summary, defenseSummary: juiParsed.defense_summary });
      break;
    }

    const lawPrompt = mode === 2
      ? i === 1
        ? `Você é um advogado de defesa. Crie uma contestação técnica e robusta contra a seguinte acusação recebida pelo seu cliente: ${caseDescription}`
        : `Sentença anterior: ${currentJudgment}\nBreves estratégicos acumulados: ${allBriefs}\nRefine e fortaleça a contestação contra a acusação inicial: ${caseDescription}`
      : i === 1
        ? `Peticione para o seguinte caso inicial: ${caseDescription}`
        : `Sentença anterior: ${currentJudgment}\nBreves estratégicos acumulados: ${allBriefs}\nReescreva sua petição de forma muito mais forte para o caso: ${caseDescription}`;
    
    const lawRes: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: prepareParts(lawPrompt, attachments) }],
      config: {
        systemInstruction: lawAgent.instruction + (userSide === 'DEFENSE'
          ? '\n\nATENÇÃO: O usuário é o RÉU. Você está defendendo os interesses do réu. Nunca argumente pelo lado do autor.'
          : '\n\nATENÇÃO: O usuário é o AUTOR. Você está defendendo os interesses do autor. Nunca argumente pelo lado do réu.')
      }
    });
    currentPetition = lawRes.text || "";

    onProgress?.('DELIVERING', i);
    onProgress?.('JUDGING', i);
    const juiPromptText = mode === 2
      ? `Avalie tecnicamente a solidez dos argumentos de DEFESA apresentados. Retorne um JSON com: {"success_probability":<0-100>,"judgment":"<sua decisão completa aqui>"} onde success_probability é a probabilidade de êxito do RÉU (defesa), de 0 a 100.\n\nContestação: ${currentPetition}`
      : `Avalie tecnicamente a solidez dos argumentos apresentados. Retorne um JSON com: {"success_probability":<0-100>,"judgment":"<sua decisão completa aqui>"} onde success_probability é a probabilidade de êxito do AUTOR, de 0 a 100.\n\nPetição: ${currentPetition}`;
    const juiRes: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: juiPromptText }] }],
      config: {
        systemInstruction: judgeInstruction,
        responseMimeType: 'application/json'
      }
    });
    const juiText = juiRes.text || '{}';
    let juiParsed: any = {};
    try { juiParsed = JSON.parse(juiText); } catch {}
    currentJudgment = juiParsed.judgment || juiText;
    lastProb = typeof juiParsed.success_probability === 'number' ? juiParsed.success_probability : extractProbability(juiText);

    onProgress?.('REVIEWING', i);
    const briefRes: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: `Analise a petição e a sentença da rodada ${i} e gere um resumo conciso de argumentos e citações para o próximo round.\nPetição: ${currentPetition}\nSentença: ${currentJudgment}\nBreves Anteriores: ${allBriefs}` }] }],
      config: {
        systemInstruction: `Você é um Estrategista Jurídico. Sua tarefa é analisar o progresso de um caso e gerar um "Lawyer's Brief": um resumo conciso dos argumentos chave e citações recorrentes que foram bem-sucedidos ou que precisam ser reforçados. Este resumo será usado pelo advogado na próxima rodada.`
      }
    });
    const currentBrief = briefRes.text || "";
    allBriefs += `\n--- Brief Rodada ${i} ---\n${currentBrief}`;

    rounds.push({
      round: i,
      lawyerPetition: currentPetition,
      judgeJudgment: currentJudgment,
      successProbability: lastProb,
      lawyerBrief: currentBrief
    });

    onProgress?.('ROUND_DONE', i, rounds[rounds.length - 1]);

    if (lastProb >= 95) break;
  }

  return { area, rounds, finalSuccessProbability: lastProb, lawyerAgentName: lawAgent.name, judgeAgentName: judgeName };
}

export async function generateReportServer(lastPetition: string, lastJudgment: string): Promise<ReportContent> {
  const [laymanRes, profRes, summaryRes] = await Promise.all([
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: `Petição: ${lastPetition}\nSentença: ${lastJudgment}` }] }],
      config: {
        systemInstruction: "Você é um Consultor Jurídico sênior. Antes de redigir, identifique com precisão quem move a ação (Exequente/Autor) e quem é demandado (Executado/Réu) com base nos textos recebidos. Nunca inverta os polos processuais. Ao citar argumentos da parte contrária, use sempre conectores explícitos como 'A parte adversa alega que...' ou 'O argumento do Exequente, que não merece acolhimento, é que...'. Gere um laudo em linguagem LEIGA seguindo: 1. Veredito. 2. Pontos Fortes. 3. Riscos. 4. Passo a passo prático."
      }
    }),
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: `Petição: ${lastPetition}\nSentença: ${lastJudgment}` }] }],
      config: {
        systemInstruction: "Você é um Chief Legal Officer. Antes de redigir, identifique com precisão quem move a ação (Exequente/Autor) e quem é demandado (Executado/Réu) com base nos textos recebidos. Nunca inverta os polos processuais. Ao citar argumentos da parte contrária, use sempre conectores explícitos como 'A Exequente alega que...', 'O argumento da parte adversa, que não merece acolhimento, é que...'. Proibido parafrasear argumentos adversos sem identificá-los claramente como sendo da parte contrária. Gere um LAUDO ESTRATÉGICO seguindo: 1. Resultados. 2. Fundamentação. 3. Riscos. 4. Plano Estratégico."
      }
    }),
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: `Petição: ${lastPetition}\nAvaliação técnica: ${lastJudgment}` }] }],
      config: {
        systemInstruction: "Você é um organizador de informações jurídicas. Antes de redigir, identifique com precisão quem move a ação (Exequente/Autor) e quem é demandado (Executado/Réu) com base nos textos recebidos. Nunca inverta os polos processuais. Com base na petição e na avaliação técnica, organize um resumo claro e objetivo da causa para que o usuário possa apresentar a um advogado real. Use linguagem simples. Não use linguagem de petição ou peça processual. Estruture em: Situação relatada, Argumentos identificados, Pontos de atenção, Área jurídica identificada, Próximos passos."
      }
    })
  ]);

  return { layman: laymanRes.text || "", professional: profRes.text || "", causeSummary: summaryRes.text || "" };
}

export async function generateCounterHypothesesServer(
  petition: string,
  area: string,
  mode: number
): Promise<string[]> {
  const systemInstruction = mode === 2
    ? "Com base na defesa construída pelo Réu e nos argumentos identificados, gere 3 hipóteses plausíveis de contra-ataque que o Autor poderia apresentar. Cada hipótese deve ter no máximo 2 linhas em linguagem simples. Retorne APENAS um JSON válido com array de 3 strings, sem markdown, sem explicação, sem backticks."
    : "Com base nos fatos narrados pelo Autor e nos argumentos identificados, gere 3 hipóteses plausíveis de defesa que o Réu poderia apresentar. Cada hipótese deve ter no máximo 2 linhas em linguagem simples. Retorne APENAS um JSON válido com array de 3 strings, sem markdown, sem explicação, sem backticks. Exemplo: [\"hipótese 1\",\"hipótese 2\",\"hipótese 3\"]";

  const res = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: `Área: ${area}\n\nPetição/argumentos: ${petition}` }] }],
    config: { systemInstruction }
  });

  const raw = (res.text || '').trim();

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 3);
  } catch {
    // JSON parse failed — try regex extraction
    const matches = raw.match(/"([^"]+)"/g);
    if (matches && matches.length >= 3) {
      return matches.slice(0, 3).map(s => s.replace(/^"|"$/g, ''));
    }
  }

  return [];
}

export async function expandHypothesisServer(
  petition: string,
  hypothesis: string,
  area: string
): Promise<string> {
  const BLOCKED = [
    'ignore previous instructions',
    'system:',
    'assistant:',
    'user:',
    '<|',
    ']]',
  ];
  const sanitized = BLOCKED.reduce(
    (acc, token) => acc.split(token).join(''),
    hypothesis
  );

  const res = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: `Área: ${area}\n\nFatos do caso: ${petition}\n\nHipótese escolhida: ${sanitized}` }] }],
    config: {
      systemInstruction: "Com base nos fatos do caso e na hipótese escolhida pelo usuário, desenvolva o argumento completo do lado oposto para ser usado como Lado B na simulação bilateral. Linguagem jurídica clara. 2-3 parágrafos."
    }
  });

  return res.text || '';
}

export interface ChatTurn {
  role: 'user' | 'model';
  content: string;
}

export async function chatWithAgentServer(
  systemInstruction: string,
  history: ChatTurn[],
  newMessage: string
): Promise<string> {
  const contents = [
    ...history.map(turn => ({
      role: turn.role,
      parts: [{ text: turn.content }],
    })),
    { role: 'user' as const, parts: [{ text: newMessage }] },
  ];

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents,
    config: {
      systemInstruction,
      temperature: 0.6,
      maxOutputTokens: 4096,
    },
  });

  return response.text || '';
}

export async function simulateMode5Server(
  mode5Input: { subCase: 'RECURSO' | 'ACORDO'; caseDescription: string; sentencaOuProposta: string },
  area: LegalArea,
  attachments: Attachment[],
  specificJudge: string | null,
  agentInstruction?: string,
  agentName?: string,
  onProgress?: (step: string, data?: any) => void
): Promise<{ subCase: 'RECURSO' | 'ACORDO'; strategistAnalysis: string; recommendation: 'RECORRER' | 'ACEITAR' | 'NEGOCIAR'; successProbability: number; reasoning: string; judgeAgentName: string; tokenCount?: number }> {

  onProgress?.('ANALYZING');

  // Reutiliza o juiz da sessão ou gera um Juiz Estrategista
  let judgeInstruction: string;
  let judgeName: string;
  if (agentInstruction) {
    judgeInstruction = agentInstruction;
    judgeName = agentName ?? 'Juiz Estrategista';
  } else {
    const juiAgent = await getOrGenerateAgent('judge', area, specificJudge);
    judgeInstruction = juiAgent.instruction;
    judgeName = juiAgent.name;
  }

  const isRecurso = mode5Input.subCase === 'RECURSO';

  const basePrompt = isRecurso
    ? `Reflita sobre a sentença apresentada e avalie tecnicamente se vale recorrer.
     Considere: probabilidade de reforma, fundamentos jurídicos sólidos, custo-benefício processual.
     ATENÇÃO: Esta é uma simulação educativa — deixe isso explícito na sua análise.
     Retorne APENAS JSON válido.`
    : `Reflita sobre a proposta de acordo apresentada e avalie tecnicamente se deve ser aceita, negociada ou rejeitada em favor do julgamento.
     Considere: probabilidade de êxito em julgamento, valor da proposta vs risco, custo-benefício processual.
     ATENÇÃO: Esta é uma simulação educativa — deixe isso explícito na sua análise.
     Retorne APENAS JSON válido.`;

  const systemPrompt = judgeInstruction
    ? `${judgeInstruction}\n\n${basePrompt}`
    : `Você é um Juiz Estrategista sênior do EAI?.\n\n${basePrompt}`;

  const userPrompt = isRecurso
    ? `ÁREA JURÍDICA: ${area}
RELATO DO CASO: ${mode5Input.caseDescription}
SENTENÇA RECEBIDA: ${mode5Input.sentencaOuProposta}

Analise e retorne JSON:
{
  "recommendation": "RECORRER" | "NAO_RECORRER",
  "successProbability": <0-100, probabilidade de reforma da sentença em recurso>,
  "strategistAnalysis": "<análise completa em linguagem clara para leigos>",
  "reasoning": "<fundamentação jurídica técnica detalhada>",
  "simulationDisclaimer": "<aviso de que é simulação educativa>"
}

ESCALA DE REFERÊNCIA para successProbability:
0-20: reforma improvável — recomendar não recorrer
21-50: reforma possível com ressalvas — recorrer com cautela
51-75: bons fundamentos — recorrer
76-100: alta probabilidade de reforma — recurso é o caminho certo`
    : `ÁREA JURÍDICA: ${area}
RELATO DO CASO: ${mode5Input.caseDescription}
PROPOSTA DE ACORDO: ${mode5Input.sentencaOuProposta}

Analise e retorne JSON:
{
  "recommendation": "ACEITAR" | "NEGOCIAR" | "RECORRER",
  "successProbability": <0-100, probabilidade de êxito em julgamento caso rejeite o acordo>,
  "strategistAnalysis": "<análise completa em linguagem clara para leigos>",
  "reasoning": "<fundamentação jurídica técnica detalhada>",
  "simulationDisclaimer": "<aviso de que é simulação educativa>"
}

ESCALA DE REFERÊNCIA para successProbability (ACORDO):
0-30: julgamento desfavorável — aceitar o acordo
31-55: resultado incerto — negociar melhores termos
56-80: julgamento favorável — rejeitar e ir a julgamento
81-100: julgamento muito favorável — rejeitar, vantagem clara`;

  onProgress?.('JUDGING');

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: prepareParts(userPrompt, attachments) }],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json'
    }
  });

  const text = response.text || '{}';
  let parsed: any = {};
  try { parsed = JSON.parse(text); } catch (e) {
    console.error('Mode5 Parse Error:', e, 'Text:', text);
  }

  // Normaliza recommendation para os tipos esperados
  const rawRec = (parsed.recommendation || '').toUpperCase();
  const recommendation: 'RECORRER' | 'ACEITAR' | 'NEGOCIAR' =
    rawRec === 'ACEITAR' ? 'ACEITAR' :
    rawRec === 'NEGOCIAR' ? 'NEGOCIAR' : 'RECORRER';

  onProgress?.('DONE', {
    subCase: mode5Input.subCase,
    strategistAnalysis: parsed.strategistAnalysis || '',
    recommendation,
    successProbability: (parsed.successProbability != null && parsed.successProbability > 0) ? parsed.successProbability : 50,
    reasoning: parsed.reasoning || '',
    judgeAgentName: judgeName,
    tokenCount: response.usageMetadata?.totalTokenCount
  });

  return {
    subCase: mode5Input.subCase,
    strategistAnalysis: parsed.strategistAnalysis || '',
    recommendation,
    successProbability: (parsed.successProbability != null && parsed.successProbability > 0) ? parsed.successProbability : 50,
    reasoning: parsed.reasoning || '',
    judgeAgentName: judgeName,
    tokenCount: response.usageMetadata?.totalTokenCount
  };
}
