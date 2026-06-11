# Deployment Guide — Oracle Cloud + GHCR + Cloudflare Tunnel

Secure webhook-based deploy for the productivity-app. Secrets never live in git or Docker image layers.

## Architecture

```
GitHub (push main) → CI passes → Deploy workflow
  → Build ARM64 image → Trivy scan → Push to GHCR
  → POST webhook (Cloudflare Access + HMAC) → Oracle VM pulls & restarts
```

**Defense in depth:**

1. Cloudflare Access service token on `deploy.yourdomain.com`
2. Webhook HMAC SHA-256 signature (`DEPLOY_WEBHOOK_SECRET`)
3. App and webhook bind to `127.0.0.1` only — exposed via Cloudflare Tunnel

---

## Prerequisites

- Oracle Cloud account (Always Free A1 Flex ARM VM)
- Domain on Cloudflare
- GitHub repo: `BrijendraSingh/productivity-app`
- GitHub **Environment** named `production` with secrets (see below)

---

## Phase 1 — Oracle Cloud VM

### Create instance

| Setting     | Value                                 |
| ----------- | ------------------------------------- |
| Shape       | `VM.Standard.A1.Flex` (ARM)           |
| OS          | Ubuntu 22.04 aarch64                  |
| Resources   | 2 OCPU / 12 GB RAM (or max free tier) |
| Boot volume | 50 GB                                 |
| Public IP   | Yes                                   |
| Ingress     | SSH (22) from **your IP only**        |

### Bootstrap

```bash
git clone https://github.com/BrijendraSingh/productivity-app.git
cd productivity-app
export APP_HOSTNAME="app.yourdomain.com"
export DEPLOY_HOSTNAME="deploy.yourdomain.com"
sudo ./deploy/scripts/install-vm.sh
```

The script installs Docker, webhook, UFW, fail2ban, and prints the `DEPLOY_WEBHOOK_SECRET` — copy it to GitHub immediately.

### Configure app environment

Edit `/opt/productivity-app/.env`:

```bash
sudo nano /opt/productivity-app/.env
```

Required values:

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.yourdomain.com
DATABASE_PATH=/app/data/productivity_app.db
ALLOW_REGISTRATION=false
LOG_LEVEL=info
```

---

## Phase 2 — Cloudflare Tunnel

```bash
# Install cloudflared (ARM64)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

cloudflared tunnel login
cloudflared tunnel create productivity-app
```

Copy [`deploy/cloudflared/config.yml.example`](deploy/cloudflared/config.yml.example) to `~/.cloudflared/config.yml` and replace placeholders.

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

Add DNS records in Cloudflare (CNAME to tunnel).

### Cloudflare Access (deploy subdomain)

1. Zero Trust → Access → Applications → Add `deploy.yourdomain.com`
2. Policy: **Service Auth** only
3. Create **Service Token** → save Client ID and Secret
4. Enable **Full (Strict)** SSL on the domain

### WAF (recommended)

- Rate limit `app.yourdomain.com/api/auth/*` → 20 req/min per IP
- Enable Bot Fight Mode

---

## Phase 3 — GitHub secrets

Create environment **`production`** (Settings → Environments → New environment).

| Secret                    | Source                                                        |
| ------------------------- | ------------------------------------------------------------- |
| `DEPLOY_WEBHOOK_URL`      | `https://deploy.yourdomain.com/hooks/deploy-productivity-app` |
| `DEPLOY_WEBHOOK_SECRET`   | `/etc/productivity-app/webhook-secret` on VM                  |
| `CF_ACCESS_CLIENT_ID`     | Cloudflare service token                                      |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare service token                                      |

---

## Phase 4 — GHCR

After the first successful deploy workflow:

1. GitHub → Packages → `productivity-app`
2. Package settings → **Change visibility to Public**

No `docker login` needed on the VM for public packages.

---

## Phase 5 — First deploy

### Manual smoke test (on VM)

```bash
cd /opt/productivity-app
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
curl http://127.0.0.1:3001/health
```

### Test webhook locally

```bash
SECRET=$(sudo cat /etc/productivity-app/webhook-secret)
SIG=$(printf '' | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
curl -X POST -H "X-Hub-Signature-256: sha256=$SIG" \
  http://127.0.0.1:9000/hooks/deploy-productivity-app
```

### Automated deploy

Push to `main` → CI passes → Deploy workflow builds, scans, pushes, and triggers webhook.

---

## Rollback

```bash
# SSH to VM
cd /opt/productivity-app
# Edit docker-compose.prod.yml image tag to a previous sha-* tag
nano docker-compose.prod.yml
sudo ./deploy.sh
```

---

## Secret rotation

| Secret           | Steps                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Webhook HMAC     | `sudo openssl rand -hex 32                                                                    | sudo tee /etc/productivity-app/webhook-secret` → re-render hooks.json → update GitHub secret → restart webhook |
| CF service token | Create new in Cloudflare → update GitHub → delete old                                         |
| User sessions    | `sqlite3 /opt/productivity-app/data/productivity_app.db "UPDATE users SET api_token = NULL;"` |

---

## Troubleshooting

| Issue                            | Check                                               |
| -------------------------------- | --------------------------------------------------- |
| Deploy workflow fails on webhook | `journalctl -u productivity-webhook -f`             |
| App unhealthy                    | `docker logs productivity-app`                      |
| HMAC rejected                    | Secret mismatch between VM and GitHub               |
| CF Access 403                    | Service token headers missing or expired            |
| Registration blocked             | Set `ALLOW_REGISTRATION=true` in `.env` temporarily |

Logs:

```bash
tail -f /var/log/productivity-deploy.log
journalctl -u productivity-webhook -f
docker logs -f productivity-app
```

---

## Security checklist

- [ ] `ALLOW_REGISTRATION=false` in production `.env`
- [ ] `FRONTEND_URL` is HTTPS, not localhost
- [ ] SSH restricted to your IP (UFW)
- [ ] App and webhook on `127.0.0.1` only
- [ ] Cloudflare Access on deploy subdomain
- [ ] All four GitHub production secrets set
- [ ] GHCR package is public (or VM has read PAT)
- [ ] No `.env` committed to git

---

## Incident response

1. Rotate `DEPLOY_WEBHOOK_SECRET` and CF service token immediately
2. Block suspicious IPs in Cloudflare WAF
3. Review `/var/log/productivity-deploy.log`
4. Invalidate all user tokens if auth breach suspected
5. Pull known-good image tag and redeploy
