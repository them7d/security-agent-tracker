# ADR 0003: Use Prisma ORM with SQLite

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Backend

## Context

The app needs a small, real relational store: supervisors, agents, orders,
attendance logs, alerts — with relations and cascading deletes. The sandbox skill
stack ships with Prisma + SQLite already configured (`prisma/schema.prisma`,
`src/lib/db.ts`).

## Decision

Use **Prisma ORM** against a **SQLite** file at `db/custom.db` (`DATABASE_URL`).

- One Prisma schema (`prisma/schema.prisma`) defines `Supervisor`, `Agent`,
  `Order`, `AttendanceLog`, `Alert`.
- A shared `db` singleton is exported from `src/lib/db.ts` to avoid exhausting
  connections on hot reload in dev.
- Schema changes are pushed with `bun run db:push` (`prisma db push
  --accept-data-loss`), which is acceptable for a local-file SQLite dev DB.
- Prisma's TypeScript types are reused as the source of truth for server-side
  entity shapes; client-facing DTOs are produced by `src/lib/serializers.ts`.

## Consequences

**Positive:**
- Single source of truth for schema + types; no manual type drift.
- Relations and `onDelete: Cascade` are declarative (see ADR 0021).
- Migrating to Postgres later is a one-line `datasource` change.

**Negative:**
- SQLite has no real concurrent-write throughput — fine for a single-supervisor
  demo, not for production multi-tenant.
- `db:push --accept-data-loss` is risky in a real environment; for prod we'd
  switch to `prisma migrate`.

**Risks / accepted trade-offs:**
- The simulator writes to the DB every 4s per agent (see ADR 0011). With SQLite
  this is fine for ~tens of agents; it would need rethinking at hundreds.

## Alternatives considered

- **Drizzle ORM** — lighter, but not in the sandbox skill stack.
- **Raw SQL via better-sqlite3** — faster, but loses type safety and migrations.
- **Postgres directly** — overkill for the sandbox; can swap later.

## References

- `prisma/schema.prisma`
- `src/lib/db.ts`
- `src/lib/serializers.ts`
