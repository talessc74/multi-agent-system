# _local EDRs Index

Engineering workflow and implementation decisions for EAI?.

## principles

Engineering principles and non-functional quality defaults.

- [001-success-probability-interpretation](principles/001-success-probability-interpretation.md) — `success_probability` always represents the author's chance of winning (0-100)
- [002-commit-strategy](principles/002-commit-strategy.md) — Atomic commits: one task per commit, read git log before starting

## devops

Delivery pipeline and release automation decisions.

- [001-deployment-strategy](devops/001-deployment-strategy.md) — Auto-deploy to Cloud Run on push to main via Cloud Build

## governance

Engineering governance and compliance mechanics.

- [001-lgpd-anonymization](governance/001-lgpd-anonymization.md) — LGPD: anonymize all user data before persisting to Firestore
