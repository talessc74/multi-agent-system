---
name: _local-edr-policy-devops-002-production-deploy-authorization
description: Defines whether the AI agent must ask for per-instance confirmation before triggering the production deploy workflow. Use before triggering deploy-producao.yml, or when deciding whether a tested/validated main commit should go live.
apply-to: The GitHub Actions workflow deploy-producao.yml (workflow_dispatch on ref main), triggered by an AI agent working on this repository
valid-from: 2026-09-11
---

# _local-edr-policy-devops-002: Production Deploy Authorization

## Context and Problem Statement

EAI? is a live, paid product. `deploy-producao.yml` is a manual `workflow_dispatch`
job — it never fires on its own. Must the AI agent ask the user for confirmation
before triggering it each time, or does the user grant standing authorization to
trigger it automatically once a commit/merge to `main` is tested and validated?

## Decision Outcome

**Standing authorization — no per-instance confirmation required.**
The user (talessc@mac.com) authorizes the agent to trigger `deploy-producao.yml`
immediately after a tested/validated commit or merge to `main`, without asking first.

### Details

- Trigger condition: a commit/merge has landed on `main` and has already been
  tested and validated (build passes, tests pass, and the change was reviewed).
- Once that condition holds, the agent must dispatch `deploy-producao.yml`
  (`workflow_dispatch`, ref `main`) without asking "posso disparar o deploy?" —
  that question is considered pre-answered by this policy.
- After dispatching, the agent must monitor the run until it reaches a terminal
  state (`completed`) and report the result (success/failure) to the user.
- On failure, the agent must report the failure with enough detail to act on it
  (failed step, logs) rather than silently retrying or hiding the outcome.
- This authorization covers only triggering the existing `deploy-producao.yml`
  workflow. It does NOT extend to:
  - pushing commits to `main` itself — that remains the user's own decision,
    per `_local-edr-policy-002-commit-strategy` and the user's explicit
    standing instruction that going to `main` is "uma pergunta para mim";
  - modifying the deploy workflow, Cloud Build config, or infrastructure;
  - any deploy path other than the one verified in this repository.

## Conflicts

- `_local-edr-policy-008-deployment-strategy` (`devops/001`) and
  `_local-adr-policy-008-rollout-path-for-the-v5-redesign`'s Conflicts section
  both note that some sources describe production as auto-deploying on every
  push to `main` via Cloud Build, while the only production-deploy mechanism
  verified in this repository is the manual `workflow_dispatch` workflow this
  policy governs. This EDR does not resolve that discrepancy — it only defines
  the agent's behavior for the verified GitHub Actions path. If Cloud Build is
  confirmed to also auto-deploy on push, `devops/001` should be revisited.
- A prior, non-standard "Deploy automático em produção" clause lived directly
  in `CLAUDE.md` and was removed when `argus-xdrs-governance` was updated to
  1.5.1 (that clause was never part of the upstream package template). This
  policy is the project-owned replacement, recorded where the project actually
  owns its decisions (`.xdrs/_local/`) instead of in an externally-managed file.

## References

- [devops/001 - deployment strategy](001-deployment-strategy.md)
- [principles/002 - commit strategy](../principles/002-commit-strategy.md)
- [adrs/application/008 - v5 redesign rollout path](../../adrs/application/008-v5-redesign-rollout-path.md)
