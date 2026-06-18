---
name: _local-edr-policy-009-rollback-checkpoint-procedure
description: Defines a chat-only rollback procedure for the development branch — the user may request a revert to a named checkpoint commit without terminal or git access, and Claude/ARGUS executes it directly. Use when starting a risky multi-step change (e.g. Fase 2 rename) and a safe return point is needed.
apply-to: Development branch claude/brave-hypatia-ksnu9o only. Does not apply to main or production.
valid-from: 2026-06-18
---

# _local-edr-policy-009: Rollback checkpoint procedure

## Context and Problem Statement

Before starting a risky multi-step change (Fase 2 — rename of `lexforum-ai-studio/`),
the user needs a guaranteed way back to a known-good state, requested purely in
natural language, including from a session with no terminal or git access.

Question: How does the user trigger an immediate rollback of the development branch
without touching git themselves, and what is Claude/ARGUS authorized to do on that request?

## Decision Outcome

**A named checkpoint commit plus standing authorization for Claude/ARGUS to execute the revert on request**

The current checkpoint is commit `7c08d8e8df179efac97d7747c8950c2d70a9b608` on branch
`claude/brave-hypatia-ksnu9o` (Fase 1 rebranding complete, 144/144 tests passing).
When the user asks to roll back to this checkpoint — using any clear phrasing such as
"volta para o checkpoint", "desfaz tudo", "reverte para antes da fase 2" — Claude/ARGUS
must execute the revert itself, without requiring the user to provide commands.

### Details

- This policy authorizes `git reset --hard <checkpoint-hash>` followed by
  `git push origin claude/brave-hypatia-ksnu9o --force` (or `--force-with-lease` when
  safe) as a standing, pre-approved action, scoped only to the branch named above.
- This authorization never extends to `main` or any production-deployed branch.
  Production rollback continues to follow `_local-edr-policy-008-deployment-strategy`
  (revert commit + push to `main`).
- Every time this procedure is executed, Claude/ARGUS must state in the response which
  commit was restored and confirm the remote branch now matches it. Execution must never
  be silent, even though no per-action confirmation question is required.
- This policy must be updated (new checkpoint hash) whenever the user validates a new
  safe state worth protecting — e.g. after Fase 2 lands and is confirmed stable in
  staging. The previous hash remains valid in git history regardless.
- If the working tree has uncommitted changes at the time of the request, Claude/ARGUS
  must flag this before discarding them, since `git reset --hard` is destructive to
  anything not committed.

## Conflicts

None. This policy narrows authority to a single non-production branch and does not
override `_local-edr-policy-008-deployment-strategy`.

## References

- [_local-edr-policy-008 - Deployment strategy](001-deployment-strategy.md)
