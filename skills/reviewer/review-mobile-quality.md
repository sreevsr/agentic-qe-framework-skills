# Skill: Review Mobile Quality

## Purpose
Audit mobile-specific quality dimensions: locator strategy usage, Screen Object structure, capability configuration, gesture patterns, and platform safety. Scores this dimension /5 for the aggregate scorecard.

## Applies To
`type=mobile` only. Skip for web, api, and hybrid.

## Scope — Files to Review
- `output/screens/*.ts` (all Screen Objects, excluding `*.helpers.ts`)
- `output/locators/mobile/*.locators.json` (all mobile locator files)
- `output/wdio.conf.ts`
- `output/core/capabilities.ts`
- `output/tests/mobile/**/*.spec.ts` (the current scenario's spec only)

## Review Dimensions

### 1. Locator Strategy Quality (highest weight)

**Check:** Every locator entry has `accessibility_id` as the PRIMARY strategy wherever the analyst report found a stable `content-desc` / accessibility label.

**Red flags (score -1 each, max -3):**
- Element locator uses ONLY `xpath` with index-based paths (`//LinearLayout[2]/Button[1]`)
- Element locator uses an auto-generated `id` (e.g., `com.example:id/view_1234` with a number suffix)
- `uiautomator` or `class_chain` used as PRIMARY strategy when `accessibility_id` was available in analyst report
- No fallback strategy for elements that only have `xpath`
- Locator entry is completely empty `{}`

**Good patterns:**
- `accessibility_id` present for most elements
- `xpath` uses stable attributes (`@text`, `@content-desc`, `@resource-id`) not position
- Platform-specific strategies (`uiautomator`, `class_chain`) as supplements, not primary

### 2. Screen Object Structure

**Check:** Screen Objects follow BaseScreen patterns correctly.

**Red flags:**
- `driver.$('selector')` used directly in a Screen Object method (raw selector)
- `driver.pause()` in any Screen Object method (banned — same as `waitForTimeout`)
- Method name is technical rather than business-intent: `clickButton1()` instead of `tapLogin()`
- Missing `waitForElement()` at screen entry points (first method called in tests should wait)
- Screen constructor passes wrong locator file name (mismatched with actual JSON filename)
- Missing JSDoc on public methods

**Good patterns:**
- All element access via `this.tap()`, `this.typeText()`, `this.getText()` etc. (inherited from BaseScreen)
- Entry methods call `this.waitForElement()` on a stable screen identifier
- Business-intent method names: `typeUsername()`, `tapLoginButton()`, `getProductPrice()`

### 3. Spec File Quality

**Check:** Test spec uses Screen Objects correctly, no direct driver calls.

**Red flags:**
- `browser.$('selector')` in the spec file
- `driver.pause()` or `setTimeout` in the spec
- Hardcoded credentials: `typeUsername('standard_user')` — must use `process.env.TEST_USERNAME`
- Test does not wait for the entry screen before interacting
- Missing `describe()` wrapper (Mocha requires it)
- Tags not in test description string (mobile specs use `@tag` in the `it()` string, not Playwright's `{ tag: [] }`)

### 4. Capability Configuration

**Check:** `output/core/capabilities.ts` is safe and environment-driven.

**Red flags:**
- Hardcoded device name (literal string instead of `process.env.ANDROID_DEVICE`)
- Hardcoded app path (literal string instead of `process.env.APP_PATH`)
- `'appium:noReset': true` (leaves dirty app state between runs — breaks test isolation)
- Missing `'appium:newCommandTimeout'` (session drops silently during slow operations)
- `'appium:app'` and `'appium:appPackage'/'appium:appActivity'` both set simultaneously (conflict)

**Good patterns:**
- All device/app values from `process.env.*`
- `'appium:autoGrantPermissions': true` (Android — prevents permission dialog interruptions)
- `'appium:noReset': false` (default — clean state)

### 5. Gesture and Wait Patterns

**Check:** Gestures use W3C Actions API, waits use proper element-based patterns.

**Red flags:**
- `driver.touchAction()` or `driver.touch()` — deprecated pre-W3C API
- `driver.pause(N)` anywhere in screens or specs
- `scrollToElement` implemented as a fixed number of swipes without element-visibility check
- `swipe()` using absolute pixel coordinates that will fail on different screen sizes (use percentage-based or W3C origin:viewport approach)

**Good patterns:**
- All gestures use `driver.action('pointer').move().down().pause().move().up().perform()`
- Waits use `el.waitForDisplayed({ timeout })` or screen's `waitForElement()`
- Scroll loops check `isDisplayed()` before each swipe attempt

## Scoring Guide

| Score | Meaning |
|-------|---------|
| 5 | All locators use `accessibility_id` as primary; no raw selectors; no `pause()`; capabilities env-driven; W3C gestures |
| 4 | Minor issues: 1-2 xpath-only locators, all other dimensions clean |
| 3 | Several xpath-only locators, or 1-2 raw selectors/pauses; capabilities mostly clean |
| 2 | Widespread xpath-only locators OR raw selectors in Screen Objects OR hardcoded capabilities |
| 1 | Structural violations: `pause()` throughout, raw selectors everywhere, deprecated gesture APIs |

## Output

Write findings to the reviewer's in-memory notes for `aggregate-scorecard.md` to collect.

Format:
```
## Mobile Quality Review
Score: [N]/5

Strengths:
- [file:line or locator key] — [what is good]

Issues:
- [file:line or locator key] — [what is wrong]

Score justification: [1-2 sentences]
```
