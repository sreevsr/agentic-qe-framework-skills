# Agentic QE Framework

AI-powered test automation framework that converts plain-English test scenarios into production-ready Playwright TypeScript tests using a 5-agent pipeline orchestrated through GitHub Copilot Chat with Playwright MCP.

## How It Works

Write a test scenario in a simple `.md` file describing what to test. Five specialized AI agents handle the rest:

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **Analyst** | Navigates the app in a real browser, discovers elements and selectors | Scenario `.md` file | `analyst-report.md` |
| **Generator** | Produces Playwright TypeScript framework with Page Objects and locators | Analyst report or API scenario | Complete test framework |
| **Healer** | Runs tests, diagnoses failures, fixes code, re-runs until green | Generated framework | Passing tests + `healer-report.md` |
| **Reviewer** | Audits code quality across 8 dimensions, scores and verdicts | Generated framework | `review-scorecard.md` |
| **API Analyst** | Reads Swagger/OpenAPI specs and auto-generates API scenario files | Swagger JSON | Scenario `.md` files |

### Agent Pipeline

```
Web UI:  Scenario .md → Analyst → Generator → Healer → Reviewer
API:     Scenario .md → Generator → Healer → Reviewer
Swagger: Spec .json → API Analyst → Generator → Healer → Reviewer
```

## Quick Start

### Prerequisites

