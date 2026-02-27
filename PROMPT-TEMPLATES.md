# Prompt Templates — Complete Enterprise Edition

> **DEPRECATED:** This file contains legacy copy-paste prompts from before the `.agent.md` + `.prompt.md` architecture.
> The authoritative instructions are now in:
> - `.github/agents/*.agent.md` — Agent identity and permanent rules
> - `.github/prompts/*.prompt.md` — Runtime invocation templates with `{{variable}}` substitution
> - `agents/01-analyst.md` through `agents/04-reviewer.md` — Detailed agent instructions
>
> **Key naming changes since this file was written:**
> - Report files now include the scenario name: `analyst-report-{scenario}.md`, `healer-report-{scenario}.md`, `review-scorecard-{scenario}.md`
> - When folder is provided, reports go into `output/{folder}/`
> - Scout reports: `scout-reports/{scenario}-page-inventory-latest.md`
> - Test specs: `output/tests/{type}/[{folder}/]{scenario}.spec.ts`
> - The orchestrator handles all pipeline coordination — no need to copy-paste prompts manually.
>
> Original validation: Feb 14, 2026 against saucedemo.com and Swagger Petstore API.

---

## Pre-Flight Checklist

- [ ] VS Code has the `agentic-qe-framework` folder open
- [ ] `.vscode/mcp.json` uses `--isolated` and `--browser chromium`
- [ ] MCP server shows **"Running"** with **22 tools** in `mcp.json`
- [ ] Copilot Chat is in **Agent** mode (dropdown at top)
- [ ] Model is **Claude Haiku 4.5**, **Claude Sonnet**, or **GPT-4o** (NOT Grok)
- [ ] `chat.tools.autoApprove` is **enabled** in VS Code settings
- [ ] `.env` file created with actual credentials (copy from `.env.example`)
- [ ] Start a **new chat** for each agent (click +)

---

## Prompt 1: Analyst Agent (Web UI Scenarios)

**Purpose:** Execute test scenario in a real browser, discover elements, produce report.
**Use for:** All web UI scenario files.
**Skip for:** API-only scenarios (go to Prompt 2 directly).

```
---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths (never hardcode / or \)
- DO NOT use git commands or check repository state
- Self-contained execution mode
---

IMPORTANT RULES:
- Use ONLY the Playwright MCP Server tools (Navigate to a URL, Click, Fill,
  Type text, Page snapshot, Select option)
- Do NOT use "Evaluate JavaScript" tool
- Do NOT use "Run Playwright code" tool
- Do NOT write or run any Playwright scripts
- Do NOT create subagents
- Execute each action directly using MCP tools, one at a time
- After EVERY action, use "Page snapshot" before proceeding to the next step

SCENARIO_NAME = [REPLACE THIS WITH YOUR SCENARIO FILENAME WITHOUT .md]

Read the file agents/01-analyst.md for your instructions.
Then read the scenario in scenarios/web/{{SCENARIO_NAME}}.md.

Execute every step in the scenario using the Playwright MCP tools listed above.
Take a page snapshot after each action to confirm the result before moving to
the next step.

For VERIFY steps: check the stated condition and log pass/fail.
For CAPTURE steps: read the value from the page and record it.
For SCREENSHOT steps: take a screenshot and note the filename.
For DATASETS: execute only the FIRST data row.

After completing all steps, save your report as output/analyst-report.md.
```

**Replace** `[YOUR-SCENARIO-FILE]` with your filename.
**Time:** 3–8 minutes.

---

## Prompt 2: Generator Agent (Web + API)

**Purpose:** Read analyst report (or API scenario) and generate Playwright TypeScript framework.
**Use for:** Both web and API scenarios.

