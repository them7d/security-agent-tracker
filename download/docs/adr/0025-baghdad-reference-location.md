# ADR 0025: Reference location — downtown Baghdad (Asia/Baghdad timezone)

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Backend / UX

## Context

The sandbox session metadata declares the user's timezone as
`Asia/Baghdad`. Seeded agents need a plausible real-world reference location
so the map opens somewhere sensible and the geofence polygons are visible at
a reasonable zoom level.

## Decision

Use **downtown Baghdad** as the reference point for all seeded data and the
default map center.

- `HQ_DEFAULT = { lat: 33.3152, lng: 44.3661 }` in
  `src/components/map/map-constants.ts` — used by the Leaflet map's initial
  `center` and by the Add Agent dialog's default lat/lng.
- The seed route (`src/app/api/seed/route.ts`) offsets four agents by
  +60 / -40 / +20 / -90 meters from HQ using `metersToLatLng` (corrects for
  longitude compression at this latitude), then wraps each in an 80 m
  half-size square geofence.
- Seed area labels reference real Baghdad landmarks: *Karkh gate*, *Rusafa
  market*, *Mutanabbi Street*, *Tahrir square*.
- Seed phone numbers use the Iraqi country code (`+964 7xx ...`).
- Seed badge IDs use a `SC-NNNN` format.
- `.env` includes `NEXTAUTH_URL=https://preview-chat-91f7e5bb-7fb5-4358-a3ef-65e5cb2f4087.space-z.ai`
  which is the sandbox preview domain.

## Consequences

**Positive:**
- The map opens centered on a real city; supervisors recognise the streets.
- Geofence sizes (80 m) are realistic for a single-post patrol zone.
- Phone numbers, badge IDs, and area labels feel plausible.

**Negative:**
- The reference is hardcoded. A non-Baghdad deployment would need to edit
  `map-constants.ts` and the seed route.

**Risks / accepted trade-offs:**
- Time formatting (ADR 0015) uses the **browser's** local timezone, not
  Asia/Baghdad. If the supervisor's browser is in a different timezone, the
  logs table will show timestamps in that timezone rather than local Iraqi
  time. Acceptable for the demo.

## Alternatives considered

- **Generic 0,0 (Null Island)** — the map would open over the Gulf of Guinea;
  polygons would be invisible.
- **San Francisco / NYC defaults** — would clash with the Asia/Baghdad
  timezone metadata.
- **User-supplied HQ on first run** — adds a setup wizard step; not needed
  for the demo.

## References

- `src/components/map/map-constants.ts` (`HQ_DEFAULT`)
- `src/app/api/seed/route.ts` (`HQ`, `SEED_AGENTS`, `metersToLatLng`)
- `.env` (`NEXTAUTH_URL`)
