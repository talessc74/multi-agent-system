import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { LegalArea, SimulationRound, SimulationResult, ReportContent, Attachment } from "../types";

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

function extractProbability(text: string): number {
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
    1. Classifique a área como uma de: CONSUMER, LABOR, CIVIL, SOCIAL_SECURITY, FAMILY, OTHER.
    2. Verifique se o usuário mencionou um juiz, vara ou comarca específica no relato ou nos documentos. Se sim, extraia, senão null.
    3. Crie um resumo conciso em um ou dois parágrafos do que você entendeu ser o núcleo central do problema/causa.
    
    Causa: ${caseDescription}`,
    attachments
  );

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: contents }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING, description: "One of: CONSUMER, LABOR, CIVIL, SOCIAL_SECURITY, FAMILY, OTHER" },
          specificJudge: { type: Type.STRING },
          summary: { type: Type.STRING },
          detectedProfile: { type: Type.STRING }
        },
        required: ["area", "summary", "detectedProfile"]
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
    detectedProfile: (parsed.detectedProfile === 'profissional' ? 'profissional' : 'leigo') as 'leigo' | 'profissional'
  };
}

async function getOrGenerateAgent(type: "lawyer" | "judge", area: string, specificName: string | null) {
  let cacheKey = `${type}_${area}`;
  if (type === "judge" && specificName) cacheKey = `judge_specific_${specificName}`;

  if (dynamicAgents[cacheKey]) return dynamicAgents[cacheKey];

  const isLawyer = type === "lawyer";
  const prompt = `Você é o Especialista EAI? (Auditor Kern 0xF1). Sua tarefa é criar um agente jurídico com base nos axiomas do EAI?.
  ${isLawyer 
    ? `Advogado Especializado em ${area}. Perfil combativo, intelectual, focado em estratégia e que usa "Lawyer's Briefs" para evoluir a cada rodada.`
    : specificName 
      ? `Juiz Específico focado no perfil/comarca de "${specificName}" (Área: ${area}). Ele NUNCA tem memória de rodadas passadas. Ele deve OBRIGATORIAMENTE escrever uma fundamentação jurídica técnica e detalhada para sua decisão e, somente ao final, incluir o JSON {"success_probability": int\_0\_100}.`
      : `Juiz Especializado na área ${area}. Ele NUNCA tem memória de rodadas passadas. Ele deve OBRIGATORIAMENTE escrever uma fundamentação jurídica técnica e detalhada para sua decisão e, somente ao final, incluir o JSON {"success_probability": int\_0\_100}.`}
  
  Retorne APENAS um JSON válido com "name" e "instruction" (prompt detalhado do agente).`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { 
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
        : `Sentença anterior: ${currentJudgment}\nMelhore ainda mais: ${userPetition}`;

      const lawRes = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts: prepareParts(lawPrompt, userAtts) }],
        config: { systemInstruction: lawAgent.instruction }
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
      rounds.push({
        round: i,
        lawyerPetition: currentPetition,
        judgeJudgment: currentJudgment,
        successProbability: lastProb,
        authorSummary: juiParsed.author_summary,
        defenseSummary: juiParsed.defense_summary
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
        systemInstruction: lawAgent.instruction
      }
    });
    currentPetition = lawRes.text || "";

    onProgress?.('DELIVERING', i);
    onProgress?.('JUDGING', i);
    const juiRes: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: `Julgue a seguinte petição: ${currentPetition}` }] }],
      config: {
        systemInstruction: judgeInstruction
      }
    });
    currentJudgment = juiRes.text || "";
    lastProb = extractProbability(currentJudgment);

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
  const [laymanRes, profRes] = await Promise.all([
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: `Petição: ${lastPetition}\nSentença: ${lastJudgment}` }] }],
      config: {
        systemInstruction: "Você é um Consultor Jurídico sênior. Gere um laudo em linguagem LEIGA seguindo: 1. Veredito. 2. Pontos Fortes. 3. Riscos. 4. Passo a passo prático."
      }
    }),
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: `Petição: ${lastPetition}\nSentença: ${lastJudgment}` }] }],
      config: {
        systemInstruction: "Você é um Chief Legal Officer. Gere um LAUDO ESTRATÉGICO seguindo: 1. Resultados. 2. Fundamentação. 3. Riscos. 4. Plano Estratégico."
      }
    })
  ]);

  return { layman: laymanRes.text || "", professional: profRes.text || "" };
}

export async function simulateMode5Server(
  mode5Input: { subCase: 'RECURSO' | 'ACORDO'; caseDescription: string; sentencaOuProposta: string },
  area: LegalArea,
  attachments: Attachment[],
  specificJudge: string | null,
  agentInstruction?: string,
  agentName?: string,
  onProgress?: (step: string) => void
): Promise<{ subCase: 'RECURSO' | 'ACORDO'; strategistAnalysis: string; recommendation: 'RECORRER' | 'ACEITAR' | 'NEGOCIAR'; confidenceLevel: number; reasoning: string; judgeAgentName: string; tokenCount?: number }> {

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
    ? `Analise a sentença apresentada e avalie tecnicamente se vale recorrer.
     Considere: probabilidade de reforma, fundamentos jurídicos sólidos, custo-benefício processual.
     ATENÇÃO: Esta é uma simulação educativa — deixe isso explícito na sua análise.
     Retorne APENAS JSON válido.`
    : `Analise a proposta de acordo apresentada e avalie tecnicamente se deve ser aceita, negociada ou rejeitada em favor do julgamento.
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
         "confidenceLevel": <0-100>,
         "strategistAnalysis": "<análise completa em linguagem clara>",
         "reasoning": "<fundamentação jurídica técnica>",
         "simulationDisclaimer": "<aviso de que é simulação>"
       }`
    : `ÁREA JURÍDICA: ${area}
       RELATO DO CASO: ${mode5Input.caseDescription}
       PROPOSTA DE ACORDO: ${mode5Input.sentencaOuProposta}

       Analise e retorne JSON:
       {
         "recommendation": "ACEITAR" | "NEGOCIAR" | "RECORRER",
         "confidenceLevel": <0-100>,
         "strategistAnalysis": "<análise completa em linguagem clara>",
         "reasoning": "<fundamentação jurídica técnica>",
         "simulationDisclaimer": "<aviso de que é simulação>"
       }`;

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

  onProgress?.('DONE');

  // Normaliza recommendation para os tipos esperados
  const rawRec = (parsed.recommendation || '').toUpperCase();
  const recommendation: 'RECORRER' | 'ACEITAR' | 'NEGOCIAR' =
    rawRec === 'ACEITAR' ? 'ACEITAR' :
    rawRec === 'NEGOCIAR' ? 'NEGOCIAR' : 'RECORRER';

  return {
    subCase: mode5Input.subCase,
    strategistAnalysis: parsed.strategistAnalysis || '',
    recommendation,
    confidenceLevel: parsed.confidenceLevel ?? 50,
    reasoning: parsed.reasoning || '',
    judgeAgentName: judgeName,
    tokenCount: response.usageMetadata?.totalTokenCount
  };
}
