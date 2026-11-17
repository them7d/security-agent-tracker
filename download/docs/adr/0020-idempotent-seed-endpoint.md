# ADR 0020: Idempotent POST /api/seed for demo data

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Backend

## Context

The app needs demo data on first run: a supervisor account + four sample
agents with geofences around a known reference point (Baghdad, see ADR 0025).
Running a seed script manually is friction in the sandbox; we want the client
to be able to trigger seeding itself.

## Decision

Expose **`POST /api/seed`** as an **idempotent** endpoint:

- If the supervisor email doesn't exist → create with `bcrypt.hash("Sentinel#2025", 10)`.
- For each predefined demo agent (`SEED_AGENTS` array), if the `badgeId`
  doesn't exist → create with a square geofence (80 m half-size) around the
  start position, and write an initial `check_in` log row.
- The response includes the supervisor email + password (so the response can
  be inspected if the user forgets the demo creds) and the list of newly
  seeded badge IDs.
- The client (`AppShell`) calls `useSeed().mutate()` once on first
  authenticated render, ignoring errors.

## Consequences

**Positive:**
- First-login experience is "open the app → sign in with the prefilled creds
  → demo data already there".
- Repeated calls are safe — running it twice creates nothing new.
- Seeded agents start inside their geofence with a `check_in` log, so the
  initial state is consistent.

**Negative:**
- The seed password is returned in the HTTP response body. Acceptable for a
  sandbox demo; unacceptable for prod. In prod this endpoint would be
  disabled or admin-gated.
- Demo agent identities (Karim Haddad, Layla Saleh, Omar Najib, Dina Farouk)
  are hardcoded in the route file. Swapping them requires a code change.

**Risks / accepted trade-offs:**
- If the DB is reset (`prisma migrate reset`) the client will reseed on next
  authenticated render — desirable.

## Alternatives considered

- **`prisma/seed.ts` script run via `bun run db:seed`** — requires a separate
  npm script and a shell step; the sandbox auto-starts the dev server but
  doesn't run seed scripts.
- **Seed-on-first-render in the layout (server component)** — would mix
  concerns and run on every request unless carefully memoised.

## References

- `src/app/api/seed/route.ts`
- `src/components/app-shell.tsx` (`useSeed()` effect)
- `src/hooks/use-data.ts` (`useSeed`)
