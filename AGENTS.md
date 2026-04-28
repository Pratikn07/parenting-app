# AGENTS.md — iOS Build & Test Guide

This project is an **Expo / React Native** app with native iOS at `ios/MyCuratedHaven.xcworkspace`. This file tells the agent how to build, run, and visually verify the iOS app.

> Companion to `.cursorrules` (which covers DB / design-system / structure pre-checks). Read both.

---

## Project facts

- **Stack**: Expo `53.0.20` + React Native `0.79.5` + expo-router `5.x`
- **iOS workspace**: `ios/MyCuratedHaven.xcworkspace` (CocoaPods — always use `.xcworkspace`, never `.xcodeproj`)
- **Scheme**: `MyCuratedHaven`
- **Bundle ID**: see `app.json` → `expo.ios.bundleIdentifier`
- **Default sim**: `iPhone 16 Pro` (iOS 18.6) — UDID `C720E223-4D99-4456-BD4B-8A15E21C2BCB`
- **Xcode**: 16.4 (Xcode 26.3+ would unlock Apple's first-party `xcrun mcpbridge` MCP)

## Available MCP servers for iOS work

Configured in `~/.cursor/mcp.json`:

| Server | Use it for |
|---|---|
| `xcodebuild` ([XcodeBuildMCP](https://github.com/cameroncooke/XcodeBuildMCP)) | Build/test/clean the workspace, list/boot/shutdown simulators, install & launch `.app`, capture build logs, run XCTest |
| `ios-simulator` ([ios-simulator-mcp](https://github.com/joshuayoes/ios-simulator-mcp)) | Drive a running app: tap, type, swipe, screenshot, accessibility tree |

**Prefer MCP tools over raw shell** — they return structured results and screenshots flow into the chat as inline images for vision models to reason about.

---

## Standard agent loop

```
1. Edit JS/TS (or native iOS code under ios/)
2. Build+run in one shot:
     xcodebuild MCP → simulator/build-and-run
       workspacePath: ios/MyCuratedHaven.xcworkspace
       scheme:        MyCuratedHaven
       simulatorName: "iPhone 16 Pro"
   (Boots the sim if needed, installs, launches.)
3. On error: GetBuildLog → fix → repeat
4. Verify visually:
     ios-simulator MCP → get_screenshot
     ios-simulator MCP → ui_describe_all  (accessibility tree)
5. Drive UI:
     ios-simulator MCP → ui_tap / ui_type / ui_swipe
6. Capture logs:
     xcodebuild MCP → logging/start-simulator-log-capture (stateful)
     ... do stuff ...
     xcodebuild MCP → logging/stop-simulator-log-capture
7. Run JS tests:  npm test  /  npm run test:unit
8. Iterate until UI matches the spec and tests are green.
```

## xcodebuild MCP tool cheat-sheet (72 tools across 14 workflows)

Most relevant for this project:

| Workflow | Top tools |
|---|---|
| `simulator` | `build-and-run`, `build`, `install`, `launch-app`, `boot`, `get-app-path`, `get-app-bundle-id` |
| `simulator-management` | list, boot, shutdown, erase, set appearance/locale |
| `ui-automation` | screenshot, tap, type, swipe, describe UI tree |
| `logging` | start/stop simulator + device log capture (stateful) |
| `debugging` | LLDB attach, breakpoints, stack, variables (stateful) |
| `coverage` | per-target and per-file coverage from xcresult bundles |
| `project-discovery` | `discover-projects`, `list-schemes`, `show-build-settings` |
| `device` | build/install/launch/test on physical iPhone |

## Quick command reference (when MCP isn't enough)

```bash
# Cold full build via Expo (regenerates Pods if needed)
npm run ios -- --device "iPhone 16 Pro"

# Direct xcodebuild (faster on incremental changes)
xcodebuild \
  -workspace ios/MyCuratedHaven.xcworkspace \
  -scheme MyCuratedHaven \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro,OS=18.6' \
  -derivedDataPath ios/build \
  build | xcbeautify

# Boot + install + launch
SIM=C720E223-4D99-4456-BD4B-8A15E21C2BCB
xcrun simctl boot $SIM 2>/dev/null
open -a Simulator
APP=$(find ios/build/Build/Products/Debug-iphonesimulator -name "MyCuratedHaven.app" | head -1)
xcrun simctl install $SIM "$APP"
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$APP/Info.plist")
xcrun simctl launch $SIM "$BUNDLE_ID"

# Screenshot
xcrun simctl io $SIM screenshot /tmp/sim.png
# (then Read /tmp/sim.png — Cursor displays it inline)

# Live JS logs (Metro)
npx expo start --dev-client

# Native logs
xcrun simctl spawn $SIM log stream --level=debug \
  --predicate 'processImagePath endswith "MyCuratedHaven"'
```

## Test commands (already configured)

| Command | Runs |
|---|---|
| `npm test` | Jest — React Native component tests in `__tests__/` |
| `npm run test:unit` | Vitest — pure-logic tests `src/**/*.test.ts` |
| `npm run test:business` | Vitest — business-rule tests `src/**/*.business.test.ts` |
| `npm run test:coverage` | Jest with coverage to `coverage/` |
| `npm run test:types` | `tsc --noEmit` — TypeScript type-check |
| `npm run test:ui` | Build + launch + screenshot via `scripts/check-ui.sh` |
| `npm run test:flow` | Maestro — all flows in `.maestro/` |
| `npm run test:flow:smoke` | Maestro — just `smoke.yaml` (fast sanity) |
| `npm run probe` | `npx tsx scripts/probe.ts` — ad-hoc logic scratchpad |
| `npm run verify` | `test:types` + `test:unit` + `test:ui` (the "feature done" combo) |
| `npm run lint` | `expo lint` |

---

## Big Feature Verification Workflow ⚠️ MANDATORY for non-trivial features

When the user asks for a "feature" (anything beyond a 1-2 line tweak), follow this loop EXACTLY. Do not skip steps. Do not declare done before all green checks.

### Step 1 — Plan the verification surface

Before writing code, identify:

| Change touches | Verify with |
|---|---|
| Pure logic (`src/lib/`, `src/services/`, hooks/) | **Vitest** test in `src/**/*.test.ts` (or `*.business.test.ts` for business rules) |
| RN component | **Jest** test in `__tests__/` |
| Screen UI | **`scripts/check-ui.sh <label>`** + visual review of the screenshot |
| Multi-screen flow (login, checkout, etc.) | **Maestro** flow in `.maestro/<feature>.yaml` |
| Type contract (interfaces, schemas) | `npm run test:types` (or set `touch .cursor/typecheck-on-stop` to run on every turn) |

State the plan in 3-5 lines BEFORE editing. Example:

> "I'll add a `validateChildAge` function in `src/lib/validation.ts`. Verification: new vitest cases in `validation.business.test.ts` for boundary inputs (0, 1, 5, 12, 18, negative, NaN), plus a Maestro flow that opens onboarding and types '4' to confirm the UI accepts it."

### Step 2 — Test-first when feasible

For pure logic, write the failing test BEFORE the implementation. Run it once to confirm it fails for the right reason. Then implement.

For UI/integration, this is impractical — write the implementation, then immediately verify (Step 3).

### Step 3 — After every meaningful edit, run the relevant verifier

| Edit kind | Run |
|---|---|
| Logic in `src/` | `npm run test:unit -- --run` (or let the stop hook do it) |
| Component in `src/frontend/components/` | `npm test -- --bail` |
| Type/interface change | `npm run test:types` |
| Screen change | `scripts/check-ui.sh <screen-label>` and look at the PNG |
| Flow change | `maestro test .maestro/<feature>.yaml` |

The stop hook handles `vitest` + `jest` automatically — but YOU should still run the explicit verifier when iterating, not wait for the hook.

### Step 4 — Final acceptance: run `npm run verify`

Before declaring the feature done, run **`npm run verify`**:

```
test:types  →  test:unit  →  test:ui
```

All three must pass. If any fail, fix the next failure and re-run. Repeat until clean.

For features with a documented Maestro flow, ALSO run `npm run test:flow` — Maestro flows aren't in `verify` because they require Metro to be running.

### Step 5 — Show the user the proof

When you say "done", include in your response:

1. Exit codes / pass counts from the relevant verifiers (paste the last few lines)
2. Screenshot inline (use the `Read` tool on the latest `ui-snapshots/*/screen.png`)
3. A 1-line "what to look at" pointer (e.g., "Tap onboarding → name field accepts 4 chars")

### Anti-patterns the agent must NOT do

- ❌ Declaring done after only writing code, without running tests
- ❌ Saying "the tests should pass" without running them
- ❌ Skipping the screenshot for a UI-touching change
- ❌ Suppressing failures to make `verify` green (e.g., `-- --silent` to hide errors, deleting tests)
- ❌ Marking unrelated test failures as "pre-existing" without checking git blame
- ❌ Running the build with `&` and not waiting for the result

### When to use `scripts/probe.ts`

For "what does function `f(x)` actually return?" — write 5 lines into `scripts/probe.ts`, `npm run probe`, read the output. Useful when:

- You need to sanity-check an external API response shape
- You want to see how a function behaves on an edge case before committing to a test name
- You're decoding an opaque error to figure out what to assert against

After confirming behavior, **promote the probe to a real test** and reset `scripts/probe.ts`.

### Big-feature mode: turn on type checking in the stop hook

For a multi-day feature where you're refactoring types:

```bash
touch .cursor/typecheck-on-stop
```

Now the stop hook ALSO runs `tsc --noEmit` after every turn. Adds ~10-30s per turn but catches type regressions instantly. Delete the file when the feature lands.

There is no XCUITest target wired up. If you need true on-device UI tests, add **Maestro** (`brew install maestro`) and run flows from `.maestro/*.yaml` — they pair well with `ios-simulator` MCP for screenshot verification between steps.

## Visual verification rules

- After **any** UI change, take a screenshot and inspect it before claiming done.
- For complex flows, use `describe_ui` (accessibility tree) over screenshots — it's deterministic and cheaper than vision.
- Keep one simulator booted across iterations to avoid the 20-30s cold-boot cost.

## Common gotchas

- **Pods drift** after merging `package.json` changes that touch native deps → `cd ios && pod install`
- **Stale Metro cache** after odd JS errors → `npx expo start -c`
- **Stale derived data** after weird native errors → `rm -rf ios/build && rm -rf ~/Library/Developer/Xcode/DerivedData/MyCuratedHaven-*`
- **Code-signing prompts** can break sandboxed shell calls — first run may need to be done manually
- **Simulator drift**: if `xcrun simctl list` returns garbage, run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer && xcrun simctl shutdown all`

## Auto-iterate-until-green (`.cursor/hooks/test-loop.sh`)

A `stop` hook re-runs Vitest then Jest after every agent turn. On failure it returns a `followup_message` so the agent automatically iterates. Configured in `.cursor/hooks.json` with `loop_limit: 3`.

The hook is conservative — it skips when:
- Status isn't `completed` (agent aborted/errored)
- We've already retried 3 times this turn
- `.cursor/skip-test-loop` exists (escape hatch — auto-cleared on use)
- Working tree is clean
- No source file was modified in the last 10 minutes

**Escape hatch** when the failure is unrelated to current work or you want a quick "stop":

```bash
touch .cursor/skip-test-loop
```

The agent is also instructed to do this in the followup message itself when it judges the failure is pre-existing.

**Disable the hook entirely** by deleting (or renaming) `.cursor/hooks.json`.

**Debug locally**:

```bash
echo '{"status":"completed","loop_count":0}' | .cursor/hooks/test-loop.sh
```

## What's intentionally not set up

- **No `xrun mcpbridge`** — requires Xcode 26.3+; you're on 16.4. Upgrade is straightforward (your macOS 15.7.5 is supported). Adds SwiftUI `RenderPreview`, Issue Navigator access, and Apple-doc semantic search.
- **No swiftformat hook** — no first-party Swift code to format; Expo manages the iOS shell.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **parenting-app** (324695 symbols, 443498 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/parenting-app/context` | Codebase overview, check index freshness |
| `gitnexus://repo/parenting-app/clusters` | All functional areas |
| `gitnexus://repo/parenting-app/processes` | All execution flows |
| `gitnexus://repo/parenting-app/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
