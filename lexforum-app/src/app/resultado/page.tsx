'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Rodada = { numero: number; peticao: string; sentenca: string; percentual: number }
type SimularResult = { peticaoFinal: string; sentencaFinal: string; rodadas: Rodada[]; area: string }
type LaudoResult = { leigo: string; profissional: string }
type Section = { label: string; content: string; locked: boolean }

const LOCKED = new Set([
  'FUNDAMENTOS',
  'FUNDAMENTOS_JURIDICOS',
  'VALOR_CAUSA',
  'PROXIMOS_PASSOS',
  'ROTEIRO_PROCESSUAL',
  'ESTRATEGIA_PROCESSUAL',
])

const LABEL: Record<string, string> = {
  VEREDICTO: 'Veredicto',
  PERCENTUAL: 'Percentual',
  RESUMO_CASO: 'Resumo do caso',
  FUNDAMENTOS: 'Fundamentos',
  VALOR_CAUSA: 'Valor estimado',
  PONTOS_ATENCAO: 'Pontos de atenção',
  PROXIMOS_PASSOS: 'Próximos passos',
  TESE_RESUMIDA: 'Tese resumida',
  QUALIFICACAO_PARTES: 'Qualificação das partes',
  FUNDAMENTOS_JURIDICOS: 'Fundamentos jurídicos',
  ESTRATEGIA_PROCESSUAL: 'Estratégia processual',
  ROTEIRO_PROCESSUAL: 'Roteiro processual',
}

function parseLaudo(text: string): Section[] {
  const sections: Section[] = []
  let current: { label: string; lines: string[] } | null = null

  for (const line of text.split('\n')) {
    const match = line.match(/^([A-Z_]+):(.*)$/)
    if (match) {
      if (current) {
        sections.push({
          label: current.label,
          content: current.lines.join('\n').trim(),
          locked: LOCKED.has(current.label),
        })
      }
      current = { label: match[1], lines: [match[2]] }
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) {
    sections.push({
      label: current.label,
      content: current.lines.join('\n').trim(),
      locked: LOCKED.has(current.label),
    })
  }
  return sections
}

function Tarja({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="blur-sm select-none pointer-events-none">{children}</div>
      <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center">
        <span className="font-sans text-xs text-white/40">Disponível no laudo completo</span>
      </div>
    </div>
  )
}

export default function Resultado() {
  const router = useRouter()
  const [resultado, setResultado] = useState<SimularResult | null>(null)
  const [laudo, setLaudo] = useState<LaudoResult | null>(null)
  const [modo, setModo] = useState<'leigo' | 'profissional'>('leigo')
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    const r = sessionStorage.getItem('lf_resultado')
    const l = sessionStorage.getItem('lf_laudo')
    if (!r || !l) { router.replace('/causa'); return }
    try {
      setResultado(JSON.parse(r) as SimularResult)
      setLaudo(JSON.parse(l) as LaudoResult)
    } catch {
      router.replace('/causa')
    }
  }, [router])

  function handleNovaSimulacao() {
    ;['lf_causa', 'lf_perfil', 'lf_area', 'lf_resultado', 'lf_laudo', 'lf_erro'].forEach((k) =>
      sessionStorage.removeItem(k),
    )
    router.push('/causa')
  }

  if (!resultado || !laudo) return null

  const ultimaRodada = resultado.rodadas[resultado.rodadas.length - 1]
  const percentual = ultimaRodada?.percentual ?? 0
  const sections = parseLaudo(modo === 'leigo' ? laudo.leigo : laudo.profissional)
  const hasLocked = !unlocked && sections.some((s) => s.locked)

  return (
    <main className="min-h-screen flex flex-col bg-navy-deep">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-navy-deep/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-sans text-sm text-white/50 hover:text-white transition-colors">
            ← Início
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
              <span className="w-8 h-1.5 rounded-full bg-white/40" />
              <span className="w-8 h-1.5 rounded-full bg-lex-cyan" />
            </div>
            <span className="font-sans text-xs text-white/40 tracking-wide">
              Passo 3 de 3 · Resultado da simulação
            </span>
          </div>

          {/* Heading + badges */}
          <div className="space-y-4">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
              Resultado do fórum
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="font-sans text-sm font-semibold text-lex-cyan border border-lex-cyan/30 rounded-full px-4 py-1.5">
                {percentual}% de êxito
              </span>
              <span className="font-sans text-xs text-white/50 border border-white/10 rounded-full px-4 py-1.5">
                {resultado.area}
              </span>
              <span className="font-sans text-xs text-white/50 border border-white/10 rounded-full px-4 py-1.5">
                {resultado.rodadas.length} rodada{resultado.rodadas.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Toggle leigo / profissional */}
          <div className="flex gap-2">
            {(['leigo', 'profissional'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModo(m)}
                className={`font-sans text-xs px-4 py-1.5 rounded-full border transition-all duration-150 ${
                  modo === m
                    ? 'border-lex-cyan text-lex-cyan bg-lex-cyan/10'
                    : 'border-white/15 text-white/50 hover:border-lex-cyan/30'
                }`}
              >
                {m === 'leigo' ? 'Linguagem simples' : 'Técnico-jurídico'}
              </button>
            ))}
          </div>

          {/* Seções do laudo */}
          <div className="space-y-6">
            {sections.map((sec, i) => (
              <div key={i} className="space-y-1.5">
                <p className="font-sans text-xs text-white/35 uppercase tracking-widest">
                  {LABEL[sec.label] ?? sec.label.replace(/_/g, ' ')}
                </p>
                {sec.locked && !unlocked ? (
                  <Tarja>
                    <p className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                      {sec.content}
                    </p>
                  </Tarja>
                ) : (
                  <p className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {sec.content}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Decisão do juiz — sempre bloqueada até unlock */}
          <div className="space-y-1.5">
            <p className="font-sans text-xs text-white/35 uppercase tracking-widest">Decisão do juiz</p>
            {!unlocked ? (
              <Tarja>
                <p className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap bg-navy/60 border border-white/10 rounded-2xl px-5 py-4">
                  {resultado.sentencaFinal}
                </p>
              </Tarja>
            ) : (
              <p className="font-sans text-sm text-white/80 leading-relaxed whitespace-pre-wrap bg-navy/60 border border-white/10 rounded-2xl px-5 py-4">
                {resultado.sentencaFinal}
              </p>
            )}
          </div>

          {/* Ver laudo completo */}
          {hasLocked && (
            <button
              onClick={() => setUnlocked(true)}
              className="w-full font-sans font-semibold px-8 py-3.5 rounded-lg bg-lex-cyan text-navy-deep hover:bg-lex-cyan-dark shadow-lg hover:shadow-lex-cyan/30 hover:shadow-xl active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Ver laudo completo →
            </button>
          )}

          {/* Nova simulação */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-white/5">
            <button
              onClick={handleNovaSimulacao}
              className="font-sans font-semibold px-8 py-3.5 rounded-lg border border-white/15 text-white/70 hover:border-white/30 hover:text-white active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Nova simulação
            </button>
            <Link href="/" className="font-sans text-sm text-white/50 hover:text-white text-center py-3 transition-colors">
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
