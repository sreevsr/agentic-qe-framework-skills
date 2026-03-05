# Agentic QE Framework — Skills Architecture (Claude Code)

AI-powered test automation framework that converts plain-English test scenarios into production-ready Playwright (web/API) and WebdriverIO+Appium (mobile) TypeScript tests using a composable skills-based architecture on Claude Code.

## How It Works

Write a test scenario in a simple `.md` file describing what to test. Claude Code reads the relevant skills and executes the pipeline:

| Stage | Role | Skills | Output |
|-------|------|--------|--------|
| **Analyst** | Opens browser (Playwright MCP) or device (Appium MCP), discovers elements, validates scenario steps | `skills/analyst/` (2 skills) | `analyst-report-{scenario}.md` |
| **Generator** | Produces Playwright Page Objects (web/API/hybrid) or WebdriverIO Screen Objects (mobile) with locators and spec files | `skills/generator/` (14 skills) | Complete test framework in `output/` |
| **Healer** | Runs tests, diagnoses failures across 7 web categories (A-G) or 9 mobile categories (M-A through M-I), fixes code, re-runs (max 3 cycles) | `skills/healer/` (7 skills) | Passing tests + `healer-report-{scenario}.md` |
| **Reviewer** | Audits code quality across 8 dimensions (web/API) or 9 dimensions (mobile adds Mobile Quality), scores 1-5, issues verdict | `skills/reviewer/` (10 skills) | `review-scorecard-{scenario}.md` |
| **Healer-Review** | Fixes code quality issues from Reviewer, validates tests still pass | `skills/healer-review/` (10 skills) | `healer-review-fixes-report-{scenario}.md` |
| **API Analyst** | Reads Swagger/OpenAPI specs, generates scenario `.md` files | `skills/api-analyst/` (1 skill) | Scenario `.md` files |
| **Scout** *(pre-pipeline, manual)* | Scans live DOM to map component library selectors and interaction patterns before running the pipeline | `skills/scout/` (1 skill) + `output/tools/` | `scout-reports/{scenario}-page-inventory-latest.md` |

### Pipeline by Type

```
Web:    Analyst (Playwright MCP) → Generator → Healer → Reviewer → [Healer-Review if needed]
API:    Generator → Healer → Reviewer → [Healer-Review if needed]
Hybrid: Analyst (Playwright MCP) → Generator → Healer → Reviewer → [Healer-Review if needed]
Mobile: Analyst (Appium MCP) → Generator → Healer → Reviewer → [Healer-Review if needed]
```

### Invocation

```
Run pipeline: scenario=saucedemo-cart-feature type=web
With folder:  scenario=cart-crud type=web folder=purchase
API:          scenario=users-crud type=api
Hybrid:       scenario=order-flow type=hybrid
Mobile:       scenario=login-flow type=mobile platform=android
```

### Pre-Pipeline Tool: Scout

Applications built with **Fluent UI, Material UI, Ant Design, PrimeNG, Bootstrap, or Kendo UI** use custom components (ComboBox, DataGrid, Modal, Drawer) that require multi-step interaction sequences standard Playwright selectors can't handle reliably. Run Scout once before the pipeline to map every interactive element on each page — the Generator and Healer consume this automatically.

```
# Run from output/ before starting the pipeline:
Terminal 1: npx playwright test tools/scout-agent-v4.spec.ts --project=chrome --headed --reporter=list
Terminal 2: node tools/remote-control.js   (Press S to scan, D when done)
```

Scout is NOT invoked by the pipeline. See `skills/scout/run-scout.md` for the full setup guide. For standard HTML applications, the Analyst stage alone is sufficient — Scout is only needed for component-library-heavy apps.

## Why Skills Architecture?

This framework uses **46 executable skill files** (plus 7 reference/shared docs) instead of 5 monolithic agent instructions. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full rationale.

| Benefit | How |
|---------|-----|
| **Better AI consistency** | 40-line prompts are more predictable than 400-line prompts |
| **Easy type extension** | Adding `type=mobile` = new skill files per stage, zero changes to existing skills (same pattern used for `type=hybrid`) |
| **Parallel reviewer** | 9 dimension reviews can run as parallel subagents |
| **Targeted debugging** | 1 skill = 1 output. Wrong locators? Check `generate-locators.md` |
| **Team scalability** | Different engineers can own different skills |

