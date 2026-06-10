---
id: adr-local-002
type: ADR
scope: _local
subject: application
title: Arquitetura Multi-Agente com Resolução Dinâmica por Área Jurídica
status: active
valid-from: 2026-06-10
authors: [SCOUT, FLUX, LITERATE, RIVERRAID, SENTINEL, SOVEREIGN, GHOST, COMPASS, POLARBEAR, SCRIBE, HERALD]
---

# ADR-LOCAL-002 — Arquitetura Multi-Agente com Resolução Dinâmica

## Contexto

O EAI? Jurídico (Evidence-Based AI) opera com múltiplos agentes jurídicos especializados (juízes, advogados, consultores)
instanciados sob demanda. Os agentes são criados via `agent-creator.ts`, resolvidos via
`agent-resolver.ts` e registrados em `AGENTS_REGISTRY.json`. Cada agente tem um arquivo
JSON de definição com persona, jurisdição e instruções de comportamento.

## Decisão

O sistema adota arquitetura de agentes com **resolução dinâmica por contexto** — o agente
correto é selecionado pelo `resolveAgent()` com base na área jurídica e modo de simulação,
não por configuração estática. Agentes são artefatos JSON versionados e auditáveis.

## Deliberação da Mesa

**[LITERATE]** A resolução dinâmica via `resolveAgent()` é a narrativa correta: o sistema
seleciona o agente com menor impedância para o contexto apresentado. O registry JSON
funciona como catálogo imutável de personas — leitura em startup, sem hot-reload em
produção. Condição: `resolveAgent()` deve ter fallback explícito para área sem agente
registrado — nunca retornar `undefined` silenciosamente.

**[RIVERRAID]** Complementa LITERATE: o registry é recurso finito. Cada agente carregado
em memória tem custo. `AGENTS_REGISTRY.json` deve ser o único ponto de verdade — sem
duplicação de definições em código. Agentes devem ser lazy-loaded se o registry crescer
além de 20 entradas.

**[SCOUT]** Tensiona RIVERRAID: lazy-load introduz complexidade que não se justifica no
tamanho atual (< 20 agentes). Registry completo em startup é mais simples e testável.
RIVERRAID responde: concordado — a condição de lazy-load é threshold futuro, não
implementação imediata.

**[FLUX]** O padrão JSON para definição de agente é evolutivo: campos novos podem ser
adicionados sem quebrar parsers antigos se o schema usar leitura tolerante. Condição:
campos obrigatórios do schema de agente devem ser documentados em `registry/index/`.

**[SENTINEL]** Agentes recebem o prompt do usuário como contexto. Vetor de prompt
injection é real: um usuário pode tentar manipular o agente via input. Condição
inegociável: o conteúdo do usuário deve ser sanitizado e delimitado explicitamente
no prompt antes de ser passado ao Gemini — jamais interpolado diretamente.

**[GHOST]** Reforça SENTINEL com dimensão de engenharia social: personas de agentes com
nomes reais de juízes ou advogados criam expectativa de autoridade no usuário. A persona
deve incluir disclaimer explícito de que é uma simulação — evita abuso de confiança e
exposição legal.

**[SOVEREIGN]** O chat pós-sessão com agentes cria estado de conversação por usuário.
Esse estado deve ser isolado por `userId` no Firestore — nenhuma mensagem de um usuário
deve ser acessível por outro agente de outro usuário.

**[COMPASS]** A seleção de agente é invisível ao usuário — ele não escolhe manualmente.
Isso é correto: reduz carga cognitiva. Porém, o agente ativo deve ser identificável na
UI durante a simulação para que o usuário entenda com quem está interagindo.

**[POLARBEAR]** Complementa COMPASS: o nome e papel do agente ativo devem aparecer em
posição consistente na UI — não como tooltip oculto. Findability da identidade do agente
é requisito de confiança.

## Invariantes Inegociáveis

1. `resolveAgent()` nunca retorna `undefined` — fallback explícito obrigatório
2. `AGENTS_REGISTRY.json` é o único ponto de verdade para definições de agente
3. Input do usuário é delimitado explicitamente no prompt — nunca interpolado direto
4. Toda persona de agente inclui disclaimer de simulação
5. Estado de chat isolado por `userId` no Firestore

## Consequências

- Novos agentes são adicionados via JSON + entrada no registry — sem mudança de código
- Schema de agente requer campos obrigatórios documentados
- UI deve exibir identidade do agente ativo durante interação

## Assinaturas

```
[SCOUT]    resolveAgent() testável com fallback coberto. ✓
[FLUX]     Schema tolerante, registry como ponto único. ✓
[LITERATE] Fallback explícito é invariante lógica. ✓
[RIVERRAID] Registry finito, threshold de lazy-load documentado. ✓
[SENTINEL] Input sanitizado e delimitado — inegociável. ✓
[GHOST]    Disclaimer de simulação em toda persona. ✓
[SOVEREIGN] Isolamento por userId garantido. ✓
[COMPASS]  Agente visível na UI durante sessão. ✓
[POLARBEAR] Posição consistente do nome do agente. ✓
[SCRIBE]   Artefato válido. Numeração adr-local-002. Índice atualizado. ✓
[HERALD]   valid-from: 2026-06-10. Sem conflitos. ✓
```
