#!/usr/bin/env bash
# One-time Oracle Cloud VM bootstrap for productivity-app webhook deploy.
set -euo pipefail

APP_DIR="/opt/productivity-app"
CONFIG_DIR="/etc/productivity-app"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEBHOOK_VERSION="2.8.1"
WEBHOOK_URL="https://github.com/adnanh/webhook/releases/download/${WEBHOOK_VERSION}/webhook-linux-arm64.tar.gz"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo ./deploy/scripts/install-vm.sh"
  exit 1
fi

if [[ -z "${APP_HOSTNAME:-}" || -z "${DEPLOY_HOSTNAME:-}" ]]; then
  echo "Set APP_HOSTNAME and DEPLOY_HOSTNAME before running."
  echo "  export APP_HOSTNAME=app.example.com"
  echo "  export DEPLOY_HOSTNAME=deploy.example.com"
  exit 1
fi

echo "==> Installing system packages..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  docker.io docker-compose-plugin ufw fail2ban unattended-upgrades curl gettext-base

systemctl enable --now docker

echo "==> Creating directories..."
mkdir -p "${APP_DIR}/data" "${CONFIG_DIR}"
chmod 700 "${APP_DIR}/data"

echo "==> Installing deploy assets..."
install -m 755 "${REPO_ROOT}/deploy/scripts/deploy.sh" "${APP_DIR}/deploy.sh"
install -m 644 "${REPO_ROOT}/deploy/docker-compose.prod.yml" "${APP_DIR}/docker-compose.prod.yml"

if [[ ! -f "${APP_DIR}/.env" ]]; then
  install -m 600 "${REPO_ROOT}/deploy/.env.production.example" "${APP_DIR}/.env"
  sed -i "s|https://app.example.com|https://${APP_HOSTNAME}|g" "${APP_DIR}/.env"
fi
chown root:docker "${APP_DIR}/.env"
chmod 600 "${APP_DIR}/.env"
chown -R root:docker "${APP_DIR}/data"

echo "==> Generating webhook HMAC secret..."
if [[ ! -f "${CONFIG_DIR}/webhook-secret" ]]; then
  openssl rand -hex 32 > "${CONFIG_DIR}/webhook-secret"
fi
chmod 600 "${CONFIG_DIR}/webhook-secret"
chown root:root "${CONFIG_DIR}/webhook-secret"

WEBHOOK_SECRET="$(cat "${CONFIG_DIR}/webhook-secret")"
export WEBHOOK_SECRET
envsubst < "${REPO_ROOT}/deploy/webhook/hooks.json.tpl" > "${CONFIG_DIR}/hooks.json"
chmod 600 "${CONFIG_DIR}/hooks.json"
chown root:root "${CONFIG_DIR}/hooks.json"

echo "==> Installing webhook binary (arm64)..."
TMP_WEBHOOK="$(mktemp -d)"
curl -fsSL "${WEBHOOK_URL}" -o "${TMP_WEBHOOK}/webhook.tar.gz"
tar -xzf "${TMP_WEBHOOK}/webhook.tar.gz" -C "${TMP_WEBHOOK}"
install -m 755 "${TMP_WEBHOOK}/webhook-linux-arm64/webhook" /usr/local/bin/webhook
rm -rf "${TMP_WEBHOOK}"

echo "==> Installing systemd service..."
install -m 644 "${REPO_ROOT}/deploy/systemd/productivity-webhook.service" \
  /etc/systemd/system/productivity-webhook.service
systemctl daemon-reload
systemctl enable --now productivity-webhook.service

echo "==> Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
read -rp "Enter your SSH IP (CIDR, e.g. 203.0.113.10/32): " SSH_CIDR
ufw allow from "${SSH_CIDR}" to any port 22 proto tcp
ufw --force enable

echo "==> Enabling unattended security upgrades..."
dpkg-reconfigure -plow unattended-upgrades

echo ""
echo "=============================================="
echo " VM bootstrap complete."
echo "=============================================="
echo ""
echo "1. Edit ${APP_DIR}/.env — verify FRONTEND_URL and ALLOW_REGISTRATION"
echo ""
echo "2. Add this secret to GitHub (Settings → Environments → production):"
echo "   DEPLOY_WEBHOOK_SECRET=$(cat ${CONFIG_DIR}/webhook-secret)"
echo ""
echo "3. Configure Cloudflare Tunnel — see deploy/cloudflared/config.yml.example"
echo "   APP_HOSTNAME=${APP_HOSTNAME}"
echo "   DEPLOY_HOSTNAME=${DEPLOY_HOSTNAME}"
echo ""
echo "4. First deploy:"
echo "   cd ${APP_DIR} && docker compose -f docker-compose.prod.yml pull"
echo "   docker compose -f docker-compose.prod.yml up -d"
echo ""