```
---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths (never hardcode / or \)
- DO NOT use git commands or check repository state
- Self-contained execution mode
- Input: path.join(process.cwd(), 'output', 'analyst-report.md')
- Output: path.join(process.cwd(), 'output', 'tests', 'web', '{feature}.spec.ts')
---

RULES:
- Do NOT use Playwright MCP browser tools or create subagents
- This is a code generation task only — read files and create files

SCENARIO_NAME = [REPLACE THIS WITH YOUR SCENARIO FILENAME WITHOUT .md]
SCENARIO_TYPE = [REPLACE THIS WITH web OR api]

Read agents/02-generator.md for your instructions.

SOURCE FILES:
- If SCENARIO_TYPE is web: Read output/analyst-report.md + scenarios/web/{{SCENARIO_NAME}}.md
- If SCENARIO_TYPE is web AND scout-reports/page-inventory-latest.md exists: Also read this file for accurate DOM selectors and component interaction patterns
- If SCENARIO_TYPE is api: Read scenarios/api/{{SCENARIO_NAME}}.md directly (no analyst report or Scout report needed)
Use templates in templates/core/ and templates/config/ as code patterns.

SHARED FILES — CREATE IF NOT EXISTS:
Check if these files already exist in output/. If they do, skip creating them.
Only create on the first scenario run:
- output/playwright.config.ts (must include these settings:
    reporter: 'html',
    use: {
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      trace: 'retain-on-failure',
    }
  )
- output/package.json (with dotenv, @types/node)
- output/tsconfig.json
- output/.env.example
- output/core/locator-loader.ts
- output/core/base-page.ts
- output/core/shared-state.ts

SCENARIO-SPECIFIC FILES — ALWAYS RECREATE:
Delete and regenerate only the current scenario's files:
- Test spec: output/tests/{{SCENARIO_TYPE}}/{{SCENARIO_NAME}}.spec.ts
- Test data: output/test-data/{{SCENARIO_TYPE}}/{{SCENARIO_NAME}}/
Use the appropriate OS command to delete:
  Windows: if exist output\tests\{{SCENARIO_TYPE}}\{{SCENARIO_NAME}}.spec.ts del output\tests\{{SCENARIO_TYPE}}\{{SCENARIO_NAME}}.spec.ts
  Linux/Mac: rm -f output/tests/{{SCENARIO_TYPE}}/{{SCENARIO_NAME}}.spec.ts

For web scenarios, also generate (create if not exists — do not overwrite
if another scenario already created these files):
- output/locators/[page-name].json (one per page discovered)
- output/pages/[PageName].ts (one Page Object per page)

ZERO DROPPED STEPS — MANDATORY:
1. Before writing code, list every STEP from the source file
2. Each STEP must produce a corresponding code line with comment: // STEP N: [description]
3. Never combine, merge, or skip steps — navigation and wait steps matter as much as actions
4. After writing the spec, count STEP comments vs source steps — they must match

NAVIGATION (enterprise apps):
- Every screen transition needs an explicit action + a wait confirmation
  (waitForSelector or waitForURL)
- For postback apps (ASP.NET WebForms): add waitForLoadState('networkidle')
  after server round-trips
- For iframes: use page.frameLocator() before interacting with framed elements

SCOUT REPORT RULES (web scenarios only — skip if scout-reports/page-inventory-latest.md does not exist):
- Scout report contains ACTUAL DOM structure discovered by browsing the live app
- PREFER Scout-discovered selectors over analyst-guessed selectors for locator JSONs
- For dropdowns marked as "Fluent UI ComboBox" or similar custom components:
  DO NOT generate a simple page.click() + text select. Use the multi-step
  interaction pattern from the Scout report (open → wait → click option)
- For modals/panels: use the Scout wait strategy (e.g., wait for .ms-Panel
  not generic wait for [role="dialog"]) 
- If Scout flags ⚠️ HIT-AREA MISMATCH on an element, add { force: true }
  to the click or use the element's ID/data-testid selector instead of text
- Add componentType as a comment in locator JSON files:
  e.g., "branchDropdown": { "primary": "#ComboBox21wrapper", // Fluent UI ComboBox }
- If element exists in analyst report but NOT Scout: use analyst selector (Scout may not have scanned that page state)
- If element exists in Scout but NOT analyst report: ignore it (analyst defines WHAT is needed, Scout provides HOW)

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
```

**Time:** 2–5 minutes.

---

## Prompt 3: Healer Agent

**Purpose:** Run tests, fix failures, re-run until green.

