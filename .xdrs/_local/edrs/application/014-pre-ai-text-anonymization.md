---
name: _local-edr-policy-020-pre-ai-text-anonymization
description: Raw user-submitted text (caseDescription, defenseDescription, mode5Input, chat message) must be anonymized via anonymizer.ts before reaching any Gemini call, not only before Firestore persistence. Use when adding or reviewing any new entry point that sends user-typed text to Gemini.
apply-to: lexforum-ai-studio/server.ts (/api/gemini/validate, /api/gemini/simulate, /api/gemini/mode5), lexforum-ai-studio/chat-handler.ts
valid-from: 2026-10-31
---

# _local-edr-policy-020: pre-AI text anonymization

## Context and Problem Statement

`_local-edr-policy-004` (LGPD anonymization) required `anonymizer.ts` to run
before any Firestore persistence, and explicitly scoped Gemini calls as
out of reach: "Gemini calls during simulation use the original
(non-anonymized) text — these calls are transient and not persisted."

This was found to directly contradict the product's own user-facing
claims. A separate client of the EAI? product (the SwiftUI app) was
flagged for promising "anonimização local imediata... antes de qualquer
envio" and "Sigilo e Anonimização Ponta a Ponta." Verifying that claim
against this repository's actual implementation (the reference backend)
confirmed the promise was false everywhere it was checked: `server.ts`
and `src/lib/gemini.server.ts` had zero `anonymizeText` calls; raw
`caseDescription`, `defenseDescription`, `mode5Input`, and chat `message`
all reached Gemini unfiltered. Anonymization only ever ran client-side,
in `dbService.ts`, right before the Firestore write — after the AI had
already seen the raw text. This repository's own Terms of Use
(`TermosPage.tsx`) separately claimed "não compartilhamos sua causa com
terceiros" while also disclosing reliance on third-party AI
infrastructure twenty lines later — an internal contradiction.

Question: should anonymization run before the Gemini call, and if so,
does it degrade the AI's ability to classify and reason about the case?

## Decision Outcome

**Anonymize raw user-submitted text with the existing `anonymizer.ts`
patterns immediately at the point it enters the server, before any
Gemini call — not only before Firestore persistence.** This supersedes
the "Gemini calls use original text" clause in `_local-edr-policy-004`.

### Details

- `server.ts`: `caseDescription` and `defenseDescription` are anonymized
  immediately after being read from `req.body`, in both
  `/api/gemini/validate` and `/api/gemini/simulate`, before
  `validateCausaServer`/`simulateForumServer` are called.
- `server.ts`: `mode5Input.caseDescription` and
  `mode5Input.sentencaOuProposta` are anonymized the same way in
  `/api/gemini/mode5`, before `simulateMode5Server`.
- `chat-handler.ts`: the user's chat `message` is anonymized immediately
  after `sanitizeMessage`, before `chatWithAgentServer` — previously
  anonymization ran only on the already-sent message, right before the
  Firestore write.
- Quality-risk assessment, verified by reading the `anonymizer.ts`
  patterns against what `validateCausaServer`'s prompt actually needs:
  the patterns (CPF, CNPJ, email, phone, street address, process number)
  match pure identifiers only. None of them touch proper names, comarca/
  city names, dates, or monetary values — the content `validateCausaServer`
  depends on for legal-area classification, judge/comarca extraction, and
  author/defendant-role detection. No live-Gemini quality regression test
  was possible in this environment (no `GEMINI_API_KEY` available); this
  risk assessment is static analysis, not an empirical A/B result. If a
  quality regression is later observed in production, investigate here
  first before assuming an unrelated cause.
- Out of scope, explicitly not solved by this policy: file attachments
  (`Attachment.data`, base64 PDFs/images) are not anonymized by this
  change. `anonymizer.ts` operates on plain text only; redacting PII
  embedded in an uploaded document would require OCR plus image/PDF
  redaction, a materially larger feature. Any user-facing copy describing
  this protection MUST carve out attachments explicitly — see the
  `TermosPage.tsx` wording this policy shipped alongside, which does.
- Not addressed here: which Gemini API tier (free vs. billed) the
  project's `GEMINI_API_KEY` operates under, and whether Google may use
  unfiltered submitted content for model training on the free tier. This
  is a separate, still-open verification — see the governance note below.

## Relationship to other policies

- Supersedes the "Gemini calls... use the original text" clause of
  `_local-edr-policy-004` (LGPD anonymization). That policy's persistence
  requirement (anonymize before Firestore) is unchanged and still
  enforced client-side in `dbService.ts` — this policy adds an earlier
  checkpoint, it does not replace the later one. Running the same
  idempotent transform twice is harmless (verified: see
  `anonymizer.test.ts`, "é idempotente").
- Directly prompted by `_local-bdr-policy-005` (agent-naming-no-
  personification)'s own incident: the same cross-client verification
  exercise that found the naming gap also found this one.

## References

- `lexforum-ai-studio/server.ts` — `/api/gemini/validate`, `/api/gemini/simulate`, `/api/gemini/mode5`
- `lexforum-ai-studio/chat-handler.ts`
- `lexforum-ai-studio/src/lib/anonymizer.ts` — the transform itself, unchanged
- `lexforum-ai-studio/src/test/anonymizer.test.ts` — new direct unit coverage; `anonymizer.ts` previously had none (only mocked out in `dbService.test.ts`)
- `lexforum-ai-studio/src/pages/TermosPage.tsx` — Seção 3, rewritten to state what actually happens, including the attachments carve-out; version bumped 1.2 → 1.3
- [_local-edr-policy-004 - LGPD anonymization](../governance/001-lgpd-anonymization.md)
- [_local-bdr-policy-005 - agent naming no personification](../../bdrs/product/004-agent-naming-no-personification.md)
