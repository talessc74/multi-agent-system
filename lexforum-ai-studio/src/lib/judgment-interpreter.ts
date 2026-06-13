import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: { headers: { "User-Agent": "aistudio-build" } },
});

const MODEL_NAME = "gemini-2.5-flash";

export function buildInterpreterPrompt(
  judgment: string,
  userSide: "AUTHOR" | "DEFENSE"
): string {
  const sideLabel = userSide === "AUTHOR" ? "AUTOR" : "RÉU (DEFESA)";
  return (
    `Você é um intérprete de vereditos jurídicos.\n\n` +
    `Leia a sentença abaixo e determine exclusivamente a probabilidade de êxito da parte indicada.\n\n` +
    `SENTENÇA:\n${judgment}\n\n` +
    `PARTE PARA AVALIAR: ${sideLabel}\n\n` +
    `Retorne APENAS JSON: {"probabilidade": <número inteiro de 0 a 100 representando a chance de êxito do ${sideLabel}>}\n` +
    `Se a sentença for ambígua, infira pelo contexto. Nunca retorne null.`
  );
}

export async function interpretJudgmentForSide(
  judgment: string,
  userSide: "AUTHOR" | "DEFENSE"
): Promise<number> {
  const prompt = buildInterpreterPrompt(judgment, userSide);

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "Você é um intérprete de vereditos jurídicos. Sua única função é extrair a probabilidade de êxito de uma parte específica com base no texto da sentença fornecida. Retorne sempre um JSON válido com o campo 'probabilidade' como número inteiro entre 0 e 100. Nunca retorne null ou omita o campo.",
      responseMimeType: "application/json",
    },
  });

  const text = response.text || '{"probabilidade": 50}';
  try {
    const parsed = JSON.parse(text);
    const prob = parsed.probabilidade;
    if (typeof prob === "number" && prob >= 0 && prob <= 100) {
      return Math.round(prob);
    }
    console.warn('[JudgmentInterpreter] Campo probabilidade inválido:', parsed);
  } catch (e) {
    console.warn('[JudgmentInterpreter] Falha ao parsear resposta:', text.substring(0, 80));
  }

  return 50;
}
