# vps-kitchen-sink-v16

A bleeding-edge **Next.js 16+ (App Router)** test application designed specifically to stress-test **NextDeploy** deploying to a Linux VPS with Docker, Caddy, Coraza WAF (OWASP CRS v4), and persistent SQLite WAL.

---

## ⚡ Tech Stack & Architecture

- **Next.js 16+** with `output: 'standalone'`, Cache Components & Partial Prerendering (PPR), Turbopack, and TypeScript 5.6+.
- **React 19** with native React Compiler enabled (`reactCompiler: true`).
- **Tailwind CSS v4** (using `@import "tailwindcss";` in `app/globals.css`).
- **Database**: `better-sqlite3` with SQLite WAL mode configured to `/data/app.db` with 5000ms `busy_timeout`.
- **Node.js 22 LTS**: Multi-stage Alpine container runner operating with unprivileged `nextjs` system user (`UID 1001`).
- **Web Application Firewall (WAF)**: Coraza WAF with OWASP Core Rule Set (CRS v4) running inside Caddy in `enforce` mode.

---

## 📁 Key File Map

| File | Purpose |
|---|---|
| [`nextdeploy.yml`](file:///Users/hersi/Developer/vps-kitchen-sink-v16/nextdeploy.yml) | NextDeploy orchestration spec (host, ports, volumes, domain, Coraza WAF enforce mode, health check). |
| [`Dockerfile`](file:///Users/hersi/Developer/vps-kitchen-sink-v16/Dockerfile) | Multi-stage build targeting `node:22-alpine` (`deps` with native build tools, `builder`, and `runner` with `/data` volume permissions). |
| [`next.config.ts`](file:///Users/hersi/Developer/vps-kitchen-sink-v16/next.config.ts) | Next.js 16 standalone config with `serverExternalPackages: ['better-sqlite3']`, `reactCompiler`, and `cacheComponents`. |
| [`lib/db.ts`](file:///Users/hersi/Developer/vps-kitchen-sink-v16/lib/db.ts) | Database singleton connecting to `/data/app.db`, sets `PRAGMA journal_mode = WAL;`, `PRAGMA busy_timeout = 5000;`, and auto-migrates `projects`. |
| [`app/layout.tsx`](file:///Users/hersi/Developer/vps-kitchen-sink-v16/app/layout.tsx) | Responsive Tailwind v4 dashboard shell with live connection status badges and environment metadata. |
| [`app/projects/page.tsx`](file:///Users/hersi/Developer/vps-kitchen-sink-v16/app/projects/page.tsx) | Server Component reading from local SQLite WAL, React 19 `useActionState` form mutations, optimistic UI rendering, and zero-JS bound server actions. |
| [`app/projects/[id]/page.tsx`](file:///Users/hersi/Developer/vps-kitchen-sink-v16/app/projects/[id]/page.tsx) | Dynamic route resolving Next.js 16 Promise-based `params: Promise<{ id: string }>` with graceful `notFound()` triggering. |
| [`app/telemetry/page.tsx`](file:///Users/hersi/Developer/vps-kitchen-sink-v16/app/telemetry/page.tsx) | Live dashboard with real-time SSE chart, memory sparkline, and continuous tick logs. |
| [`app/api/telemetry/stream/route.ts`](file:///Users/hersi/Developer/vps-kitchen-sink-v16/app/api/telemetry/stream/route.ts) | Server-Sent Events (SSE) `ReadableStream` emitting memory, uptime, and ticks every 1 second with `X-Accel-Buffering: no`. |
| [`app/waf-verification/page.tsx`](file:///Users/hersi/Developer/vps-kitchen-sink-v16/app/waf-verification/page.tsx) | Interactive OWASP attack harness testing that Coraza WAF denies malicious XSS, SQLi, and RCE query payloads before hitting Node.js. |
| [`app/api/health/route.ts`](file:///Users/hersi/Developer/vps-kitchen-sink-v16/app/api/health/route.ts) | NextDeploy healthcheck endpoint verifying SQLite read/write latency, memory footprint, and returning HTTP 200 `{ status: "ok", next: "16+", engine: "standalone" }`. |

---

## 🔐 Secrets Management with Doppler

This project is connected to the Doppler project **`vps-kitchen-sink-v16`**.

### Scoped Configuration
The local directory is already scoped to:
- **Project**: `vps-kitchen-sink-v16`
- **Config**: `dev`

### Store Server & Deployment Credentials
Set your VPS credentials and secrets using the Doppler CLI or Doppler dashboard:

```bash
# Set production VPS credentials
doppler secrets set VPS_HOST="YOUR_SERVER_IP" VPS_USER="deploy" VPS_PORT="22" DOMAIN="v16.yourdomain.com" --config prd

# Set SSH private key (interactive or piped)
cat ~/.ssh/id_ed25519 | doppler secrets set VPS_SSH_KEY --config prd

# View secrets in current config
doppler secrets

# Run locally with Doppler secrets injected
npm run dev:doppler
```

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Build for production (verifies Next.js 16 standalone compilation and TypeScript)
npm run build

# 3. Run standalone server
node .next/standalone/server.js
```

The application will be accessible at `http://localhost:3000`.

---

## 🐳 Docker Build

```bash
docker build -t vps-kitchen-sink-v16:latest .
docker run -p 3000:3000 -v $(pwd)/data:/data vps-kitchen-sink-v16:latest
```

---

## 🛡️ NextDeploy VPS Deployment

When deploying via NextDeploy:
```bash
nextdeploy up
```

NextDeploy will:
1. Provision the target VPS via SSH (`user: deploy`, port `22`).
2. Build or pull the Node 22 Alpine standalone container.
3. Bind mount `/var/lib/nextdeploy/vps-v16/data` to container `/data`.
4. Configure Caddy with automatic TLS and enable the **Coraza WAF** module in `enforce` mode with the OWASP Core Rule Set (CRS v4).
5. Continuously probe `/api/health` every 3 seconds for zero-downtime rolling deploys.
