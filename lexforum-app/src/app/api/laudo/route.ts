import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 1024

// ─── System prompts ──────────────────────────────────────────────────────────

const SYSTEM_LEIGO = `Gere um laudo em linguagem simples com estes campos obrigatórios em ordem:
VEREDICTO: ALTA / MÉDIA / BAIXA CHANCE DE ÊXITO
PERCENTUAL: [número]%
RESUMO_CASO: [2-3 frases simples]
FUNDAMENTOS: [3-5 razões numeradas em linguagem simples]
VALOR_CAUSA: [valor estimado + juros se aplicável]
PONTOS_ATENCAO: [2-3 riscos em linguagem simples]
PROXIMOS_PASSOS: [4-5 passos numerados e concretos]
Retorne APENAS o laudo, sem introdução ou explicação.`

const SYSTEM_PROFISSIONAL = `Gere um laudo técnico-jurídico com estes campos obrigatórios em ordem:
VEREDICTO: [Procedente/Parcialmente Procedente/Improcedente]
PERCENTUAL: [número]%
TESE_RESUMIDA: [1 linha técnica]
QUALIFICACAO_PARTES: [autora, ré, natureza, valor, competência, prescrição, rito]
FUNDAMENTOS_JURIDICOS: [análise com artigos e jurisprudência STJ, numerada]
ESTRATEGIA_PROCESSUAL: [notificação, tutela, provas, tese defensiva]
VALOR_CAUSA: [principal + juros + correção + honorários + total]
PONTOS_ATENCAO: [fragilidades e mitigações]
ROTEIRO_PROCESSUAL: [passos numerados]
Retorne APENAS o laudo, sem introdução ou explicação.`

// ─── Helper ───────────────────────────────────────────────────────────────────

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (
    !body ||
    typeof body.peticaoFinal !== 'string' ||
    typeof body.sentencaFinal !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Campos "peticaoFinal" e "sentencaFinal" são obrigatórios.' },
      { status: 400 },
    )
  }

  const { peticaoFinal, sentencaFinal } = body as {
    peticaoFinal: string
    sentencaFinal: string
    area?: string
    perfil?: string
  }

  const userContent = `PETIÇÃO FINAL DO ADVOGADO:\n${peticaoFinal}\n\nSENTENÇA FINAL DO JUIZ:\n${sentencaFinal}`

  const [msgLeigo, msgProfissional] = await Promise.all([
    client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_LEIGO,
      messages: [{ role: 'user', content: userContent }],
    }),
    client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROFISSIONAL,
      messages: [{ role: 'user', content: userContent }],
    }),
  ])

  return NextResponse.json({
    leigo: extractText(msgLeigo),
    profissional: extractText(msgProfissional),
  })
}
