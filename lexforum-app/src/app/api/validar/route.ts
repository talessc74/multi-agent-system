import { NextRequest, NextResponse } from 'next/server'

// TODO: validar causa recebida — checar comprimento mínimo, detectar categoria,
//       sanitizar input antes de passar para /api/simular
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body.causa !== 'string') {
    return NextResponse.json({ error: 'Campo "causa" obrigatório.' }, { status: 400 })
  }

  return NextResponse.json(
    { ok: false, message: 'Rota /api/validar ainda não implementada.' },
    { status: 501 },
  )
}
