---
name: _local-edr-policy-019-gemini-model-name-configurable
description: The Gemini model id must be read from the GEMINI_MODEL env var (defaulting to the current "gemini-2.5-flash") instead of being hardcoded per call site. Use when adding a new Gemini call, or when planning a model migration for lexforum-ai-studio.
apply-to: lexforum-ai-studio/src/lib/gemini.server.ts, lexforum-ai-studio/src/lib/judgment-interpreter.ts, lexforum-ai-studio/agent-creator.ts
valid-from: 2026-10-11
---

# _local-edr-policy-019: Gemini model name configurable via env

## Context and Problem Statement

`"gemini-2.5-flash"` was hardcoded as a string literal in 5 separate call
sites across 3 files (`gemini.server.ts`, `judgment-interpreter.ts`,
`agent-creator.ts`), with no single point of configuration.

This surfaced as a real risk on 2026-10-11: a user-reported news item about
Gemini model retirements prompted a check (via a separate Cowork session
using Claude in Chrome against the official Google docs) of whether this
affects the EAI? production system. Finding, confirmed against
`ai.google.dev/gemini-api/docs/deprecations` and the changelog (dated
2026-09-18): the October 2026 shutdown dates circulating in the press are
for `gemini-2.5-flash` on Vertex AI / Gemini Enterprise Agent Platform — a
different product from what this codebase calls. This app uses the Gemini
**Developer API** (`@google/genai`, authenticated by `apiKey`, not a
project/location Vertex client), where `gemini-2.5-flash` has no
deprecation or shutdown date announced; access is now restricted to
projects that already used the model (this one qualifies, in continuous
production use since mid-2026), served "until further notice."

No immediate deadline exists, but "until further notice" is not a
permanent guarantee, and Google's own direction (new-project access
restricted in favor of newer models) signals `gemini-3.8-flash` as the
eventual target. Question: how should the codebase be structured so that a
future migration, whenever it becomes necessary, is a config change instead
of an emergency multi-file PR?

## Decision Outcome

**Read the model id from `process.env.GEMINI_MODEL`, defaulting to the
current `"gemini-2.5-flash"` when unset.**

### Details

- All 3 files now declare `const MODEL_NAME = process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";` and reference `MODEL_NAME` instead of a literal at
  every `generateContent` call site.
- `.env.example` documents `GEMINI_MODEL` as optional, with the current
  default spelled out.
- No behavior change today: with the env var unset (the current state of
  the `eai-producao` Cloud Run service — confirmed `deploy-producao.yml`
  does not pass `--set-env-vars` for any Gemini config, so this is additive
  and safe to deploy as-is), every call site resolves to the same
  `"gemini-2.5-flash"` it used before.
- To migrate models in the future: set `GEMINI_MODEL` directly on the
  `eai-producao` Cloud Run service (console or `gcloud run services update
  --set-env-vars`), not through this GitHub Actions workflow — no code
  change or redeploy of this app is required for that step alone.
- Out of scope for this policy: actually migrating to `gemini-3.8-flash`.
  That requires its own evaluation (output quality/consistency for legal
  reasoning, cost, latency, the `responseMimeType`/`responseSchema`
  contracts in `agent-creator.ts` and `gemini.server.ts`) before being
  adopted as the new default literal — not a configuration change, a
  product decision. No target date is set; revisit if Google narrows the
  Developer API "until further notice" window for `gemini-2.5-flash`.

## References

- `ai.google.dev/gemini-api/docs/deprecations` — confirmed no shutdown date for `gemini-2.5-flash` on the Developer API, as of 2026-10-11
- `ai.google.dev/gemini-api/docs/changelog` — dated 2026-09-18, access restricted to previously-active projects, served "until further notice"
- `docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions` — the Vertex AI / Gemini Enterprise Agent Platform shutdown (2026-10-20), confirmed as the *different* product the circulating news was about
