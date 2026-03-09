# Skill: Apply Fix

## Purpose
Apply a targeted fix for a diagnosed test failure. MUST check the pre-edit gate before every modification.

## Pre-Edit Gate (MANDATORY)

Before editing ANY file, check its path against these rules IN ORDER:

| # | File Pattern | Edit Allowed? | Alternative |
|---|-------------|--------------|-------------|
| 1 | `*.helpers.ts` | **NO** | `test.fixme('HELPER ISSUE: ...')` and document |
| 2 | `test-data/shared/*` | **NO** | Create scenario override in `test-data/{type}/{scenario}.json` |
| 3 | `output/core/*` | **NO** | Fix the calling file's import instead |
| 4 | Assertion values (scenario-defined) | **NO** | `test.fixme('POTENTIAL BUG: ...')` |
| 5 | Assertion values (auto-generated) | **YES** | Update placeholder |
| 6 | Everything else | **YES** | Direct fix |

### Helper Boundary Enforcement (HARD STOP)

In addition to the file-pattern gate above, the following edits are **ALWAYS PROHIBITED** regardless of which file is being modified:

- **NEVER add methods to a base page object (`output/pages/{PageName}.ts`) that implement business logic belonging in `*.helpers.ts`.** If a test fails because a USE_HELPER method does not exist, the fix is `test.fixme('HELPER ISSUE: ...')` — NOT implementing the method in the base page object or inline in the spec.
- **Signs that a fix violates this boundary:** The method performs multi-element calculations, bulk operations, data aggregation, business validation, or matches a `USE_HELPER` reference from the scenario.
- **Why:** Base page objects are pipeline-owned and regenerated on every run. Any custom method added here will be overwritten. Team-maintained logic survives only in `*.helpers.ts` files.

## Process

### Fix by Category

**Category A — Import/Module Error:**
- Correct the import path in the failing file
- Check that the target file exists at the corrected path
- Verify the export name matches what's imported

**Category B — Locator Not Found:**
- Identify the correct selector from the DOM (use Playwright MCP snapshot if available)
- Update the selector in the locator JSON file (`output/locators/{page-name}.locators.json`)
- Do NOT edit page objects or specs — only the JSON file
- **Exception:** If the Scout report identifies a non-standard interaction METHOD (e.g., `fluentComboBoxSelect`, `muiSelectOption`) or a `HIT-AREA MISMATCH` warning for the failing element, you MUST also update the page object method to use the Scout-reported INTERACTION sequence. This is the only Category B scenario where page object edits are allowed.
- Ensure fallbacks are also updated if they're similarly stale

**Category C — Assertion Failure:**
- If diagnosed as potential bug → `test.fixme('POTENTIAL BUG: [description]')`
- If auto-generated placeholder value → update expected value
- NEVER change values that the scenario explicitly defines

**Category D — Navigation/Timing:**
- Add `await page.waitForLoadState('domcontentloaded')` after navigation
- Fix URL in config if wrong
- NEVER add `waitForTimeout()` — use proper Playwright waits

**Category E — Config Error:**
- Run `npx playwright install chromium`
- Fix `channel: 'chrome'` in config
- Add missing dependencies

**Category F — Environment Variable Missing:**
- Verify `.env` file exists
- Add missing variables to `.env` (copy from `.env.example`)
- Ensure `dotenv` is configured in `playwright.config.ts`

**Category G — API Test Failure:**
- Fix endpoint paths, auth headers, request body format
- For persistence failures: check API Behavior header, then flag or adapt per guardrails

**Category H — Missing Helper Method (HARD STOP — no code fix allowed):**
- **Symptoms:** Test fails because a USE_HELPER method does not exist (no `*.helpers.ts` file, or method not exported)
- **The ONLY allowed fix:** Wrap the affected test in `test.fixme('HELPER ISSUE: USE_HELPER requested PageName.methodName but helpers file not found')`
- **NEVER:** implement the method in the base page object, create the helpers file, or add inline logic in the spec
- This is not a healer failure — it is a signal that the team must create the helpers file

### Fix Rules

- Keep changes minimal — fix ONLY what's broken
- One fix per failure — don't refactor surrounding code
- Document what you changed and why (for the healer report)
- Never add `waitForTimeout()` or `{ force: true }` — **Exception:** `{ force: true }` is allowed ONLY for elements where the Scout report flags a `HIT-AREA MISMATCH` warning
- Never skip or delete failing tests
- **NEVER alter the test scenario flow** — do not reorder, skip, or replace scenario steps. Do not add alternative paths to work around app behavior. Do not change assertion values that the scenario explicitly defines. The scenario is the specification. If a step cannot be executed as written, use `test.fixme('SCENARIO BLOCKED: ...')` and let the scenario author decide.

## Output
For each fix applied, return:
- File modified
- Category (A-H)
- Description of change
- Whether a `test.fixme()` was used instead of a code fix