## Quick Start

### Prerequisites

- Claude Code CLI or VS Code extension
- Node.js v18+
- Playwright MCP server configured (for web/hybrid Analyst stage)
- **For mobile testing:**
  - Appium Server 2.x: `npm install -g appium && appium driver install uiautomator2 xcuitest`
  - Android: Android Studio with SDK, connected device or emulator (`adb devices`)
  - iOS (macOS only): Xcode with iOS Simulator or provisioned device

### Setup

1. Clone the repo:
   ```bash
   git clone <repo-url>
   cd agentic-qe-framework-skills-v5
   ```

2. Write a scenario in `scenarios/web/my-feature.md` (use `scenarios/web/_template.md` as reference)

3. Run the pipeline in Claude Code:
   ```
   scenario=my-feature type=web
   ```

4. View results:
   ```bash
   cd output
   npx playwright show-report
   ```

### Mobile Setup

1. Build the Appium MCP server:
   ```bash
   cd mcp-servers/appium && npm install && npm run build
   ```

2. Start Appium and connect a device/emulator:
   ```bash
   appium              # Terminal 1: start Appium server
   adb devices         # Terminal 2: verify device connected
   ```

3. Write a scenario in `scenarios/mobile/android/my-feature.md`

4. Run the pipeline:
   ```
   scenario=my-feature type=mobile platform=android
   ```

5. View results:
   ```bash
   cd output && npx wdio wdio.conf.ts --spec tests/mobile/android/my-feature.spec.ts
   ```

## Project Structure

