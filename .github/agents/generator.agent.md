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
- Input: path.join(process.cwd(), 'output', 'analyst-report.md')
- Output: path.join(process.cwd(), 'output', 'tests', 'web', '{feature}.spec.ts')

# Rules

- Do NOT use Playwright MCP browser tools or create subagents
- This is a code generation task only — read files and create files

# Instructions

Read [agents/02-generator.md](agents/02-generator.md) for your detailed instructions.

The user will specify the scenario name and type (web or api) when invoking this agent.

## Source Files

- If web scenario: Read `output/analyst-report.md` + `scenarios/web/{scenario}.md`
- If web scenario AND `scout-reports/page-inventory-latest.md` exists: Also read this file for accurate DOM selectors and component interaction patterns
- If api scenario: Read `scenarios/api/{scenario}.md` directly (no analyst report or Scout report needed)
- Use templates in `templates/core/` and `templates/config/` as code patterns

## Shared Files — Create If Not Exists

Check if these files already exist in output/. If they do, skip creating them.
Only create on the first scenario run:
- output/playwright.config.ts (must include reporter: 'html', screenshot: 'only-on-failure', video: 'retain-on-failure', trace: 'retain-on-failure')
- output/package.json (with dotenv, @types/node)
- output/tsconfig.json
- output/.env.example

CORE FILES — MANDATORY:
These three files MUST exist in output/core/ after generation completes:
- output/core/base-page.ts
- output/core/shared-state.ts
- output/core/locator-loader.ts

Rules:
- If output/core/ already has these files: DO NOT overwrite. Keep existing version.
- If output/core/ does NOT have these files AND templates/core/ exists: COPY from templates/core/
- If output/core/ does NOT have these files AND templates/core/ does NOT exist: generate using patterns from agents/02-generator.md
Never skip these. Never generate your own version when templates exist.


## Scenario-Specific Files — Always Recreate

Delete and regenerate only the current scenario's files:
- Test spec: output/tests/{type}/{scenario}.spec.ts
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

Skip if scout-reports/page-inventory-latest.md does not exist:
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