```
---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths
- DO NOT use git commands or check repository state
- Self-contained execution mode
- Input: path.join(process.cwd(), 'output', 'tests', 'web', '{failing-test}.spec.ts')
- Output: Fixed test in same location
---

RULES:
- Do NOT use Playwright MCP browser tools or create subagents
- Use ONLY the terminal to run commands and edit files

SCENARIO_NAME = [REPLACE THIS WITH YOUR SCENARIO FILENAME WITHOUT .md]
SCENARIO_TYPE = [REPLACE THIS WITH web OR api]

Read agents/03-healer.md for your instructions.

─── PHASE 1: PRE-FLIGHT VALIDATION ───

1. Read the source file:
   - If SCENARIO_TYPE is web: Read output/analyst-report.md
   - If SCENARIO_TYPE is api: Read scenarios/api/{{SCENARIO_NAME}}.md
2. Open the test spec: output/tests/{{SCENARIO_TYPE}}/{{SCENARIO_NAME}}.spec.ts
3. Count // STEP N: comments in the spec vs total steps in the source
4. If steps are missing: add them in correct sequence using surrounding code as pattern
5. Log what was added. Proceed only when all steps are accounted for.

─── PHASE 2: SETUP ───

6. cd into output/
7. Copy .env.example to .env if missing; fill in values
8. Run npm install only if node_modules/ does not exist
9. npx playwright install chromium
10. npx tsc --noEmit → fix any TypeScript errors

─── PHASE 3: TARGETED TEST RUN ───

11. Run ONLY the current scenario's spec file:
    npx playwright test tests/{{SCENARIO_TYPE}}/{{SCENARIO_NAME}}.spec.ts --project=chrome --reporter=list
    Never run npx playwright test without a file path.

─── PHASE 4: DIAGNOSE AND FIX (max 3 cycles) ───

12. On failure, classify root cause:

    A. NAVIGATION / SCREEN NOT FOUND
       Test never reached the correct screen. Check preceding navigation steps
       against the source file. Fix: add missing navigation. Do NOT increase timeout.

    B. TIMING / LOADING
       Correct screen, but element not yet rendered. Fix: add waitForSelector
       or waitForLoadState('networkidle'). Never use waitForTimeout.

    C. WRONG SELECTOR
       Correct screen, loaded, element not found. Fix strategy:
       1. Try fallback selectors from locator JSON
       2. If scout-reports/page-inventory-latest.md exists, look up the failing
          element in the Scout report for the correct selector and interaction pattern
       3. If Scout shows it's a custom component (e.g., Fluent UI ComboBox),
          the fix is NOT a different selector — it's a different interaction
          pattern (multi-step open → wait → click)
       4. If none of the above work, construct new selector from page snapshot

    D. WRONG EXPECTED VALUE
       Assertion mismatch. Fix: update expected value or assertion logic.

    E. IMPORT / CONFIG ERROR
       Module not found or TypeScript errors. Fix: correct paths and dependencies.

    F. API ERROR
       4xx/5xx responses, payload mismatch, CORS.
       IMPORTANT: Diagnose each API host individually. Never blanket-skip
       all API tests because one host is unreachable. If a specific host
       is behind bot protection (e.g., Cloudflare), skip ONLY that host's
       tests. For other hosts, investigate timeout, URL, or payload issues.

13. For Category A: always check the source file for what navigation should
    have preceded the failing step. Verify the test is on the right screen
    before assuming the selector is wrong.

14. Apply fix → re-run targeted test file → repeat (max 3 fix cycles)
15. After 3 cycles, mark unresolved tests with test.fixme() and document the issue.

─── PHASE 5: REPORT ───

16. Save output/healer-report.md with:
    - Pre-flight results (steps added, if any)
    - Fix cycles used (out of 3 max)
    - Each fix: root cause category, what was wrong, what was fixed
    - Final results: passed / failed / skipped / fixme
    - Unresolved issues with recommended investigation steps
```

**Time:** 2–5 minutes.

---

## Prompt 4: Reviewer Agent

**Purpose:** Audit framework against QE standards, produce scorecard.

