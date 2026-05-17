import React from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  ShieldCheck,
  Gavel,
  Scale,
  History,
  ArrowRight,
} from 'lucide-react';

interface Props {
  onEnter: (mode: number) => void;
}

const MODES = [
  {
    title: 'Tese Estratégica',
    price: 'R$ 9,90',
    Icon: FileText,
    desc: 'VOCÊ TRAZ UM FATO (STORYTELLING). O SISTEMA CRIA O MELHOR ADVOGADO PARA PETICIONAR E O JUIZ JULGA EM 3 CICLOS.',
  },
  {
    title: 'Defesa sob Ataque',
    price: 'R$ 9,90',
    Icon: ShieldCheck,
    desc: 'VOCÊ TRAZ UMA ACUSAÇÃO SOFRIDA. CRIAMOS O ADVOGADO DE DEFESA TÉCNICA PARA RESPONDER E O JUIZ AVALIA EM 3 CICLOS.',
  },
  {
    title: 'Mesa Dupla — Juiz',
    price: 'R$ 5,90',
    Icon: Gavel,
    desc: 'VOCÊ TRAZ ACUSAÇÃO E DEFESA PRONTAS. ACIONAMOS O MAGISTRADO MAIS ESPECIALIZADO PARA EMITIR SENTENÇA DIRETA.',
  },
  {
    title: 'Mesa Dupla — Assistida',
    price: 'R$ 9,90',
    Icon: Scale,
    desc: 'ACUSAÇÃO E DEFESA PRONTAS. ESCOLHA SEU LADO E TENHA UM ADVOGADO IA MELHORANDO SUA TESE CONTRA O OUTRO LADO.',
  },
  {
    title: 'Revisão Pós-Conflito',
    price: 'R$ 5,90',
    Icon: History,
    desc: 'JÁ HOUVE UMA DECISÃO OU PROPOSTA? DESCUBRA SE VALE RECORRER DA SENTENÇA OU SE A OFERTA DE ACORDO É JUSTA.',
  },
];

const FLOW_STEPS = [
  'Peticionando — Advogado Especializado',
  'Protocolando — Barramento Digital',
  'Julgando — Magistrado Técnico',
  'Revisando — Memória & Estratégia',
];

const FOOTER_STATS = [
  { label: 'Base de dados', value: '1.9M+ Precedentes Injetados' },
  { label: 'Processamento', value: 'EAI_CORES_GEN_3_ANALYSIS' },
  { label: 'Privacidade', value: 'Criptografia RSA-4096' },
  { label: 'Versão', value: 'V.2.4' },
];

