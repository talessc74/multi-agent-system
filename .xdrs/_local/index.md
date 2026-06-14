# _local Scope Overview

## Overview

Project-local decisions for EAI? (Escritorio de Advocacia Inteligente — eaijuridico.com.br).
All policies in this scope were produced by ARGUS deliberation, structured by SCRIBE,
timestamped by HERALD, and validated by the project owner before archiving.

This scope stays in this workspace only and is never distributed to other contexts.
Decisions here override all other scopes.

## Project Context

EAI? is a legal simulation SaaS with five simulation modes, operating under:
- Stack: Vite 6 + React 19 + Express 4 + Firebase Auth + Firestore + Gemini 2.5 Flash + Stripe + Cloud Run
- Production: eaijuridico.com.br (GCP gen-lang-client-0982741688)
- Staging: eai.radiokactus.com (GCP gen-lang-client-0783740660)
- Deploy: git push to main triggers Cloud Build which deploys to Cloud Run automatically

## How to add a policy

1. Trigger an ARGUS deliberation on the topic
2. Reach convergence with seed signatures
3. SCRIBE structures the document — HERALD defines valid-from
4. Human validates the draft
5. Policy is saved under the appropriate type and subject below

## Type Indexes

- [ADRs Index](adrs/index.md) — Architectural and technical decisions
- [BDRs Index](bdrs/index.md) — Business process and strategy decisions
- [EDRs Index](edrs/index.md) — Engineering workflow and tooling decisions
