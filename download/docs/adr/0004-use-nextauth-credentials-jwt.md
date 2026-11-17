# ADR 0004: Use NextAuth.js v4 credentials provider with JWT sessions

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Backend / Security

## Context

The user chose "NextAuth" in the clarifying questions. The supervisor logs in with
an email + password; there is no third-party IdP. The skill stack ships with
NextAuth v4.

## Decision

Use **NextAuth.js v4** with the **Credentials provider** and **JWT session
strategy**.

- Supervisor row lives in Prisma (`Supervisor` model, `passwordHash` field).
- Passwords are hashed with **bcryptjs** (`src/lib/auth.ts`), never stored in
  plaintext.
- `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set in `.env` (dev secret is
  hardcoded for the sandbox; in prod this would come from a secret manager).
- The session is a JWT — no server-side session table.
- Session is exposed to the client via `<SessionProvider>` in
  `src/components/providers/providers.tsx`.
- Login form (`src/components/auth/login-card.tsx`) calls `signIn("credentials",
  { redirect: false })` so we can show inline toasts.

## Consequences

**Positive:**
- Minimal moving parts; no extra session DB table.
- JWT survives process restarts (important for the sandbox's hot reload).
- Type augmentation in `src/types/next-auth.d.ts` adds `user.id` to the
  session, so client components can read the supervisor id.

**Negative:**
- Credentials provider is the least-preferred NextAuth strategy — it can't
  leverage HTTP-only cookies + OAuth flows. For a securities-company prod
  deployment we'd want SSO (e.g. Azure AD / Okta) via an OAuth provider.
- JWT session invalidation is "delete the cookie" — there's no global logout.

**Risks / accepted trade-offs:**
- The dev secret in `.env` is **not** production-safe. Rotate before any real
  deployment.
- See ADR 0024: the API routes themselves do **not** currently call
  `getServerSession` — they trust the network boundary. This is flagged debt.

## Alternatives considered

- **PIN-only gate (no NextAuth)** — rejected; user explicitly asked for NextAuth.
- **OAuth (Google / Azure AD)** — better for prod, but requires real client
  credentials not available in the sandbox.
- **Database session strategy** — needs a sessions table; JWT is simpler for
  this scale.

## References

- `src/lib/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/components/auth/login-card.tsx`
- `src/components/providers/providers.tsx`
- `src/types/next-auth.d.ts`
- `.env` (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`)
