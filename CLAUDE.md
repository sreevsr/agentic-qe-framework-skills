# Agentic QE Framework — Skills Architecture

AI-powered test automation framework that converts plain English scenarios into production-ready Playwright TypeScript tests. Skills-based architecture with composable, self-contained skill files.

## Tech Stack

- **Runtime:** Node.js 18+ / TypeScript
- **Test Engine:** Playwright (web/api/hybrid) · WebdriverIO + Appium (mobile)
- **AI Pipeline:** Claude Code with composable skills
- **MCP:** Playwright MCP Server (browser automation) · Appium MCP Server (mobile automation)

## Project Structure

```
skills/                          # Composable skill definitions (self-contained)
  _shared/                       # keyword-reference.md only (loaded during spec generation)
  _reference/                    # Human reference docs — NOT loaded by LLM at runtime
  analyst/                       # Browser/device scenario execution (web + mobile)
  generator/                     # Code generation (14 skills)
  healer/                        # Test healing (7 skills)
  reviewer/                      # Quality audit (10 skills)
  healer-review/                 # Review fix application (10 skills)
  api-analyst/                   # Swagger → scenario generation
  scout/                         # DOM reconnaissance
scenarios/                       # Plain English test scenarios (.md files)
  web/                           # Web UI scenarios (with optional {folder}/ subfolders)
  api/                           # API scenarios (with optional {folder}/ subfolders)
  mobile/                        # Native mobile scenarios
    android/                     # Android-specific scenarios
    ios/                         # iOS-specific scenarios
templates/                       # Source of truth for core framework files
  core/                          # locator-loader.ts, base-page.ts, shared-state.ts, test-data-loader.ts
  config/                        # playwright.config.ts, package.json, tsconfig.json
  mobile/                        # base-screen.ts, locator-loader-mobile.ts, wdio.conf.ts, capabilities.ts
mcp-servers/                     # Custom MCP server implementations
  appium/                        # Appium MCP server (drives Android/iOS via WebdriverIO)
output/                          # Shared generated project (ONE project, all scenarios)
```

## Running the Pipeline

Invoke with: `scenario={name} type={web|api|hybrid|mobile} [folder={subfolder}] [platform={android|ios}]`

### Pipeline Stages

```
Web:    Analyst (Playwright MCP) → Generator → Healer → Reviewer → [Healer-Review if needed]
API:    Generator → Healer → Reviewer → [Healer-Review if needed]
Hybrid: Analyst (Playwright MCP) → Generator → Healer → Reviewer → [Healer-Review if needed]
Mobile: Analyst (Appium MCP) → Generator → Healer → Reviewer → [Healer-Review if needed]
```

### Stage 1: Analyst (skip if type=api)

- `type=web` or `type=hybrid`: Read and execute `skills/analyst/analyze-scenario.md`. Uses Playwright MCP.
- `type=mobile`: Read and execute `skills/analyst/analyze-scenario-mobile.md`. Uses Appium MCP.

Execute scenario in browser/device, discover elements, produce analyst report.
Verify: analyst report exists before proceeding.

### Stage 2: Generator

Execute skills one at a time. Read each skill, complete it fully, verify its output, then proceed:

1. Read and execute the setup skill for your type:
   - `type=web|api|hybrid` → `skills/generator/setup-framework.md`
     Verify: `output/core/`, `output/playwright.config.ts`, `output/package.json` exist
   - `type=mobile` → `skills/generator/setup-mobile-framework.md`
     Verify: `output/core/base-screen.ts`, `output/wdio.conf.ts`, `output/screens/` exist

2. Read and execute `skills/generator/setup-test-data.md`
   Verify: test-data files created

3. Read and execute `skills/generator/discover-helpers.md` (web/hybrid/mobile only)
   - For mobile: searches `output/screens/*.helpers.ts` instead of `output/pages/*.helpers.ts`
   Verify: helper registry noted (in-memory, used by spec generation)

4. Read and execute the locator generation skill for your type:
   - `type=web|hybrid` → `skills/generator/generate-locators.md`
     Verify: `output/locators/*.locators.json` files exist
   - `type=mobile` → `skills/generator/generate-mobile-locators.md`
     Verify: `output/locators/mobile/*.locators.json` files exist

5. Read and execute the page/screen generation skill for your type:
   - `type=web|hybrid` → `skills/generator/generate-pages.md`
     Verify: `output/pages/*Page.ts` files exist
   - `type=mobile` → `skills/generator/generate-screens.md`
     Verify: `output/screens/*Screen.ts` files exist

6. Read `skills/_shared/keyword-reference.md` for keyword→TypeScript patterns, then
   read and execute the spec skill for your type:
   - `type=web` → `skills/generator/generate-web-spec.md`
   - `type=api` → `skills/generator/generate-api-spec.md`
   - `type=hybrid` → `skills/generator/generate-hybrid-spec.md`
   - `type=mobile` → `skills/generator/generate-mobile-spec.md`
   Verify: test spec file exists at the correct path

7. Read and execute `skills/generator/generate-report.md`
   Verify: `output/generator-report-{scenario}.md` exists

### Stage 3: Healer

Read and execute `skills/healer/heal-loop.md`.
It orchestrates its sub-skills internally (pre-flight → run → diagnose → fix → repeat → report).

For `type=mobile`: use `skills/healer/diagnose-failure-mobile.md` instead of the standard diagnose skill for mobile-specific failure categories (M-A through M-H).

