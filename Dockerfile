# syntax=docker/dockerfile:1

# Stage 0: Base image
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
# Install build tools required for native modules (better-sqlite3) on Alpine
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.js collects completely anonymous telemetry data about general usage.
RUN npm run build

# Stage 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH="/data/app.db"

# Create nextjs system user and group (UID/GID 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create persistent storage volume directory and assign permissions
RUN mkdir -p /data && \
    chown -R nextjs:nodejs /data && \
    chmod 775 /data

# Set up runtime directory
RUN mkdir .next && \
    chown nextjs:nodejs .next

# Copy standalone output and static assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to unprivileged user
USER nextjs

EXPOSE 3000

# Healthcheck configuration mirroring nextdeploy.yml
HEALTHCHECK --interval=3s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
