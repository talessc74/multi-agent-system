---
id: edr-local-002
type: EDR
scope: _local
subject: application
title: SSE como Padrão para Streaming de Respostas IA — Requisitos de Implementação
status: active
valid-from: 2026-06-10
authors: [SCOUT, LITERATE, RIVERRAID, SENTINEL, COMPASS, EMPIRICUS, SCAFFOLD, SCRIBE, HERALD]
---

# EDR-LOCAL-002 — SSE como Padrão para Streaming de IA

## Contexto

O EAI? Jurídico (Evidence-Based AI) usa Server-Sent Events (SSE) para transmitir respostas do Gemini em tempo real
para o frontend. O utilitário `sse-utils.ts` centraliza `setupSSE()` e `sendSSE()`.
O sistema tem tratamento especial para Safari mobile (SSE retry). O chat pós-sessão
também usa SSE via `/api/chat/message`.

## Decisão

SSE é o protocolo canônico para streaming de respostas IA neste projeto. WebSockets
não são adotados para este caso de uso — SSE é unidirecional (server → client), mais
simples e suficiente para o padrão de interação atual.

## Deliberação da Mesa

**[LITERATE]** SSE é a estrutura correta para este problema: o servidor envia dados
progressivamente enquanto o Gemini gera tokens. O protocolo é simples, stateless no
servidor e nativamente reconectável pelo cliente. A complexidade bidirecional de
WebSockets não é justificada pelo caso de uso.

**[RIVERRAID]** O servidor mantém uma conexão aberta por requisição SSE — recurso
finito em Cloud Run com concorrência máxima. Condição: toda conexão SSE deve ter timeout
máximo configurado. Se o Gemini não responde em N segundos, o servidor encerra a
conexão com evento de erro — nunca deixa conexão aberta indefinidamente.

**[SCOUT]** O utilitário `sse-utils.ts` é a abstração correta — nenhum handler chama
`res.write()` diretamente. Toda adição de endpoint SSE usa `setupSSE()` e `sendSSE()`.
Duplicação desse código em outros arquivos invalida a abstração e cria divergência.

**[SENTINEL]** O endpoint SSE deve validar autenticação antes de abrir o stream. Um
endpoint SSE não autenticado permite que qualquer cliente abra conexões e consuma quota
de Gemini. Condição: token Firebase validado antes de `setupSSE()` em todos os endpoints.

**[COMPASS]** O indicador de digitação durante SSE (já implementado em `ChatPanel.tsx`)
é o feedback correto. Condição: o cliente deve exibir estado de erro claro quando o
stream é interrompido — não apenas silêncio ou spinner infinito.

**[EMPIRICUS]** O retry automático do SSE (implementado para Safari) deve ter limite —
não pode tentar indefinidamente se o servidor está com erro. Três tentativas com backoff
exponencial é o padrão de usabilidade aceitável.

**[SCAFFOLD]** Testes de SSE com respostas simuladas (mock do Gemini) devem cobrir:
stream completo, stream interrompido no meio, timeout do servidor, e reconexão automática.

## Invariantes Inegociáveis

1. `setupSSE()` e `sendSSE()` são os únicos pontos de escrita SSE — sem `res.write()` direto
2. Todo endpoint SSE valida autenticação antes de abrir o stream
3. Toda conexão SSE tem timeout máximo configurado no servidor
4. Cliente exibe estado de erro explícito quando o stream é interrompido

## Pendências Resolvidas

- ✅ Timeout de 120s implementado em `sse-utils.ts` — todos os endpoints SSE cobertos (2026-06-10)
- ✅ Testes automatizados implementados em `__tests__/sse-utils.test.ts` — timeout, close, writableEnded

## Consequências

- Novos endpoints de streaming adotam SSE via `sse-utils.ts` — sem alternativas
- WebSockets ficam fora do escopo até que haja caso de uso bidirecional justificado
- Monitoramento de conexões SSE abertas é parte da observabilidade do servidor

## Assinaturas

```
[LITERATE]  SSE como estrutura correta para streaming unidirecional. ✓
[RIVERRAID] Timeout obrigatório — recurso finito. ✓
[SCOUT]     sse-utils.ts como único ponto de abstração SSE. ✓
[SENTINEL]  Autenticação antes de setupSSE() em todos os endpoints. ✓
[COMPASS]   Feedback de erro explícito no cliente. ✓
[EMPIRICUS] Retry com limite e backoff exponencial. ✓
[SCAFFOLD]  Testes SSE como pendência. ✓
[SCRIBE]    Artefato válido. Numeração edr-local-002. Índice atualizado. ✓
[HERALD]    valid-from: 2026-06-10. Sem conflitos. ✓
```
