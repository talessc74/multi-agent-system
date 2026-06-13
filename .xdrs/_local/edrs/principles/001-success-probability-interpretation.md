---
name: _local-edr-policy-001-success-probability-interpretation
description: Defines the semantic contract for the success_probability field returned by the judge in all simulation modes. Use whenever reading, displaying, or prompting for this value.
apply-to: All simulation modes — gemini.server.ts, App.tsx, judgment-interpreter.ts
valid-from: 2026-06-13
---

# _local-edr-policy-001: success_probability Interpretation

## Context and Problem Statement

The judge agent returns a `success_probability` field (0-100) in all simulation modes.
Inconsistency in how this value is defined in judge prompts caused the Gemini model to
interpret it differently on each call — sometimes as the author's probability, sometimes
as the defense's probability — producing wildly inconsistent results (5%, 50%, 85%)
for the same case and same side.

What does `success_probability` always mean?

## Decision Outcome

**`success_probability` always represents the author's probability of winning (0-100)**

Every judge prompt in every mode must explicitly define this semantic. The display layer
converts to the user's chosen side perspective.

### Details

#### Contract

- `success_probability: 100` means the author wins with certainty.
- `success_probability: 0` means the author has no chance of winning.
- This is the canonical meaning regardless of which mode is running.

#### Judge Prompts

Every mode's judge prompt MUST include the explicit phrase:
> `success_probability` é a probabilidade de êxito do AUTOR, de 0 a 100

- Mode 1 (Mono): already compliant
- Mode 2 (Defesa): already compliant (returns defense's probability explicitly renamed)
- Mode 3 (Bilateral): already compliant
- Mode 4 (Mesa Dupla): **pending fix** — currently ambiguous

#### Display Layer (App.tsx)

For Mode 4, the display must convert the author-centric value to the user's side:

```typescript
const effectiveSide = state.userSide ?? (state.userPole === 'REU' ? 'DEFENSE' : 'AUTHOR');
const displayPct = (state.selectedMode === 4 && effectiveSide === 'DEFENSE')
  ? 100 - finalPct
  : finalPct;
```

#### Reviewer (judgment-interpreter.ts)

The `interpretJudgmentForSide` function reads the full judgment text and extracts the
correct probability from the user's chosen side perspective. It is the safety net for
cases where the judge prompt ambiguity has not yet been corrected in production.
