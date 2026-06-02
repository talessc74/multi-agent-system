# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## REGRAS INEGOCIÁVEIS DO SISTEMA

> Estas regras têm prioridade sobre qualquer outra instrução. Nunca podem ser ignoradas ou contornadas.

1. **Apenas a Semente de Shaw cria sementes** — nenhum outro agente, assistente ou prompt pode gerar ou salvar arquivos em `seeds/`.
2. **Apenas o Especialista cria agentes** — nenhum outro agente, assistente ou prompt pode gerar ou salvar arquivos em `agents/`.
3. **Argus nunca cria sementes ou agentes** — o papel do Argus é auditar, atualizar registros e manter a integridade do sistema, não produzir artefatos de domínio.
4. **Verificação pré-simulação obrigatória** — antes de qualquer simulação de agente, confirmar: (a) o agente existe no `AGENTS_REGISTRY.json`, (b) a semente de origem está registrada, (c) os contadores `total_sementes` e `total_agentes` estão corretos.
5. **AgentResolver é o único ponto de entrada para agentes em runtime**
   — nenhuma rota ou componente busca agentes diretamente no registry.
   — AgentResolver consulta `registry/index/{area}.json` por chave área+tipo+comarca.
   — Quando há lacuna, AgentResolver aciona Shaw+Especialista automaticamente.
   — Shaw e Especialista continuam sendo os únicos criadores. O gatilho mudou de manual para automático — a governança não mudou.
6. **Registry em dois níveis**
   — `agents/AGENTS_REGISTRY.json` → fonte de verdade, todos os agentes.
   — `registry/index/{area}.json` → índice de busca por área e comarca.
   — Após criação de agente novo, ambos devem ser atualizados.

## GUARDIÃO DO CLAUDE.md

**Argus** é o agente responsável por manter este arquivo atualizado. Após cada sessão que produza decisões relevantes (novos agentes, novas sementes, mudanças estruturais, revisões de nomenclatura, alterações de regras), Argus deve:

1. Atualizar os contadores em **Overview**.
2. Atualizar a tabela **Domain Clusters**.
3. Registrar qualquer nova regra ou convenção nas seções correspondentes.
4. Fazer commit `[DOCS] CLAUDE.md — <descrição>` e push.

Nenhuma sessão com decisões relevantes pode ser encerrada sem que este arquivo reflita o estado atual do sistema.

## Overview

This repository contains two distinct components:

