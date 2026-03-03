# Skill: Diagnose Failure

## Purpose
Classify each test failure into one of 8 diagnostic categories (A-H) to determine the correct fix strategy.

## Rules
- **Assertion Protection:** The Healer fixes TEST CODE (how we test). It must NEVER alter EXPECTED BEHAVIOR (what we test).
- Before changing any expected value, read the SOURCE SCENARIO first. If the scenario explicitly defines the value, flag as POTENTIAL BUG — do NOT update.
- **API Behavior Escape Hatch:** Only if the scenario declares `## API Behavior: mock` may the Healer adapt for non-persistence. Without this header, all guardrails apply with ZERO exceptions.

## Diagnostic Categories

### Category A — Import/Module Error
- **Symptoms:** `Cannot find module`, `ERR_MODULE_NOT_FOUND`, `is not a constructor`
- **Root cause:** Wrong import path, missing file, mismatched export name
- **Fix strategy:** Correct the import path, check file exists, verify tsconfig paths

### Category B — Locator Not Found
- **Symptoms:** `Timeout waiting for selector`, `strict mode violation`, `waiting for locator`
- **Root cause:** Wrong or stale CSS selector, element not present, dynamic content not loaded
- **Fix strategy:**
  1. Check `output/scout-reports/{folder}/{scenario}-page-inventory-latest.md` (or without folder). If the Scout report exists and the failing element appears in it:
     - Use the Scout-reported `SELECTOR` as the corrected primary selector
     - If the element's `METHOD` is not plain `click` or `fill` (e.g., `fluentComboBoxSelect`, `muiSelectOption`), the locator JSON fix alone is not sufficient — also fix the interaction pattern in the page object method using the Scout-reported `INTERACTION` sequence
     - If Scout reports a `HIT-AREA MISMATCH` warning for this element, add `{ force: true }` to the interaction
  2. If no Scout report exists, find the correct selector from the DOM via Playwright MCP snapshot or inspect error context, then update the locator JSON file.

### Category C — Assertion Failure
- **Symptoms:** `expect(received).toBe(expected)` mismatch, `toHaveText`, `toContain` failures
- **Root cause:** Expected value doesn't match actual value
- **CRITICAL — Before updating the expected value:**
  1. Read the SOURCE SCENARIO `.md` file
  2. Check if the scenario explicitly defines what the value SHOULD be
  3. If the scenario says `VERIFY: Cart badge shows "1"` and the app shows "2", this is a **POTENTIAL APPLICATION BUG** — do NOT update the expected value
  4. Only update expected values when the test data was auto-generated with a wrong default placeholder and the scenario does not specify an explicit expected value
- **Bug flagging:** `test.fixme('POTENTIAL BUG: ...')`

### Category D — Navigation/Timing
- **Symptoms:** `page.goto: net::ERR_*`, `Navigation timeout`, page loads wrong URL
- **Root cause:** URL in config is wrong, network issue, missing wait after navigation
- **Fix strategy:** Check URL in config, add `await page.waitForLoadState('domcontentloaded')` after navigation

### Category E — Config Error
- **Symptoms:** `browserType.launch: Executable doesn't exist`, `browser.newContext: options.channel is not supported`
- **Root cause:** Browser not installed, wrong config values
- **Fix strategy:** Run `npx playwright install chromium`, verify `channel: 'chrome'` in config

### Category F — Environment Variable Missing
- **Symptoms:** `TypeError: Cannot read properties of undefined`, empty username/password, `process.env.X is undefined`
- **Root cause:** `.env` file missing or incomplete, `dotenv` not configured
- **Fix strategy:** Check `.env` exists with correct variable names, verify `dotenv` is loaded in config

### Category G — API Test Failure
- **Symptoms:** `response.status()` mismatch, unexpected response body, timeout on API call
- **Root cause:** Wrong endpoint, auth issues, request body format
- **Fix strategy by status code:**

| Status | Check |
|--------|-------|
| 401 | API_TOKEN in `.env` |
| 404 | Endpoint path correct |
| 400 | Request body matches expected schema |
| 5xx | Server issue — document, don't fix |

**CRUD chain persistence guardrail:**
- POST returns 2xx but subsequent GET returns 404 → **POTENTIAL APPLICATION BUG**
- PUT/PATCH returns 2xx but GET shows old values → **POTENTIAL APPLICATION BUG**
- DELETE returns 2xx but GET still returns resource → **POTENTIAL APPLICATION BUG**
- **Exception:** If scenario declares `## API Behavior: mock`, the Healer may adapt.

### Category H — Missing Helper Method (HARD STOP)
- **Symptoms:** `is not a function`, `has no method`, `undefined is not a function`, or any error referencing a method that matches a `USE_HELPER` reference in the scenario. Also: test code contains `// WARNING: USE_HELPER requested` comment near the failure point.
- **Root cause:** The scenario uses `USE_HELPER: PageName.methodName` but the corresponding `*.helpers.ts` file does not exist or does not export the method. This is intentional — the team has not yet created the helpers file.
- **HARD STOP — Fix strategy:**
  1. Wrap the affected test in `test.fixme('HELPER ISSUE: USE_HELPER requested PageName.methodName but helpers file not found')`
  2. Do NOT implement the method anywhere — not in the base page object, not inline in the spec, not by creating the helpers file
  3. Do NOT attempt any workaround (inline calculations, bulk operations, etc.)
  4. This is NOT a healer failure. It is a signal that the team must create the `*.helpers.ts` file with the required method.
- **Why:** Base page objects (`{PageName}.ts`) are pipeline-owned and regenerated on every run. Any method added here will be overwritten. `*.helpers.ts` files are team-owned and survive regeneration. The ownership boundary must never be violated.

## Diagnosis Process

For each failure:
1. Read the error message and stack trace
2. **Before matching other categories:** Check if the error involves a method referenced by `USE_HELPER` in the scenario. If so → **Category H (HARD STOP)**. Do not classify as Category A or B — those would lead to implementing the method, which is prohibited.
3. Match against category symptoms (A-G)
4. If Category C: read the source scenario BEFORE deciding to change values
5. If Category G: check the API Behavior header in the scenario
6. Return: `{ testName, category, rootCause, fixStrategy, isPotentialBug }`
