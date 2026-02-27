# Enterprise Scaling Guide

> How to use the Agentic QE Framework for real enterprise projects with multiple teams, hundreds of scenarios, and diverse applications.

---

## 1. Scaling Model: One Repo Per Application

### Why Separate Repos Per App?

The framework generates a **single shared `output/` project** — one `package.json`, one `playwright.config.ts`, one `core/` directory, shared `pages/` and `locators/`. All scenarios for the same application share these artifacts. This is by design: when two scenarios touch the same Login page, they reuse the same `LoginPage.ts` and `login.locators.json`.

This means **each application needs its own repo**. Mixing multiple applications in one repo causes:

- **Page object collisions** — App A's `LoginPage.ts` and App B's `LoginPage.ts` can't coexist in `output/pages/`
- **Locator conflicts** — Different apps have different selectors for the same page names
- **Config conflicts** — One `baseURL` in `playwright.config.ts`, one set of environment variables
- **Dependency conflicts** — Different apps may need different Playwright versions or libraries
- **Blast radius** — A broken locator in one app blocks another app's CI pipeline

### The Pattern

Maintain two tiers:

**Tier 1 — Framework Template Repo (maintained by QCoE)**

The reusable engine containing agents, templates, core utilities, and prompt files. Never contains application-specific artifacts.

```
agentic-qe-framework-enterprise/     ← Template repo
├── .github/agents/                   ← Agent definitions (.agent.md)
├── .github/prompts/                  ← Slash command templates (.prompt.md)
├── agents/                           ← Detailed agent instructions (0X-*.md)
├── templates/core/                   ← Battle-hardened core files
├── templates/config/                 ← Configuration templates
├── tests/web/scout-agent-v4.spec.ts  ← Scout Agent
├── remote-control.js                 ← Scout remote control (Terminal 2)
├── scenarios/_template.md            ← Blank scenario template only
└── ENTERPRISE-SCALING-GUIDE.md       ← This file
```

**Tier 2 — Application Repos (one per team / application)**

Each team forks the template repo and adds their application-specific scenarios. All scenarios share a single `output/` project.

```
ars-connect-office-tests/             ← Team repo (forked from template)
├── .github/agents/                   ← Inherited from template
├── .github/prompts/                  ← Inherited from template
├── agents/                           ← Inherited from template
├── templates/                        ← Inherited from template
├── scenarios/
│   ├── web/
│   │   ├── work-orders/              ← folder=work-orders
│   │   │   ├── work-order-crud.md
│   │   │   └── work-order-dispatch.md
│   │   └── technician/               ← folder=technician
│   │       └── technician-schedule.md
│   └── api/
│       ├── field-service-api.md
│       └── swagger-specs/
│           └── connect-office-v1.json
├── scout-reports/                    ← App-specific DOM intelligence
├── output/                           ← Shared generated project (gitignored)
│   ├── core/                         ← Shared core files
│   ├── pages/                        ← Shared page objects
│   ├── locators/                     ← Shared locator JSONs
│   ├── tests/web/                    ← Spec files (flat + folder subfolders)
│   │   ├── work-orders/              ← Specs for folder=work-orders
│   │   └── technician/               ← Specs for folder=technician
│   ├── work-orders/                  ← Reports for folder=work-orders
│   ├── technician/                   ← Reports for folder=technician
│   ├── playwright.config.ts          ← Shared config
│   └── package.json                  ← Shared dependencies
└── .env                              ← App-specific credentials (gitignored)
```

### Update Flow

When you improve an agent prompt, fix `base-page.ts`, or add a new keyword:

1. Push changes to the template repo
2. Each team pulls the update (only `agents/`, `templates/`, `.github/` folders change)
3. Team scenarios, output, and application-specific code remain untouched
4. Re-run affected scenarios to pick up improvements

### Decision Table

| Situation | Approach |
|-----------|----------|
| Single team, single app | Use template repo directly |
| Multiple teams, different apps | Fork template → **one repo per app** |
| Same app, different modules | Single repo with `folder` parameter |
| Multiple apps, one team | Still separate repos — one per app |
| QCoE managing framework quality | Own the template repo, teams fork |

### Anti-Pattern: Multiple Apps in One Repo

Do **not** try to add an `app` parameter or nest multiple applications in a single repo. The shared `output/` project architecture (one `pages/`, one `locators/`, one config) is designed for a single application. Separate repos give each app team:

