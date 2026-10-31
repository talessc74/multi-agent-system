---
name: _local-bdr-policy-005-agent-naming-no-personification
description: AI-simulated legal agents (judges, lawyers) must never be displayed, stored, or exported under a personified human name — fictional or resembling a real person. Every surface must use a generic professional role plus legal area ("Magistrado Trabalhista", "Advogado Cível"), never "Dr./Dra. [Nome]". Use when building or reviewing any UI, export, API response, or client (including non-repository clients such as the SwiftUI app) that displays agent identity.
apply-to: Every surface of the EAI? product that displays, stores, or exports agent identity — this repository (lexforum-ai-studio) and any other client built on the EAI? product, present or future, including the SwiftUI app.
valid-from: 2026-10-31
---

# _local-bdr-policy-005: Agent Naming — No Personification

## Context and Problem Statement

A separate client of the EAI? product, built in SwiftUI, was found displaying
generated judge and lawyer agents under fully personified names — "Dr. Marcelo
Arantes" (juiz), "Dra. Sofia Mendes" (advogada do autor), "Dr. Renato Silveira"
(defensor técnico). When asked to check this repository's XDRS for a rule
against it, the answer was that no such policy existed — which was correct:
a search of every `.xdrs/_local` document for anonymization, personification,
or agent-naming language returned nothing that states this directly.

The intention was never absent, only unwritten. Every agent-display call site
in this repository (`lexforum-ai-studio`) already follows a 100%-consistent
pattern of generic role + area naming, confirmed by direct inspection:

- `server.ts:118` — `` `Magistrado ${area}` ``
- `server.ts:140` — `` `Advogado ${area}` ``
- `src/lib/gemini.server.ts:144-145,171` — same pattern
- `agent-creator.ts:29` — even the system's own internal meta-agent is named
  by function, `"Arquiteto Especialista"`, never a human name

No generated agent's display name has ever been taken from whatever a Gemini
call might produce; it is always computed from role + area. This was
architecture by consistent practice, never codified as a decision — so a new
client with no access to this repository's code had no way to discover it.

Question: under what identity may an AI-simulated judge or lawyer ever be
displayed, stored, or exported, and does that rule bind clients outside this
repository?

## Decision Outcome

**Agent identity is always generic — professional role plus legal area.
Never a personified human name, fictional or resembling a real person, on
any surface of the EAI? product.**

### Details

#### What is permitted

- Role + legal area as the only display identity: "Magistrado Trabalhista",
  "Advogada Cível", "Advogado Consumerista", "Arquiteto Especialista",
  "Juiz Imparcial", or equivalent constructions in whatever language/locale
  the client uses.
- A real legal reference's name MAY be used transiently, internally, to
  derive an intellectual profile for seed generation (already governed by
  `_local-bdr-policy-004`, `judge-location-anonymization`) — but it must
  never reach a persisted artifact, an API response, or any UI, in this
  repository or any other client.

#### What is prohibited

- Any personified name pattern for a generated agent — "Dr./Dra.
  [Primeiro] [Sobrenome]", or any invented full name — in any UI screen,
  export (PDF, share card), API response field, push notification, log
  visible to a non-admin, or onboarding/marketing material.
- This prohibition applies identically whether the name is purely
  fictional or could plausibly be read as a real professional. Both carry
  the same risk: a fictional name fabricates authority and credentials
  that do not exist; a name resembling a real professional falsely
  attributes a legal position to someone who never took it. Neither is a
  lesser violation.
- Generating or accepting a name field from a model's output (Gemini or
  any other) as the agent's display identity, instead of computing it from
  role + area, as happened in the SwiftUI client.

#### Scope — binding beyond this repository

- This is a product-level decision, not an implementation detail of
  `lexforum-ai-studio`. It binds every client built under the EAI?
  product — this repo's web app and any other surface, including the
  SwiftUI app currently in development, whether or not that client's
  codebase can read `.xdrs/` directly.
- A new client must not be expected to re-derive this convention by
  reading or observing another client's code. Any AI agent or engineer
  building a new EAI? surface must consult this policy directly before
  naming agents, not infer it from precedent.
- If a non-repository client's own tooling cannot reference this file
  path, the obligation is still binding — restate it in that client's own
  local instructions/governance file, citing this policy by name
  (`_local-bdr-policy-005-agent-naming-no-personification`), rather than
  leaving it undocumented there.

## Relationship to other policies

- Extends `_local-bdr-policy-004` (judge-location-anonymization): that
  policy governs what may ever be *stored* about a judge (never comarca);
  this policy governs what identity may ever be *displayed*, and
  generalizes from judges-only to every generated agent, lawyers included.
- Complements `_local-edr-policy-004` (LGPD anonymization): that policy
  protects the *user's* submitted case data; this policy protects against
  the system fabricating or misattributing a *professional's* identity —
  a different direction of the same anonymization intent.
- Complements `_local-edr-policy-017`/`018` (agent-creator sanitizer):
  those strip the *system's own internal creator identity* ("Auditor Kern
  0xF1") from generated output. This policy governs the externally-facing
  display-name layer — a separate concern, already enforced by
  construction in this repo (see precedent in Context above) but never
  stated as a rule until now.

## References

- Incident: SwiftUI client of the EAI? product displayed personified agent
  names ("Dr. Marcelo Arantes", "Dra. Sofia Mendes", "Dr. Renato
  Silveira") — reported 2026-10-31, triggering this policy.
- `lexforum-ai-studio/server.ts:118,140`
- `lexforum-ai-studio/src/lib/gemini.server.ts:144-145,171`
- `lexforum-ai-studio/agent-creator.ts:29`
- [_local-bdr-policy-004 - judge location anonymization](003-judge-location-anonymization.md)
- [_local-edr-policy-004 - LGPD anonymization](../../edrs/governance/001-lgpd-anonymization.md)
- [_local-edr-policy-017 - agent-creator internal identifier sanitization](../../edrs/application/011-agent-creator-internal-identifier-sanitization.md)
