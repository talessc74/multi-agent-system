import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1200

// ─── System prompts ──────────────────────────────────────────────────────────

const ADVOGADO_CONSUMERISTA = `Você é um advogado especialista em Direito do Consumidor, com domínio profundo do CDC, Lei 9.099/1995 e jurisprudência do STJ. Seu objetivo é elaborar petições iniciais precisas e persuasivas.

Ao redigir a petição:
1. Identifique a relação de consumo e classifique a violação (vício, fato do produto, cláusula abusiva, prática abusiva).
2. Fundamente com artigos específicos do CDC e Súmulas do STJ pertinentes.
3. Requeira: reparação de danos materiais (se houver), danos morais devidamente quantificados e obrigações de fazer/não fazer aplicáveis.
4. Use linguagem técnica e direta — sem prolixidade.

Formato de saída: petição inicial estruturada com DOS FATOS, DO DIREITO, DOS PEDIDOS.`

const ADVOGADO_MANNRICH = `Você é um advogado especialista em Direito do Trabalho, com domínio da CLT, Convenções OIT e jurisprudência do TST/TRT. Seu objetivo é elaborar petições trabalhistas precisas e persuasivas.

Ao redigir a petição:
1. Identifique o vínculo empregatício e classifique os direitos violados.
2. Fundamente com artigos da CLT, Súmulas do TST e jurisprudência pertinente.
3. Requeira todos os direitos cabíveis: verbas rescisórias, FGTS + multa 40%, horas extras, danos morais trabalhistas, etc.
4. Use linguagem técnica e direta — sem prolixidade.

Formato de saída: petição inicial estruturada com DOS FATOS, DO DIREITO, DOS PEDIDOS.`

const JUIZ_JEC = `Você é um juiz do Juizado Especial Cível (JEC), especialista em Direito do Consumidor e causas de baixa complexidade. Analise exclusivamente a petição que lhe foi apresentada — sem qualquer referência a rodadas ou iterações anteriores.

Ao julgar:
1. Verifique competência (≤ 40 SM, matéria não excluída pelo Art. 3º Lei 9.099), pressupostos processuais e prazo decadencial/prescricional.
2. Analise os fatos alegados, a verossimilhança da prova e a fundamentação legal.
3. Aplique CDC, Lei 9.099/1995 e Súmulas do STJ/FONAJE.
4. Emita sentença com: fundamentação, dispositivo e dosimetria de eventual condenação.

OBRIGATÓRIO: encerre sua sentença com exatamente esta linha:
PERCENTUAL: [número inteiro de 0 a 100 indicando probabilidade de procedência do pedido do autor]`

const JUIZ_EVERTON = `Você é um juiz do TJPR/JEC, especialista em causas consumeristas e cíveis. Analise exclusivamente a petição que lhe foi apresentada — sem qualquer referência a rodadas ou iterações anteriores.

Ao julgar:
1. Verifique competência (JEC ≤ 40 SM, sem perícia complexa), pressupostos processuais e prazo.
2. Avalie a prova documental disponível, a natureza da violação e o dano alegado.
3. Aplique CDC, Lei 9.099/1995 e jurisprudência do STJ/TJPR.
4. Emita sentença com: fundamentação, dispositivo e valor da condenação (se procedente).

OBRIGATÓRIO: encerre sua sentença com exatamente esta linha:
PERCENTUAL: [número inteiro de 0 a 100 indicando probabilidade de procedência do pedido do autor]`

const JUIZA_ROSEMARIE = `Você é uma juíza do TRT-9 (Paraná), especialista em Direito do Trabalho, com foco em dispensa discriminatória, reintegração por cotas e rescisão indireta. Analise exclusivamente a petição que lhe foi apresentada — sem qualquer referência a rodadas ou iterações anteriores.

Ao julgar:
1. Verifique competência, vínculo empregatício e prazo prescricional (2 anos após extinção, créditos dos últimos 5 anos — CF Art. 7º, XXIX).
2. Identifique a vulnerabilidade do trabalhador e a norma protetiva incidente (Súmula 443 TST, CLT Art. 483, Lei 8.213/1991).
3. Distribua o ônus probatório e analise a força probante dos fatos alegados.
4. Emita sentença com: fundamentação, dispositivo e dosimetria.

OBRIGATÓRIO: encerre sua sentença com exatamente esta linha:
PERCENTUAL: [número inteiro de 0 a 100 indicando probabilidade de procedência do pedido do autor]`

// ─── Routing ─────────────────────────────────────────────────────────────────

type AgentPair = { advogadoSystem: string; juizSystem: string }

