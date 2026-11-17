# ADR 0019: RESTful API route handlers (not tRPC or Server Actions)

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Backend

## Context

The app needs server endpoints for CRUD on agents, dispatching orders, reading
logs and alerts, and seeding demo data. The skill stack supports Next.js Route
Handlers (`src/app/api/**/route.ts`), Next Server Actions, and could in
principle add tRPC.

## Decision

Implement the API as **RESTful Next.js Route Handlers**, returning JSON.

- `/api/agents` — `GET` (list), `POST` (create)
- `/api/agents/[id]` — `PATCH` (update geofence / status / etc), `DELETE`
- `/api/orders` — `GET` (list, optional `agentId`, `limit`), `POST` (dispatch)
- `/api/logs` — `GET` (filter by `type`, `agentId`, `limit`)
- `/api/alerts` — `GET` (optional `unread=true`)
- `/api/alerts/[id]/read` — `POST` / `DELETE` (mark read / dismiss)
- `/api/seed` — `POST` (idempotent; see ADR 0020)
- `/api/auth/[...nextauth]` — NextAuth handlers

Conventions:

- All handlers call `startSimulator()` to lazily boot the simulator
  singleton (ADR 0011) — no separate bootstrap step needed.
- Responses are typed via the DTO serializers in `src/lib/serializers.ts`,
  not raw Prisma rows — this is what `src/lib/types.ts` models.
- Errors return `{ error: string }` with an HTTP status; the client surfaces
  them via sonner toasts in the mutation's `catch`.
- Search/filter params come from `URLSearchParams`; no body parsing on GETs.

## Consequences

**Positive:**
- Trivially inspectable with `curl` during development.
- Each route is a small file; no central router to maintain.
- Decoupled from the React tree — the same endpoints work for a future mobile
  supervisor app or an agent device ingest pipeline.

**Negative:**
- No end-to-end type safety between client and server (TanStack Query just
  gets `Promise<unknown>` until we type each `queryFn`'s return).
- Manual DTO mapping in serializers — drift is possible if the schema changes
  without updating the serializer.

**Risks / accepted trade-offs:**
- The API is not currently session-protected server-side — see ADR 0024.

## Alternatives considered

- **Next Server Actions** — tighter coupling, no `curl`-able surface,
  harder to consume from non-React clients. Good for form mutations, less
  good for a REST-style API.
- **tRPC** — would give us end-to-end types, but adds a non-trivial dependency
  and the skill stack doesn't ship it.

## References

- `src/app/api/**`
- `src/lib/serializers.ts`
- `src/lib/types.ts`
- `src/hooks/use-data.ts` (client consumers)
