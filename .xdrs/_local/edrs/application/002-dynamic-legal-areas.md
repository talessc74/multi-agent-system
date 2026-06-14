---
name: _local-edr-policy-006-dynamic-legal-areas
description: Defines how EAI? handles legal areas beyond the five predefined ones. Use when onboarding a new legal area or debugging agent resolution for uncommon areas.
apply-to: Agent resolution — agent-resolver.ts, agent-creator.ts
valid-from: 2026-06-13
---

# _local-edr-policy-006: Dynamic Legal Areas

## Context and Problem Statement

Brazilian law covers dozens of specialized areas (maritime, criminal, tax, environmental,
administrative, corporate, etc.) beyond the five initially mapped. EAI? must handle any
legal area the validation step identifies, not only the predefined ones.

How must the system handle legal areas not previously seen?

## Decision Outcome

**All legal areas are supported via dynamic agent creation and Firestore caching**

The system creates a specialized agent for any area on first use and stores it on the
Firestore shelf for all future sessions in that area.

### Details

#### Resolution Order (agentResolver)

1. **Local registry** — `registry/index/[area].json` — version-controlled, predefined agents only
2. **Firestore shelf** — `agents/` collection — previously created agents for any area
3. **On-demand creation** — Shaw V2 + Especialista V2 pipeline generates a new agent
   for the requested `area` + `tipo` + `lado` combination, then saves it to Firestore

#### Area Identification

- The `validateCausaServer` call identifies the legal area from the user's case text.
- The returned area code is an uppercase English string (e.g. `LABOR`, `MARITIME`, `CRIMINAL`).
- Any string is valid — there is no allowlist of area codes.

#### On-Demand Creation

When no agent is found in the local registry or Firestore:
- `createAgentFromScratch` is called with the `area`, `tipo`, and optional `comarca`
- Shaw V2 identifies the best reference profile for that area
- Especialista V2 generates the agent from the seed
- The result is saved to Firestore under `agents/[agent_id]`

#### Area Label for Display

Five areas have predefined display labels. All other areas fall back to "Especializado":

```typescript
const areaDisplayName: Record<string, string> = {
  LABOR: 'Trabalhista',
  CONSUMER: 'do Consumidor',
  CIVIL: 'Civel',
  FAMILY: 'de Familia',
  SOCIAL_SECURITY: 'Previdenciario',
};
const areaLabel = areaDisplayName[area] ?? 'Especializado';
```

This fallback is acceptable for display and for the INSTRUCAO VINCULANTE prefix.
The agent's expertise is defined by its generated instructions, not by the label.
