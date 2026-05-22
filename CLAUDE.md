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
2. **EAI? App** (`lexforum-ai-studio/`) — Vite + Express + TypeScript application deployed at [eai.radiokactus.com](https://eai.radiokactus.com) via Cloud Run.

**Current scale (v5.0.0):** 14 seeds · 13 agents · 2 core config agents · 1 advisory board framework · 1 web application

Three layers make up the multi-agent system:

- **Especialista** (`config/especialista.json`) — Auditor Kern 0xF1, a senior AI agent architect. Receives user intent (with or without a seed) and produces a structured agent JSON file.
- **Semente de Shaw** (`config/semente.json`) — SHAW_ARCHITECT_GENERATOR, a real-time web researcher that distills public knowledge from a person or domain into a reusable seed JSON.
- **Generated agents** (`agents/`) — 13 domain-specific agents created by the Especialista from seeds. See `agents/AGENTS_REGISTRY.json` for the full index.

## Domain Clusters

Agents are organized into six functional clusters:

| Cluster | Seeds | Agents |
|---|---|---|
| IA & Tech | SEED_AI_001, SEED_ENG_001, SEED_SYS_001 | consultor_ia, agente_claude_code_expert, revisor_sistema |
| Produto & UX | SEED_PM_001, SEED_UX_001 | arquiteto_produto, ux_validator |
| Jurídico Consumerista | SEED_JUR_001, SEED_JUR_002, SEED_JUR_003 | advogado_consumerista, juiz_jec, juiz_everton, juiza_rosemarie |
| Jurídico Trabalhista | SEED_JUR_004 | advogado_mannrich |
| Jurídico Cível | SEED_JUR_006 (pendente), SEED_JUR_007 (pendente) | — |
| Advisory Board | SEED_ADV_001 (Vic), SEED_ADV_002 (Eston), SEED_ADV_003 (Cresh), SEED_UX_001 (Ux), SEED_ADV_004 (Justin), SEED_ARCH_001 (Arch) | conselho_consultivo_lexforum |

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

## Histórico — Origem LexForum (descontinuado)

O projeto teve origem como LexForum, uma aplicação Next.js 16
hospedada em lexforum.radiokactus.com via Vercel, com Supabase
como banco de dados.

Em maio de 2026 o produto foi migrado para EAI? Studio
(`lexforum-ai-studio/`), stack Vite + Express + Firebase + Cloud Run.
O domínio lexforum.radiokactus.com permanece ativo mas
não é mais o produto principal.

Todo desenvolvimento ativo acontece em `lexforum-ai-studio/`.

## EAI? Studio — lexforum-ai-studio

`lexforum-ai-studio/` is a Vite + Express + TypeScript application deployed on **Google Cloud Run**.

| Property | Value |
|---|---|
| Framework | Vite 6 + React 19 + Express 4 |
| Language | TypeScript 5 |
| Auth & DB | Firebase Auth + Firestore |
| AI Model | Gemini 2.5 Flash (`gemini-2.5-flash`) |
| Deploy | Cloud Run — `eai-producao`, região `us-east1` |
| Projeto GCP | `gen-lang-client-0982741688` |
| URL | eai.radiokactus.com |
| Dockerfile | `lexforum-ai-studio/Dockerfile` |
| Pipeline | `cloudbuild.yaml` (raiz do repo) |

**Variáveis de ambiente** — nunca commitadas. Configurar no Cloud Run Console:
`GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
`VITE_FIREBASE_*` (ver `.env.example` para lista completa).

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

**Build local da imagem:**
```bash
docker build -t eai-producao ./lexforum-ai-studio
docker run -p 3000:8080 --env-file lexforum-ai-studio/.env eai-producao
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

Regras de funcionamento:
- Durante a sessão ativa: transcript completo (petições + sentenças + análises) mantido em memória no cliente.
- Ao encerrar o chat ou salvar a sessão: anonimização automática antes de qualquer persistência.
- Firebase salva apenas o transcript anonimizado — nunca dados pessoais identificáveis.
- Chat disponível também em sessões históricas (o usuário compra acesso a uma sessão já salva).
- Limite: 3 perguntas por sessão de chat.

## Ciclo Canônico de Simulação — EAI?

### Visão Geral
O EAI? simula um processo jurídico em até 3 rounds. Um advogado peticiona,
um juiz julga, e o sistema evolui a tese a cada ciclo.

### Fase 1 — Preparação (acontece uma vez por simulação)
1. Usuário descreve o caso
2. Sistema lê e classifica o ramo do direito
3. AgentResolver busca no registry se já existem advogado e juiz para a área
   - SE existirem → vai direto para a Fase 2
   - SE não existirem → AgentResolver aciona Shaw + Especialista para criar
     os agentes, depois vai para a Fase 2

### Fase 2 — O Ciclo (repete até 3 vezes)

| Round | Advogado                                      | Juiz                          |
|-------|-----------------------------------------------|-------------------------------|
| 1     | Peticiona com base no caso do usuário         | Julga sem contexto anterior   |
| 2     | Relê sentença do Round 1, reescreve e melhora | Julga sem lembrar do Round 1  |
| 3     | Relê sentenças anteriores, melhora mais ainda | Julga sem lembrar de nada     |

**Regra de memória — NUNCA ALTERAR:**
Advogado acumula memória entre rounds.
Juiz recebe cada round sem contexto anterior.
Esta assimetria é regra de negócio — garante evolução da tese e imparcialidade do julgamento.

**Gate de saída antecipada:**
Se o sistema detectar probabilidade de ganho ≥ 95% após qualquer round,
o ciclo encerra. Não é necessário completar os 3 rounds.

### Fase 3 — Apresentação (tempo real)
O sistema exibe cada petição e cada sentença identificadas por round.
O usuário acompanha a evolução do caso ciclo a ciclo.

### Modos e fluxos

| Modo | Nome                   | Fluxo                             |
|------|------------------------|-----------------------------------|
| 1    | Tese Estratégica       | Ciclo completo — até 3 rounds     |
| 2    | Defesa Sob Ataque      | Ciclo completo — até 3 rounds     |
| 3    | Mesa Dupla — Juiz      | Julgamento direto — sem advogado  |
| 4    | Mesa Dupla — Assistida | Ciclo completo — até 3 rounds     |
| 5    | Revisão Pós-Conflito   | Análise estratégica pós-decisão   |

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

## Sessão 20/05/2026 — Stripe + Paywall (tarde)

**Integração Stripe completa — paywall real substituindo setState fictício**

- `firebase-admin` instalado — Admin SDK disponível no servidor
- `dbService.ts` — `saveSimulation` retorna `simulationId`; novas funções `createOrUpdateUser`, `hasUserPaidForSession`, `getUserAccessLevel`
- `firestore.rules` — collection `users` protegida; subcollection `payments/{simulationId}` somente Admin SDK
- `server.ts` — Admin SDK inicializado com credenciais via env vars; rota `POST /api/stripe/create-checkout-session` com validação de token Firebase; webhook `checkout.session.completed` grava pagamento no Firestore via Admin SDK
- `App.tsx` — `handleCheckout` chama o Stripe; retorno via `?sim=ID` verifica pagamento e libera laudo; `createOrUpdateUser` chamado no login
- `types.ts` — `simulationId` adicionado ao `AppState`

**Arquitetura de segurança do paywall:**
- `userId` sempre extraído do token Firebase server-side — nunca do body
- `accessLevel` só gravável via Admin SDK — cliente não pode se autopromover
- Subcollection `users/{uid}/payments/{simulationId}` como prova de pagamento
- Betatesters: editar `accessLevel: "beta"` manualmente no Console do Firebase

**Commit:** `593d267` — [FEAT] Stripe — checkout session, webhook, paywall e controle de acesso beta

---

## Sessão 20/05/2026 — O que foi entregue

- Login Google funcionando nas duas páginas (BoardroomPage + App)
- `authDomain` corrigido para `eairadiokactus.firebaseapp.com`
- Header consistente entre BoardroomPage e App (Logo, Meus Casos, dropdown de usuário)
- Logout via dropdown — clique no nome/foto abre menu com botão "Sair"
- Meus Casos funcional — abre login se deslogado, histórico se logado
- Anonimização automática antes de salvar no Firebase (`anonymizer.ts` — CPF, CNPJ, e-mail, telefone, endereço, nº processo)
- Modo 5 calibrado — `successProbability` substitui `confidenceLevel`; barra visual com faixas semânticas por subcaso (RECURSO / ACORDO)
- Modelo de preços definido e documentado no CLAUDE.md

## Sessão 20/05/2026 — Correção de Bugs (noite)

**4 bugs corrigidos — sistema estável para testes beta**

### Bug 1 — Modo 5 ignorava status beta [FIX] commit 7c7656e
- App.tsx linha 327: `isUnlocked: false` hardcoded sobrescrevia o estado beta ao fim da simulação do Modo 5
- Correção: removido `isUnlocked: false` do setState — estado beta preservado via spread

### Bug 2 — Nome interno vazando na simulação [FIX] commit 721ff64
- agent-creator.ts: ESPECIALISTA_V2 expunha "Auditor Kern 0xF1" como nomeAgente
- Gemini recebia o nome interno no contexto e reproduzia no output do advogado
- Correção: nomeAgente alterado para "Arquiteto Especialista"

### Bug 3 — Advogado do lado errado no Modo 4 [FIX] commit fd9bfcb
- server.ts: resolveAgent sempre buscava tipo 'advogado' independente do userSide
- userSide não era propagado pela cadeia server.ts → agent-resolver.ts → agent-creator.ts
- Correção: userSide adicionado à interface ResolveParams e CreateAgentParams, propagado até a description do agente criado dinamicamente
- Limitação conhecida: inversão só afeta agentes criados do zero — agentes já no registry não são afetados. Pendência futura.

### Bug 4 — "null" literal nas sentenças [FIX] commit 3f71a07
- server.ts: specificJudge chegava como string "null" do cliente
- Operador ?? não captura string "null" — valor passava direto para o agente
- Correção: guard explícito `specificJudge && specificJudge !== 'null'` nas 3 ocorrências

## Sessão 21/05/2026 — Correções Mobile e Bug 3

**3 fixes aplicados — sistema estável**

### Fix 1 — Header mobile cortado [FIX] commit a6f3cdd
- BoardroomPage.tsx: px-8 → px-4 md:px-8, gap-6 → gap-3 md:gap-6
- Botão "Meus Casos" oculta texto em mobile: hidden md:inline
- Corrige logo cortada em telas pequenas

### Fix 2 — Header mobile App.tsx [FIX] commit ba0328d
- Mesmo padrão aplicado ao header das telas de simulação
- px-8 → px-4 md:px-8, gap-6 → gap-3 md:gap-6
- Botão "Meus Casos" com hidden md:inline

### Fix 3 — Bug 3 resolvido: advogado do lado correto no Modo 4 [FIX] commit a686815
- gemini.server.ts: sideContext injetado na systemInstruction do advogado
- Quando userSide === 'DEFENSE': advogado recebe instrução explícita de defender o réu
- Quando userSide === 'AUTHOR': advogado recebe instrução explícita de defender o autor
- Solução cirúrgica — sem criar novos agentes, sem mexer no registry
- Complementa as correções de ontem na cadeia server.ts → agent-resolver.ts → agent-creator.ts

## Sessão 21/05/2026 — Login, Cadastro e Deploy (noite)

**4 entregas em produção**

### Fix 1 — Logo compacta no header mobile [FIX] commit 66ce141
- BoardroomPage.tsx e App.tsx: size="md" showTitle={false} → size="sm" showText={false}
- Logo EAI✓? aparece limpa e compacta em mobile sem texto lateral

### Feat 1 — LoginModal com Google e email/senha [FEAT] commit 096be16
- Criado lexforum-ai-studio/src/components/LoginModal.tsx
- Modal com botão Google + formulário email/senha
- BoardroomPage.tsx: botão "Entrar" abre modal em vez de chamar loginWithGoogle direto

### Fix 2 — onSuccess do LoginModal corrigido [FIX] commit d45484c
- BoardroomPage.tsx: onSuccess não chama onLogin() desnecessariamente
- Firebase onAuthStateChanged já cuida do estado do usuário

### Feat 2 — Cadastro com email/senha [FEAT] commit 41abd68
- LoginModal.tsx: dois modos — login e register
- Modo register: email + senha + confirmar senha com validação local
- Link de alternância entre modos
- Cadastro testado e funcionando — usuários aparecem no Firebase Console

## Sessão 22/05/2026 — Recuperação de senha

### Feat — Esqueci minha senha [FEAT] commits aff30e2 → f1efed5
- firebase.ts: sendPasswordResetEmail importado, resetPassword exportado
- LoginModal.tsx: modo 'forgot' adicionado ao union type
- resetForm e switchMode atualizados para suportar 'forgot'
- handleForgot implementado com resetPassword do Firebase
- Título do modal adaptado ao modo ativo
- Link "Esqueci minha senha" adicionado ao modo login
- Bloco visual forgot: formulário + tela de confirmação pós-envio
- Implementação cirúrgica — 7 commits atômicos, zero substituição de arquivo

## Sessão 21/05/2026 — EAI? Evoluções UX, SSE e Consistência (noite)

**8 entregas + decisões arquiteturais**

### Tarefa 1 — Remove exibição de comarca e nome do juiz [FIX] commit 81b7a87
- App.tsx: card "FORO / COMARCA" substituído por "ESPECIALIZAÇÃO" com texto dinâmico baseado na área detectada
- Tela confirm: referência condicional ao specificJudge removida — texto fixo

### Tarefa 2 — Temperatura por tipo de agente [FIX] commit 709eff7
- gemini.server.ts: 11 temperatures aplicadas conforme tipo de agente
- Juiz: 0.3 / Advogado: 0.65 / Brief: 0.5 / Validação e Relatório: 0.2 / Geração de agente: 0.4

### DOCS — Critérios de temperatura documentados [DOCS] commit e57ef5a
- Criado lexforum-ai-studio/docs/agent-temperature-rationale.md
- Filosofia, tabela completa, princípio orientador e data de revisão (agosto/2026)
- 11 comentários inline adicionados no gemini.server.ts

### Tarefa 3 — Camada de incerteza ao índice [FEAT] commit a2cdada
- App.tsx: dois textos adicionados abaixo do percentual em todos os modos
- "Índice de força argumentativa — não probabilidade estatística."
- "Estimativa baseada na sua descrição. Resultados reais variam."
- Cobertos: Modos 0–4 e Modo 5

### Tarefa 4 — Disclaimers padronizados [FIX] commit a586dd5
- App.tsx: 3 disclaimers diferentes unificados em texto único
- Texto padrão: "O EAI? é uma ferramenta de simulação argumentativa. Não é aconselhamento jurídico. Não substitui advogado."

### Tarefa 5 — Área sensível com recursos de apoio [FEAT] commit 13a59f5
- App.tsx: bloco condicional exibido quando detectedArea === FAMILY ou SOCIAL_SECURITY
- Recursos: 180 (Central de Atendimento à Mulher), 188 (CVV), Defensoria Pública, CRAS
- Inserido em 3 pontos: resultado bloqueado, resultado desbloqueado e Modo 5

### SSE — Retry automático com aviso e preservação de estado [FEAT] commit 005c553
- types.ts: isRetryable?: boolean adicionado ao tipo error
- gemini.ts: simulateForum reescrita com MAX_RETRIES=3, backoff 1.5s × tentativa
- App.tsx: banner âmbar "Reconectando... tentativa X de 3" durante retry
- App.tsx: mensagem de falha final com botão "Tentar Novamente" — state preservado
- Resolve problema de queda de conexão no Safari mobile

### Limpeza — Agentes órfãos deletados (Firestore)
- Coleção agents: juiz_consumerista_546876 e advogado_consumerista_572121 deletados
- Criados pelo EspecialistaV1 antes do framework atual — não referenciados em nenhum ponto do código
- Restam 4 documentos na coleção — também órfãos, deleção pendente

### Decisão arquitetural — Registry local descartado
- registry/index/ não existe dentro de lexforum-ai-studio/ e nunca foi copiado para o container
- findAgentLocal() sempre falha graciosamente — sistema cai no Firestore
- Decisão: NÃO criar registry local com agentes pré-fabricados
- A dupla Shaw+Especialista cria agentes sob demanda — essa é a joia do sistema. Intocável.
- Consistência garantida pelo Firestore: primeira simulação cria o agente, segunda reutiliza
- Índice composto agents: area ASC + tipo ASC confirmado no firestore.indexes.json
- Pendência: deploy do índice em produção via firebase deploy --only firestore:indexes

## Pendências conhecidas (atualizado 21/05/2026 noite — pós sessão EAI?)

- Stripe — testar fluxo end-to-end com compra real (modo live)
- Chat pós-sessão ao vivo
- Chat no histórico
- Stats estáticos — win rate e simulações precisam vir do Firestore
- Modo 5 ACORDO — label "Vantagem clara — rejeitar" precisa ajuste
- "Auditor Kern 0xF1" vazando no laudo — generateReportServer em gemini.server.ts
- Cadastro público aberto — controle de accessLevel beta ainda manual no Firebase Console
- Deletar 4 agentes órfãos restantes no Firestore (advogado_civel, advogado_familia, juiz_civel, juiz_familia)
- ✅ Índice Firestore agents (area ASC + tipo ASC) confirmado como Ativado via Console Firebase
- Tarefa 6 — Consistência entre execuções: dependente do deploy do índice acima
- Tarefa 7 — Tom reflexivo nos prompts (gemini.server.ts)
- SSE mobile — SSE retry implementado; monitorar reconexão Safari em produção
- Dark/light mode — fila futura, não é MVP
- Renomear pasta lexforum-ai-studio/ — avaliar impacto no Dockerfile e cloudbuild.yaml

## Ethics & Security

The Especialista enforces Project Zero Mindset (Kern 0xF1). When working with agent JSONs:
- `diretrizesEticas` must contain at least 3 clear directives per block — never compress or omit it.
- If a request would bypass security blocks, the Especialista triggers `[ALERTA DE ESTRUTURA INCOMPLETA]`.
- Privacy by Design and LGPD compliance are mandatory.
