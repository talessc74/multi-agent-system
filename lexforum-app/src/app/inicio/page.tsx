'use client'

import { useRouter } from 'next/navigation'

const cards = [
  {
    id: 'leigo',
    icon: '⚖️',
    texto: 'Tenho um problema e preciso de ajuda',
    subtexto: 'Algo aconteceu comigo e quero saber se tenho direito',
  },
  {
    id: 'profissional',
    icon: '📋',
    texto: 'Sou profissional e quero simular uma estratégia',
    subtexto: 'Advogado, estudante ou operador do direito',
  },
]

export default function Inicio() {
  const router = useRouter()

  function handleSelect(perfil: string) {
    sessionStorage.setItem('perfil', perfil)
    router.push('/causa')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-navy-deep px-6 py-16">

      <div className="w-full max-w-3xl mx-auto text-center space-y-10">

        {/* Logo */}
        <div className="flex flex-col items-center leading-none mb-2">
          <span className="font-serif text-2xl font-bold tracking-tight text-white">
            Lex<span className="text-lex-cyan">Forum</span>
          </span>
          <span className="text-[10px] font-sans font-medium tracking-[0.2em] text-white/40 uppercase mt-1">
            Simulador Jurídico com IA
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
            Como você quer começar?
          </h1>
          <p className="font-sans text-sm text-white/50">
            Pode escolher com calma — não tem resposta errada.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 gap-5">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleSelect(card.id)}
              className="group flex flex-col items-center gap-4 bg-navy/50 border border-white/10 hover:border-lex-cyan/60 hover:bg-navy/80 rounded-2xl px-8 py-10 text-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lex-cyan/50"
            >
              <span className="text-5xl">{card.icon}</span>
              <div className="space-y-2">
                <p className="font-serif text-lg font-bold text-white group-hover:text-lex-cyan transition-colors leading-snug">
                  {card.texto}
                </p>
                <p className="font-sans text-sm text-white/50 leading-relaxed">
                  {card.subtexto}
                </p>
              </div>
            </button>
          ))}
        </div>

      </div>

    </main>
  )
}
