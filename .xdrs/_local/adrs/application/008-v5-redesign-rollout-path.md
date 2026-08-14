---
name: _local-adr-policy-008-rollout-path-for-the-v5-redesign
description: Decision to build the V5 "dossiê" visual redesign as a parallel, undisclosed experience at eaijuridico.com.br/novaversao — reusing the existing Express backend/APIs rather than a separate site — until validated and promoted to the default experience. Use when adding screens under /novaversao, deciding what ships in this phase, or evaluating deploy timing for this initiative.
apply-to: lexforum-ai-studio/src/App.tsx routing, the new /novaversao component tree, deployment sequencing for this initiative
valid-from: 2026-08-14
---

# _local-adr-policy-008: Rollout path for the V5 redesign

## Context and Problem Statement

A full visual/UX redesign (V5 "dossiê" concept — see `BRIEFING_REDESIGN_V5_HANDOFF.md`) was
validated with the product owner via HTML prototypes. How do we ship it — landing only or the
full product — without disrupting the live experience at eaijuridico.com.br?

## Decision Outcome

**Build the full redesign (landing + input + simulating + result/laudo) as an undisclosed
parallel path at `/novaversao`, on the same Express server and backend, staged through
`eai-staging` before any production deploy.**

### Details

- No router library exists; top-level screen selection is a plain `window.location.pathname`
  check in `App.tsx` (same pattern already used for `/termos` and `/admin`). `/novaversao`
  follows this pattern with its own component tree — it does not modify the default `/` code
  path.
- `/novaversao` reuses the existing backend as-is (Gemini simulation endpoints, Stripe
  checkout, Firebase Auth/Firestore) — no duplicated services, no separate domain. This is
  why a path was chosen over a standalone site.
- Scope for this phase: Home/Landing, Input, Confirmação, Simulando, Resultado/Laudo.
  `/admin` and `/termos` are out of scope — no redesign exists for them yet.
- The redacted-laudo visual (pen-stroke marks) ships using the existing `CensoredText`
  word-position logic (first ~40% of words visible, rest redacted) — only the rendering
  changes. Selective key-term marking (covering only argumentation-critical terms, e.g. a
  cited súmula, instead of a position-based cutoff) requires a change to the Gemini agent's
  prompt/response shape and is deferred to a follow-up decision.
- Fraunces and JetBrains Mono are self-hosted, not a CDN dependency. A self-hosted General
  Sans substitute is still pending (briefing section 6.1).
- Build order: (1) design tokens + fonts + `/novaversao` shell, (2) Landing, (3)
  Input/Confirmação wired to the real API, (4) Simulando/Resultado wired to the real API and
  Stripe, (5) no-JS + mobile + contrast pass, (6) `eai-staging` validation, (7) production.
- No deploy — staging or production — happens without explicit, per-instance confirmation
  from the product owner. This holds regardless of any auto-deploy-on-push behavior
  documented for `main` (see Conflicts).

## Conflicts

Three independent sources in this workspace (`_local/edrs/devops/001-deployment-strategy.md`,
`_local/edrs/principles/002-commit-strategy.md`, and the Notion project hub) state that
**push to `main` auto-deploys to production** via a Cloud Build trigger. However,
`.github/workflows/deploy-producao.yml` — the only production-deploy mechanism found in this
repository — is `workflow_dispatch`-only (manual). This repo cannot confirm which is accurate;
a live Cloud Build push-trigger may exist in GCP outside the repo. Until verified with the
product owner, treat `main` as if it deploys automatically: do not push `/novaversao` work to
`main` before it is actually ready for production.

## References

- `BRIEFING_REDESIGN_V5_HANDOFF.md` — full design spec (typography, tokens, ticker, redacted laudo)
- `_local/edrs/devops/001-deployment-strategy.md` — general deploy pipeline
- `_local/bdrs/product/002-beta-access-policy.md` — related controlled-access precedent (Firestore `accessLevel`)
- `_local/adrs/application/007-light-mode-color-system.md` — token/contrast precedent this redesign must reconcile with (`colorLight`/`colorRgbLight`)