1. **Multi-Agent System** — JSON-based, no executable code. All artifacts are configuration files and Markdown prompts consumed by AI platforms (Claude, Gemini, Copilot).
2. **EAI? App** (`lexforum-ai-studio/`) — Vite + Express + TypeScript application deployed at [eaijuridico.com.br](https://eaijuridico.com.br) via Cloud Run.

**Current scale (v5.0.0):** 14 seeds · 13 agents · 2 core config agents · 1 advisory board framework · 1 web application

Three layers make up the multi-agent system:

- **Especialista** (`config/especialista.json`) — Auditor Kern 0xF1, a senior AI agent architect. Receives user intent (with or without a seed) and produces a structured agent JSON file.
- **Semente de Shaw** (`config/semente.json`) — SHAW_ARCHITECT_GENERATOR, a real-time web researcher that distills public knowledge from a person or domain into a reusable seed JSON.
- **Generated agents** (`agents/`) — 13 domain-specific agents created by the Especialista from seeds. See `agents/AGENTS_REGISTRY.json` for the full index.

## Domain Clusters

Agentes operacionais vivem no Firestore, coleção `agents`, criados sob demanda pelo Semente de Shaw e pelo Especialista. Para consultar o inventário real, acesse o console Firebase.

## Conselho Consultivo — Advisory Board

O board é composto por seis membros permanentes, cada um com domínio específico:

| Membro | Seed | Domínio |
|---|---|---|
| **Vic** | SEED_ADV_001 | Estratégia de produto e mercado |
| **Eston** | SEED_ADV_002 | Tecnologia e arquitetura de sistemas |
| **Cresh** | SEED_ADV_003 | Criatividade, narrativa e posicionamento |
| **Ux** | SEED_UX_001 | Experiência do usuário e design |
| **Justin** | SEED_ADV_004 | Jurídico, compliance e riscos |
| **Arch** | SEED_ARCH_001 | Arquitetura de IA e design de agentes |

---

### POSTURA ATIVA OBRIGATÓRIA

> Aplicável a todos os membros do board, sem exceção.

"O board não existe para validar decisões do Tales — existe para melhorá-las.
Cada membro deve sinalizar problemas de forma proativa, antes de ser perguntado.
Se identificar risco em design, produto, estratégia, experiência ou arquitetura,
fale imediatamente — mesmo que ninguém tenha pedido sua opinião."

---

### REGRA DO BOARD

"O Tales não quer ser paparicado. Quer uma equipe que o ajude a não errar.
Concordância sem questionamento é falha de papel.
Silêncio diante de um problema identificado é traição ao projeto."

---

## EAI? Studio — lexforum-ai-studio

`lexforum-ai-studio/` is a Vite + Express + TypeScript application deployed on **Google Cloud Run**.
Origem: migrado do LexForum (Next.js + Vercel + Supabase) em maio/2026. Todo desenvolvimento ativo acontece aqui.

| Property | Value |
|---|---|
| Framework | Vite 6 + React 19 + Express 4 |
| Language | TypeScript 5 |
| Auth & DB | Firebase Auth + Firestore |
| AI Model | Gemini 2.5 Flash (`gemini-2.5-flash`) |
| Deploy | Cloud Run — `eai-producao`, região `us-east1` |
| Projeto GCP | `gen-lang-client-0982741688` |
| URL | eaijuridico.com.br |
| Dockerfile | `lexforum-ai-studio/Dockerfile` |
| Pipeline | `cloudbuild.yaml` (raiz do repo) — push em main deploya automaticamente |

**Variáveis de ambiente** — nunca commitadas. Configurar no Cloud Run Console:
`GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
`RESEND_API_KEY`, `ALERT_EMAIL`, `VITE_FIREBASE_*` (ver `.env.example` para lista completa).

**Dev local:**
```bash
cd lexforum-ai-studio
npm run dev        # Express + Vite em localhost:3000 (requer .env)
npx vite --host    # Só frontend em localhost:5173 (sem backend)
```

**Deploy manual via Cloud Build:**
```bash
gcloud builds submit --config cloudbuild.yaml \
  --project gen-lang-client-0982741688
```

## Modelo de Preços — EAI?

| Produto | Preço |
|---|---|
| Laudo — Modos 1, 2, 4 (Tese Estratégica / Defesa sob Ataque / Mesa Dupla Assistida) | R$ 9,90 |
| Laudo — Modo 3 (Mesa Dupla Juiz) | R$ 5,90 |
| Laudo — Modo 5 (Revisão Pós-Conflito) | R$ 5,90 |
| Chat pós-sessão — 3 perguntas | R$ 2,99 |
| Bundle — Modos 1, 2 ou 4 + Chat | R$ 12,89 |
| Bundle — Modo 3 + Chat | R$ 8,89 |
| Bundle — Modo 5 + Chat | R$ 8,89 |
| Chat em sessão histórica | R$ 2,99 |

## Chat Pós-Sessão — Arquitetura

**Opção B aprovada** — transcript bruto em memória durante a sessão viva.

- Durante a sessão ativa: transcript completo (petições + sentenças + análises) mantido em memória no cliente.
- Ao encerrar o chat ou salvar a sessão: anonimização automática via `anonymizer.ts` (CPF, CNPJ, e-mail, telefone, endereço, nº processo).
- Firebase salva apenas o transcript anonimizado — nunca dados pessoais identificáveis.
- Chat disponível também em sessões históricas (usuário compra acesso a sessão já salva).
- Limite: 3 perguntas por sessão de chat.

## Ciclo Canônico de Simulação — EAI?

O EAI? simula um processo jurídico em até 3 rounds. Um advogado peticiona, um juiz julga, e o sistema evolui a tese a cada ciclo.

### Fase 1 — Preparação (uma vez por simulação)
1. Usuário descreve o caso
2. Sistema classifica o ramo do direito (`LegalArea` é `type string` aberto — Gemini identifica qualquer ramo do direito brasileiro)
3. AgentResolver busca advogado e juiz no Firestore
   - SE existirem → Fase 2
   - SE não existirem → AgentResolver aciona Shaw + Especialista para criar os agentes, depois Fase 2

### Fase 2 — O Ciclo (repete até 3 vezes)

| Round | Advogado | Juiz |
|-------|----------|------|
| 1 | Peticiona com base no caso do usuário | Julga sem contexto anterior |
| 2 | Relê sentença do Round 1, reescreve e melhora | Julga sem lembrar do Round 1 |
| 3 | Relê sentenças anteriores, melhora mais ainda | Julga sem lembrar de nada |

**Regra de memória — NUNCA ALTERAR:** Advogado acumula memória entre rounds. Juiz recebe cada round sem contexto anterior. Esta assimetria garante evolução da tese e imparcialidade do julgamento.

**Gate de saída antecipada:** probabilidade ≥ 95% após qualquer round encerra o ciclo.

### Fase 3 — Apresentação (tempo real)
O sistema exibe cada petição e cada sentença identificadas por round.

### Modos e fluxos

| Modo | Nome | Fluxo |
|------|------|-------|
| 1 | Tese Estratégica | Ciclo completo — até 3 rounds |
| 2 | Defesa Sob Ataque | Ciclo completo — até 3 rounds |
| 3 | Mesa Dupla — Juiz | Julgamento direto — sem advogado |
| 4 | Mesa Dupla — Assistida | Ciclo completo — até 3 rounds |
| 5 | Revisão Pós-Conflito | Análise estratégica pós-decisão |

## Decisões Arquiteturais Ativas

Decisões que afetam o desenvolvimento. Histórico completo em `versions/CHANGELOG.md`.

**Registry de agentes:** NÃO existe registry local de agentes pré-fabricados em `lexforum-ai-studio/`. Shaw+Especialista criam agentes sob demanda; Firestore garante consistência (primeira simulação cria, segunda reutiliza). Índice composto `agents: area ASC + tipo ASC` ativo em produção.

**Temperatura por tipo de agente** (documentado em `docs/agent-temperature-rationale.md`):
Juiz: 0.3 | Advogado: 0.65 | Brief: 0.5 | Validação e Relatório: 0.2 | Geração de agente: 0.4

**Paywall e segurança:**
- `userId` sempre extraído do token Firebase server-side — nunca do body
- `accessLevel` só gravável via Admin SDK — cliente não pode se autopromover
- Betatesters: editar `accessLevel: "beta"` manualmente no Firebase Console
- Subcollection `users/{uid}/payments/{simulationId}` como prova de pagamento

**Alerta de quota:** `notifySpendingCap()` em `server.ts` dispara email via Resend quando `RESOURCE_EXHAUSTED` nas rotas validate, simulate, report, mode5.

**Stats globais:** "98.4% Precisão Média" e win rate são mockados em `App.tsx`. Substituir por dados reais do Firestore quando houver volume de usuários.

**Versionamento dinâmico:** `VITE_GIT_HASH=$SHORT_SHA` injetado via `cloudbuild.yaml`. Exibido no footer como `v2.4.0 · {hash}`.

## Main Workflow

**Step 1 — Create a seed** (optional)
Activate Semente de Shaw with a prompt from `prompts/ativar_semente.md`, get back a seed JSON, save it to `seeds/[name]_v1.0.json`, and update `seeds/SEEDS_REGISTRY.json`.

**Step 2 — Create an agent**
Activate Especialista with a prompt from `prompts/ativar_especialista.md` (optionally including a seed JSON), get back an agent JSON, save it to `agents/[name]_v1.0.json`, and update `agents/AGENTS_REGISTRY.json`.

**Step 3 — Use the agent**
Copy the agent JSON into Claude, Gemini, or Copilot as a system prompt.

**Step 4 — Periodic review** (recommended every 5+ new agents)
Activate the `revisor_sistema_v1.0` agent to audit registry consistency, role overlaps, CLAUDE.md accuracy and accumulated technical debt. Output: `versions/HEALTH_REPORT_vX.Y.Z.md`.

## JSON Structure Rules

### Seed files (`seeds/`) — required fields (standard seeds)
`seed_id`, `seed_version`, `seed_date`, `referencia_fonte`, `kernel_logic`, `decision_gates`, `vocabulary_filter`, `semantic_anchor`

### Seed files (`seeds/`) — additional fields for jurisprudential seeds
Jurisprudential seeds (`seed_tipo: "jurisprudencial"`) replace `kernel_logic` with `kernel_jurisprudencial` and add:
`seed_tipo`, `kernel_jurisprudencial`, `decisoes_reais_analisadas`, `padroes_identificados`

### Agent files (`agents/`) — required blocks
`logicaArquivos`, `logicaInterpretacao`, `instrucoesEspecificas`, `diretrizesEticas`, `versao`

The `logicaDatas` block is **exclusive to the Especialista** and must never appear in generated agent files.

### Structural conformance
All agents in `agents/` follow the same field schema. The legacy anomaly in `agente_claude_code_expert_v1.0` (non-standard `semente_origem`, `BORIS_CHERNY_LEGACY_KERNEL`, extra blocks `logicaDatas` e `referencias_semente`) was corrected in v3.1.1.

## Versioning

File naming: `[name]_v[major].[minor].json`
- `minor` (+0.1): behavioral refinement, small corrections
- `major` (+1.0): new base seed or change of agent objective

Every agent JSON must include `seed_utilizada`, `data_criacao`, and `gerado_por` for traceability.

Both `SEEDS_REGISTRY.json` and `AGENTS_REGISTRY.json` must be updated whenever a new seed or agent is added. **Always verify that `total_sementes` and `total_agentes` counters are correct** — mismatches are a known failure mode.

## Commit Convention

```
[FEAT]       new feature (multi-agent system or EAI? app)
[SEMENTE]    name_seed v1.0 criada
[AGENTE]     name_agent v1.0 gerado
[SECURITY]   security fix or ethics enforcement
[FIX]        structural correction or bug fix
[DOCS]       documentation update (including CLAUDE.md)
[REFACTOR]   code or JSON restructuring without behavior change
[REVISAO]    system health review and audit
[EXPERIMENTO] experimental agent, seed, or flow under evaluation
[CONFIG]     adjustment in Especialista/Semente config
```

All changes must be recorded in `versions/CHANGELOG.md`.

## Ethics & Security

The Especialista enforces Project Zero Mindset (Kern 0xF1). When working with agent JSONs:
- `diretrizesEticas` must contain at least 3 clear directives per block — never compress or omit it.
- If a request would bypass security blocks, the Especialista triggers `[ALERTA DE ESTRUTURA INCOMPLETA]`.
- Privacy by Design and LGPD compliance are mandatory.

## Jornada de Pagamento — Decisões e Fundamentos

### Preços por modo
- Modo 1 — Tese Estratégica: R$ 9,90
- Modo 2 — Defesa sob Ataque: R$ 9,90
- Modo 3 — Mesa Dupla — Juiz: R$ 5,90
- Modo 4 — Mesa Dupla — Assistida: R$ 9,90
- Modo 5 — Revisão Pós-Conflito: R$ 5,90

### Jornada Modo 1 → Modo 4
O usuário inicia pelo Modo 1 e paga R$9,90 para ver o laudo completo.
No laudo, o sistema oferece hipóteses de defesa que ele pode enfrentar (3 geradas + campo livre).
As hipóteses aparecem resumidas — ele pode vê-las sem custo adicional.
Antes de expandir a hipótese escolhida, o sistema exibe um card de desconto:
~~R$9,90~~ R$5,90 — porque ele já pagou o Modo 1.
Ao confirmar o pagamento de R$5,90, a hipótese é expandida e carregada no Modo 4.
O Modo 4 roda com lógica própria. O laudo final do Modo 4 é liberado automaticamente — sem novo paywall — porque o pagamento de R$5,90 já foi a autorização.

### Por que decidimos assim
- O usuário já obteve o valor principal no Modo 1 (força dos argumentos).
- As hipóteses resumidas são gratuitas — ele vê o que vai receber antes de decidir.
- O paywall aparece no momento certo: antes de ver a defesa completa, quando a decisão ainda é consciente.
- O desconto explícito (~~9,90~~ 5,90) ancora o valor e remove a fricção de "vou pagar de novo?".
- O laudo do Modo 4 não tem paywall porque o pagamento já foi feito na etapa anterior.

## Pendências Abertas

- Chat pós-sessão ao vivo (R$ 2,99 / 3 perguntas) — nova fonte de receita
- Chat no histórico — mesmo fluxo, transcript já salvo
- "Meus Casos" — data da consulta (ausente na UI)
- Stats globais com dados reais do Firestore (win rate, precisão, Forge Monitor — hoje mockados)
- Manual do usuário — glossário, como preencher, o que não fazer
- `firestore.rules` — limpar warnings (funções não usadas, variáveis com nomes reservados)
- Botão editar no argumento expandido (Modo 1 → antes do Modo 4)
- Alerta email Resend — confirmar funcionamento com primeiro erro real de quota
- Retry webhook Stripe — monitoramento manual por ora, implementação semana 1
- Seletor AUTOR/RÉU na tela de confirmação — roadmap V2 (lógica no backend, UI removida por decisão de produto)
- Google Analytics GA4 (G-CJHGE4WQPS) — instalado em 01/06/2026, ativo em produção
