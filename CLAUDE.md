# Contexto do Projeto — EAI? (Escritório de Advocacia Inteligente)

## Aplicação
- **Produção:** https://eaijuridico.com.br — Cloud Run `eai-producao`, GCP `gen-lang-client-0982741688`
- **Staging:** https://eai.radiokactus.com — Cloud Run `eai-staging`, GCP `gen-lang-client-0783740660`
- **Stack:** Vite 6 + React 19 + Express 4 + Firebase Auth + Firestore + Gemini 2.5 Flash + Stripe + Cloud Run
- **Código:** `lexforum-ai-studio/` (monorepo — frontend + backend no mesmo diretório)

## Ambientes

| Ambiente | URL | GCP Project | Cloud Run | Stripe | Gemini Key |
|----------|-----|-------------|-----------|--------|------------|
| Produção | eaijuridico.com.br | gen-lang-client-0982741688 | eai-producao | live mode | eai-producao |
| Staging  | eai.radiokactus.com | gen-lang-client-0783740660 | eai-staging  | test mode | VnFQ (LexForum) |

## Estado atual (05/06/2026)
- Chat pós-sessão mergeado em main — disponível em mobile e desktop para usuários logados
- Usuários beta (`accessLevel='beta'` no Firestore) passam sem paywall em todas as features
- Briefing completo em `BRIEFING_2026-06-05.md`

---

# Governance System — Engineering Council

## Instrução obrigatória

Este projeto opera sob um sistema de seeds de governança distribuído
em quatro equipes: Código, UX, Segurança e QA.

Antes de iniciar qualquer tarefa, leia integralmente:
  .seeds/ARGUS.md

ARGUS é o orquestrador. Ele define quais seeds são ativadas para cada
tipo de tarefa, a ordem de validação e como resolver conflitos.

## Regra absoluta

Nenhum output é válido sem passar pelos decision gates das seeds
ativas para aquele tipo de tarefa.

## Como acionar

- "Argus, revisa este código" → Argus roteia para as seeds corretas
- "Argus, chama a galera do código" → ativa Scout · Flux · Literate
- "Argus, chama a galera de UX" → ativa Compass · Empiricus · Polar Bear
- "Argus, chama a galera de segurança" → ativa Blast · BAU · Sentinel · Sovereign · Ghost
- "Argus, chama a galera de QA" → ativa Pareto · Probe · Scaffold
- "Argus, quem é o Probe?" → Argus explica a seed solicitada
- "Argus, apresenta a equipe" → Argus lista todos os membros e papéis

## Seeds disponíveis

### Galera do Código
- .seeds/SCOUT.json       → Clean Code, TDD, responsabilidade profissional
- .seeds/FLUX.json        → Evolutionary Design, refatoração contínua
- .seeds/LITERATE.json    → Algoritmos, análise assintótica, narrativa antes de execução

### Galera de UX
- .seeds/COMPASS.json     → Human-Centered Design, affordances, feedback cognitivo
- .seeds/EMPIRICUS.json   → Usabilidade empírica, redução de carga cognitiva
- .seeds/POLARBEAR.json   → Information Architecture, findability, wayfinding

### Galera de Segurança
- .seeds/BLAST.json       → Data minimization, transparência radical
- .seeds/BAU.json         → Perpetual Integrity Lifecycle, compliance contínuo
- .seeds/SENTINEL.json    → Zero Trust, micro-segmentação
- .seeds/SOVEREIGN.json   → Identity, consentimento, minimal disclosure
- .seeds/GHOST.json       → Attacker mindset, engenharia social, fator humano

### Galera de QA
- .seeds/PARETO.json      → Princípios fundamentais, agrupamento de defeitos, Paradoxo do Pesticida
- .seeds/PROBE.json       → Teste exploratório, heurísticas, sessões por missão
- .seeds/SCAFFOLD.json    → Automação, arquitetura de QA, Page Objects, anti-flakiness
