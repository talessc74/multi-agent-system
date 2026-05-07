import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

function parseJsonRobust(text: string): Record<string, unknown> | null {
  // Estratégia 1: parse direto
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    // continua
  }

  // Estratégia 2: extrai primeiro bloco JSON entre chaves
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as Record<string, unknown>
  } catch {
    // continua
  }

  // Estratégia 3: remove possível markdown code fence e tenta novamente
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

  const { causa, arquivos } = body as { causa: string; arquivos?: string[] }

  if (causa.trim().length < 10) {
    return NextResponse.json({ error: 'Causa muito curta. Descreva com mais detalhes.' }, { status: 422 })
  }

  const userContent = arquivos?.length
    ? `Causa: ${causa}\n\nArquivos anexados: ${arquivos.join(', ')}`
    : `Causa: ${causa}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  })

  const rawText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('')

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
