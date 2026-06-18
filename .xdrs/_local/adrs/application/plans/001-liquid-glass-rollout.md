# _local-adr-plan-001: Liquid Glass Rollout

## Executive Summary

- Port the Liquid Glass visual language from the isolated prototype (`design-proposal/index.html`) into the production EAI? application, screen by screen, behind feature flags.
- Phase 0 extracts design tokens into a versioned source before any production component changes.
- Phases 2-4 replace prototype placeholders with real contracts: SSE-driven loading (ADR application/002), real `success_probability`/`userSide` results (EDR principles/001), and LGPD-anonymized, consent-gated persistence for Meus Casos (EDR governance/001).
- Phase 5 (expanded result: plain-language/professional reports, agent chat) is intentionally left as a named placeholder, not specified here — it needs its own UX/Design round before planning.
- Phase 6 gates every prior phase through staging (`eai.radiokactus.com`) review before production (`eaijuridico.com.br`) promotion.
- Owner per phase noted below; QA (Pareto/Probe/Scaffold) and Security (Sentinel/Sovereign/Blast/BAU/Ghost) have standing review rights on every phase, not just their named ones.

## Context and Problem Statement

The Liquid Glass prototype was approved for its visual direction across Home, Mode Workspace, and Meus Casos. It exists only as standalone HTML/CSS/JS with placeholder data and behavior. The production application already has its own architecture (agent pipeline, SSE streaming, Firestore with LGPD anonymization, pricing and beta-access rules) that the prototype does not reference. Without a phased plan, adopting the new visual language risks breaking those existing decisions or shipping the prototype's placeholder behavior (fake timeout loading, generic score, unconsented auto-save) as if it were real.

Question: in what order, and under what gates, should the Liquid Glass language move from prototype to production without violating existing architecture, security, and compliance decisions?

## Proposed Solution

Adopt the language incrementally, tokens first, one screen at a time, each gated by staging validation before production promotion. Reconcile every prototype placeholder with its real production counterpart before a screen is considered done.

Expected end date: 2026-09-30

## Acceptance Criteria

- All phases below reach their acceptance checklist.
- No screen reaches production before passing through staging.
- No user data is persisted by a ported screen without passing the LGPD anonymization step and prior consent.

## Approach

Work proceeds phase by phase, in sequence; a phase does not start implementation until the previous phase's acceptance checklist is met. Galera do Código owns implementation; Galera de UX and Design own screen-level acceptance review; Galera de Segurança reviews any phase touching user input or persistence; Galera de QA builds automated coverage alongside each phase, not after.

## Key Deliverables

- Versioned design token module (Phase 0)
- Full sitemap covering every real screen, including Auth and Payment (Phase 1)
- React shell components for Home/navbar/rail/mobile behind a feature flag (Phase 2)
- Mode Workspace wired to the real agent pipeline and SSE stream (Phase 3)
- Meus Casos wired to Firestore with consent capture and LGPD anonymization (Phase 4)
- Visual regression suite and Page Objects for all ported screens (Phase 6)
- Staging sign-off record per phase before production promotion (Phase 6)

## Key Resources

- Galera do Código (Scout, Flux, Literate, RiverRaid)
- Galera de UX (Compass, Empiricus, PolarBear) and Galera do Design (Canvas, Forge, Quill)
- Galera de Segurança (Sentinel, Sovereign, Blast, BAU, Ghost)
- Galera de QA (Pareto, Probe, Scaffold)
- Staging environment `eai.radiokactus.com`; real low/mid-tier mobile device for `backdrop-filter` performance validation

## Milestones

### Milestone 0: Token foundation
Owner: Forge, Scout, RiverRaid
Due date: 2026-06-30

Extract the prototype's CSS custom properties into a versioned token source (Tailwind config or shared CSS module) and define a `backdrop-filter` performance budget validated on real entry-level mobile hardware.

**Acceptance checklist:**
- [x] Tokens documented and importable by production components — `lexforum-ai-studio/src/styles/liquid-glass-tokens.css`, imported by `src/index.css`, documented in `lexforum-ai-studio/docs/liquid-glass-tokens.md`
- [ ] Performance budget defined and measured on real device, not only emulator — budget rule defined (navbar + 1 panel + 1 overlay max blur, enforced via the `.glass` utility class); **real-device measurement still pending**, requires Probe (Galera de QA) with physical mid-tier hardware

