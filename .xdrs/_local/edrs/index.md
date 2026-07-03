# _local EDRs Index

Engineering workflow and implementation decisions for EAI?.

## application

Code-level implementation patterns and conventions.

- [001-judge-area-binding](application/001-judge-area-binding.md) — Mandatory INSTRUCAO VINCULANTE prefix binds judge and lawyer to session's legal area (defense-in-depth; see EDR-007 for primary fix)
- [002-dynamic-legal-areas](application/002-dynamic-legal-areas.md) — All legal areas supported via dynamic agent creation and Firestore caching
- [003-judge-impartiality-in-creation](application/003-judge-impartiality-in-creation.md) — Judge and desembargadora descriptions to Shaw must always be impartial — userSide must never influence judge creation
- [004-demand-driven-agent-creation](application/004-demand-driven-agent-creation.md) — Agents are created exclusively on demand inside resolveAgent's Camada 3; registry curation is strictly subtractive/relocational and must never trigger compensatory agent creation
- [005-modo1-input-guardrails](application/005-modo1-input-guardrails.md) — Every limit shown in the Modo 1/2 input step's copy (attachments, minimum causa length) must be enforced in code, reusing the pattern already validated in lexforum-app
- [006-specificjudge-null-sentinel-filtering](application/006-specificjudge-null-sentinel-filtering.md) — Normalize Gemini's literal "null" string sentinel for specificJudge at extraction time (validateCausaServer), not with ad hoc guards at each call site
- [007-global-stats-fabricated-fallback](application/007-global-stats-fabricated-fallback.md) — getStats() must return null (not an invented plausible number) when the stats/global document doesn't exist yet, closing the gap ADR-006's loading guard didn't cover
- [008-chat-simulationid-and-history-on-case-load](application/008-chat-simulationid-and-history-on-case-load.md) — loadSimulation must set simulationId and reset per-case chat state; handleOpenChat must always refetch real chat history from Firestore on open, never reuse in-memory chatMessages
- [009-pdf-export-print-only-content](application/009-pdf-export-print-only-content.md) — The "Exportar PDF" button is window.print() over @media print, not a dedicated renderer — screen-only/interactive UI on the result screen needs no-print, and all AI-generated text needs ReactMarkdown, consistently across every section of the report
- [010-pdf-repeating-print-header](application/010-pdf-repeating-print-header.md) — The PDF masthead must use position:fixed under @media print (plus a matching flow spacer) to repeat on every page; Logo's icon mark and wordmark title are the same brand mark and shouldn't both show in a compact masthead

## principles

Engineering principles and non-functional quality defaults.

- [001-success-probability-interpretation](principles/001-success-probability-interpretation.md) — `success_probability` always represents the author's chance of winning (0-100); `userSide` persistence contract
- [002-commit-strategy](principles/002-commit-strategy.md) — Atomic commits: one task per commit, read git log before starting
- [003-mode4-judge-frame-contract](principles/003-mode4-judge-frame-contract.md) — Mandatory judge prompt frame for Mode 4 split by userSide; DEFENSE frame eliminates 75-point variance

## devops

Delivery pipeline and release automation decisions.

- [001-deployment-strategy](devops/001-deployment-strategy.md) — Auto-deploy to Cloud Run on push to main via Cloud Build

## governance

Engineering governance and compliance mechanics.

- [001-lgpd-anonymization](governance/001-lgpd-anonymization.md) — LGPD: anonymize all user data before persisting to Firestore
