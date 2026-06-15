---
name: _local-adr-policy-003-mode4-production-incident-2026-06
description: Complete incident record for the Mode 4 (Mesa Dupla Assistida) production debugging session of June 2026. Use as a reference guide whenever debugging similar symptoms in any simulation mode: display inconsistencies, probability variance, laudo addressing wrong party, or judge frame ambiguity.
apply-to: gemini.server.ts · App.tsx · gemini.ts · server.ts · dbService.ts — all simulation modes
valid-from: 2026-06-15
---

# _local-adr-policy-003: Mode 4 Production Incident — June 2026

## Overview

Three-day production debugging session (2026-06-12 to 2026-06-15) addressing a cluster
of interrelated defects in Mode 4 (Mesa Dupla Assistida). Root cause: the `userSide`
parameter was not threaded consistently through the simulation, display, persistence, and
report generation layers.

**Impact before fix:** Mode 4 was unusable for RÉU users — wrong probability displayed,
laudo addressed them as Autor, probability swung 75 points between identical runs.

**Impact after fix:** Mode 4 delivers consistent results for both sides. RÉU users see
their probability correctly, laudo is addressed to their perspective, variance is stable.

---

## Symptom Timeline

| Date | Symptom observed |
|------|------------------|
| 2026-06-12 | Raw JSON appearing in laudo PDF instead of readable text |
| 2026-06-12 | Probability reading 50% for same case on every run (stuck) |
| 2026-06-13 | RÉU user seeing Autor's probability in paywall/sidebar/mobile |
| 2026-06-13 | Laudo PDF addressing RÉU user as "Reclamante/Autor/Exequente" |
| 2026-06-14 | 75-point variance confirmed: same case, same side, RÉU — 5% one run, 95% next |
| 2026-06-14 | Run 2 of produção_7: empty judgment field alarmed user (Round 2 of 3) |

---

## Bug Inventory

### Category A — Confirmed Defects (fixed)

#### B1 — Paywall probability invertion missing for DEFENSE
- **Symptom:** Desktop paywall showed Autor's probability to RÉU user without inversion.
- **Location:** `App.tsx` — paywall display block.
- **Root cause:** `displayPct` computed as `finalPct` unconditionally, ignoring `userSide`.
- **Fix:** Added `effectiveSide` computation + conditional inversion:
  ```typescript
  const effectiveSide = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
  const displayPct = (state.selectedMode === 4 && effectiveSide === 'DEFENSE')
    ? 100 - finalPct : finalPct;
  ```

#### B2 — Sidebar strength index showing wrong side
- **Symptom:** Sidebar showed "força do lado dominante", not the user's side.
- **Location:** `App.tsx` — sidebar strength index component.
- **Root cause:** `effectiveSide` not applied before rendering sidebar value.
- **Fix:** Applied `effectiveSide` pattern; added DEFENSE label ("RÉU") to sidebar.
- **Design clarification:** User confirmed: sidebar must show the user's own strength, not the dominant side's.

#### B3 — Mobile locked label hardcoded "Argumento do autor"
- **Symptom:** Mobile "modo bloqueado" label always read "Argumento do autor" regardless of user side.
- **Location:** `App.tsx` — mobile locked mode label.
- **Fix:** Conditional based on `effectiveSide`:
  ```typescript
  effectiveSide === 'DEFENSE' ? 'Argumento do réu' : 'Argumento do autor'
  ```

#### I2 — Round history APROVEITAMENTO wrong side
- **Symptom:** Round history APROVEITAMENTO chip showed Autor's percentage to RÉU user.
- **Location:** `App.tsx` ~L3628 — round history rendering.
- **Fix:** Applied `effectiveSide` + DEFENSE inversion inline (IIFE pattern for scope isolation).

#### I3 — PDF APROVEITAMENTO wrong side
- **Symptom:** Printed PDF showed Autor's percentage next to "Aproveitamento".
- **Location:** `App.tsx` ~L3765 — PDF round block.
- **Fix:** Same IIFE pattern with `effectiveSide` inversion; label updated to "Autor"/"Réu".

#### I4 — Arena probability display wrong side
- **Symptom:** Arena "Prob." label showed Autor's probability to RÉU user.
- **Location:** `App.tsx` ~L3094 — arena round block.
- **Fix:** IIFE with `effectiveSide` inversion; label "Prob. Réu" / "Prob. Autor".

#### I5 — Laudo PDF addressing wrong party
- **Symptom:** RÉU user received laudo written from Autor's perspective ("Reclamante/Autor/Exequente").
- **Location:** Full chain: `App.tsx` → `gemini.ts` → POST body → `server.ts` → `gemini.server.ts`.
- **Root cause:** `generateReportServer` had no `clientSide` parameter. Prompts had no
  perspective prefix. LLM inferred perspective from petition content — often wrong.
- **Fix:** Added `clientSide: 'AUTHOR' | 'DEFENSE'` parameter through entire chain.
  Each of the 3 report prompts in `generateReportServer` receives a `perspective` prefix:
  - DEFENSE: "PERSPECTIVA OBRIGATÓRIA: O CLIENTE QUE LÊ ESTE LAUDO É O RÉU..."
  - AUTHOR: "PERSPECTIVA OBRIGATÓRIA: O CLIENTE QUE LÊ ESTE LAUDO É O AUTOR..."
