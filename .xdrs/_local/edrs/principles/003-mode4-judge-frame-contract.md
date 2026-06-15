---
name: _local-edr-policy-003-mode4-judge-frame-contract
description: Defines the mandatory judge prompt frame for Mode 4 (Mesa Dupla Assistida) split by the user's chosen side. Use whenever modifying the judge agent call in gemini.server.ts or any Mode 4 evaluation logic.
apply-to: gemini.server.ts — Mode 4 judge prompt (variable juiPrompt)
valid-from: 2026-06-15
---

# _local-edr-policy-003: Mode 4 Judge Frame Contract

## Context and Problem Statement

Mode 4 (Mesa Dupla Assistida) allows the user to choose their side (Autor or Réu) and
receive AI assistance improving their chosen argument across up to 3 rounds. The judge
evaluates both sides after each round of improvement.

The quality asymmetry between the two sides depends on which side the user chose:

- `userSide === 'AUTHOR'`: AI-improved petition vs user-written static defense
- `userSide === 'DEFENSE'`: user-written static author petition vs AI-improved defense

A single bilateral judge frame ("who wins between these two arguments?") was originally
used for both cases. This caused a 75-point run-to-run variance when `userSide === 'DEFENSE'`.

### Root Cause of Variance

Static author petitions are written in natural claim language — emotionally compelling to
language models because this pattern dominates LLM training data. An AI-improved defense
is technically superior but uses more structured legal reasoning.

When the judge is asked to "declare the bilateral winner" between these two, the model
activates one of two interpretation frames non-deterministically:

- **Frame A** (claim-sympathetic): compelling author language → author probability high (~85%)
- **Frame B** (defense-quality): technically superior defense → author probability low (~15%)

The same case, same side, same inputs could produce 5% or 95% on consecutive runs.

`userSide === 'AUTHOR'` is consistently stable because an AI-improved petition vs a
static defense always maintains a clear quality gap in the same direction. No ambiguity
for the model to resolve.

## Decision Outcome

**Split the judge prompt by `userSide`. Each frame anchors an unambiguous evaluation task.**

### AUTHOR Frame

Use when `userSide === 'AUTHOR'` (or `userSide` is absent — default).

```
Você é um magistrado imparcial. Analise ambos os lados e emita um veredito técnico fundamentado.

PETIÇÃO DO AUTOR:
{authorText}

CONTESTAÇÃO DO RÉU:
{defenseText}

Retorne JSON:
{"success_probability":<0-100, probabilidade de êxito do AUTOR>,
 "author_summary":"<resumo do argumento do Autor>",
 "defense_summary":"<resumo do argumento do Réu>",
 "judgment":"<veredito técnico completo — campo obrigatório, nunca vazio>"}
```

Bilateral frame — judge declares relative winner. Stable because the quality gap
(AI-improved petition vs static defense) consistently favors the author side.

### DEFENSE Frame

Use when `userSide === 'DEFENSE'`.

```
Você é um magistrado avaliando a solidez técnica dos argumentos da DEFESA/RÉU.

PETIÇÃO DO AUTOR (contexto — argumento sendo contestado):
{authorText}

CONTESTAÇÃO DA DEFESA (avalie a eficácia deste argumento):
{defenseText}

Avalie tecnicamente a solidez dos argumentos da DEFESA diante da petição apresentada.
Retorne JSON:
{"success_probability":<0-100, probabilidade de êxito do AUTOR — valor BAIXO indica defesa eficaz>,
 "author_summary":"<resumo do argumento do Autor>",
 "defense_summary":"<resumo do argumento do Réu>",
 "judgment":"<veredito técnico completo — campo obrigatório, nunca vazio>"}
```

Defense-quality frame — judge evaluates how effective the defense is against the claim,
not "who wins" between two peers. Same stable evaluation approach used by Mode 2
(Defesa Assistida). Eliminates interpretation oscillation.

### Invariant Preserved

`success_probability` always represents the AUTHOR's probability of winning (EDR-001
contract). A low value means the defense was effective — it does NOT mean the defense's
probability is low. The display layer inverts for RÉU users:

```typescript
const displayPct = (selectedMode === 4 && effectiveSide === 'DEFENSE')
  ? 100 - success_probability
  : success_probability;
```

### Judge Agent Impartiality

The frame change is applied at inference time (prompt context), NOT at agent creation
time. The judge agent is always created impartially by the Shaw→Especialista pipeline
(EDR-003 — judge impartiality in creation remains fully compliant). The prompt frame
directs what the agent evaluates, not who the agent is.

## Implementation Location

`lexforum-ai-studio/src/lib/gemini.server.ts` — Mode 4 simulation loop, judge agent call.

```typescript
const juiPrompt = userSide === 'DEFENSE'
  ? `Você é um magistrado avaliando a solidez técnica dos argumentos da DEFESA/RÉU...`
  : `Você é um magistrado imparcial. Analise ambos os lados...`;
```

## Judgment Extraction Fallback

The judge occasionally returns a valid `success_probability` without a populated
`judgment` field. The extraction chain handles this:

```typescript
const rawJudgment = (juiParsed.judgment as string | undefined)?.trim() ?? '';
if (rawJudgment) {
  currentJudgment = rawJudgment;
} else {
  const authorPart = juiParsed.author_summary ? `AUTOR: ${juiParsed.author_summary}` : '';
  const defensePart = juiParsed.defense_summary ? `\nDEFESA: ${juiParsed.defense_summary}` : '';
  currentJudgment = (authorPart + defensePart).trim()
    || 'A análise técnica foi processada pelo Magistrado com base nos argumentos apresentados.';
}
```

This fallback does not affect `success_probability` extraction — probability is always
extracted regardless of whether `judgment` is present. `bestRound` selection (lowest
author probability for DEFENSE; highest for AUTHOR) uses the probability, not the
judgment text, so a round with an empty judgment can still be the best round.

## Fix History

- Variance diagnosed: 2026-06-14 (production evidence: produção_6.pdf vs run2 of same case — 75-point swing)
- Fix applied: 2026-06-14 — branch `claude/mode-2-stuck-50-percent-ln3idh`
- Production validation: produção_7.pdf — RÉU 85%, consistent defense trajectory across 3 rounds
- Tests: 4 contract tests in `mode4Simulation.test.ts` verify both frames semantics and EDR-001 compliance
