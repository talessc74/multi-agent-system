export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-brand-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚖️</span>
            <span className="font-serif text-xl font-semibold tracking-wide">
              LexForum
            </span>
          </div>
          <span className="text-sm text-brand-100 hidden sm:block">
            Simulador de Fóruns Jurídicos
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-3xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full">
            MVP — versão inicial
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-brand-900 leading-tight">
            LexForum —{' '}
            <span className="text-brand-500">Simulador de Fóruns Jurídicos</span>
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
            Simule audiências, debates e decisões com agentes de IA especializados
            em direito brasileiro. Juízes, advogados e desembargadores virtuais
            prontos para argumentar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button className="w-full sm:w-auto bg-brand-500 hover:bg-brand-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-md">
              Iniciar Simulação
            </button>
            <button className="w-full sm:w-auto border border-brand-500 text-brand-700 hover:bg-brand-50 font-semibold px-8 py-3 rounded-lg transition-colors">
              Conhecer os Agentes
            </button>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="bg-white border-t border-slate-200 py-16 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-3 p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-3xl">{f.icon}</span>
              <h2 className="font-serif text-lg font-semibold text-brand-900">
                {f.title}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-900 text-brand-100 text-center text-sm py-5">
        LexForum MVP · construído com Next.js 16 + Tailwind CSS
      </footer>
    </main>
  )
}

const features = [
  {
    icon: '🏛️',
    title: 'Fóruns Simulados',
    desc: 'Recrie audiências do JEC, TRT e outras instâncias com agentes especializados por tribunal.',
  },
  {
    icon: '🤖',
    title: 'Agentes de IA',
    desc: 'Juízes, advogados e desembargadores alimentados por modelos Claude com kernels jurídicos precisos.',
  },
  {
    icon: '📋',
    title: 'Decisões Fundamentadas',
    desc: 'Cada agente cita jurisprudência real e produz decisões com estrutura processual correta.',
  },
]
