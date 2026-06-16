# _local ADRs Index

Architectural and technical decisions for EAI?.

## application

System and service design decisions.

- [001-simulation-pipeline](application/001-simulation-pipeline.md) — How the five simulation modes and the agent resolution pipeline are structured
- [002-sse-streaming](application/002-sse-streaming.md) — Server-Sent Events for streaming real-time simulation progress to the client
- [003-mode4-production-incident-2026-06](application/003-mode4-production-incident-2026-06.md) — Complete incident record: Mode 4 bugs, root causes, fixes, false positives, canonical patterns and lessons learned (June 2026)
- [004-liquid-glass-rollout](application/004-liquid-glass-rollout.md) — Adopts the Liquid Glass visual language incrementally, staging-gated, reconciled with the real simulation pipeline, SSE streaming, and LGPD anonymization rules

**Plans**
- [001-liquid-glass-rollout](application/plans/001-liquid-glass-rollout.md) — Phase-by-phase execution plan for the Liquid Glass rollout (deleted after full implementation)

## governance

Decisões sobre a estrutura e composição da governança ARGUS.

- [001-galera-do-design](governance/001-galera-do-design.md) — Inclusão da Galera do Design (Canvas · Forge · Quill) na governança ARGUS v1.2.0

## platform

Platform-level runtime and enabling capabilities.

- [001-cloud-stack](platform/001-cloud-stack.md) — Cloud stack selection: Vite/React/Express/Firebase/Gemini/Stripe/Cloud Run
