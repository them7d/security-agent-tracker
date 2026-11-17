# ADR 0017: Agent markers — L.divIcon with CSS pulse animation

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend

## Context

Each agent needs a marker on the map that:
- conveys status at a glance (in-zone vs outside, on-duty vs off-duty),
- pulses to feel "alive",
- is cheap to update every 3 s when the simulator moves the agent,
- supports click → opens the agent detail drawer.

## Decision

Render each agent as a **Leaflet `L.divIcon`** with hand-written HTML + CSS,
rather than as a `L.circleMarker` or a raster icon.

Marker structure (HTML inside the divIcon):

```html
<div class="agent-marker__pulse [--danger]" />
<div class="agent-marker__dot" />
```

- The pulse layer is a 28px-radius circle with the agent's status color, animated
  by the `agent-pulse` keyframes in `globals.css` (2.4 s ease-out infinite). For
  agents outside their geofence, the `agent-marker__pulse--danger` modifier
  shortens the animation to 1.1 s and scales more aggressively.
- The dot is a 20px solid circle, 2px white border when selected, otherwise a
  dark navy border; the drawing-target agent gets a 4px amber box-shadow ring.
- Status → color mapping:
  - outside geofence → `#ef4444` (red)
  - `on_duty` → `#10b981` (emerald)
  - `patrol` → `#38bdf8` (sky)
  - `off_duty` → `#94a3b8` (slate)
- `iconSize: [0, 0]` because the divIcon's HTML uses absolute positioning to
  center itself; Leaflet's anchor math is bypassed.
- Click handler: `marker.on("click", () => onSelectAgent(agent))` opens the
  right-side `AgentDetailDrawer` (Sheet).

## Consequences

**Positive:**
- Pure DOM, no raster asset pipeline; colors can change instantly without
  re-encoding a PNG.
- The pulse animation is CSS-only — no JS per-frame work, no canvas.
- Updates are cheap: on each `/api/agents` poll, `leaflet-map.tsx` diffs
  by agent id, calls `setLatLng` and `setIcon` on existing markers, only
  creates new ones for new agents, and removes markers for deleted agents.

**Negative:**
- Many divIcons on a single map can get slow on low-end machines; we have ≤
  tens of agents, so fine.
- The `iconSize: [0, 0]` trick is non-obvious; a future maintainer might
  "fix" it and break centering.

**Risks / accepted trade-offs:**
- For >100 agents we'd switch to `L.canvas()` renderer + `L.circleMarker` for
  raw performance, losing the pulse flair.

## Alternatives considered

- **`L.circleMarker`** — fast, canvas-friendly, but no pulse and harder to
  theme per-status.
- **Raster PNG / SVG icon** — extra asset pipeline; harder to recolour on
  status change.
- **Mapbox marker clustering** — not relevant at this scale.

## References

- `src/components/map/leaflet-map.tsx` (markers effect)
- `src/app/globals.css` (`@keyframes agent-pulse`, `agent-pulse-danger`)
- `src/components/map/agent-detail-drawer.tsx`
