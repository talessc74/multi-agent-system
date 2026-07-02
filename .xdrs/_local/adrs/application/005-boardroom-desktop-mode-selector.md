---
name: _local-adr-policy-007-boardroom-desktop-mode-selector
description: Requires the desktop mode selector on BoardroomPage to use a list + detail-panel pattern sourced from a single MODE_CONFIG, instead of showing all 5 modes' full descriptions at once from a separate hardcoded array. Use when touching mode selection UI or MODE_CONFIG in lexforum-ai-studio.
apply-to: lexforum-ai-studio/src/pages/BoardroomPage.tsx — desktop mode selector section
valid-from: 2026-07-02
---

# _local-adr-policy-007: Boardroom desktop mode selector

## Context and Problem Statement

The desktop landing page showed all 5 simulation modes at once, each as a full-width
row with a dense uppercase paragraph description — five walls of text visible
simultaneously, with no signal of which mode to start with. The user flagged this as
confusing, contrasting it with the mobile version, which already uses an accordion:
tapping a mode expands it to show `tagline`, `description`, and a CTA, sourced from
`MODE_CONFIG` (`src/config/modeConfig.ts`).

Investigating the desktop code found the actual root cause: the desktop section read
from a separate hardcoded `MODES` array (title/price/Icon/desc only) instead of
`MODE_CONFIG`, which already carries `tagline`, `bring` ("o que trazer"), and
`receive` ("o que você recebe") for every mode. Desktop and mobile had silently
diverged onto two sources of truth for the same 5 modes' content.

Question: How should the desktop mode selector present 5 modes without showing all
of them expanded at once, and without maintaining a second copy of their content?

## Decision Outcome

**List + detail-panel layout, sourced entirely from `MODE_CONFIG` — not a literal copy of the mobile accordion.**

The mobile accordion pattern (stack, one expands in place) is the right response to
mobile's single-column constraint, but wastes desktop's horizontal space. Desktop
instead shows a compact list of all 5 modes on the left (icon, headline, price) and
a detail panel on the right that updates to the selected mode's `tagline`,
`description`, `bring`, `receive`, and `cta` — same underlying UX principle
(progressive disclosure, one mode's full content visible at a time) expressed in a
layout suited to the wider viewport.

### Details

- Both mobile and desktop read mode content exclusively from `MODE_CONFIG`. No
  component may hold its own copy of a mode's `tagline`/`description`/`bring`/`receive`.
- Desktop selection state defaults to mode 1, so the detail panel is never empty on load.
- Selection is click-driven (not hover-only), for reliable behavior across input
  devices — matches how the list items are implemented as native `<button>` elements,
  which also gives free keyboard focus/activation.
- The detail panel uses `aria-live="polite"` so screen readers announce the content
  change when a different mode is selected.
- Per-mode color (`cfg.color`/`cfg.colorRgb`) drives the selected list item's border/
  background and the detail panel's CTA button, consistent with how mobile already
  colors its expanded card and CTA.
- Price is not yet part of `MODE_CONFIG` (it lives in local `MODE_PRICES`/mobile's own
  array) — out of scope for this decision; a future cleanup could fold pricing into
  `MODE_CONFIG` to remove that remaining duplication.
- Scope: this decision covers only the desktop mode-selector section of
  `BoardroomPage.tsx`. It does not touch the "Painel Boardroom" section further down
  the same page, any Modo 1-5 input screens, or the mobile accordion.

## References

- `lexforum-ai-studio/src/pages/BoardroomPage.tsx` — desktop mode selector (list + detail panel)
- `lexforum-ai-studio/src/config/modeConfig.ts` — `MODE_CONFIG`, shared by mobile and desktop
