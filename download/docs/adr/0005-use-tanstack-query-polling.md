# ADR 0005: Use TanStack Query polling instead of WebSocket

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend / Backend

## Context

Agent GPS positions, alerts, and logs all need to feel "live" in the supervisor
console. The skill stack ships with TanStack Query and includes a socket.io
mini-service pattern, so both polling and push were viable.

## Decision

Use **TanStack Query with periodic `refetchInterval`** instead of a WebSocket
mini-service.

- Each data type polls at its own interval (see ADR 0018):
  - agents: 3 s (positions move every 4 s server-side)
  - alerts (unread): 4 s
  - logs: 5 s
  - orders: 8 s
- Queries use `cache: "no-store"` on `fetch` to avoid stale responses.
- The QueryClient is created once via `React.useState(() => new QueryClient(...))`
  inside `Providers` so it survives re-renders.

## Consequences

**Positive:**
- One transport (HTTP) for the whole app — no second port, no socket lifecycle,
  no reconnection logic.
- TanStack Query gives us caching, dedup, optimistic UI primitives, and
  `invalidateQueries` on mutations for free.
- Easier to reason about: every refresh is a fresh `/api/agents` GET, period.
- The dev server log shows clean 200s; no socket disconnect churn.

**Negative:**
- Up to ~4 GETs every 3–8 s per open tab. Fine for one supervisor, not for
  thousands.
- ~3 s worst-case latency between an agent leaving the geofence and the
  supervisor's bell ringing. Acceptable for a security console, not for
  sub-second alerting.

**Risks / accepted trade-offs:**
- If the user later wants sub-second alerting or bi-directional comms
  (e.g. agent acks an order in real time), we'll need to swap to socket.io.

## Alternatives considered

- **socket.io mini-service on port 3003 via `XTransformPort`** — would give push
  semantics and lower latency, but doubles the moving parts (process, gateway
  forwarding, reconnect handling) for a marginal UX gain in this demo.
- **Server-Sent Events (SSE)** — single-direction push, simpler than sockets but
  not in the skill stack out of the box.
- **No live updates (manual refresh)** — strictly worse UX for a "live console".

## References

- `src/components/providers/providers.tsx`
- `src/hooks/use-data.ts`
- ADR 0018 (polling intervals)
