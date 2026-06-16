---
name: _local-adr-policy-005-galera-do-design
description: Registra a inclusão da Galera do Design (Canvas · Forge · Quill) na governança ARGUS v1.2.0. Use ao referenciar a composição da mesa de design ou ao avaliar mudanças na estrutura de seeds.
apply-to: Governança — .seeds/ARGUS.md, .seeds/CANVAS.json, .seeds/FORGE.json, .seeds/QUILL.json, CLAUDE.md
valid-from: 2026-06-16
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
