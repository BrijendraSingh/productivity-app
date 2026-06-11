# Cloudflare Deployment (Workers + D1 + SPA)

Full-stack deployment on **Cloudflare Workers** with **D1** (SQL) and static **Vite** assets. No separate backend host or `BACKEND_URL` proxy.

**Live URL:** https://productivity-app.bps-brijendra.workers.dev

## Architecture

```
Browser → Cloudflare Worker
            ├── /api/*, /health → Express API (nodejs_compat)
            └── /*              → Static SPA assets (dist/)
          D1 Database (SQLite-compatible)
```

## One-time setup: D1 database

Your API token needs **D1 → Edit** permission (in addition to Workers Scripts Edit).

```bash
export CLOUDFLARE_API_TOKEN=your_token_with_d1_edit
./scripts/setup-cloudflare-d1.sh
# Updates frontend/wrangler.toml with database_id and applies migrations
```

Commit the updated `database_id` in `frontend/wrangler.toml`.

## Dashboard build settings

**Workers & Pages → productivity-app → Settings → Builds:**

| Setting            | Value                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------- |
| **Build command**  | `npm run build:cloudflare`                                                              |
| **Deploy command** | `npm run db:migrate:remote --workspace=frontend && npm run deploy --workspace=frontend` |
| **Root directory** | `/`                                                                                     |

## Environment variables

Set in **Settings → Variables**:

| Variable             | Default | Description                      |
| -------------------- | ------- | -------------------------------- |
| `ALLOW_REGISTRATION` | `true`  | Set `false` to block new signups |

Configured in `wrangler.toml` `[vars]` — dashboard overrides apply on deploy.

## Local development

```bash
# Terminal 1 — API + SPA via Worker (uses local D1)
cd frontend
npm run db:migrate:local
npm run dev:worker

# Terminal 2 — classic Node backend (SQLite file)
npm run dev
```

## Scripts

| Script                      | Description                       |
| --------------------------- | --------------------------------- |
| `npm run build:cloudflare`  | Build shared + frontend only      |
| `npm run deploy:cloudflare` | Build + deploy Worker             |
| `npm run db:migrate:local`  | Apply D1 migrations locally       |
| `npm run db:migrate:remote` | Apply D1 migrations to production |

## Troubleshooting

| Issue                          | Fix                                                  |
| ------------------------------ | ---------------------------------------------------- |
| `database_id` validation error | Run `wrangler d1 create` and commit `wrangler.toml`  |
| D1 auth error on create        | Add **D1 Edit** to API token                         |
| 503 / API errors after deploy  | Run `npm run db:migrate:remote --workspace=frontend` |
| Registration blocked           | Set `ALLOW_REGISTRATION=true` in wrangler vars       |

## Local Node / Docker backend

The Express + SQLite server in `backend/` still works for local dev and Docker. Production on Cloudflare uses D1 via `frontend/worker/index.ts`.
