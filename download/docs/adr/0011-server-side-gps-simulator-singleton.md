# ADR 0011: Server-side GPS simulator singleton with in-memory inside/outside state

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Backend

## Context

In a real deployment, agents' mobile devices would push GPS pings to an ingest
endpoint. For this demo there are no devices, so positions need to move on
their own — and the supervisor needs to actually see geofence exits happen
within a minute or two of opening the map.

## Decision

Run a **server-side simulator** as a singleton Node interval, started lazily by
each API route via `startSimulator()` (idempotent — guarded by a module-level
`started` flag).

- File: `src/lib/simulator.ts`.
- Tick every **4 seconds**: for every `Agent` row, compute a new lat/lng via
  `randomWalk(prev, 25)` (≤ 25 m step in a random bearing).
- Maintain an in-memory `Map<agentId, boolean>` of "was inside geofence on the
  previous tick". This is the source of truth for transition detection — we do
  not recompute it from the DB.
- On a tick where `wasInside && !nowInside`: write
  `AttendanceLog(geofence_exit) + AttendanceLog(check_out) + Alert(geofence_exit)`
  and flip the agent's `status` to `off_duty` (see ADR 0012).
- On `!wasInside && nowInside`: write
  `AttendanceLog(geofence_reenter) + AttendanceLog(check_in) + Alert(geofence_reenter)`
  and flip status to `on_duty`.
- On startup, the simulator pre-seeds the inside/outside map from the current
  DB state.
- Errors in the tick are caught and logged; the simulator never crashes the
  process.
- With ~10% probability per tick, the agent is biased outward from the
  geofence centroid so exits actually happen during a demo (see ADR 0023).

## Consequences

**Positive:**
- No external process, no extra port, no socket lifecycle — fits inside the
  Next.js Route Handler module graph.
- Idempotent start means it survives hot reload without spawning duplicates.
- The DB is the single source of truth for positions; the client just polls
  `/api/agents` (ADR 0005).

**Negative:**
- The interval runs inside the Next.js dev server process. In a serverless
  deployment (Vercel), the simulator would die between invocations — needs a
  real worker / cron for prod.
- The in-memory inside/outside map is lost on process restart, then re-seeded
  from the DB. This is fine because the DB always reflects the latest
  committed state.

**Risks / accepted trade-offs:**
- If two Next.js processes ran simultaneously (e.g. a worker + a web role),
  both would tick and double-write. For prod, extract to a single worker.

## Alternatives considered

- **Client-side simulation** — would require the client to write back to the
  DB; breaks the "client only reads" model and would not survive a tab close.
- **A separate `bun --hot` mini-service on another port** (like the websocket
  example) — more moving parts, no real benefit at this scale.
- **No simulation** — the dashboard would be static; the geofence-enforcement
  story wouldn't be demoable.

## References

- `src/lib/simulator.ts`
- `src/app/api/agents/route.ts` (calls `startSimulator()` on every request)
- `src/app/api/orders/route.ts`, `src/app/api/logs/route.ts`,
  `src/app/api/alerts/route.ts`, `src/app/api/seed/route.ts` (same)
- ADR 0005 (client polling)
- ADR 0012 (enforcement semantics)
- ADR 0023 (outward biasing)
