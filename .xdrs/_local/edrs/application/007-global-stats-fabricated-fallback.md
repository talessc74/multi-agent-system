---
name: _local-edr-policy-011-global-stats-fabricated-fallback
description: Requires functions that read aggregate/global stats from Firestore to return null (not a plausible invented value) when the source document doesn't exist, so callers can render an honest "no data" state instead of a fabricated number indistinguishable from real data. Use when adding or reviewing any stats/metrics fetch on the Modo 1 input page or its Monitor de Agentes overlay.
apply-to: lexforum-ai-studio/src/services/dbService.ts — getStats; lexforum-ai-studio/src/App.tsx — both getStats() call sites
valid-from: 2026-07-02
---

# _local-edr-policy-011: global stats fabricated fallback

## Context and Problem Statement

ADR-006 (`adrs/application/004-modo1-boardroom-data-integrity.md`) established
that the Modo 1 input page must never render hardcoded fallback stats as if
they were resolved data. Its fix covered the *loading* transition: `globalStats`
starts at `{ simulations: 0, winRate: 0, precision: 0 }` and a `statsLoading`
flag prevents rendering before `fetchInitialStats()` resolves.

That guard does not cover a case discovered while reviewing the "Performance
Global EAI?" card in response to a live-production screenshot: `getStats()`
(`dbService.ts:202-218`, pre-fix) resolved *successfully* with fabricated
numbers whenever the `stats/global` Firestore document didn't exist —
`{ totalSimulations: 14282, totalWins: 10682, winRate: 74.8 }` — and,
separately, defaulted `winRate` to `74.8` even when the document existed but
`totalSimulations` was `0`. Because the promise resolves without throwing,
`statsLoading` flips to `false` and the card renders these numbers exactly as
it would render real ones — no visual distinction, no "sem dados" state, the
exact failure mode ADR-006 intended to close, one layer lower than the UI.

A second instance of the same class was found in the post-simulation stats
refresh (`App.tsx`, `handleSimulate`): `precision` was hardcoded to `98.4` on
every call, regardless of the real derived value already computed correctly
in `fetchInitialStats`.

Question: what should `getStats()` return when there is no real aggregate
document yet, and how should callers treat that?

## Decision Outcome

**`getStats()` returns `null` when there is no real document — never a
plausible invented number.** Callers only update `globalStats` when the
result is non-null; otherwise the existing honest zero/loading state stands.

### Details

- `getStats(): Promise<GlobalStats | null>` — mirrors the existing
  `getAreaStats()` contract (`dbService.ts:276-298`), which already returns
  `null` on empty/errored results. Two stats fetches on the same page must not
  diverge on this contract.
- When the doc exists but `totalSimulations` is `0`, `winRate` is `0` (real
  zero), not `74.8` (invented plausible-looking value).
- On a genuine Firestore error, `handleFirestoreError` still throws (existing,
  unchanged behavior) — both call sites already wrap `getStats()` in
  `try/catch` and leave `globalStats` untouched on failure, so no new error
  handling was needed there.
- Both call sites (`App.tsx` — `fetchInitialStats`, and the post-simulation
  refresh in `handleSimulate`) only call `setGlobalStats` when `getStats()`
  resolves non-null.
- The post-simulation refresh's hardcoded `precision: 98.4` is replaced with
  the same derived calculation `fetchInitialStats` already uses
  (`totalWins / totalSimulations * 100`) — one formula, not two.
- Out of scope: this policy does not add a "sem dados suficientes ainda"
  visual state to the "Performance Global EAI?" card for the case where
  `getStats()` resolves `null` (the card currently just keeps showing the
  zero default). That's a design decision about early-stage-production UX,
  tracked separately, not a data-integrity fix.

## References

- `lexforum-ai-studio/src/services/dbService.ts:202-220` (`getStats`, now returns `null` instead of fabricated numbers)
- `lexforum-ai-studio/src/App.tsx:379-401` (`fetchInitialStats`, guards on non-null before `setGlobalStats`)
- `lexforum-ai-studio/src/App.tsx:926-937` (post-simulation refresh, guards on non-null; `precision` now derived, not hardcoded)
- `lexforum-ai-studio/src/services/dbService.ts:276-298` (`getAreaStats`, the pre-existing correct pattern this policy aligns `getStats` to)
- `lexforum-ai-studio/src/test/dbService.test.ts` — `getStats` describe block, regression test proving the fabricated fallback is gone
- `adrs/application/004-modo1-boardroom-data-integrity.md` — ADR-006, the loading-transition guard this policy closes the remaining gap in