```
---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths
- DO NOT use git commands or check repository state
- Self-contained execution mode
- Input: path.join(process.cwd(), 'output', 'tests', 'web', '{test}.spec.ts')
- Output: Review report or improved test in same location
---

RULES:
- Do NOT use Playwright MCP browser tools or create subagents
- Read files only — do NOT modify any files
- This is an audit. Be critical. A passing test suite does not mean quality code.

Read agents/04-reviewer.md for your instructions.

SCOPE — Review all files in output/:
- core/ (locator-loader, base-page, shared-state)
- locators/ (all JSON files — web only)
- pages/ (all Page Objects — web only)
- tests/web/ and tests/api/ (all spec files)
- test-data/web/ and test-data/api/ (all JSON files)
- playwright.config.ts, .env.example

─── DIMENSION 1: CODE HYGIENE ───

Check for:
- Commented-out code anywhere (// old code, /* disabled */, etc.)
  Commented code is dead weight. Flag every instance. Code should be
  either active or deleted — never commented "just in case."
- Unused imports (imported but never referenced in the file)
- Unused variables or functions
- Console.log / debug statements left behind
- TODO / FIXME / HACK comments without corresponding test.fixme()
Verdict: FAIL if any commented-out code or unused imports exist.

─── DIMENSION 2: IMPORT & REFERENCE INTEGRITY ───

Check for:
- Every import path resolves to an actual file that exists in output/
  (e.g., if spec imports '../pages/CheckoutStep1Page', verify that
  output/pages/CheckoutStep1Page.ts exists with that exact casing)
- Page Object class names match their filenames
- Locator JSON filenames match what LocatorLoader references
- shared-state keys used in SAVE match keys used in READ across specs
Verdict: FAIL if any import points to a non-existent or misnamed file.

─── DIMENSION 3: STEP COMPLETENESS ───

Check for:
- Read the source file (analyst-report.md or scenario .md)
- Count total steps in source vs // STEP N: comments in each spec
- Identify any dropped, merged, or out-of-sequence steps
Verdict: FAIL if step count doesn't match or steps are out of order.

─── DIMENSION 4: LOCATOR QUALITY (web only) ───

Check for:
- Every element has a primary selector + at least 2 fallbacks in JSON
- No raw selectors in test spec files (all must go through Page Objects)
- No brittle selectors (auto-generated IDs, deep nesting, positional xpaths)
- Selectors prefer: data-testid > aria roles > CSS class > xpath
Verdict: FAIL if raw selectors found in specs or fallbacks missing.

─── DIMENSION 5: WAIT STRATEGY ───

Check for:
- Zero instances of waitForTimeout (hardcoded waits) anywhere
- Navigation actions followed by waitForSelector or waitForURL
- Form submissions followed by waitForLoadState or waitForResponse
- No implicit timing assumptions (expecting element immediately after click)
Verdict: FAIL if any waitForTimeout found.

─── DIMENSION 6: TEST ARCHITECTURE ───

Check for:
- Tags present on every test: { tag: ['@smoke'] } or similar
- DATASETS use parameterized for...of loops, not copy-pasted tests
- Multi-scenario files use test.describe() + test.beforeEach()
- API tests use Playwright request fixture (not fetch/axios)
- Each test is independent — no test relies on another test's side effects
  unless explicitly using shared-state with CAPTURE/SAVE
- Web specs reside in tests/web/, API specs in tests/api/
Verdict: FAIL if tags missing or tests have hidden dependencies.

─── DIMENSION 7: SECURITY ───

Check for:
- No hardcoded passwords, tokens, keys, or secrets in any file
- All credentials use process.env.VARIABLE
- .env.example exists with placeholder values (not real credentials)
- .env is in .gitignore
Verdict: FAIL if any credential is hardcoded.

─── DIMENSION 8: CONFIGURATION ───

Check for:
- playwright.config.ts uses channel: 'chrome' (NOT browserName: 'chrome')
- baseURL set correctly in config or .env
- Reasonable timeouts configured (not excessively long)
- reporter set to 'html'
- screenshot set to 'only-on-failure'
- video set to 'retain-on-failure'
- trace set to 'retain-on-failure'
Verdict: FAIL if channel is wrong, baseURL missing, or reporter/artifacts not configured.

─── SCORECARD ───

Score each dimension 1-5:
  1 = Critical issues found
  2 = Multiple issues
  3 = Minor issues
  4 = Good with small improvements possible
  5 = No issues found

Save output/review-scorecard.md with:
- Score per dimension with specific findings
- Total score out of 40
- List of every issue found with file path and line reference
- Overall verdict: APPROVED (score >= 32 and no dimension below 3)
  or NEEDS FIXES (list exact fixes required)
```

