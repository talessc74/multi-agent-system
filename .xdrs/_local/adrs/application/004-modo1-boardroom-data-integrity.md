---
name: _local-adr-policy-006-modo1-boardroom-data-integrity
description: Requires the Modo 1/2 input page (Boardroom panel and stats card) to never render placeholder or fallback data as if it were live analysis. Use when touching regionalStats, globalStats, or detectedArea rendering in App.tsx's input step.
apply-to: lexforum-ai-studio/src/App.tsx — state.step === 'input' and the persistent Boardroom sidebar
valid-from: 2026-07-01
---

# _local-adr-policy-006: Modo 1 Boardroom data integrity

## Context and Problem Statement

The Modo 1 ("Tese Estratégica") input page shows two data surfaces at once: a
"Performance Global EAI?" card fed by `getStats()` (real Firestore data) and a
"Disponibilidade de Agentes de IA" regional list that renders `state.regionalStats`,
whose `useState` initial value (`App.tsx:348-355`) is a hardcoded fallback array
(e.g. TRF1: 18/412). When `getAreaStats()` has not yet resolved or returns empty,
this fallback stays on screen indistinguishable from real data.

The same panel also shows "Área Identificada" / "Especialização" (`App.tsx:3847-3848`)
populated from `state.detectedArea`, which defaults to `'OTHER'` (`App.tsx:336`) —
so it renders "Geral / Outros" before the user has typed anything or run validation.

Result: the page can simultaneously claim "88% de ganhos de causa" globally while
showing 4–7% "êxito" per region, and can display a "detected" legal area before any
detection has run. This contradicts the product's own trust messaging (Prova Robusta,
Legal Briefs) and was already flagged informally in `PREVIEW_REDESIGN.html` and
`BRIEFING_2026-06-05.md` (pendência #7) without becoming an enforced rule.

Question: What must the Boardroom/stats panel do while real data has not yet arrived?

## Decision Outcome

**Never render fallback or default values as if they were resolved data — show an explicit loading/empty state instead**

Any value on the Modo 1/2 input page that depends on an async fetch (`getStats`,
`getAreaStats`) or on a pipeline step that has not run yet (area detection) must be
visibly distinguishable from a resolved value. Static arrays or default state MUST NOT
double as user-facing content.

### Details

- `regionalStats`: the initial state MUST NOT be a plausible-looking fallback dataset.
  Replace it with an explicit `isLoading` flag (or an empty array) and render a
  skeleton/placeholder UI until `getAreaStats()` resolves. If the fetch fails or
  returns empty, show a neutral "sem dados suficientes ainda" state — never numbers.
- `detectedArea` / "Área Identificada" / "Especialização": while `state.step === 'input'`
  (i.e., before validation has produced a real `detectedArea`), the Boardroom cards
  for area and specialization MUST NOT show a resolved-looking value such as
  "Geral / Outros". Show a neutral pending state ("Aguardando causa") instead.
- This rule applies only to the `input` step. Once `state.step` reaches `confirm` or
  later and `detectedArea` reflects an actual validation result, rendering it as
  resolved data is correct and expected.
- Global aggregate stats (`globalStats`, from `getStats()`) are exempt from the
  loading-state requirement only if they already default to neutral values
  (`simulations: 0`) — `winRate: 0` is acceptable as a loading default, but
  `precision: 98.4` (`App.tsx:327`) is a non-zero hardcoded default and must be
  treated the same as `regionalStats`: shown only once resolved, or as an explicit
  loading state otherwise.

## Considered Options

Research backing this decision: design review conducted by Galera do Design
(CANVAS · FORGE · QUILL) on 2026-07-01, comparing the live Modo 1 input page
against `App.tsx` source and prior notes in `PREVIEW_REDESIGN.html` and
`BRIEFING_2026-06-05.md`.

## References

- `lexforum-ai-studio/src/App.tsx:327` (`globalStats` initial state)
- `lexforum-ai-studio/src/App.tsx:336` (`detectedArea` initial state)
- `lexforum-ai-studio/src/App.tsx:348-355` (`regionalStats` hardcoded fallback)
- `lexforum-ai-studio/src/App.tsx:381-397` (`fetchInitialStats`)
- `lexforum-ai-studio/src/App.tsx:3839-3884` (Boardroom panel rendering)
- `PREVIEW_REDESIGN.html:1007` — "PAINEL BOARDROOM com dados hardcoded que nunca mudam"
- `BRIEFING_2026-06-05.md` — pendência #7, "Stats com dados reais do Firestore"
