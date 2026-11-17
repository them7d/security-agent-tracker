# ADR 0018: Differential polling intervals per data type

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend

## Context

With TanStack Query polling (ADR 0005), we needed to pick a single `refetchInterval`
per query. Polling too fast burns requests and CPU; too slow makes the UI feel
dead.

## Decision

Use **different `refetchInterval` values per data type**, tuned to how often
the underlying data actually changes and how latency-sensitive the supervisor
is to it:

| Query                              | Interval | Why                                                                              |
| ---------------------------------- | -------- | -------------------------------------------------------------------------------- |
| `useAgents` (positions + status)   | **3 s**  | Simulator ticks every 4 s; 3 s polling feels live without hammering the DB.      |
| `useAlerts(true)` (unread, topbar) | **4 s**  | Aligned with simulator ticks; the bell count needs to update promptly.          |
| `useLogs` (full audit trail)       | **5 s**  | Logs change less often than positions; 5 s is fast enough for an audit view.    |
| `useOrders` (per agent + recent)   | **8 s**  | Orders are human-paced (a supervisor dispatches one every few minutes at most). |
| `useAlerts()` (logs side panel)    | **4 s**  | Reuses the same hook with `onlyUnread=false`; same cadence as the topbar feed.  |

All queries use `cache: "no-store"` on the underlying `fetch` so a stale HTTP
cache can't mask a fresh simulator tick.

## Consequences

**Positive:**
- The dashboard table, map markers, topbar bell, and logs all feel live within
  human-perceptible latency (~3–5 s worst case).
- Total request load per open tab is bounded: roughly one `/api/agents` every
  3 s + one `/api/alerts?unread=true` every 4 s + occasional logs/orders.
- Tuning is a one-line change per hook.

**Negative:**
- Five different intervals is harder to reason about than "poll everything at
  N seconds"; a future maintainer might wonder why logs is 5 s and alerts is 4 s.

**Risks / accepted trade-offs:**
- If we ever move to WebSocket push (ADR 0005 alternatives), all five
  intervals collapse to one push channel; the per-type tuning becomes moot.

## Alternatives considered

- **Single global interval (5 s) for everything** — simpler but the topbar
  bell would lag up to 5 s after an exit; the map would feel sluggish.
- **`staleTime`-based refetch on focus** — wrong model for a console that
  stays open and unattended for hours.

## References

- `src/hooks/use-data.ts` (each hook's `refetchInterval`)
- ADR 0005 (polling vs WebSocket)