**Time:** 1–3 minutes.

---

## Prompt 3b: Healer Agent (Code Review Mode)

**Purpose:** Fix code quality issues identified by Reviewer
```
---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths
- DO NOT use git commands or check repository state
- Self-contained execution mode
---

MODE: CODE_REVIEW_FIXES
SCENARIO_NAME = [REPLACE THIS WITH YOUR SCENARIO FILENAME WITHOUT .md]
SCENARIO_TYPE = [REPLACE THIS WITH web OR api]

Read agents/03-healer.md for base instructions, then apply CODE_REVIEW_FIXES mode.

RULES:
- Do NOT use Playwright MCP browser tools or create subagents
- Use ONLY the terminal to run commands and edit files
- Work in the output/ directory

─── PHASE 1: READ REVIEW REPORT ───

1. Read output/review-scorecard.md completely
2. Extract all issues with these statuses:
   - 🔴 CRITICAL (score 0-2)
   - ⚠️ NEEDS ATTENTION (score 3)
3. List the specific files, line numbers, and issue descriptions
4. Ignore ✅ GOOD (score 4-5) items - those don't need fixes

─── PHASE 2: UNDERSTAND THE 8 REVIEW DIMENSIONS ───

The Reviewer evaluates these dimensions:

**Dimension 1: Code Hygiene**
- Unused imports
- Dead code
- Console.log statements
Issues: Remove unused code, clean up imports

**Dimension 2: Import Integrity**  
- Correct path aliases (@pages, @core, @locators)
- No relative path imports in tests
Issues: Fix import paths to use aliases

**Dimension 3: Step Completeness**
- All source steps have corresponding // STEP N: comments
- Steps in correct sequence
Issues: Add missing step comments

**Dimension 4: Locator Quality** (CRITICAL - Framework Principle)
- All selectors MUST be in locator JSON files
- Page objects MUST use LocatorLoader (this.getElement, this.click, this.getText)
- NEVER use raw this.page.locator() in page objects
Issues: Move raw selectors to JSON, update methods to use LocatorLoader

**Dimension 5: Wait Strategy**
- No waitForTimeout() or hardcoded delays
- Use waitForSelector, waitForLoadState, or auto-waiting
Issues: Replace bad waits with proper strategies

**Dimension 6: Test Architecture**
- Tests have tags (@smoke, @regression, @P0, @P1, @P2)
- Tests are independent (no shared state)
- Proper beforeEach/afterEach
Issues: Add tags, fix test isolation

**Dimension 7: Security**
- Credentials use process.env
- No hardcoded passwords/tokens
- .env.example exists
Issues: Move secrets to environment variables

**Dimension 8: Configuration**
- playwright.config.ts uses channel: 'chrome' (not 'chromium')
- Proper timeouts configured
- HTML and JSON reporters enabled
Issues: Fix config settings

─── PHASE 3: FIX STRATEGY BY DIMENSION ───

For each issue found, apply the appropriate fix:

### DIMENSION 1 FIXES: Code Hygiene

**Unused Imports:**
```typescript
// BEFORE
import { test, expect } from '@playwright/test';

// AFTER (if expect not used)
import { test } from '@playwright/test';
```

**Console.log:**
```typescript
// BEFORE
console.log('Debug info');

// AFTER
// Remove or replace with proper logging
```

### DIMENSION 4 FIXES: Locator Quality (MOST COMMON)

This is the CRITICAL dimension. Framework principle: **All selectors in JSON, never in code.**

**Step A: Identify the raw selector**
```typescript
// Example from CartPage.ts:90
const removeButtons = this.page.locator('button:has-text("Remove")');
```

**Step B: Add to locators JSON file**

File: `output/locators/cart-page.locators.json` (or inventory-page.locators.json, etc.)
```json
{
  "existingKey1": { ... },
  "existingKey2": { ... },
  "removeButtons": {
    "primary": "button:has-text('Remove')",
    "fallbacks": [
      "[data-test*='remove']",
      ".btn_secondary",
      "button.cart_button"
    ],
    "role": "button",
    "description": "Remove item from cart buttons"
  }
}
```

**IMPORTANT JSON RULES:**
- Add comma after previous entry
- No trailing comma after last entry
- Use single quotes inside double-quoted strings
- Validate JSON syntax

**Step C: Update page object method**
```typescript
// BEFORE (raw selector - WRONG)
async getCartItemCount(): Promise<number> {
  const removeButtons = this.page.locator('button:has-text("Remove")');
  const count = await removeButtons.count();
  return count;
}

