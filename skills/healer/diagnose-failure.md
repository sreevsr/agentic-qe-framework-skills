# Skill: Diagnose Failure

## Purpose
Classify each test failure into one of 7 diagnostic categories (A-G) to determine the correct fix strategy.

## References
- `skills/_shared/guardrails.md` — assertion protection and bug flagging rules

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

**CRUD chain persistence guardrail (from guardrails.md):**
- POST returns 2xx but subsequent GET returns 404 → **POTENTIAL APPLICATION BUG**
- PUT/PATCH returns 2xx but GET shows old values → **POTENTIAL APPLICATION BUG**
- DELETE returns 2xx but GET still returns resource → **POTENTIAL APPLICATION BUG**
- **Exception:** If scenario declares `## API Behavior: mock`, the Healer may adapt.

## Diagnosis Process

For each failure:
1. Read the error message and stack trace
2. Match against category symptoms
3. If Category C: read the source scenario BEFORE deciding to change values
4. If Category G: check the API Behavior header in the scenario
5. Return: `{ testName, category, rootCause, fixStrategy, isPotentialBug }`
