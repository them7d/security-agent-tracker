# ADR 0016: Geofence drawing UX — click-to-drop numbered polygon vertices

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend

## Context

The user explicitly asked: *"the area should be selected on the map with
drawing area on map from supervisor."* We needed a drawing UX that works with
Leaflet (ADR 0006), doesn't require an extra plugin, and is obvious to a
first-time supervisor.

## Decision

Hand-roll a **click-to-drop polygon vertex** flow inside
`src/components/map/map-view.tsx` + `src/components/map/leaflet-map.tsx`. Do
**not** use `leaflet-draw` or any drawing plugin.

Flow:

1. Supervisor picks an agent from the "Draw work area…" `Select` in the map
   toolbar.
2. The map enters drawing mode: cursor switches to `crosshair`, the agent
   picker becomes disabled, and a banner appears at the top of the map:
   *"Drawing work area for Karim Haddad · 0 vertices · [Cancel] [Save polygon]"*.
3. Each click on the map appends a `{lat, lng}` to `draftPoints` state and
   drops a numbered amber vertex marker (1, 2, 3, …) on the map.
4. After ≥ 2 vertices, a dashed amber polyline previews the shape; after ≥ 3
  vertices, it becomes a dashed amber polygon with a 12% fill.
5. "Save polygon" is disabled until `draftPoints.length >= 3`. Clicking it
   `PATCH`es `/api/agents/[id]` with `{ geofence: draftPoints }` and exits
   drawing mode.
6. "Cancel" discards the draft and exits.

The drawing state lives in `map-view.tsx` (`draftPoints`, `drawingForAgentId`,
`drawMode`); the actual Leaflet layers are created in `leaflet-map.tsx` from
the `draftPoints` prop.

## Consequences

**Positive:**
- No plugin dependency, no extra CSS, no plugin-specific bundle weight.
- The numbered vertex markers make it obvious which point will be the "first"
  — useful when closing the polygon.
- The supervisor sees a live preview before committing.
- The `Save` button's disabled-until-3-vertices guard prevents degenerate
  polygons.

**Negative:**
- No undo, no vertex drag, no vertex delete. If the supervisor misclicks,
  they must Cancel and start over.
- No constraint that the polygon be simple (non-self-intersecting). Ray
  casting (ADR 0010) uses even-odd rule, which may produce surprising
  results on a self-intersecting polygon.

**Risks / accepted trade-offs:**
- A "remove last vertex" button would be a small, high-value follow-up. The
  current Cancel-and-restart flow is acceptable for v1.

## Alternatives considered

- **`leaflet-draw` plugin** — gives polygon, rectangle, circle, undo, etc. but
  adds ~150 KB and a non-trivial styling effort to match the dark theme.
- **Freehand draw** — fun but imprecise; supervisors want exact corners.
- **Predefined shapes (rectangle / circle preset)** — would be a nice add-on
  but doesn't replace free-form polygon drawing.

## References

- `src/components/map/map-view.tsx` (`startDrawing`, `saveGeofence`,
  `handleMapClick`, `draftPoints` state)
- `src/components/map/leaflet-map.tsx` (draft polygon + numbered vertex
  markers effect)
- `src/app/api/agents/[id]/route.ts` (PATCH handler accepting `geofence`)
