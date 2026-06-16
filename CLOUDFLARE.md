# Cloudflare Runbook (Workers + D1 + SPA)

Full-stack deployment on **Cloudflare Workers** with **D1** (SQLite-compatible SQL) and the **Vite** static frontend. No separate backend host, Docker tunnel, or `BACKEND_URL` proxy.

**Live URL:** https://productivity-app.bps-brijendra.workers.dev

---

## Architecture

```
Browser
  │
  ▼
Cloudflare Worker (frontend/worker/index.ts)
  ├── /health, /api, /api/*  →  Hono API (reuses backend controllers + D1)
  └── /*                       →  Static SPA assets (frontend/dist/)
          │
          ▼
    D1 Database (productivity-app-db)
```

| Layer                        | Technology               | Location                                              |
| ---------------------------- | ------------------------ | ----------------------------------------------------- |
| SPA                          | React + Vite             | `frontend/dist/` served via `[assets]`                |
| API                          | Hono + express adapter   | `frontend/worker/hono-app.ts`                         |
| Controllers / validation     | Shared with Node backend | `backend/src/controllers/`, `backend/src/middleware/` |
| Database (production)        | Cloudflare D1            | `migrations/*.sql`                                    |
| Database (local Node/Docker) | SQLite file              | `backend/` + `data/`                                  |

The Express server in `backend/` is still used for **local dev** and **Docker**. Production on Cloudflare never starts that process.

---

## What we migrated (history)

Understanding the evolution helps when debugging old configs or secrets.

| Phase                   | Setup                                                | Problem                             |
| ----------------------- | ---------------------------------------------------- | ----------------------------------- |
| 1. SPA only             | Worker proxied `/api/*` to `BACKEND_URL`             | Needed a separate always-on backend |
| 2. Tunnel workaround    | Docker + `cloudflared` quick tunnel as `BACKEND_URL` | Tunnel URL expires; not permanent   |
| 3. Full stack (current) | Worker serves API + SPA + D1                         | No external backend required        |

**Retired:** `BACKEND_URL` worker secret (deleted). If you see tunnel errors mentioning `trycloudflare.com`, an old worker version or secret is still in play — redeploy and confirm secrets.

---

## Prerequisites

- Cloudflare account with Workers enabled
- Node.js ≥ 20
- Wrangler CLI (installed via `frontend` workspace: `npx wrangler`)
- Account ID in `frontend/wrangler.toml` (`account_id`)

### Authentication (pick one)

| Method                 | When to use                     | D1 create?                      |
| ---------------------- | ------------------------------- | ------------------------------- |
| `npx wrangler login`   | Local machine, first-time setup | Yes (OAuth has D1 write)        |
| `CLOUDFLARE_API_TOKEN` | CI, scripts, non-interactive    | Only if token has **D1 → Edit** |

**API token permissions (minimum for full deploy):**

- Account → Workers Scripts → Edit
- Account → D1 → Edit
- Account → Account Settings → Read (optional, for `wrangler whoami`)

If D1 commands fail with `Authentication error [code: 10000]` but Workers deploy works, the token is missing **D1 Edit**. Either add that scope or run `npx wrangler login` once locally.

---

## One-time setup

### 1. Create the D1 database

**Option A — script (API token):**

```bash
export CLOUDFLARE_API_TOKEN=your_token_with_d1_edit
./scripts/setup-cloudflare-d1.sh
```

**Option B — manual (OAuth):**

```bash
npx wrangler login
cd frontend
npx wrangler d1 create productivity-app-db
# Copy database_id into wrangler.toml
npx wrangler d1 migrations apply productivity-app-db --remote
```

`wrangler d1 create` prints a `database_id`. It must be committed in `frontend/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "productivity-app-db"
database_id = "745ed25d-ba7b-4d4d-81b4-0dc975e09552"  # your ID
migrations_dir = "../migrations"
```

Deploy **will fail** with `binding DB must have a valid database_id` if this is `PLACEHOLDER`.

### 2. Cloudflare dashboard — Builds

**Workers & Pages → productivity-app → Settings → Builds:**

| Setting            | Value                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------- |
| **Root directory** | `/`                                                                                     |
| **Build command**  | `npm run build:cloudflare`                                                              |
| **Deploy command** | `npm run db:migrate:remote --workspace=frontend && npm run deploy --workspace=frontend` |

