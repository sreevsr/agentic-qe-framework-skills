# Agentic QE Framework — Skills Architecture (Claude Code)

AI-powered test automation framework that converts plain-English test scenarios into production-ready Playwright TypeScript tests using a composable skills-based architecture on Claude Code.

## How It Works

Write a test scenario in a simple `.md` file describing what to test. Claude Code reads the relevant skills and executes the pipeline:

| Stage | Role | Skills | Output |
|-------|------|--------|--------|
| **Analyst** | Opens browser, discovers elements, validates scenario steps | `skills/analyst/` (1 skill) | `analyst-report-{scenario}.md` |
| **Generator** | Produces Playwright TypeScript framework with Page Objects, locators, and spec files | `skills/generator/` (8 skills) | Complete test framework in `output/` |
| **Healer** | Runs tests, diagnoses failures across 7 categories, fixes code, re-runs (max 5 cycles) | `skills/healer/` (7 skills) | Passing tests + `healer-report-{scenario}.md` |
| **Reviewer** | Audits code quality across 8 dimensions, scores 1-5 per dimension, issues verdict | `skills/reviewer/` (9 skills) | `review-scorecard-{scenario}.md` |
| **Healer-Review** | Fixes code quality issues from Reviewer, validates tests still pass | `skills/healer-review/` (9 skills) | `healer-review-fixes-report-{scenario}.md` |
| **API Analyst** | Reads Swagger/OpenAPI specs, generates scenario `.md` files | `skills/api-analyst/` (1 skill) | Scenario `.md` files |
| **Scout** *(pre-pipeline, manual)* | Scans live DOM to map component library selectors and interaction patterns before running the pipeline | `skills/scout/` (1 skill) + `output/tools/` | `scout-reports/{scenario}-page-inventory-latest.md` |

### Pipeline by Type

```
Web:    Analyst → Generator → Healer → Reviewer → [Healer-Review if needed]
API:    Generator → Healer → Reviewer → [Healer-Review if needed]
Hybrid: Analyst → Generator → Healer → Reviewer → [Healer-Review if needed]
```

### Invocation