Mobile test command (always scoped to one spec):
```bash
cd output && npx wdio wdio.conf.ts --spec tests/mobile/{platform}/{folder}/{scenario}.spec.ts
```

Each sub-skill is self-contained — no shared files needed.
Verify: healer report exists. Record pass/fail/fixme counts.

### Stage 4: Reviewer

Execute each dimension review one at a time:

1. Read and execute `skills/reviewer/review-locator-quality.md` (skip for API-only)
2. Read and execute `skills/reviewer/review-wait-strategy.md`
3. Read and execute `skills/reviewer/review-test-architecture.md`
4. Read and execute `skills/reviewer/review-configuration.md`
5. Read and execute `skills/reviewer/review-code-quality.md`
6. Read and execute `skills/reviewer/review-maintainability.md`
7. Read and execute `skills/reviewer/review-security.md`
8. Read and execute `skills/reviewer/review-api-quality.md` (skip for web/mobile-only)
9. Read and execute `skills/reviewer/review-mobile-quality.md` (mobile only)
10. Read and execute `skills/reviewer/aggregate-scorecard.md` — combines all scores, issues verdict.

Verify: scorecard exists. Read verdict: APPROVED or NEEDS FIXES.

### Stage 5: Healer-Review (only if verdict = NEEDS FIXES)

Read scorecard. For each dimension with score <= 3, read and execute the matching fix skill:
- `skills/healer-review/fix-locator-quality.md`
- `skills/healer-review/fix-wait-strategy.md`
- `skills/healer-review/fix-test-architecture.md`
- `skills/healer-review/fix-configuration.md`
- `skills/healer-review/fix-code-quality.md`
- `skills/healer-review/fix-maintainability.md`
- `skills/healer-review/fix-security.md`
- `skills/healer-review/fix-api-quality.md`
- `skills/healer-review/fix-mobile-quality.md` (mobile only)

Then: Read and execute `skills/healer-review/validate-fixes.md`.
Verify: report exists, tests still pass.

### Final Step: Pipeline Summary

Read and execute `skills/generator/generate-pipeline-summary.md`.
Reads all stage reports (analyst, generator, healer, reviewer, healer-review if applicable) and produces a single summary.
Verify: `output/pipeline-summary-{scenario}.md` exists. This is the LAST file written in every pipeline run.

### Standalone: API Analyst

Read `skills/api-analyst/generate-api-scenarios.md`. Input: Swagger spec. Output: scenario `.md` files. Then run the API pipeline (Stages 2-5).

## Type Routing

| Type | Analyst | Locators/Screens | Spec Skill | Test Runner | Reviewer Dims |
|------|---------|-----------------|------------|-------------|--------------|
| `web` | Playwright MCP | Pages (output/pages/) | `generate-web-spec` | Playwright | 1-7 |
| `api` | No | No | `generate-api-spec` | Playwright | 2-8 |
| `hybrid` | Playwright MCP | Pages (output/pages/) | `generate-hybrid-spec` | Playwright | 1-8 (all) |
| `mobile` | Appium MCP | Screens (output/screens/) | `generate-mobile-spec` | WebdriverIO | 1-7 + Mobile (9) |

## Critical Rules

- NEVER modify `*.helpers.ts` files in `output/pages/` or `output/screens/` — team-owned
- NEVER modify files in `output/test-data/shared/` — team-owned
- NEVER commit `.env` files with real credentials
- NEVER use `waitForTimeout()` or `driver.pause()` — use proper element-based waits
- NEVER hardcode selectors in page/screen objects or specs — all via LocatorLoader/MobileLocatorLoader + JSON
- All scenarios share one `output/` project — do NOT create per-scenario projects
- Run ONLY the current scenario's spec file — never run all tests without a path
- Every scenario step MUST produce a corresponding test step — no step skipping

## Commands

```bash
cd output && npm install                          # Install dependencies

# Web / API / Hybrid (Playwright)
npx playwright test tests/web/{scenario}.spec.ts --project=chrome  # Run web scenario
npx playwright test --grep @smoke                 # Tag-based filtering
npx playwright show-report                        # View HTML report

# Mobile (WebdriverIO + Appium)
# Prerequisites: Appium server running (npx appium), device/emulator connected
npx wdio wdio.conf.ts --spec tests/mobile/android/{scenario}.spec.ts  # Android
PLATFORM=ios npx wdio wdio.conf.ts --spec tests/mobile/ios/{scenario}.spec.ts  # iOS
```

## MCP Extensibility

Current MCP servers:
- **Playwright MCP** — browser automation for web/hybrid Analyst stage (registered in `.mcp.json`)
- **Appium MCP** — device automation for mobile Analyst stage (`mcp-servers/appium/` — build with `npm run build`)

Future extensions require only new skill files — no existing skill modifications:
- Desktop MCP → `skills/analyst/analyze-scenario-desktop.md`
- Database MCP → `skills/generator/generate-db-assertions.md`

### Appium MCP Server Setup

```bash
cd mcp-servers/appium
npm install
npm run build       # compiles TypeScript → dist/
# Server is registered in .mcp.json and auto-started by Claude Code
```

Prerequisites for mobile testing:
- Appium Server 2.x: `npm install -g appium && appium driver install uiautomator2 xcuitest`
- Android: Android Studio with SDK, connected device or emulator (`adb devices`)
- iOS (macOS only): Xcode with iOS Simulator or provisioned device