// AFTER (using LocatorLoader - CORRECT)
async getCartItemCount(): Promise<number> {
  const removeButtons = await this.getElement('removeButtons');
  const count = await removeButtons.count();
  return count;
}
```

**Common LocatorLoader Patterns:**
```typescript
// Pattern 1: Click element
// BEFORE: await this.page.locator('button').click();
// AFTER: await this.click('buttonKey');

// Pattern 2: Get text
// BEFORE: await this.page.locator('div').textContent();
// AFTER: await this.getText('divKey');

// Pattern 3: Check visibility
// BEFORE: await this.page.locator('h1').isVisible();
// AFTER: await this.isVisible('h1Key');

// Pattern 4: Get element for chaining
// BEFORE: const el = this.page.locator('div');
// AFTER: const el = await this.getElement('divKey');

// Pattern 5: Count elements
// BEFORE: await this.page.locator('button').count();
// AFTER: 
const buttons = await this.getElement('buttonsKey');
const count = await buttons.count();
```

**Regex Selectors in JSON:**
```json
{
  "headingWithRegex": {
    "primary": "text=/Your Cart/i",
    "fallbacks": ["h1:has-text('Your Cart')", ".title"]
  }
}
```

**Has-text Selectors in JSON:**
```json
{
  "removeButton": {
    "primary": "button:has-text('Remove')",
    "fallbacks": ["[data-test='remove']"]
  }
}
```

### DIMENSION 5 FIXES: Wait Strategy

**Bad Wait:**
```typescript
await page.waitForTimeout(3000);
```

**Good Wait:**
```typescript
await page.waitForLoadState('domcontentloaded');
// or
await page.waitForSelector('.element');
// or rely on auto-waiting (built into Playwright)
```

### DIMENSION 7 FIXES: Security

**Hardcoded Credentials:**
```typescript
// BEFORE
await page.fill('#username', 'admin');

// AFTER
await page.fill('#username', process.env.TEST_USERNAME || '');
```

Ensure `.env.example` exists with template.

### DIMENSION 8 FIXES: Configuration

**Wrong Browser:**
```typescript
// BEFORE
use: { channel: 'chromium' }

// AFTER  
use: { channel: 'chrome' }
```

─── PHASE 4: APPLY FIXES ───

For each issue in review-scorecard.md:

1. Determine which dimension (1-8)
2. Apply the appropriate fix pattern from Phase 3
3. If Dimension 4 (Locator Quality):
   a. Create a descriptive key name (e.g., removeButtons, cartHeading, loginButton)
   b. Add to correct locators JSON file with primary + 2-3 fallbacks
   c. Update page object method to use LocatorLoader
   d. Validate JSON syntax
4. Save the file

**Fix Order (recommended):**
1. Dimension 1 (Code Hygiene) - simplest
2. Dimension 7 (Security) - simple  
3. Dimension 8 (Configuration) - simple
4. Dimension 4 (Locator Quality) - most complex, do last
5. Dimension 5 (Wait Strategy)
6. Other dimensions as needed

─── PHASE 5: VALIDATION ───

After applying ALL fixes:

1. Verify TypeScript compiles:
```bash
   cd output
   npx tsc --noEmit
```
   If errors: fix them before proceeding

2. Verify JSON files are valid:
```bash
   # For each modified JSON file
   node -e "JSON.parse(require('fs').readFileSync('locators/cart-page.locators.json', 'utf8'))"
```

3. Run the test suite:
```bash
   npx playwright test tests/{{SCENARIO_TYPE}}/{{SCENARIO_NAME}}.spec.ts --reporter=list
