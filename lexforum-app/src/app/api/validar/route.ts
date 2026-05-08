import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const MODEL = 'gemini-2.0-flash'

const SYSTEM_PROMPT = `IMPORTANTE: Retorne APENAS o JSON puro. Sem markdown. Sem texto antes ou depois. Sem \`\`\`json. Comece com { e termine com }.

Você é um classificador jurídico especializado. Analise a descrição de uma causa e retorne SOMENTE um objeto JSON válido, sem texto adicional, markdown ou explicações.

O JSON deve ter exatamente esta estrutura:
{
  "completo": boolean,
  "perguntas": string[],
  "resumo": string,
  "area": string,
  "area_label": string,
  "confianca": number
}

Campos:
- completo: true se a causa tem informações suficientes para simulação (mínimo: partes envolvidas, fato principal, pedido).
- perguntas: lista de perguntas necessárias se completo=false. Lista vazia se completo=true.
- resumo: resumo objetivo em 1–2 frases da causa descrita.
- area: código interno da área jurídica. Valores permitidos: "consumidor", "trabalhista", "civel", "criminal", "familia", "previdenciario", "tributario", "administrativo", "outro".
- area_label: nome legível da área. Ex: "Direito do Consumidor", "Direito Trabalhista".
- confianca: número de 0 a 1 indicando sua confiança na classificação.`

type ArquivoInput = { nome: string; tipo: string; base64: string }

const IMAGENS_SUPORTADAS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type ImageMime = (typeof IMAGENS_SUPORTADAS)[number]

function buildParts(causa: string, arquivos: ArquivoInput[]): string | Part[] {
  if (!arquivos.length) return `Causa: ${causa}`

  const parts: Part[] = []

  for (const arq of arquivos) {
    if (IMAGENS_SUPORTADAS.includes(arq.tipo as ImageMime) || arq.tipo === 'application/pdf') {
      parts.push({ inlineData: { mimeType: arq.tipo, data: arq.base64 } })
    }
  }

  parts.push({ text: `Causa: ${causa}` })
  return parts
}

function parseJsonRobust(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    // continua
  }

  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as Record<string, unknown>
  } catch {
    // continua
  }

  try {
    const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    return JSON.parse(stripped) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body.causa !== 'string') {
    return NextResponse.json({ error: 'Campo "causa" obrigatório.' }, { status: 400 })
  }

  const { causa, arquivos } = body as { causa: string; arquivos?: ArquivoInput[] }

  if (causa.trim().length < 10) {
    return NextResponse.json({ error: 'Causa muito curta. Descreva com mais detalhes.' }, { status: 422 })
  }

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
  })

  const content = buildParts(causa, arquivos ?? [])
  const result = await model.generateContent(content)
  const rawText = result.response.text()

  console.error('RAW VALIDAR:', rawText)

  const parsed = parseJsonRobust(rawText)

  if (!parsed) {
    return NextResponse.json({
      completo: true,
      perguntas: [],
      resumo: 'Causa recebida e classificada.',
      area: 'generico',
      area_label: 'Juizado Especial Cível',
      confianca: 0.7,
    })
  }

  return NextResponse.json(parsed)
}
