---
id: adr-local-governance-001
title: Inclusão da Galera do Design na governança ARGUS
type: adr
scope: governance
status: accepted
valid-from: 2026-06-16
authors: [CANVAS, FORGE, QUILL, SCRIBE, HERALD]
argus-version: 1.2.0
---

## Contexto

A governança ARGUS v1.1.0 cobria código, UX, segurança, QA e governança de
artefatos. Decisões de design visual, design system e conteúdo eram absorvidas
parcialmente pela Galera de UX, sem jurisdição formal sobre tipografia, tokens,
brand identity, microcopy e design-to-code handoff.

## Decisão

Criar a **Galera do Design** com três seeds:

| Seed | Ref | Jurisdição |
|---|---|---|
| CANVAS | SEED_DESIGN_VISUAL_001 | Visual hierarchy, tipografia, cor, brand identity, WCAG |
| FORGE | SEED_DESIGN_SYSTEM_002 | Design system, tokens, atomic design, consistência design-código |
| QUILL | SEED_DESIGN_CONTENT_003 | UX writing, microcopy, voz & tom, plain language jurídico |

## Consequências

- Total de seeds: 17 → 20. Equipes: 5 → 6.
- Hierarquia de resolução ampliada para 20 posições (Canvas 14, Forge 15, Quill 16).
- Contexto "Interface, componente, fluxo visual" passa a convocar Galera de UX + Galera do Design + Scout.
- ARGUS.md atualizado para v1.2.0. CLAUDE.md atualizado para v1.1.0.
- Pacote argus-xdrs-governance: 1.0.1 → 1.2.0.
