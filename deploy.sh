#!/usr/bin/env bash
# Hausmanager — Update-Deployment auf dem Synology NAS
# Aufruf:  cd /volume1/docker/hausmanager && ./deploy.sh

set -euo pipefail

cd "$(dirname "$0")"

BRANCH="${HAUSMANAGER_BRANCH:-claude/nas-deployment-plan-ZkkqP}"

echo "==> 1/5  Aktuellen Stand vom Remote holen (Branch: $BRANCH)"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "==> 2/5  Docker-Image neu bauen"
docker compose build --pull

echo "==> 3/5  Container austauschen (Migration läuft beim Start)"
docker compose up -d

echo "==> 4/5  Status anzeigen"
docker compose ps

echo "==> 5/5  Alte Images aufräumen"
docker image prune -f

echo ""
echo "Deploy fertig: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Logs: docker compose logs -f hausmanager"
