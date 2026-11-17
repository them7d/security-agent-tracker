# ADR 0008: Security-ops dark navy + amber visual theme

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend

## Context

The user picked "Security ops — Dark navy + amber accent, monospaced data, dense
tactical dashboard look" in the clarifying questions. shadcn defaults to a
neutral grayscale; we needed to override every token.

## Decision

Override the shadcn design tokens in `src/app/globals.css` with a security-ops
dark palette:

- Page background `#0a0e1a` (near-black navy), surfaces graduated (`#111827`
  card, `#161d2c` muted, `#1c2536` secondary).
- Primary accent **amber `#f5a524`** (signal / action color) — used for primary
  buttons, active tab, agent marker highlights, drawn polygon strokes.
- Status colors mapped to Tailwind built-ins for markers / badges:
  - on-duty / in-zone → `emerald-400`
  - patrol → `sky-400`
  - off-duty / outside-zone → `red-400`
  - amber for warnings
- Force `dark` class on `<html>` (see ADR 0022); no light theme is shipped.
- Tabular numerals (`font-variant-numeric: tabular-nums`) on coordinates,
  timestamps, counts.
- Thin tactical scrollbars (8 px, `#1f2a3d` thumb).
- A faint `tactical-grid` background utility (24 px CSS grid lines) used on the
  login card and dashboard surface.
- Leaflet container + popups + zoom controls recoloured in the same file.

## Consequences

**Positive:**
- Visually distinct from a generic admin dashboard; matches the "tactical
  console" intent the user asked for.
- Single file (`globals.css`) controls the entire palette — easy to re-theme.
- High contrast for low-light control-room environments.

**Negative:**
- Some shadcn components assume the default neutral palette; a few surfaces
  needed manual `bg-secondary/40` hints to read correctly.

**Risks / accepted trade-offs:**
- No light theme. If a supervisor prints reports, the dark theme will waste
  toner; a future print stylesheet would fix this.

## Alternatives considered

- **Enterprise light (white + slate, Inter, calm)** — clean but generic; the
  user explicitly chose the tactical direction.
- **Corporate brand (deep blue + gold, serif headings)** — formal but slow to
  read in a live console.

## References

- `src/app/globals.css` (`:root`, `.dark`, Leaflet overrides, tactical-grid)
- `src/components/dashboard/stats-cards.tsx` (status tone classes)
- `src/components/map/leaflet-map.tsx` (marker color logic)