- **Validation:** produção_7.pdf — laudo correctly reads "PARA: NOSSA CLIENTE (RÉ)".

#### I6 — userSide not persisted in Firestore
- **Symptom:** Saved simulation loaded without `userSide` → defaulted to AUTHOR for RÉU user.
- **Location:** `dbService.ts` `saveSimulation` + `App.tsx` `loadSimulation`.
- **Fix:** Added `selectedMode`, `userSide`, `userPole` to Firestore document and restore path.
- **Policy:** See EDR-001, section "UserSide Persistence".

#### VARIANCE — 75-point judge probability swing (Mode 4, DEFENSE)
- **Symptom:** Same case, same side (RÉU), identical inputs → 5% one run, 95% next.
- **Root cause:** See "Root Cause Analysis" section below.
- **Fix:** Judge frame split by `userSide`. See EDR-003.

#### R1 — Dead import left in gemini.server.ts
- **Symptom:** `import { interpretJudgmentForSide }` remained after function call removed.
- **Fix:** Import line removed.

#### R2 — Missing trim in cleanJudgmentText
- **Symptom:** `parts.join('\n')` in `cleanJudgmentText` didn't trim whitespace.
- **Fix:** Changed to `parts.join('\n').trim()`.

#### R3 — Test covering removed behavior
- **Symptom:** `extractJudgment` test expected `juiText` as last-resort fallback — matched old code.
- **Fix:** Updated test to expect the new safe fallback message.

---

### Category B — False Positives (investigated and discarded)

#### B4 — `finalSuccessProbability: lastProb` in backend (FALSE POSITIVE)
- **Symptom:** Backend stores `lastProb` as `finalSuccessProbability`. Appeared to be a bug.
- **Investigation:** Frontend `App.tsx` ~L862-865 overwrites `finalSuccessProbability` before
  storing to simulation state. Backend value is never used directly by the UI.
- **Decision:** Not a bug. No fix applied.

#### B5 — "Melhore esta petição" on round 1 (DOWNGRADED to minor)
- **Symptom:** Round 1 of Mode 4 asks lawyer to improve the initial petition, but round 1
  has no previous petition to compare to — "improve" has no reference.
- **Investigation:** LLMs handle this gracefully by treating the original text as the baseline.
- **Decision:** Minor UX inconsistency, not a correctness defect. Not fixed in this session.

---

### Category C — Design Decisions (not defects)

#### I1 — Neutral laudo design with objective labels (DESIGN INTENCIONAL)
- **Symptom flagged:** Laudo shows "AUTOR FAVORECIDO" or "RÉU FAVORECIDO" labels objectively.
- **Investigation:** This is the correct behavior. The laudo is a neutral legal analysis tool.
  The perspective fix (I5) addresses the *prose* in the laudo, not the objective labels.
- **Decision:** Labels stay neutral and objective. No change.

#### I7 — authorSummary/defenseSummary absent in Mode 4 rounds (DESIGN INTENCIONAL)
- **Symptom flagged:** Mode 4 round objects do not populate `authorSummary`/`defenseSummary` fields.
- **Investigation:** These fields come from the judge response and are used only in Mode 3.
  Mode 4 uses `judgeJudgment` (the `judgment` field) directly.
- **Decision:** Documented behavior. No change.

#### I8 — userSide validation gap (MINOR — safe fallback exists)
- **Symptom flagged:** If `userSide` is undefined and `userPole` is also undefined, the
  `effectiveSide` defaults to AUTHOR silently.
- **Investigation:** This scenario cannot occur in Mode 4 — the user must click a side button
  before the simulation starts. The fallback is a safe default.
- **Decision:** Acceptable risk. No change.

#### I9 — Empty judgment field (IMPROVÁVEL with fix in place)
- **Symptom flagged:** What if `judgment` is always empty and fallback message always appears?
- **Investigation:** The DEFENSE frame prompt explicitly marks `judgment` as "campo obrigatório,
  nunca vazio". The fallback is a safety net for model edge cases, not a normal path.
- **Decision:** The fallback is correct and safe. No change to fallback.

#### I10 — displayRecoveredResult closure staleness (IMPROVÁVEL)
- **Symptom flagged:** Closure in `displayRecoveredResult` might use stale state.
- **Investigation:** The function runs once per simulation recovery and captures state at
  call time. Stale closure practically impossible in this usage pattern.
- **Decision:** No change.

---

## Root Cause Analysis — 75-Point Variance

### The Asymmetry Problem

Mode 4 creates a quality asymmetry between sides:

```
userSide = 'AUTHOR':  [AI-improved petition]  vs  [static defense by user]
userSide = 'DEFENSE': [static petition by user]  vs  [AI-improved defense]
```

For AUTHOR: the AI-improved petition consistently outperforms the static defense.
The judge sees a clear quality winner → stable result.

