---
name: _local-edr-policy-010-specificjudge-null-sentinel-filtering
description: Requires optional string fields extracted from Gemini's schema-constrained JSON output (e.g. specificJudge) to be normalized against literal sentinel values like the string "null" at the point of extraction, not re-guarded ad hoc at each call site. Use when adding or reviewing any Gemini structured-output field typed as a non-nullable STRING that can legitimately be absent.
apply-to: lexforum-ai-studio/src/lib/gemini.server.ts — validateCausaServer and its downstream consumers (server.ts, getOrGenerateAgent)
valid-from: 2026-07-01
---

# _local-edr-policy-010: specificJudge null-sentinel filtering

## Context and Problem Statement

Gemini's `responseSchema` types `specificJudge` as `Type.STRING` (non-nullable),
while the prompt instructs "verifique... se sim, extraia, senão null"
(`gemini.server.ts:48,68`). Because the schema forbids emitting an actual JSON
`null` in a non-nullable string field, the model can legitimately write the
literal string `"null"` instead of omitting the field. `validateCausaServer`
(`gemini.server.ts:89`) does `parsed.specificJudge || null`, which only
catches falsy values (`undefined`, `''`) — a non-empty string `"null"` passes
through unfiltered.

The fix in commit `3f71a07` (see `versions/CHANGELOG.md`, Bug 4) added a
`specificJudge && specificJudge !== 'null'` guard, but only at the 3 call
sites in `server.ts` where `comarca` is computed for `resolveAgent`. The same
raw `specificJudge` value is still passed unguarded into `simulateForumServer`,
and `gemini.server.ts`'s own fallback path (`getOrGenerateAgent`, used when
`resolveAgent` fails to find or create a registry/Firestore agent) interpolates
it directly into the judge-creation prompt (`"perfil/comarca de \"${specificName}\""`,
`gemini.server.ts:107-108`) — reproducing the leak in that specific fallback
branch. Confirmed against the real, unmodified code by an automated test
(`lexforum-ai-studio/src/test/specificJudgeNullLeak.test.ts`, 2026-07-01).

Question: Where should the "null" sentinel from Gemini's structured output be filtered?

## Decision Outcome

**Filter at the extraction boundary (`validateCausaServer`), not at each call site.**

`validateCausaServer` must normalize `parsed.specificJudge` to a real `null`
whenever it is empty OR the literal string `"null"`, before returning it.
Every downstream consumer then receives either a genuine judge/comarca string
or JS `null` — no consumer needs its own sentinel guard.

### Details

- Change `specificJudge: parsed.specificJudge || null,` in `validateCausaServer`
  (`gemini.server.ts:89`) to normalize the sentinel, e.g.:
  `specificJudge: (parsed.specificJudge && parsed.specificJudge.trim().toLowerCase() !== 'null') ? parsed.specificJudge : null,`
- Once fixed at the boundary, the 3 existing `specificJudge !== 'null'` guards
  in `server.ts` (lines 86, 102, 222) become redundant defense-in-depth. They
  MAY stay, but must not be treated as the primary or only defense — new
  consumers of `specificJudge` must not need to reimplement the guard.
- Any future optional field pulled from a non-nullable Gemini STRING schema
  type (this codebase's `responseSchema` pattern) MUST follow the same rule:
  normalize sentinel values at the point of extraction, not at each usage site.
- Out of scope: this policy does not cover the "Auditor Kern 0xF1" class of
  leak (internal identifiers appearing in generated agent JSON). That is a
  different mechanism — prompt-instructed field omission, not a type-system
  sentinel — and needs its own review.

## References

- `lexforum-ai-studio/src/lib/gemini.server.ts:48,68,89` (`validateCausaServer`)
- `lexforum-ai-studio/src/lib/gemini.server.ts:97-109` (`getOrGenerateAgent`, unguarded `specificName`)
- `lexforum-ai-studio/server.ts:86,102,222` (existing but incomplete guard)
- `versions/CHANGELOG.md` — Bug 4, commit `3f71a07`
- `lexforum-ai-studio/src/test/specificJudgeNullLeak.test.ts` — regression test proving the gap