**Risks:**
- Stacked blur panels causing jank on low-end devices — Mitigation: cap simultaneous blurred surfaces per screen, measured in Phase 0

### Milestone 1: Full sitemap
Owner: PolarBear, Compass
Due date: 2026-07-07

Map every real screen of the system (Home, Auth, Mode Workspace, Meus Casos, Payment, expanded Result), not only the ones already prototyped, so later phases have a complete picture of scope.

**Acceptance checklist:**
- [x] Sitemap reviewed and approved by product owner — `lexforum-ai-studio/docs/sitemap.md` (21 screens mapped, no router, state-machine based); approved 2026-06-16

### Milestone 2: Shell and navigation
Owner: Scout, Flux
Due date: 2026-07-21

Port Home, navbar, rail, and mobile folder views into React components behind a feature flag, using the Phase 0 tokens, with no behavior change versus current production navigation.

**Acceptance checklist:**
- [x] Visual parity with prototype confirmed in both themes and viewports — Home rebuilt as rail (left) + dossier panel (right) + animated mesh background (`MeshBackground.tsx`, `.mesh-bg`/`.mesh-blob`), behind `VITE_LIQUID_GLASS` flag; deployed to staging (`eai.radiokactus.com`) and confirmed against the approved prototype by product owner on 2026-06-16, including desktop Home, mobile accordion, and both light/dark themes. A light-theme contrast bug was found and fixed in the same pass: mode accent colors (e.g. `#00FFEF`) were used as raw text color, giving ~1.3:1 contrast on light backgrounds (WCAG AA needs 4.5:1) — fixed via `.mode-text-accent` (commit `c9403c2`), which darkens the accent for text only in light theme.
- [x] No regression in existing navigation tests — `npm run build` and `npm test` clean with the flag both off and on (135 passed, 0 regressions, no behavior/structure change to the flag-off path)

