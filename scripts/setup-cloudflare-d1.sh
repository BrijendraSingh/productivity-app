#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN (needs Account → D1 → Edit and Workers Scripts → Edit)." >&2
  exit 1
fi

echo "Creating D1 database productivity-app-db..."
npx wrangler d1 create productivity-app-db

echo "Applying remote migrations..."
npx wrangler d1 migrations apply productivity-app-db --remote

echo "Done. Commit frontend/wrangler.toml if database_id changed, then deploy:"
echo "  npm run deploy:cloudflare"
