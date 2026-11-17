#!/bin/sh
set -e
APP_PORT="${PORT:-5000}"

echo "=========================================================="
echo "SentinelSec container starting"
echo "DATABASE_URL: ${DATABASE_URL:-<not set>}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-<not set>}"
if [ -n "$NEXTAUTH_SECRET" ]; then echo "NEXTAUTH_SECRET: set (hidden)"; else echo "NEXTAUTH_SECRET: <not set>"; fi
echo "App port:      $APP_PORT"
echo "=========================================================="

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set — checking for the compose-network postgres host…"
  PG_HOST_FOUND=0
  if getent hosts postgres >/dev/null 2>&1; then
    PG_HOST_FOUND=1
  fi
  if [ "$PG_HOST_FOUND" = "1" ]; then
    PGUSER="${POSTGRES_USER:-sentinel}"; PGPASS="${POSTGRES_PASSWORD:-sentinel}"; PGDB="${POSTGRES_DB:-sentinel_sec}"
    DATABASE_URL="postgresql://${PGUSER}:${PGPASS}@postgres:5432/${PGDB}?schema=public&sslmode=disable&connect_timeout=30"
    export DATABASE_URL
    echo "✓ Found postgres host on the compose network. Using DATABASE_URL=$DATABASE_URL"
  else
    echo "ERROR: DATABASE_URL is not set and no 'postgres' host was found."
    echo "  • With docker compose (recommended): docker compose up --build"
    echo "  • Plain docker run: docker network create sentinelsec-net"
    echo "      docker run -d --name sentinelsec-postgres --network sentinelsec-net \\"
    echo "        -e POSTGRES_USER=sentinel -e POSTGRES_PASSWORD=sentinel \\"
    echo "        -e POSTGRES_DB=sentinel_sec postgres:17-alpine"
    echo "      docker run --network sentinelsec-net -p 5000:5000 sentinelsec-app"
    exit 1
  fi
fi

echo "[0/3] Waiting for Postgres to accept connections…"

# host:port from postgresql://user:pass@host:port/db?...
DB_HOSTPORT="${DATABASE_URL#*@}"
DB_HOSTPORT="${DB_HOSTPORT%%/*}"
DB_HOST="${DB_HOSTPORT%%:*}"
DB_PORT="${DB_HOSTPORT##*:}"
if [ "$DB_PORT" = "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
  DB_PORT=5432
fi

IP="$(getent ahostsv4 "$DB_HOST" 2>/dev/null | awk '{print $1; exit}' || true)"
if [ -n "$IP" ] && [ "$IP" != "$DB_HOST" ]; then
  echo "      resolved $DB_HOST -> $IP"
  DATABASE_URL="$(printf '%s\n' "$DATABASE_URL" | sed "s/@${DB_HOST}:/@${IP}:/")"
  export DATABASE_URL
  DB_HOST="$IP"
fi

export DB_HOST DB_PORT
i=0
ready=0
while [ "$i" -lt 60 ]; do
  if timeout -k 1 3 bun -e '
    import { connect } from "node:net";
    const host = process.env.DB_HOST;
    const port = Number(process.env.DB_PORT);
    await new Promise((resolve, reject) => {
      const socket = connect({ host, port }, () => { socket.end(); resolve(); });
      socket.setTimeout(2000, () => { socket.destroy(); reject(new Error("timeout")); });
      socket.on("error", reject);
    });
  ' >/dev/null 2>&1; then
    ready=1
    break
  fi
  i=$((i + 1))
  echo "      … waiting for ${DB_HOST}:${DB_PORT} (${i}s)"
  sleep 1
done

if [ "$ready" != 1 ]; then
  echo "ERROR: cannot reach Postgres at ${DB_HOST}:${DB_PORT}"
  echo "  • docker compose up --build"
  echo "  • docker compose logs postgres"
  echo "  • if the volume is corrupt: docker compose down -v && docker compose up --build"
  exit 1
fi
echo "      ✓ Postgres is ready"

echo "[1/3] Applying Prisma migrations…"
bun ./node_modules/.bin/prisma migrate deploy
echo "      ✓ Migrations applied"

echo "[2/3] Seeding demo data (idempotent)…"
bun prisma/seed.ts || { echo "      ! Seed step reported an error; continuing"; }
echo "      ✓ Seed complete"

echo "[3/3] Starting Next.js standalone server on port ${PORT:-5000}…"
exec bun ./server.js