Do **not** use `npx wrangler deploy` at the monorepo root — Wrangler refuses npm workspace roots without a project directory. Config lives in `frontend/wrangler.toml`.

### 3. Environment variables

In `wrangler.toml` `[vars]` (or dashboard **Settings → Variables**):

| Variable             | Default | Description                                      |
| -------------------- | ------- | ------------------------------------------------ |
| `ALLOW_REGISTRATION` | `true`  | Set `false` to block new signups on a public URL |

### 4. Remove legacy secrets

```bash
cd frontend
npx wrangler secret list        # should NOT list BACKEND_URL
npx wrangler secret delete BACKEND_URL   # if still present
```

---

## Deploy (routine)

### From your machine

```bash
# Full pipeline: build → migrate remote D1 → deploy worker + assets
npm run deploy:cloudflare
```

Equivalent steps:

```bash
npm run build:cloudflare
npm run db:migrate:remote --workspace=frontend
npm run deploy --workspace=frontend
```

### Dry-run (bundle check, no upload)

```bash
npm run build:cloudflare
cd frontend && npx wrangler deploy --dry-run
```

### After schema changes

1. Add SQL file under `migrations/` (e.g. `0002_add_foo.sql`)
2. Test locally: `npm run db:migrate:local --workspace=frontend`
3. Deploy: `npm run deploy:cloudflare` (remote migrate runs in deploy script / CI)

---

## Local development

### Option A — Worker + local D1 (closest to production)

```bash
cd frontend
npm run db:migrate:local    # first time / after new migrations
npm run dev:worker            # http://localhost:8787
```

### Option B — Classic Node backend + Vite (faster iteration)

```bash
npm run dev                   # backend :3001 + frontend :5173
```

### Option C — Worker against remote D1

```bash
cd frontend
npx wrangler dev --remote
```

---

## Key files

| File                                    | Purpose                                                    |
| --------------------------------------- | ---------------------------------------------------------- |
| `frontend/wrangler.toml`                | Worker name, D1 binding, assets, `run_worker_first` routes |
| `frontend/worker/index.ts`              | Worker entry — lazy D1 init, delegates to Hono             |
| `frontend/worker/hono-app.ts`           | All `/api/*` routes                                        |
| `frontend/worker/express-adapter.ts`    | Bridges Express controllers/middleware to Hono             |
| `migrations/0001_initial.sql`           | D1 schema (13 tables)                                      |
| `backend/src/config/database.d1.ts`     | D1 query helpers                                           |
| `backend/src/config/database.sqlite.ts` | SQLite helpers (Node/Docker only)                          |
| `scripts/setup-cloudflare-d1.sh`        | One-shot D1 create + remote migrate                        |

### Routing note

`run_worker_first` in `wrangler.toml` must include **both** `/api` and `/api/*`:

```toml
run_worker_first = ["/api", "/api/*", "/health"]
```

Without `/api`, the bare `/api` root can be served as SPA HTML instead of JSON.

---

## Verification checklist

Run after every deploy:

```bash
# Health
curl -s https://productivity-app.bps-brijendra.workers.dev/health | jq .

# API root
curl -s https://productivity-app.bps-brijendra.workers.dev/api | jq .

# Register (or login)
curl -s -X POST https://productivity-app.bps-brijendra.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USER","password":"YOUR_PASS"}' | jq .

# Authenticated todos (replace TOKEN)
curl -s "https://productivity-app.bps-brijendra.workers.dev/api/todos?page=1&limit=20" \
  -H "Authorization: Bearer TOKEN" | jq .
```

In the browser:

1. Hard refresh (Cmd+Shift+R)
2. Log in again (clears stale tokens from pre-D1 era)
3. Open **Todos** — should load with no red error banner

---

## Debugging guide

### Symptom → cause → fix

