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
ENV DATABASE_URL="postgresql://placeholder@placeholder:5432/placeholder?schema=public"
RUN bun run db:generate
RUN bun run build

# ---- Stage 2.5: migrate-deps ----
# Complete dependency tree for the RUNTIME entrypoint (prisma migrate deploy +
# seed). Versions MUST match bun.lock: prisma/@prisma/client 6.19.2, bcryptjs 3.0.3.
FROM oven/bun:1.3 AS migrate-deps
WORKDIR /m
COPY prisma ./prisma
RUN echo '{"dependencies":{"prisma":"6.19.2","@prisma/client":"6.19.2","bcryptjs":"3.0.3"}}' > package.json && \
    bun install
ENV DATABASE_URL="postgresql://placeholder@placeholder:5432/placeholder?schema=public"
RUN bunx prisma generate

# ---- Stage 3: runner ----
FROM oven/bun:1.3 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
ENV HOSTNAME=0.0.0.0
ENV HOME=/tmp
ENV NEXT_TELEMETRY_DISABLED=1

# Built-in runtime defaults — image works with a plain `docker run` (no -e flags).
ENV POSTGRES_USER=sentinel
ENV POSTGRES_PASSWORD=sentinel
ENV POSTGRES_DB=sentinel_sec
ENV DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public&sslmode=disable&connect_timeout=30"
ENV NEXTAUTH_URL="http://localhost:5000"
ENV NEXTAUTH_SECRET="DhbI3ZaSvjgUhPAHPNa1/DGfzgUl5fxbsjBVjqggMSk="

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --no-create-home --home-dir /app nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=migrate-deps --chown=nextjs:nodejs /m/node_modules ./node_modules
COPY --from=migrate-deps --chown=nextjs:nodejs /m/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://localhost:'+(process.env.PORT||5000)+'/api/agents').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]