```
agentic-qe-framework-skills-v5/
├── CLAUDE.md                        ← Pipeline orchestrator (always loaded by Claude Code)
├── ARCHITECTURE.md                  ← Architecture decisions and rationale
├── ENTERPRISE-SCALING-GUIDE.md      ← Multi-team scaling and CI/CD patterns
├── skills/                          ← 46 executable skill files + 7 reference/shared docs
│   ├── _shared/                     ← Shared runtime file (1 file, loaded only during spec generation)
│   │   └── keyword-reference.md     # Keyword → TypeScript code patterns
│   ├── _reference/                  ← Archived human reference docs (NOT loaded by LLM)
│   │   ├── guardrails.md            # Canonical source: helper/shared-data/assertion protection
│   │   ├── path-resolution.md       # Canonical source: file paths
│   │   ├── output-structure.md      # Canonical source: directory tree contract
│   │   ├── reporting.md             # Canonical source: reporter configuration
│   │   ├── fix-guardrails.md        # Canonical source: pre-edit gate rules
│   │   ├── post-stage-checklist.md  # Canonical source: stage verification checks
│   │   └── README.md                # Explains the tiered architecture
│   ├── analyst/                     ← Browser/device scenario execution (2 files)
│   │   ├── analyze-scenario.md      # Web/hybrid via Playwright MCP
│   │   └── analyze-scenario-mobile.md  # Mobile via Appium MCP
│   ├── generator/                   ← Code generation (14 files)
│   │   ├── setup-framework.md       # Core files and config setup (web/API/hybrid)
│   │   ├── setup-mobile-framework.md # Mobile framework setup (WebdriverIO + Appium)
│   │   ├── generate-locators.md     # JSON locator files (web/hybrid)
│   │   ├── generate-mobile-locators.md  # Mobile locator JSON files
│   │   ├── generate-pages.md        # Page Object classes (web/hybrid)
│   │   ├── generate-screens.md      # Screen Object classes (mobile)
│   │   ├── discover-helpers.md      # Helper file scanning
│   │   ├── generate-web-spec.md     # Web test specs (type=web)
│   │   ├── generate-api-spec.md     # API test specs (type=api)
│   │   ├── generate-hybrid-spec.md  # Hybrid test specs (type=hybrid)
│   │   ├── generate-mobile-spec.md  # Mobile test specs (type=mobile)
│   │   ├── setup-test-data.md       # Test data management
│   │   ├── generate-report.md       # Generator stage report
│   │   └── generate-pipeline-summary.md  # Final pipeline summary
│   ├── healer/                      ← Test healing (7 files)
│   │   ├── heal-loop.md             # Orchestrates full healing cycle
│   │   ├── pre-flight-validation.md # TypeScript checks before first run
│   │   ├── run-tests.md             # Execute specific spec file
│   │   ├── diagnose-failure.md      # Classify web failures (Categories A-G)
│   │   ├── diagnose-failure-mobile.md  # Classify mobile failures (Categories M-A through M-I)
│   │   ├── apply-fix.md             # Apply targeted fix (with inlined pre-edit gate)
│   │   └── generate-healer-report.md
│   ├── reviewer/                    ← Quality audit (10 files)
│   │   ├── review-locator-quality.md    # Dimension 1
│   │   ├── review-wait-strategy.md      # Dimension 2
│   │   ├── review-test-architecture.md  # Dimension 3
│   │   ├── review-configuration.md      # Dimension 4
│   │   ├── review-code-quality.md       # Dimension 5
│   │   ├── review-maintainability.md    # Dimension 6
│   │   ├── review-security.md           # Dimension 7
│   │   ├── review-api-quality.md        # Dimension 8
│   │   ├── review-mobile-quality.md     # Dimension 9 (mobile only)
│   │   └── aggregate-scorecard.md       # Combine scores, issue verdict
│   ├── healer-review/               ← Review fix application (10 files)
│   │   ├── fix-locator-quality.md
│   │   ├── fix-wait-strategy.md
│   │   ├── fix-test-architecture.md
│   │   ├── fix-configuration.md
│   │   ├── fix-code-quality.md
│   │   ├── fix-maintainability.md
│   │   ├── fix-security.md
│   │   ├── fix-api-quality.md
│   │   ├── fix-mobile-quality.md        # Mobile-specific fixes
│   │   └── validate-fixes.md
│   ├── api-analyst/                 ← Swagger scenario generation (1 file)
│   └── scout/                       ← Scout DOM reconnaissance (1 file)
│       └── run-scout.md             # When/how to use Scout + pipeline integration
├── scenarios/                       ← Plain English test scenarios
│   ├── web/                         # Web scenarios (with optional subfolders)
│   ├── api/                         # API scenarios
│   └── mobile/                      # Native mobile scenarios
│       ├── android/                 # Android-specific scenarios
│       └── ios/                     # iOS-specific scenarios
├── templates/                       ← Source of truth for core files
│   ├── core/                        # locator-loader.ts, base-page.ts, etc.
│   ├── config/                      # playwright.config.ts, package.json
│   └── mobile/                      # base-screen.ts, locator-loader-mobile.ts, wdio.conf.ts, capabilities.ts
├── mcp-servers/                     ← Custom MCP server implementations
│   └── appium/                      # Appium MCP server (drives Android/iOS via WebdriverIO)
├── output/                          ← Generated test project (shared, Playwright + WebdriverIO)
│   ├── tools/                       # Standalone tools (NOT part of test suite)
│   │   ├── scout-agent-v4.spec.ts  # Scout DOM scanner (run manually)
│   │   └── remote-control.js       # Scout session remote control
│   └── scout-reports/              # Scout DOM inventory reports (gitignored)
```

## Scenario Format

Scenarios are plain English `.md` files with structured keywords:

```markdown
# Feature: Shopping Cart

## Common Setup
1. Navigate to {{ENV.BASE_URL}}
2. Login with {{ENV.TEST_USERNAME}} / {{ENV.TEST_PASSWORD}}

---

### Scenario: Add item to cart
**Tags:** smoke, cart, P0

1. Click on "Sauce Labs Backpack" product
2. Click "Add to cart" button
3. VERIFY: Cart badge shows "1"
4. Click cart icon
5. VERIFY: "Sauce Labs Backpack" appears in cart
6. CAPTURE: item_price = price displayed for Backpack
7. SCREENSHOT: cart-with-item
```

### Supported Keywords