- **Independent ownership** — each team controls their repo, CI pipeline, and release cadence
- **Independent lifecycles** — App A can upgrade Playwright while App B stays on current version
- **Isolation** — a failing test in App A never blocks App B
- **Clean onboarding** — new team forks, deletes sample scenarios, writes their own

---

## 2. Scenario Organization

### Flat Structure (small projects, up to ~20 scenarios)

```
scenarios/
├── web/
│   ├── login-standard.md
│   ├── cart-feature.md
│   └── checkout-flow.md
└── api/
    └── products-crud.md
```

Invocation: `@qe-orchestrator /orchestrator scenario=cart-feature type=web`

Generated output (reports at root of `output/`, spec under `tests/web/`):
```
output/
├── analyst-report-cart-feature.md
├── healer-report-cart-feature.md
├── review-scorecard-cart-feature.md
├── pipeline-summary-cart-feature.md
└── tests/web/cart-feature.spec.ts
```

### Subfolder Structure (larger projects, 20+ scenarios)

```
scenarios/
├── web/
│   ├── auth/
│   │   ├── login-standard.md
│   │   └── password-reset.md
│   ├── cart/
│   │   ├── cart-crud.md
│   │   └── cart-edge-cases.md
│   └── checkout/
│       └── checkout-standard.md
└── api/
    ├── products/
    │   └── products-crud.md
    └── orders/
        └── orders-lifecycle.md
```

Invocation with folder: `@qe-orchestrator /orchestrator scenario=cart-crud type=web folder=cart`

Generated output (reports grouped under `output/{folder}/`, spec under `tests/web/{folder}/`):
```
output/
├── cart/                                    ← Reports grouped by folder
│   ├── analyst-report-cart-crud.md
│   ├── healer-report-cart-crud.md
│   ├── review-scorecard-cart-crud.md
│   └── pipeline-summary-cart-crud.md
├── tests/web/cart/cart-crud.spec.ts         ← Spec grouped by folder
├── test-data/web/cart-crud.json
├── pages/CartPage.ts                        ← Shared (not grouped)
└── locators/cart.locators.json              ← Shared (not grouped)
```

The `folder` parameter is optional. When not provided, the framework looks for scenarios in the flat `scenarios/web/` or `scenarios/api/` directory and places reports directly in `output/`.

All report files include the scenario name in the filename (e.g., `analyst-report-cart-crud.md`, not `analyst-report.md`). This prevents collisions when running multiple scenarios.

### Scenario Immutability Principle

Once a scenario file has been through the full pipeline and tests are passing, treat it as frozen. To add new test cases:

- **Create a new scenario file** (e.g., `cart-extended.md`) rather than modifying the existing one
- The Generator will reuse existing page objects and locators from earlier runs
- New file gets its own spec file — zero risk of breaking existing passing tests

This is by design. Each scenario file is independently runnable, independently healable, and independently reviewable.

---

## 3. Running Tests

All commands run from the `output/` directory:

```bash
cd output
```

### By Scenario

```bash
# Flat structure (no folder)
npx playwright test tests/web/cart-feature.spec.ts --project=chrome --reporter=list

# With folder
npx playwright test tests/web/cart/cart-crud.spec.ts --project=chrome --reporter=list
```

### By Folder (all scenarios in a module)

```bash
npx playwright test tests/web/cart/ --reporter=list
```

### By Tag

```bash
npx playwright test --grep @smoke
npx playwright test --grep @P0
npx playwright test --grep "@cart and @regression"
```

### By Browser

