---
name: _local-edr-policy-015-pdf-export-print-only-content
description: The PDF export is the browser's native print-to-PDF (window.print() over @media print), not a dedicated PDF renderer — so any interactive/screen-only UI added to the result screen must be explicitly marked no-print, and any user-generated text field rendered in the report must go through ReactMarkdown, matching the pattern already used for the report's other sections. Use when adding new content to the Laudo/result screen.
apply-to: lexforum-ai-studio/src/App.tsx — result screen (state.step === 'result' && state.isUnlocked)
valid-from: 2026-07-03
---

# _local-edr-policy-015: PDF export renders only print-appropriate, fully-formatted content

## Context and Problem Statement

The "Exportar PDF" button (`App.tsx:4251`) is literally `window.print()` — there is
no dedicated PDF generation library or backend renderer. Whatever the browser
lays out under `@media print` *is* the PDF. This means anything added to the
result screen without explicit print handling ends up in the exported document.

Generating a real PDF (via headless Chromium print-media emulation, using
representative test data) surfaced three defects, reported by the user after
seeing an official-looking document print with what looked like layout chaos:

1. **A fully blank page** between "Volume II" and "Anexo I"
   (`App.tsx:3824`, `print:break-before-page`). The forced break landed at a
   point where natural pagination had already moved to a new page, producing
   an empty one in between.
2. **Raw markdown syntax printed literally** in "Anexo I" (the round-by-round
   petition/judgment history, `App.tsx:3868` and `3878`, pre-fix): `round.lawyerPetition`
   and `cleanJudgmentText(round.judgeJudgment)` were interpolated as plain text
   (one even manually wrapped in literal quote marks), while "Volume I" and
   "Volume II" a few hundred lines earlier correctly pipe the same kind of
   AI-generated markdown content through `<ReactMarkdown>`. Same content
   shape, two different (and inconsistent) rendering paths on the same document.
3. **Interactive, screen-only UI leaking into the printed page**: the "quer
   ver como a outra parte vai reagir?" button and its surrounding explanatory
   paragraph (`App.tsx:3463-3611`) — a whole Modo 1 counter-hypothesis
   exploration flow with buttons, loaders, and a follow-up CTA — had no
   `no-print` guard, so it printed as static, non-functional text at the top
   of the report.

## Decision Outcome

**Every piece of the result screen that is interactive or screen-only gets an
explicit `no-print` class. Every piece of AI-generated text content gets
rendered through `<ReactMarkdown>` with the `laudo-prose` styling, regardless
of which section of the report it appears in.**

### Details

- `App.tsx:3464` and `3473` (the Modo 1 hypothesis-exploration intro text and
  its interactive block) now carry `no-print` (the utility already exists,
  `index.css:76`, `.no-print { display: none !important; }` — same pattern
  already used for the Boardroom sidebar and chat panel).
- `App.tsx:3868`/`3878` (Anexo I petition/judgment text) now use
  `<ReactMarkdown>{...}</ReactMarkdown>` inside a `laudo-prose prose
  prose-invert prose-sm max-w-none` wrapper, identical in kind to the Volume
  I/II sections (`App.tsx:3754`, `3778`). The literal `"..."` quote-wrapping
  around the petition was removed — it read oddly once the content is
  properly formatted multi-paragraph markdown. The judgment block's font
  changed from `font-mono` to `font-sans` to match: it was monospace because
  it displayed raw unformatted text before; now that it's rendered prose,
  monospace no longer fits.
- The blank page went away as a side effect of hiding the hypothesis block —
  it was occupying layout space that shifted where natural pagination fell,
  interacting badly with the forced `print:break-before-page`. No change was
  made to the `break-before-page` rule itself; if a blank page reappears
  after future edits to this screen, check for new un-guarded screen-only
  content between "Volume II" and "Anexo I" before touching the break rule.
- Out of scope: the report's overall print typography/visual-language
  consistency (multiple typefaces — Playfair/Cormorant serif headings,
  JetBrains Mono labels, Inter body — and a "dashboard" visual style for
  Anexo I that doesn't match Volume I/II's editorial style) is a design
  decision, not a bug, and is tracked as a separate study.

## References

- `lexforum-ai-studio/src/App.tsx:3463-3473` — hypothesis-exploration intro/block, now `no-print`
- `lexforum-ai-studio/src/App.tsx:3868`, `3878` — Anexo I petition/judgment, now `<ReactMarkdown>`
- `lexforum-ai-studio/src/App.tsx:3754`, `3778` — Volume I/II, the pre-existing correct pattern this policy aligns Anexo I to
- `lexforum-ai-studio/src/index.css:66-102` — `@media print` rules, `.no-print`/`.print-only` utilities
