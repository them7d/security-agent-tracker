# ADR 0001: Use Next.js 16 App Router with TypeScript

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Full-stack

## Context

SentinelSec needs a supervisor-facing web console that combines:
- a server-rendered authenticated shell (login gate, session),
- a REST-style JSON API for agents / orders / logs / alerts,
- an ORM-backed persistence layer,
- a live, polling-heavy interactive UI (map, dashboard, logs).

The sandbox ships with the fullstack skill locked to Next.js 16 + TypeScript 5, and
the only externally visible route is `/`. Within those constraints, the App Router
was chosen over the Pages Router or a standalone Vite SPA.

## Decision

Use **Next.js 16 with the App Router** and **TypeScript 5** end-to-end.

- All UI lives under `src/app/` and `src/components/`.
- API endpoints are Next.js Route Handlers under `src/app/api/**`.
- Server-only code (Prisma, bcrypt, simulator) is never imported by client
  components; `"use client"` / `"use server"` boundaries are explicit.

## Consequences

**Positive:**
- One framework handles SSR, API routes, and the React Server / Client boundary.
- App Router RSC lets the login gate run server-side before sending the SPA shell.
- Route Handlers co-locate the API with the ORM in the same deployable.
- TypeScript strictness catches most DTO drift between server and client.

**Negative:**
- App Router in Next.js 16 still has some sharp edges (e.g. async `params` typing,
  Fast Refresh full reloads on certain runtime errors during dev).
- The user-visible `/` constraint forced a single-page tab UX (see ADR 0007).

**Risks / accepted trade-offs:**
- Next 16 is newer than 14/15; some third-party docs still target the older
  Pages Router.

## Alternatives considered

- **Next.js Pages Router** — simpler mental model, but the skill and modern Next
  defaults push App Router; choosing Pages would have been a step backwards.
- **Vite + React SPA + separate Express API** — would require a second process /
  port and lose SSR. The skill also doesn't ship it.
- **Remix** — not available in the sandbox skill stack.

## References

- `src/app/layout.tsx`, `src/app/page.tsx`
- `src/app/api/**` (Route Handlers)