```
   
   All tests MUST still pass. If any fail:
   - Check the error message
   - Verify the locator key exists in JSON
   - Verify getElement() is awaited
   - Adjust and re-test

4. If tests fail after 2 fix attempts:
   - Document the issue
   - Mark with // TODO: Fix this locator
   - Move to next issue

─── PHASE 6: REPORT ───

Save output/healer-review-fixes-report.md:
```markdown
# Healer Code Review Fixes Report

**Date:** [Current Date]  
**Scenario:** {{SCENARIO_NAME}} ({{SCENARIO_TYPE}})  
**Mode:** Code Review Fixes

---

## Review Score

- **Before Fixes:** [X]/40 ([Score]/5) — [Status]
- **After Fixes:** [Y]/40 ([Score]/5) — [Status]

---

## Issues Addressed

### Dimension 1: Code Hygiene ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 2: Import Integrity ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 3: Step Completeness ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 4: Locator Quality ([Score]/5)
[List each raw selector that was moved to JSON]
- ✅ Fixed [File]:[Line] — [Method name] now uses LocatorLoader key '[keyName]'

### Dimension 5: Wait Strategy ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 6: Test Architecture ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 7: Security ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 8: Configuration ([Score]/5)
[List what was fixed or "✅ No issues"]

---

## Files Modified

1. output/locators/[page]-page.locators.json — Added [N] selector keys
2. output/pages/[Page].ts — Updated [N] methods to use LocatorLoader
3. [Other files...]

---

## New Locator Keys Added

**In cart-page.locators.json:**
- `keyName1` — [primary selector]
- `keyName2` — [primary selector]

**In inventory-page.locators.json:**
- `keyName3` — [primary selector]

---

## Test Results After Fixes
```
Running [N] tests...

✓ Scenario 1: [Name]
✓ Scenario 2: [Name]
✓ Scenario 3: [Name]
✓ Scenario 4: [Name]

[N] passed

## Prompt 5: API Analyst Agent (Swagger → Scenarios)

**Purpose:** Read Swagger/OpenAPI spec and auto-generate API test scenario .md files.
**When to use:** When customer provides a Swagger spec and you want auto-generated API tests.

```
---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths (never hardcode / or \)
- DO NOT use git commands or check repository state
- Self-contained execution mode
- Output: path.join(process.cwd(), 'output', 'api-analyst-report.md')
---

IMPORTANT RULES:
- Do NOT use Playwright MCP browser tools
- Do NOT create subagents
- This is a file reading + file generation task

Read the file agents/05-api-analyst.md for your instructions.
Read the Swagger/OpenAPI spec from scenarios/api/swagger-specs/[SPEC-FILE].json.

For each resource group in the spec (e.g., pet, store, user):
1. Generate a scenario .md file with CRUD happy path tests
2. Add negative tests (missing fields, not found, unauthorized)
3. Add chaining tests (create → get → update → delete)
4. Include Tags for CI/CD filtering (smoke, regression, P0, P1, P2)
5. Use {{ENV.VARIABLE}} for any credentials
6. Use VERIFY, CAPTURE, SAVE, REPORT keywords

Save generated files to scenarios/api/:
- scenarios/api/[resource]-crud.md (one per resource group)
- scenarios/api/api-test-summary.md (summary of all generated scenarios)

