/**
 * Exemplos ilustrativos de força argumentativa — não são casos reais de
 * usuários. Conteúdo final aprovado no briefing V5 (seção 8.3). Ver
 * diretrizes de escrita lá antes de adicionar itens: frase completa e
 * explicativa descrevendo a situação de fato (nunca jargão jurídico),
 * sem nomes/valores/datas, percentuais redondos, sempre incluindo alguns
 * casos fracos (a ferramenta não é só 90%+, senão vira promessa de resultado).
 */
export interface TickerCase {
  categoria: string;
  descricao: string;
  pct: number;
  dir: 'up' | 'down';
}

export const MARKET_CASES: TickerCase[] = [
  { categoria: 'TRABALHISTA', descricao: 'Trabalhou 3 anos fazendo horas extras habituais que nunca foram pagas nem compensadas em banco de horas', pct: 78, dir: 'up' },
  { categoria: 'TRÂNSITO', descricao: 'Foi atingido na traseira por outro veículo em um cruzamento sem nenhuma sinalização de pare', pct: 82, dir: 'up' },
  { categoria: 'CONSUMIDOR', descricao: 'Encontrou uma cobrança recorrente no cartão de crédito de um serviço que nunca chegou a contratar', pct: 91, dir: 'up' },
  { categoria: 'LOCAÇÃO', descricao: 'Imobiliária reteve o valor total da caução ao fim do contrato sem apresentar nenhuma justificativa', pct: 68, dir: 'up' },
  { categoria: 'VIZINHANÇA', descricao: 'Vizinho de cima faz barulho alto todas as noites, mesmo depois de reclamações formais ao síndico', pct: 42, dir: 'down' },
  { categoria: 'BANCÁRIO', descricao: 'Descobriu um empréstimo consignado descontado do salário que nunca foi solicitado ou autorizado', pct: 85, dir: 'up' },
  { categoria: 'SAÚDE', descricao: 'Plano de saúde negou a cobertura de um procedimento que o médico classificou como urgente', pct: 73, dir: 'up' },
  { categoria: 'FAMÍLIA', descricao: 'Pede revisão do valor da pensão alimentícia depois de uma queda significativa na renda mensal', pct: 55, dir: 'up' },
  { categoria: 'CÍVEL', descricao: 'Nome foi negativado nos órgãos de proteção ao crédito por uma dívida que já estava paga', pct: 90, dir: 'up' },
  { categoria: 'PREVIDENCIÁRIO', descricao: 'INSS negou o pedido de auxílio-doença mesmo com atestado médico detalhando o afastamento', pct: 61, dir: 'up' },
  { categoria: 'CONTRATOS', descricao: 'Contrato de prestação de serviço prevê multa de rescisão bem acima do praticado no mercado', pct: 47, dir: 'down' },
  { categoria: 'TRABALHISTA', descricao: 'Foi exposto a cobranças e comentários humilhantes por um superior em reuniões com outros colegas', pct: 66, dir: 'up' },
  { categoria: 'TRÂNSITO', descricao: 'Recebeu uma multa de trânsito sem nunca ter sido notificado da infração dentro do prazo legal', pct: 75, dir: 'up' },
  { categoria: 'CONSUMIDOR', descricao: 'Produto com defeito de fábrica teve a troca recusada pela loja mesmo dentro do prazo de garantia', pct: 95, dir: 'up' },
];

export const CONFIDENCE_ITEMS = [
  'TRT', 'TJPR', 'STJ', 'JEC', '1,9M+ PRECEDENTES', 'TJSP', 'TST', 'STF', 'TJRJ', 'JUIZADOS ESPECIAIS',
];
