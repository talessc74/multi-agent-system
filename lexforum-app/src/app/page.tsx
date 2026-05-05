import Link from 'next/link'
import HeroTitle from './components/HeroTitle'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-navy-deep">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-navy-deep/95 backdrop-blur-md border-b border-white/5 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex flex-col leading-none">
            <span className="font-serif text-2xl font-bold tracking-tight text-white">
              Lex<span className="text-lex-cyan">Forum</span>
            </span>
            <span className="text-[10px] font-sans font-medium tracking-[0.2em] text-white/40 uppercase mt-0.5">
              Simulador Jurídico com IA
            </span>
          </div>

          {/* Nav pill */}
          <div className="hidden sm:flex items-center gap-1 bg-navy/60 border border-white/10 rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-lex-cyan animate-pulse" />
            <span className="text-xs font-sans text-white/60 ml-1">Sistema ativo</span>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex-1 flex items-center justify-center px-6 py-28 bg-hero-gradient overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-lex-cyan/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-lex-cyan/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-lex-cyan/40 bg-lex-cyan/5 text-lex-cyan text-xs font-sans font-semibold px-4 py-2 rounded-full tracking-widest uppercase">
            <span>⚖</span>
            <span>Powered by AI</span>
          </div>

          {/* Title */}
          <HeroTitle />

          {/* Subtitle */}
          <p className="font-sans text-lg text-white/65 leading-relaxed max-w-xl mx-auto">
            Simule sua ação em um fórum jurídico com IA. Juiz, advogado da parte contrária
            e relator analisam os argumentos — você recebe um laudo com pontos fortes,
            fracos e probabilidade de êxito.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/inicio" className="btn-primary w-full sm:w-auto text-center">
              Começar
            </Link>
          </div>

          {/* Social proof micro-text */}
          <p className="font-sans text-xs text-white/30 pt-2">
            Simulações baseadas em jurisprudência real · Respostas em minutos
          </p>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="bg-navy-deep px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <p className="font-sans text-xs text-lex-cyan/70 text-center tracking-[0.3em] uppercase mb-12">
            Como funciona
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={f.title} className="feature-card group">
                {/* Step number */}
                <span className="font-sans text-xs text-lex-cyan/50 font-semibold tracking-widest uppercase">
                  0{i + 1}
                </span>

                {/* Icon */}
                <div className="mt-4 mb-5 text-4xl">{f.icon}</div>

                {/* Content */}
                <h2 className="font-serif text-xl font-bold text-white mb-3 group-hover:text-lex-cyan transition-colors">
                  {f.title}
                </h2>
                <p className="font-sans text-sm text-white/55 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-navy-deep border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-white/30 text-sm">
            Lex<span className="text-lex-cyan/50">Forum</span>
          </span>

          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2.5">
            <span className="text-yellow-400 text-sm">⚠</span>
            <p className="font-sans text-xs text-yellow-200/70 leading-snug max-w-md">
              <strong className="text-yellow-200/90">Simulação educativa</strong> — não substitui assessoria jurídica real.
              Consulte sempre um advogado habilitado para seu caso.
            </p>
          </div>
        </div>
      </footer>

    </main>
  )
}

const features = [
  {
    icon: '🏛️',
    title: 'Fórum Virtual Real',
    desc: 'Juiz, advogado da parte contrária e relator com legados de jurisprudência brasileira — JEC, TRT, TJPR e STJ.',
  },
  {
    icon: '🔄',
    title: 'Até 3 Rodadas',
    desc: 'Cada agente responde, rebate e reconsidera. O debate evolui em rodadas para simular a dinâmica processual real.',
  },
  {
    icon: '📋',
    title: 'Laudo Formal',
    desc: 'Ao final, receba um relatório com pontos fortes, fracos, probabilidade de êxito estimada e caminhos alternativos.',
  },
]
