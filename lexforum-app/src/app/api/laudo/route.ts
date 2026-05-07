import { NextRequest, NextResponse } from 'next/server'

// TODO: gerar laudo completo em PDF ou Markdown a partir do resultado armazenado,
//       retornar como download ou URL assinada
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body.resultado !== 'string') {
    return NextResponse.json({ error: 'Campo "resultado" obrigatório.' }, { status: 400 })
  }

  return NextResponse.json(
    { ok: false, message: 'Rota /api/laudo ainda não implementada.' },
    { status: 501 },
  )
}
