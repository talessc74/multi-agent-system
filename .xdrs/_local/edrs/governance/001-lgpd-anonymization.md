---
name: _local-edr-policy-004-lgpd-anonymization
description: Defines LGPD compliance requirements for data persistence in EAI?. Use when implementing any feature that stores or logs user-submitted case data.
apply-to: Data persistence — server.ts save functions, Firestore writes, simulation history
valid-from: 2026-06-13
---

# _local-edr-policy-004: LGPD Anonymization

## Context and Problem Statement

EAI? processes legal cases that may contain sensitive personal data (names, CPF, contract
details, medical records, employment data). This data is submitted by users for simulation
purposes. Under Brazil's LGPD, what obligations apply before persisting this data?

## Decision Outcome

**All user-submitted case data must be anonymized before any persistence to Firestore**

### Details

- Case descriptions, defense descriptions, and attachments must pass through the anonymizer
  (`anonymizer.ts`) before being saved to Firestore simulation history.
- The anonymizer removes or replaces: names, CPF/CNPJ, addresses, phone numbers, and
  other personal identifiers defined by LGPD as sensitive data.
- Anonymized data only — raw user text must never be stored in Firestore.
- Gemini calls during simulation use the original (non-anonymized) text — these calls
  are transient and not persisted.

#### Access Logging

- Every time a simulation report (laudo) is accessed, the field `laudoAcessadoEm`
  must be updated in the Firestore simulation record with the current timestamp.
- This access log is a LGPD compliance requirement and must never be removed.

#### Secondary Operations Isolation

- Saving the simulation to Firestore, loading history, and updating stats are each
  isolated in their own try-catch.
- A failure in any of these secondary operations must never revert the result screen
  or prevent the user from seeing their simulation report.
- Pattern: set `step: 'result'` first, then attempt all secondary writes independently.

#### Terms of Use

- Users must accept Terms of Use v1.2 (or later) before accessing simulation features.
- The acceptance timestamp must be recorded in Firestore.
