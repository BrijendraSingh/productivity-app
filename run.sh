#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="podman-compose.yml"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$PROJECT_DIR"

red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
cyan()  { printf '\033[0;36m%s\033[0m\n' "$*"; }

check_podman() {
  if ! command -v podman &>/dev/null; then
    red "Error: podman is not installed."
    echo "Install it with: brew install podman"
    exit 1
  fi

  if ! podman machine inspect &>/dev/null 2>&1; then
    echo "No Podman machine found. Initializing one..."
    podman machine init
  fi

  if ! podman info &>/dev/null 2>&1; then
    echo "Starting Podman machine..."
    podman machine start
  fi
}

ensure_data_dir() {
  mkdir -p "$PROJECT_DIR/data"
  chmod 777 "$PROJECT_DIR/data"
  # Ensure existing DB files are writable by the container user
  if ls "$PROJECT_DIR/data/"*.db &>/dev/null; then
    chmod 666 "$PROJECT_DIR/data/"*.db "$PROJECT_DIR/data/"*.db-* 2>/dev/null || true
  fi
}

cmd_start() {
  check_podman
  ensure_data_dir
  green "Building and starting productivity-app..."
  podman compose -f "$COMPOSE_FILE" up -d --build
  echo ""
  green "Productivity App is running!"
  echo ""
  cyan "  App:            http://localhost:8080"
  cyan "  SQLite Web UI:  http://localhost:8081"
  cyan "  Health Check:   http://localhost:8080/health"
  echo ""
  echo "Default credentials: dev / dev"
  echo ""
  echo "Run './run.sh logs' to see container logs."
  echo "Run './run.sh stop' to shut down."
}

cmd_stop() {
  green "Stopping productivity-app..."
  podman compose -f "$COMPOSE_FILE" down
  green "Stopped. Your database is safe in ./data/"
}

cmd_rebuild() {
  green "Rebuilding productivity-app from scratch..."
  podman compose -f "$COMPOSE_FILE" down
  podman compose -f "$COMPOSE_FILE" up -d --build --force-recreate
  echo ""
  green "Rebuilt and running!"
  cyan "  App:            http://localhost:8080"
  cyan "  SQLite Web UI:  http://localhost:8081"
}

cmd_logs() {
  podman compose -f "$COMPOSE_FILE" logs -f
}

cmd_status() {
  podman compose -f "$COMPOSE_FILE" ps
}

cmd_help() {
  echo "Usage: ./run.sh [command]"
  echo ""
  echo "Commands:"
  echo "  start     Build and start the app (default)"
  echo "  stop      Stop all containers"
  echo "  rebuild   Rebuild image and restart"
  echo "  logs      Tail container logs"
  echo "  status    Show container status"
  echo "  help      Show this help"
  echo ""
  echo "Data is persisted in ./data/ on your Mac disk."
}

case "${1:-start}" in
  start)   cmd_start   ;;
  stop)    cmd_stop    ;;
  rebuild) cmd_rebuild ;;
  logs)    cmd_logs    ;;
  status)  cmd_status  ;;
  help|-h|--help) cmd_help ;;
  *)
    red "Unknown command: $1"
    cmd_help
    exit 1
    ;;
esac
