# SentinelSec

> Field Operations Platform for securities companies — track every agent, enforce every geofence, dispatch every order.

SentinelSec is a security operations console that shows you where every field guard is right now, alerts you the moment one leaves their assigned zone, and lets you push orders directly to their device.

Built with **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4** + **shadcn/ui**, **Prisma ORM** on **PostgreSQL 17**, **NextAuth.js v4** for auth, **Leaflet** for the live map, and **TanStack Query** for live server state.

---

## Table of contents

1. [Features](#features)
2. [Quick start (Docker)](#quick-start-docker) — fastest path
3. [Running without docker-compose](#running-without-docker-compose)
4. [Manual setup](#manual-setup) — local dev without Docker
5. [Database setup & migrations](#database-setup--migrations)
6. [Demo credentials](#demo-credentials)
7. [Routes](#routes)
8. [Project structure](#project-structure)
9. [How the live GPS simulator works](#how-the-live-gps-simulator-works)
10. [Troubleshooting](#troubleshooting)

---

## Features

- **Live GPS tracking** — every agent's position on a dark tactical map, polled every 3 seconds.
- **Geofence enforcement** — supervisor draws each agent's work area as a polygon. The moment an agent steps outside, an alert fires.
- **Attendance logging** — automatic `check_in` / `check_out` rows the moment an agent enters or leaves their geofence. Times recorded to the second.
- **Instant alerts** — bell badge in the topbar lights up the moment an agent leaves their zone or re-enters it.
- **Order dispatch** — supervisor clicks an agent on the map → types a priority-tagged order → agent's console lights up within seconds.
- **Two role-based consoles**:
  - **Supervisor console** at `/dashboard` — roster table, live map, geofence drawing, order dispatch, attendance + alert logs.
  - **Agent console** at `/agent` — focused idle screen with live position, zone status, order list, acknowledge / mark-complete buttons, browser notifications.

---

## Quick start (Docker)

The fastest way to a running app. Requires **Docker 20.10+** and **Docker Compose v2**.

```bash
# 1. Clone + enter the repo
git clone <your-repo-url> sentinelsec
cd sentinelsec

# 2. (Optional) Copy the env template — defaults work out of the box
cp .env.example .env

# 3. Build + start everything (Postgres + app)
docker compose up --build
```

The first start will:

1. Pull `postgres:17-alpine` and start it (with a healthcheck).
2. Build the app image (multi-stage: deps → build → runner).
3. Run the app container's entrypoint, which:
   - Resolves `DATABASE_URL` (set automatically by docker-compose to point at the `postgres` service)
   - Waits for Postgres to accept connections
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

### How the DB auto-links

`docker-compose.yml` puts both services on a shared `sentinelsec-net` Docker network. The app's `DATABASE_URL` uses the service name `postgres` as the hostname (`postgresql://…@postgres:5432/…`), and the app container has `depends_on: postgres: condition: service_healthy` so it never starts before Postgres is ready.

**Zero-config:** you do NOT need a `.env` file — every variable has a default (`sentinel` / `sentinel` / `sentinel_sec`). Copy `.env.example` to `.env` only if you want to change credentials, ports, or the NextAuth URL/secret.

---

## Running without docker-compose

The app image's entrypoint is smart: if `DATABASE_URL` is missing but the hostname `postgres` resolves (i.e. you're on a Docker network with a `postgres` container), it auto-constructs the default URL. Otherwise it prints exact instructions and exits.

### Plain `docker run` with a Postgres container

```bash
# 1. Network
docker network create sentinelsec-net

# 2. Postgres
docker run -d --name sentinelsec-postgres --network sentinelsec-net \
  -e POSTGRES_USER=sentinel -e POSTGRES_PASSWORD=sentinel \
  -e POSTGRES_DB=sentinel_sec postgres:17-alpine

# 3. App (entrypoint auto-detects the postgres host on the same network)
docker run --network sentinelsec-net -p 3000:3000 \
  -e NEXTAUTH_URL='http://localhost:3000' \
  -e NEXTAUTH_SECRET='change-me' \
  sentinelsec-app
```

### Plain `docker run` with an external Postgres

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL='postgresql://USER:PASS@HOST:5432/DBNAME?schema=public' \
  -e NEXTAUTH_URL='http://localhost:3000' \
  -e NEXTAUTH_SECRET='change-me' \
  sentinelsec-app
```

---

## Manual setup

For local development without Docker. Requires:

- **Bun 1.2+** (or Node.js 20+)
- **PostgreSQL 14+** running somewhere you can reach

### Step 1 — Install dependencies

```bash
bun install
```

### Step 2 — Configure environment

Create `.env` at the project root:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=run-openssl-rand-hex-32-to-generate
```

> **Note**: This repo's `package.json` scripts inline a default `DATABASE_URL`
> pointing at `postgresql://sentinel:sentinel@localhost:5433/sentinel_sec`.
> If your Postgres is elsewhere, edit the scripts or export `DATABASE_URL`.

### Step 3 — Initialize the database

```bash
bun run db:migrate:deploy   # apply all migrations (creates tables)
bun run db:seed             # seed demo supervisor + 4 agents
```

### Step 4 — Run the dev server

```bash
bun run dev
```

Open **http://localhost:3000**.

---

## Database setup & migrations

### For a fresh DB (new setup, prod deploy)

```bash
bun run db:migrate:deploy   # idempotent — safe to re-run
bun run db:seed             # idempotent — safe to re-run
```

These two commands are what the Docker entrypoint runs automatically.

### For schema changes during development

```bash
# Edit prisma/schema.prisma, then:
bun run db:migrate -- --name your_change_name
```

### To wipe everything and start over

```bash
bun run db:migrate:reset    # drops + recreates + applies all migrations
bun run db:seed
```

### Migration files

```
prisma/
  schema.prisma                          # Prisma schema (source of truth)
  seed.ts                                # Idempotent seed script
  migrations/
    └─ <timestamp>_init/
        └── migration.sql                # Initial schema (all tables + indexes)
```

---

## Demo credentials

| Role       | Identifier                | Secret         | Where to use               |
| ---------- | ------------------------- | -------------- | -------------------------- |
| Supervisor | `supervisor@sentinel.sec` | `Sentinel#2025` | `/login` → Supervisor tab |
| Agent      | `SC-0142` (badge ID)      | `0142` (PIN)   | `/login` → Agent tab       |
| Agent      | `SC-0143`                 | `0143`         | `/login` → Agent tab       |
| Agent      | `SC-0144`                 | `0144`         | `/login` → Agent tab       |
| Agent      | `SC-0145`                 | `0145`         | `/login` → Agent tab       |

**Agent PIN rule**: PIN = last 4 digits of the badge ID (`SC-0142` → `0142`).

---

## Routes

| Path         | Auth required | Description                                        |
| ------------ | ------------- | -------------------------------------------------- |
| `/`          | No            | Public home page (navbar, hero, features, roles).  |
| `/login`     | No            | Login with role toggle. Auto-redirects if authed.  |
| `/dashboard` | Supervisor    | Supervisor console: dashboard / map / logs.        |
| `/agent`     | Agent         | Agent console: position, zone, shift orders.       |

---

## Project structure

```
.
├── Dockerfile                       # Multi-stage production image (bun 1.3)
├── docker-compose.yml               # Postgres + app, auto-linked, healthchecked
├── docker-entrypoint.sh             # resolves DB URL → waits → migrates → seeds → starts
├── .env.example                     # Template (all values have defaults)
├── .dockerignore
├── README.md                        # This file
├── package.json                     # Scripts inline DATABASE_URL for convenience
├── prisma/
│   ├── schema.prisma                # 5 models: Supervisor, Agent, Order, AttendanceLog, Alert
│   ├── seed.ts                      # Idempotent seed script
│   └── migrations/                  # Committed migration SQL
└── src/
    ├── app/
    │   ├── page.tsx                 # /        → HomePage
    │   ├── login/page.tsx           # /login   → LoginCard
    │   ├── dashboard/page.tsx       # /dashboard → SupervisorShell (auth-gated)
    │   ├── agent/page.tsx           # /agent   → AgentIdlePage (auth-gated)
    │   ├── globals.css              # Security-ops dark theme + Leaflet overrides
    │   └── api/                     # REST route handlers (agents, orders, logs, alerts, seed)
    ├── components/
    │   ├── home/                    # Public navbar + HomePage
    │   ├── auth/                    # LoginCard (supervisor/agent toggle)
    │   ├── nav/                     # TopBar + SideNav
    │   ├── dashboard/               # StatsCards, AgentsTable, AddAgentDialog…
    │   ├── map/                     # MapView, LeafletMap, AgentDetailDrawer, SendOrderForm
    │   ├── logs/                    # LogsView
    │   ├── agent/                   # AgentIdlePage + OrderCard
    │   ├── app/                     # SupervisorShell
    │   ├── providers/               # Session + Theme + QueryClient
    │   └── common/                  # FullScreenLoader
    ├── hooks/use-data.ts            # TanStack Query hooks
    ├── lib/                         # db, auth, geofence, simulator, serializers, format, types
    └── types/next-auth.d.ts         # Role + agentId type augmentation
```

---

## How the live GPS simulator works

In production, each agent's phone would push GPS pings to an ingest endpoint. For this demo, positions move on their own via a server-side simulator in `src/lib/simulator.ts`:

- A singleton `setInterval` ticks every **4 seconds**.
- Each agent's lat/lng is nudged by a random walk (≤ 25 m per tick).
- With ~10% probability, the agent is biased **outward** from the geofence centroid so exits actually happen during a demo.
- On **exit**: `geofence_exit` + `check_out` logs + an `Alert` + status → `off_duty`.
- On **re-enter**: `geofence_reenter` + `check_in` logs + an `Alert` + status → `on_duty`.
- The client polls `/api/agents` every 3 s (TanStack Query).

To remove the simulator in production: delete `src/lib/simulator.ts`, remove the `startSimulator()` calls from API routes, and add a `POST /api/agents/[id]/ping` ingest endpoint.

---

## Troubleshooting

### `ERROR: DATABASE_URL is not set`

The entrypoint now handles this automatically when a `postgres` host is on the same Docker network. If you still see it, you ran the image standalone without a Postgres container — see [Running without docker-compose](#running-without-docker-compose) for exact commands, or just use:

```bash
docker compose up --build
```

### `bun install: Unknown lockfile version`

The image must match the lockfile format. This repo's `bun.lock` uses the JSON format (bun ≥ 1.2) — the Dockerfile pins `oven/bun:1.3`. If you regenerate the lockfile with an older bun, rebuild with a matching image tag.

### `addgroup: not found`

Fixed — the Dockerfile uses `groupadd` / `useradd` (Debian slim) instead of `addgroup` / `adduser`.

### Prisma migration wants to reset the DB

The DB was previously synced with `db:push` instead of migrations. Fix:

```bash
bun run db:migrate:reset
bun run db:seed
```

### Map tiles don't load

The map uses CARTO's free raster tiles (`basemaps.cartocdn.com/dark_all`). Markers and polygons still render without them. For air-gapped deployments, self-host tiles or swap `src/components/map/leaflet-map.tsx` to a keyed provider.

### Port 5433 already in use

Local dev defaults to Postgres on port 5433 (avoids clashing with a system Postgres on 5432). Edit `package.json` scripts and `.env` to change.

---

## License

Internal project. All rights reserved.
