# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains two distinct components:

1. **Multi-Agent System** — JSON-based, no executable code. All artifacts are configuration files and Markdown prompts consumed by AI platforms (Claude, Gemini, Copilot).
2. **LexForum App** (`lexforum-app/`) — Next.js 16 web application, deployed at [lexforum.radiokactus.com](https://lexforum.radiokactus.com) via Vercel.

**Current scale (v3.4.0):** 13 seeds · 11 generated agents · 2 core config agents · 1 advisory board framework · 1 web application

Three layers make up the multi-agent system:

- **Especialista** (`config/especialista.json`) — Auditor Kern 0xF1, a senior AI agent architect. Receives user intent (with or without a seed) and produces a structured agent JSON file.
- **Semente de Shaw** (`config/semente.json`) — SHAW_ARCHITECT_GENERATOR, a real-time web researcher that distills public knowledge from a person or domain into a reusable seed JSON.
- **Generated agents** (`agents/`) — 11 domain-specific agents created by the Especialista from seeds. See `agents/AGENTS_REGISTRY.json` for the full index.

## Domain Clusters

Agents are organized into five functional clusters:

| Cluster | Seeds | Agents |
|---|---|---|
| IA & Tech | SEED_AI_001, SEED_ENG_001, SEED_SYS_001 | consultor_ia, agente_claude_code_expert, revisor_sistema |
| Produto & UX | SEED_PM_001, SEED_UX_001 | arquiteto_produto, ux_validator |
| Jurídico Consumerista | SEED_JUR_001, SEED_JUR_002, SEED_JUR_003 | advogado_consumerista, juiz_jec, juiz_everton, juiza_rosemarie |
| Jurídico Trabalhista | SEED_JUR_004 | advogado_mannrich |
| Advisory Board | SEED_ADV_001 (Vic), SEED_ADV_002 (Eston), SEED_ADV_003 (Cresh), SEED_UX_001 (Ux), SEED_ADV_004 (Justin), SEED_ARCH_001 (Arch) | conselho_consultivo_lexforum |

## Web Application — LexForum

`lexforum-app/` is a standalone Next.js 16 application housed inside this monorepo. It is developed and deployed independently from the multi-agent system.

| Property | Value |
|---|---|
| Framework | Next.js 16 + React 18 |
| Styling | Tailwind CSS 3 |
| Language | TypeScript 5 (strict mode) |
| Deploy | Vercel — `lexforum.radiokactus.com` |
| Entry point | `lexforum-app/src/app/page.tsx` |
| Design system | Navy/ciano palette defined in `tailwind.config.ts` |

**Working inside `lexforum-app/`:**
- Run `npm run dev` from `lexforum-app/` to start the dev server.
- The `.next/` build folder and `node_modules/` are git-ignored.
- Commit convention for app changes: use `[FEAT]`, `[FIX]`, `[DOCS]`, `[STYLE]` prefixed with `LexForum —` (e.g. `[FEAT] LexForum — homepage aprovada`).

## Main Workflow

**Step 1 — Create a seed** (optional)
Activate Semente de Shaw with a prompt from `prompts/ativar_semente.md`, get back a seed JSON, save it to `seeds/[name]_v1.0.json`, and update `seeds/SEEDS_REGISTRY.json`.

**Step 2 — Create an agent**
Activate Especialista with a prompt from `prompts/ativar_especialista.md` (optionally including a seed JSON), get back an agent JSON, save it to `agents/[name]_v1.0.json`, and update `agents/AGENTS_REGISTRY.json`.

**Step 3 — Use the agent**
Copy the agent JSON into Claude, Gemini, or Copilot as a system prompt.

**Step 4 — Periodic review** (recommended every 5+ new agents)
Activate the `revisor_sistema_v1.0` agent to audit registry consistency, role overlaps, CLAUDE.md accuracy and accumulated technical debt. Output: `versions/HEALTH_REPORT_vX.Y.Z.md`.

## JSON Structure Rules

### Seed files (`seeds/`) — required fields (standard seeds)
`seed_id`, `seed_version`, `seed_date`, `referencia_fonte`, `kernel_logic`, `decision_gates`, `vocabulary_filter`, `semantic_anchor`

### Seed files (`seeds/`) — additional fields for jurisprudential seeds
Jurisprudential seeds (`seed_tipo: "jurisprudencial"`) replace `kernel_logic` with `kernel_jurisprudencial` and add:
`seed_tipo`, `kernel_jurisprudencial`, `decisoes_reais_analisadas`, `padroes_identificados`

### Agent files (`agents/`) — required blocks
`logicaArquivos`, `logicaInterpretacao`, `instrucoesEspecificas`, `diretrizesEticas`, `versao`

The `logicaDatas` block is **exclusive to the Especialista** and must never appear in generated agent files.

### Structural conformance
All agents in `agents/` follow the same field schema. The legacy anomaly in `agente_claude_code_expert_v1.0` (non-standard `semente_origem`, `BORIS_CHERNY_LEGACY_KERNEL`, extra blocks `logicaDatas` and `referencias_semente`) was corrected in v3.1.1.

## Versioning

File naming: `[name]_v[major].[minor].json`
- `minor` (+0.1): behavioral refinement, small corrections
- `major` (+1.0): new base seed or change of agent objective

Every agent JSON must include `seed_utilizada`, `data_criacao`, and `gerado_por` for traceability.

Both `SEEDS_REGISTRY.json` and `AGENTS_REGISTRY.json` must be updated whenever a new seed or agent is added. **Always verify that `total_sementes` and `total_agentes` counters are correct** — mismatches are a known failure mode.

## Commit Convention

```
[SEMENTE] name_seed v1.0 criada
[AGENTE]  name_agent v1.0 gerado
[CONFIG]  adjustment in Especialista/Semente
[DOCS]    documentation update
[FIX]     structural correction
[REVISAO] system health review and audit
```

All changes must be recorded in `versions/CHANGELOG.md`.

## Ethics & Security

The Especialista enforces Project Zero Mindset (Kern 0xF1). When working with agent JSONs:
- `diretrizesEticas` must contain at least 3 clear directives per block — never compress or omit it.
- If a request would bypass security blocks, the Especialista triggers `[ALERTA DE ESTRUTURA INCOMPLETA]`.
- Privacy by Design and LGPD compliance are mandatory.