**Boardroom Home glow signifiers missing, found and fixed (2026-06-18, ARGUS convocation):** product owner reported the desktop Home (rail+dossier, `BoardroomPage.tsx`) looking disconnected from the console's visual language — "a tela antiga, só com o glow." Compared the React port (commits `66dce64`, `9aa138d`) against the actual approved prototype (`design-proposal/index.html`, the v5/Liquid Glass version — not `v4-dossie-indice.html`, an earlier pre-Liquid-Glass iteration with the same rail+dossier structure but flat `var(--bg-rail)`/`var(--bg-panel)` surfaces and no glass/glow at all). Found the React port correctly used `.glass`/`.glass-static` and the mesh background, but dropped three glow signifiers present in the v5 prototype's CSS (`.preview-wash`, `.preview-icon` box-shadow, `.rail-item.active` box-shadow) that tie each dossier card and rail selection to a colored glow matching the selected mode's color — without them, the panel reads as a flat generic card with only the ambient mesh behind it, which is exactly the "old screen, just with the glow" perception. FORGE: this was a faithful-port gap against the named reference (this checklist's own "matching approved prototype" line was never diffed against the prototype's CSS), not a new design decision — restored via inline styles mirroring the prototype's `color-mix`/`radial-gradient` rules (the current token set has no RGB-channel custom properties, so `rgba(${cfg.colorRgb}, …)` was used, consistent with the pattern already used for `.preview-icon`'s fill/border). `npm run build` and `npm test` clean (135 passed, 0 regressions).

### Milestone 3: Mode Workspace on real pipeline
Owner: Scout, Literate, Sentinel
Due date: 2026-08-11

Replace the prototype's `setTimeout` processing state with the real SSE stream (ADR application/002) and render the actual `success_probability`/`userSide` result contract (EDR principles/001) instead of a random score.

**Scope discovery (2026-06-16):** production's Mode Workspace was already wired to the real SSE pipeline and the real result contract before this milestone started — there was no `setTimeout`/random-score placeholder to replace (only the isolated `design-proposal/index.html` prototype had that). The Mode 4 incident (ADR application/003) was already fixed in production logic. So this milestone's remaining scope is purely visual: apply the Liquid Glass material to the existing, already-correct Mode Workspace screens, behind `VITE_LIQUID_GLASS`, without touching `effectiveSide`/`displayPct`/`userSide` threading.

**Acceptance checklist (both items satisfied — milestone done):**
- [x] Loading state reflects real agent pipeline progress — confirmed pre-existing (`server.ts` SSE `WRITING`/`JUDGING`/`REVIEWING`/`ROUND_DONE`/`RESULT` events); mobile processing screen retextured with mesh + `.glass-static` step cards (commit `cf0ce23`), no logic changed
- [x] Result view matches the production data contract exactly — confirmed pre-existing (`finalSuccessProbability`, `rounds[]`, EDR principles/001 inversion logic); mobile paywall and unlocked Laudo screens retextured with mesh + `.glass-static` cards (commit `0b905c3`), no logic changed

**Scope correction (2026-06-16, same day):** an earlier note in this file called the desktop console "pending for this milestone." On inspection, the desktop view (`App.tsx`, from the `<main className="...grid grid-cols-12...">` root) is not a small panel — it's the entire desktop Mode Workspace (input, confirm, simulating, result, the "Boardroom" sidebar, and the Forge Monitor overlay), ~2000 lines, hardcoded to a constant near-black "tactical console" identity (`bg-[#0A0A0B]`) that does not follow the light/dark theme tokens at all today, and it doubles as the PDF export layout (extensive `print:` Tailwind variants on the report content). Retexturing it is a substantially larger, higher-risk effort than the mobile pass — it needs its own UX/Design round to decide whether the console identity is replaced or kept, not a same-pass blind application of `.glass`. It is out of scope for this milestone; tracked as a new candidate milestone (see Risks below) rather than left as a same-milestone loose end.

**Mobile coverage gap found and fixed (2026-06-16, same day):** product owner reported the glass effect "lost" on the screen entered after tapping a mode's "Começar" button. On inspection, the mobile `input` (DESCREVA) and `confirm` (CONFIRME) steps for all 5 modes (`App.tsx` lines ~1122-1876) were never covered by this milestone's mobile pass — only `simulating` and `result` were converted (commits `cf0ce23`, `0b905c3`). These steps still rendered with the original solid `var(--bg-card)` surfaces and no `MeshBackground` mount, which read as a regression even though it was actually a gap. Fixed by applying the same established pattern (`MeshBackground` mounted at each step root, `.glass-static` on the field-card surfaces, `borderLeft` mode-color accent preserved as the signifier it is) — commit `0dbab77`. `npm run build` and `npm test` clean (135 passed, 0 regressions) with the flag both off and on.

**Desktop coverage gap found and fixed (2026-06-16, same day):** product owner attempted the Milestone 3b empirical-validation pass on desktop and reported the input screen looking like "old layout mixed with the proposed liquid glass" — the sidebar/feed cards converted in Milestone 3b were `.glass-static`, but the desktop console's main `input` and `confirm` panels (textarea cards, side-by-side Autor/Réu cards, Mode 5's Relato/Sentença cards, the confirm step's case-summary card) were still hardcoded `bg-[#15161A]`, never covered by any milestone. CANVAS's gate ("a new visual pattern introduced outside the established system → verify alignment; visual inconsistency erodes trust") and FORGE's gate ("a design token hardcoded in implementation → block and replace with the canonical token") both applied directly — this was execution debt, not a new design decision, since it's the same surface-only `.glass-static` pattern already converged on, just never reaching these panels. Fixed by converting all 8 `bg-[#15161A] border border-white/10` card instances plus the confirm step's case-summary card to the established conditional `.glass-static` pattern, preserving `relative`/`group` (needed for the absolute-positioned colored accent bars) and the colored left-border signifier — commit pending. `npm run build` and `npm test` clean (135 passed, 0 regressions) with the flag both off and on.

**Risks:**
- Repeating a Mode 4 class of bug (ADR application/003) when wiring new UI to existing agent logic — Mitigation: review against that incident record before implementation, not after
- Desktop Mode Workspace console retexture scope was discovered, not planned — Mitigation: needs a dedicated UX/Design round and its own milestone before implementation; do not fold into Milestone 3's mobile-focused acceptance criteria

### Milestone 3b: Desktop Boardroom console — surface retexture
Owner: Canvas, Forge, Compass, Empiricus, PolarBear, Quill, Scout
Due date: 2026-08-18

ARGUS convoked Galera de UX (Compass, Empiricus, PolarBear) and Galera de Design (Canvas, Forge, Quill), with Scout for feasibility, to resolve the desktop console redesign direction flagged as out-of-scope in Milestone 3. Three directions were tabled: (1) surface-only retexture keeping the dark console identity, (2) full prototype-style redesign (mesh + rail + dossier), (3) leave untouched.

**Deliberation outcome:** EMPIRICUS rejected option 2 as technically null absent empirical validation, and as the option furthest from the already-internalized professional workflow. POLARBEAR tensioned that any reform must not touch the unmapped internal information architecture of the console; CANVAS resolved this by distinguishing surface retexture (no reorganization) from redesign (reorganization) — POLARBEAR ceded once the distinction held. FORGE required `.glass-static` (no `backdrop-filter`) on any surface reachable by the `print:` PDF export path, since blur is not portable to print — this was satisfied by scoping the retexture to the agent-feed/result-locked view, sidebar, and footer/export bar, which are all outside the unlocked Laudo's print-rendered branch (`no-print` or a separate `step === 'result' && !isUnlocked` render branch). COMPASS required all progress/status signifiers (step indicators, Forge Monitor overlay, "Resumo do Caso Atual") to remain functionally and visually unchanged — only fill/blur/border changed. Converged on option 1.

**Acceptance checklist:**
- [x] Root console background, sidebar, agent-feed cards (Performance Global, Disponibilidade de Agentes, Agent: Judge), footer, and floating export bar retextured with `.glass-static` + `MeshBackground`, gated by `VITE_LIQUID_GLASS`, no behavior or signifier change — commits `8b62896`, follow-up fix below
- [x] No `backdrop-filter`/`.glass` applied to the unlocked Laudo print-rendered branch (`state.step === 'result' && state.isUnlocked`) — left untouched, confirmed by reading render branches
- [x] `npm run build` and `npm test` clean (135 passed, 0 regressions) with the flag both off and on (flag-off path unchanged: original Tailwind classes retained as the `false` branch of each conditional)
- [ ] Empirical validation with a real user on this workflow (per EMPIRICUS's condition), in addition to product-owner confirmation, before production promotion

**Bug found and fixed on first staging pass (2026-06-16):** product owner validated on staging and reported the "Disponibilidade de Agentes de IA" card and washed-out text inside the retextured cards — a CANVAS-gate contrast violation. Root cause: every text class in this console (`text-white`, `text-white/60`, `text-white/20`, etc.) was authored against the fixed dark identity, but `.glass-static`'s fill/border tokens switch to their light-theme values when the global theme toggle is light, producing near-white text on a near-white card. Fix: the console root now pins `--glass-fill`/`--glass-border`/`--glass-shadow`/`--mesh-*` to their dark-theme values via inline style, regardless of the global `data-theme` — consistent with the deliberation's premise that the console identity stays dark on purpose. Also found and converted two sibling cards (`bg-[#15161A]` "Disponibilidade de Agentes de IA", `bg-[#1C1C1F]` "Ambiente de Simulação" footer) that the first pass's grep missed.

**Risks:**
- Console identity change perceived as reducing focus during a high-cognitive-load task — Mitigation: surface-only change, no layout/hierarchy change, signifiers preserved verbatim

**Mobile and desktop input/confirm coverage gaps found and fixed (2026-06-16/18, same thread):** product owner reported the mobile and then desktop DESCREVA/CONFIRME steps still showing the original surfaces — never covered by Milestone 3 or 3b (only `simulating`/`result` on mobile, only sidebar/feed on desktop). Fixed mobile (commit `0dbab77`) and desktop (commit `cd7edc4`, plus a missed feature-card row in commit `b89c97c`) input/confirm panels with the same `.glass-static` pattern.

**Deep audit closing the loop (2026-06-18, ARGUS convocation):** product owner flagged a recurring pattern — each fix was found by a fresh screenshot, not by auditing the file, so each fix exposed the next gap. ARGUS convoked Galera do Código (Scout, Flux) and Galera do Design (Canvas, Forge) for a full audit instead of another reactive patch. Grepped the entire console render tree for hardcoded surface colors (`bg-[#15161A]`, `bg-[#1C1C1F]`, `bg-[#0A0A0B]`, `bg-[#0F1012]`) and classified every match. Found this milestone's own checklist was inaccurate: it named "Agent: Judge" as retextured but not its sibling "Agent: Lawyer" card in the same grid row — never converted. Also found, in the same locked result-view scope (outside the print-protected `isUnlocked` branch): the Modo 4 static-side card, the paywall/lock card, and both Modo 5 locked-result cards (Análise do Juiz Estrategista, Fundamentação Jurídica) — none converted. FORGE: all five were canonical-token violations (hardcoded color where `.glass-static` already exists); converted. Remaining hardcoded colors in the file are explicitly out of scope, not overlooked: small attachment/badge chips (not panel surfaces), Modo 5's unselected-state selector buttons (intentional UI state, not a card), and the `isUnlocked` Laudo print branch (protected by this milestone's own deliberation). Also found and fixed the deeper reason isolated fixes kept "looking the same" even when correctly converted: on the dark theme, `--glass-fill` (6% white over `--mesh-bg: #050610`) is numerically near-identical to the old flat colors wherever no mesh-blob is nearby, and the 3 blobs only lit small fixed corners of the viewport — raised `--glass-fill/-2/-border` and enlarged/blurred the mesh blobs (commit `7306506`) so the material is visually distinct everywhere, not just near a blob. `npm run build` and `npm test` clean (135 passed, 0 regressions) with the flag both off and on, after every commit in this audit.

**Risks (added):**
- Reactive, screenshot-driven fixes that don't audit siblings in the same component will keep reopening this milestone — Mitigation: this audit's grep-based method is the standing practice going forward; before marking a checklist item `[x]`, grep the full render tree for the surface-color tokens being replaced, not just the one reported instance

### Milestone 4: Meus Casos with consent and anonymization
Owner: Sovereign, Blast, BAU
Due date: 2026-08-25

Implement Firestore persistence for completed simulations, gated by explicit consent collected before the first simulation and LGPD anonymization (EDR governance/001) applied before any write.

**Acceptance checklist:**
- [ ] Consent capture precedes the first auto-save in the user flow
- [ ] No raw personally identifiable data reaches Firestore unanonymized
- [ ] Compliance review (BAU) signed off

### Milestone 5: Expanded result — scope placeholder
Owner: UX + Design (future round)
Due date: not scheduled

Plain-language and professional report views, plus agent chat, are named here as known future scope but are deliberately not designed yet. A separate UX/Design deliberation round, and its own plan, is required before this milestone gets a due date.

### Milestone 6: QA and staged rollout
Owner: Pareto, Probe, Scaffold
Due date: 2026-09-30

Build visual regression coverage and Page Objects alongside each phase above (not retroactively), run a dedicated exploratory session on real Safari/iOS and older Android WebView for `backdrop-filter` quirks, and require one full review cycle on staging before any phase promotes to production.

**Acceptance checklist:**
- [ ] Visual regression suite covers dark/light x mobile/desktop for every ported screen
- [ ] Exploratory session on real Safari/iOS and Android WebView completed
- [ ] Staging sign-off recorded before each production promotion

## Risks Identified

- Shipping prototype placeholder behavior (fake timeout, generic score, unconsented auto-save) as if it were production-ready — Mitigation: each milestone's acceptance checklist explicitly requires the real contract, not visual parity alone
- `backdrop-filter` browser support gaps on older Safari/Android WebView — Mitigation: Milestone 6 exploratory session and a documented fallback (opaque surface) for unsupported browsers
- Scope creep into the expanded result/chat feature before it is validated — Mitigation: Milestone 5 is explicitly left unscheduled and requires its own future plan

## References

- [_local-adr-policy-006 - Liquid Glass rollout](../004-liquid-glass-rollout.md) - the lasting decision this plan implements
- [001-simulation-pipeline](../001-simulation-pipeline.md)
- [002-sse-streaming](../002-sse-streaming.md)
- [003-mode4-production-incident-2026-06](../003-mode4-production-incident-2026-06.md)
- [EDR governance/001 - lgpd-anonymization](../../../edrs/governance/001-lgpd-anonymization.md)
- [EDR principles/001 - success-probability-interpretation](../../../edrs/principles/001-success-probability-interpretation.md)
