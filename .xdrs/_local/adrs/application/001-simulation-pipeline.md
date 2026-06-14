---
name: _local-adr-policy-001-simulation-pipeline
description: Defines the five simulation modes and the agent resolution pipeline (agentResolver + agentCreator). Use when implementing, extending, or debugging simulation logic or agent creation.
apply-to: Simulation engine — server.ts, gemini.server.ts, agent-resolver.ts, agent-creator.ts
valid-from: 2026-06-13
---

# _local-adr-policy-001: Simulation Pipeline

## Context and Problem Statement

EAI? offers a legal simulation experience across five distinct modes. Each mode uses AI agents
(lawyer, judge, strategist) that must be specialized by legal area and, in some modes, by
litigation side. The system must resolve which agent to use and create new ones on demand when
none exists for a given area.

How should the simulation modes and the agent lifecycle be structured?

## Decision Outcome

**Five isolated modes with a shared agent resolution pipeline**

Each simulation mode is self-contained. Agents are resolved through a three-tier pipeline:
local registry -> Firestore shelf -> on-demand creation via Shaw+Especialista.

### Details

#### Five Simulation Modes

| Mode | Name | Description |
|------|------|-------------|
| 1 | Mono Assistida | Lawyer improves author petition across 3 rounds; judge evaluates only the author side |
| 2 | Defesa Assistida | Lawyer builds defense across 3 rounds against the author's claim |
| 3 | Bilateral Direta | User provides both sides; judge evaluates both in a single round |
| 4 | Mesa Dupla Assistida | User provides both sides, chooses one; lawyer improves chosen side across up to 3 rounds; judge evaluates both |
| 5 | Estrategista | Evaluates whether to appeal a ruling or accept a settlement |

#### Agent Types

- **Lawyer (advogado)**: Has a litigation side (`lado`: `acusacao` or `defesa`). Resolved with `userSide` parameter.
- **Judge (juiz)**: Always stateless and impartial. Never has a `lado` field. Never carries memory between rounds. Receives both sides on every call.
- **Strategist (desembargadora)**: Used in Mode 5 only. Evaluates appeals and settlements.

#### Agent Resolution Pipeline (agentResolver)

Resolution order (first match wins):

1. **Local registry** — `registry/index/[area].json` — static, version-controlled agents
2. **Firestore shelf** — cached agents previously created and stored under `agents/` collection
3. **On-demand creation** — Shaw V2 + Especialista V2 pipeline generates a new agent, saves to Firestore

For Firestore lookup:
- Judge: query by `area` + `tipo` only — no `lado` filter
- Lawyer: query by `area` + `tipo` + `lado`

For Firestore storage:
- Judge: stored without `lado` field
- Lawyer: stored with `lado` field

#### Mode 4 Side Assignment

```
userPetition = userSide === 'DEFENSE' ? defenseDescription : caseDescription
staticSide   = userSide === 'DEFENSE' ? caseDescription   : defenseDescription
```

- The user's chosen side is the only side improved by the lawyer
- The opposing side never changes across rounds (always the original user text)
- The judge receives both sides on every round call without memory of previous rounds

#### Early Exit

Modes 1, 2, and 4 exit before round 3 if `success_probability >= 95`.

#### Per-Round Isolation (Mode 4)

Each round in Mode 4 runs inside its own try-catch. A failure in round 2 or 3 delivers
the best result available from previous rounds rather than crashing the simulation.
Round 1 failure propagates normally.
