# _local ADRs Index

Architectural and technical decisions for this project, created through ARGUS deliberation.

## Subjects

- `principles` — Cross-cutting architecture and policy foundations
- `application` — System and service design decisions
- `data` — Data architecture and information modeling
- `integration` — Communication between internal/external systems
- `platform` — Platform-level runtime and enabling capabilities
- `controls` — Architecture controls for risk, security, and compliance
- `operations` — Operational architecture decisions

## Active Decisions

### principles

| ID | Title | Status | valid-from |
|----|-------|--------|------------|
| [adr-local-001](principles/adr-local-001.md) | Stack Tecnológico Principal — Vite + React + Express + Firebase + Gemini + Cloud Run | active | 2026-06-10 |

### application

| ID | Title | Status | valid-from |
|----|-------|--------|------------|
| [adr-local-002](application/adr-local-002.md) | Arquitetura Multi-Agente com Resolução Dinâmica por Área Jurídica | active | 2026-06-10 |

### data

| ID | Title | Status | valid-from |
|----|-------|--------|------------|
| [adr-local-004](data/adr-local-004.md) | Anonimização Automática de Dados Jurídicos Antes do Armazenamento | active | 2026-06-10 |

### integration

| ID | Title | Status | valid-from |
|----|-------|--------|------------|
| [adr-local-005](integration/adr-local-005.md) | Stripe como Única Camada de Pagamento — Webhook Server-Only e Firestore via Admin SDK | active | 2026-06-10 |

### controls

| ID | Title | Status | valid-from |
|----|-------|--------|------------|
| [adr-local-003](controls/adr-local-003.md) | Zero Trust em Firestore — Rules como Única Linha de Defesa do Lado do Cliente | active | 2026-06-10 |
