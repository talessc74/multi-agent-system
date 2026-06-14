---
name: _local-adr-policy-003-sse-streaming
description: Defines the use of Server-Sent Events (SSE) for streaming simulation progress from server to client. Use when implementing or debugging real-time progress updates during simulation.
apply-to: Simulation endpoints — server.ts SSE handlers, client-side SSE consumers in App.tsx
valid-from: 2026-06-13
---

# _local-adr-policy-003: SSE Streaming

## Context and Problem Statement

Simulation rounds in EAI? take several seconds each (multiple Gemini calls per round, up to
3 rounds). Users need real-time feedback on what is happening — "lawyer writing", "judge
evaluating", "round complete" — rather than a blank screen until the final result arrives.

How should simulation progress be communicated from server to client?

## Decision Outcome

**Server-Sent Events (SSE) over a persistent HTTP connection**

The server streams progress events to the client using the SSE protocol. The client
renders each event incrementally as it arrives.

### Details

#### Event Types

| Event | When emitted | Payload |
|-------|-------------|---------|
| `WRITING` | Lawyer begins writing petition for round N | `{ round: N }` |
| `JUDGING` | Judge begins evaluating round N | `{ round: N }` |
| `REVIEWING` | Brief strategist generating for round N | `{ round: N }` |
| `ROUND_DONE` | Round N complete | full `SimulationRound` object |
| `RESULT` | All rounds complete | full `SimulationResult` object |
| `ERROR` | Unrecoverable failure | `{ message: string }` |

#### SSE Headers

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

#### Safari Mobile Retry

Safari mobile closes SSE connections aggressively. The client must implement
automatic reconnection with exponential backoff on connection loss.

#### Implementation

- Server: `sse-utils.ts` — `setupSSE(res)` and `sendSSE(res, event, data)`
- Client: native `EventSource` API in `App.tsx`
- The SSE connection is opened per simulation request and closed after `RESULT` or `ERROR`
