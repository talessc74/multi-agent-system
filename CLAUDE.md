# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a JSON-based multi-agent system with no executable code, build system, or tests. All artifacts are JSON configuration files and Markdown prompts consumed directly by AI platforms (Claude, Gemini, Copilot).

Two core agents drive the system:

- **Especialista** (`config/especialista.json`) — Auditor Kern 0xF1, a senior AI agent architect. Receives user intent (with or without a seed) and produces a structured agent JSON file.
- **Semente de Shaw** (`config/semente.json`) — SHAW_ARCHITECT_GENERATOR, a real-time web researcher that distills public knowledge from a person or domain into a reusable seed JSON.

## Main Workflow

**Step 1 — Create a seed** (optional)
Activate Semente de Shaw with a prompt from `prompts/ativar_semente.md`, get back a seed JSON, save it to `seeds/[name]_v1.0.json`, and update `seeds/SEEDS_REGISTRY.json`.

**Step 2 — Create an agent**
Activate Especialista with a prompt from `prompts/ativar_especialista.md` (optionally including a seed JSON), get back an agent JSON, save it to `agents/[name]_v1.0.json`, and update `agents/AGENTS_REGISTRY.json`.

**Step 3 — Use the agent**
Copy the agent JSON into Claude, Gemini, or Copilot as a system prompt.

## JSON Structure Rules

### Seed files (`seeds/`) — required fields
`seed_id`, `seed_version`, `seed_date`, `referencia_fonte`, `kernel_logic`, `decision_gates`, `vocabulary_filter`, `semantic_anchor`

### Agent files (`agents/`) — required blocks
`logicaArquivos`, `logicaInterpretacao`, `instrucoesEspecificas`, `diretrizesEticas`, `versao`

The `logicaDatas` block is **exclusive to the Especialista** and must never appear in generated agent files.

## Versioning

File naming: `[name]_v[major].[minor].json`
- `minor` (+0.1): behavioral refinement, small corrections
- `major` (+1.0): new base seed or change of agent objective

Every agent JSON must include `seed_utilizada`, `data_criacao`, and `gerado_por` for traceability.

Both `SEEDS_REGISTRY.json` and `AGENTS_REGISTRY.json` must be updated whenever a new seed or agent is added.

## Commit Convention

```
[SEMENTE] name_seed v1.0 criada
[AGENTE]  name_agent v1.0 gerado
[CONFIG]  adjustment in Especialista/Semente
[DOCS]    documentation update
[FIX]     structural correction
```

All changes must be recorded in `versions/CHANGELOG.md`.

## Ethics & Security

The Especialista enforces Project Zero Mindset (Kern 0xF1). When working with agent JSONs:
- `diretrizesEticas` must contain at least 3 clear directives per block — never compress or omit it.
- If a request would bypass security blocks, the Especialista triggers `[ALERTA DE ESTRUTURA INCOMPLETA]`.
- Privacy by Design and LGPD compliance are mandatory.
