# _local-adr-plan-001: Liquid Glass Rollout

## Executive Summary

- Port the Liquid Glass visual language from the isolated prototype (`design-proposal/index.html`) into the production EAI? application, screen by screen, behind feature flags.
- Phase 0 extracts design tokens into a versioned source before any production component changes.
- Phases 2-4 replace prototype placeholders with real contracts: SSE-driven loading (ADR application/002), real `success_probability`/`userSide` results (EDR principles/001), and LGPD-anonymized, consent-gated persistence for Meus Casos (EDR governance/001).
- Phase 5 (expanded result: plain-language/professional reports, agent chat) is intentionally left as a named placeholder, not specified here — it needs its own UX/Design round before planning.
- Phase 6 gates every prior phase through staging (`eai.radiokactus.com`) review before production (`eaijuridico.com.br`) promotion.
- Owner per phase noted below; QA (Pareto/Probe/Scaffold) and Security (Sentinel/Sovereign/Blast/BAU/Ghost) have standing review rights on every phase, not just their named ones.

## Context and Problem Statement

The Liquid Glass prototype was approved for its visual direction across Home, Mode Workspace, and Meus Casos. It exists only as standalone HTML/CSS/JS with placeholder data and behavior. The production application already has its own architecture (agent pipeline, SSE streaming, Firestore with LGPD anonymization, pricing and beta-access rules) that the prototype does not reference. Without a phased plan, adopting the new visual language risks breaking those existing decisions or shipping the prototype's placeholder behavior (fake timeout loading, generic score, unconsented auto-save) as if it were real.

Question: in what order, and under what gates, should the Liquid Glass language move from prototype to production without violating existing architecture, security, and compliance decisions?

## Proposed Solution

Adopt the language incrementally, tokens first, one screen at a time, each gated by staging validation before production promotion. Reconcile every prototype placeholder with its real production counterpart before a screen is considered done.

Expected end date: 2026-09-30

## Acceptance Criteria

- All phases below reach their acceptance checklist.
- No screen reaches production before passing through staging.
- No user data is persisted by a ported screen without passing the LGPD anonymization step and prior consent.

## Approach

Work proceeds phase by phase, in sequence; a phase does not start implementation until the previous phase's acceptance checklist is met. Galera do Código owns implementation; Galera de UX and Design own screen-level acceptance review; Galera de Segurança reviews any phase touching user input or persistence; Galera de QA builds automated coverage alongside each phase, not after.

## Key Deliverables

- Versioned design token module (Phase 0)
- Full sitemap covering every real screen, including Auth and Payment (Phase 1)
- React shell components for Home/navbar/rail/mobile behind a feature flag (Phase 2)
- Mode Workspace wired to the real agent pipeline and SSE stream (Phase 3)
- Meus Casos wired to Firestore with consent capture and LGPD anonymization (Phase 4)
- Visual regression suite and Page Objects for all ported screens (Phase 6)
- Staging sign-off record per phase before production promotion (Phase 6)

## Key Resources

- Galera do Código (Scout, Flux, Literate, RiverRaid)
- Galera de UX (Compass, Empiricus, PolarBear) and Galera do Design (Canvas, Forge, Quill)
- Galera de Segurança (Sentinel, Sovereign, Blast, BAU, Ghost)
- Galera de QA (Pareto, Probe, Scaffold)
- Staging environment `eai.radiokactus.com`; real low/mid-tier mobile device for `backdrop-filter` performance validation

## Milestones

### Milestone 0: Token foundation
Owner: Forge, Scout, RiverRaid
Due date: 2026-06-30

Extract the prototype's CSS custom properties into a versioned token source (Tailwind config or shared CSS module) and define a `backdrop-filter` performance budget validated on real entry-level mobile hardware.

**Acceptance checklist:**
- [ ] Tokens documented and importable by production components
- [ ] Performance budget defined and measured on real device, not only emulator