```bash
npx playwright test --project=chrome     # Default
npx playwright test --project=edge
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### All Tests

```bash
npx playwright test
```

### View HTML Report

```bash
npx playwright show-report
```

---

## 4. What the Framework Handles Well

| Capability | How It Works |
|-----------|-------------|
| New scenario for same app | Create new `.md` file, run pipeline. Generator reuses existing page objects and locators. |
| Organize by feature/module | Use `folder` parameter: `scenario=X type=web folder=cart`. Reports go to `output/cart/`, specs to `tests/web/cart/`. |
| Selector changed after UI update | Edit one locator JSON file. Fallbacks kick in automatically. No code changes. |
| New page discovered | Generator creates new page object and locator JSON. Existing pages untouched. |
| Environment switch (DEV → QA → STAGING) | Change `.env` file or set `TEST_ENV=qa`. All tests use `process.env` variables. |
| Run subset of tests | Tags (`@smoke`, `@regression`, `@P0`) enable filtering with `--grep`. |
| Full pipeline from one command | `@qe-orchestrator /orchestrator scenario=X type=web` (add `folder=Y` for subfolder structure) |

---

## 5. What Needs Team Awareness

### Page Object Customization After Generation

The Generator creates page objects on first run. If a QE manually adds a complex helper method to a page object (e.g., a method that calculates total price), the Generator won't overwrite it on subsequent runs ("create if not exists" rule). However, if the QE deletes and regenerates, the customization is lost.

**Rule:** Once you manually edit a page object, it's yours to maintain. Commit it to Git.

### Modifying an Existing Scenario

If someone modifies steps in an existing `.md` file and re-runs the pipeline, the spec is regenerated. Any Healer-applied fixes (custom selectors, timing adjustments) from previous runs are lost.

**Rule:** If a scenario needs changes, either update the `.md` file and re-run the full pipeline, or manually edit the spec. Don't mix both approaches.

### Cross-Scenario Dependencies

Scenario A creates a user, Scenario B logs in as that user. Within a single spec file, `shared-state.ts` handles this via CAPTURE/SAVE keywords. Across separate spec files, there's no shared state.

**Rule:** For cross-file dependencies, create a setup script or shared fixture manually. The framework doesn't auto-generate these.

### Custom Component Libraries

If the customer uses an in-house component library with proprietary class names, Scout won't detect it. The team would need to add detection patterns to `scout-agent-v4.spec.ts` (add the prefix to `LIBS` and component patterns to `COMP_MAP`).

---

## 6. What Needs Framework Enhancement

| Capability | Current State | Path Forward |
|-----------|--------------|-------------|
| Hybrid API + Web scenarios | Not supported (web and API are separate types) | New `type=hybrid` mode needed |
| Stakeholder reporting dashboards | Playwright HTML report only | Integrate Allure, ReportPortal, or custom dashboards |
| Cross-browser testing | Config supports Chrome, Edge, Firefox, WebKit projects | Healer runs Chrome only for fast fix cycles; cross-browser belongs in CI |

---

## 7. CI/CD Integration

The agentic pipeline (Analyst → Generator → Healer → Reviewer) runs at **development time** in VS Code. It produces deterministic, production-ready Playwright test scripts. CI/CD pipelines run these scripts like any conventional test suite — no AI, no tokens, no agents.

### The Model

```
DEV TIME (VS Code)                          CI/CD (Pipeline)
┌──────────────────────────┐               ┌──────────────────────────┐
│  QE writes scenario .md  │               │  git checkout + npm ci   │
│  Orchestrator runs agents│               │  npx playwright install  │
│  Tests generated + healed│──── commit ──→│  npx playwright test     │
│  Reviewer approves       │    output/    │  Standard Playwright run │
│  QE commits output/      │               │  Zero AI, zero tokens    │
└──────────────────────────┘               └──────────────────────────┘
```

### What Gets Committed

Once the pipeline produces APPROVED tests, commit the `output/` directory (or the relevant parts):

```
output/
├── core/                    ← Commit (shared framework)
├── pages/                   ← Commit (page objects)
├── locators/                ← Commit (selector JSONs)
├── tests/                   ← Commit (spec files)
├── test-data/               ← Commit (test data JSONs)
├── playwright.config.ts     ← Commit (config)
├── package.json             ← Commit (dependencies)
├── tsconfig.json            ← Commit (TypeScript config)
└── .env.example             ← Commit (template only, never .env)
```

Do **not** commit agent reports (`analyst-report-*.md`, `healer-report-*.md`, `review-scorecard-*.md`, `pipeline-summary-*.md`). These are development artifacts.

### Example CI Commands

```bash
cd output
npm ci
npx playwright install chromium --with-deps

# Run by tag
npx playwright test --grep @smoke --project=chrome
npx playwright test --grep @regression --project=chrome

# Run by folder
npx playwright test tests/web/cart/ --project=chrome

# Run all
npx playwright test --project=chrome

