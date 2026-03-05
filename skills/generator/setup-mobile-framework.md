# Skill: Setup Mobile Framework

## Purpose
Copy mobile core files from `templates/mobile/` into `output/` and set up WebdriverIO + Appium project configuration. Runs first in the Generator stage for `type=mobile`.

## Paths
- WDIO config: `output/wdio.conf.ts`
- Mobile core files: `output/core/base-screen.ts`, `output/core/locator-loader-mobile.ts`, `output/core/capabilities.ts`
- Mobile deps template: `templates/mobile/package-mobile-additions.json`

## Process

### Step 1: Create Directory Structure

Ensure these directories exist inside `output/`:
```
output/core/               (may already exist from web scenarios)
output/screens/            (NEW — Screen Objects live here)
output/locators/mobile/    (NEW — mobile locator JSONs)
output/tests/mobile/android/
output/tests/mobile/ios/
output/test-results/screenshots/
```

If `folder` parameter is provided, also create:
```
output/tests/mobile/android/{folder}/
output/tests/mobile/ios/{folder}/
output/{folder}/
```

### Step 2: Copy Mobile Core Files

Copy from `templates/mobile/` to `output/core/`. **Do NOT overwrite if already exists.**

| Source | Destination |
|--------|------------|
| `templates/mobile/locator-loader-mobile.ts` | `output/core/locator-loader-mobile.ts` |
| `templates/mobile/base-screen.ts` | `output/core/base-screen.ts` |
| `templates/mobile/capabilities.ts` | `output/core/capabilities.ts` |

### Step 3: Copy WDIO Config

Copy `templates/mobile/wdio.conf.ts` → `output/wdio.conf.ts`. **Do NOT overwrite if already exists.**

Fix the import path for capabilities:
- The template references `./core/capabilities` which is correct for `output/wdio.conf.ts`

### Step 4: Merge WDIO Dependencies into package.json

Read `output/package.json`. Read `templates/mobile/package-mobile-additions.json`.

Merge the `dependencies`, `devDependencies`, and `scripts` sections from the additions file into `output/package.json`. Do not remove any existing entries.

Expected additions to `package.json`:
```json
{
  "dependencies": {
    "@wdio/cli": "^9.0.0",
    "@wdio/local-runner": "^9.0.0",
    "@wdio/mocha-framework": "^9.0.0",
    "@wdio/spec-reporter": "^9.0.0",
    "@wdio/json-reporter": "^9.0.0",
    "@wdio/types": "^9.0.0",
    "webdriverio": "^9.0.0",
    "expect-webdriverio": "^5.0.0"
  },
  "devDependencies": {
    "@types/mocha": "^10.0.0"
  },
  "scripts": {
    "test:mobile:android": "npx wdio wdio.conf.ts --spec",
    "test:mobile:ios": "PLATFORM=ios npx wdio wdio.conf.ts --spec"
  }
}
```

### Step 5: Add Mobile Variables to .env.example

Read `output/.env.example`. Append these mobile-specific variables if not already present:

```bash
# ── Mobile (Appium) ──────────────────────────────────────────────────────────
# Appium server connection
APPIUM_HOST=localhost
APPIUM_PORT=4723

# Android configuration
PLATFORM=android
ANDROID_DEVICE=emulator-5554
APP_PATH=/absolute/path/to/your/app.apk
APP_PACKAGE=com.example.yourapp
APP_ACTIVITY=.MainActivity

# iOS configuration (macOS + Xcode required)
# PLATFORM=ios
# IOS_DEVICE=iPhone 15
# IOS_VERSION=17.0
# IOS_APP_PATH=/absolute/path/to/your/app.app
# IOS_BUNDLE_ID=com.example.yourapp
# IOS_UDID=                          # required for real devices (xcrun devicectl list devices)

# App state
NO_RESET=false                       # true = preserve app state between runs
```

### Step 6: Verify Setup

Check that all required files exist before proceeding.

## Quality Checks
- [ ] `output/core/base-screen.ts` exists
- [ ] `output/core/locator-loader-mobile.ts` exists
- [ ] `output/core/capabilities.ts` exists
- [ ] `output/wdio.conf.ts` exists
- [ ] `output/package.json` includes `webdriverio` and `@wdio/cli` in dependencies
- [ ] `output/.env.example` includes `APPIUM_HOST`, `APP_PATH`, `PLATFORM`
- [ ] `output/screens/` directory exists
- [ ] `output/locators/mobile/` directory exists
- [ ] `output/tests/mobile/android/` and `output/tests/mobile/ios/` directories exist
