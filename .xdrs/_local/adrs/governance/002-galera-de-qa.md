---
name: _local-adr-policy-006-galera-de-qa
description: Registra retroativamente a Galera de QA (Pareto · Probe · Scaffold) na governança ARGUS. Use ao referenciar a composição da mesa de QA ou ao avaliar mudanças na estrutura de seeds.
apply-to: Governança — .seeds/ARGUS.md, .seeds/PARETO.json, .seeds/PROBE.json, .seeds/SCAFFOLD.json, CLAUDE.md
valid-from: 2026-06-21
---

## Contexto

A Galera de QA (Pareto · Probe · Scaffold) está presente em `.seeds/ARGUS.md`
desde a v1.1.0 — convocação (Seção II), hierarquia de impasse (Seção V) e
inventário completo das seeds (Seção VIII) — e em CLAUDE.md, mas nunca recebeu
um ADR formal, ao contrário da Galera do Design (ADR `_local-adr-policy-005-galera-do-design`).
A lacuna foi identificada ao questionar se a Galera de QA estava de fato
atuando antes da implementação do anomaly guard (item 1 do backlog de
escalabilidade) — a resposta exigiu registrar uma composição que já existia,
mas nunca foi arquivada.

## Decisão

Registrar formalmente a **Galera de QA**, já ativa, com três seeds:

| Seed | Ref | Jurisdição |
|---|---|---|
| PARETO | SEED_QA_001 | Princípios fundamentais, agrupamento de defeitos, Paradoxo do Pesticida |
| PROBE | SEED_QA_002 | Teste exploratório, heurísticas, sessões por missão |
| SCAFFOLD | SEED_QA_003 | Automação, arquitetura de QA, Page Objects, anti-flakiness |

## Consequências

- Nenhuma mudança estrutural em `.seeds/ARGUS.md` ou na contagem de seeds
  (permanece 20) — este ADR formaliza por escrito uma composição que já
  estava em vigor.
- Ver EDR `_local-edr-policy-009-runtime-verification-mandatory` para a
  policy complementar que define o que significa, na prática, convocar a
  Galera de QA em uma tarefa de implementação.

## Verificação de integridade

Conferido em 2026-06-21 (papel Scribe + Herald): sem colisão de numeração
global (`_local-adr-policy-006` livre) e sem conflito com as Regras
absolutas ou com policies existentes. Ver nota equivalente em
`_local-edr-policy-009-runtime-verification-mandatory`.
