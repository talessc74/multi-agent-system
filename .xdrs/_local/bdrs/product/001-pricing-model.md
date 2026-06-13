---
name: _local-bdr-policy-002-pricing-model
description: Defines the pricing tiers for EAI? simulation modes and chat. Use when implementing payment flows, displaying prices, or evaluating new features.
apply-to: Paywall — stripe.server.ts, App.tsx checkout flows
valid-from: 2026-06-13
---

# _local-bdr-policy-002: Pricing Model

## Context and Problem Statement

EAI? monetizes through per-simulation purchases and post-session chat. What are the
canonical prices for each product?

## Decision Outcome

**Three-tier pricing based on simulation complexity**

| Product | Price (BRL) |
|---------|-------------|
| Simulation — Modes 1, 2, 4 | R$ 9,90 |
| Simulation — Modes 3, 5 | R$ 5,90 |
| Post-session chat (5 questions) | R$ 2,99 |

### Details

- Modes 1, 2, and 4 are priced higher because they involve iterative AI improvement
  across up to 3 rounds with multiple Gemini calls per round.
- Modes 3 and 5 are single-round evaluations requiring fewer AI calls.
- Chat is sold in packs of 5 questions, not per message.
- Prices are in Brazilian Real (BRL) and must be updated via a new BDR deliberation
  if changed — they must not be silently modified in code.
- Stripe operates in live mode on production and test mode on staging.
