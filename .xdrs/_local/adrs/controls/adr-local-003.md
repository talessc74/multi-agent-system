---
id: adr-local-003
type: ADR
scope: _local
subject: controls
title: Zero Trust em Firestore — Rules como Única Linha de Defesa do Lado do Cliente
status: active
valid-from: 2026-06-10
authors: [SENTINEL, SOVEREIGN, BLAST, BAU, GHOST, SCOUT, SCRIBE, HERALD]
---

# ADR-LOCAL-003 — Zero Trust em Firestore

## Contexto

O Firestore expõe dados diretamente ao frontend via SDK cliente. As Security Rules são
a única barreira entre o cliente autenticado e os dados. O projeto possui regras em
`firestore.rules` com controles por coleção. Qualquer falha nas rules expõe dados
jurídicos sensíveis de usuários reais.

## Decisão

As Firestore Security Rules são tratadas como **código de segurança de primeira classe**,
submetidas ao mesmo rigor que código de produção. O modelo é Zero Trust: nenhuma
operação é permitida por default — cada permissão é concedida explicitamente com
validação de schema.

O global safety net `allow read, write: if false` deve permanecer como primeira regra
em qualquer versão das rules. Toda coleção nova exige aprovação da Galera de Segurança
antes de ir a staging.

## Deliberação da Mesa

**[SENTINEL]** O padrão atual está correto: global deny como base, permissões explícitas
por coleção. As coleções `payments`, `chats` e `users` usam Admin SDK server-side —
clients nunca escrevem. Isso é micro-segmentação correta. Condição inegociável: nenhuma
regra `allow write: if true` ou `allow read: if true` sem validação de `request.auth`.

**[SOVEREIGN]** `isOwner(userId)` como guard em todas as leituras de dados pessoais é
correto — garante que `auth.uid` é o único vetor de acesso. Complemento: a função
`isValidId()` com regex e limite de tamanho previne path traversal — deve ser mantida
em qualquer refatoração das rules.

**[BLAST]** A coleção `stats` permite `read: if true` — isso é aceitável pois são dados
agregados sem PII. Porém, a coleção `regions` também é read-public — verificar se não
expõe metadados que permitam inferência de usuário. Condição: auditoria semestral de
cada regra `read: if true`.

**[BAU]** As rules devem ser versionadas e testadas com Firebase Emulator antes de
qualquer deploy. Mudanças em rules são mudanças de controle — requerem aprovação e
teste documentado, não apenas revisão visual.

**[GHOST]** Tensiona: um atacante autenticado pode tentar enumerar `simId` válidos
via tentativa e erro se a regra de `simulations` permitir leitura sem posse do ID.
A regra atual exige `resource.data.userId == null || isOwner(resource.data.userId)` —
correto. Condição: simulações sem `userId` (anônimas) devem ter TTL de expiração —
dados sem dono são superfície de ataque.

**[SCOUT]** As funções helper (`isOwner`, `isValidId`, `isValidSimulation`, etc.) tornam
as rules testáveis e legíveis. Esse padrão deve ser mantido — sem inline logic nas
regras de match.

## Invariantes Inegociáveis

1. Global `allow read, write: if false` é a primeira regra — sempre
2. Nenhuma regra permite write client-side em `payments`, `chats` ou dados financeiros
3. `isOwner()` guarda toda leitura de dados pessoais
4. `isValidId()` valida todo parâmetro de path dinâmico
5. Mudanças em rules passam por Emulator tests antes de staging

## Consequências

- Novas coleções requerem aprovação da Galera de Segurança
- Simulações anônimas devem ter TTL implementado (pendente)
- Auditoria semestral de regras `read: if true`

## Assinaturas

```
[SENTINEL]  Zero Trust por default. Micro-segmentação correta. ✓
[SOVEREIGN] isOwner() como vetor único. isValidId() preservado. ✓
[BLAST]     Auditoria semestral de regras públicas registrada. ✓
[BAU]       Emulator tests obrigatórios antes de deploy. ✓
[GHOST]     TTL para simulações anônimas como pendência registrada. ✓
[SCOUT]     Helper functions mantém testabilidade das rules. ✓
[SCRIBE]    Artefato válido. Numeração adr-local-003. Índice atualizado. ✓
[HERALD]    valid-from: 2026-06-10. Sem conflitos. ✓
```
