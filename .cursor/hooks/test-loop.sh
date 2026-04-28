#!/usr/bin/env bash
# Cursor `stop` hook: re-run tests after the agent finishes a turn and, if
# they fail, return a `followup_message` so the agent auto-iterates until green.
#
# Bails out (no follow-up) when:
#   - Agent didn't actually finish cleanly (status != "completed")
#   - We've already retried `loop_limit` times (defense in depth)
#   - Working tree is clean (no edits → no need to re-test)
#   - The escape-hatch file `.cursor/skip-test-loop` exists (agent or human can
#     `touch` it to disable the loop for one turn)
#
# Local debug:
#   echo '{"status":"completed","loop_count":0}' | .cursor/hooks/test-loop.sh

set -uo pipefail

PROJECT_DIR="${CURSOR_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR"

INPUT="$(cat)"
STATUS=$(printf '%s' "$INPUT" | jq -r '.status // "unknown"')
LOOP=$(printf  '%s' "$INPUT"  | jq -r '.loop_count // 0')

emit_noop() { echo '{}'; exit 0; }

[ "$STATUS" = "completed" ]            || emit_noop
[ "$LOOP" -lt 3 ]                      || emit_noop

# Escape hatch (checked early so it always self-clears when present).
# Agent or human can `touch .cursor/skip-test-loop` to disable the loop for one turn.
if [ -f .cursor/skip-test-loop ]; then
  rm -f .cursor/skip-test-loop
  emit_noop
fi

[ -n "$(git status --porcelain 2>/dev/null)" ] || emit_noop

# Only loop if a source file was actually touched in the last ~10 min — avoids
# firing on stale uncommitted changes from prior sessions.
RECENT=$(find . \
  -path ./node_modules -prune -o \
  -path ./ios/Pods -prune -o \
  -path ./ios/build -prune -o \
  -path ./.git -prune -o \
  -path ./.expo -prune -o \
  -path ./dist -prune -o \
  -path ./coverage -prune -o \
  -path ./.cursor -prune -o \
  -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' \
            -o -name '*.json' -o -name '*.swift' -o -name '*.m' -o -name '*.mm' \) \
  -mmin -10 -print 2>/dev/null | head -1)
[ -n "$RECENT" ] || emit_noop

JEST="$PROJECT_DIR/node_modules/.bin/jest"
VITEST="$PROJECT_DIR/node_modules/.bin/vitest"
TSC="$PROJECT_DIR/node_modules/.bin/tsc"
LOG=$(mktemp)
trap 'rm -f "$LOG"' EXIT

# Opt-in: set CURSOR_HOOK_TYPECHECK=1 (or `touch .cursor/typecheck-on-stop`)
# to also run `tsc --noEmit` after vitest/jest. Adds ~10-30s per turn but
# catches type regressions during big refactors.
TYPECHECK=0
[ "${CURSOR_HOOK_TYPECHECK:-0}" = "1" ] && TYPECHECK=1
[ -f .cursor/typecheck-on-stop ]        && TYPECHECK=1

emit_followup() {
  # $1 = which runner (vitest / jest), $2 = path to log file
  local runner="$1" log="$2"
  local body
  body=$(grep -E "^\s*(FAIL|✗|×|●|Error:|Tests:|Suites:|❯|FAIL[[:space:]])" "$log" | head -n 30)
  [ -z "$body" ] && body=$(tail -n 60 "$log")
  local body_json
  body_json=$(printf '%s' "$body" | jq -Rs .)
  jq -n --arg r "$runner" --argjson f "$body_json" \
    '{followup_message:
       ("Stop hook: " + $r + " is failing after your changes (loop "
        + (env.LOOP_COUNT // "?") + "/3). Read the failures below, fix the "
        + "NEXT failing test ONLY, then stop. If the failure is unrelated "
        + "to your edits, `touch .cursor/skip-test-loop` and stop.\n\n"
        + "----- " + $r + " output -----\n" + $f)}'
  exit 0
}
export LOOP_COUNT="$LOOP"

# Vitest first (sub-second startup; pure-logic tests in src/)
if [ -x "$VITEST" ]; then
  if ! "$VITEST" run --reporter=basic --bail=1 >"$LOG" 2>&1; then
    emit_followup "vitest" "$LOG"
  fi
fi

# Jest second (RN component tests; slower but broader)
if [ -x "$JEST" ]; then
  if ! "$JEST" --silent --bail=1 --colors=false >"$LOG" 2>&1; then
    emit_followup "jest" "$LOG"
  fi
fi

# TypeScript check (opt-in via CURSOR_HOOK_TYPECHECK=1 or .cursor/typecheck-on-stop)
if [ "$TYPECHECK" = "1" ] && [ -x "$TSC" ]; then
  if ! "$TSC" --noEmit --pretty false >"$LOG" 2>&1; then
    emit_followup "tsc" "$LOG"
  fi
fi

emit_noop
