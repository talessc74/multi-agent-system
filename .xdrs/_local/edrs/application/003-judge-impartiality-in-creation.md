---
name: _local-edr-policy-007-judge-impartiality-in-creation
description: Rules for constructing the description passed to Shaw V2 + Especialista V2 when creating a judge agent. Judges must always be described as impartial — never biased toward any side. Use when modifying agent-creator.ts or reviewing the createAgentFromScratch pipeline.
apply-to: Agent creation pipeline — agent-creator.ts, createAgentFromScratch
valid-from: 2026-06-13
---

# _local-edr-policy-007: Judge Impartiality in Creation

## Context and Problem Statement

The `createAgentFromScratch` function builds a `description` string that is passed to
Shaw V2 for reference identification. This description determines the intellectual
profile that Shaw selects as the seed for the new agent.

The description construction includes a `userSide` clause:

```typescript
${params.userSide === 'DEFENSE' ? ', atuando pela defesa do réu' : ', atuando pelo autor'}
```

When `tipo === 'juiz'`, `userSide` is undefined, so the clause always evaluates to
`', atuando pelo autor'`. This introduces an author bias in the judge's creation
description, causing Shaw V2 to potentially identify a reference that is not an
impartial magistrate.

This was the root cause of a staging incident where a LABOR judge was created with
civil/JEC consumer court instructions: the biased description caused Shaw to select
an inappropriate reference profile.

## Decision Outcome

**Judge descriptions must always express impartiality — `userSide` must never influence judge or desembargadora creation descriptions.**

### Rules

#### Description construction by `tipo`

| tipo | userSide clause | Rationale |
|------|----------------|-----------|
| `juiz` | `', imparcial, avaliando ambos os lados com equidade'` | Judge has no side |
| `desembargadora` | `', imparcial, avaliando ambos os lados com equidade'` | Appellate judge has no side |
| `advogado` | `userSide === 'DEFENSE' ? ', atuando pela defesa do réu' : ', atuando pelo autor'` | Lawyer represents a specific side |

#### Correct implementation (agent-creator.ts)

```typescript
const sidePart = params.tipo === 'juiz' || params.tipo === 'desembargadora'
  ? ', imparcial, avaliando ambos os lados com equidade'
  : params.userSide === 'DEFENSE'
    ? ', atuando pela defesa do réu'
    : ', atuando pelo autor';

const description = `${params.tipo} especializado em direito ${params.area}${
  params.comarca ? ` da comarca de ${params.comarca}` : ' — genérico'
}${sidePart}`;
```

#### Enforcement

- Any code path that constructs the Shaw description for `tipo='juiz'` or
  `tipo='desembargadora'` MUST NOT reference `userSide`.
- This rule applies to the current `createAgentFromScratch` and any future
  agent creation pipeline that uses Shaw V2 or a successor.
- Code review must flag any `userSide` conditional in judge description construction
  as a blocking issue.

#### Relationship to EDR-005 (INSTRUCAO VINCULANTE)

The INSTRUCAO VINCULANTE (EDR-005) is a defense-in-depth mechanism applied at
runtime. This policy (EDR-007) is the primary mechanism: it ensures the agent is
created correctly from the start, so runtime overrides are not needed as a crutch.

Both policies must coexist. EDR-005 handles cases where a cached agent from a
previous era (before this policy was applied) is retrieved from the Firestore shelf.
EDR-007 ensures all newly created agents are correct by construction.
