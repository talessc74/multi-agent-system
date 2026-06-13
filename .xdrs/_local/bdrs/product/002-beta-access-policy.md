---
name: _local-bdr-policy-003-beta-access-policy
description: Defines how beta users bypass the paywall. Use when implementing access control checks or evaluating new feature gating.
apply-to: Paywall logic — App.tsx, stripe.server.ts, Firebase Auth user records
valid-from: 2026-06-13
---

# _local-bdr-policy-003: Beta Access Policy

## Context and Problem Statement

EAI? is in early access. Certain users (testers, partners, internal team) need full access
to all features without going through payment. How should this be handled?

## Decision Outcome

**Firestore `accessLevel='beta'` field bypasses paywall for all features**

Users whose Firestore user record contains `accessLevel: 'beta'` get unrestricted access
to all simulation modes and post-session chat without payment.

### Details

- The `accessLevel` field is stored in the Firestore `users/` collection under the user's UID.
- Beta access applies to: all simulation modes (1-5) and post-session chat.
- Beta status is granted manually by the project owner directly in Firestore.
- There is no self-service beta signup; all beta users are explicitly provisioned.
- Beta access does not expire automatically — removal requires manual update in Firestore.
- This policy must be re-evaluated before any public launch milestone.
