# ADR 0014: Sonner for toast notifications

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend

## Context

The app needs transient feedback for actions: "Order dispatched", "Agent
added", "Failed to save geofence", "Authenticated. Welcome back". The sandbox
ships with two toast systems: the shadcn `Toaster` (Radix Toast-based, in
`src/components/ui/toaster.tsx`) and `sonner` (the shadcn `Sonner` wrapper at
`src/components/ui/sonner.tsx`).

## Decision

Use **`sonner`** as the primary toast system. Keep the shadcn `Toaster`
mounted (harmless) so any legacy `useToast()` calls don't crash.

- Mount `<SonnerToaster position="top-right" theme="dark" />` once in the
  root layout (`src/app/layout.tsx`).
- Import `toast` directly from `"sonner"` at each call site — no hook wrapper.
- Variants used: `toast.success(...)`, `toast.error(...)`, `toast.info(...)`.

## Consequences

**Positive:**
- `sonner`'s API is simpler than `useToast`'s dispatch + reducer pattern —
  one import, one function call.
- Stacks gracefully, auto-dismisses, supports rich content if needed later.
- Theme is wired to the dark mode tokens via the shadcn wrapper, so toasts
  match the rest of the UI.

**Negative:**
- Two toast systems are mounted (`<Toaster />` + `<SonnerToaster />`). The
  Radix one is currently unused; a future cleanup should remove it.

**Risks / accepted trade-offs:**
- None material.

## Alternatives considered

- **shadcn `useToast` (Radix Toast)** — more verbose; the `use-toast.ts`
  reducer store is shared global state we don't need.
- **react-hot-toast** — comparable to sonner but not pre-installed.

## References

- `src/app/layout.tsx` (`<SonnerToaster />`)
- `src/components/ui/sonner.tsx`
- `src/components/auth/login-card.tsx`, `src/components/dashboard/add-agent-dialog.tsx`,
  `src/components/map/send-order-form.tsx`, `src/components/map/map-view.tsx`
  (all import `toast` from `"sonner"`)
