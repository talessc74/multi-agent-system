---
name: _local-bdr-policy-001-agent-temperature-policy
description: Establishes that agent temperature must never be altered after creation. Use whenever evaluating a change to simulation quality, consistency, or AI model configuration.
apply-to: All AI agent calls — gemini.server.ts, agent-creator.ts, agent-resolver.ts
valid-from: 2026-06-13
---

# _local-bdr-policy-001: Agent Temperature Policy

## Context and Problem Statement

EAI? uses Gemini 2.5 Flash to power legal simulation agents (lawyer, judge, strategist).
Temperature controls output variability. Users have observed varying percentages (e.g. 5%,
50%, 85%) across runs of the same case. The question arose whether temperature should be
adjusted to reduce this variance.

Should agent temperature be standardized or modified to improve consistency?

## Decision Outcome

**Never alter the temperature of any created agent**

Temperature is intentionally left at Gemini's default for all simulation agents. Variability
in output is a product feature, not a defect. Legal analysis is inherently non-deterministic.

### Details

- Temperature MUST NOT be set or changed on any call to lawyer, judge, or strategist agents
  in simulation modes (Modes 1-5).
- This decision is irrevocable without a new BDR deliberation approved by the project owner.
- Observed percentage variance across simulation runs is expected and acceptable.
- If output quality needs to improve, the solution is to improve prompts, agent instructions,
  or the reviewer pipeline — never to adjust temperature.

**Allowed:**
- Setting temperature on infrastructure calls that are not part of the simulation itself
  (e.g. `validateCausaServer` uses temperature 0.2 for structured classification)
- Setting temperature on agent generation calls (Shaw V2 + Especialista V2 creation pipeline)

**Not allowed:**
- Adding a `temperature` parameter to any lawyer, judge, or strategist call in Mode 1-5
- Changing an existing temperature setting on simulation agents
- Using temperature as a lever to fix inconsistent percentage output
