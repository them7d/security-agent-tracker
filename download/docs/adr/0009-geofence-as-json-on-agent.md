# ADR 0009: Store geofence as a JSON-encoded polygon on the Agent row

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Backend

## Context

Each agent has an assigned "work area" the supervisor draws on the map. It's a
polygon — an ordered list of `{lat, lng}` vertices. SQLite (via Prisma) doesn't
have a native `GEOMETRY` type, and Prisma doesn't support array primitives on a
scalar column.

## Decision

Store the geofence as a **JSON-encoded string** on the `Agent.geofence` column
(`String @default("[]")`).

- Encoding: `JSON.stringify([{lat,lng}, ...])`.
- Decoding helper: `parseGeofence(raw: string): LatLng[]` in
  `src/lib/geofence.ts` — defensive against malformed JSON, returns `[]` on
  any error.
- An empty array means "no geofence assigned yet" — the agent is treated as
  always-in-zone by `isPointInPolygon` (no polygon ⇒ treat as inside).
- A human-readable `areaLabel` (`String?`) is stored next to it for display
  ("Karkh gate", "Rusafa market", …).
- The DTO field on the client is the parsed array, never the raw string —
  `serializeAgent` runs `parseGeofence` before sending to the client.

## Consequences

**Positive:**
- No schema extension, no migration risk, works on plain SQLite.
- The whole geofence round-trips in a single column read/write.
- Decoding is cheap and one-shot per agent.

**Negative:**
- No spatial indexing — point-in-polygon is computed in JS for every agent on
  every simulator tick and every API response. Fine for ~tens of agents; not
  for thousands.
- Can't natively query "all agents inside polygon X" at the DB level.

**Risks / accepted trade-offs:**
- If we ever move to Postgres + PostGIS, this column should migrate to a
  `GEOMETRY(POLYGON, 4326)` and `parseGeofence` becomes a thin adapter.

## Alternatives considered

- **Separate `GeofenceVertex` table with `(agentId, lat, lng, ord)`** — normalised
  but requires a JOIN on every read; overkill for a small array.
- **Prisma `Json` type** — would also work, but `String` keeps the column
  type simple and makes raw SQL inspection easier.

## References

- `prisma/schema.prisma` (`Agent.geofence`, `Agent.areaLabel`)
- `src/lib/geofence.ts` (`parseGeofence`)
- `src/lib/serializers.ts` (`serializeAgent`)
- ADR 0010 (point-in-polygon algorithm)
