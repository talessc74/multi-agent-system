---
name: _local-edr-policy-002-commit-strategy
description: Defines the git commit discipline for EAI?. Use before every commit or when reviewing AI-generated changes.
apply-to: All contributors and AI agents working on this repository
valid-from: 2026-06-13
---

# _local-edr-policy-002: Commit Strategy

## Context and Problem Statement

EAI? is a production system where bad commits directly affect paying users via auto-deploy.
Compound commits make debugging hard and rollbacks risky. What commit discipline must be
followed?

## Decision Outcome

**Atomic commits — one task per commit, always read git log before starting**

### Details

- Every commit must represent exactly one logical task or fix.
- Before any task, run `git log --oneline -3` to understand the current branch state.
- Commit messages must describe the intent, not just the change.
- Use the format: `type(scope): description` — e.g. `fix(mode4): advogado melhora sobre petição anterior`
- Never bundle unrelated changes in a single commit.
- Never commit without understanding the full context of what is being changed.
- AI agents working on this repo must follow this policy and must not create compound commits.
