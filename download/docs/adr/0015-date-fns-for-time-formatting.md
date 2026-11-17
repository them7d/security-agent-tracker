# ADR 0015: date-fns for time formatting

- **Status**: Accepted
- **Date**: 2026-11-17
- **Owner**: Frontend

## Context

The UI shows timestamps in three styles: "less than a minute ago" (relative),
"2026-11-17 06:47:05" (absolute, in logs), and "06:47:05" (time only). The
skill stack already had `date-fns` v4 installed.

## Decision

Use **`date-fns` v4** with three thin helpers in `src/lib/format.ts`:

- `timeAgo(iso)` → `formatDistanceToNow(new Date(iso), { addSuffix: true })`
  — used in table "Last seen" cells and the alerts feed.
- `fmtDateTime(iso)` → `format(new Date(iso), "yyyy-MM-dd HH:mm:ss")` — used
  in the logs table.
- `fmtTime(iso)` → `format(new Date(iso), "HH:mm:ss")`.
- All helpers are wrapped in try/catch so a malformed ISO never crashes a
  render; they fall back to `"—"`.

## Consequences

**Positive:**
- Tree-shakeable imports — only the used functions are bundled.
- Locale-aware if we later add `date-fns/locale`.
- Consistent formatting across the app via the three helpers.

**Negative:**
- `date-fns` operates on `Date` objects, which means the timestamps are
  formatted in the **browser's local timezone**, not the user's stated
  timezone (Asia/Baghdad). For a multi-region prod deployment this would
  matter; for the sandbox it's fine.

**Risks / accepted trade-offs:**
- If timezone-strict formatting becomes a requirement, swap to
  `date-fns-tz`'s `formatInTimeZone` or `Intl.DateTimeFormat` with
  `timeZone: "Asia/Baghdad"`.

## Alternatives considered

- **dayjs** — smaller bundle, similar API; not in the skill stack.
- **Native `Intl.DateTimeFormat`** — zero deps but verbose for relative time.
- **Luxon** — heavier, more opinionated.

## References

- `src/lib/format.ts`
- `src/components/dashboard/agents-table.tsx`, `src/components/dashboard/recent-orders.tsx`,
  `src/components/nav/topbar.tsx`, `src/components/logs/logs-view.tsx`