| Symptom                                                   | Likely cause                                     | Fix                                                                  |
| --------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| `Unexpected token '<', "<!DOCTYPE "... is not valid JSON` | API returned HTML (SPA or Cloudflare error page) | See rows below; check Network tab for which URL failed               |
| `error code: 1101` / Worker threw exception               | Uncaught error or hung request in worker         | `npx wrangler tail productivity-app`; fix worker code; redeploy      |
| `503` + message about `BACKEND_URL`                       | Old worker still proxying to backend             | Deploy latest code; delete `BACKEND_URL` secret                      |
| Tunnel error `1033` / `trycloudflare.com`                 | `BACKEND_URL` pointed at expired quick tunnel    | Delete secret; deploy full-stack worker                              |
| `binding DB must have a valid database_id`                | `PLACEHOLDER` in `wrangler.toml`                 | `wrangler d1 create` + commit real ID                                |
| D1 `Authentication error [code: 10000]`                   | API token lacks D1 Edit                          | Add permission or `wrangler login`                                   |
| `no such table: users` (local)                            | Local D1 not migrated                            | `npm run db:migrate:local --workspace=frontend`                      |
| API works in curl but UI shows 401                        | Stale token in `localStorage`                    | Log out / hard refresh / clear site data                             |
| Wrangler fails at repo root                               | Monorepo without project dir                     | Deploy from `frontend/` or use `npm run deploy --workspace=frontend` |
| Todos page empty, no error                                | New D1 DB — no data yet                          | Expected; create todos after login                                   |
| Registration returns 403                                  | `ALLOW_REGISTRATION` not `true`                  | Set in `wrangler.toml` `[vars]` and redeploy                         |

### Inspect live worker logs

```bash
cd frontend
npx wrangler tail productivity-app
```

In another terminal, reproduce the failing request (browser or `curl`).

### Inspect D1 data

```bash
cd frontend
npx wrangler d1 execute productivity-app-db --remote --command "SELECT id, username, email FROM users LIMIT 5"
```

### Check worker secrets and bindings

```bash
cd frontend
npx wrangler secret list
npx wrangler deployments list
```

### Common frontend mistake after migration

Users who logged in **before** the D1 migration have tokens in `localStorage` that do not exist in the new database. Symptom: immediate 401 on `/api/todos`. **Fix:** log in again.

The API client (`frontend/src/services/api.ts`) now detects HTML responses and shows a clearer message: _"Server returned HTML instead of JSON. Try signing in again."_

### Auth middleware on Workers (for contributors)

Authenticated routes use `authMiddleware` via `todos.use('*', auth)` in `hono-app.ts`. The express adapter must:

1. **Continue the Hono chain** when Express middleware calls `next()` without writing a response
2. **Share one mock `req`** across middleware and controller so `req.user` is set
3. **Resolve the promise** when handlers call `res.json()` without calling `next()`

If any of these break, symptoms are hung requests (1101) or 401 on valid tokens. See `frontend/worker/express-adapter.ts`.

### Top-level async in worker entry

D1 initialization must **not** run at module scope:

```typescript
// BAD — fails in Workers global scope
await initializeDatabase();

// GOOD — lazy init inside fetch handler (see worker/index.ts)
async function getApp(env) { ... await initializeDatabase(); ... }
```

---

## NPM scripts reference

| Script                                           | Description                                        |
| ------------------------------------------------ | -------------------------------------------------- |
| `npm run build:cloudflare`                       | Build `shared` + `frontend` (skips backend bundle) |
| `npm run deploy:cloudflare`                      | Build + remote migrate + deploy                    |
| `npm run deploy --workspace=frontend`            | Deploy worker only (assumes `dist/` already built) |
| `npm run db:migrate:local --workspace=frontend`  | Apply migrations to local D1                       |
| `npm run db:migrate:remote --workspace=frontend` | Apply migrations to production D1                  |
| `npm run dev:worker --workspace=frontend`        | Local worker dev server                            |

---

## CI vs Cloudflare Builds

- **GitHub Actions** (`/.github/workflows/deploy.yml`) — builds Docker image, pushes GHCR, triggers Oracle VM webhook. This is **separate** from Cloudflare Workers deploy.
- **Cloudflare Builds** (dashboard) — builds and deploys the Worker when you push to `main`, using the build/deploy commands above.

Both can coexist. Production URL on Workers is independent of the Oracle/Docker path in `DEPLOY.md`.

---

## Security notes

- Never commit `CLOUDFLARE_API_TOKEN` or user tokens to git
- Rotate API tokens shared in chat or logs
- Set `ALLOW_REGISTRATION=false` if the workers.dev URL is public and you do not want open signups
- Prefer short-lived CI tokens with minimal scopes (Workers Scripts Edit + D1 Edit only)

---

## Quick recovery (production down)

```bash
npx wrangler login                    # if token issues
npm run build:cloudflare
npm run db:migrate:remote --workspace=frontend
npm run deploy --workspace=frontend
curl -s https://productivity-app.bps-brijendra.workers.dev/health
```

If health is OK but authenticated routes fail, tail logs and test with a fresh login token before changing code.
