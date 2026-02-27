---
mode: agent
description: "Run QE Generator to create Playwright framework from analyst report and scout data"
---

---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths (never hardcode / or \)
- DO NOT use git commands or check repository state
- Self-contained execution mode
- PROJECT ROOT: path.join(process.cwd(), 'output') — all generated files go here. ONE shared project, not per-scenario.
- Analyst report (no folder): path.join(process.cwd(), 'output', 'analyst-report-{{scenario}}.md')
- Analyst report (with folder): path.join(process.cwd(), 'output', '{{folder}}', 'analyst-report-{{scenario}}.md')
- Test spec (no folder): path.join(process.cwd(), 'output', 'tests', '{{type}}', '{{scenario}}.spec.ts')
- Test spec (with folder): path.join(process.cwd(), 'output', 'tests', '{{type}}', '{{folder}}', '{{scenario}}.spec.ts')
---

SCENARIO_NAME = {{scenario}}
SCENARIO_TYPE = {{type}}

Read agents/02-generator.md for your instructions.

SCENARIO PATH RESOLUTION:
- Web without folder: scenarios/web/{{scenario}}.md
- Web with folder:    scenarios/web/{{folder}}/{{scenario}}.md
- API without folder: scenarios/api/{{scenario}}.md
- API with folder:    scenarios/api/{{folder}}/{{scenario}}.md

SOURCE FILES:
- If SCENARIO_TYPE is web and folder provided: Read output/{{folder}}/analyst-report-{{scenario}}.md + the scenario file at the resolved path above
- If SCENARIO_TYPE is web and no folder: Read output/analyst-report-{{scenario}}.md + the scenario file at the resolved path above
- If SCENARIO_TYPE is web AND a Scout report exists, also read it for accurate DOM selectors and component interaction patterns:
    With folder: scout-reports/{{folder}}/{{scenario}}-page-inventory-latest.md
    Without folder: scout-reports/{{scenario}}-page-inventory-latest.md
- If SCENARIO_TYPE is api: Read the scenario file at the resolved path above directly (no analyst report or Scout report needed)

SHARED FILES — CREATE IF NOT EXISTS:
Check if these files already exist in output/. If they do, skip creating them.
Only create on the first scenario run:
- output/playwright.config.ts (must include reporter: 'html', screenshot: 'only-on-failure', video: 'retain-on-failure', trace: 'retain-on-failure')
- output/package.json (with dotenv, @types/node)
- output/tsconfig.json
- output/.env.example
- output/core/locator-loader.ts

CORE FILES — MANDATORY (non-negotiable):
These three files MUST exist in output/core/ after generation completes:
- output/core/base-page.ts
- output/core/shared-state.ts
- output/core/locator-loader.ts

BEFORE generating any other files, run these copy commands:

If templates/core/ exists, copy each missing file:
  Windows:
    if not exist output\core\base-page.ts copy templates\core\base-page.ts output\core\base-page.ts
    if not exist output\core\shared-state.ts copy templates\core\shared-state.ts output\core\shared-state.ts
    if not exist output\core\locator-loader.ts copy templates\core\locator-loader.ts output\core\locator-loader.ts
  Linux/Mac:
    [ ! -f output/core/base-page.ts ] && cp templates/core/base-page.ts output/core/base-page.ts
    [ ! -f output/core/shared-state.ts ] && cp templates/core/shared-state.ts output/core/shared-state.ts
    [ ! -f output/core/locator-loader.ts ] && cp templates/core/locator-loader.ts output/core/locator-loader.ts

If templates/core/ does NOT exist, generate these files using patterns from agents/02-generator.md.

VERIFY: After this step, confirm all three files exist before proceeding to generate any other files.

SCENARIO-SPECIFIC FILES — ALWAYS RECREATE:
Delete and regenerate only the current scenario's files:
- Test spec without folder: output/tests/{{type}}/{{scenario}}.spec.ts
- Test spec with folder:    output/tests/{{type}}/{{folder}}/{{scenario}}.spec.ts
- Test data: output/test-data/{{type}}/{{scenario}}/
Use the appropriate OS command to delete:
  Windows (no folder): if exist output\tests\{{type}}\{{scenario}}.spec.ts del output\tests\{{type}}\{{scenario}}.spec.ts
  Windows (with folder): if exist output\tests\{{type}}\{{folder}}\{{scenario}}.spec.ts del output\tests\{{type}}\{{folder}}\{{scenario}}.spec.ts
  Linux/Mac (no folder): rm -f output/tests/{{type}}/{{scenario}}.spec.ts
  Linux/Mac (with folder): rm -f output/tests/{{type}}/{{folder}}/{{scenario}}.spec.ts

For web scenarios, also generate (create if not exists — do not overwrite if another scenario already created these):
- output/locators/[page-name].json (one per page discovered)
- output/pages/[PageName].ts (one Page Object per page)

ZERO DROPPED STEPS — MANDATORY:
1. Before writing code, list every STEP from the source file
2. Each STEP must produce a corresponding code line with comment: // STEP N: [description]
3. Never combine, merge, or skip steps — navigation and wait steps matter as much as actions
4. After writing the spec, count STEP comments vs source steps — they must match

NAVIGATION (enterprise apps):
- Every screen transition needs an explicit action + a wait confirmation (waitForSelector or waitForURL)
- For postback apps (ASP.NET WebForms): add waitForLoadState('networkidle') after server round-trips
- For iframes: use page.frameLocator() before interacting with framed elements

SCOUT REPORT RULES (web scenarios only — skip if the Scout report does not exist at the resolved path above):
- PREFER Scout-discovered selectors over analyst-guessed selectors for locator JSONs
- For custom components (Fluent UI ComboBox, etc.): use multi-step interaction pattern from Scout report
- If Scout flags HIT-AREA MISMATCH: add { force: true } or use ID selector
- Add componentType as comment in locator JSON files
- If element exists in analyst report but NOT Scout: use analyst selector
- If element exists in Scout but NOT analyst report: ignore it

KEYWORD MAPPING:
- Tags → { tag: ['@tagName'] }
- VERIFY → expect() assertions
- CAPTURE → variable assignments via shared-state
- CALCULATE → arithmetic operations
- SCREENSHOT → page.screenshot() + test.info().attach()
- SAVE → saveState() calls
- DATASETS → parameterized for...of loops
- API steps → Playwright request fixture (not fetch/axios)
- {{ENV.VARIABLE}} → process.env.VARIABLE

QUALITY CHECKS (do all before finishing):
- STEP comment count matches source step count
- All import paths are correct relative to file location
- Imported file exists with exact name and casing in the target folder
- Page objects use this.loc.get() — no raw selectors in tests
- playwright.config.ts uses channel: 'chrome' (NOT browserName: 'chrome')
- Zero waitForTimeout anywhere
- No hardcoded passwords — all credentials via process.env
- Every async call has await
- Multi-scenario files use test.describe() + test.beforeEach()
- Zero commented-out code in any generated file
