# SentinelSec

> Field Operations Platform for securities companies — track every agent, enforce every geofence, dispatch every order.

SentinelSec is a security operations console that shows you where every field guard is right now, alerts you the moment one leaves their assigned zone, and lets you push orders directly to their device.

Built with **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4** + **shadcn/ui**, **Prisma ORM** on **PostgreSQL 17**, **NextAuth.js v4** for auth, **Leaflet** for the live map, and **TanStack Query** for live server state.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Quick start (Docker)](#quick-start-docker) — fastest path
4. [Manual setup](#manual-setup) — local dev without Docker
5. [Database setup & migrations](#database-setup--migrations)
6. [Demo credentials](#demo-credentials)
7. [Routes](#routes)
8. [Project structure](#project-structure)
9. [How the live GPS simulator works](#how-the-live-gps-simulator-works)
10. [Production deployment](#production-deployment)
11. [Troubleshooting](#troubleshooting)

---

## Features

- **Live GPS tracking** — every agent's position on a dark tactical map, polled every 3 seconds.
- **Geofence enforcement** — supervisor draws each agent's work area as a polygon. The moment an agent steps outside, an alert fires.
- **Attendance logging** — automatic `check_in` / `check_out` rows the moment an agent enters or leaves their geofence. Departure and arrival times are recorded to the second.
- **Instant alerts** — bell badge in the topbar lights up the moment an agent leaves their zone or re-enters it.
- **Order dispatch** — supervisor clicks an agent on the map → types a priority-tagged order → agent's console lights up within seconds.
- **Two role-based consoles**:
  - **Supervisor console** at `/dashboard` — roster table, live map, geofence drawing, order dispatch, attendance + alert logs.
  - **Agent console** at `/agent` — focused idle screen with live position, zone status, order list, acknowledge / mark-complete buttons, browser notifications.

---

## Tech stack

| Layer            | Choice                                            |
| ---------------- | ------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Turbopack)                |
| Language         | TypeScript 5                                       |
| UI               | Tailwind CSS 4 + shadcn/ui (New York)             |
| Icons            | lucide-react                                       |
| Map              | Leaflet 1.9 + react-leaflet 5 (CARTO dark tiles)  |
| Database         | PostgreSQL 17                                       |
| ORM              | Prisma 6                                           |
| Auth             | NextAuth.js v4 (Credentials provider, JWT)        |
| Forms            | react-hook-form + zod                             |
| Server state     | TanStack Query v5                                 |
| Password hashing | bcryptjs                                           |
| Notifications    | sonner (toasts) + browser Notification API        |
| Runtime          | Bun (dev) / Node.js (production standalone)       |

---

## Quick start (Docker)

The fastest way to a running app. Requires **Docker 20.10+** and **Docker Compose v2**.

```bash
# 1. Clone + enter the repo
git clone <your-repo-url> sentinelsec
cd sentinelsec

# 2. Copy the env template and edit if needed
cp .env.example .env
#   Default values work out of the box for local Docker.

# 3. Build + start everything (Postgres + app)
docker compose up --build
```

The first start will:

1. Pull `postgres:17-alpine` and start it.
2. Build the app image (multi-stage: deps → build → runner).
3. Run the app container's entrypoint, which:
   - Applies Prisma migrations (`prisma migrate deploy`)
   - Seeds the demo supervisor + 4 agents (`bun prisma/seed.ts`)
   - Starts the Next.js standalone server on port 3000.

Open **http://localhost:3000** and sign in with the [demo credentials](#demo-credentials).

Useful Docker commands:

```bash
# Tail app logs
docker compose logs -f app

# Tail Postgres logs
docker compose logs -f postgres

# Stop everything (data volume persists)
docker compose down

# Stop + wipe the Postgres data volume (fresh start)
docker compose down -v
```

---

## Manual setup

For local development without Docker. Requires:

- **Node.js 20+** or **Bun 1.1+**
- **PostgreSQL 14+** running somewhere you can reach
- A POSIX shell (Linux / macOS / WSL)

### Step 1 — Install dependencies

```bash
bun install
```

### Step 2 — Configure environment

Create `.env` at the project root (or copy from `.env.example` and edit):

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=run-openssl-rand-hex-32-to-generate
```

> **Note**: This repo's `package.json` scripts inline a default `DATABASE_URL`
> pointing at `postgresql://sentinel@localhost:5433/sentinel_sec`. If your
> Postgres is elsewhere, either edit the scripts or export `DATABASE_URL`
> before running them.

### Step 3 — Initialize the database

```bash
# Apply all migrations (creates tables)
bun run db:migrate:deploy

# Seed demo data (supervisor + 4 agents)
bun run db:seed
```

### Step 4 — Run the dev server

```bash
bun run dev
```

Open **http://localhost:3000**.

### Step 5 — Lint (optional)

```bash
bun run lint
```

---

## Database setup & migrations

### For a fresh DB (new setup, prod deploy)

```bash
# Apply all committed migrations (idempotent — safe to re-run)
bun run db:migrate:deploy

# Seed the demo supervisor + 4 agents (idempotent)
bun run db:seed
```

These two commands are what the Docker entrypoint runs automatically.

### For schema changes during development

```bash
# Edit prisma/schema.prisma, then:
bun run db:migrate -- --name your_change_name

# This:
#   1. Creates a new prisma/migrations/<timestamp>_your_change_name/migration.sql
#   2. Applies it to the dev DB
#   3. Regenerates the Prisma client
```

### To wipe everything and start over

```bash
bun run db:migrate:reset        # drops + recreates + applies all migrations
bun run db:seed                  # re-seed demo data
```

### Migration files

```
prisma/
  schema.prisma                          # Prisma schema (source of truth)
  seed.ts                                # Idempotent seed script
  migrations/
    └─ 20261117081156_init/
        └── migration.sql                # Initial schema (all tables + indexes)
```

---

## Demo credentials

After seeding, the following accounts exist:

| Role       | Identifier                 | Secret        | Where to use                |
| ---------- | -------------------------- | ------------- | --------------------------- |
| Supervisor | `supervisor@sentinel.sec`  | `Sentinel#2025` | `/login` → Supervisor tab  |
| Agent      | `SC-0142` (badge ID)       | `0142` (PIN)  | `/login` → Agent tab        |
| Agent      | `SC-0143`                  | `0143`        | `/login` → Agent tab        |
| Agent      | `SC-0144`                  | `0144`        | `/login` → Agent tab        |
| Agent      | `SC-0145`                  | `0145`        | `/login` → Agent tab        |

**Agent PIN rule**: PIN = last 4 digits of the badge ID. So `SC-0142` → `0142`.

---

## Routes

| Path         | Auth required | Description                                                                  |
| ------------ | ------------- | ---------------------------------------------------------------------------- |
| `/`          | No            | Public home page (navbar, hero, features, roles, CTA).                       |
| `/login`     | No            | Login page with role toggle (Supervisor / Agent). Auto-redirects if authed. |
| `/dashboard` | Supervisor    | Supervisor console: dashboard / live map / logs.                            |
| `/agent`     | Agent         | Agent console: live position, zone status, shift orders.                    |

Auth protection is client-side via `useSession()`. Unauthenticated visitors are redirected to `/login`; an authed supervisor hitting `/agent` is bounced to `/dashboard` and vice-versa.

---

## Project structure

```
.
├── Dockerfile                       # Multi-stage production image
├── docker-compose.yml               # Postgres + app, with healthcheck
├── docker-entrypoint.sh             # migrate deploy + seed + start server
├── .env.example                     # Template for env vars
├── .dockerignore
├── README.md                        # This file
├── package.json                     # Scripts inline DATABASE_URL for convenience
├── next.config.ts
├── prisma/
│   ├── schema.prisma                # 5 models: Supervisor, Agent, Order, AttendanceLog, Alert
│   ├── seed.ts                      # Idempotent seed script
│   └── migrations/                  # Committed migration SQL
└── src/
    ├── app/
    │   ├── layout.tsx               # Root layout: Providers + Toaster
    │   ├── page.tsx                 # / → HomePage
    │   ├── login/page.tsx           # /login → LoginCard
    │   ├── dashboard/page.tsx       # /dashboard → SupervisorShell (auth-gated)
    │   ├── agent/page.tsx           # /agent → AgentIdlePage (auth-gated)
    │   ├── globals.css              # Security-ops dark theme + Leaflet overrides
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts
    │       ├── agents/route.ts             # GET list, POST create
    │       ├── agents/[id]/route.ts        # PATCH update, DELETE
    │       ├── agents/me/route.ts          # GET current agent (agent role)
    │       ├── orders/route.ts             # GET list, POST dispatch
    │       ├── orders/[id]/route.ts        # PATCH acknowledge / done
    │       ├── logs/route.ts               # GET attendance logs
    │       ├── alerts/route.ts             # GET alerts
    │       ├── alerts/[id]/read/route.ts   # POST/DELETE mark read
    │       └── seed/route.ts               # POST idempotent seed (HTTP version)
    ├── components/
    │   ├── home/                    # Public navbar + HomePage
    │   ├── auth/login-card.tsx      # Role toggle + supervisor/agent forms
    │   ├── nav/                     # TopBar + SideNav (supervisor shell)
    │   ├── dashboard/               # StatsCards, AgentsTable, AddAgentDialog, etc.
    │   ├── map/                     # MapView, LeafletMap, AgentDetailDrawer, SendOrderForm
    │   ├── logs/logs-view.tsx
    │   ├── agent/                   # AgentIdlePage + OrderCard
    │   ├── app/supervisor-shell.tsx
    │   ├── providers/providers.tsx  # Session + Theme + QueryClient
    │   └── common/full-screen-loader.tsx
    ├── hooks/use-data.ts            # TanStack Query hooks (agents, orders, logs, alerts)
    ├── lib/
    │   ├── db.ts                    # Prisma client singleton
    │   ├── auth.ts                  # NextAuth options (dual-role credentials)
    │   ├── types.ts                 # Shared DTOs
    │   ├── geofence.ts              # parseGeofence, isPointInPolygon (ray-casting), randomWalk
    │   ├── format.ts                # timeAgo, fmtDateTime, fmtCoords
    │   ├── serializers.ts           # Prisma row → DTO
    │   └── simulator.ts             # Server-side GPS simulator (singleton interval)
    └── types/next-auth.d.ts         # Type augmentation for role + agentId
```

---

## How the live GPS simulator works

In a production deployment, each agent's mobile device would push GPS pings to an ingest endpoint. For this demo, the positions move on their own via a server-side simulator in [`src/lib/simulator.ts`](src/lib/simulator.ts):

- A singleton `setInterval` ticks every **4 seconds**.
- On each tick, every agent's lat/lng is nudged by a small random walk (≤ 25 m in a random bearing).
- With ~10% probability per tick, the agent is biased **outward** from the geofence centroid — so exits actually happen during a demo.
- The simulator tracks each agent's previous inside/outside state in memory and fires:
  - On **exit**: `geofence_exit` + `check_out` attendance logs + an `Alert(geofence_exit)` + flips status to `off_duty`.
  - On **re-enter**: `geofence_reenter` + `check_in` attendance logs + an `Alert(geofence_reenter)` + flips status to `on_duty`.
- The simulator is started lazily by every API route via `startSimulator()` (idempotent — guarded by a module-level flag).
- The client polls `/api/agents` every 3 s (TanStack Query `refetchInterval`) to see the live positions.

To remove the simulator in a real deployment: delete `src/lib/simulator.ts`, remove the `startSimulator()` calls from the API routes, and add a `POST /api/agents/[id]/ping` ingest endpoint that mobile devices hit.

---

## Production deployment

### Environment variables you MUST set

| Variable          | Required | Example                                              |
| ----------------- | -------- | ---------------------------------------------------- |
| `DATABASE_URL`    | Yes      | `postgresql://user:pass@host:5432/db?schema=public` |
| `NEXTAUTH_URL`    | Yes      | `https://sentinelsec.yourcompany.com`                |
| `NEXTAUTH_SECRET` | Yes      | 64-char hex string from `openssl rand -hex 32`       |

### Build + run with Docker

```bash
# Build the image
docker build -t sentinelsec .

# Run with an external Postgres
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@postgres-host:5432/sentinel_sec?schema=public" \
  -e NEXTAUTH_URL="https://sentinelsec.yourcompany.com" \
  -e NEXTAUTH_SECRET="$(openssl rand -hex 32)" \
  sentinelsec
```

The container's entrypoint will automatically:
1. Apply pending Prisma migrations (`prisma migrate deploy`).
2. Run the seed script (idempotent — safe on a populated DB).
3. Start the Next.js standalone server.

### Build + run without Docker

```bash
# Build the standalone Next.js output
bun run build

# Apply migrations to your prod Postgres
DATABASE_URL="your-prod-url" bunx prisma migrate deploy

# Seed (idempotent)
DATABASE_URL="your-prod-url" bun prisma/seed.ts

# Start the standalone server
NODE_ENV=production node .next/standalone/server.js
```

### Security checklist before going live

- [ ] Rotate `NEXTAUTH_SECRET` to a strong random value.
- [ ] Move the supervisor password from the hardcoded `Sentinel#2025` to a value the operator chooses on first run.
- [ ] Add **server-side session checks** (`getServerSession`) to every API route — currently the routes trust the network boundary (see ADR 0024).
- [ ] Switch agent PIN storage from plaintext to bcrypt.
- [ ] Replace the demo simulator with real GPS ingest.
- [ ] Configure CORS / CSP headers for your domain.
- [ ] Set up log shipping (the `tee dev.log` in the dev script is dev-only).

---

## Troubleshooting

### `Error: the URL must start with the protocol postgresql://`

Your shell has a stale `DATABASE_URL` env var (often set to a SQLite path by system scaffolding). Either:

- Run the package.json scripts as-is (they inline the correct Postgres URL), or
- Explicitly export the right value: `export DATABASE_URL="postgresql://..."`.

### Prisma migration wants to reset the DB

If `bun run db:migrate` complains about drift, it's because the DB was previously synced with `db:push` instead of migrations. To fix:

```bash
bun run db:migrate:reset      # drops + recreates + applies all migrations
bun run db:seed                # re-seed demo data
```

### Dev server doesn't pick up schema changes

After editing `prisma/schema.prisma`:

```bash
bun run db:migrate -- --name your_change   # creates + applies migration
# Then restart the dev server.
```

### Map tiles don't load

The map uses CARTO's free raster tiles (`basemaps.cartocdn.com/dark_all`). If your network blocks these, the map background will be dark but markers and polygons still render. For an air-gapped deployment, self-host the tiles or switch to Mapbox / Google Maps with an API key (see `src/components/map/leaflet-map.tsx` — single-file swap).

### Port 5433 already in use

The default Postgres port in this repo is 5433 (to avoid clashing with a local Postgres on 5432). To change it, edit `package.json` scripts and `.env`.

---

## License

Internal project. All rights reserved.
