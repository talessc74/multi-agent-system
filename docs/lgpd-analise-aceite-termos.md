# Análise de Conformidade — Granularidade do Aceite LGPD (Termos v1.2)

**Referência:** bdr-local-001  
**Data da análise:** 2026-06-10  
**Status:** Análise interna concluída — revisão por jurista LGPD pendente

---

## O que a LGPD exige

O Art. 8º da LGPD estabelece que o consentimento deve ser:
- **Livre:** sem coerção ou prejuízo pelo não-consentimento
- **Informado:** titular sabe exatamente para quê consente
- **Inequívoco:** ação afirmativa clara (não pode ser opt-out ou caixa pré-marcada)
- **Específico para a finalidade:** cada finalidade distinta requer consentimento separado

O Art. 9º exige informação explícita sobre: finalidade, período de retenção, identificação do controlador, e compartilhamento com terceiros.

---

## Estado atual (Termos v1.2)

Baseado no código: o aceite atual é **único** — o usuário aceita os Termos de Uso completos em uma ação, com `timestamp` gravado no Firestore.

### Finalidades identificadas no sistema

| Finalidade | Base legal atual | Granularidade |
|------------|-----------------|---------------|
| Processamento do caso jurídico pelo Gemini para gerar simulação | Consentimento | ⚠️ Agrupado no aceite geral |
| Armazenamento do histórico de simulações (anonimizado) | Consentimento | ⚠️ Agrupado no aceite geral |
| Processamento de pagamento via Stripe | Execução de contrato (Art. 7º, V) | ✅ Não requer consentimento separado |
| Envio de alertas operacionais por email | Legítimo interesse | ✅ Não requer consentimento separado |
| Marketing / comunicação promocional | Consentimento | ❌ Ausente — não há campo dedicado |

---

## Gaps identificados

### Gap 1 — Aceite único para múltiplas finalidades
O aceite atual cobre todas as finalidades num único clique. A LGPD exige que
finalidades distintas tenham consentimentos separados quando a base legal é o
consentimento.

**Recomendação:** Separar em dois checkboxes mínimos:
1. ✅ Concordo com o Tratamento de Dados para Simulação Jurídica *(obrigatório para uso)*
2. ☐ Aceito receber comunicações e novidades do EAI? Jurídico *(opcional — marketing)*

### Gap 2 — Marketing sem consentimento dedicado
Se o EAI? Jurídico enviar qualquer comunicação de marketing no futuro, precisará
de base legal separada. O aceite atual não cobre isso.

**Recomendação:** Adicionar campo opt-in de marketing no cadastro/onboarding.

### Gap 3 — Informação sobre período de retenção
Os Termos v1.2 precisam informar explicitamente por quanto tempo os dados são retidos:
- Simulações anonimizadas: indefinido (até solicitação de exclusão)
- Dados de pagamento: 5 anos (obrigação contábil)
- Dados de acesso: [a definir]

### Gap 4 — Identificação do controlador
Os Termos devem identificar o controlador dos dados (razão social, CNPJ ou CPF do responsável, endereço).

---

## Itens que estão conformes

- ✅ Consentimento é uma ação afirmativa (clique explícito)
- ✅ Timestamp gravado — consentimento é documentado
- ✅ Dados processados pelo Gemini não persistem com PII (anonimização antes de salvar)
- ✅ Pagamentos processados pelo Stripe — EAI? não armazena dados de cartão
- ✅ `allow update: if false` nas regras Firestore — usuário não pode alterar próprio registro

---

## Próximos passos recomendados

1. **Imediato (código):** Separar o aceite em: (a) tratamento para simulação + (b) marketing opt-in
2. **Curto prazo:** Atualizar os Termos v1.2 para v1.3 com: período de retenção, identificação do controlador, lista de finalidades
3. **Médio prazo:** Submeter os Termos atualizados para revisão por advogado especialista em LGPD/privacidade

---

## Nota

Esta é uma análise técnica interna conduzida pela Galera de Segurança (SOVEREIGN, BLAST, BAU) do sistema ARGUS.
**Não substitui revisão jurídica por profissional habilitado.**
A revisão por jurista especializado em LGPD permanece como pendência em bdr-local-001.
