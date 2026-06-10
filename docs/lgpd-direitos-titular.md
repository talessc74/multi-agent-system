# Processo de Resposta a Pedidos de Direitos do Titular (LGPD Art. 18)

**Referência:** bdr-local-001  
**Versão:** 1.0  
**Data:** 2026-06-10  
**Base legal:** Lei 13.709/2018, Art. 18 e Art. 19

---

## Direitos garantidos

| Direito | Art. LGPD | Prazo de resposta |
|---------|-----------|-------------------|
| Confirmação de existência de tratamento | 18, I | 15 dias |
| Acesso aos dados | 18, II | 15 dias |
| Correção de dados incompletos ou inexatos | 18, III | 15 dias |
| Anonimização, bloqueio ou eliminação de dados desnecessários | 18, IV | 15 dias |
| Portabilidade dos dados | 18, V | 15 dias |
| Eliminação de dados tratados com consentimento | 18, VI | 15 dias |
| Informação sobre compartilhamento com terceiros | 18, VII | 15 dias |
| Revogação do consentimento | 18, IX | Imediato |

---

## Canal de contato

Pedidos de titulares devem ser recebidos via:
- Email dedicado (a ser configurado — ex: `privacidade@eaijuridico.com.br`)
- Ou canal informado nos Termos de Uso

---

## Fluxo de atendimento

### 1. Recebimento e triagem (Dia 0)

- Registrar o pedido com: data de recebimento, tipo de direito solicitado, canal, identificação do titular
- Verificar identidade do solicitante via `uid` Firebase ou email cadastrado
- Confirmar recebimento ao titular com previsão de resposta

### 2. Execução (Dias 1–14)

| Tipo de pedido | Como executar |
|---------------|---------------|
| **Acesso** | Exportar dados via Firebase Console → `simulations`, `users/{uid}`, `chats` |
| **Correção** | Atualizar via Admin SDK — documentar o que foi corrigido |
| **Eliminação** | Deletar `users/{uid}`, `simulations` com `userId={uid}`, `chats` associados via Admin SDK |
| **Portabilidade** | Exportar dados em JSON estruturado e enviar ao titular |
| **Revogação** | Remover consentimento do Firestore — cessar tratamento imediatamente |

### 3. Resposta (Até Dia 15)

- Enviar resposta formal ao titular documentando o que foi executado
- Registrar a conclusão no log de pedidos

---

## Log de pedidos

Manter planilha ou documento com:

| Campo | Descrição |
|-------|-----------|
| Data do pedido | |
| Tipo de direito | |
| Identificação do titular (uid, não nome) | |
| Ação executada | |
| Data de conclusão | |
| Observações | |

---

## Notificação à ANPD

Em caso de incidente de segurança que afete dados dos titulares:
- **Prazo:** 72 horas a partir da ciência do incidente
- **Canal:** Portal da ANPD (gov.br/anpd)
- **Conteúdo mínimo:** natureza dos dados afetados, quantidade de titulares, medidas adotadas, contato do responsável

---

## Dados retidos após eliminação

Por obrigação legal, podem ser mantidos:
- Registros financeiros (pagamentos Stripe) pelo prazo contábil legal (5 anos)
- Logs de auditoria de segurança pelo prazo necessário para defesa em processos

O titular deve ser informado sobre o que foi retido e por qual base legal.

---

## Responsável pelo processo

Até que um DPO formal seja nomeado, o responsável é o administrador do projeto.
A nomeação de DPO é uma pendência registrada em bdr-local-001.
