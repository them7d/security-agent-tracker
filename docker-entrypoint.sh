#!/bin/sh
# docker-entrypoint.sh — runs on container start.
# Applies pending Prisma migrations, seeds demo data if the DB is empty,
# then starts the Next.js standalone server.

set -e

echo "=========================================================="
echo "SentinelSec container starting"
echo "=========================================================="
echo "DATABASE_URL: ${DATABASE_URL:-<not set>}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL:-<not set>}"
echo ""

# ---- 1. Apply migrations ----
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Provide it via env or docker-compose."
  exit 1
fi

echo "[1/3] Applying Prisma migrations…"
bunx prisma migrate deploy
echo "      ✓ Migrations applied"

# ---- 2. Seed if empty ----
echo "[2/3] Seeding demo data (idempotent)…"
DATABASE_URL="$DATABASE_URL" bun prisma/seed.ts || {
  echo "      ! Seed step failed (may already be seeded); continuing"
}
echo "      ✓ Seed complete"

# ---- 3. Start Next.js ----
echo "[3/3] Starting Next.js standalone server on port ${PORT:-3000}…"
echo ""
exec node ./server.js
