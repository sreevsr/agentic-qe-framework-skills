# Agentic QE Framework — Enterprise Edition

AI-powered test automation framework that converts plain-English test scenarios into production-ready Playwright TypeScript tests using a multi-agent pipeline orchestrated through VS Code Copilot Chat with Playwright MCP.

## How It Works

Write a test scenario in a simple `.md` file describing what to test. Six specialized AI agents handle the rest:

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **Scout** | Scans application DOM, detects UI component libraries, maps selectors and interaction patterns | Live browser session | `scout-reports/page-inventory-latest.md` |
| **Analyst (QE Planner)** | Navigates the app in a real browser, discovers elements and validates scenario steps | Scenario `.md` file | `output/analyst-report.md` |
| **Generator** | Produces Playwright TypeScript framework with Page Objects, locators, and spec files | Analyst report + Scout report | Complete test framework in `output/` |
| **Healer** | Runs tests, diagnoses failures across 6 root cause categories, fixes code, re-runs (max 3 cycles) | Generated framework | Passing tests + `output/healer-report.md` |
| **Reviewer** | Audits code quality across 8 dimensions, scores 1-5 per dimension, issues verdict | Generated framework | `output/review-scorecard.md` |
| **API Analyst** | Reads Swagger/OpenAPI specs and auto-generates API scenario files | Swagger JSON | Scenario `.md` files |

### Agent Pipeline

```
Full Pipeline (one command):
  @qe-orchestrator /orchestrator scenario=my-feature type=web

Web UI:   Scout → Analyst → Generator → Healer → Reviewer → [Healer Review if needed]
API:      Scenario .md → Generator → Healer → Reviewer
Swagger:  Spec .json → API Analyst → Generator → Healer → Reviewer
```

### Orchestrator — Single Command Pipeline

The QE Orchestrator chains all agents automatically using VS Code 1.109 subagent architecture:

```
@qe-orchestrator /orchestrator scenario=saucedemo-cart-feature type=web
```

One command triggers the full pipeline. Each agent runs as a subagent with its own context window. The orchestrator verifies output files between stages, only proceeds when the previous stage succeeds, and produces a `pipeline-summary.md` at the end.

Individual agents can also be invoked standalone:

```
@qe-planner /analyst scenario=saucedemo-cart-feature
@qe-generator /generator scenario=saucedemo-cart-feature type=web
@qe-healer /healer scenario=saucedemo-cart-feature type=web
@qe-reviewer /reviewer scenario=saucedemo-cart-feature type=web
```

## Quick Start

### Prerequisites

- VS Code 1.109+ with GitHub Copilot (Copilot Chat in Agent mode)
- Node.js v18 or higher
- Playwright MCP server configured in `.vscode/mcp.json`

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/sreevsr/agentic-qe-framework-enterprise.git
   cd agentic-qe-framework-enterprise
   ```

2. Verify VS Code detects the custom agents:
   - Open Command Palette → type "Configure Agents"
   - You should see: QE Planner, QE Generator, QE Healer, QE Reviewer, QE Orchestrator

3. Write your first scenario in `scenarios/web/my-feature.md` using the template in `scenarios/_template.md`

4. Run the full pipeline:
   ```
   @qe-orchestrator /orchestrator scenario=my-feature type=web
   ```

5. View results:
   ```bash
   cd output
   npx playwright show-report
   ```

## Project Structure

```
agentic-qe-framework-enterprise/
├── .github/
│   ├── agents/                     ← Custom agent definitions (.agent.md)
│   │   ├── orchestrator.agent.md   ← Full pipeline coordinator
│   │   ├── analyst.agent.md        ← QE Planner (browser execution)
│   │   ├── generator.agent.md      ← Code generation
│   │   ├── healer.agent.md         ← Test healing (3 cycles max)
│   │   ├── healer-review.agent.md  ← Review issue fixer
│   │   ├── reviewer.agent.md       ← 8-dimension quality audit
│   │   └── api-analyst.agent.md    ← Swagger scenario generator
│   └── prompts/                    ← Slash command templates (.prompt.md)
│       ├── orchestrator.prompt.md
│       ├── analyst.prompt.md
│       ├── generator.prompt.md
│       ├── healer.prompt.md
│       ├── healer-review.prompt.md
│       ├── reviewer.prompt.md
│       └── api-analyst.prompt.md
├── agents/                         ← Detailed agent instructions
│   ├── 01-analyst.md
│   ├── 02-generator.md
│   ├── 03-healer.md
│   ├── 04-reviewer.md
│   └── 05-api-analyst.md
├── templates/
│   ├── core/                       ← Source of truth for core files
│   │   ├── base-page.ts            ← Base page object (battle-hardened)
│   │   ├── locator-loader.ts       ← Resilient selector engine
│   │   └── shared-state.ts         ← Cross-scenario state management
│   └── config/
│       ├── playwright.config.ts
│       ├── package.json
│       └── tsconfig.json
├── scenarios/
│   ├── web/                        ← Web UI test scenarios
│   │   └── _template.md
│   └── api/                        ← API test scenarios
│       ├── _template.md
│       └── swagger-specs/          ← Swagger/OpenAPI spec files
├── scout-reports/                  ← Scout DOM intelligence reports
│   └── README.md
├── tests/web/
│   └── scout-agent-v4.spec.ts      ← Scout Agent v4 (67 component patterns)
├── remote-control.js               ← Scout remote control (Terminal 2)
├── output/                         ← Generated framework (gitignored)
├── PROMPT-TEMPLATES.md             ← Reference documentation
├── ENTERPRISE-SCALING-GUIDE.md     ← Multi-team scaling patterns
└── README.md
```

## Scenario File Format

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
| `CAPTURE` | Store a value for later use | `sharedState.set()` |
| `CALCULATE` | Perform arithmetic | Inline calculation |
| `SCREENSHOT` | Capture page screenshot | `page.screenshot()` + `test.info().attach()` |
| `SAVE` | Persist state across scenarios | `saveState()` call |
| `DATASETS` | Data-driven test rows | Parameterized `for...of` loop |
| `API` | Make API call within web test | Playwright `request` fixture |
| `Tags` | CI/CD filtering labels | `{ tag: ['@smoke', '@P0'] }` |
| `{{ENV.VAR}}` | Environment variable | `process.env.VAR` |

## Scout Agent v4

The Scout Agent performs DOM reconnaissance before test generation. It detects UI component libraries and maps selectors with interaction patterns, enabling the Generator to produce accurate locators from the first run.

**67 component patterns** across 7 UI libraries: Fluent UI v8, Fluent UI v9, Material UI, Ant Design, PrimeNG, Bootstrap, Kendo UI.

**Key capabilities:**
- Two-pass scanning (DOM attributes first, then async visibility checks — no browser freeze)
- Full iframe probing (navigates into iframes, scans DOM inside, returns to parent)
- Hit-area mismatch detection for custom components
- Compact code-first output format consumed directly by Generator and Healer

**Usage:**
```powershell
# Terminal 1: Start Scout
npx playwright test tests/web/scout-agent-v4.spec.ts --project=chrome --headed --reporter=list

