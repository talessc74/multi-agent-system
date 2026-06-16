---
name: _local-edr-policy-008-deployment-strategy
description: Defines the deployment pipeline for EAI?. Use when setting up CI/CD, debugging deploy failures, or evaluating infrastructure changes.
apply-to: Cloud Build configuration — cloudbuild.yaml, cloudbuild-staging.yaml
valid-from: 2026-06-13
---

# _local-edr-policy-003: Deployment Strategy

## Context and Problem Statement

EAI? requires frequent iteration with minimal manual intervention between code change
and production availability. How is deployment automated?

## Decision Outcome

**Push to main triggers Cloud Build which deploys automatically to Cloud Run**

### Details

| Action | Trigger | Target |
|--------|---------|--------|
| `git push` to `main` | Cloud Build (production) | Cloud Run `eai-producao` |
| `git push` to staging branch | Cloud Build (staging) | Cloud Run `eai-staging` |

#### Production

- GCP Project: `gen-lang-client-0982741688`
- Cloud Run service: `eai-producao`
- Config: `cloudbuild.yaml`
- Deploy is fully automatic — no manual step required after push

#### Staging

- GCP Project: `gen-lang-client-0783740660`
- Cloud Run service: `eai-staging`
- Config: `cloudbuild-staging.yaml` / `cloudbuild.staging.yaml`
- Stripe in test mode; Gemini key: `VnFQ` (LexForum project)

#### Constraints

- Never push directly to main without understanding what will deploy.
- Rollback is done by reverting the commit and pushing to main — Cloud Build re-deploys automatically.
- Both environments share the same codebase; environment differences are handled via
  environment variables injected by Cloud Run at runtime.
