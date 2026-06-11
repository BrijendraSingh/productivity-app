#!/usr/bin/env bash
# Pull latest image and restart the productivity-app container.
set -euo pipefail

APP_DIR="/opt/productivity-app"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
LOG_FILE="/var/log/productivity-deploy.log"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "${LOG_FILE}"
}

log "Starting deploy..."

cd "${APP_DIR}"

docker compose -f "${COMPOSE_FILE}" pull
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans
docker image prune -f

sleep 5

if curl -fsS http://127.0.0.1:3001/health > /dev/null; then
  log "Deploy successful — health check passed."
else
  log "Deploy failed — health check did not pass."
  exit 1
fi
