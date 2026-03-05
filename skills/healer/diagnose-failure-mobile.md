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

### Category M-H: Missing Helper (HARD STOP)
**Pattern:** `TypeError: screen.methodName is not a function`, and the method appears in a `USE_HELPER` reference in the scenario

**Fix:** Same HARD STOP as Category H in standard diagnose:
1. Do NOT implement the method in the Screen Object or inline
2. Wrap the test: `it.skip('HELPER ISSUE: USE_HELPER requested ScreenName.methodName but ScreenName.helpers.ts not found', ...)`
3. Document in healer report

---

## Decision Flow

```
Test fails
    │
    ├─ Session error (crash, connection refused)        → Category M-E
    ├─ TypeScript compile error                         → Category M-F
    ├─ NoSuchElementError / waitForDisplayed timeout
    │       ├─ First element of test?                   → Category M-B (wrong screen)
    │       └─ Mid-test element?                        → Category M-A (locator changed)
    ├─ Tap has no effect / StaleElementReference        → Category M-D (animation)
    ├─ Next element after typing is unreachable         → Category M-C (keyboard)
    ├─ Platform-specific selector on wrong platform     → Category M-G
    └─ Missing method matching USE_HELPER               → Category M-H (HARD STOP)
```

## Diagnostic Commands

```bash
# Check if Appium server is running
curl http://localhost:4723/status

# List connected devices (Android)
adb devices

# List iOS simulators
xcrun simctl list devices

# Get app package/activity (Android, app already installed)
adb shell dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'
```
