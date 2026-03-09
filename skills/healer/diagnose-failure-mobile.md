# Skill: Diagnose Failure — Mobile

## Purpose
Classify mobile test failures into categories so the Healer's `apply-fix` skill can apply the correct fix. Used when `type=mobile` and a test fails. Called from `heal-loop.md` in place of (or in addition to) the standard `diagnose-failure.md`.

## Failure Categories

### Category M-A: Element Not Found
**Pattern:** `NoSuchElementError`, `Error: Element … could not be resolved`, `waitForDisplayed timeout`

**Cause:** The locator in `{screen}.locators.json` no longer matches any element — the element may have been renamed, moved, or the screen may have changed.

**Evidence to collect:**
- Call `page_source` (or read the test output's page source dump if available)
- Compare the `accessibility_id`/`id` in the locator JSON against what's in the current page source XML

**Fix:**
1. Update the failing strategy in the locator JSON with the new value found in page source
2. Add `xpath` fallback if the primary strategy is unstable
3. Do NOT change Screen Object method names — only the locator JSON

---

### Category M-B: Wrong Screen / App State
**Pattern:** `waitForDisplayed timeout` on the FIRST element of the test, element exists but is on the wrong screen, incorrect screen navigation

**Cause:** The app launched to a different screen than expected (e.g., already logged in, showing an onboarding screen, or a permission dialog appeared).

**Evidence:** Page source shows unexpected root activity/view.

**Fix:**
1. Add a `waitForElement('screenIdentifier', 'displayed', 20000)` at the test start
2. If an onboarding/permission dialog is blocking, add handling for it in `beforeEach` or add a `tap('skipButton')` / `press_key('back')` step before the real test starts
3. If the app is already in a logged-in state, set `'appium:noReset': false` in `capabilities.ts` to reset app state

---

### Category M-C: Keyboard Obscuring Element
**Pattern:** Tap succeeds but the next `tap` or `waitForDisplayed` fails because the soft keyboard is covering the element

**Evidence:** Page source shows `android.inputmethod.InputMethodService` or `XCUIElementTypeKeyboard` at the top of the hierarchy, obscuring the target element.

**Fix:**
Add a keyboard dismissal before the next tap:
```typescript
// In the Screen Object method, after typeText:
await this.driver.hideKeyboard();
await this.waitForElement('nextElement');
```
Or use `press_key('enter')` if the keyboard has a Done/Next/Search action button.

---

### Category M-D: Animation / Transition In Progress
**Pattern:** `StaleElementReferenceError`, tap registered but no navigation occurred, element found but `click()` appears to have no effect

**Evidence:** The action runs without error but the expected outcome (next screen, state change) doesn't happen.

**Cause:** The UI was mid-animation when the tap landed.

**Fix:**
1. Add `waitForElement` on a stable element of the DESTINATION screen before asserting it
2. If the issue is within a single screen (e.g., accordion expand), add `waitForElement('expandedContent')` after the tap
3. Do NOT add `driver.pause()` — find the element that signals the transition is complete and wait for it

---

### Category M-E: App Crash / Session Lost
**Pattern:** `SessionNotCreatedException`, `InvalidSessionIdError`, `socket hang up`, `connection refused`

**Evidence:** Session errors in the test output.

**Fix:**
1. Ensure Appium Server is running: the test command should include a `--spec` flag pointing to one file, not all tests
2. Increase `newCommandTimeout` in `capabilities.ts` (currently 60s — try 120s)
3. If the crash is consistent on a specific step, wrap that step with better `waitForElement` guards
4. For `SessionNotCreatedException`: verify `APP_PATH`, `APP_PACKAGE`, `APP_ACTIVITY` / `IOS_BUNDLE_ID` in `.env`

---

### Category M-F: TypeScript / Import Error
**Pattern:** `Cannot find module`, `Property X does not exist on type Y`, `ts-node` compilation error

**Cause:** Import path wrong, missing type, incorrect method signature.

**Fix:** Same as Category B in the standard `diagnose-failure.md` — fix the TypeScript error directly.

---

### Category M-G: Selector Strategy Mismatch (Platform)
**Pattern:** Test passes on Android but a `uiautomator` selector throws on iOS (or vice versa)

**Evidence:** Error contains `android=` or `-ios class chain:` prefix in an unexpected platform context.

**Cause:** The locator JSON contains a platform-specific strategy that MobileLocatorLoader tried on the wrong platform.

**Fix:**
- `uiautomator` strategies are Android-only — MobileLocatorLoader's priority order skips them on iOS
- Verify that `capabilities.ts` has the correct `platformName`
- Add a cross-platform `accessibility_id` or `xpath` fallback to the locator entry

---

### Category M-I: Stale Form State from Previous Test
**Pattern:** Assertion fails for empty-field validation (e.g., `isUsernameErrorVisible()` returns false), or wrong error message appears, even though the test doesn't enter any data.

**Cause:** WDIO reuses a single session across all tests. Form fields retain values from previous tests. A test that expects empty fields may actually be submitting stale credentials from a prior test.

**Evidence to collect:**
- Take a **screenshot** of the current screen state BEFORE the failing assertion
- Check if the previous test in the spec entered data into the same fields
- Verify if the navigation helper resets the screen or just navigates to it

**Fix:**
1. Add explicit `clear{FieldName}()` calls before the assertion
2. The clear method should call `el.clearValue()` on the relevant input elements
3. If the Screen Object doesn't have clear methods, add them:
```typescript
async clearUsername(): Promise<void> {
  const el = await this.loc.get('usernameField');
  await el.clearValue();
}
```

---

### Category M-H: Missing Helper (HARD STOP)
**Pattern:** `TypeError: screen.methodName is not a function`, and the method appears in a `USE_HELPER` reference in the scenario

**Fix:** Same HARD STOP as Category H in standard diagnose:
1. Do NOT implement the method in the Screen Object or inline
2. Wrap the test: `it.skip('HELPER ISSUE: USE_HELPER requested ScreenName.methodName but ScreenName.helpers.ts not found', ...)`
3. Document in healer report

---

## Visual Diagnosis Protocol (MANDATORY)

**Before classifying ANY failure**, perform this 3-step visual diagnosis. This is not optional — skipping it wastes cycles on wrong fixes.

### Step 1: Capture Device State

Use the Appium MCP tools to capture both visual and structural state:

1. **Take a screenshot** using `mcp__appium__screenshot` — this shows what the user would see
2. **Capture page source** using `mcp__appium__page_source` — this shows what the accessibility tree contains

Both must be captured at the moment of failure (or as close to it as possible). If the test has already exited, relaunch the app and navigate to the failing step manually via Appium MCP to reproduce the state.

### Step 2: Cross-Reference Visual vs Structural

Analyze BOTH outputs together. Ask these questions:

| Question | What it reveals | Category |
|----------|----------------|----------|
| **What screen is visible in the screenshot?** Is it the expected screen or a different one? | Wrong screen = M-B. Overlay/dialog blocking = M-B. | M-B |
| **Is the target element visible in the screenshot but NOT in page_source?** | Element is rendered but not in accessibility tree = Compose/SwiftUI accessibility gap. Locator fix won't help. | M-J (new) |
| **Is the target element in page_source but NOT visible in the screenshot?** | Element is offscreen (needs scroll) or behind keyboard. | M-C or needs scroll |
| **Is the target element visible AND in page_source, but the locator doesn't match?** | Locator attributes have changed (renamed, restructured). | M-A |
| **Did the action execute but produce wrong results?** (e.g., tap "Search" but returned to home screen) | Business logic constraint — the action works but doesn't do what the test expects. | M-J (new) |
| **Is the keyboard visible in the screenshot?** | Keyboard overlay blocking interaction. | M-C |
| **Are there unexpected elements in the screenshot?** (ads, permission dialogs, banners) | Overlay blocking the flow. | M-B |

### Step 3: Check Debug Screenshots

If the spec was generated with the `generate-mobile-spec` skill, it should contain debug screenshots between screen transitions (named `debug-{scenario}-{step}`). Check the `output/` directory:

```bash
ls output/debug-*.png 2>/dev/null || ls output/screenshots/debug-*.png 2>/dev/null
```

These screenshots show the app state BETWEEN steps — invaluable for finding exactly where the flow diverged from expectations. Compare sequential debug screenshots to identify the exact transition that failed.

### Example: How Visual Diagnosis Would Have Caught the Airbnb Bug

```
Error message: "Element 'Go back to the previous search' not found after 30s timeout"
Text-only diagnosis: "Locator is wrong or element doesn't exist" → Try fixing xpath → WRONG

Visual diagnosis:
  Screenshot: Shows the HOME SCREEN (not results screen)
  Page source: Confirms home screen elements present, no results screen elements
  Cross-reference: The Search button tap returned to home instead of navigating to results
  Conclusion: NOT a locator issue (M-A). NOT a timing issue (M-D).
              This is a BUSINESS LOGIC CONSTRAINT (M-J) — Search without dates = cancel.
  Correct fix: Simplify scenario to avoid date-dependent search, or mark as UNFIXABLE.

Cycles saved: 4+ (we spent 4 cycles trying locator/timing fixes before a screenshot revealed the truth)
```

---

### Category M-J: Business Logic Constraint (NEW)

**Pattern:** An action executes successfully (no error thrown), but the app navigates to an unexpected screen or produces unexpected results. The element IS tapped, the locator IS correct, but the outcome is wrong.

**Evidence to collect:**
- Take a screenshot AFTER the action — what screen did the app navigate to?
- Compare with the expected screen from the analyst report
- Check if the action has preconditions (e.g., "Search requires date selection", "Submit requires all mandatory fields")

**Cause:** The app's business logic requires preconditions that the test doesn't satisfy. The action is valid but semantically means something different without the precondition (e.g., "Search" without dates = "Cancel").

**Examples:**
- Tap "Search" without selecting dates → app closes search panel (= cancel), not execute search
- Tap "Submit" without filling required fields → form resets instead of showing validation errors
- Tap "Next" on a wizard step that has mandatory fields → silently stays on same step

**Fix:**
1. **First, check if the precondition can be satisfied as the scenario describes** — can the test fill the required fields / select the required options using the exact steps in the scenario?
2. **If the precondition can be satisfied**: fix the locator or interaction that's preventing the precondition step from executing
3. **If the precondition widget is inaccessible** (Compose calendar with no testTags, etc.) or the scenario step cannot be executed as written: wrap in `test.fixme('SCENARIO BLOCKED: Step N "[step]" cannot be executed — [reason: widget inaccessible / business logic requires precondition]')`
4. **NEVER take an alternative flow** not described in the scenario (e.g., do NOT tap "Flexible" instead of selecting a date, do NOT skip the filter step). The scenario is the specification — if it can't be followed exactly, that's a finding to report, not a problem to work around.
5. Do NOT keep retrying with locator/timing changes — this is not a locator problem
6. Document the blocker clearly in the healer report so the scenario author can decide: revise the scenario, file a bug, or request testability improvements from the dev team

---

## Decision Flow (Updated)

```
Test fails
    │
    ▼
VISUAL DIAGNOSIS FIRST (mandatory):
    Take screenshot + page_source via Appium MCP
    Cross-reference visual state vs structural state
    │
    ├─ Session error (crash, connection refused)        → Category M-E
    ├─ TypeScript compile error                         → Category M-F
    ├─ NoSuchElementError / waitForDisplayed timeout
    │       ├─ First element of test?                   → Category M-B (wrong screen)
    │       ├─ Element visible in screenshot but
    │       │  not in page_source?                      → Category M-J (accessibility gap)
    │       └─ Mid-test element?                        → Category M-A (locator changed)
    ├─ Action succeeds but wrong screen/result          → Category M-J (business logic)
    ├─ Assertion fails on empty-field validation         → Category M-I (stale form state)
    ├─ Tap has no effect / StaleElementReference        → Category M-D (animation)
    ├─ Next element after typing is unreachable         → Category M-C (keyboard)
    ├─ Platform-specific selector on wrong platform     → Category M-G
    └─ Missing method matching USE_HELPER               → Category M-H (HARD STOP)
```

## Diagnostic Commands

```bash
# Check if Appium server is running (works on all OSes — curl ships with Windows 10+, macOS, Linux)
curl http://localhost:4723/status

# List connected devices (Android — works on all OSes with Android SDK)
adb devices

# List iOS simulators (macOS only)
xcrun simctl list devices

# Get app package/activity (Android, app already installed)
# Linux / macOS:
adb shell dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'
# Windows (PowerShell):
# adb shell dumpsys window | Select-String 'mCurrentFocus|mFocusedApp'
# Windows (CMD):
# adb shell dumpsys window | findstr "mCurrentFocus mFocusedApp"
```
