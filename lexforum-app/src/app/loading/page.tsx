'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Loading() {
  const router = useRouter()

  useEffect(() => {
    const causa = sessionStorage.getItem('causa')
    if (!causa) {
      router.replace('/causa')
      return
    }

    // TODO: chamar /api/simular e aguardar resposta
    // Ao concluir: salvar resultado em sessionStorage e redirecionar para /resultado
  }, [router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-navy-deep px-6">

      <div className="flex flex-col items-center gap-8 text-center max-w-sm">

        {/* Logotipo */}
        <span className="font-serif text-2xl font-bold tracking-tight text-white">
          Lex<span className="text-lex-cyan">Forum</span>
        </span>

        {/* Spinner — TODO: substituir por animação final */}
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-lex-cyan animate-spin" />

        {/* Mensagem */}
        <div className="space-y-2">
          <p className="font-sans text-base font-semibold text-white">
            Simulando o fórum jurídico…
          </p>
          <p className="font-sans text-sm text-white/40 leading-relaxed">
            Agentes especializados estão analisando sua causa.
            <br />
            Isso pode levar alguns segundos.
          </p>
        </div>

        {/* TODO: barra de progresso com etapas dos agentes */}

      </div>

    </main>
  )
}
