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

const MODEL_NAME = "gemini-2.0-flash";

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
    ? `Atuando como "Semente de Shaw" e "Especialista", crie um agente jurídico Advogado Especialista em ${area}. Perfil combativo, intelectual, focado em estratégia e que usa "Lawyer's Briefs" para evoluir a cada rodada.`
    : specificName 
      ? `Atuando como "Semente de Shaw" e "Especialista", crie um agente jurídico Juiz Específico focado no perfil/comarca de "${specificName}" (Área: ${area}). Ele NUNCA tem memória de rodadas passadas. Ele deve OBRIGATORIAMENTE escrever uma fundamentação jurídica técnica e detalhada para sua decisão e, somente ao final, incluir o JSON {"success_probability": int\_0\_100}.`
      : `Atuando como "Semente de Shaw" e "Especialista", crie um agente jurídico Juiz Genérico da área ${area}. Ele NUNCA tem memória de rodadas passadas. Ele deve OBRIGATORIAMENTE escrever uma fundamentação jurídica técnica e detalhada para sua decisão e, somente ao final, incluir o JSON {"success_probability": int\_0\_100}.`}
  
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
      name: isLawyer ? "Advogado Especialista" : "Magistrado",
      instruction: isLawyer 
        ? "Atue como um advogado sênior de elite focado em estratégia processual."
        : "Atue como um juiz técnico focado em jurisprudência e análise de probabilidade."
    };
  }
  const newAgent = {
    id: `DYN_${cacheKey}`,
    name: parsed.name || (isLawyer ? "Advogado Dinâmico" : "Juiz Dinâmico"),
    instruction: parsed.instruction || ""
  };

  dynamicAgents[cacheKey] = newAgent;
  return newAgent;
}

export async function simulateForumServer(
  caseDescription: string, 
  area: LegalArea, 
  attachments: Attachment[], 
  specificJudge: string | null
): Promise<SimulationResult> {
  const lawAgent = await getOrGenerateAgent("lawyer", area, null);
  const juiAgent = await getOrGenerateAgent("judge", area, specificJudge);

  const rounds: SimulationRound[] = [];
  let currentPetition = "";
  let currentJudgment = "";
  let allBriefs = "";
  let lastProb = 0;

  for (let i = 1; i <= 3; i++) {
    const lawPrompt = i === 1 
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

    const juiRes: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: `Julgue a seguinte petição: ${currentPetition}` }] }],
      config: {
        systemInstruction: juiAgent.instruction
      }
    });
    currentJudgment = juiRes.text || "";
    lastProb = extractProbability(currentJudgment);

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

    if (lastProb >= 95) break;
  }

  return { area, rounds, finalSuccessProbability: lastProb, lawyerAgentName: lawAgent.name, judgeAgentName: juiAgent.name };
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
