---
name: _local-edr-policy-009-modo1-input-guardrails
description: Requires the Modo 1/2 input step to enforce, in code, every limit or affordance stated in its own copy (attachment count/size, minimum causa length, placeholder legibility). Use when touching the input step's textarea, file upload, or submit button in App.tsx.
apply-to: lexforum-ai-studio/src/App.tsx — state.step === 'input' (Modo 1 and Modo 2)
valid-from: 2026-07-01
---

# _local-edr-policy-009: Modo 1 input guardrails

## Context and Problem Statement

The Modo 1/2 input step displays copy that implies constraints the code does not
enforce, and a placeholder whose contrast undermines its own purpose:

- Copy reads "máx 10MB por arquivo · total 20MB" (`App.tsx:2755-2756`), but
  `handleFileChange` (`App.tsx:607-639`) only checks per-file size — there is no
  cap on file count or on the cumulative 20MB total.
- The "Validar Causa" button only requires a non-empty, trimmed string
  (`disabled={!state.caseDescription.trim() || loading}`, `App.tsx:2764`) — a
  single character enables submission.
- The textarea placeholder renders at `placeholder:opacity-10` (`App.tsx:2716`),
  which is close to illegible and weakens its role as the only guidance for what
  to write.

A comparable screen already exists in this same product
(`lexforum-app/src/app/causa/page.tsx`) with a validated pattern: `MAX_ARQUIVOS = 5`,
a `MAX_BYTES` per-file cap enforced with a visible error message
(`causa/page.tsx:19-21,63-67`), and a `canSubmit = text.trim().length > 10` gate
(`causa/page.tsx:94`). That pattern was never propagated to the live
`lexforum-ai-studio` input step.

Question: What must the input step guarantee about limits it displays to the user?

## Decision Outcome

**Every limit or affordance shown in the input step's copy must be enforced in code, using the pattern already validated in `lexforum-app/src/app/causa/page.tsx`**

### Details

- Attachments: enforce a maximum file count (mirror `MAX_ARQUIVOS = 5` unless a
  different number is deliberately chosen) and a cumulative size cap matching the
  "total 20MB" copy, in addition to the existing per-file 10MB check. Surface
  violations via `attachmentError`, consistent with the existing per-file message.
- Submission: require a minimum trimmed length for `caseDescription` before
  enabling "Validar Causa" (mirror `length > 10`), not just non-empty. Keep the
  button visibly disabled below that threshold, as the button already does for
  the empty case.
- Placeholder legibility: raise the textarea placeholder opacity to a level that
  is readable as secondary guidance (e.g. in the 30–40% range used elsewhere in
  the app for muted text) instead of `opacity-10`.
- Do not introduce a new validation pattern — reuse the constants and messaging
  style already present in `lexforum-app/src/app/causa/page.tsx` so the two apps
  stay consistent for the same product.

## References

- `lexforum-ai-studio/src/App.tsx:607-639` (`handleFileChange`, no count/total cap)
- `lexforum-ai-studio/src/App.tsx:2711-2772` (input step textarea, attachments, submit button)
- `lexforum-app/src/app/causa/page.tsx:19-21` (`MAX_ARQUIVOS`, `MAX_BYTES` constants)
- `lexforum-app/src/app/causa/page.tsx:48-71` (`handleFileChange` with count/size enforcement)
- `lexforum-app/src/app/causa/page.tsx:94` (`canSubmit = text.trim().length > 10`)