```
Run pipeline: scenario=saucedemo-cart-feature type=web
With folder:  scenario=cart-crud type=web folder=purchase
API:          scenario=users-crud type=api
Hybrid:       scenario=order-flow type=hybrid
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

This framework uses **42 focused skill files** instead of 5 monolithic agent instructions. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full rationale.

| Benefit | How |
|---------|-----|
| **Better AI consistency** | 40-line prompts are more predictable than 400-line prompts |
| **Easy type extension** | Adding `type=hybrid` = 1 new skill file + 1 line in orchestrator |
| **Parallel reviewer** | 8 dimension reviews can run as parallel subagents |
| **Targeted debugging** | 1 skill = 1 output. Wrong locators? Check `generate-locators.md` |
| **Team scalability** | Different engineers can own different skills |

## Quick Start

### Prerequisites

- Claude Code CLI or VS Code extension
- Node.js v18+
- Playwright MCP server configured (for Analyst stage)

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

## Project Structure

```
agentic-qe-framework-skills-v5/
├── CLAUDE.md                        ← Pipeline orchestrator (always loaded by Claude Code)
├── ARCHITECTURE.md                  ← Architecture decisions and rationale
├── ENTERPRISE-SCALING-GUIDE.md      ← Multi-team scaling and CI/CD patterns
├── skills/                          ← 41 composable skill files
│   ├── _shared/                     ← Cross-cutting rules (5 files)
│   │   ├── guardrails.md            # Helper/shared-data/assertion protection
│   │   ├── path-resolution.md       # Canonical file paths
│   │   ├── keyword-reference.md     # Keyword → TypeScript code patterns
│   │   ├── output-structure.md      # Directory tree contract
│   │   └── reporting.md             # Reporter configuration (Allure, ReportPortal)
│   ├── analyst/                     ← Browser scenario execution (1 file)
│   ├── generator/                   ← Code generation (8 files)
│   │   ├── setup-framework.md       # Core files and config setup
│   │   ├── generate-locators.md     # JSON locator files
│   │   ├── generate-pages.md        # Page Object classes
│   │   ├── discover-helpers.md      # Helper file scanning
│   │   ├── generate-web-spec.md     # Web test specs (type=web)
│   │   ├── generate-api-spec.md     # API test specs (type=api)
│   │   ├── generate-hybrid-spec.md  # Hybrid test specs (type=hybrid)
│   │   └── setup-test-data.md       # Test data management
│   ├── healer/                      ← Test healing (7 files)
│   │   ├── heal-loop.md             # Orchestrates full healing cycle
│   │   ├── pre-flight-validation.md # TypeScript checks before first run
│   │   ├── run-tests.md             # Execute specific spec file
│   │   ├── diagnose-failure.md      # Classify failures (Categories A-G)
│   │   ├── apply-fix.md             # Apply targeted fix
│   │   ├── fix-guardrails.md        # BLOCK/ALLOW gate before every edit
│   │   └── generate-healer-report.md
│   ├── reviewer/                    ← Quality audit (9 files)
│   │   ├── review-locator-quality.md    # Dimension 1
│   │   ├── review-wait-strategy.md      # Dimension 2
│   │   ├── review-test-architecture.md  # Dimension 3
│   │   ├── review-configuration.md      # Dimension 4
│   │   ├── review-code-quality.md       # Dimension 5
│   │   ├── review-maintainability.md    # Dimension 6
│   │   ├── review-security.md           # Dimension 7
│   │   ├── review-api-quality.md        # Dimension 8
│   │   └── aggregate-scorecard.md       # Combine scores, issue verdict
│   ├── healer-review/               ← Review fix application (9 files)
│   │   ├── fix-locator-quality.md
│   │   ├── fix-wait-strategy.md
│   │   ├── fix-test-architecture.md
│   │   ├── fix-configuration.md
│   │   ├── fix-code-quality.md
│   │   ├── fix-maintainability.md
│   │   ├── fix-security.md
│   │   ├── fix-api-quality.md
│   │   └── validate-fixes.md
│   ├── api-analyst/                 ← Swagger scenario generation (1 file)
│   └── scout/                       ← Scout DOM reconnaissance (1 file)
│       └── run-scout.md             # When/how to use Scout + pipeline integration
├── scenarios/                       ← Plain English test scenarios
│   ├── web/                         # Web scenarios (with optional subfolders)
│   └── api/                         # API scenarios
├── templates/                       ← Source of truth for core files
│   ├── core/                        # locator-loader.ts, base-page.ts, etc.
│   └── config/                      # playwright.config.ts, package.json
├── output/                          ← Generated Playwright project (shared)
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

**Verdict:** APPROVED (score >= 32/40, no dimension below 3) or NEEDS FIXES.

## Enterprise Reporting

Default: Playwright HTML + JSON + list. Extensible to:
- **Allure** — `npm install -D allure-playwright` + add to reporters array
- **ReportPortal** — `npm install -D @reportportal/agent-js-playwright` + env vars
- **Custom dashboards** — consume `test-results/results.json`

No generated test code changes needed. See `skills/_shared/reporting.md`.

## MCP Extensibility

Current: Playwright MCP (browser automation for Analyst stage). Adding new capabilities requires only new skill files — zero existing skill modifications:

| Future MCP | New Skill Needed | Existing Changes |
|------------|-----------------|------------------|
| Appium MCP (mobile) | `analyze-scenario-mobile.md` | None |
| Database MCP | `generate-db-assertions.md` | None |
| GitHub MCP | `report-bugs-to-github.md` | None |

## Security

- Credentials stored in `.env` (gitignored)
- Scenario files use `{{ENV.VARIABLE}}` references
- Generated code uses `process.env.VARIABLE`
- Reviewer flags any hardcoded credentials (Dimension 7)

## For New Teams

1. Fork or clone this repo (one repo per application)
2. Delete sample scenarios (keep `_template.md`)
3. Write your scenarios in `scenarios/web/` or `scenarios/api/`
4. Create `.env` from `output/.env.example`
5. Run the pipeline in Claude Code
6. Once tests pass and Reviewer approves, commit `output/` to your repo

See `ENTERPRISE-SCALING-GUIDE.md` for multi-team scaling and CI/CD integration.
