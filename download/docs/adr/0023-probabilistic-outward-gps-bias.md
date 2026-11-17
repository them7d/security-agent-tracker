# ADR 0023: Probabilistic outward GPS bias for demo visibility

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Backend

## Context

The simulator's random walk (ADR 0011) keeps agents within ~tens of meters of
their start position. With a 160 m × 160 m geofence (80 m half-size), an
unbiased random walk would almost never cross the boundary — so the
supervisor would never see a geofence exit during a demo, and the core
feature of the app would look broken.

## Decision

With **~10% probability per simulator tick**, bias the agent's step **away
from the geofence centroid** instead of taking a random walk step.

- Implemented in `biasAwayFromCentroid(prev, centroid, metersStep=30)` in
  `src/lib/geofence.ts`: compute the unit vector from centroid to agent,
  step `metersStep` meters in that direction.
- Triggered in `simulator.ts`'s `tickAgent` only when the agent has a
  geofence (≥ 3 vertices) and only ~10% of the time.

The other 90% of ticks remain a normal random walk, so agents still wander
organically and re-enter naturally.

## Consequences

**Positive:**
- A supervisor watching the map for ~1 minute will see at least one geofence
  exit and the full alert → check_out → dashboard "OUT" badge → logs row
  flow fire. This is what makes the demo believable.
- The bias is gentle enough that agents don't fly off the map.

**Negative:**
- The simulation is no longer a faithful model of real agent motion. A real
  agent might stay in their zone for an entire shift without exiting.
- The 10% probability is hardcoded; tuning it requires a code change.

**Risks / accepted trade-offs:**
- This is a **demo-only behavior**. In a production deployment with real GPS
  ingest, `biasAwayFromCentroid` should never be called — the simulator
  itself should be removed (ADR 0011) and the `tickAgent` function deleted.
  Documented here so future maintainers don't assume it's a real feature.

## Alternatives considered

- **Make the seeded geofences tiny (5 m)** — would make exits happen on every
  tick, but the polygon would be visually invisible on the map.
- **Schedule a guaranteed exit every N ticks** — less organic, looks
  mechanical.
- **No biasing, rely on natural walk** — exits would never happen in a
  reasonable demo window.

## References

- `src/lib/geofence.ts` (`biasAwayFromCentroid`)
- `src/lib/simulator.ts` (10% bias branch in `tickAgent`)
- ADR 0011 (simulator)
