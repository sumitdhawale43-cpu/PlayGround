#!/usr/bin/env bash
# GRAVITY BREAK — once-per-worker prerequisites.
# Idempotent and safe to re-run. Kept minimal; all real startup work lives in
# start.sh so the controller can reuse a healthy server across workers.
set -euo pipefail
cd "$(dirname "$0")"
export RUNTIME_DIR="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"
export OPENCODE_WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"

# 1) Worker metadata + deployment directories exist.
/usr/bin/time -p mkdir -p "$OPENCODE_WEB_DIR" /home/runner/work/_temp/omgithub-web 2>&1

# 2) Node runtime usable for the stdlib static server.
/usr/bin/time -p node --version 2>&1

# 3) Capture prerequisites from the runtime are present (browser + config).
/usr/bin/time -p test -f "$RUNTIME_DIR/scripts/default-capture.mjs" 2>&1
if [ -f "$HOME/.local/share/omgithub-playwright/linux.json" ]; then
  echo '[startup] playwright runtime configs present (no installation needed).'
fi

echo '[startup] prerequisites ready.'