After generating, list all files created with scenario counts.
```

**Replace** `[SPEC-FILE]` with the spec filename.
**Time:** 2–4 minutes.

---

## Quick Reference

**Scenario Type**   |   **Analyst?**    |   **Generator reads**   |   **Healer runs**   |
Web UI (.md)    |   Yes   |   analyst-report.md + scenario .md    |   tests/web/[SCENARIO].spec.ts    |
API (.md)   |  No   |   scenario .md directly   |   tests/api/[SCENARIO].spec.ts    |
Swagger-generated (.md)   |  No (API Analyst already ran)   |   scenario .md directly   |   tests/api/[SCENARIO].spec.ts    |


## Output Folder Structure

Single shared framework. Scenario-specific artifacts organized by type.

output/
├── playwright.config.ts           ← shared (created once, never overwritten)
├── package.json                   ← shared
├── tsconfig.json                  ← shared
├── .env.example                   ← shared
├── core/                          ← shared utilities
│   ├── locator-loader.ts
│   ├── base-page.ts
│   └── shared-state.ts
├── locators/                      ← shared locator JSONs (web only)
│   ├── login-page.json
│   ├── products-page.json
│   └── checkout-page.json
├── pages/                         ← shared Page Objects (web only)
│   ├── LoginPage.ts
│   ├── ProductsPage.ts
│   └── CheckoutPage.ts
├── tests/
│   ├── web/                       ← web UI specs
│   │   ├── saucedemo-purchase.spec.ts
│   │   └── saucedemo-cart-feature.spec.ts
│   └── api/                       ← API specs
│       ├── pet-crud.spec.ts
│       └── store-crud.spec.ts
├── test-data/
│   ├── web/                       ← web test data by scenario
│   │   ├── saucedemo-purchase/
│   │   │   └── purchase-data.json
│   │   └── saucedemo-cart-feature/
│   │       └── cart-data.json
│   └── api/                       ← API test data by scenario
│       ├── pet-crud/
│       │   └── pet-data.json
│       └── store-crud/
│           └── store-data.json
├── healer-report.md
└── review-scorecard.md



## npm scripts in package.json:

"test:web": "npx playwright test tests/web/",
"test:api": "npx playwright test tests/api/",
"test:all": "npx playwright test tests/",
"test:smoke": "npx playwright test --grep @smoke",
"test:regression": "npx playwright test --grep @regression",
"test:p0": "npx playwright test --grep @P0"



## Tag-Based Test Execution Commands

After the framework is generated, run tests by tag:

```bash
# Run by priority
npx playwright test --grep "@P0"
npx playwright test --grep "@P1"

# Run by type
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
npx playwright test --grep "@api"

# Run by module
npx playwright test --grep "@cart"
npx playwright test --grep "@auth"
npx playwright test --grep "@checkout"

# Exclude a tag
npx playwright test --grep "@regression" --grep-invert "@P2"

# Combine tags
npx playwright test --grep "(?=.*@smoke)(?=.*@cart)"

# Using npm scripts (from package.json)
npm test                    # All tests
npm run test:smoke          # Smoke only
npm run test:regression     # Regression only
npm run test:api            # API only
npm run test:p0             # P0 only
```

---

## Quick Reference: Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| MCP won't start | Bad flag in mcp.json | Remove `--headed`, verify args |
| Password popups | Chrome password manager | `--isolated --browser chromium` |
| "model not supported for vision" | Grok model | Switch to Claude Haiku 4.5 |
| AI uses "Evaluate JavaScript" | Missing guardrail | Add rule to prompt |
| AI spawns subagents | Missing guardrail | Add rule to prompt |
| Login click fails | No snapshot between actions | "Snapshot after EVERY action" |
| Repeated "Allow" dialogs | Security setting | Enable `chat.tools.autoApprove` |
| Tests fail: env undefined | Missing .env file | Copy .env.example → .env, fill values |
| API tests 401 | Missing API token | Check API_TOKEN in .env |
| Tags not filtering | Missing @ prefix | Tags must be `@smoke` not `smoke` |

---

## MCP Configuration (validated)

```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--isolated", "--browser", "chromium"]
    }
  }
}
```

## VS Code Settings (validated)

```json
{
  "chat.agent.enabled": true,
  "github.copilot.chat.agent.runTasks": true,
  "github.copilot.chat.agent.autoFix": true,
  "chat.tools.autoApprove": true
}
```

---

## Demo Flow Summary

| Step | Agent | New Chat? | Uses Browser? | Time |
|------|-------|-----------|---------------|------|
| 1 | Analyst | Yes | Yes (Chromium) | 3–8 min |
| 2 | Generator | Yes | No | 2–5 min |
| 3 | Healer | Yes | Yes (terminal) | 2–5 min |
| 4 | Reviewer | Yes | No | 1–3 min |
| 5 | API Analyst | Yes | No | 2–4 min |
| **Total** | | | | **10–25 min** |

## Workflow by Scenario Type

| Scenario Type | Agents Used |
|--------------|-------------|
| Web UI | Analyst → Generator → Healer → Reviewer |
| API (manual scenario) | Generator → Healer → Reviewer |
| API (from Swagger) | API Analyst → Generator → Healer → Reviewer |
