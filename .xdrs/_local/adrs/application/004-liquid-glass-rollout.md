---
name: _local-adr-policy-006-liquid-glass-rollout
description: Adopts the Liquid Glass visual language as the design direction for EAI?, rolled out incrementally behind feature flags through staging before production, reconciled with existing simulation pipeline, SSE streaming, and LGPD anonymization rules. Use when implementing, reviewing, or extending any screen that ports the design-proposal prototype into production.
apply-to: Frontend application — App.tsx and all React components, design tokens, staging (eai.radiokactus.com) and production (eaijuridico.com.br) deploys
valid-from: 2026-06-16
---

# _local-adr-policy-006: Liquid Glass rollout

## Context and Problem Statement

A standalone prototype (`design-proposal/index.html`) explored a new visual
language — translucent glass surfaces, animated mesh backgrounds, specular
highlights — across Home, Mode Workspace, and Meus Casos screens. It was
built in isolation from the production stack (no React, no Firestore, no
SSE) and uses placeholder behavior (timeout-simulated processing, generic
score) instead of the real simulation pipeline (ADR application/001, ADR
application/002) and data rules (EDR governance/001, BDR product/003).

How should this visual language move from an isolated prototype to the
production application without breaking existing architecture, security,
and compliance decisions already in force?

## Decision Outcome

**Incremental, flag-gated adoption — staging before production, tokens before screens**

The Liquid Glass language becomes the design system direction for EAI?,
adopted screen by screen behind feature flags, validated in staging
(`eai.radiokactus.com`) before any production deploy. No screen is ported
until its underlying real data flow (pipeline, streaming, persistence) is
identified and reconciled — visual parity with the prototype is not
sufficient grounds to ship.

### Details

- Design tokens (`--glass-fill`, `--glass-border`, `--mesh-*`, etc.) MUST be
  extracted into a versioned source (Tailwind config or CSS custom
  properties module) before any production component adopts them. The raw
  prototype HTML is reference material, not a dependency.
- Each ported screen MUST replace prototype placeholders with the real
  contract: the Workspace loading state consumes the existing SSE stream
  (ADR application/002) instead of a fixed timeout; the result view renders
  the actual `success_probability`/`userSide` contract (EDR
  principles/001), not a random number.
- The "every consultation is saved automatically" behavior (agreed for the
  Meus Casos prototype) MUST NOT ship to production until: (a) explicit
  user consent is collected before the first simulation, and (b) the
  persisted record passes through the existing LGPD anonymization step
  (EDR governance/001) before reaching Firestore. Auto-save without these
  two preconditions is disallowed.
- `backdrop-filter` usage MUST be budgeted: no more than the navbar, one
  panel, and one overlay rendering simultaneously with blur on a single
  screen, to keep mid-tier mobile devices within frame budget. Validate on
  real device hardware, not only emulators, before a screen leaves
  staging.
- A screen ships to production only after: visual regression coverage
  exists for it (dark/light x mobile/desktop), and it has been live on
  staging through at least one full review cycle.
- Expanded result content (plain-language and professional reports, agent
  chat) is explicitly out of scope for this decision. It requires its own
  ADR once UX/Design produce a validated concept — this decision only
  covers the screens already prototyped (Home, Mode Workspace, Meus
  Casos).

## Considered Options

* (REJECTED) **Big-bang replacement** — Replace the current production
  design system in a single release.
  * Reason: violates evolutionary design practice already established in
    this codebase and removes any staged validation point; a single
    regression would affect every screen at once.
* (CHOSEN) **Incremental, flag-gated, staging-first rollout** — Port one
  screen at a time behind a feature flag, validate on staging, then
  promote.
  * Reason: keeps each change reviewable and reversible, matches the
    existing Cloud Build auto-deploy pipeline (EDR devops/001) by adding a
    staging gate in front of it rather than bypassing it.

The execution sequence (phases, milestones, owners) is tracked separately
as an ephemeral plan and is not part of this Policy.

## References

- [Liquid Glass rollout plan](plans/001-liquid-glass-rollout.md) - phase-by-phase execution plan, deleted after full implementation
- [001-simulation-pipeline](001-simulation-pipeline.md) - agent resolution pipeline the Workspace must connect to
- [002-sse-streaming](002-sse-streaming.md) - real streaming contract for the loading state
- [003-mode4-production-incident-2026-06](003-mode4-production-incident-2026-06.md) - lessons that must not be repeated when wiring real data into new UI
- [EDR governance/001 - lgpd-anonymization](../../edrs/governance/001-lgpd-anonymization.md) - mandatory anonymization before persisting case data
- [EDR principles/001 - success-probability-interpretation](../../edrs/principles/001-success-probability-interpretation.md) - result contract the Workspace result view must respect
- [EDR devops/001 - deployment-strategy](../../edrs/devops/001-deployment-strategy.md) - existing auto-deploy pipeline this rollout adds a staging gate in front of
