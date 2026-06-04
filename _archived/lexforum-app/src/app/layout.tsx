import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LexForum — Simulador Jurídico com IA',
  description:
    'Simule fóruns jurídicos com agentes de IA especializados. Juízes, advogados e desembargadores virtuais analisam sua causa com rigor processual.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans bg-white-ice text-navy-deep antialiased">
        {children}
      </body>
    </html>
  )
}
