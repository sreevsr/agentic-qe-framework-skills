---
name: QE Generator
description: Read analyst report and Scout report, generate complete Playwright TypeScript test framework with page objects, locators, and spec files.
tools: ['editFiles', 'runCommand', 'search']
model: ['Claude Sonnet 4.5', 'GPT-4o']
handoffs:
  - label: Run & Heal Tests
    agent: healer
    prompt: |
      The Generator has created the framework. Run the tests and fix any failures.
    send: false
---

# Platform Compatibility

- Use Node.js path.join() for all file paths (never hardcode / or \)
- DO NOT use git commands or check repository state
- Self-contained execution mode
- PROJECT ROOT: path.join(process.cwd(), 'output') — all generated files go here. ONE shared project, not per-scenario.
- Analyst report (no folder): path.join(process.cwd(), 'output', 'analyst-report-{scenario}.md')
- Analyst report (with folder): path.join(process.cwd(), 'output', '{folder}', 'analyst-report-{scenario}.md')
- Test spec (no folder): path.join(process.cwd(), 'output', 'tests', '{type}', '{scenario}.spec.ts')
- Test spec (with folder): path.join(process.cwd(), 'output', 'tests', '{type}', '{folder}', '{scenario}.spec.ts')

# Rules

- Do NOT use Playwright MCP browser tools or create subagents
- This is a code generation task only — read files and create files

# Instructions

Read [agents/02-generator.md](agents/02-generator.md) for your detailed instructions.

The user will specify the scenario name and type (web or api) when invoking this agent.

## Source Files

- If web scenario without folder: Read `output/analyst-report-{scenario}.md` + `scenarios/web/{scenario}.md`
- If web scenario with folder: Read `output/{folder}/analyst-report-{scenario}.md` + `scenarios/web/{folder}/{scenario}.md`
- If web scenario AND a Scout report exists, also read it for accurate DOM selectors and component interaction patterns:
  With folder: `scout-reports/{folder}/{scenario}-page-inventory-latest.md`
  Without folder: `scout-reports/{scenario}-page-inventory-latest.md`
- If api scenario without folder: Read `scenarios/api/{scenario}.md` directly (no analyst report or Scout report needed)
- If api scenario with folder: Read `scenarios/api/{folder}/{scenario}.md` directly (no analyst report or Scout report needed)
- Use templates in `templates/core/` and `templates/config/` as code patterns

## Shared Files — Create If Not Exists

Check if these files already exist in output/. If they do, skip creating them.
Only create on the first scenario run:
- output/playwright.config.ts (must include reporter: 'html', screenshot: 'only-on-failure', video: 'retain-on-failure', trace: 'retain-on-failure')
- output/package.json (with dotenv, @types/node)
- output/tsconfig.json
- output/.env.example

SHARED TEST DATA — Create If Not Exists:
- output/test-data/shared/ directory — reusable reference data across scenarios
- If the scenario uses common data (user credentials, product catalogs, customer info), create shared files here
- Shared data files: output/test-data/shared/users.json, products.json, customers.json, etc.
- NEVER overwrite existing shared data files — another scenario already created them
- See agents/02-generator.md Step 4a for shared data rules and file format

CORE FILES — MANDATORY (non-negotiable):
These files MUST exist in output/core/ after generation completes:
- output/core/base-page.ts
- output/core/shared-state.ts
- output/core/locator-loader.ts
- output/core/test-data-loader.ts (if scenario uses SHARED_DATA or test-data/shared/ exists)

BEFORE generating any other files, run these copy commands:

If templates/core/ exists, copy each missing file:
  Windows:
    if not exist output\core\base-page.ts copy templates\core\base-page.ts output\core\base-page.ts
    if not exist output\core\shared-state.ts copy templates\core\shared-state.ts output\core\shared-state.ts
    if not exist output\core\locator-loader.ts copy templates\core\locator-loader.ts output\core\locator-loader.ts
    if not exist output\core\test-data-loader.ts copy templates\core\test-data-loader.ts output\core\test-data-loader.ts
  Linux/Mac:
    [ ! -f output/core/base-page.ts ] && cp templates/core/base-page.ts output/core/base-page.ts
    [ ! -f output/core/shared-state.ts ] && cp templates/core/shared-state.ts output/core/shared-state.ts
    [ ! -f output/core/locator-loader.ts ] && cp templates/core/locator-loader.ts output/core/locator-loader.ts
    [ ! -f output/core/test-data-loader.ts ] && cp templates/core/test-data-loader.ts output/core/test-data-loader.ts

If templates/core/ does NOT exist, generate these files using patterns from agents/02-generator.md.

VERIFY: After this step, confirm all core files exist before proceeding to generate any other files.


## Scenario-Specific Files — Always Recreate

NEVER delete output/test-data/shared/ — it contains cross-scenario reference data.
Delete and regenerate only the current scenario's files:
- Test spec (no folder): output/tests/{type}/{scenario}.spec.ts
- Test spec (with folder): output/tests/{type}/{folder}/{scenario}.spec.ts
- Test data: output/test-data/{type}/{scenario}/

For web scenarios, also generate (create if not exists — do not overwrite if another scenario already created these):
- output/locators/[page-name].json (one per page discovered)
- output/pages/[PageName].ts (one Page Object per page)

## Zero Dropped Steps — Mandatory

1. Before writing code, list every STEP from the source file
2. Each STEP must produce a corresponding code line with comment: // STEP N: [description]
3. Never combine, merge, or skip steps
4. After writing the spec, count STEP comments vs source steps — they must match

## Scout Report Rules (web scenarios only)

Skip if the Scout report does not exist at the resolved path above:
- PREFER Scout-discovered selectors over analyst-guessed selectors
- For custom components (Fluent UI ComboBox, etc.): use multi-step interaction pattern from Scout report
- If Scout flags HIT-AREA MISMATCH: add { force: true } or use ID selector
- Add componentType as comment in locator JSON files

## Keyword Mapping

- Tags → { tag: ['@tagName'] }
- VERIFY → expect() assertions
- CAPTURE → variable assignments via shared-state
- CALCULATE → arithmetic operations
- SCREENSHOT → page.screenshot() + test.info().attach()
- SAVE → saveState() calls
- DATASETS → parameterized for...of loops
- SHARED_DATA → import loadTestData from core/test-data-loader, load named shared files
- API steps → Playwright request fixture (not fetch/axios)
- {{ENV.VARIABLE}} → process.env.VARIABLE

## Quality Checks (do all before finishing)

- STEP comment count matches source step count
- All import paths are correct relative to file location
- Page objects use this.loc.get() — no raw selectors in tests
- playwright.config.ts uses channel: 'chrome' (NOT browserName: 'chrome')
- Zero waitForTimeout anywhere
- No hardcoded passwords — all credentials via process.env
- Every async call has await
