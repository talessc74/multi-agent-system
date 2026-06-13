---
name: _local-adr-policy-002-cloud-stack
description: Defines the full technology stack for EAI?. Use when evaluating infrastructure decisions, adding dependencies, or onboarding new contributors.
apply-to: All layers — frontend, backend, infra, AI
valid-from: 2026-06-13
---

# _local-adr-policy-002: Cloud Stack

## Context and Problem Statement

EAI? is a legal simulation SaaS that requires real-time AI output streaming, authentication,
payment processing, and LGPD-compliant data persistence. Which technologies form the
production stack?

## Decision Outcome

**Vite + React + Express + Firebase + Gemini + Stripe + Cloud Run**

A monorepo where frontend and backend coexist under `lexforum-ai-studio/`, deployed as a
single container on Cloud Run with automatic deploy on push to main.

### Details

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Vite 6 + React 19 | SPA with SSR-friendly structure |
| Backend | Express 4 | API server bundled with the frontend |
| AI | Gemini 2.5 Flash | All simulation and agent generation calls |
| Auth | Firebase Auth | Email/password and social login |
| Database | Firestore | Agent shelf, simulation history, user data |
| Payments | Stripe | Checkout sessions; live mode in production, test in staging |
| Hosting | Cloud Run | Containerized, auto-scales to zero |
| CI/CD | Cloud Build | Triggered on push to main branch |
| AI Streaming | SSE (Server-Sent Events) | Progress events from server to client; Safari mobile retry handled |

#### Environments

| Environment | URL | GCP Project | Cloud Run | Stripe | Gemini Key |
|-------------|-----|-------------|-----------|--------|------------|
| Production | eaijuridico.com.br | gen-lang-client-0982741688 | eai-producao | live | eai-producao |
| Staging | eai.radiokactus.com | gen-lang-client-0783740660 | eai-staging | test | VnFQ (LexForum) |

#### Monorepo Structure

All frontend and backend code lives under `lexforum-ai-studio/`. A single `Dockerfile`
builds and serves both. There is no separate frontend deployment.

#### AI Model Policy

The Gemini model identifier is pinned to `gemini-2.5-flash` and must not be changed
without a new ADR deliberation.