# Cross-browser (CI only)
npx playwright test --grep @smoke
```

### CI Environment Variables

Set these as pipeline secrets (GitHub Actions secrets, GitLab CI variables, Azure DevOps variable groups):

- `BASE_URL` — application URL for the target environment
- `TEST_USERNAME` / `TEST_PASSWORD` — test credentials
- `TEST_ENV` — environment name (`dev`, `qa`, `staging`)
- Any app-specific `ENV_VARS` referenced in scenarios

The `playwright.config.ts` reads `TEST_ENV` to load the correct `.env.{env}` file.

---

## 8. Team Workflow

### Day-to-Day

1. QE writes scenario `.md` file (plain English, 10-20 lines)
2. QE runs `@qe-orchestrator /orchestrator scenario=my-feature type=web` (add `folder=X` if using subfolder structure)
3. Pipeline generates framework, heals tests, audits quality
4. QE reviews `pipeline-summary-my-feature.md` and `review-scorecard-my-feature.md`
5. If APPROVED → commit output to Git
6. If NEEDS FIXES → run `@qe-healer-review /healer-review scenario=my-feature type=web`

### Sprint Cadence

- **Sprint start:** Write scenarios for new features
- **During sprint:** Run pipeline as features become testable
- **Sprint end:** All scenarios through pipeline, all tests passing, committed to Git

### Maintenance

- **Selector changes:** Edit locator JSON → re-run affected tests
- **New page in app:** Run Scout to detect components → run pipeline for scenario touching new page
- **Framework upgrade:** Pull latest from template repo → re-run scenarios to verify

---

## 9. Prompt Architecture

### Three-File System

Each agent has three layers of instructions that work together:

| File | Location | Purpose | Edit When... |
|------|----------|---------|-------------|
| `.agent.md` | `.github/agents/` | Agent identity, permanent rules, tool permissions. Always loaded by Copilot Chat when the agent is invoked. | Changing what the agent is allowed to do |
| `0X-*.md` | `agents/` | Detailed step-by-step instructions. Referenced by `.agent.md` via "Read agents/0X-*.md for your instructions." | Changing how the agent performs its work |
| `.prompt.md` | `.github/prompts/` | Runtime template with `{{scenario}}`, `{{type}}`, `{{folder}}` variable substitution. Loaded when the slash command is used. | Changing parameters passed to the agent per run |

**Important:** When the orchestrator delegates to a subagent, the subagent receives the orchestrator's delegation prompt + its own `.agent.md` + reads `agents/0X-*.md`. It does **not** go through its own `.prompt.md`. The `.prompt.md` is only used for standalone slash command invocations.

When editing agent behavior, ensure changes are consistent across all three layers. The `agents/0X-*.md` file is where agents get their detailed instructions — changes here take precedence over vague guidance in `.agent.md`.

### Agent Invocation (Standalone)

```
@qe-planner /analyst scenario=my-feature
│            │       │
│            │       └── Parameters (fill {{scenario}} in .prompt.md)
│            └── Slash command (loads .prompt.md)
└── Custom agent (loads .agent.md, which references agents/01-analyst.md)
```

### Agent Invocation (Via Orchestrator)

```
@qe-orchestrator /orchestrator scenario=my-feature type=web folder=cart
│
└── Orchestrator delegates to subagents sequentially:
    ├── QE Planner    → .agent.md + delegation prompt → reads agents/01-analyst.md
    ├── QE Generator  → .agent.md + delegation prompt → reads agents/02-generator.md
    ├── QE Healer     → .agent.md + delegation prompt → reads agents/03-healer.md
    ├── QE Reviewer   → .agent.md + delegation prompt → reads agents/04-reviewer.md
    └── QE Healer Review (if needed) → .agent.md + delegation prompt → reads agents/03-healer.md
```

### Orchestrator Subagent Architecture

The orchestrator uses VS Code 1.109 subagent support:

- Each agent runs in its own context window (no cross-contamination)
- The Planner subagent gets Playwright MCP tools (browser access)
- Generator, Healer, Reviewer get terminal and file editing tools
- Output files in `output/` serve as the handoff mechanism between agents
- The orchestrator verifies each agent's output file exists before proceeding to the next stage

---

## 10. File Ownership

| Folder | Owned By | Committed to Git? | Notes |
|--------|----------|-------------------|-------|
| `.github/agents/` | QCoE (template repo) | Yes | Agent identity files |
| `.github/prompts/` | QCoE (template repo) | Yes | Slash command templates |
| `agents/` | QCoE (template repo) | Yes | Detailed agent instructions |
| `templates/core/` | QCoE (template repo) | Yes | Source of truth for core files |
| `templates/config/` | QCoE (template repo) | Yes | Config templates |
| `scenarios/` | Team | Yes | Application-specific test scenarios |
| `scout-reports/` | Generated (app-specific) | No (gitignored) | DOM intelligence reports |
| `output/` | Generated (shared project) | No (gitignored) | One shared project for all scenarios |
| `output/pages/` | Generated then team-maintained | Optional | Commit if manually customized |
| `output/locators/` | Generated then team-maintained | Optional | Commit if manually customized |
| `.env` | Team (secrets) | No (gitignored) | Only `.env.example` is committed |
