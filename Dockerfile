# ============================================================
# SentinelSec — production Dockerfile
# Multi-stage build: deps → builder → runner
# ============================================================

# ---- Stage 1: base deps ----
FROM oven/bun:1.1 AS deps
WORKDIR /app

# Copy lockfile + package.json first for cache-friendly install
COPY package.json bun.lock* ./
COPY prisma ./prisma

# Install all dependencies (including dev for the build step)
RUN bun install --frozen-lockfile

# ---- Stage 2: build the Next.js app ----
FROM oven/bun:1.1 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env: the build doesn't need a live DB, but Prisma client
# generation requires the schema + a DATABASE_URL placeholder.
ENV DATABASE_URL="postgresql://placeholder@placeholder:5432/placeholder?schema=public"
ENV NEXTAUTH_SECRET="build-time-placeholder-not-used-at-runtime"
ENV NEXTAUTH_URL="http://localhost:3000"

# Generate Prisma client + build Next.js standalone output
RUN bun run db:generate
RUN bun run build

# ---- Stage 3: minimal runtime ----
FROM oven/bun:1.1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a non-root user for the runtime
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone Next.js output (self-contained server.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma migration files + client (needed for db:migrate:deploy at startup)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/bun.lock ./bun.lock

# Seed script
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed.ts ./prisma/seed.ts

# Entrypoint: apply migrations + seed, then start the standalone server
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/agents || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