For DEFENSE: the judge sees a static petition (emotionally compelling, mirrors real-world
claim language from LLM training data) vs an AI-improved defense (technically superior,
more structured). These are not directly comparable on a single axis. The model must
choose an interpretation frame:

- **Legal accuracy frame**: defense wins → low probability for author
- **Claim sympathy frame**: author's emotional language carries → high probability for author

Without an explicit anchor, the model activates either frame non-deterministically.
Result: 75-point swing between runs.

### The Fix

Change the evaluation task for DEFENSE: instead of "declare the bilateral winner,"
ask the judge to "evaluate how effective the defense is against this claim."

This is exactly the frame used by Mode 2 (Defesa Assistida), which is consistently stable.
The judge still reads both sides in full — only the task framing changes. The judge agent
is not modified; the prompt context is.

---

## Fix Locations (Quick Reference)

| Fix | File | Pattern |
|-----|------|---------|
| effectiveSide computation | `App.tsx` (multiple locations) | `state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR')` |
| displayPct inversion | `App.tsx` (paywall, arena, history, PDF) | `selectedMode === 4 && effectiveSide === 'DEFENSE' ? 100 - pct : pct` |
| Judge frame split | `gemini.server.ts` | `juiPrompt = userSide === 'DEFENSE' ? defenseFrame : authorFrame` |
| Judgment extraction fallback | `gemini.server.ts` | `rawJudgment ?? authorPart + defensePart ?? fallbackMsg` |
| Report perspective prefix | `gemini.server.ts` `generateReportServer` | `perspective` prefix in all 3 systemInstruction strings |
| clientSide propagation | `gemini.ts` + `server.ts` + `App.tsx` | `clientSide` param threaded through entire chain |
| userSide persistence | `dbService.ts` + `App.tsx` | `selectedMode`, `userSide`, `userPole` in Firestore + restore |

---

## Canonical Patterns Established

These patterns were established during this incident and must be used consistently
in any future work touching Mode 4 or any mode with side-aware display.

### effectiveSide
```typescript
const effectiveSide = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
```

### displayPct (any display context in Mode 4)
```typescript
const displayPct = (state.selectedMode === 4 && effectiveSide === 'DEFENSE')
  ? 100 - round.successProbability
  : round.successProbability;
```

### Report generation call (App.tsx)
```typescript
const _clientSide = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
reportData = await generateReport(bestRound.lawyerPetition, bestRound.judgeJudgment, _clientSide);
```

### bestRound selection (Mode 4)
```typescript
// DEFENSE user → lowest author probability = strongest defense round
// AUTHOR user → highest author probability = strongest petition round
const bestRound = userSide === 'DEFENSE'
  ? rounds.reduce((best, r) => r.successProbability < best.successProbability ? r : best)
  : rounds.reduce((best, r) => r.successProbability > best.successProbability ? r : best);
```

---

## Tests Added

File: `lexforum-ai-studio/src/test/mode4Simulation.test.ts`

4 contract tests via `buildJuiPrompt` function:

1. DEFENSE frame contains "solidez técnica dos argumentos da DEFESA/RÉU"
2. DEFENSE frame contains "valor BAIXO indica defesa eficaz"
3. AUTHOR frame contains "magistrado imparcial" and "Analise ambos os lados"
4. Both frames preserve `success_probability` as AUTOR's probability (EDR-001)

135 tests passing, 0 TypeScript errors post-fix.

---

## Future Work (Non-Blocking, Open)

| Item | Owner | Priority |
|------|-------|----------|
| Remove `judgment-interpreter.ts` file (no longer called) | Galera do Código | Low |
| Add React component tests for `effectiveSide` display inversions | SCAFFOLD | Medium |
| Standardize label capitalization: "Réu"/"RÉU"/"REU" across 3 display contexts | POLARBEAR | Low |
| Run same DEFENSE case 3× to confirm variance ≤15 points (PROBE validation mission) | PROBE | Medium |

---

## Lessons Learned

1. **Thread `userSide` through every layer.** Display, simulation, persistence, and report
   generation must all receive `userSide` explicitly. Implicit inference from text content
   (e.g., "the LLM will figure out the party from the petition text") fails in production.

2. **Bilateral evaluation frames are not universally stable.** When asking a judge to
   "declare the winner" between two sides of comparable but qualitatively different strength,
   language models activate different interpretation frames non-deterministically. Anchor the
   task to a single evaluation axis whenever possible.

3. **The `effectiveSide` pattern is the canonical DEFENSE/AUTHOR resolver.** Every component
   that displays a probability or a side-aware label must compute `effectiveSide` before
   rendering. Never use `userPole` directly as a display input.

4. **Investigate before classifying.** Five of the flagged items (B4, B5, I1, I7, I8, I9, I10)
   were not bugs. Premature fixing of false positives wastes effort and risks introducing
   real regressions. Classify first, fix second.

5. **Mode 2 is the reference for DEFENSE stability.** Mode 2 (Defesa Assistida) successfully
   evaluates defense quality in a stable frame. Any Mode 4 DEFENSE issue should be cross-referenced
   against Mode 2's approach first.
