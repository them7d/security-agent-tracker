# ============================================================
# SentinelSec — production Dockerfile (multi-stage)
# Uses bun 1.3 to match the bun.lock JSON lockfile format.
# ============================================================

# ---- Stage 1: deps ----
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

# ---- Stage 2: build ----
FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time DATABASE_URL placeholder — only needed so Prisma can determine
# the provider during `prisma generate`. No DB connection is made at build time.
# Sensitive vars (NEXTAUTH_SECRET, NEXTAUTH_URL) are NOT set here — they come
# from docker-compose's `environment:` block at runtime.
ENV DATABASE_URL="postgresql://placeholder@placeholder:5432/placeholder?schema=public"
RUN bun run db:generate
RUN bun run build

# ---- Stage 3: runner ----
FROM oven/bun:1.3 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma migration files + client + CLI (needed for migrate deploy at startup)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Entrypoint: migrate + seed + start
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/agents || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
