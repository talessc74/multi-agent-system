---
name: _local-adr-policy-014-light-mode-color-system
description: Establishes the light-theme color token set (bg/text/border/mode-brand tiers) calibrated against real WCAG contrast math, not eyeballed, and requires any new light-mode work to extend this token set rather than hand-pick colors per component. Use when migrating another screen to support the light theme, or when adding a new color role to index.css.
apply-to: lexforum-ai-studio/src/index.css — theme tokens; lexforum-ai-studio/src/config/modeConfig.ts — per-mode colorLight/colorRgbLight; lexforum-ai-studio/src/App.tsx and src/pages/BoardroomPage.tsx — consumers
valid-from: 2026-07-03
---

# _local-adr-policy-014: light-mode color system

## Context and Problem Statement

The site has had a light/dark toggle (`useTheme`, `data-theme` attribute,
`index.css` custom properties) since the Boardroom redesign, but only
`BoardroomPage.tsx` and the shared `Navbar`/`LoginModal` ever consumed the
theme tokens. Everything downstream of the Boardroom landing page — every
actual simulation screen (Modo 1-5 input, confirm, simulating, result/laudo,
chat, Monitor de Agentes, Meus Casos) — was built with hardcoded dark-only
colors (`bg-[#0A0A0B]`, `text-white/40`, etc.), roughly 500+ individual color
utility instances across ~2,200 lines. Toggling to light mode changed the
Navbar and nothing else.

Two further, more severe gaps surfaced during a live production review with
the user:

1. `--bg-secondary` (and several other tokens: `--text-muted`,
   `--accent-press`, `--border-active`, `--success`, `--danger`) had no
   `[data-theme='light']` value at all — wherever used, light mode silently
   inherited the dark value. Confirmed live: the "Painel Boardroom" section
   rendered as a dark box on an otherwise light page.
2. Each of the 5 simulation modes has its own brand color (`MODE_CONFIG.color`
   /`colorRgb`) used directly as text/icon/border color in `BoardroomPage.tsx`.
   All 5 were calibrated only against a near-black background. Measured
   contrast against the light background: 1.14:1 to 2.59:1 — all fail badly
   (WCAG minimum for meaningful UI is 3:1; body text needs 4.5:1). The Modo 1
   cyan (`#00FFEF`) was the worst, at 1.14:1 — effectively invisible.

Given the user's explicit concern ("temos muitas fontes e o contraste é um
ponto muito importante"), colors could not simply be chosen by eye.

## Decision Outcome

**Every light-mode color is calibrated against real contrast math (WCAG
relative-luminance formula) before being added to the token set, and every
consumer reads through a named token — never a component-local hardcoded
hex or opacity value.**

### Details — neutral tokens (`index.css`)

- Completed the light-theme token set: `--bg-secondary`, `--text-tertiary`
  (new — also added to the dark block for symmetry, `rgba(255,255,255,0.68)`),
  `--text-muted`, `--accent-press`, `--border-active`, `--success`, `--danger`.
- Tier contrast targets, verified by computing actual luminance/contrast
  ratios (not visual judgment):
  - `--text-primary` (navy, 100% opacity): ~16:1 — headings, primary values.
  - `--text-tertiary` (navy, 68%): ~6.5:1 — secondary reading text.
  - `--text-secondary` (navy, 55%, pre-existing): ~3.9:1.
  - `--text-muted` (navy, 35%): ~2.2:1 — intentionally below AA-normal-text.
    This is correct, not a shortcut: every dark-mode instance it replaces
    (`text-white/10` through `/30`) is itself a decorative or low-priority
    tier (version stamps, eyebrow micro-labels, dividers), never primary
    reading content. Primary content always uses `--text-tertiary` or
    `--text-primary` instead.
- All dark-mode hex values were left untouched — light-mode work only adds
  values under `[data-theme='light']` or introduces a new token name that
  didn't exist before. Verified via side-by-side screenshots that dark mode
  is pixel-equivalent before/after every commit in this series.

### Details — mode brand colors (`modeConfig.ts`)

- Added `colorLight`/`colorRgbLight` per mode: the same hue, darkened until
  contrast against both `--bg-card` (white) and `--bg-primary` (cream) clears
  ~4.5:1.
  - Tese Estratégica: `#00FFEF` → `#00857C`
  - Defesa sob Ataque: `#FF6B6B` → `#ED0000`
  - Mesa Dupla — Juiz: `#A882FF` → `#8652FF`
  - Mesa Dupla — Assistida: `#FFB800` → `#996E00`
  - Revisão Pós-Conflito: `#00CC88` → `#00875A`
- A `modeColor(cfg)`/`modeColorRgb(cfg)` helper in `BoardroomPage.tsx` (reads
  `useTheme()`) picks the light variant in light theme. Applied everywhere the
  mode color is used as **text/icon/border** (needs to be legible on its
  own) — not applied to the two CTA buttons, where `cfg.color` is a button
  **fill** with a fixed dark navy text on top; that pairing already has its
  own self-contained contrast regardless of page theme, and darkening it
  would just make the button look muddier for no contrast benefit.
- The color choice itself (which of several contrast-safe candidates) was
  put to the user with a rendered swatch comparison — contrast math picks the
  safe set, the user picks the one that looks right within it.

### Details — rollout scope

- One full screen (Modo 1/2 desktop input: root container, Navbar children,
  form, stat cards, Boardroom sidebar) was migrated end-to-end as a real,
  working sample — not just a proposal — verified in both themes.
- The remaining ~2,100 lines (Modos 3/4/5 input, confirm/simulating/result,
  chat, Monitor de Agentes, Meus Casos) are still dark-only. Migrating them
  is follow-up work, scoped screen-by-screen the same way, reusing this same
  token set — not a new color study each time.
- Out of scope for this ADR, applied as a drive-by fix in the same series:
  the desktop mode selector (list, detail panel, icon squares, CTA button)
  had sharp rectangular corners while the mobile accordion already used a
  12px radius. Aligned both to `rounded-xl`/`rounded-lg`, applied to both
  themes since it's shared code.

## References

- `lexforum-ai-studio/src/index.css` — full token set, dark and light
- `lexforum-ai-studio/src/config/modeConfig.ts` — `colorLight`/`colorRgbLight` per mode
- `lexforum-ai-studio/src/pages/BoardroomPage.tsx` — `modeColor`/`modeColorRgb` helper, rounded corners
- `lexforum-ai-studio/src/App.tsx` — Modo 1/2 desktop input screen, fully migrated as the rollout sample
- `adrs/application/005-boardroom-desktop-mode-selector.md` — ADR-007, the list+detail pattern this ADR adds light-mode support to
