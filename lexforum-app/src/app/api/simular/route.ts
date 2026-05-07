import { NextRequest, NextResponse } from 'next/server'

// TODO: orquestrar agentes jurídicos (advogado, juiz, revisor) via Claude API,
//       montar transcript do fórum e retornar resultado estruturado
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body.causa !== 'string') {
    return NextResponse.json({ error: 'Campo "causa" obrigatório.' }, { status: 400 })
  }

  return NextResponse.json(
    { ok: false, message: 'Rota /api/simular ainda não implementada.' },
    { status: 501 },
  )
}