# Terminal 2: Remote control
node remote-control.js
# Press S = scan | T = scan in 5s (for tooltips) | D = done
```

See `scout-reports/README.md` for detailed documentation.

## Quality Dimensions (Reviewer)

The Reviewer audits generated code against 8 enterprise QE dimensions:

| Dimension | What It Checks |
|-----------|----------------|
| 1. Code Hygiene | No commented-out code, unused imports, console.log, or unflagged TODOs |
| 2. Import Integrity | All import paths resolve, class names match filenames |
| 3. Step Completeness | Every source step has a corresponding `// STEP N:` comment |
| 4. Locator Quality | Primary + 2 fallbacks per element, no raw selectors in specs |
| 5. Wait Strategy | Zero `waitForTimeout`, proper waits after navigation |
| 6. Test Architecture | Tags on every test, parameterized data loops, independent tests |
| 7. Security | No hardcoded credentials, all via `process.env` |
| 8. Configuration | `channel: 'chrome'`, proper reporters, screenshot/video/trace settings |

**Verdict:** APPROVED (score >= 32/40 and no dimension below 3) or NEEDS FIXES.

## Healer Diagnosis Categories

When tests fail, the Healer classifies root causes and applies targeted fixes:

| Category | Root Cause | Fix Strategy |
|----------|-----------|--------------|
| A | Navigation / Screen not found | Add missing navigation steps |
| B | Timing / Loading | Add `waitForSelector` or `waitForLoadState` |
| C | Wrong Selector | Try fallbacks → check Scout report → fix interaction pattern |
| D | Wrong Expected Value | Update assertion logic |
| E | Import / Config Error | Correct paths and dependencies |
| F | API Error | Diagnose each host individually, skip only unreachable hosts |

Maximum 3 fix cycles. Unresolved tests marked with `test.fixme()` and documented.

## For New Teams

1. Fork or clone this repo
2. Delete `output/` (you'll generate your own)
3. Delete sample scenarios in `scenarios/web/` and `scenarios/api/` (keep `_template.md`)
4. Write your own scenario `.md` files using the template
5. Create `.env` from `.env.example` with your application's credentials
6. Run the orchestrator or individual agents
7. Your generated `output/` folder is your application-specific test framework

See `ENTERPRISE-SCALING-GUIDE.md` for multi-team and multi-application scaling patterns.

## Architecture

### Agent File Architecture

Each agent has two files:

- **`.agent.md`** — Agent identity, permanent rules, quality standards, tool permissions. Edit for *what the agent is allowed to do*.
- **`.prompt.md`** — Runtime instructions with `{{scenario}}` and `{{type}}` variable substitution. Edit for *how the agent does the work*.

### Core Files (Source of Truth)

Three core files in `templates/core/` are copied to `output/core/` on first run and never overwritten:

- **`base-page.ts`** — Base page object with library-specific interaction methods (Fluent UI ComboBox, MUI Select, etc.)
- **`locator-loader.ts`** — Resilient selector engine with primary + fallback chain
- **`shared-state.ts`** — Cross-scenario state management for CAPTURE/SAVE patterns

### Locator Strategy

All selectors live in JSON files, never in code:

```json
{
  "loginButton": {
    "primary": "[data-testid='login-button']",
    "fallbacks": [
      "#login-btn",
      "button:has-text('Login')"
    ],
    "description": "Main login button"
  }
}
```

Selector change after UI update? Edit one JSON file. No code changes needed.

## Security

- Credentials stored in `.env` (gitignored, never committed)
- Scenario files use `{{ENV.VARIABLE}}` references
- Generated code uses `process.env.VARIABLE`
- `.env.example` contains placeholder values only
- Reviewer flags any hardcoded credentials (Dimension 7)

## Tech Stack

- **Test Framework:** Playwright with TypeScript
- **AI Orchestration:** VS Code 1.109 custom agents + Playwright MCP Server
- **Agent Runtime:** GitHub Copilot Chat (Agent mode) with subagent support
- **Browser:** Chrome (configurable to Edge, WebKit)
- **Reporting:** Playwright HTML Reporter with screenshots, video, and trace on failure
- **Supported UI Libraries:** Fluent UI v8/v9, Material UI, Ant Design, PrimeNG, Bootstrap, Kendo UI
