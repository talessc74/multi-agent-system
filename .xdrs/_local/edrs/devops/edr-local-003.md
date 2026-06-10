---
id: edr-local-003
type: EDR
scope: _local
subject: devops
title: Gestão de Quota e Alertas Gemini — Política de Monitoramento e Resposta
status: active
valid-from: 2026-06-10
authors: [RIVERRAID, BAU, BLAST, SENTINEL, SCOUT, SCRIBE, HERALD]
---

# EDR-LOCAL-003 — Gestão de Quota e Alertas Gemini

## Contexto

O EAI? Jurídico (Evidence-Based AI) depende da API Gemini com conta de faturamento ("Minha conta de faturamento",
saldo R$100 adicionado em 04/06/2026). O sistema já tem alerta de quota por email via
Resend (`alerts.ts`). O endpoint `notifySpendingCap()` é chamado em caso de
`RESOURCE_EXHAUSTED` (HTTP 429) em chamadas ao Gemini.

## Decisão

O sistema adota monitoramento proativo de quota Gemini com alertas automáticos e
política de resposta definida. A degradação por quota deve ser tratada como incidente
de disponibilidade — não como erro silencioso.

## Deliberação da Mesa

**[RIVERRAID]** A API Gemini é um recurso finito com limite de quota e orçamento.
O sistema deve operar com consciência desse limite. Condições:
(1) threshold de alerta a 80% do orçamento — não esperar 100%;
(2) fallback de resposta ao usuário quando quota é excedida — não erro genérico 500.

**[BAU]** `notifySpendingCap()` é chamado apenas em `RESOURCE_EXHAUSTED`. Isso é
reativo. O monitoramento deve ser proativo: verificação periódica do saldo da conta
e alerta quando abaixo do threshold. Condição: implementar checagem de saldo em schedule
(ex: diária) além do alerta reativo por erro 429.

**[BLAST]** O alerta por email via Resend expõe metadados de operação (endpoint que
falhou, horário). Garantir que os emails de alerta não incluam dados do caso que gerou
o erro — apenas o endpoint e o tipo de erro.

**[SENTINEL]** A chave Gemini de produção (`eai-producao`) deve ter controles de uso
distintos da chave de staging (`VnFQ`). Monitoramento de uso anormal (picos inesperados)
deve gerar alerta — pode indicar uso não autorizado da chave.

**[SCOUT]** A função `notifySpendingCap()` deve ser testável — receber o endpoint como
parâmetro (já faz isso) e ter mock de Resend nos testes. Alertas não testados falham
silenciosamente.

## Invariantes Inegociáveis

1. Quota excedida exibe mensagem de erro compreensível ao usuário — sem 500 genérico
2. Emails de alerta não contêm dados do caso — apenas endpoint e tipo de erro
3. Chaves Gemini de produção e staging são monitoradas independentemente
4. `notifySpendingCap()` testável com mock de Resend

## Pendências Registradas

- Checagem proativa de saldo da conta Gemini em schedule diário
- Alerta de uso anormal (pico inesperado) por chave
- Threshold de alerta a 80% do orçamento

## Consequências

- Adição de saldo à conta Gemini deve ser documentada (data, valor, responsável)
- Política de resposta a quota excedida deve incluir tempo esperado de restore
- O custo por simulação deve ser estimado para projetar duração do saldo

## Assinaturas

```
[RIVERRAID] Threshold proativo a 80%. Fallback ao usuário. ✓
[BAU]       Monitoramento proativo como pendência crítica. ✓
[BLAST]     Emails de alerta sem dados do caso. ✓
[SENTINEL]  Monitoramento independente por chave. ✓
[SCOUT]     notifySpendingCap() testável. ✓
[SCRIBE]    Artefato válido. Numeração edr-local-003. Índice atualizado. ✓
[HERALD]    valid-from: 2026-06-10. Sem conflitos. ✓
```
