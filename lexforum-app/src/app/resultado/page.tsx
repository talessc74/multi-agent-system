'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Resultado() {
  const router = useRouter()
  const [resultado, setResultado] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('resultado')
    if (!stored) router.replace('/causa')
    else setResultado(stored)
  }, [router])

  function handleNovaSimulacao() {
    sessionStorage.removeItem('causa')
    sessionStorage.removeItem('resultado')
    router.push('/causa')
  }

  if (!resultado) return null

  return (
    <main className="min-h-screen flex flex-col bg-navy-deep">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-navy-deep/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-sans text-sm text-white/50 hover:text-white transition-colors"
          >
            ← Início
          </Link>
          <div className="flex flex-col items-center leading-none">
            <span className="font-serif text-xl font-bold tracking-tight text-white">
              Lex<span className="text-lex-cyan">Forum</span>
            </span>
          </div>
          <div className="w-16" />
        </div>
      </nav>

      {/* ── Conteúdo ── */}
      <div className="flex-1 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-8">

          {/* Indicador de passo */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-8 h-1.5 rounded-full bg-white/40" />
              <span className="w-8 h-1.5 rounded-full bg-white/40" />
              <span className="w-8 h-1.5 rounded-full bg-lex-cyan" />
            </div>
            <span className="font-sans text-xs text-white/40 tracking-wide">
              Passo 3 de 3 · Resultado da simulação
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
              Resultado do fórum
            </h1>
            <p className="font-sans text-sm text-white/50 leading-relaxed">
              Análise produzida pelos agentes especializados.
            </p>
          </div>

          {/* TODO: renderizar resultado estruturado (votos, fundamentos, dispositivo) */}
          <div className="bg-navy/60 border border-white/10 rounded-2xl px-5 py-4">
            <p className="font-sans text-xs text-white/35 uppercase tracking-widest mb-3">
              Laudo simulado
            </p>
            <p className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
              {resultado}
            </p>
          </div>

          {/* TODO: botão para baixar laudo completo via /api/laudo */}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleNovaSimulacao}
              className="font-sans font-semibold px-8 py-3.5 rounded-lg bg-lex-cyan text-navy-deep hover:bg-lex-cyan-dark shadow-lg hover:shadow-lex-cyan/30 hover:shadow-xl active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Nova simulação
            </button>
            <Link
              href="/"
              className="font-sans text-sm text-white/50 hover:text-white text-center py-3 transition-colors"
            >
              Voltar ao início
            </Link>
          </div>

          <p className="font-sans text-xs text-white/30 leading-relaxed">
            Esta simulação tem fins educativos e não substitui assessoria jurídica real.
          </p>

        </div>
      </div>

    </main>
  )
}
