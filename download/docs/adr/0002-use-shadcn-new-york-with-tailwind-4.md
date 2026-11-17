# ADR 0002: Use shadcn/ui (New York style) + Tailwind CSS 4

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend

## Context

The user explicitly asked for "clean front-end like a senior frontend developer at
Google using reactjs and shadcn". The sandbox ships with shadcn/ui components in
`src/components/ui` and Tailwind 4 already wired via `@tailwindcss/postcss`.

## Decision

Adopt **shadcn/ui (New York variant)** as the component system, on top of
**Tailwind CSS 4** with CSS-variable-based theming.

- Use the pre-existing shadcn primitives (`Button`, `Card`, `Dialog`, `Sheet`,
  `Table`, `AlertDialog`, `Select`, `DropdownMenu`, `ScrollArea`, `Tabs`, `Badge`,
  `Input`, `Label`, `Textarea`, `Separator`, `Skeleton`, `Sonner`, `Toaster`).
- Never hand-roll equivalents of things shadcn already provides.
- Compose features in feature-specific folders (`src/components/dashboard`,
  `…/map`, `…/logs`, `…/nav`, `…/auth`) rather than dumping everything into one file.
- Use Lucide icons consistently — no mixed icon sets.

## Consequences

**Positive:**
- Consistent, accessible primitives out of the box (focus rings, ARIA roles,
  keyboard nav).
- Design tokens (radius, border, ring, chart palette) are centralized in
  `src/app/globals.css`, so re-skinning is a single file change.
- Senior-dev hygiene: small components, single responsibility, no indigo/blue
  defaults leaking through.

**Negative:**
- shadcn copies component source into the repo (no `@shadcn/ui` npm dependency),
  so upstream fixes have to be re-pulled manually.

**Risks / accepted trade-offs:**
- Tailwind 4's `@theme inline` + oklch color space is less familiar than v3's
  `tailwind.config.ts` tokens; the original scaffold already used it so we kept it.

## Alternatives considered

- **Material UI / MUI** — heavy, opinionated visual language; user asked for shadcn.
- **Headless Radix without shadcn wrappers** — more boilerplate for the same UX.
- **Mantine** — closer fit but not in the sandbox skill stack.

## References

- `src/components/ui/*`
- `src/app/globals.css` (theme tokens)
- `components.json` (shadcn config)
