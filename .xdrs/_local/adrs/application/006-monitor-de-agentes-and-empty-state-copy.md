---
name: _local-adr-policy-013-monitor-de-agentes-and-empty-state-copy
description: Requires the "Monitor de Agentes" nav button to only render once a simulation has actually started (never during the input step, where it would always be empty), the Live Logs panel inside it to show each agent's real activation time (not the current clock re-read on every render), and empty-state copy for real-data cards to frame the absence of data as a stated integrity policy, not a generic apology. Use when touching the Modo 1/2 input page's navbar, the Forge Monitor overlay, or any empty state for a real-data card on that page.
apply-to: lexforum-ai-studio/src/App.tsx — Monitor de Agentes nav button, Forge Monitor overlay Live Logs, "Disponibilidade de Agentes de IA" empty state
valid-from: 2026-07-03
---

# _local-adr-policy-013: Monitor de Agentes and empty-state copy

## Context and Problem Statement

Continuing the Modo 1 input-page study (see ADR-006, EDR-011), the user flagged
two of the three originally red-boxed elements as still needing work once the
fabricated-stats bug (EDR-011) was fixed:

1. **"Monitor de Agentes"** — a nav button, visible on every non-boardroom
   step including `input`, that opens a full-screen "Central de
   Monitoramento" overlay. On the input step, before any simulation exists,
   `state.activeAgents` is always empty — the overlay has nothing real to
   show yet the button is always present, implying a live capability that
   isn't there pre-simulation.
2. **"Disponibilidade de Agentes de IA"** card — already honest after
   ADR-006 (real per-area Firestore counts, `null`/empty renders as
   `Sem dados suficientes ainda`), but the copy read as a generic apology /
   deficiency notice rather than something that reinforces trust in an
   early-stage product with low volume.

A third finding surfaced while reviewing the Monitor overlay itself: its
"Live Logs" panel rendered `[{new Date().toLocaleTimeString()}] INSTANCE_SYNC`
per agent — recomputing the *current* clock time on every render, not the
agent's actual activation time. Visually this reads as a live event log; it
never was one.

## Decision Outcome

**Gate the Monitor de Agentes button to `state.step !== 'input'`, replace the
Live Logs fake per-render timestamp with each agent's real activation time,
and rewrite the empty-state copy to state the product's honesty policy
directly instead of apologizing for missing data.**

### Details

- The "Monitor de Agentes" button (`App.tsx`, Navbar children) is now wrapped
  in `{state.step !== 'input' && (...)}`. It still doesn't appear on the
  `boardroom` landing page (separate render branch, unchanged); now it also
  doesn't appear during `input`, only from `confirm`/`simulating`/`result`
  onward — i.e., only once there's something for it to plausibly monitor.
- `AppState['activeAgents']` gained an `activatedAt: number` field
  (`types.ts`), set via `Date.now()` at the same three call sites that
  already push into `activeAgents` (Mode 5 judge activation, and the
  lawyer/judge activation inside the SSE progress handler). The Live Logs
  render now reads `new Date(agent.activatedAt).toLocaleTimeString()` —  a
  real, fixed timestamp captured once, not the render-time clock.
- Empty-state copy for "Disponibilidade de Agentes de IA"
  (`state.regionalStats.length === 0`) changed from a single deficiency line
  ("Sem dados suficientes ainda") to two tiers: an uppercase mono headline
  ("Sem simulações reais nesta área ainda") plus a smaller italic serif line
  ("Preferimos mostrar isso a inventar uma estatística.") that explicitly
  names the product's own no-fabricated-data policy (the same principle
  behind ADR-006/EDR-011) as the reason the card is empty — turning an
  apparent weakness into a stated integrity signal, in the site's existing
  two-tier editorial voice (uppercase mono label + italic serif line, same
  pattern as the hero subhead).
- Out of scope: the "Performance Global EAI?" card needed no copy change —
  post-EDR-011 it already renders real numbers once `stats/global` exists,
  and per this session's testing it is already receiving real production
  data (208 simulations at time of writing).

## References

- `lexforum-ai-studio/src/App.tsx` — Monitor de Agentes button gate, Live Logs timestamp, "Disponibilidade de Agentes de IA" empty-state copy
- `lexforum-ai-studio/src/types.ts` — `AppState['activeAgents']`, added `activatedAt`
- `adrs/application/004-modo1-boardroom-data-integrity.md` — ADR-006, the original no-fabricated-data principle this copy makes explicit to the user
- `edrs/application/007-global-stats-fabricated-fallback.md` — EDR-011, closed the last gap in that principle for the "Performance Global EAI?" card
