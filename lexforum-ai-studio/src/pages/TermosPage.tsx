import React from 'react';
import '../novaversao/styles.css';
import { useTheme } from '../hooks/useTheme';

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: '1. O QUE É O EAI?',
    body: (
      <>
        O EAI? é uma ferramenta digital de simulação de raciocínio jurídico. Você descreve uma situação, e o sistema simula como advogados e juízes raciocinariam sobre ela — gerando uma estimativa de probabilidade de êxito, fundamentos e orientações gerais.<br /><br />
        O EAI? utiliza o modelo de inteligência artificial Google Gemini para processar as simulações. O resultado é gerado por IA — nenhum profissional humano revisa o output antes da entrega.<br /><br />
        O EAI? não é um escritório de advocacia. Não somos seus advogados. O resultado gerado não é aconselhamento jurídico. Usar o EAI? não cria nenhuma relação profissional entre você e nós.
      </>
    ),
  },
  {
    heading: '2. PARA QUE SERVE — E PARA QUE NÃO SERVE',
    body: (
      <>
        <strong>Serve para:</strong> entender melhor sua situação jurídica antes de tomar uma decisão, avaliar se vale a pena buscar um advogado e simular estratégias jurídicas de forma educativa e informativa.<br /><br />
        <strong>Não serve para:</strong> substituir um advogado em causas reais, protocolar ações judiciais diretamente, garantir qualquer resultado em processos reais ou ser apresentado como parecer jurídico profissional em juízo.
      </>
    ),
  },
  {
    heading: '3. SEUS DADOS',
    body: (
      <>
        Levamos sua privacidade a sério. Seguimos a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).<br /><br />
        <strong>O que coletamos:</strong> dados de cadastro (nome e e-mail), conteúdo da simulação (a descrição da causa que você submete) e dados de uso (data, hora, tipo de simulação e momento do desbloqueio do laudo).<br /><br />
        <strong>O que não fazemos:</strong> não vendemos seus dados, não compartilhamos sua causa com terceiros e não usamos o conteúdo das suas simulações para treinar modelos de IA.<br /><br />
        <strong>Prazo de retenção:</strong> seus dados são armazenados pelo período necessário à prestação do serviço e por até 2 (dois) anos após o encerramento da sua conta, salvo obrigação legal de guarda por prazo superior.<br /><br />
        <strong>Seus direitos:</strong> você pode solicitar a exclusão de todos os seus dados a qualquer momento pelo e-mail eaijuridico@icloud.com. Respondemos às solicitações dos titulares de dados no prazo de até 15 (quinze) dias, contados estritamente na forma da legislação de proteção de dados vigente.
      </>
    ),
  },
  {
    heading: '4. PAGAMENTO E REEMBOLSO',
    body: (
      <>
        A simulação gratuita entrega resultado parcial — algumas informações cobertas por tarja. O laudo completo está disponível mediante pagamento conforme tabela vigente.<br /><br />
        <strong>Direito de arrependimento:</strong> de acordo com o Código de Defesa do Consumidor (art. 49), você tem 7 dias após a compra para solicitar reembolso integral. Exceção: o usuário declara-se ciente de que, por se tratar de um serviço de geração de relatório personalizado e consumo imediato, a visualização e o desbloqueio integral do laudo configuram a prestação total e definitiva do serviço contratado, consumando seu objeto e inviabilizando a devolução dos valores por perda do interesse, nos termos da regulamentação de serviços digitais sob demanda. O sistema registra automaticamente a data e hora exatas do desbloqueio.<br /><br />
        <strong>Dúvidas sobre pagamento:</strong> eaijuridico@icloud.com
      </>
    ),
  },
  {
    heading: '5. RESULTADOS E RESPONSABILIDADE',
    body: (
      <>
        O EAI? gera estimativas baseadas em simulação de raciocínio jurídico por inteligência artificial. Essas estimativas não garantem o resultado de nenhuma ação judicial real, podem divergir da decisão de um juiz real e são baseadas nas informações que você forneceu — resultados mais precisos dependem de informações completas e corretas.<br /><br />
        <strong>Limitação de responsabilidade:</strong> o EAI? não se responsabiliza por decisões tomadas com base exclusivamente no output gerado, sem consulta a um advogado habilitado com registro na OAB. O usuário é responsável pelo uso que faz das informações recebidas.<br /><br />
        <strong>Responsabilidade por falhas do sistema:</strong> nos comprometemos a manter o produto funcionando com qualidade. Em caso de falha técnica que impeça a entrega do serviço pago, o valor será reembolsado integralmente.<br /><br />
        <strong>Serviços de terceiros:</strong> o EAI? emprega seus melhores esforços para manter a plataforma estável. Por utilizar infraestrutura tecnológica de terceiros para o processamento de inteligência artificial, o usuário reconhece que instabilidades temporárias ou alterações estruturais na API do provedor de IA configuram caso fortuito ou força maior, limitando a responsabilidade do EAI? ao restabelecimento do sistema assim que a infraestrutura terceira for normalizada.
      </>
    ),
  },
  {
    heading: '6. USO ACEITÁVEL',
    body: 'Ao usar o EAI?, você concorda em não usar o laudo gerado como peça processual real sem revisão de advogado com OAB, não tentar descobrir, copiar ou reproduzir a lógica interna do sistema de agentes, não usar o produto para fins ilegais ou para prejudicar terceiros e não simular causas de outras pessoas sem autorização delas.',
  },
  {
    heading: '7. PROPRIEDADE INTELECTUAL',
    body: 'O laudo gerado pelo EAI? pode ser usado por você livremente para fins pessoais e informativos. A lógica, os agentes e a tecnologia por trás do sistema são propriedade exclusiva do EAI? e não podem ser reproduzidos, copiados ou revertidos sem autorização expressa.',
  },
  {
    heading: '8. ATUALIZAÇÕES DESTES TERMOS',
    body: 'Podemos atualizar estes termos quando o produto evoluir. Quando isso acontecer, você será notificado antes de continuar usando o produto, precisará aceitar a nova versão para continuar e a versão que você aceitou fica sempre registrada no sistema com data e hora.',
  },
  {
    heading: '9. FORO',
    body: 'Em caso de disputas, fica eleito o foro da comarca de Brasília/DF, com aplicação da legislação brasileira.',
  },
  {
    heading: '10. CONTATO',
    body: (
      <>
        Dúvidas, solicitações de dados ou reclamações: suporte@eaijuridico.com.br<br />
        Responsável: Tales Carvalho
      </>
    ),
  },
];

