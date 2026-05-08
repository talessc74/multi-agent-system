import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const MODEL = 'gemini-2.5-flash'
const MAX_TOKENS = 2048

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

  const [resultLeigo, resultProfissional] = await Promise.all([
    genAI
      .getGenerativeModel({ model: MODEL, systemInstruction: SYSTEM_LEIGO, generationConfig: { maxOutputTokens: MAX_TOKENS } })
      .generateContent(userContent),
    genAI
      .getGenerativeModel({ model: MODEL, systemInstruction: SYSTEM_PROFISSIONAL, generationConfig: { maxOutputTokens: MAX_TOKENS } })
      .generateContent(userContent),
  ])

  return NextResponse.json({
    leigo: resultLeigo.response.text(),
    profissional: resultProfissional.response.text(),
  })
}
