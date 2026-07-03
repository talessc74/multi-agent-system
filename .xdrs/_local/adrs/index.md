# _local ADRs Index

Architectural and technical decisions for EAI?.

## application

System and service design decisions.

- [001-simulation-pipeline](application/001-simulation-pipeline.md) — How the five simulation modes and the agent resolution pipeline are structured
- [002-sse-streaming](application/002-sse-streaming.md) — Server-Sent Events for streaming real-time simulation progress to the client
- [003-mode4-production-incident-2026-06](application/003-mode4-production-incident-2026-06.md) — Complete incident record: Mode 4 bugs, root causes, fixes, false positives, canonical patterns and lessons learned (June 2026)
- [004-modo1-boardroom-data-integrity](application/004-modo1-boardroom-data-integrity.md) — Modo 1/2 input page must never render hardcoded fallback stats or a pre-validation area as if they were resolved data
- [005-boardroom-desktop-mode-selector](application/005-boardroom-desktop-mode-selector.md) — Desktop mode selector uses a list + detail-panel pattern sourced from MODE_CONFIG, not a separate hardcoded array or a literal copy of the mobile accordion
- [006-monitor-de-agentes-and-empty-state-copy](application/006-monitor-de-agentes-and-empty-state-copy.md) — Monitor de Agentes only renders once a simulation has started; Live Logs shows real activation timestamps, not the render-time clock; empty-state copy states the no-fabricated-data policy instead of apologizing
- [007-light-mode-color-system](application/007-light-mode-color-system.md) — Light-theme color tokens (neutral tiers and per-mode brand colors) calibrated against real WCAG contrast math; every consumer reads a named token, never a hardcoded hex/opacity value

## governance

Decisões sobre a estrutura e composição da governança ARGUS.

- [001-galera-do-design](governance/001-galera-do-design.md) — Inclusão da Galera do Design (Canvas · Forge · Quill) na governança ARGUS v1.2.0

## platform

Platform-level runtime and enabling capabilities.

- [001-cloud-stack](platform/001-cloud-stack.md) — Cloud stack selection: Vite/React/Express/Firebase/Gemini/Stripe/Cloud Run
