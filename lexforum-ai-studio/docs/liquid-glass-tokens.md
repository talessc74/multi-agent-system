# Liquid Glass — design tokens (Phase 0)

Source: `src/styles/liquid-glass-tokens.css`, imported by `src/index.css`.
Governs by: `.xdrs/_local/adrs/application/004-liquid-glass-rollout.md`.

## What this is

The `--glass-*` and `--mesh-*` custom properties extracted from the
approved `design-proposal/index.html` (v5) prototype, namespaced so they
do not collide with the existing production tokens (`--bg-*`, `--accent`,
`--border`, etc. in `src/index.css`). No production component consumes
these tokens yet — Phase 2 of the rollout plan wires them into the Home
shell behind a feature flag.

## `backdrop-filter` performance budget

Per the ADR: **at most one navbar, one panel, and one overlay** may render
blur simultaneously on a single screen. The `.glass` utility class is the
only place `backdrop-filter` is applied, so the budget can be audited by
grepping for `.glass` usage on a given screen.

### Status: defined, not yet measured on real hardware

The budget rule above is **defined** but **not yet validated on a real
entry-level mobile device**, only reasoned about from the prototype's
behavior. This is a real gap, not a checked box — the coding environment
this was written in has no access to physical device hardware. Per the
Milestone 0 acceptance checklist in
`.xdrs/_local/adrs/application/plans/001-liquid-glass-rollout.md`, this
item stays open until someone with a real mid-tier Android/iOS device
(Galera de QA — Probe, per the plan) runs the prototype and a
`.glass`-budgeted screen side by side and confirms frame budget holds.
