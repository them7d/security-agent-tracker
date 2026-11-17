# ADR 0006: Use Leaflet + CARTO dark tiles instead of Google Maps

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend

## Context

The user picked "Google Maps" in the clarifying questions. Google Maps requires
a `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, and the sandbox has none. We could have
shipped a broken Google Maps iframe, but a working tactical map is more
important than the brand name.

## Decision

Use **Leaflet 1.9** via `react-leaflet` v5 with **CARTO `dark_all` raster tiles**
(`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`).

- The map is implemented in one isolated file, `src/components/map/leaflet-map.tsx`,
  exposed via `next/dynamic` with `ssr: false` from `map-view.tsx`.
- Leaflet's CSS is imported in the same file (`leaflet/dist/leaflet.css`).
- All Leaflet container / popup / zoom controls are recoloured in
  `src/app/globals.css` to match the dark tactical theme.
- No API key is required for CARTO raster tiles at the volume this demo
  generates.

## Consequences

**Positive:**
- Works out of the box with zero configuration.
- Full programmatic control over markers, polygons, popups, drawing, etc.
  (we use raw `L.polygon` and `L.divIcon` for markers and geofence rendering).
- Same UX surface as Google Maps for our use cases: markers, polygons, info
  drawers, zoom, attribution.

**Negative:**
- User explicitly asked for Google Maps; this is a substitution they need to
  opt into.
- CARTO raster tiles are less crisp than Google's vector tiles at high zoom.
- Some Leaflet plugins (e.g. drawing tools) are less maintained than Google's
  equivalents — we hand-rolled drawing instead (see ADR 0016).

**Risks / accepted trade-offs:**
- CARTO's free tier is rate-limited; a production deployment should either
  self-host tiles or move to Mapbox / Google Maps with a paid key.

## Alternatives considered

- **Google Maps via `@react-google-maps/api`** — would have shipped a broken
  iframe (no key in the sandbox). Rejected for the demo, but trivial to swap
  in later: replace the body of `leaflet-map.tsx` and the consumer props in
  `map-view.tsx`.
- **Mapbox GL JS** — needs a public token, also not available in the sandbox.
- **Static SVG mock map** — would lose interactivity and geofence drawing.

## References

- `src/components/map/leaflet-map.tsx`
- `src/components/map/map-view.tsx`
- `src/app/globals.css` (`.leaflet-*` overrides)
- `package.json` (`leaflet`, `react-leaflet`)