**Risks:**
- Stacked blur panels causing jank on low-end devices — Mitigation: cap simultaneous blurred surfaces per screen, measured in Phase 0

### Milestone 1: Full sitemap
Owner: PolarBear, Compass
Due date: 2026-07-07

Map every real screen of the system (Home, Auth, Mode Workspace, Meus Casos, Payment, expanded Result), not only the ones already prototyped, so later phases have a complete picture of scope.

**Acceptance checklist:**
- [ ] Sitemap reviewed and approved by product owner

### Milestone 2: Shell and navigation
Owner: Scout, Flux
Due date: 2026-07-21

Port Home, navbar, rail, and mobile folder views into React components behind a feature flag, using the Phase 0 tokens, with no behavior change versus current production navigation.

**Acceptance checklist:**
- [ ] Visual parity with prototype confirmed in both themes and viewports
- [ ] No regression in existing navigation tests

### Milestone 3: Mode Workspace on real pipeline
Owner: Scout, Literate, Sentinel
Due date: 2026-08-11

Replace the prototype's `setTimeout` processing state with the real SSE stream (ADR application/002) and render the actual `success_probability`/`userSide` result contract (EDR principles/001) instead of a random score.

**Acceptance checklist:**
- [ ] Loading state reflects real agent pipeline progress
- [ ] Result view matches the production data contract exactly

**Risks:**
- Repeating a Mode 4 class of bug (ADR application/003) when wiring new UI to existing agent logic — Mitigation: review against that incident record before implementation, not after

### Milestone 4: Meus Casos with consent and anonymization
Owner: Sovereign, Blast, BAU
Due date: 2026-08-25

Implement Firestore persistence for completed simulations, gated by explicit consent collected before the first simulation and LGPD anonymization (EDR governance/001) applied before any write.

**Acceptance checklist:**
- [ ] Consent capture precedes the first auto-save in the user flow
- [ ] No raw personally identifiable data reaches Firestore unanonymized
- [ ] Compliance review (BAU) signed off

### Milestone 5: Expanded result — scope placeholder
Owner: UX + Design (future round)
Due date: not scheduled

Plain-language and professional report views, plus agent chat, are named here as known future scope but are deliberately not designed yet. A separate UX/Design deliberation round, and its own plan, is required before this milestone gets a due date.

### Milestone 6: QA and staged rollout
Owner: Pareto, Probe, Scaffold
Due date: 2026-09-30

Build visual regression coverage and Page Objects alongside each phase above (not retroactively), run a dedicated exploratory session on real Safari/iOS and older Android WebView for `backdrop-filter` quirks, and require one full review cycle on staging before any phase promotes to production.

**Acceptance checklist:**
- [ ] Visual regression suite covers dark/light x mobile/desktop for every ported screen
- [ ] Exploratory session on real Safari/iOS and Android WebView completed
- [ ] Staging sign-off recorded before each production promotion

## Risks Identified

- Shipping prototype placeholder behavior (fake timeout, generic score, unconsented auto-save) as if it were production-ready — Mitigation: each milestone's acceptance checklist explicitly requires the real contract, not visual parity alone
- `backdrop-filter` browser support gaps on older Safari/Android WebView — Mitigation: Milestone 6 exploratory session and a documented fallback (opaque surface) for unsupported browsers
- Scope creep into the expanded result/chat feature before it is validated — Mitigation: Milestone 5 is explicitly left unscheduled and requires its own future plan

## References

- [_local-adr-policy-006 - Liquid Glass rollout](../004-liquid-glass-rollout.md) - the lasting decision this plan implements
- [001-simulation-pipeline](../001-simulation-pipeline.md)
- [002-sse-streaming](../002-sse-streaming.md)
- [003-mode4-production-incident-2026-06](../003-mode4-production-incident-2026-06.md)
- [EDR governance/001 - lgpd-anonymization](../../../edrs/governance/001-lgpd-anonymization.md)
- [EDR principles/001 - success-probability-interpretation](../../../edrs/principles/001-success-probability-interpretation.md)
