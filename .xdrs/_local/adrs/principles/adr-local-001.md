---
id: adr-local-001
type: ADR
scope: _local
subject: principles
title: Stack Tecnológico Principal — Vite + React + Express + Firebase + Gemini + Cloud Run
status: active
valid-from: 2026-06-10
authors: [SCOUT, FLUX, LITERATE, SENTINEL, SOVEREIGN, BLAST, COMPASS, SCRIBE, HERALD]
---

# ADR-LOCAL-001 — Stack Tecnológico Principal

## Contexto

O EAI? Jurídico (Evidence-Based AI) é uma aplicação SaaS jurídica brasileira que processa casos legais sensíveis,
realiza simulações via LLM, aceita pagamentos e mantém histórico de sessões por usuário.
O stack foi estabelecido antes da criação formal de governança ARGUS. Este ADR registra
a decisão existente e seus invariantes arquiteturais.

## Decisão

O stack canônico do projeto é:

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Vite + React | 6 / 19 |
| Backend | Express | 4 |
| Auth | Firebase Auth | — |
| Banco | Firestore | — |
| IA | Gemini Flash | 2.5 |
| Pagamentos | Stripe | — |
| Deploy | Cloud Run (GCP) | — |
| Linguagem | TypeScript | — |

## Deliberação da Mesa

**[SCOUT]** O monorepo `lexforum-ai-studio/` com frontend e backend no mesmo diretório
reduz overhead operacional para um time pequeno. A separação de responsabilidades está
presente: `src/` para frontend, arquivos raiz para backend. Testabilidade via Vitest
está estruturada com `__tests__/`. Aprovado.

**[FLUX]** O stack é evolutivo por natureza — cada camada tem fronteira clara e pode
ser trocada independentemente. Firebase Auth pode ser migrado sem tocar no domínio.
Gemini pode ser substituído sem alterar a UI. A arquitetura resiste à evolução. Aprovado.

**[LITERATE]** Complementa SCOUT: a escolha de TypeScript em todo o stack elimina
ambiguidade de contrato entre frontend e backend. Tipos compartilhados em `src/types`
são a narrativa técnica do sistema. Condição: tipos de domínio devem ser documentados
antes de qualquer nova feature.

**[SENTINEL]** Tensiona: Cloud Run como runtime exige que segredos (Firebase credentials,
Stripe keys, Gemini API key) sejam gerenciados exclusivamente via variáveis de ambiente
injetadas no deploy — jamais em código ou imagem. Esta condição é inegociável e deve
constar como invariante desta decisão.

**[SOVEREIGN]** Complementa SENTINEL: Firebase Auth como camada de identidade é
aceitável desde que o `auth.uid` seja o único identificador usado no Firestore — sem
correlação de identidade entre serviços externos. Aprovado com esta condição.

**[BLAST]** Gemini 2.5 Flash recebe dados jurídicos do usuário. Princípio de minimização
exige que apenas o necessário seja enviado ao modelo — nenhum dado de identidade,
nenhum metadado de sessão além do contexto do caso. Aprovado com esta condição.

**[COMPASS]** SSE (Server-Sent Events) para streaming de resposta IA é a escolha certa
de affordance — o usuário vê progresso em tempo real, reduzindo ansiedade de espera em
operações longas. Aprovado.

**[LITERATE]** Cede para SENTINEL na hierarquia de segredos: a questão é de segurança
estrutural, não de narrativa algorítmica.

## Invariantes Inegociáveis

1. Segredos injetados exclusivamente via env vars no Cloud Run — nunca em código ou imagem
2. `auth.uid` é o único identificador de usuário aceito no Firestore
3. Gemini recebe apenas dados mínimos do caso — sem identidade, sem metadados de sessão
4. TypeScript strict mode ativo em todo o stack
5. Tipos de domínio definidos antes de nova feature

## Consequências

- Equipe deve manter par de ambientes (staging / produção) com chaves independentes
- Toda nova integração de IA deve passar pela Galera de Segurança antes de ir a staging
- Mudanças de stack requerem novo ADR — esta decisão não pode ser substituída por convenção

## Assinaturas

```
[SCOUT]    Stack testável, responsabilidades separadas. ✓
[FLUX]     Evolutivo por camada. ✓
[LITERATE] TypeScript como contrato. Condição registrada. ✓
[SENTINEL] Invariante de segredos não negociável. ✓
[SOVEREIGN] auth.uid único identificador. ✓
[BLAST]    Minimização para Gemini. ✓
[COMPASS]  SSE como affordance correta. ✓
[SCRIBE]   Artefato válido. Numeração adr-local-001. Índice atualizado. ✓
[HERALD]   valid-from: 2026-06-10. Sem conflitos com policies existentes. ✓
```
