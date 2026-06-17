---
name: _local-edr-policy-008-demand-driven-agent-creation
description: Agents (judges and lawyers) are only ever created in response to real session demand — never pre-stocked. Registry curation is strictly subtractive/relocational and must never trigger or recommend compensatory agent creation. Use when curating registry/index/*.json or proposing fixes to agentResolver.
apply-to: Agent resolution and creation — agent-resolver.ts, agent-creator.ts, registry/index/*.json
valid-from: 2026-06-17
---

# _local-edr-policy-008: Demand-Driven Agent Creation

## Context and Problem Statement

`juiz_everton_v1.0` (100% civil/consumer-law content — TJPR, JEC, CDC, Lei 9.099/1995)
was found miscataloged under `registry/index/trabalhista.json`. `findAgentLocal` had no
validation step, so it would have served this civil-law judge to any labor-area session.

While diagnosing the fix, the initial remediation proposal included removing the
miscataloged entry **and** allowing — even implicitly suggesting — that a replacement
labor judge be created to "fill the gap" left in `trabalhista.json`. This was rejected:
it silently reintroduces pre-stocking, the opposite of how agent creation is supposed
to work in this system.

How must registry curation (fixing miscatalogued or invalid entries) interact with
agent creation (Camada 3 of `resolveAgent`)?

## Decision Outcome

**Agents are created exclusively on demand, at the moment a real session requires
them. Registry curation is strictly subtractive or relocational — it removes or
moves entries to correct their filing, and must never create, or recommend the
creation of, a replacement agent to keep a registry file non-empty.**

### Rules

#### Creation only happens inside `resolveAgent`'s Camada 3

- `createAndSaveAgent` (and the underlying `createAgentFromScratch`) is only ever
  invoked from `resolveAgent` when both the local registry (Camada 1) and the
  Firestore shelf (Camada 2) miss for a real `{area, tipo, comarca?, userSide?}`
  request coming from an actual session.
- No other code path — migration script, curation fix, seed/registry editor — may
  call `createAgentFromScratch` to populate a registry or the Firestore shelf ahead
  of demand.

#### Creation instructions given to Shaw V2

- **Lawyer**: "melhor advogado da área X, referência brasileira" — Shaw identifies
  the best Brazilian reference for that legal area.
- **Judge / desembargadora**: "melhor referência brasileira da área" by default. If
  the request names a specific comarca or judge, Shaw creates that judge's legacy
  specifically, which is then anonymized (per BDR-003 / PROTOCOL_ANON) so the result
  carries no traceability back to the real person.
- These instructions are already correctly implemented in `agent-creator.ts`
  (`createAgentFromScratch`, lines ~139-169) — this policy formalizes the existing
  behavior, it does not change the creation code.

#### Registry curation — what is allowed

| Action | Allowed | Rationale |
|---|---|---|
| Remove an entry filed under the wrong area | Yes | Corrects curation error |
| Relocate an entry to its correct area file | Yes | Corrects curation error |
| Add/fix structural fields (e.g. `area`) for consistency | Yes | Does not change inventory |
| Create a new agent to replace a removed entry | **No** | Reintroduces pre-stocking |
| Leave a registry file with fewer or zero entries after a fix | Yes — expected | Camada 3 covers the gap on next real demand |

#### Why an empty or thinned registry file is correct, not a bug

If curation removes the only entry for a `{tipo, area}` combination, the registry
file may end up with no matching entry. This is the intended state until a real
session needs that combination — `resolveAgent` will fall through to Firestore and
then to on-demand creation, exactly as `_local-edr-policy-006` (Dynamic Legal Areas)
already documents. A thin registry is not evidence of a missing fix.

#### Defense-in-depth validation added alongside this policy

`findAgentLocal` now filters candidates by `tipo` and discards any entry whose
declared `area` field does not match the requested area, logging a warning. This
closes the gap that allowed `juiz_everton_v1.0` to be served to `trabalhista`
sessions, without requiring or triggering any creation.

## Relationship to other policies

- **`_local-edr-policy-006` (Dynamic Legal Areas)**: defines the 3-tier resolution
  cascade this policy assumes. This policy adds the constraint that curation work on
  Camada 1 must never reach into Camada 3.
- **`_local-edr-policy-007` (Judge Impartiality in Creation)** and **BDR-003
  (judge-location-anonymization)**: govern *how* an agent is created when Camada 3
  is legitimately triggered by demand. This policy governs *when* Camada 3 may be
  triggered at all.