- [VS Code](https://code.visualstudio.com/) with [GitHub Copilot](https://github.com/features/copilot) (Copilot Chat in Agent mode)
- [Node.js](https://nodejs.org/) (v18 or higher)
- Playwright MCP server configured in VS Code

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/sreevsr/agentic-qe-framework-enterprise.git
   cd agentic-qe-framework
   ```

2. Verify MCP server is running:
   Open `.vscode/mcp.json` — the Playwright MCP server should show as "Running" in VS Code.

3. Run the pre-built demo (no agents needed):
   ```bash
   cd output
   npm install
   npx playwright install chromium
   npx playwright test tests/ --project=chrome
   npx playwright show-report
   ```

### Running the Agent Pipeline

Open GitHub Copilot Chat in Agent mode. Copy the prompt from `PROMPT-TEMPLATES.md` for each agent, set the `SCENARIO_NAME` variable at the top, and paste into Copilot Chat.

**Web UI example (saucedemo-purchase):**
1. Prompt 1 → Analyst discovers elements in a live browser
2. Prompt 2 → Generator creates framework files
3. Prompt 3 → Healer runs and fixes tests until green
4. Prompt 4 → Reviewer audits and scores the output

**API example (pet-crud):**
1. Prompt 2 → Generator creates API test specs
2. Prompt 3 → Healer runs and fixes tests
3. Prompt 4 → Reviewer audits

**Swagger auto-generation:**
1. Prompt 5 → API Analyst generates scenario `.md` files from spec
2. Follow the API pipeline above for each generated scenario

## Project Structure

```
agentic-qe-framework/
├── .vscode/
│   └── mcp.json                         ← MCP server configuration
├── agents/
│   ├── 01-analyst.md                    ← Web UI element discovery
│   ├── 02-generator.md                  ← Code generation (web + API)
│   ├── 03-healer.md                     ← Test runner and auto-fixer
│   ├── 04-reviewer.md                   ← QE standards audit
│   └── 05-api-analyst.md               ← Swagger → scenario generation
├── templates/
│   ├── core/
│   │   ├── locator-loader.ts            ← Resilient selector with fallbacks
│   │   ├── base-page.ts                 ← Shared page object methods
│   │   └── shared-state.ts             ← Cross-scenario data persistence
│   └── config/
│       ├── playwright.config.ts         ← Browser and reporter config
│       ├── package.json                 ← Dependencies
│       ├── tsconfig.json                ← TypeScript config
│       └── .env.example                 ← Environment variable template
├── scenarios/
│   ├── _template.md                     ← Blank scenario template
│   ├── web/                             ← Web UI scenarios
│   │   ├── saucedemo-purchase.md
│   │   ├── saucedemo-cart-feature.md
│   │   ├── saucedemo-checkout-verification.md
│   │   └── saucedemo-login-data-driven.md
│   └── api/                             ← API scenarios
│       ├── petstore-pets-crud.md
│       ├── petstore-store-orders.md
│       ├── reqres-users-crud.md
│       └── swagger-specs/
│           └── petstore-v3.json
├── output/                              ← Generated framework (demo-ready)
│   ├── playwright.config.ts
│   ├── package.json
│   ├── core/
│   ├── locators/                        ← Selector JSONs with fallbacks
│   ├── pages/                           ← Page Object classes
│   ├── tests/
│   │   ├── web/                         ← Web UI test specs
│   │   └── api/                         ← API test specs
│   ├── test-data/
│   │   ├── web/                         ← Web test data by scenario
│   │   └── api/                         ← API test data by scenario
│   ├── healer-report.md                 ← Healing process documentation
│   └── review-scorecard.md              ← Quality audit scorecard
├── scripts/
│   ├── setup-windows.ps1
│   └── setup-linux.sh
├── PROMPT-TEMPLATES.md                  ← Copy-paste prompts for all 5 agents
├── ENTERPRISE-SCALING-GUIDE.md          ← Multi-team scaling patterns
└── README.md
```

## Framework Capabilities

### Scenario Keywords

Write scenarios using these keywords — the Generator maps each to Playwright code:

| Keyword | What It Does | Playwright Output |
|---------|-------------|-------------------|
| `VERIFY` | Assert a condition | `expect()` assertions |
| `CAPTURE` | Store a value for later use | Variable assignment via shared-state |
| `CALCULATE` | Perform arithmetic | Arithmetic operations |
| `SCREENSHOT` | Capture visual evidence | `page.screenshot()` + `test.info().attach()` |
| `SAVE` | Persist data across scenarios | `saveState()` calls |
| `DATASETS` | Data-driven parameterized tests | `for...of` loops |
| `API` | HTTP request (GET, POST, PUT, DELETE) | Playwright `request` fixture |
| `Tags` | Categorize tests for selective runs | `{ tag: ['@smoke', '@P0'] }` |
| `{{ENV.VARIABLE}}` | Reference environment secrets | `process.env.VARIABLE` |

### Locator Resilience

Every UI element has a primary selector plus fallback selectors stored in JSON files. If the primary selector breaks (due to UI changes), the framework automatically cascades to fallbacks — self-healing locators without manual intervention.

### Quality Audit (8 Dimensions)

The Reviewer agent scores the generated framework across:

1. **Code Hygiene** — No commented code, unused imports, or debug statements
2. **Import Integrity** — Every import resolves to an existing file with correct casing
3. **Step Completeness** — Every scenario step has a corresponding line of test code
4. **Locator Quality** — Primary + fallback selectors, no raw selectors in specs
5. **Wait Strategy** — No hardcoded waits, proper dynamic waiting
6. **Test Architecture** — Tags, data-driven patterns, independent tests
7. **Security** — No hardcoded credentials, all secrets via environment variables
8. **Configuration** — Correct browser channel, reporter, and artifact settings

Approval threshold: Score ≥ 32/40 with no dimension below 3.

## Running Tests

```bash
cd output
npm install
npx playwright install chromium

# Run all tests
npx playwright test tests/ --project=chrome

# Run by type
npx playwright test tests/web/ --project=chrome
npx playwright test tests/api/ --project=chrome

# Run by tag
npx playwright test --grep @smoke
npx playwright test --grep @regression
npx playwright test --grep @P0

# View HTML report with screenshots, traces, and step details
npx playwright show-report
```

## Sample Scenarios Included

### Web UI (saucedemo.com)

| Scenario | Demonstrates |
|----------|-------------|
| `saucedemo-purchase.md` | End-to-end purchase flow, VERIFY, SCREENSHOT |
| `saucedemo-cart-feature.md` | Multi-scenario file, Common Setup, Tags |
| `saucedemo-checkout-verification.md` | CAPTURE, CALCULATE, REPORT, SAVE |
| `saucedemo-login-data-driven.md` | DATASETS with 6 credential combinations |

### API (Swagger Petstore v3)

| Scenario | Demonstrates |
|----------|-------------|
| `petstore-pets-crud.md` | Full CRUD chaining, CAPTURE, SAVE |
| `petstore-store-orders.md` | Order lifecycle, negative tests, data-driven |
| `reqres-users-crud.md` | Users CRUD, auth flow (note: API behind Cloudflare) |
| `petstore-v3.json` | Swagger spec for API Analyst auto-generation |

## For New Teams

1. Fork or clone this repo
2. Delete `output/` (you'll generate your own)
3. Delete sample scenarios in `scenarios/web/` and `scenarios/api/` (keep `_template.md`)
4. Write your own scenario `.md` files using the template
5. Create `.env` from `.env.example` with your application's credentials
6. Run the agent pipeline using `PROMPT-TEMPLATES.md`
7. Your generated `output/` folder is your application-specific test framework

See `ENTERPRISE-SCALING-GUIDE.md` for multi-team and multi-application scaling patterns.

## Security

- Credentials stored in `.env` (gitignored, never committed)
- Scenario files use `{{ENV.VARIABLE}}` references
- Generated code uses `process.env.VARIABLE`
- `.env.example` contains placeholder values only
- CI/CD pipelines use pipeline secret stores

## Tech Stack

- **Test Framework:** Playwright with TypeScript
- **AI Orchestration:** GitHub Copilot Chat (Agent mode) + Playwright MCP Server
- **Browser:** Chrome (configurable to Edge, WebKit)
- **Reporting:** Playwright HTML Reporter with screenshots, video, and trace on failure