function rotear(area: string): AgentPair {
  switch (area) {
    case 'consumidor':
      return { advogadoSystem: ADVOGADO_CONSUMERISTA, juizSystem: JUIZ_EVERTON }
    case 'trabalhista':
      return { advogadoSystem: ADVOGADO_MANNRICH, juizSystem: JUIZA_ROSEMARIE }
    default:
      return { advogadoSystem: ADVOGADO_CONSUMERISTA, juizSystem: JUIZ_JEC }
  }
}

// ─── Tipos e helpers ──────────────────────────────────────────────────────────

type ArquivoInput = { nome: string; tipo: string; base64: string }

const IMAGENS_SUPORTADAS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type ImageMime = (typeof IMAGENS_SUPORTADAS)[number]

function buildUserContent(
  texto: string,
  arquivos: ArquivoInput[],
): string | Anthropic.ContentBlockParam[] {
  if (!arquivos.length) return texto

  const blocks: Anthropic.ContentBlockParam[] = []

  for (const arq of arquivos) {
    if (IMAGENS_SUPORTADAS.includes(arq.tipo as ImageMime)) {
      blocks.push({
        type: 'image',
        source: { type: 'base64', media_type: arq.tipo as ImageMime, data: arq.base64 },
      } as Anthropic.ImageBlockParam)
    } else if (arq.tipo === 'application/pdf') {
      blocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: arq.base64 },
      } as Anthropic.DocumentBlockParam)
    }
  }

  blocks.push({ type: 'text', text: texto })
  return blocks
}

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
}

function extractPercentual(sentenca: string): number {
  const match = sentenca.match(/PERCENTUAL[^0-9]*(\d+)/i)
  if (!match) return 0
  return Math.min(100, Math.max(0, parseInt(match[1], 10)))
}

// ─── Agent calls ─────────────────────────────────────────────────────────────

async function chamarAdvogado(
  system: string,
  causa: string,
  peticaoAnterior?: string,
  sentencaAnterior?: string,
  arquivos?: ArquivoInput[],
): Promise<string> {
  let userContent: string | Anthropic.ContentBlockParam[]

  if (peticaoAnterior && sentencaAnterior) {
    // Rodadas 2 e 3: só texto — advogado tem memória completa
    userContent = [
      `Causa original: ${causa}`,
      '',
      `Sua petição anterior:\n${peticaoAnterior}`,
      '',
      `Sentença do juiz:\n${sentencaAnterior}`,
      '',
      'Reescreva uma nova petição mais forte, com argumentos aprimorados e melhor fundamentação jurídica. Escreva como se fosse a primeira e única petição — não mencione rodadas ou tentativas anteriores.',
    ].join('\n')
  } else {
    // Rodada 1: inclui arquivos como contexto multimodal se houver
    const texto = `Causa: ${causa}\n\nElabore a petição inicial.`
    userContent = arquivos?.length ? buildUserContent(texto, arquivos) : texto
  }

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: userContent }],
  })

  return extractText(msg)
}

async function chamarJuiz(system: string, peticao: string): Promise<string> {
  // Juiz recebe APENAS a petição atual — sem histórico de rodadas
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: peticao }],
  })

  return extractText(msg)
}

// ─── Route ───────────────────────────────────────────────────────────────────

type Rodada = { numero: number; peticao: string; sentenca: string; percentual: number }

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body.causa !== 'string' || typeof body.area !== 'string') {
    return NextResponse.json(
      { error: 'Campos "causa" e "area" são obrigatórios.' },
      { status: 400 },
    )
  }

  const { causa, area, perfil, contextoArquivos, arquivos } = body as {
    causa: string
    area: string
    perfil?: string
    contextoArquivos?: string
    arquivos?: ArquivoInput[]
  }

  const causaCompleta = [
    causa,
    perfil ? `Perfil do cliente: ${perfil}` : null,
    contextoArquivos ? `Documentos mencionados: ${contextoArquivos}` : null,
  ]
    .filter(Boolean)
    .join('\n\n')

  const { advogadoSystem, juizSystem } = rotear(area)

  const rodadas: Rodada[] = []
  let peticaoAtual = ''
  let sentencaAtual = ''
  let percentualAtual = 0

  for (let i = 1; i <= 3; i++) {
    peticaoAtual = await chamarAdvogado(
      advogadoSystem,
      causaCompleta,
      i > 1 ? peticaoAtual : undefined,
      i > 1 ? sentencaAtual : undefined,
      i === 1 ? (arquivos ?? []) : undefined, // arquivos apenas na rodada 1
    )

    sentencaAtual = await chamarJuiz(juizSystem, peticaoAtual)
    percentualAtual = extractPercentual(sentencaAtual)

    rodadas.push({ numero: i, peticao: peticaoAtual, sentenca: sentencaAtual, percentual: percentualAtual })

    if (percentualAtual >= 95) break
  }

  return NextResponse.json({
    peticaoFinal: peticaoAtual,
    sentencaFinal: sentencaAtual,
    rodadas,
    area,
  })
}
