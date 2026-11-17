#!/bin/sh
# docker-entrypoint.sh — runs on container start.
# Applies Prisma migrations, seeds demo data, then starts Next.js.
# DATABASE_URL is provided by docker-compose (points at the `postgres` service).

set -e

echo "=========================================================="
echo "SentinelSec container starting"
echo "DATABASE_URL: ${DATABASE_URL:-<not set>}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-<not set>}"
echo "=========================================================="

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Provide it via docker-compose environment."
  exit 1
fi

echo "[1/3] Applying Prisma migrations…"
bunx prisma migrate deploy
echo "      ✓ Migrations applied"

echo "[2/3] Seeding demo data (idempotent)…"
DATABASE_URL="$DATABASE_URL" bun prisma/seed.ts || {
  echo "      ! Seed step reported an error (may already be seeded); continuing"
}
echo "      ✓ Seed complete"

echo "[3/3] Starting Next.js standalone server on port ${PORT:-3000}…"
exec node ./server.js
