export interface ModeConfig {
  id: number;
  color: string;
  colorRgb: string;
  // Variante escurecida da mesma cor, calibrada para contraste real (~4.5:1)
  // contra fundos claros — a cor original só foi pensada para fundo escuro
  // (ex.: o ciano do Modo 1 cai para 1.14:1 de contraste no claro).
  colorLight: string;
  colorRgbLight: string;
  headline: string;
  tagline: string;
  description: string;
  bring: string[];
  receive: string[];
  cta: string;
  inputType: 'single' | 'dual';
  hasAttachment: boolean;
  hasSelector: boolean;
  selectorType?: 'side' | 'subcase';
}

export const MODE_CONFIG: Record<number, ModeConfig> = {
  1: {
    id: 1,
    color: '#00FFEF',
    colorRgb: '0,255,239',
    colorLight: '#00857C',
    colorRgbLight: '0,133,124',
    headline: 'Tese Estratégica',
    tagline: 'Você traz o fato. Descubra se tem razão.',
    description:
      'Descreva sua situação com suas próprias palavras. O sistema avalia a força dos seus argumentos, identifica o que o outro lado pode alegar contra você e calcula sua chance real de êxito.',
    bring: ['Fatos principais', 'Contexto do conflito', 'Documentos (opcional)'],
    receive: ['Probabilidade de êxito', 'Fundamentos jurídicos', 'Riscos identificados', 'Próximos passos'],
    cta: 'Validar causa →',
    inputType: 'single',
    hasAttachment: true,
    hasSelector: false,
  },
  2: {
    id: 2,
    color: '#FF6B6B',
    colorRgb: '255,107,107',
    colorLight: '#ED0000',
    colorRgbLight: '237,0,0',
    headline: 'Defesa sob Ataque',
    tagline: 'Você está sendo acusado. A IA constrói sua defesa.',
    description:
      'Descreva a acusação que você recebeu e sua versão dos fatos. O sistema constrói sua defesa técnica, avalia a força dos seus argumentos em ciclos e identifica suas vulnerabilidades antes que o outro lado as explore.',
    bring: ['A acusação recebida', 'Sua versão dos fatos', 'Provas de defesa (opcional)'],
    receive: ['Força da sua defesa', 'Argumentos jurídicos', 'Vulnerabilidades expostas', 'Estratégia de resposta'],
    cta: 'Validar defesa →',
    inputType: 'single',
    hasAttachment: true,
    hasSelector: false,
  },
  3: {
    id: 3,
    color: '#A882FF',
    colorRgb: '168,130,255',
    colorLight: '#8652FF',
    colorRgbLight: '134,82,255',
    headline: 'Mesa Dupla — Juiz',
    tagline: 'Você já tem os dois lados. O juiz decide.',
    description:
      'Você traz a acusação e a defesa prontas. O sistema aciona o magistrado mais especializado para emitir uma sentença direta — sem advogado intermediário. O caminho mais rápido para um veredito.',
    bring: ['Argumento da acusação', 'Argumento da defesa', 'Documentos (opcional)'],
    receive: ['Sentença fundamentada', 'Lado mais forte', 'Base jurídica utilizada', 'Recomendação final'],
    cta: 'Consultar magistrado →',
    inputType: 'dual',
    hasAttachment: false,
    hasSelector: false,
  },
  4: {
    id: 4,
    color: '#FFB800',
    colorRgb: '255,184,0',
    colorLight: '#996E00',
    colorRgbLight: '153,110,0',
    headline: 'Mesa Dupla — Assistida',
    tagline: 'Você escolhe seu lado. A IA reforça sua tese.',
    description:
      'Você já sabe qual argumento quer defender. O sistema melhora ativamente sua tese antes do julgamento — você não entra no debate sozinho. Ideal para quem veio do Modo 1 e quer simular o confronto real.',
    bring: ['Argumento da acusação', 'Argumento da defesa', 'Seu lado no conflito'],
    receive: ['Tese reforçada pela IA', 'Probabilidade de êxito', 'Pontos fracos expostos', 'Sentença fundamentada'],
    cta: 'Iniciar simulação →',
    inputType: 'dual',
    hasAttachment: false,
    hasSelector: true,
    selectorType: 'side',
  },
  5: {
    id: 5,
    color: '#00CC88',
    colorRgb: '0,204,136',
    colorLight: '#00875A',
    colorRgbLight: '0,135,90',
    headline: 'Revisão Pós-Conflito',
    tagline: 'Já existe uma decisão. Vale a pena ir adiante?',
    description:
      'Você já tem uma sentença ou uma proposta de acordo em mãos. O sistema analisa se vale recorrer da decisão ou se o acordo oferecido é justo — e te diz qual caminho tem menos risco.',
    bring: ['A decisão recebida', 'Contexto do conflito', 'Proposta de acordo (opcional)'],
    receive: ['Vale recorrer? (0–100%)', 'O acordo é justo?', 'Riscos de cada caminho', 'Recomendação estratégica'],
    cta: 'Analisar agora →',
    inputType: 'single',
    hasAttachment: true,
    hasSelector: true,
    selectorType: 'subcase',
  },
};
