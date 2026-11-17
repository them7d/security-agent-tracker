# ADR 0007: Single-page app with tab navigation, only one route at `/`

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend

## Context

The fullstack skill constraint states: *"User can only see the `/` route defined
in `src/app/page.tsx`. Do NOT write any other route."* The app, however, has
three clearly distinct screens: Dashboard, Live Map, and Logs.

## Decision

Build the app as a **single page at `/`** with internal **tab navigation**
managed in React state, rather than as multiple Next routes.

- `src/app/page.tsx` is a thin wrapper that renders `<AppShell />`.
- `AppShell` (`src/components/app-shell.tsx`) holds `view: "dashboard" | "map"
  | "logs"` in `useState`, plus a `focusAgent` state that lets the dashboard
  push a "view this agent on the map" intent across the tab boundary.
- `SideNav` (`src/components/nav/side-nav.tsx`) renders the three tabs as
  buttons; selecting one swaps the main panel.
- The auth gate lives in the same `AppShell`: if `useSession().status !==
  "authenticated"`, the LoginCard is rendered; otherwise the top bar + side
  nav + main panel are rendered.

## Consequences

**Positive:**
- Complies with the skill's only-one-route rule.
- No router plumbing or deep-linking to maintain.
- Cross-screen intent (dashboard row → focus agent on map) is a plain
  `useState` lift, no URL parsing.
- Tab switches are instant — no network roundtrip.

**Negative:**
- No shareable deep links (`/agents/SC-0142`, `/logs?type=geofence_exit`).
- Browser back button doesn't move between tabs (it leaves the app).
- Logs filter state is component-local, so it resets on tab switch.

**Risks / accepted trade-offs:**
- If the app grows beyond ~5 screens, we should re-evaluate and either move
  to real routes or push the skill to allow more.

## Alternatives considered

- **Multiple Next routes (`/dashboard`, `/map`, `/logs`)** — explicitly
  disallowed by the skill constraint.
- **Hash routing (`/#/map`)** — would give back-button support but is a hack
  around the constraint; not worth the complexity for 3 tabs.
- **Sidebar-driven modal stack** — overkill for 3 peer-level screens.

## References

- `src/app/page.tsx`
- `src/components/app-shell.tsx`
- `src/components/nav/side-nav.tsx`
