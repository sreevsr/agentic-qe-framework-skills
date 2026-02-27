# Agentic QE Test Automation Framework

Multi-agent AI framework that generates production-ready Playwright test automation from plain English scenarios. Built for enterprise QE consulting engagements.

## Tech Stack

- **Runtime:** Node.js 18+ / TypeScript
- **Test Engine:** Playwright
- **AI Pipeline:** GitHub Copilot Chat (agent mode) with Playwright MCP Server
- **IDE:** VS Code
- **OS:** Windows 11 (primary), Linux Mint (secondary)

## Project Structure

```
.github/
  agents/
    orchestrator.agent.md    # Pipeline orchestrator (Copilot custom agent)
  prompts/
    analyst.prompt.md        # Agent 1: Browser exploration + element discovery
    generator.prompt.md      # Agent 2: Playwright test code generation
    healer.prompt.md         # Agent 3: Test execution + auto-fix failures
    reviewer.prompt.md       # Agent 4: Code quality audit + scorecard
    healer-review.prompt.md  # Healer-Reviewer combined loop
scenarios/                   # Plain English test scenarios (.md files)
  {folder}/                  # Organized by app/feature (folder parameter)
output/                      # Generated Playwright projects per scenario
  {scenario-name}/
    tests/
    playwright.config.ts
    package.json
scout-reports/               # Scout agent DOM inventory reports
templates/
  config/
    playwright.config.ts     # Base Playwright config template
    .env.dev / .env.qa / .env.staging  # Environment configs
```

## Agent Pipeline

The 5-agent pipeline runs in GitHub Copilot Chat (not Claude Code). Do NOT modify the pipeline execution logic — Claude Code is used for framework development only.

```
Analyst → Generator → Healer → Reviewer
                                    ↑
API Analyst (for Swagger-based tests)
Scout (DOM-only page scanner, runs before Analyst)
```

**Agent 1 — Analyst:** Opens browser via Playwright MCP, executes scenario steps, discovers UI elements, produces `analyst-report-{scenario}.md`.
**Agent 2 — Generator:** Reads analyst report + scenario → generates complete Playwright TypeScript project.
**Agent 3 — Healer:** Runs the scenario's spec file, diagnoses failures, auto-fixes, re-runs (up to 3 cycles). Produces `healer-report-{scenario}.md`.
**Agent 4 — Reviewer:** Audits generated code against 8 QE dimensions, produces `review-scorecard-{scenario}.md`.
**Agent 5 — API Analyst:** Reads Swagger/OpenAPI spec → auto-generates API scenario files.
**Scout Agent:** DOM-only page scanner with 67 UI component patterns across 7 library families (Fluent UI v8/v9, MUI, Ant Design, PrimeNG, Bootstrap, Kendo, native HTML).

## Scenario Format — Keywords

Scenarios are plain English `.md` files. These keywords trigger specific code generation patterns:

`VERIFY` — mid-step assertion | `CAPTURE` — store runtime value in `{{variable}}` | `CALCULATE` — arithmetic on captured values | `SCREENSHOT` — visual evidence capture | `REPORT` — print captured values to console/report | `SAVE` — write to `shared-state.json` for cross-scenario chaining | `DATASETS` — markdown table for data-driven parameterized runs | `API GET/POST/PUT/DELETE` — API test steps | `Tags:` — tag-based selective execution | `ENV_VARS` — environment-specific variables via `{{ENV.VAR}}` | `---` separator — multiple scenarios in one feature file

## Commands

```bash
# Install dependencies for a generated test project
cd output/{scenario-name} && npm install

# Run tests
npx playwright test
npx playwright test --project=chrome
npx playwright test --grep @smoke              # tag-based filtering

# Run with specific environment
ENV_FILE=.env.qa npx playwright test

# View HTML report
npx playwright show-report

# Scout agent (via Copilot Chat slash command)
/scout scenarioName=unify-user-photos
```

## Multi-Environment Configuration

Three environments supported: DEV, QA, STAGING. Each has `.env.{env}` files in `templates/config/`. The `playwright.config.ts` template reads `ENV_FILE` to load the correct config. Credentials use `{{ENV.TEST_USERNAME}}` placeholders — NEVER hardcode credentials.

## Multi-Browser Support

Default: Chrome only. Add Edge/WebKit per customer need in `playwright.config.ts` projects array. Healer always runs single-browser (Chrome) for fast fix cycles. Cross-browser runs belong in CI/CD.

## IMPORTANT Rules

- NEVER modify `.github/agents/` or `.github/prompts/` without understanding the full pipeline. These are carefully tuned prompt engineering artifacts.
- NEVER commit `.env` files with real credentials. Only `.env.example` with placeholders.
- Every scenario step MUST produce a corresponding test step in generated code — no step skipping.
- Generated test projects are self-contained in `output/{scenario-name}/` with their own `package.json` and `playwright.config.ts`.
- The `folder` parameter organizes scenarios and output by application/feature: `scenarios/{folder}/{scenario}.md` → `output/{folder}/{scenario}/`.
- Scout reports go to `scout-reports/{scenario}-page-inventory-latest.md` (or `scout-reports/{folder}/{scenario}-page-inventory-latest.md` when folder is provided).
- All agent reports include the scenario name: `analyst-report-{scenario}.md`, `healer-report-{scenario}.md`, `review-scorecard-{scenario}.md`, `pipeline-summary-{scenario}.md`. When folder is provided, reports go into `output/{folder}/`.

## What Claude Code Is Used For

Claude Code assists with:
- Editing/improving agent prompt files (`.prompt.md`, `.agent.md`)
- Updating templates (config files, base scaffolds)
- Adding new keywords/patterns to the scenario format
- Debugging test generation issues
- Framework architecture decisions
- Documentation updates

Claude Code does NOT run the agent pipeline — that runs in Copilot Chat with Playwright MCP.

## Additional Context

- @README.md for setup instructions and quick start guide
- @templates/config/playwright.config.ts for the base config template
- @.gitignore for excluded files
