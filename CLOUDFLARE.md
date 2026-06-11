# Cloudflare Deployment (Free Tier)

Deploy the **frontend** to Cloudflare Workers & Pages. The Express + SQLite backend cannot run on Cloudflare's free tier — host it separately (see [DEPLOY.md](DEPLOY.md) for Oracle Cloud + Tunnel) and point the Worker at it with `BACKEND_URL`.

## Dashboard settings

In **Workers & Pages → productivity-app → Settings → Builds**:

| Setting            | Value                                 |
| ------------------ | ------------------------------------- |
| **Build command**  | `npm run build:cloudflare`            |
| **Deploy command** | `npm run deploy --workspace=frontend` |
| **Root directory** | `/` (repo root)                       |

> **Why not `npx wrangler deploy` at repo root?** Wrangler refuses to deploy from an npm workspace root. Config lives in `frontend/wrangler.toml`; the deploy script runs from that workspace.

## Environment variables

Add in **Settings → Variables and Secrets** (production):

| Variable      | Example                      | Required           |
| ------------- | ---------------------------- | ------------------ |
| `BACKEND_URL` | `https://app.yourdomain.com` | Yes, for login/API |

`BACKEND_URL` must be the public HTTPS origin of your backend (no trailing slash). The Worker proxies `/api/*` and `/health` to that origin.

On the backend, set `FRONTEND_URL` to your Cloudflare Pages URL (e.g. `https://productivity-app.pages.dev`) so CORS allows the browser.

## Local test

```bash
npm run build:cloudflare
cd frontend
npx wrangler deploy --dry-run
```

## What gets deployed

- `frontend/dist` — Vite production build (static assets)
- `frontend/worker/index.ts` — proxies API traffic to `BACKEND_URL`
- SPA routing via `not_found_handling = "single-page-application"`

## Troubleshooting

| Issue                    | Fix                                                                         |
| ------------------------ | --------------------------------------------------------------------------- |
| Wrangler workspace error | Use deploy command `npm run deploy --workspace=frontend`                    |
| 503 on login/API         | Set `BACKEND_URL` in Cloudflare variables                                   |
| CORS errors              | Set backend `FRONTEND_URL` to your Pages URL                                |
| 404 on client routes     | Ensure `wrangler.toml` has `not_found_handling = "single-page-application"` |
