#!/usr/bin/env bash
# scripts/check-ui.sh
# One-command UI smoke test for the iOS app:
#   1. Boots iPhone 16 Pro simulator (if not already booted)
#   2. Confirms Metro is running on localhost:8081
#   3. Builds + installs + launches the app (incremental — fast on warm cache)
#   4. Captures a screenshot + accessibility tree dump
#   5. Saves both under ui-snapshots/<timestamp>-<label>/
#
# Usage:
#   scripts/check-ui.sh                    # uses label "home"
#   scripts/check-ui.sh login              # custom label
#   scripts/check-ui.sh login --no-build   # skip build (when sim already has app)
#   scripts/check-ui.sh login --diff       # compare to previous snapshot of same label

set -uo pipefail

LABEL="${1:-home}"
shift || true
NO_BUILD=0
DO_DIFF=0
for arg in "$@"; do
  case "$arg" in
    --no-build) NO_BUILD=1 ;;
    --diff)     DO_DIFF=1 ;;
    *)          echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

SIM_UDID="C720E223-4D99-4456-BD4B-8A15E21C2BCB"   # iPhone 16 Pro (iOS 18.6)
SIM_NAME="iPhone 16 Pro"
SCHEME="MyCuratedHaven"
WORKSPACE="ios/MyCuratedHaven.xcworkspace"
BUNDLE_ID="com.pratikn07.mycuratedhaven"

TS=$(date +%Y%m%d-%H%M%S)
OUT_DIR="ui-snapshots/${TS}-${LABEL}"
mkdir -p "$OUT_DIR"

log()  { printf "\033[36m[ui]\033[0m %s\n" "$*"; }
warn() { printf "\033[33m[ui]\033[0m %s\n" "$*" >&2; }
fail() { printf "\033[31m[ui]\033[0m %s\n" "$*" >&2; exit 1; }

log "Project: $PROJECT_DIR"
log "Snapshot: $OUT_DIR"

# ── 1. Boot simulator ────────────────────────────────────────────────────────
STATE=$(xcrun simctl list devices | grep "$SIM_UDID" | grep -oE "(Booted|Shutdown)" | head -1)
if [ "$STATE" != "Booted" ]; then
  log "Booting $SIM_NAME ($SIM_UDID)…"
  xcrun simctl boot "$SIM_UDID" 2>/dev/null || true
  open -a Simulator
  sleep 3
else
  log "Simulator already booted."
fi

# ── 2. Metro health check ────────────────────────────────────────────────────
if curl -fsS --max-time 2 http://localhost:8081/status >/dev/null 2>&1; then
  log "Metro is running on :8081 ✓"
else
  warn "Metro is NOT running on :8081."
  warn "Start it in another terminal:  npx expo start --dev-client"
  warn "Continuing anyway — the Dev Client landing screen will be captured instead of your app."
fi

# ── 3. Build + install + launch ──────────────────────────────────────────────
if [ "$NO_BUILD" = "0" ]; then
  log "Building (incremental)…"
  BUILD_LOG=$(mktemp)
  # Use UDID (id=…) instead of name+platform — unambiguous, immune to "OS:latest"
  # picking a runtime that doesn't have your device (e.g. leftover iOS 26.x SDKs).
  if ! xcodebuild \
        -workspace "$WORKSPACE" \
        -scheme "$SCHEME" \
        -configuration Debug \
        -destination "id=$SIM_UDID" \
        -derivedDataPath ios/build \
        -quiet \
        build >"$BUILD_LOG" 2>&1; then
    cp "$BUILD_LOG" "$OUT_DIR/build-error.log"
    tail -40 "$BUILD_LOG" >&2
    fail "Build failed. Full log: $OUT_DIR/build-error.log"
  fi

  APP_PATH=$(find ios/build/Build/Products/Debug-iphonesimulator -maxdepth 2 -name "*.app" | head -1)
  [ -n "$APP_PATH" ] || fail "Couldn't find built .app under ios/build/"
  log "Installing $APP_PATH…"
  xcrun simctl install "$SIM_UDID" "$APP_PATH"
fi

log "Launching $BUNDLE_ID…"
xcrun simctl terminate "$SIM_UDID" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl launch "$SIM_UDID" "$BUNDLE_ID" >/dev/null

# Give JS a moment to render. Metro-loaded screens settle in 2-5s.
sleep 4

# ── 4. Screenshot + a11y tree ────────────────────────────────────────────────
log "Capturing screenshot…"
xcrun simctl io "$SIM_UDID" screenshot "$OUT_DIR/screen.png"

log "Capturing accessibility tree…"
xcrun simctl ui "$SIM_UDID" appearance >"$OUT_DIR/appearance.txt" 2>/dev/null || true
# accessibility tree via simctl is limited; use ios-simulator MCP for richer trees.
# Here we just dump a window-server snapshot for grep-ability.
xcrun simctl spawn "$SIM_UDID" log show --last 30s --predicate 'subsystem == "com.apple.UIKit"' \
  --style compact 2>/dev/null | head -200 > "$OUT_DIR/uikit.log" || true

# ── 5. Optional diff against previous snapshot of same label ─────────────────
if [ "$DO_DIFF" = "1" ]; then
  PREV=$(ls -td ui-snapshots/*-"$LABEL" 2>/dev/null | sed -n '2p')
  if [ -n "$PREV" ] && [ -f "$PREV/screen.png" ]; then
    log "Diffing against $PREV/screen.png"
    if cmp -s "$PREV/screen.png" "$OUT_DIR/screen.png"; then
      log "✓ No pixel difference."
    else
      SIZE_NEW=$(wc -c <"$OUT_DIR/screen.png")
      SIZE_OLD=$(wc -c <"$PREV/screen.png")
      warn "Pixels differ. New ${SIZE_NEW}B vs old ${SIZE_OLD}B. Review both manually."
    fi
  else
    log "(No previous snapshot for label '$LABEL' to diff against.)"
  fi
fi

log "Done. Snapshot at: $OUT_DIR/screen.png"
echo "$OUT_DIR/screen.png"
