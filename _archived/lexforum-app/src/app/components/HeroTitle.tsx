'use client'

import { useState, useEffect } from 'react'

const phrases = [
  {
    plain: 'Leve sua causa ao tribunal — ',
    highlight: 'antes de ir ao tribunal.',
  },
  {
    plain: '3 rodadas. 1 advogado. 1 juiz. ',
    highlight: 'Resultado honesto.',
  },
  {
    plain: 'Se sua causa não tem chances, ',
    highlight: 'você vai saber agora.',
  },
  {
    plain: 'Simule o processo. ',
    highlight: 'Descubra a verdade.',
  },
]

export default function HeroTitle() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % phrases.length)
        setVisible(true)
      }, 800)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const { plain, highlight } = phrases[index]

  return (
    <h1
      className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight text-shadow-glow"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 800ms ease-in-out',
      }}
    >
      {plain}
      <span className="text-lex-cyan">{highlight}</span>
    </h1>
  )
}
