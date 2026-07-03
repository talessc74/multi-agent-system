---
name: _local-edr-policy-016-pdf-repeating-print-header
description: The PDF export's masthead (logo + report title + emission date) must use position:fixed under @media print to repeat on every physical page — a normal-flow element only ever appears once, on whichever page it happens to land on. Also documents that the Logo component's compact icon mark and its wordmark title are the same brand mark rendered twice when both are shown together; print-only usages should pick one, not both. Use when adding or changing any header/footer element intended to appear across the exported PDF's pages.
apply-to: lexforum-ai-studio/src/App.tsx — result screen print-only masthead; lexforum-ai-studio/src/components/Logo.tsx
valid-from: 2026-07-03
---

# _local-edr-policy-016: PDF repeating print header

## Context and Problem Statement

Follow-up to EDR-015. After that fix shipped, the user tested a real exported
PDF and flagged the masthead (top of page 1): the brand mark appeared
**doubled** — the compact "EAI✓?" icon mark and the full italic "EAI?"
wordmark, both rendered by `<Logo variant="light" size="lg" />`
(`App.tsx:3455`, pre-fix) with its default `showTitle={true}`, sitting right
next to each other. And the masthead only appeared on **page 1** — pages 2+
had no mark at all.

The second part is a direct consequence of how browser print pagination
works: the masthead `<div>` (`App.tsx:3453`, pre-fix) was a normal
in-document-flow element. `window.print()` paginates the whole document once;
an element in normal flow renders exactly once, on whichever physical page it
lands on — there is no built-in "repeat this on every page" behavior for
flow content.

## Decision Outcome

**The masthead uses `position: fixed` under `@media print`, which Chromium's
print renderer does repeat on every physical page — confirmed by generating
a real multi-page PDF before and after.** The `Logo` component's `showTitle`
prop is used to pick a single mark (icon + tagline) rather than showing both
the icon mark and the wordmark title together.

### Details

- `App.tsx:3453`: `print:fixed print:top-0 print:left-0 print:right-0
  print:bg-white print:z-50`, replacing the previous normal-flow `mb-12`
  placement. Kept `hidden` (screen) / `print:block` unchanged — this element
  still only exists for print.
- Because `position: fixed` removes the element from document flow, the
  first printed page's content would otherwise start underneath it. A fixed-
  height spacer (`56px`, matched to the masthead's actual rendered height)
  was added immediately after it, print-only, to reserve that space in flow.
- `<Logo variant="light" size="lg" />` → `<Logo variant="light" size="sm"
  showTitle={false} />`: keeps the compact icon mark ("EAI" + accent-colored
  "✓?") and the "Evidence-Based Artificial Intelligence" tagline, drops the
  large italic "EAI?" wordmark that was duplicating the same mark. `size`
  dropped from `lg` to `sm` since the masthead now repeats on every page —
  it needs to be unobtrusive, not a page-one hero treatment.
- This is a general pattern, not specific to this one element: any future
  print-only header/footer meant to repeat across pages must use
  `position: fixed` under `@media print`, plus a matching flow spacer sized
  to its rendered height. A normal-flow print-only element will only ever
  appear once, wherever pagination happens to place it.

## References

- `lexforum-ai-studio/src/App.tsx:3453-3465` — the fixed masthead + flow spacer
- `lexforum-ai-studio/src/components/Logo.tsx` — `showTitle`/`showText` props; icon mark vs. wordmark are two renderings of the same brand mark, not meant to be shown together in a compact masthead
- `edrs/application/009-pdf-export-print-only-content.md` — EDR-015, the PDF-export bug-fix series this continues
