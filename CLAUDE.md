# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a JSON-based multi-agent system with no executable code, build system, or tests. All artifacts are JSON configuration files and Markdown prompts consumed directly by AI platforms (Claude, Gemini, Copilot).

**Current scale (v3.1.0):** 9 seeds · 10 generated agents · 2 core config agents

Three layers make up the system:

- **Especialista** (`config/especialista.json`) — Auditor Kern 0xF1, a senior AI agent architect. Receives user intent (with or without a seed) and produces a structured agent JSON file.
- **Semente de Shaw** (`config/semente.json`) — SHAW_ARCHITECT_GENERATOR, a real-time web researcher that distills public knowledge from a person or domain into a reusable seed JSON.
- **Generated agents** (`agents/`) — 10 domain-specific agents created by the Especialista from seeds. See `agents/AGENTS_REGISTRY.json` for the full index.

## Domain Clusters

Agents are organized into five functional clusters:

| Cluster | Seeds | Agents |
|---|---|---|
| IA & Tech | andrew_ng, boris_cherny, yoav_shoham | consultor_ia, agente_claude_code_expert, revisor_sistema |
| Produto & UX | marty_cagan, jared_spool | arquiteto_produto, ux_validator |
| Jurídico Consumerista | claudia_lima_marques, everton_goncalves_dutra, rosemarie_diedrichs_pimpao | advogado_consumerista, juiz_jec, juiz_everton, juiza_rosemarie |
| Jurídico Trabalhista | nelson_mannrich | advogado_mannrich |

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

### Known structural anomaly
`agente_claude_code_expert_v1.0` is a legacy agent that predates field standardization. It uses `semente_origem` instead of `seed_utilizada` and `BORIS_CHERNY_LEGACY_KERNEL` instead of `SHAW_AUDITOR_KERN_0XF1`. This deviation is documented and tracked — do not treat as a model for new agents.

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
