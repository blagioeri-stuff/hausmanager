# Hausmanager

Next.js 14 App für Schweizer Hausbesitzer: Rücklagenplanung, Garten, Dokumente, KI-Assistenz.
SQLite + Prisma. Tailwind. Optimiert für Self-Hosting auf einem Synology NAS hinter einem Cloudflare-Tunnel.

## Lokale Entwicklung

```bash
cp .env.example .env       # DATABASE_URL reicht für lokale Tests
npm install
npm run db:migrate
npm run dev                # http://localhost:3000
npm test                   # Vitest
npx tsc --noEmit           # TypeScript-Check
```

## Production-Deployment auf Synology NAS

### Voraussetzungen
- DSM 7.2+ mit installiertem **Container Manager**
- SSH aktiviert (Systemsteuerung → Terminal & SNMP)
- Cloudflare-Account mit eigener Domain (für den Tunnel)

### Schritt 1 — Passwort-Hash erzeugen (auf dem Dev-Rechner)

```bash
node scripts/hash-password.mjs "DEIN-PASSWORT"
```

Der Befehl druckt drei Zeilen (`APP_PASSWORD_HASH`, `SESSION_SECRET`, `SESSION_MAX_AGE`).
Sicher kopieren — wird gleich auf dem NAS gebraucht.

### Schritt 2 — Cloudflare Tunnel anlegen

1. https://one.dash.cloudflare.com → **Networks → Tunnels → Create a tunnel**
2. Connector: **Cloudflared**, Name z.B. `hausmanager-nas`
3. Tunnel-Token kopieren (wird gleich gebraucht)
4. Public Hostname:
   - Subdomain: `hausmanager`
   - Domain: deine Cloudflare-verwaltete Domain
   - Service: HTTP → `hausmanager:3000` (Container-Name aus compose, **nicht localhost**)
5. Speichern (DNS wird automatisch gesetzt).

### Schritt 3 — Verzeichnis auf dem NAS anlegen

```bash
ssh deinuser@<NAS-IP>
sudo mkdir -p /volume1/docker/hausmanager
sudo chown $(whoami) /volume1/docker/hausmanager
cd /volume1/docker/hausmanager
git clone https://github.com/<dein-user>/hausmanager.git .
git checkout claude/nas-deployment-plan-ZkkqP
```

### Schritt 4 — `.env` schreiben

Im Verzeichnis `/volume1/docker/hausmanager`:

```
APP_PASSWORD_HASH='<aus Schritt 1>'
SESSION_SECRET='<aus Schritt 1>'
SESSION_MAX_AGE=2592000
TUNNEL_TOKEN='<aus Schritt 2>'
CLAUDE_API_KEY=sk-ant-...
```

```bash
chmod 600 .env
```

### Schritt 5 — Erststart

```bash
docker compose build
docker compose up -d
docker compose logs -f hausmanager   # bis "Ready in …"
docker compose logs -f cloudflared   # "Registered tunnel connection"
```

Im Browser: `https://hausmanager.deine-domain.tld` → Login-Seite.

## Updates ausrollen

Auf dem Dev-Rechner committen und pushen. Auf dem NAS:

```bash
ssh deinuser@<NAS-IP>
cd /volume1/docker/hausmanager
./deploy.sh
```

Dauert 1–3 min, alter Container läuft während des Builds weiter.
Standard-Branch ist in `deploy.sh` hinterlegt; mit Env-Var überschreibbar:

```bash
HAUSMANAGER_BRANCH=main ./deploy.sh
```

## Backups

- **Automatisch**: täglich (`node-cron`) als `<ts>_auto.db` + `<ts>_auto_uploads.tar.gz` im `BACKUP_DIR`. Es werden die letzten 10 behalten.
- **Manuell**: `/api/backup` POST `{ "action": "create" }` oder über die Einstellungen-Seite.
- **Restore (DB)**: über die Einstellungen-Seite. Uploads müssen manuell entpackt werden:
  ```bash
  docker compose exec hausmanager tar -xzf /app/data/backups/<datei>_uploads.tar.gz -C /
  ```
- **Off-NAS**: zusätzlich Synology **Hyper Backup** auf das Verzeichnis `/volume1/docker/hausmanager/` plus Docker-Volumes einrichten.

## Environment-Variablen (Übersicht)

| Variable             | Pflicht | Zweck                                              |
|----------------------|:-------:|----------------------------------------------------|
| `DATABASE_URL`       |   ✓     | SQLite-Datei, Docker: `file:/app/data/...`         |
| `APP_PASSWORD_HASH`  |   ✓     | scrypt-Hash des Login-Passworts                    |
| `SESSION_SECRET`     |   ✓     | HMAC-Secret für das Session-Cookie                 |
| `SESSION_MAX_AGE`    |         | Session-Dauer in Sekunden (Standard 30 Tage)       |
| `TUNNEL_TOKEN`       |   ✓     | Cloudflare-Tunnel-Token (nur NAS)                  |
| `CLAUDE_API_KEY`     |         | Claude-API-Key (sonst aus DB-Einstellungen)        |
| `UPLOAD_DIR`         |         | Upload-Verzeichnis (Docker: `/app/uploads`)        |
| `BACKUP_DIR`         |         | Backup-Verzeichnis (Docker: `/app/data/backups`)   |

## Architektur

Siehe `CLAUDE.md` für eine vollständige Übersicht über Datenmodelle, API-Routen und Schlüsseldateien.
