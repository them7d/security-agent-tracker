# ADR 0010: Ray-casting algorithm for point-in-polygon

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Backend / Domain logic

## Context

The simulator (ADR 0011) and the serializer (`inGeofence` flag on every agent
DTO) both need to answer: "is this agent's current GPS position inside their
assigned polygon?" This runs on every simulator tick and on every `/api/agents`
response.

## Decision

Implement the **ray-casting (crossing-number) algorithm** in
`src/lib/geofence.ts` as `isPointInPolygon(point, polygon)`.

- Treats lat as x, lng as y (the algorithm is symmetric so axis labelling is
  irrelevant for correctness; chosen for readability against the DTO).
- A point exactly on the boundary is reported as inside (matches operator
  intuition).
- A polygon with fewer than 3 vertices returns `true` (no geofence ⇒ treat
  as inside, see ADR 0009).
- Algorithm is O(n) per test where n = polygon vertex count (typically 4 for a
  rectangle in our seeded data).

## Consequences

**Positive:**
- Trivial to implement, ~10 lines, no dependencies.
- Deterministic and fast for the polygon sizes we actually have.
- Easy to unit-test against known fixtures.

**Negative:**
- Ray casting has known edge cases near horizontal edges and exactly-on-edge
  points; we accept "on boundary = inside" as good enough.

**Risks / accepted trade-offs:**
- For self-intersecting polygons (which the drawing UX in ADR 0016 doesn't
  prevent), ray casting uses the even-odd rule — the result may surprise a
  supervisor. We accept this; a future "validate polygon" step before save
  would fix it.

## Alternatives considered

- **Winding number algorithm** — more robust for self-intersecting polygons,
  but more code and the same edge cases for our normal use.
- **Turf.js `@turf/boolean-point-in-polygon`** — well-tested dependency, but
  pulls in the whole Turf package (~hundreds of KB) for one function.
- **Server-side PostGIS `ST_Contains`** — requires moving off SQLite (ADR 0003).

## References

- `src/lib/geofence.ts` (`isPointInPolygon`)
- `src/lib/serializers.ts` (`serializeAgent` → `inGeofence`)
- `src/lib/simulator.ts` (transition detection)
