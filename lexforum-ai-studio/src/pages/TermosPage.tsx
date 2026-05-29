import React from 'react';

const s = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontFamily: 'Arial, sans-serif', padding: '48px 24px 80px' } as React.CSSProperties,
  inner: { maxWidth: '720px', margin: '0 auto' } as React.CSSProperties,
  title: { fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' } as React.CSSProperties,
  subtitle: { fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' } as React.CSSProperties,
  meta: { fontSize: '11px', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: 1.6 } as React.CSSProperties,
  section: { marginBottom: '32px' } as React.CSSProperties,
  heading: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'var(--text-primary)', marginBottom: '10px' },
  body: { fontSize: '13px', lineHeight: 1.75, color: 'var(--text-secondary)' } as React.CSSProperties,
  footer: { marginTop: '56px', paddingTop: '20px', borderTop: '1px solid var(--border)', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' as const },
};

export default function TermosPage() {
  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1 style={s.title}>TERMOS DE USO — EAI?</h1>
        <p style={s.subtitle}>Evidence-Based Artificial Intelligence</p>
        <p style={s.meta}>
          Versão 1.2 — Maio de 2026<br />
          Responsável: Tales Carvalho — E-mail: eaijuridico@icloud.com<br />
          (E-mail provisório — será atualizado para eaijuridico.com.br após migração do domínio)
        </p>

        <div style={s.section}>
          <h2 style={s.heading}>1. O QUE É O EAI?</h2>
          <p style={s.body}>
            O EAI? é uma ferramenta digital de simulação de raciocínio jurídico. Você descreve uma situação, e o sistema simula como advogados e juízes raciocinariam sobre ela — gerando uma estimativa de probabilidade de êxito, fundamentos e orientações gerais.<br /><br />
            O EAI? utiliza o modelo de inteligência artificial Google Gemini para processar as simulações. O resultado é gerado por IA — nenhum profissional humano revisa o output antes da entrega.<br /><br />
            O EAI? não é um escritório de advocacia. Não somos seus advogados. O resultado gerado não é aconselhamento jurídico. Usar o EAI? não cria nenhuma relação profissional entre você e nós.
          </p>
        </div>

        <div style={s.section}>
          <h2 style={s.heading}>2. PARA QUE SERVE — E PARA QUE NÃO SERVE</h2>
          <p style={s.body}>
            <strong>Serve para:</strong> entender melhor sua situação jurídica antes de tomar uma decisão, avaliar se vale a pena buscar um advogado e simular estratégias jurídicas de forma educativa e informativa.<br /><br />
            <strong>Não serve para:</strong> substituir um advogado em causas reais, protocolar ações judiciais diretamente, garantir qualquer resultado em processos reais ou ser apresentado como parecer jurídico profissional em juízo.
          </p>
        </div>

        <div style={s.section}>
          <h2 style={s.heading}>3. SEUS DADOS</h2>
          <p style={s.body}>
            Levamos sua privacidade a sério. Seguimos a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).<br /><br />
            <strong>O que coletamos:</strong> dados de cadastro (nome e e-mail), conteúdo da simulação (a descrição da causa que você submete) e dados de uso (data, hora, tipo de simulação e momento do desbloqueio do laudo).<br /><br />
            <strong>O que não fazemos:</strong> não vendemos seus dados, não compartilhamos sua causa com terceiros e não usamos o conteúdo das suas simulações para treinar modelos de IA.<br /><br />
            <strong>Prazo de retenção:</strong> seus dados são armazenados pelo período necessário à prestação do serviço e por até 2 (dois) anos após o encerramento da sua conta, salvo obrigação legal de guarda por prazo superior.<br /><br />
            <strong>Seus direitos:</strong> você pode solicitar a exclusão de todos os seus dados a qualquer momento pelo e-mail eaijuridico@icloud.com. Respondemos às solicitações dos titulares de dados no prazo de até 15 (quinze) dias, contados estritamente na forma da legislação de proteção de dados vigente.
          </p>
        </div>

        <div style={s.section}>
          <h2 style={s.heading}>4. PAGAMENTO E REEMBOLSO</h2>
          <p style={s.body}>
            A simulação gratuita entrega resultado parcial — algumas informações cobertas por tarja. O laudo completo está disponível mediante pagamento conforme tabela vigente.<br /><br />
            <strong>Direito de arrependimento:</strong> de acordo com o Código de Defesa do Consumidor (art. 49), você tem 7 dias após a compra para solicitar reembolso integral. Exceção: o usuário declara-se ciente de que, por se tratar de um serviço de geração de relatório personalizado e consumo imediato, a visualização e o desbloqueio integral do laudo configuram a prestação total e definitiva do serviço contratado, consumando seu objeto e inviabilizando a devolução dos valores por perda do interesse, nos termos da regulamentação de serviços digitais sob demanda. O sistema registra automaticamente a data e hora exatas do desbloqueio.<br /><br />
            <strong>Dúvidas sobre pagamento:</strong> eaijuridico@icloud.com
          </p>
        </div>

        <div style={s.section}>
          <h2 style={s.heading}>5. RESULTADOS E RESPONSABILIDADE</h2>
          <p style={s.body}>
            O EAI? gera estimativas baseadas em simulação de raciocínio jurídico por inteligência artificial. Essas estimativas não garantem o resultado de nenhuma ação judicial real, podem divergir da decisão de um juiz real e são baseadas nas informações que você forneceu — resultados mais precisos dependem de informações completas e corretas.<br /><br />
            <strong>Limitação de responsabilidade:</strong> o EAI? não se responsabiliza por decisões tomadas com base exclusivamente no output gerado, sem consulta a um advogado habilitado com registro na OAB. O usuário é responsável pelo uso que faz das informações recebidas.<br /><br />
            <strong>Responsabilidade por falhas do sistema:</strong> nos comprometemos a manter o produto funcionando com qualidade. Em caso de falha técnica que impeça a entrega do serviço pago, o valor será reembolsado integralmente.<br /><br />
            <strong>Serviços de terceiros:</strong> o EAI? emprega seus melhores esforços para manter a plataforma estável. Por utilizar infraestrutura tecnológica de terceiros para o processamento de inteligência artificial, o usuário reconhece que instabilidades temporárias ou alterações estruturais na API do provedor de IA configuram caso fortuito ou força maior, limitando a responsabilidade do EAI? ao restabelecimento do sistema assim que a infraestrutura terceira for normalizada.
          </p>
        </div>

        <div style={s.section}>
          <h2 style={s.heading}>6. USO ACEITÁVEL</h2>
          <p style={s.body}>
            Ao usar o EAI?, você concorda em não usar o laudo gerado como peça processual real sem revisão de advogado com OAB, não tentar descobrir, copiar ou reproduzir a lógica interna do sistema de agentes, não usar o produto para fins ilegais ou para prejudicar terceiros e não simular causas de outras pessoas sem autorização delas.
          </p>
        </div>

        <div style={s.section}>
          <h2 style={s.heading}>7. PROPRIEDADE INTELECTUAL</h2>
          <p style={s.body}>
            O laudo gerado pelo EAI? pode ser usado por você livremente para fins pessoais e informativos. A lógica, os agentes e a tecnologia por trás do sistema são propriedade exclusiva do EAI? e não podem ser reproduzidos, copiados ou revertidos sem autorização expressa.
          </p>
        </div>

        <div style={s.section}>
          <h2 style={s.heading}>8. ATUALIZAÇÕES DESTES TERMOS</h2>
          <p style={s.body}>
            Podemos atualizar estes termos quando o produto evoluir. Quando isso acontecer, você será notificado antes de continuar usando o produto, precisará aceitar a nova versão para continuar e a versão que você aceitou fica sempre registrada no sistema com data e hora.
          </p>
        </div>

        <div style={s.section}>
          <h2 style={s.heading}>9. FORO</h2>
          <p style={s.body}>
            Em caso de disputas, fica eleito o foro da comarca de Brasília/DF, com aplicação da legislação brasileira.
          </p>
        </div>

        <div style={s.section}>
          <h2 style={s.heading}>10. CONTATO</h2>
          <p style={s.body}>
            Dúvidas, solicitações de dados ou reclamações: eaijuridico@icloud.com<br />
            Responsável: Tales Carvalho<br />
            (E-mail provisório — será atualizado para eaijuridico.com.br após migração do domínio)
          </p>
        </div>

        <div style={s.footer}>
          Versão 1.2 — Maio de 2026 — EAI? — Evidence-Based Artificial Intelligence
        </div>
      </div>
    </div>
  );
}
