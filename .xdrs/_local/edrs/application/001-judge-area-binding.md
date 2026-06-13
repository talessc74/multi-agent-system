---
name: _local-edr-policy-005-judge-area-binding
description: Defines how the judge (and lawyer) are bound to the correct legal area of the session via a mandatory instruction prefix. Use when implementing or reviewing agent call construction.
apply-to: Agent call construction — gemini.server.ts simulateForumServer
valid-from: 2026-06-13
---

# _local-edr-policy-005: Judge Area Binding

## Context and Problem Statement

Agent instructions are generated once and cached (local registry or Firestore). A cached
agent's instructions may not match the legal area of the current session — for example,
a civil judge agent being used for a labor case because no labor judge was found on the
shelf. When this mismatch happens, the agent refuses to judge the case or gives an
incorrect opinion.

How must the legal area of the session always be enforced on agent calls?

## Decision Outcome

**Mandatory prefix (INSTRUCAO VINCULANTE) injected before every agent call**

Before any Gemini call to a judge or lawyer, a binding instruction prefix is prepended
to the agent's instruction, forcing it to act within the correct legal area of the session.

### Details

#### Prefix Format

```
INSTRUCAO VINCULANTE DE SESSAO: Voce atua como [role] de Direito [area] nesta simulacao.
[role-specific instruction]. Voce DEVE [role-specific obligation],
independentemente de qualquer especializacao anterior.
```

Where `[area]` is the human-readable area label for the session:

| Area code | Label used in prefix |
|-----------|---------------------|
| LABOR | Trabalhista |
| CONSUMER | do Consumidor |
| CIVIL | Civel |
| FAMILY | de Familia |
| SOCIAL_SECURITY | Previdenciario |
| (any other) | Especializado |

#### Rules

- The prefix MUST be prepended before every judge and lawyer call in every simulation mode.
- The prefix MUST be applied even when the agent was retrieved from the local registry or
  Firestore shelf (it may have been created for a different area).
- The prefix is a defense-in-depth mechanism. It mitigates mismatches at runtime but does
  NOT guarantee override when the base agent carries a strong conflicting identity (e.g., a
  civil court judge explicitly instructed to refuse labor cases). The primary fix for agent
  identity correctness is at creation time — see EDR-007 (judge-impartiality-in-creation).
- The prefix is session-scoped: it is never stored back to Firestore or the local registry.
- The agent's original instruction is preserved after the prefix — the prefix does not replace it.

#### Implementation Location

`gemini.server.ts` — `simulateForumServer` function, applied immediately after agent
resolution and before entering the simulation loop.
