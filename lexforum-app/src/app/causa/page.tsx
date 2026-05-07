'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const chips = [
  'Produto ou serviço',
  'Trabalhista',
  'Dívida ou cobrança',
  'Imóvel ou vizinho',
  'Acidente ou dano',
  'Outro',
]

const PLACEHOLDER =
  'Ex: minha conta de telefone está alta · fui demitido sem justa causa · perdi esta causa 3 vezes, o que estou fazendo de errado'

const MAX_ARQUIVOS = 5
const MAX_BYTES = 10 * 1024 * 1024

type ArquivoItem = { id: string; nome: string; tipo: string; file: File }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Causa() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [perfil, setPerfil] = useState<'leigo' | 'profissional'>('leigo')
  const [arquivos, setArquivos] = useState<ArquivoItem[]>([])
  const [erroArquivo, setErroArquivo] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChip(chip: string) {
    setText((prev) => {
      const trimmed = prev.trimStart()
      if (trimmed.startsWith(chip)) return prev
      return chip + (trimmed ? ': ' + trimmed : '')
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setErroArquivo('')

    const validos: ArquivoItem[] = []
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        setErroArquivo(`"${file.name}" excede 10 MB.`)
        continue
      }
      validos.push({ id: `${Date.now()}-${Math.random()}`, nome: file.name, tipo: file.type, file })
    }

    setArquivos((prev) => {
      const total = [...prev, ...validos]
      if (total.length > MAX_ARQUIVOS) {
        setErroArquivo(`Máximo de ${MAX_ARQUIVOS} arquivos permitidos.`)
        return total.slice(0, MAX_ARQUIVOS)
      }
      return total
    })

    if (inputRef.current) inputRef.current.value = ''
  }

  function removeArquivo(id: string) {
    setArquivos((prev) => prev.filter((a) => a.id !== id))
    setErroArquivo('')
  }

  async function handleSimular() {
    if (text.trim().length <= 10) return

    const arquivosBase64 = await Promise.all(
      arquivos.map(async (a) => ({
        nome: a.nome,
        tipo: a.tipo,
        base64: await fileToBase64(a.file),
      })),
    )

    sessionStorage.setItem('lf_causa', text)
    sessionStorage.setItem('lf_perfil', perfil)
    sessionStorage.setItem('lf_arquivos', JSON.stringify(arquivosBase64))
    router.push('/confirmacao')
  }

  const canSubmit = text.trim().length > 10

  return (
    <main className="min-h-screen flex flex-col bg-navy-deep">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-navy-deep/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-sans text-sm text-white/50 hover:text-white transition-colors">
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
              <span className="w-8 h-1.5 rounded-full bg-lex-cyan" />
              <span className="w-8 h-1.5 rounded-full bg-white/15" />
              <span className="w-8 h-1.5 rounded-full bg-white/15" />
            </div>
            <span className="font-sans text-xs text-white/40 tracking-wide">
              Passo 1 de 3 · Declaração da causa
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
              O que aconteceu?
            </h1>
            <p className="font-sans text-sm text-white/50 leading-relaxed">
              Descreva com suas palavras. Sem juridiquês — quanto mais detalhes, melhor a simulação.
            </p>
          </div>

          {/* Perfil */}
          <div className="space-y-2">
            <p className="font-sans text-xs text-white/35 uppercase tracking-widest">Perfil</p>
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

          {/* Chips opcionais */}
          <div className="space-y-2">
            <p className="font-sans text-xs text-white/35 uppercase tracking-widest">
              Categoria (opcional)
            </p>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChip(chip)}
                  className="font-sans text-xs text-white/60 border border-white/15 hover:border-lex-cyan/50 hover:text-lex-cyan rounded-full px-4 py-1.5 transition-all duration-150 active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={7}
            className="w-full bg-navy/60 border border-white/10 focus:border-lex-cyan/50 focus:outline-none focus:ring-2 focus:ring-lex-cyan/20 rounded-2xl px-5 py-4 font-sans text-sm text-white placeholder-white/25 leading-relaxed resize-none transition-all duration-200"
          />

          {/* Upload de arquivos */}
          <div className="space-y-3">
            <p className="font-sans text-xs text-white/35 uppercase tracking-widest">
              Documentos (opcional) — PDF ou imagem, máx. 5 arquivos · 10 MB cada
            </p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={arquivos.length >= MAX_ARQUIVOS}
              className={`font-sans text-xs px-4 py-2 rounded-lg border transition-all duration-150 ${
                arquivos.length >= MAX_ARQUIVOS
                  ? 'border-white/10 text-white/20 cursor-not-allowed'
                  : 'border-white/15 text-white/60 hover:border-lex-cyan/50 hover:text-lex-cyan cursor-pointer'
              }`}
            >
              + Adicionar arquivo
            </button>

            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {erroArquivo && (
              <p className="font-sans text-xs text-red-400">{erroArquivo}</p>
            )}

            {arquivos.length > 0 && (
              <ul className="space-y-2">
                {arquivos.map((arq) => (
                  <li
                    key={arq.id}
                    className="flex items-center justify-between gap-3 bg-navy/60 border border-white/10 rounded-xl px-4 py-2"
                  >
                    <span className="font-sans text-xs text-white/70 truncate">{arq.nome}</span>
                    <button
                      onClick={() => removeArquivo(arq.id)}
                      className="font-sans text-xs text-white/30 hover:text-red-400 transition-colors shrink-0"
                    >
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Botão + Disclaimer */}
          <div className="flex flex-col items-stretch sm:items-end gap-3">
            <button
              onClick={handleSimular}
              disabled={!canSubmit}
              className={`font-sans font-semibold px-8 py-3.5 rounded-lg transition-all duration-200 ${
                canSubmit
                  ? 'bg-lex-cyan text-navy-deep hover:bg-lex-cyan-dark shadow-lg hover:shadow-lex-cyan/30 hover:shadow-xl active:scale-95 cursor-pointer'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Simular →
            </button>
            <p className="font-sans text-xs text-white/30 text-center sm:text-right leading-relaxed">
              Esta simulação tem fins educativos e não substitui assessoria jurídica real.
            </p>
          </div>

        </div>
      </div>

    </main>
  )
}