export default function BoardroomPage({ onEnter }: Props) {
  return (
    <div className="min-h-screen bg-[#111111] text-white overflow-x-hidden selection:bg-amber-400/20">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#111111]/95 backdrop-blur-md border-b border-white/8 px-6 md:px-12 flex items-center justify-between">
        <span
          className="font-playfair italic text-xl tracking-wide text-amber-400"
          style={{ letterSpacing: '0.02em' }}
        >
          EAI?
        </span>
        <button
          onClick={() => onEnter(0)}
          className="px-5 py-2 border border-amber-400/50 text-amber-400 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-amber-400 hover:text-black transition-all duration-200"
        >
          ENTRAR
        </button>
      </header>

      {/* Page content — offset by header height */}
      <div className="pt-16">

        {/* Hero */}
        <section className="px-6 md:px-12 lg:px-20 pt-20 pb-12 max-w-6xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="font-playfair italic text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.04] tracking-tight text-white mb-10"
          >
            A incerteza jurídica agora tem<br className="hidden md:block" /> uma arena de testes.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-white/35 max-w-xl leading-relaxed"
          >
            SELECIONE UM DOS MODOS DE OPERAÇÃO PARA INICIAR O PROTOCOLO DE SIMULAÇÃO PROCESSUAL.
          </motion.p>
        </section>

        {/* Disclaimer */}
        <div className="px-6 md:px-12 lg:px-20 mb-10 max-w-6xl mx-auto">
          <div className="border-l-2 border-amber-400/25 pl-4 py-1">
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/25 leading-relaxed">
              O EAI? É UMA FERRAMENTA DE APOIO ANALÍTICO BASEADA EM MODELOS DE LINGUAGEM AVANÇADOS.
              NÃO SUBSTITUI O ACONSELHAMENTO JURÍDICO PROFISSIONAL.
            </p>
          </div>
        </div>

        {/* Mode Cards */}
        <section className="px-6 md:px-12 lg:px-20 pb-16 max-w-6xl mx-auto">
          <div className="flex flex-col gap-3">
            {MODES.map(({ title, price, Icon, desc }, i) => {
              const mode = i + 1;
              return (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.08 * i + 0.1 }}
                onClick={() => onEnter(mode)}
                className="bg-[#1a1a1a] border border-white/[0.07] hover:border-amber-400/25 transition-all duration-200 group cursor-pointer"
              >
                <div className="p-5 md:p-7 flex flex-col sm:flex-row sm:items-center gap-5 md:gap-8">
                  {/* Icon + Title */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="w-10 h-10 border border-white/[0.08] group-hover:border-amber-400/35 flex items-center justify-center transition-all duration-200 flex-shrink-0">
                      <Icon className="w-4 h-4 text-white/30 group-hover:text-amber-400 transition-colors duration-200" />
                    </div>
                    <div className="min-w-[160px]">
                      <h3 className="text-[11px] md:text-[12px] font-bold uppercase tracking-[0.22em] text-white/80 group-hover:text-amber-400 transition-colors duration-200 leading-none mb-1">
                        {title}
                      </h3>
                      <span className="text-[10px] font-mono text-amber-400/60">{price}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px h-10 bg-white/[0.06] flex-shrink-0" />

                  {/* Description */}
                  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.16em] text-white/30 leading-relaxed flex-1">
                    {desc}
                  </p>

                  {/* CTA */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onEnter(mode); }}
                    className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-white/25 group-hover:text-amber-400 transition-colors duration-200 flex-shrink-0 self-end sm:self-auto whitespace-nowrap"
                  >
                    SELECIONAR MODO <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
              );
            })}
          </div>
        </section>

        {/* Technical Footer */}
        <div className="border-t border-white/[0.05]">
          <div className="px-6 md:px-12 lg:px-20 py-8 max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {FOOTER_STATS.map(({ label, value }) => (
                <div key={label} className="space-y-1.5">
                  <p className="text-[8px] uppercase tracking-[0.25em] text-white/18 font-bold">{label}</p>
                  <p className="text-[9px] font-mono text-white/40 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Boardroom Panel */}
        <div className="border-t border-white/[0.05] bg-[#0e0e0e]">
          <div className="px-6 md:px-12 lg:px-20 py-12 max-w-6xl mx-auto">
            <p className="text-[8px] uppercase tracking-[0.4em] text-white/20 font-bold mb-10">
              PAINEL BOARDROOM
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Status Info */}
              <div className="space-y-0">
                {[
                  { label: 'Área identificada', value: 'Geral / Outros' },
                  { label: 'Foro/Comarca', value: 'Justiça Comum / JEC' },
                  { label: 'Sementes ativadas', value: 'Aguardando ativação de sementes...' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-white/[0.05] gap-1"
                  >
                    <span className="text-[9px] uppercase tracking-[0.22em] text-white/25 font-bold">
                      {label}
                    </span>
                    <span className="text-[10px] font-mono text-white/40">{value}</span>
                  </div>
                ))}
              </div>

              {/* Flow Steps */}
              <div>
                <p className="text-[8px] uppercase tracking-[0.3em] text-white/18 font-bold mb-6">
                  FLUXO ESTRATÉGICO
                </p>
                <div className="space-y-4">
                  {FLOW_STEPS.map((step, i) => (
                    <motion.div
                      key={step}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0.2 }}
                      animate={{ opacity: [0.2, 0.8, 0.2] }}
                      transition={{
                        duration: 2.8,
                        delay: i * 0.6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <ArrowRight className="w-3 h-3 text-amber-400/50 flex-shrink-0" />
                      <span className="text-[9px] uppercase tracking-[0.18em] text-white/35 font-medium">
                        {step}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
