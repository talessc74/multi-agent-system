---
name: _local-edr-policy-018-dual-agent-generator-sanitizer-boundary
description: Documents that agent-sanitizer.ts only covers the primary Shaw V2/Especialista V2 generator (agent-creator.ts). The fallback generator in gemini.server.ts (getOrGenerateAgent) is a structurally separate, simpler generator that never receives Shaw/Especialista's internal branding, so it is not exposed to the identifier-leak class EDR-017 fixed — but that is an implicit invariant, not an enforced one. Use when modifying, replacing, or unifying the two agent-generation code paths.
apply-to: lexforum-ai-studio/src/lib/gemini.server.ts (getOrGenerateAgent), lexforum-ai-studio/agent-creator.ts, lexforum-ai-studio/agent-sanitizer.ts
valid-from: 2026-09-14
---

# _local-edr-policy-018: dual agent-generator sanitizer boundary

## Context and Problem Statement

Post-merge review of `_local-edr-policy-017` (agent-creator internal identifier
sanitization) by Código+QA found that the codebase has two independent,
Gemini-backed legal-agent generators, not one:

1. **Primary path** — `agent-resolver.ts` → `agent-creator.ts`. Runs the full
   Shaw V2 / Especialista V2 pipeline (`identifyReference` → `generateSeed` →
   `generateAgent`) and is now protected by `agent-sanitizer.ts`
   (`_local-edr-policy-017`).
2. **Fallback path** — `gemini.server.ts`'s `getOrGenerateAgent`. A simpler,
   independent generator, invoked only when `resolveAgent()` throws inside
   `server.ts` (Firestore unavailable, registry file missing, malformed JSON,
   network error — confirmed by reading `server.ts:108-133`).

`getOrGenerateAgent`'s prompt (`gemini.server.ts:109-116`) was read in full
and does not reference `ESPECIALISTA_V2`/`SHAW_V2` or their internal identity
("Auditor Kern 0xF1", the `kernel` field) at all — it asks Gemini directly for
a generic `name`/`instruction` pair. Running `sanitizeGeneratedAgent()` on its
output today would be a no-op.

Question: should the fallback generator get the sanitizer too, and if not, how
should that exemption be recorded so it is not mistaken for an oversight?

## Decision Outcome

**Leave the fallback generator unsanitized. The exemption holds only as long
as it never receives Shaw/Especialista's internal branding — record that
condition explicitly so a future change that violates it is caught.**

### Details

- Allowed: `getOrGenerateAgent` may stay without `sanitizeGeneratedAgent()`
  as long as its prompt does not reuse or reference `ESPECIALISTA_V2` /
  `SHAW_V2` or any future prompt carrying internal creator-system branding.
- Disallowed: changing `getOrGenerateAgent`'s prompt to reuse
  `ESPECIALISTA_V2`/`SHAW_V2` content, or unifying the two generators into
  one implementation, without also routing that implementation's output
  through `sanitizeGeneratedAgent()` first. The two generators exist for the
  same responsibility (produce a legal agent instruction) and unifying them
  is a plausible future refactor — this is the scenario this policy exists
  to catch.
- This policy governs the identifier-leak risk only. It does not cover the
  separate, unaddressed gap that the fallback path also skips Especialista
  V2's ethical/governance pillars (Privacidade, Transparência, Supervisão,
  Segurança), since it never receives that instruction either — that is a
  quality/rigor difference between the two paths, not a leak risk, and is
  out of scope here.
- Verification performed for this decision: full read of both prompts
  (`agent-creator.ts` `ESPECIALISTA_V2`/`generateAgent`, `gemini.server.ts`
  `getOrGenerateAgent`), `tsc --noEmit` (clean), and the full test suite
  (191 passed, 6 skipped — all 6 gated on absent `GEMINI_API_KEY`, unrelated).

## Relationship to other policies

- Extends `_local-edr-policy-017` (agent-creator-internal-identifier-sanitization):
  defines the boundary of where that sanitizer's guarantee does and does not
  apply.
- Does not change `_local-edr-policy-010` (specificjudge-null-sentinel-filtering),
  which already governs a different leak class inside the same
  `getOrGenerateAgent`/`simulateForumServer` fallback machinery.

## References

- `lexforum-ai-studio/src/lib/gemini.server.ts` — `getOrGenerateAgent` (the unsanitized fallback)
- `lexforum-ai-studio/agent-creator.ts` — `generateAgent` (the sanitized primary path)
- `lexforum-ai-studio/agent-sanitizer.ts` — `sanitizeGeneratedAgent`
- `lexforum-ai-studio/server.ts:108-133` — where the fallback is triggered on `resolveAgent()` failure
- [_local-edr-policy-017 - agent-creator internal identifier sanitization](011-agent-creator-internal-identifier-sanitization.md)
- [_local-edr-policy-010 - specificJudge null-sentinel filtering](006-specificjudge-null-sentinel-filtering.md)
