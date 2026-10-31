#!/usr/bin/env bash
# GRAVITY BREAK — build (static copy to dist/) and serve in the foreground.
# deployment-output.json is written to OPENCODE_WEB_DIR (worker metadata) and to
# /home/runner/work/_temp/omgithub-web/deployment-output.json; source and built
# output stay inside PROJECT_DIR (dist/).
# Every command is run under /usr/bin/time -p for per-command timing.
set -euo pipefail
cd "$(dirname "$0")"
PROJECT_DIR="$(pwd -P)"
export DIST_DIR="$PROJECT_DIR/dist"
export PORT="${PORT:-3000}"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"

# 1) Build: copy the static app sources into dist/ (fresh, deterministic).
/usr/bin/time -p rm -rf "$DIST_DIR" 2>&1 || true
/usr/bin/time -p mkdir -p "$DIST_DIR" 2>&1
/usr/bin/time -p cp -a games/gravity-break/. "$DIST_DIR/" 2>&1
echo "[build] dist ready ($(find "$DIST_DIR" -type f | wc -l) files)"

# 2) Deployment metadata (project = PROJECT_DIR, directory = built dist).
/usr/bin/time -p mkdir -p "$WEB_DIR" /home/runner/work/_temp/omgithub-web 2>&1
/usr/bin/time -p node -e '
  const fs = require("node:fs");
  const payload = JSON.stringify({ project: process.argv[1], directory: process.argv[2] });
  fs.writeFileSync(process.argv[3], payload);
  try { fs.writeFileSync(process.argv[4], payload); } catch {}
' "$PROJECT_DIR" "$DIST_DIR" "$WEB_DIR/deployment-output.json" \
  /home/runner/work/_temp/omgithub-web/deployment-output.json \
  2>&1
echo "[deploy] deployment-output.json -> project=$PROJECT_DIR directory=$DIST_DIR"

# 3) Dependencies: none — the server uses only the Node standard library.
# 4) Serve dist/ in the foreground on $PORT.
exec /usr/bin/time -p node "$PROJECT_DIR/scripts/serve.mjs"
