'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type ValidarResult = {
  completo: boolean
  perguntas: string[]
  resumo: string
  area: string
  area_label: string
  confianca: number
}

type Estado = 'carregando' | 'ok' | 'erro'

export default function Confirmacao() {
  const router = useRouter()
  const [causa, setCausa] = useState('')
  const [perfil, setPerfil] = useState<'leigo' | 'profissional'>('leigo')
  const [estado, setEstado] = useState<Estado>('carregando')
  const [validacao, setValidacao] = useState<ValidarResult | null>(null)
  const [erroMsg, setErroMsg] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('lf_causa')
    if (!stored) { router.replace('/causa'); return }
    setCausa(stored)

    const arquivosRaw = sessionStorage.getItem('lf_arquivos')
    const arquivos = arquivosRaw ? (JSON.parse(arquivosRaw) as unknown[]) : []

    fetch('/api/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ causa: stored, arquivos }),
    })
      .then((r) => r.json())
      .then((data: ValidarResult & { error?: string }) => {
        if (data.error) throw new Error(data.error)
        setValidacao(data)
        setEstado('ok')
      })
      .catch((e: Error) => {
        setErroMsg(e.message || 'Erro ao validar causa.')
        setEstado('erro')
      })
  }, [router])

  function handleConfirmar() {
    if (!validacao) return
    sessionStorage.setItem('lf_area', validacao.area)
    sessionStorage.setItem('lf_perfil', perfil)
    router.push('/loading')
  }

  return (
    <main className="min-h-screen flex flex-col bg-navy-deep">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-navy-deep/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/causa" className="font-sans text-sm text-white/50 hover:text-white transition-colors">
            ← Voltar
          </Link>
          <span className="font-serif text-xl font-bold tracking-tight text-white">
            Lex<span className="text-lex-cyan">Forum</span>
          </span>
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
              <span className="w-8 h-1.5 rounded-full bg-lex-cyan" />
              <span className="w-8 h-1.5 rounded-full bg-white/15" />
            </div>
            <span className="font-sans text-xs text-white/40 tracking-wide">
              Passo 2 de 3 · Confirmação da causa
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
              Confirmar e simular
            </h1>
            <p className="font-sans text-sm text-white/50 leading-relaxed">
              Revise as informações antes de iniciar a simulação.
            </p>
          </div>

          {/* Causa */}
          <div className="bg-navy/60 border border-white/10 rounded-2xl px-5 py-4">
            <p className="font-sans text-xs text-white/35 uppercase tracking-widest mb-3">Sua causa</p>
            <p className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{causa}</p>
          </div>

          {/* Estado da validação */}
          {estado === 'carregando' && (
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-lex-cyan animate-spin" />
              <p className="font-sans text-sm text-white/50">Classificando sua causa…</p>
            </div>
          )}

          {estado === 'erro' && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-5 py-4">
              <p className="font-sans text-sm text-red-400">{erroMsg}</p>
            </div>
          )}

          {estado === 'ok' && validacao && (
            <div className="bg-navy/60 border border-lex-cyan/20 rounded-2xl px-5 py-4 space-y-3">
              <p className="font-sans text-xs text-white/35 uppercase tracking-widest">Análise preliminar</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-sans text-xs text-lex-cyan border border-lex-cyan/30 rounded-full px-3 py-1">
                  {validacao.area_label}
                </span>
                <span className="font-sans text-xs text-white/40">
                  {Math.round(validacao.confianca * 100)}% confiança
                </span>
              </div>
              <p className="font-sans text-sm text-white/70 leading-relaxed">{validacao.resumo}</p>
              {!validacao.completo && validacao.perguntas.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-white/5">
                  <p className="font-sans text-xs text-yellow-400/80">
                    Para melhorar a simulação, considere informar:
                  </p>
                  <ul className="space-y-1">
                    {validacao.perguntas.map((q, i) => (
                      <li key={i} className="font-sans text-xs text-white/50">· {q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Perfil */}
          <div className="space-y-2">
            <p className="font-sans text-xs text-white/35 uppercase tracking-widest">Perfil do laudo</p>
            <div className="flex gap-2">
              {(['leigo', 'profissional'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPerfil(p)}
                  className={`font-sans text-xs px-4 py-1.5 rounded-full border transition-all duration-150 ${
                    perfil === p
                      ? 'border-lex-cyan text-lex-cyan'
                      : 'border-white/15 text-white/60 hover:border-lex-cyan/50 hover:text-lex-cyan'
                  }`}
                >
                  {p === 'leigo' ? 'Leigo' : 'Profissional'}
                </button>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleConfirmar}
              disabled={estado !== 'ok'}
              className={`font-sans font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 ${
                estado === 'ok'
                  ? 'bg-lex-cyan text-navy-deep hover:bg-lex-cyan-dark shadow-lg active:scale-95 cursor-pointer'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Iniciar simulação →
            </button>
            <Link
              href="/causa"
              className="font-sans text-sm text-white/50 hover:text-white text-center py-3 transition-colors"
            >
              ← Ajustar causa
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
