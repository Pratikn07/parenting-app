# Maestro flows

UI flow tests for MyCuratedHaven. Each `*.yaml` file is a flow.

## Run

```bash
# Single flow
maestro test .maestro/smoke.yaml

# All flows
maestro test .maestro/

# All flows tagged "smoke"
maestro test .maestro/ --include-tags smoke
```

Screenshots from `takeScreenshot:` steps land in `~/.maestro/tests/<runId>/`.

## Convention

| File pattern | Purpose |
|---|---|
| `smoke.yaml` | Bare-minimum "app launches and renders" |
| `<feature>.yaml` | One flow per feature (e.g., `recipe-detail.yaml`, `chat.yaml`) |
| `_helpers/*.yaml` | Reusable sub-flows (login, navigate to tab, etc.) |

## Writing a new flow

```yaml
appId: com.pratikn07.mycuratedhaven
name: <human-readable description>
tags: [feature-x]
---
- launchApp
- tapOn: "Login"
- inputText: "test@example.com"
- assertVisible: "Welcome"
- takeScreenshot: dashboard
```

Reference: <https://maestro.mobile.dev/api-reference/commands>

## Prerequisites

1. A simulator booted (`xcrun simctl boot C720E223-4D99-4456-BD4B-8A15E21C2BCB`)
2. The app installed (`scripts/check-ui.sh` does this for you)
3. Metro running if you want to see real screens (`npx expo start --dev-client`)
