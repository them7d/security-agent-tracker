# SentinelSec — Architecture Decision Records

This directory captures every significant architectural and engineering decision made
while building the SentinelSec field-agent tracking console. Each ADR follows the
Michael Nygard format (Context / Decision / Consequences / Alternatives) and is
intentionally short — these are **decisions**, not tutorials.

## Index

| #   | Title                                                                                        | Status     |
| --- | -------------------------------------------------------------------------------------------- | ---------- |
| 0001 | [Use Next.js 16 App Router with TypeScript](0001-use-nextjs-16-app-router-with-typescript.md) | Accepted   |
| 0002 | [Use shadcn/ui (New York) + Tailwind CSS 4](0002-use-shadcn-new-york-with-tailwind-4.md)      | Accepted   |
| 0003 | [Use Prisma ORM with SQLite](0003-use-prisma-orm-with-sqlite.md)                              | Accepted   |
| 0004 | [Use NextAuth.js v4 credentials provider with JWT sessions](0004-use-nextauth-credentials-jwt.md) | Accepted |
| 0005 | [Use TanStack Query polling instead of WebSocket](0005-use-tanstack-query-polling.md)         | Accepted   |
| 0006 | [Use Leaflet + CARTO dark tiles instead of Google Maps](0006-use-leaflet-not-google-maps.md)  | Accepted   |
| 0007 | [Single-page app with tab navigation, only one route at `/`](0007-single-page-tab-navigation.md) | Accepted |
| 0008 | [Security-ops dark navy + amber visual theme](0008-security-ops-dark-theme.md)                 | Accepted   |
| 0009 | [Store geofence as a JSON-encoded polygon on the Agent row](0009-geofence-as-json-on-agent.md) | Accepted   |
| 0010 | [Ray-casting algorithm for point-in-polygon](0010-ray-casting-point-in-polygon.md)            | Accepted   |
| 0011 | [Server-side GPS simulator singleton with in-memory inside/outside state](0011-server-side-gps-simulator-singleton.md) | Accepted |
| 0012 | [Geofence enforcement: exit → check_out + alert + off_duty; reenter → check_in + alert + on_duty](0012-geofence-enforcement-semantics.md) | Accepted |
| 0013 | [react-hook-form + zod + @hookform/resolvers for all forms](0013-react-hook-form-zod.md)      | Accepted   |
| 0014 | [Sonner for toast notifications](0014-sonner-for-toasts.md)                                   | Accepted   |
| 0015 | [date-fns for time formatting](0015-date-fns-for-time-formatting.md)                          | Accepted   |
| 0016 | [Geofence drawing UX: click-to-drop numbered polygon vertices](0016-geofence-drawing-ux.md)   | Accepted   |
| 0017 | [Agent markers: L.divIcon with CSS pulse animation](0017-agent-markers-divicon-pulse.md)      | Accepted   |
| 0018 | [Differential polling intervals per data type](0018-differential-polling-intervals.md)        | Accepted   |
| 0019 | [RESTful API route handlers (not tRPC or Server Actions)](0019-rest-route-handlers.md)         | Accepted   |
| 0020 | [Idempotent POST /api/seed for demo data](0020-idempotent-seed-endpoint.md)                   | Accepted   |
| 0021 | [Cascading deletes via Prisma `onDelete: Cascade`](0021-cascading-deletes.md)                 | Accepted   |
| 0022 | [next-themes with forced dark mode](0022-next-themes-forced-dark.md)                          | Accepted   |
| 0023 | [Probabilistic outward GPS bias for demo visibility](0023-probabilistic-outward-gps-bias.md)  | Accepted   |
| 0024 | [Acceptance of API auth gap — no server-side session check in API routes](0024-api-auth-gap.md) | Accepted (limitation) |
| 0025 | [Reference location: downtown Baghdad (Asia/Baghdad timezone)](0025-baghdad-reference-location.md) | Accepted |

## How to read these

- **Status "Accepted"** = currently in effect.
- **Status "Accepted (limitation)"** = in effect but flagged as technical debt to revisit.
- **Status "Superseded"** = none yet; would link to the replacing ADR.
- **Status "Deprecated"** = none yet.

## When to add a new ADR

Any time you make a decision that:
- is hard to reverse (database schema, auth strategy, public API shape),
- has more than one reasonable alternative,
- will surprise a future maintainer who reads only the code,

…write a new ADR, bump the next number, and add it to the table above.