export default function TermosPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="nv" data-theme={theme}>
      <div className="nv-grain" aria-hidden="true" />
      <nav style={{ borderBottom: '1px solid var(--nv-line)' }}>
        <div className="nv-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--nv-serif)', fontWeight: 700, fontSize: 20, color: 'var(--nv-ink)' }}>
              EAI<em style={{ fontStyle: 'italic', color: 'var(--nv-red)' }}>✓?</em>
            </span>
          </a>
          <button
            type="button"
            onClick={toggle}
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Alternar tema claro/escuro"
            style={{
              fontFamily: 'var(--nv-mono)',
              fontSize: 10.5,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: 'transparent',
              border: '1px solid var(--nv-line-2)',
              borderRadius: 3,
              padding: '7px 12px',
              color: 'var(--nv-ink-2)',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? 'Escuro' : 'Claro'}
          </button>
        </div>
      </nav>

      <div className="nv-container" style={{ padding: '48px 40px 80px', maxWidth: 720 }}>
        <p className="nv-kicker" style={{ marginBottom: 8 }}>Termos de uso</p>
        <h1 style={{ fontFamily: 'var(--nv-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: 32, color: 'var(--nv-ink)', margin: '0 0 6px' }}>
          Termos de uso: EAI<em style={{ fontStyle: 'italic', color: 'var(--nv-red)' }}>✓?</em>
        </h1>
        <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, color: 'var(--nv-ink-3)', margin: '0 0 4px' }}>Evidence-Based Artificial Intelligence</p>
        <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10, color: 'var(--nv-ink-3)', lineHeight: 1.7, margin: '0 0 40px' }}>
          Versão 1.2 · Maio de 2026<br />
          Responsável: Tales Carvalho. E-mail: eaijuridico@icloud.com<br />
          (E-mail provisório — será atualizado para eaijuridico.com.br após migração do domínio)
        </p>

        {SECTIONS.map((s) => (
          <div key={s.heading} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--nv-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nv-ink)', margin: '0 0 10px' }}>
              {s.heading}
            </h2>
            <p style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--nv-ink-2)', margin: 0 }}>{s.body}</p>
          </div>
        ))}

        <p style={{ fontFamily: 'var(--nv-mono)', fontSize: 10, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--nv-ink-3)', textAlign: 'center', marginTop: 56, paddingTop: 20, borderTop: '1px solid var(--nv-line)' }}>
          Versão 1.2, Maio de 2026 · EAI? · Evidence-Based Artificial Intelligence
        </p>
      </div>
    </div>
  );
}
