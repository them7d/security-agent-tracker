# ADR 0024: Acceptance of API auth gap — no server-side session check in API routes

- **Status**: Accepted (limitation — technical debt)
- **Date**: 2026-11-17
- **Owner**: Backend / Security

## Context

NextAuth is wired up (ADR 0004) and the **UI** is gated behind `useSession()` in
`AppShell` — unauthenticated visitors see the `LoginCard` and never reach the
dashboard / map / logs.

However, the **API route handlers** themselves (`/api/agents`, `/api/orders`,
`/api/logs`, `/api/alerts`, `/api/agents/[id]`) currently do **not** call
`getServerSession(authOptions)` before reading or writing the DB.

A helper `requireSupervisor()` exists in `src/lib/session.ts`, but it is **not
invoked** by any handler.

## Decision

**Accept this gap for the current build** and document it as known debt.

- The UI gate prevents casual access.
- The endpoints are not exposed beyond the sandbox preview URL.
- The helper `requireSupervisor()` is kept in place so the fix is a one-line
  addition per handler.

## Consequences

**Positive:**
- Zero friction for the demo — no risk of a 401 breaking a flow mid-demo.
- The TanStack Query / mutation code stays simple (no retry-on-401 path).

**Negative (significant):**
- Anyone who can reach the sandbox preview URL can `curl /api/agents` and
  read every agent's position, geofence, phone, etc. without credentials.
- Anyone can `POST /api/agents` or `DELETE /api/agents/:id` without
  credentials.
- This is **not acceptable for a real securities-company deployment** and
  must be fixed before any production use.

**Risks / accepted trade-offs:**
- This is the most important technical-debt item in the project.

## Remediation plan (not yet implemented)

1. In every route handler, add at the top:
   ```ts
   const session = await requireSupervisor();
   if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   ```
2. In the client, add a TanStack Query `onError` that intercepts 401s and
   calls `signOut({ callbackUrl: "/" })`.
3. Add a test that hits `/api/agents` without a session and asserts 401.
4. Consider moving shared auth + DB access into a single
   `withSupervisor(handler)` wrapper to eliminate per-route boilerplate.

## Alternatives considered

- **Fix it now** — would have added ~30 minutes and a 401-retry path to the
  client. Accepted as debt because the user's task was a working demo and
  the UI gate is sufficient for the sandbox.
- **Middleware-based auth** — `next-auth/middleware` can protect entire path
  prefixes in one shot. Cleaner than per-route checks; should be the actual
  remediation, but it doesn't change the per-route DTO contract.

## References

- `src/lib/session.ts` (`requireSupervisor` — defined, unused)
- `src/lib/auth.ts` (`authOptions`)
- `src/app/api/**/route.ts` (every handler — no auth check)
- `src/components/app-shell.tsx` (UI gate, the only current protection)
