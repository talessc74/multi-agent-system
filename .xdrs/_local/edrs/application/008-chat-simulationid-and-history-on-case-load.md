---
name: _local-edr-policy-012-chat-simulationid-and-history-on-case-load
description: Requires any code path that loads a persisted simulation into state (loadSimulation and equivalents) to set simulationId from the source document and reset per-case chat state, and requires handleOpenChat to always refetch chat history from Firestore on open rather than reuse in-memory chatMessages. Use when adding a new entry point that loads a saved simulation (history, shared link, admin tools) or touching the Chat feature.
apply-to: lexforum-ai-studio/src/App.tsx — loadSimulation, handleOpenChat; lexforum-ai-studio/chat-handler.ts — new GET /api/chat/history/:simulationId; lexforum-ai-studio/src/services/chatService.ts — getChatHistory
valid-from: 2026-07-03
---

# _local-edr-policy-012: chat simulationId and history on case load

## Context and Problem Statement

The "Chat com os agentes" feature (5-round Q&A with the lawyer/judge agents,
`ChatPanel.tsx` + `chat-handler.ts`) already worked end-to-end right after a
live simulation finishes. The user reported it silently did nothing when a
case was opened from "Meus Casos" (the saved-simulations history modal).

Root cause: `loadSimulation()` (`App.tsx:699-721`) copies every field needed
to render the report — `caseDescription`, `report`, `simulation` — but never
copied `sim.id` into `state.simulationId`. `handleOpenChat` and
`handleSendChatMessage` both guard on `if (!state.simulationId) return;` and
fail silently. Since `sim.id` is already present on every object passed to
`loadSimulation` (`getUserSimulations`/`getSimulationById` in `dbService.ts`
both return `{ id: doc.id, ...data }`), this was a one-field omission, not a
missing capability — the chat backend (`chat-handler.ts`) is already fully
stateless and keyed only by `simulationId` in Firestore, so it works for a
case from five minutes ago or five weeks ago identically.

A worse variant: if the user ran a live simulation earlier in the same tab
session (leaving a stale `state.simulationId`) and then opened a different,
older case from "Meus Casos", the Chat button would silently attach new
questions to the *wrong* simulation's chat thread, since `simulationId` was
never overwritten.

While scoping the fix, a second, related question came up: chat messages are
already persisted per-simulation in Firestore
(`chats/{simulationId}/messages`), but nothing ever read them back — even in
the live flow, closing and reopening the chat panel (or returning to a case
later) showed an empty conversation, with only the "X/5 perguntas usadas"
counter hinting that a conversation happened. The user asked to close this
gap too: if a case was already chatted about, reopening Chat should show that
history; if not, it should show the questions still available.

## Decision Outcome

**`loadSimulation` sets `simulationId` from the source document and resets
all per-case chat state. `handleOpenChat` always refetches the real message
history from Firestore before opening the panel — it never reuses whatever
is currently in `chatMessages`.**

### Details

- `loadSimulation` now sets `simulationId: sim.id ?? null` in the same
  `setState` call, and separately resets `chatSheetState` to `'closed'`,
  `chatMessages` to `[]`, `chatQuestionsUsed` to `0`, `chatQuestionsLimit` to
  `5`, and `chatError` to `null`. This applies to both call sites that load a
  saved simulation: the "Meus Casos" click handler and the
  `?sim=<id>&chat=1` post-checkout redirect effect — both go through the same
  `loadSimulation` function, so both get the fix and the same clean-slate
  guarantee.
- New endpoint `GET /api/chat/history/:simulationId` (`chat-handler.ts`),
  same auth + ownership guard pattern as the existing
  `GET /api/chat/status/:simulationId` (verify Firebase ID token, then check
  `simulations/{id}.userId === uid`). Returns the `chats/{simulationId}/messages`
  subcollection ordered by `timestamp`, mapped to the same shape the frontend
  already uses (`role`, `content`, `agentType`, `agentName`, `timestamp`).
  Message `content` is whatever was persisted — already anonymized per the
  existing LGPD policy (`edrs/governance/001-lgpd-anonymization.md`), same as
  every other persisted chat message; this endpoint does not change what gets
  stored, only what gets read back.
- New client function `getChatHistory(simulationId)` in `chatService.ts`,
  same `fetch` + bearer-token pattern as `getChatStatus`.
- `handleOpenChat` calls `getChatHistory` right after confirming
  `status.isPaid`, and calls `setChatMessages(history)` before opening the
  sheet. This replaces `chatMessages` outright (not append) — every open is a
  fresh read of the source of truth in Firestore. A never-chatted case
  returns `[]`, so the existing "N perguntas restantes" empty state renders
  unchanged; a previously-chatted case shows the prior Q&A immediately.
- Out of scope: no change to how messages are sent or persisted
  (`handleSendChatMessage`, the `/api/chat/message` SSE route) — only how
  `simulationId` is set on load and how history is read back on open.

## References

- `lexforum-ai-studio/src/App.tsx` — `loadSimulation` (sets `simulationId`, resets chat state), `handleOpenChat` (fetches history on open)
- `lexforum-ai-studio/chat-handler.ts` — `GET /api/chat/history/:simulationId`
- `lexforum-ai-studio/src/services/chatService.ts` — `getChatHistory`
- `lexforum-ai-studio/src/services/dbService.ts:183-200,234-243` — `getUserSimulations`/`getSimulationById`, both already return `{ id: doc.id, ...data }`
- `lexforum-ai-studio/src/test/chatHistoryOnCaseLoad.test.ts` — regression tests modeling the `loadSimulation`/`handleOpenChat` contract
- `edrs/governance/001-lgpd-anonymization.md` — anonymization policy the new endpoint reads under, unchanged