| Keyword | Purpose | Generated Code |
|---------|---------|----------------|
| `VERIFY` | Assert a condition | `expect()` assertion |
| `CAPTURE` | Store a value for later use | Variable assignment via getter |
| `CALCULATE` | Perform arithmetic | Inline calculation |
| `SCREENSHOT` | Capture page screenshot | `page.screenshot()` + `test.info().attach()` |
| `SAVE` | Persist state across scenarios | `saveState()` call |
| `REPORT` | Print values to report | `console.log()` + `test.info().annotations` |
| `DATASETS` | Data-driven test rows | Parameterized `for...of` loop |
| `SHARED_DATA` | Load shared reference data | `loadTestData()` from `test-data-loader` |
| `USE_HELPER` | Call team-maintained helper | `await page.methodName()` from `*.helpers.ts` |
| `API GET/POST/PUT/DELETE` | REST API call | Playwright `request` fixture |
| `Tags` | CI/CD filtering labels | `{ tag: ['@smoke', '@P0'] }` |
| `{{ENV.VAR}}` | Environment variable | `process.env.VAR` |
| `API Behavior` | API persistence model | `mock` or `live` (controls Healer guardrails) |

## Quality Dimensions (Reviewer)

| # | Dimension | Weight | What It Checks |
|---|-----------|--------|----------------|
| 1 | Locator Quality | High | Primary + 2 fallbacks, no raw selectors |
| 2 | Wait Strategy | High | Zero `waitForTimeout`, proper waits |
| 3 | Test Architecture | Medium | Tags, POM, parameterization, helpers |
| 4 | Configuration | Medium | `channel: 'chrome'`, reporters, timeouts |
| 5 | Code Quality | Low | No `any` types, JSDoc, unused imports |
| 6 | Maintainability | Medium | Extensibility, separation of concerns |
| 7 | Security | High | No hardcoded credentials |
| 8 | API Test Quality | Medium | Request fixture, status + body assertions |
| 9 | Mobile Quality | High | Screen Objects, no raw selectors, no `driver.pause()`, platform-agnostic locators |

**Verdict:**
- Web-only (dims 1-7): APPROVED at score >= 28/35, no dimension below 3
- API/Hybrid (dims 1-8): APPROVED at score >= 32/40, no dimension below 3
- Mobile (dims 1-7 + 9): APPROVED at score >= 32/40, no dimension below 3

## Enterprise Reporting

Default: Playwright HTML + JSON + list. Extensible to:
- **Allure** — `npm install -D allure-playwright` + add to reporters array
- **ReportPortal** — `npm install -D @reportportal/agent-js-playwright` + env vars
- **Custom dashboards** — consume `test-results/results.json`

No generated test code changes needed. See `skills/_reference/reporting.md` for configuration details.

## MCP Extensibility

Current MCP servers:
- **Playwright MCP** — browser automation for web/hybrid Analyst stage (registered in `.mcp.json`)
- **Appium MCP** — device automation for mobile Analyst stage (`mcp-servers/appium/` — build with `npm run build`)

Adding new capabilities requires only new skill files — zero existing skill modifications:

| MCP Server | Status | Skill File | Existing Changes |
|------------|--------|------------|------------------|
| Playwright MCP (web) | **Implemented** | `analyze-scenario.md` | — |
| Appium MCP (mobile) | **Implemented** | `analyze-scenario-mobile.md` | None |
| Database MCP | Future | `generate-db-assertions.md` | None |
| GitHub MCP | Future | `report-bugs-to-github.md` | None |

## Security

- Credentials stored in `.env` (gitignored)
- Scenario files use `{{ENV.VARIABLE}}` references
- Generated code uses `process.env.VARIABLE`
- Reviewer flags any hardcoded credentials (Dimension 7)
- Mobile-specific env vars: `MOBILE_USERNAME`, `MOBILE_PASSWORD`, `APP_PACKAGE`, `APP_ACTIVITY`, `APPIUM_HOST`, `PLATFORM_NAME`

## For New Teams

1. Fork or clone this repo (one repo per application)
2. Delete sample scenarios (keep `_template.md`)
3. Write your scenarios in `scenarios/web/`, `scenarios/api/`, or `scenarios/mobile/{android|ios}/`
4. Create `.env` from `output/.env.example`
5. **For mobile:** install Appium (`npm install -g appium`), install drivers (`appium driver install uiautomator2 xcuitest`), configure `.env` with `APP_PACKAGE`, `APP_ACTIVITY`, `PLATFORM_NAME`, and connect a device or start an emulator
6. Run the pipeline in Claude Code
7. Once tests pass and Reviewer approves, commit `output/` to your repo

See `ENTERPRISE-SCALING-GUIDE.md` for multi-team scaling and CI/CD integration.
