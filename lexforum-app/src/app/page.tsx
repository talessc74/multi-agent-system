'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col bg-navy-deep">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-navy-deep/95 backdrop-blur-md border-b border-white/5 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col leading-none">
            <span className="font-serif text-2xl font-bold tracking-tight text-white">
              Lex<span className="text-lex-cyan">Forum</span>
            </span>
            <span className="text-[10px] font-sans font-medium tracking-[0.2em] text-white/40 uppercase mt-0.5">
              Simulador Jurídico com IA
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-navy/60 border border-white/10 rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-lex-cyan animate-pulse" />
            <span className="text-xs font-sans text-white/60 ml-1">Sistema ativo</span>
          </div>
        </div>
      </header>

      {/* ── Hero v2 ── */}
      <section className="hero">
        <h1 className="hero-headline">
          Leve sua causa ao tribunal<br />
          — <em>antes de ir ao tribunal.</em>
        </h1>
        <p className="hero-sub">
          Simule sua ação em um fórum jurídico com IA. Juiz, advogado da parte contrária e relator analisam os argumentos — você recebe um laudo com pontos fortes, fracos e probabilidade de êxito.
        </p>

        <div className="cards-wrapper">

          {/* CARD LEIGO */}
          <div className="card card-leigo" onClick={() => router.push('/causa?perfil=leigo')}>
            <div className="carousel carousel-leigo">
              <div className="carousel-track">
                <div className="carousel-phrase">Aconteceu algo com você?</div>
                <div className="carousel-phrase">Seus direitos importam</div>
                <div className="carousel-phrase">Sem juridiquês</div>
                <div className="carousel-phrase">Aconteceu algo com você?</div>
              </div>
            </div>
            <span className="card-icon">⚖️</span>
            <h2 className="card-title">Tenho um problema<br />e preciso de ajuda</h2>
            <p className="card-desc">Algo aconteceu comigo<br />e quero saber se tenho direito</p>
            <span className="card-btn">Começar →</span>
          </div>

          {/* CARD PROFISSIONAL */}
          <div className="card card-pro" onClick={() => router.push('/causa?perfil=profissional')}>
            <div className="carousel carousel-pro">
              <div className="carousel-track">
                <div className="carousel-phrase">Teste sua tese jurídica</div>
                <div className="carousel-phrase">Jurisprudência real</div>
                <div className="carousel-phrase">Simulação de 3 rodadas</div>
                <div className="carousel-phrase">Teste sua tese jurídica</div>
              </div>
            </div>
            <span className="card-icon">📋</span>
            <h2 className="card-title">Sou profissional e quero<br />simular uma estratégia</h2>
            <p className="card-desc">Advogado, estudante<br />ou operador do direito</p>
            <span className="card-btn">Acessar →</span>
          </div>

        </div>

        <p className="pricing-line">A simulação é gratuita · O laudo completo custa R$&nbsp;9,90</p>
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
                <span className="font-sans text-xs text-lex-cyan/50 font-semibold tracking-widest uppercase">
                  0{i + 1}
                </span>
                <div className="mt-4 mb-5 text-4xl">{f.icon}</div>
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
