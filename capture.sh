#!/usr/bin/env bash
# GRAVITY BREAK — screenshot capture for the preview pipeline.
# Opens the exact CAPTURE_URL in the runtime browser, waits for rendered
# content, saves final-desktop.png and final-mobile.png into CAPTURE_DIR
# (outside the source tree), cleans up its browser, and leaves the app running.
# Exit codes: 0 success · 75 temporary browser/navigation infrastructure
# failure (retry later) · 1 script or rendering defect.
set -euo pipefail
cd "$(dirname "$0")"
: "${CAPTURE_URL:?Set CAPTURE_URL}" "${CAPTURE_DIR:?Set CAPTURE_DIR}"

# CAPTURE_DIR must live outside the source tree.
case "$CAPTURE_DIR" in "$PWD"|"$PWD"/*)
  echo "CAPTURE_DIR must be outside the project source directory." >&2
  exit 1 ;;
esac

/usr/bin/time -p mkdir -p "$CAPTURE_DIR" 2>&1

status=0
/usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs" 2>&1 || status=$?
case "$status" in
  0)
    echo "[capture] ok: $CAPTURE_URL"
    echo final-desktop: "$CAPTURE_DIR/final-desktop.png"
    echo final-mobile: "$CAPTURE_DIR/final-mobile.png"
    ls -l "$CAPTURE_DIR"/final-desktop.png "$CAPTURE_DIR"/final-mobile.png 2>/dev/null || true
    exit 0 ;;
  75) echo "[capture] transient browser/navigation failure (75). Retrying may help." >&2; exit 75 ;;
  *)  echo "[capture] capture or rendering defect (mapped to 1)." >&2; exit 1 ;;
esac
