# ADR 0022: next-themes with forced dark mode

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend

## Context

The visual style is dark-only (ADR 0008). shadcn's default `next-themes` setup
is multi-theme (light / dark / system) and would let the browser's
`prefers-color-scheme` flip the page to light — which would look broken given
our token overrides are dark-tuned.

## Decision

Use **`next-themes`** with `forcedTheme="dark"` and `enableSystem={false}`.

- `Providers` wraps the app in `<ThemeProvider attribute="class"
  defaultTheme="dark" enableSystem={false} forcedTheme="dark">`.
- The root `<html>` in `layout.tsx` also carries `className="dark"` as a
  server-side default so the first paint is dark before next-themes hydrates.
- The `.dark` block in `globals.css` re-declares the same tokens as `:root`
  so both selectors resolve identically — defensive against any code path
  that reads tokens before the `dark` class is applied.

## Consequences

**Positive:**
- No flash of light theme on first paint.
- The supervisor can't accidentally switch to light mode via OS settings.
- `useTheme()` is still available (used by `src/components/ui/sonner.tsx`)
  for components that expect the hook to exist.

**Negative:**
- A future "light theme for reports" feature would require relaxing the
  `forcedTheme` and authoring a complete light token set.

**Risks / accepted trade-offs:**
- None material.

## Alternatives considered

- **No `next-themes`** — manually set `className="dark"` on `<html>` and skip
  the provider. Smaller, but breaks any shadcn component that calls
  `useTheme()` (e.g. sonner).
- **Allow system theme** — would let the OS flip the app to light, which
  looks broken with our dark-only token set.

## References

- `src/components/providers/providers.tsx`
- `src/app/layout.tsx` (`<html className="dark">`)
- `src/app/globals.css` (`:root` and `.dark` blocks)
- `src/components/ui/sonner.tsx` (`useTheme`)
