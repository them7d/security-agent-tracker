# ADR 0012: Geofence enforcement semantics

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Backend / Domain logic

## Context

The user's specific ask: *"when an agent gets outside his work area, the
supervisor gets a notification and the system starts logging — the log should
include the agent's attendance time and departure time."*

This needed an explicit decision on **what counts as attendance**, **what
counts as departure**, and **what side effects each transition triggers**.

## Decision

Treat the geofence as both a **presence boundary** and a **shift boundary**:

| Transition               | Logs written                                              | Alert                | Status change           |
| ------------------------ | --------------------------------------------------------- | -------------------- | ----------------------- |
| Enter geofence (was out) | `geofence_reenter` + `check_in` (note: "Auto check-in: entered geofence") | `geofence_reenter` | → `on_duty`             |
| Exit geofence (was in)   | `geofence_exit` + `check_out` (note: "Auto check-out: left geofence") | `geofence_exit`    | → `off_duty` (if previously `on_duty` or `patrol`) |

- All logs include the agent's `lat`, `lng` at the moment of transition.
- The `Alert.message` includes the agent's name + badge + area label, e.g.
  *"Karim Haddad (SC-0142) left the assigned work area: Karkh gate."*
- The alert is unread by default and shows in the topbar bell (ADR 0018 polls
  `/api/alerts?unread=true` every 4 s).
- The simulator is the only writer of these rows (see ADR 0011); supervisors
  cannot manually check agents in or out in this version.

## Consequences

**Positive:**
- The supervisor sees **attendance time** (check-in row on entry) and
  **departure time** (check-out row on exit) directly in the Logs view, with
  second-precision timestamps.
- One geofence transition produces exactly one alert — no spam.
- The agent's `status` field always reflects reality: `on_duty` while inside,
  `off_duty` while outside.
- The `geofence_exit` / `geofence_reenter` log types are kept separate from
  `check_in` / `check_out` so a future "manual check-in" feature can be added
  without semantic collision.

**Negative:**
- An agent's shift is implicitly defined by their geofence presence. If a
  supervisor wants to define a shift that's decoupled from the geofence (e.g.
  "you may leave the zone for lunch 12:00–13:00"), this model doesn't support
  it without extension.
- The "OUT" badge on the dashboard is derived from `!inGeofence`, not from
  `status === "off_duty"`. These usually agree but can briefly diverge if the
  client polls between the simulator's tick and the status update — visually
  fine, semantically a tiny inconsistency.

**Risks / accepted trade-offs:**
- If a real deployment needs **manual override** (supervisor marks an agent
  on-duty despite being outside), this needs an explicit `manual` log type and
  a status override flag.

## Alternatives considered

- **Decouple shift from geofence** (separate `Shift` table with `start`, `end`)
  — more correct but heavier; not needed for the user's stated requirement.
- **Alert only on exit, no auto check-out** — would lose the "departure time"
  log the user asked for.
- **Generate one combined `geofence_event` log row** instead of two — harder
  to filter later (the Logs view filters by event type).

## References

- `src/lib/simulator.ts` (`tickAgent` transition branches)
- `src/components/dashboard/agents-table.tsx` (OUT badge)
- `src/components/logs/logs-view.tsx` (event filter)
- `prisma/schema.prisma` (`AttendanceLog.type`, `Alert.type`)
