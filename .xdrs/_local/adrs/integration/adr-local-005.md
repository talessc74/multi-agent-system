---
id: adr-local-005
type: ADR
scope: _local
subject: integration
title: Stripe como Única Camada de Pagamento — Webhook Server-Only e Firestore via Admin SDK
status: active
valid-from: 2026-06-10
authors: [SENTINEL, BLAST, BAU, SOVEREIGN, GHOST, SCOUT, SCRIBE, HERALD]
---

# ADR-LOCAL-005 — Integração Stripe como Única Camada de Pagamento

## Contexto

O EAI? Jurídico (Evidence-Based AI) usa Stripe para processamento de pagamentos de laudos (R$ 9,90 / R$ 5,90) e
chat pós-sessão (R$ 2,99). O webhook Stripe é recebido pelo servidor Express e valida
o estado do pagamento antes de atualizar o Firestore via Admin SDK. O cliente nunca
grava diretamente no Firestore para confirmar pagamento.

## Decisão

**O fluxo de pagamento é server-authoritative:** toda confirmação de pagamento passa
pelo webhook Stripe → validação de assinatura → gravação via Admin SDK. O cliente
nunca é fonte de verdade sobre status de pagamento.

## Deliberação da Mesa

**[SENTINEL]** O padrão atual é correto: endpoint `/api/webhook/stripe` recebe
o evento bruto, valida assinatura com `constructWebhookEvent()`, e só então atualiza
o Firestore. Isso elimina qualquer possibilidade de o cliente forjar um pagamento.
Invariante: a validação de assinatura Stripe nunca pode ser desabilitada, mesmo em
ambiente de teste.

**[BLAST]** O webhook recebe metadados do pagamento (valor, currency, status). Esses
dados são necessários para a operação. Condição: nenhum dado de cartão ou PII financeira
toca o servidor — Stripe Elements garante isso no frontend. O servidor só vê tokens
e eventos.

**[BAU]** Dois ambientes têm webhooks distintos (`eai-webhook-staging` vs produção).
Condição inegociável: chaves Stripe live nunca são usadas em staging. A separação de
chaves por ambiente deve ser verificada a cada deploy de staging.

**[GHOST]** Tensiona: o endpoint de webhook é público por necessidade (Stripe precisa
chamar sem auth Bearer). Vetor de ataque: replay de eventos antigos. A validação de
assinatura inclui timestamp — eventos com mais de 5 minutos devem ser rejeitados.
Verificar se `constructWebhookEvent()` já aplica esse check (Stripe SDK aplica por default
com tolerância de 300s). Condição: não desabilitar a validação de timestamp.

**[SOVEREIGN]** O `userId` no Firestore é o vínculo entre pagamento e usuário. A criação
do checkout session deve incluir `metadata.userId` para que o webhook recupere o
contexto sem depender de estado de sessão efêmero.

**[SCOUT]** O fluxo de webhook deve ter teste de integração com eventos Stripe simulados
(fixtures). A ausência de cobertura nesse fluxo cria risco de regressão silenciosa.

## Invariantes Inegociáveis

1. Confirmação de pagamento é sempre server-authoritative via webhook
2. Assinatura Stripe validada em cada evento — sem bypass em nenhum ambiente
3. Timestamp de evento validado — eventos com > 5min rejeitados
4. Chaves Stripe live nunca em staging
5. `metadata.userId` incluído em cada checkout session

## Consequências

- Novo tipo de produto (novo preço) requer novo checkout session endpoint
- Falha no webhook deve ser logada e o evento re-processável — Stripe faz retry automático
- Testes do webhook requerem fixtures de eventos Stripe

## Assinaturas

```
[SENTINEL]  Server-authoritative. Assinatura nunca bypassed. ✓
[BLAST]     Nenhum dado de cartão no servidor. ✓
[BAU]       Separação de chaves por ambiente inegociável. ✓
[GHOST]     Validação de timestamp garantida pelo SDK. Condição registrada. ✓
[SOVEREIGN] metadata.userId no checkout session. ✓
[SCOUT]     Fixtures de teste para webhook registradas como pendência. ✓
[SCRIBE]    Artefato válido. Numeração adr-local-005. Índice atualizado. ✓
[HERALD]    valid-from: 2026-06-10. Sem conflitos. ✓
```
