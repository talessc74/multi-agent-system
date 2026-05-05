import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LexForum — Simulador de Fóruns Jurídicos',
  description:
    'Plataforma de simulação de fóruns jurídicos com agentes de IA especializados em direito brasileiro.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  )
}
