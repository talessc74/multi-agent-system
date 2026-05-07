'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Loading() {
  const router = useRouter()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const causa = sessionStorage.getItem('lf_causa')
    const area = sessionStorage.getItem('lf_area')
    const perfil = sessionStorage.getItem('lf_perfil') ?? 'leigo'
    const arquivosRaw = sessionStorage.getItem('lf_arquivos')
    const arquivos = arquivosRaw ? (JSON.parse(arquivosRaw) as unknown[]) : []

    if (!causa || !area) {
      router.replace('/causa')
      return
    }

    async function executar() {
      const simRes = await fetch('/api/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ causa, area, perfil, arquivos }),
      })
      if (!simRes.ok) throw new Error('Falha na simulação')
      const resultado = await simRes.json() as {
        peticaoFinal: string
        sentencaFinal: string
        rodadas: unknown[]
        area: string
      }
      sessionStorage.setItem('lf_resultado', JSON.stringify(resultado))

      const laudoRes = await fetch('/api/laudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peticaoFinal: resultado.peticaoFinal,
          sentencaFinal: resultado.sentencaFinal,
          area,
          perfil,
        }),
      })
      if (!laudoRes.ok) throw new Error('Falha na geração do laudo')
      const laudo = await laudoRes.json()
      sessionStorage.setItem('lf_laudo', JSON.stringify(laudo))

      router.push('/resultado')
    }

    executar().catch((e: Error) => {
      sessionStorage.setItem('lf_erro', e.message || 'Erro desconhecido')
      router.replace('/causa')
    })
  }, [router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-navy-deep px-6">
      <div className="flex flex-col items-center gap-8 text-center max-w-sm">

        <span className="font-serif text-2xl font-bold tracking-tight text-white">
          Lex<span className="text-lex-cyan">Forum</span>
        </span>

        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-lex-cyan animate-spin" />

        <div className="space-y-2">
          <p className="font-sans text-base font-semibold text-white">
            Simulação em andamento…
          </p>
          <p className="font-sans text-sm text-white/40 leading-relaxed">
            Agentes especializados estão analisando sua causa.
            <br />
            Isso pode levar alguns segundos.
          </p>
        </div>

      </div>
    </main>
  )
}
