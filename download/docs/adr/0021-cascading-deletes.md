# ADR 0021: Cascading deletes via Prisma `onDelete: Cascade`

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Backend

## Context

When a supervisor deletes an agent, the dependent rows (orders dispatched to
them, attendance logs, alerts) should not be left orphaned in the DB — they
would show as `agentId` pointing at a non-existent agent and break the
serializers' `.include({ agent: { select: { name, badgeId } } })`.

## Decision

Declare **`onDelete: Cascade`** on every relation from a child table back to
`Agent`:

```prisma
model Order {
  agentId String
  agent   Agent  @relation(fields: [agentId], references: [id], onDelete: Cascade)
  ...
}
model AttendanceLog {
  agent   Agent  @relation(fields: [agentId], references: [id], onDelete: Cascade)
  ...
}
model Alert {
  agent   Agent  @relation(fields: [agentId], references: [id], onDelete: Cascade)
  ...
}
```

`DELETE /api/agents/:id` is then a single `db.agent.delete({ where: { id } })`
call — Prisma + SQLite handle the rest transactionally.

## Consequences

**Positive:**
- No orphaned rows; the API responses stay clean after a delete.
- One DB call per delete — fast and atomic.
- The TanStack Query `useDeleteAgent` `onSuccess` invalidates the `agents`,
  `orders`, `logs`, and `alerts` query keys so every open view refreshes.

**Negative:**
- Deletion is **irrecoverable**. If a supervisor deletes an agent by mistake,
  their full history is gone. The UI mitigates this with an `AlertDialog`
  confirmation ("This will permanently remove the agent, their order
  history, attendance logs and alerts. This action cannot be undone.").

**Risks / accepted trade-offs:**
- A production deployment with compliance requirements (e.g. securities
  regulators requiring audit trails) would want **soft deletes** instead —
  a `deletedAt` column on `Agent` and a filter on every read.

## Alternatives considered

- **Soft delete (`deletedAt: DateTime?`)** — preserves history; rejected for
  the demo because it adds a filter to every query and the user didn't ask
  for it. Worth revisiting for prod.
- **Restrict + manual cascade** — would force the API to delete children
  explicitly; more code, no benefit at this scale.
- **Set null** — would break the serializers' optional `agent` include.

## References

- `prisma/schema.prisma` (each child model's `agent` relation)
- `src/app/api/agents/[id]/route.ts` (`DELETE`)
- `src/components/dashboard/agents-table.tsx` (confirmation dialog)
- `src/hooks/use-data.ts` (`useDeleteAgent.onSuccess` invalidations)
