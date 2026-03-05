# Skill: Fix Mobile Quality

## Purpose
Apply fixes for issues identified by `review-mobile-quality.md` when the Mobile Quality dimension scored <= 3. Addresses locator strategy gaps, raw selectors, driver.pause() usage, capability hardcoding, and deprecated gesture APIs.

## Applies To
`type=mobile` only. Triggered when `review-mobile-quality.md` scores <= 3 in `aggregate-scorecard.md`.

## Pre-Edit Gate
Before editing ANY file, verify:
1. The issue cited in the scorecard actually exists at the cited file/line
2. The fix will not break existing passing tests
3. Screen Object base methods (`BaseScreen`) are NOT modified — only generated screen files and locator JSONs

## Fix Patterns

### Fix M-1: Upgrade xpath-only Locator to accessibility_id

**When:** Locator entry has only `xpath`, but analyst report shows a stable `content-desc` or accessibility label exists.

**Action:** Add `accessibility_id` as primary strategy. Keep `xpath` as fallback.

Before:
```json
"loginButton": {
  "xpath": "//android.widget.Button[@bounds='[0,600][1080,720]']"
}
```

After:
```json
"loginButton": {
  "accessibility_id": "test-LOGIN",
  "xpath": "//android.widget.Button[@content-desc='test-LOGIN']"
}
```

Source of truth: the analyst report's Screen Map table — check the `AccessibilityId / content-desc` column.

---

### Fix M-2: Replace Index-Based XPath with Stable Attribute XPath

**When:** Locator uses positional xpath like `//android.widget.LinearLayout[2]/android.widget.Button[1]`.

**Action:** Rewrite using a stable attribute (`@text`, `@content-desc`, `@resource-id`).

Before:
```json
"submitButton": {
  "xpath": "//android.widget.LinearLayout[2]/android.widget.Button[1]"
}
```

After:
```json
"submitButton": {
  "xpath": "//android.widget.Button[@text='Submit']"
}
```

---

### Fix M-3: Remove Raw Selector from Screen Object

**When:** A Screen Object method uses `this.driver.$('selector')` directly.

**Action:**
1. Add the element to the screen's locator JSON with an appropriate key
2. Replace the raw selector call with `this.tap('key')` / `this.typeText('key', value)` / etc.

Before (in `HomeScreen.ts`):
```typescript
async tapSettings(): Promise<void> {
  await this.driver.$('~settings-icon').click();
}
```

After (in `HomeScreen.ts`):
```typescript
async tapSettings(): Promise<void> {
  await this.tap('settingsIcon');
}
```

And add to `home-screen.locators.json`:
```json
"settingsIcon": {
  "accessibility_id": "settings-icon"
}
```

---

### Fix M-4: Replace driver.pause() with waitForElement()

**When:** `driver.pause(N)` appears in a Screen Object or spec file.

**Action:** Identify what UI state the pause was waiting for, and replace with an element-based wait.

Before:
```typescript
await this.tap('addToCartButton');
await this.driver.pause(2000);
await this.tap('cartIcon');
```

After:
```typescript
await this.tap('addToCartButton');
await this.waitForElement('cartBadge', 'displayed');  // waits for badge to appear
await this.tap('cartIcon');
```

If the state change has no visible element indicator, use `waitForElement` on the NEXT element to be interacted with:
```typescript
await this.tap('addToCartButton');
await this.waitForElement('cartIcon', 'displayed');
await this.tap('cartIcon');
```

---

### Fix M-5: Remove Hardcoded App/Device Values from capabilities.ts

**When:** `capabilities.ts` contains literal strings for `appium:deviceName`, `appium:app`, etc.

**Action:** Replace with `process.env.*` references. Add the variable names to `.env.example`.

Before:
```typescript
'appium:deviceName': 'Pixel_7_API_34',
'appium:app': '/Users/dev/app/MyApp.apk',
```

After:
```typescript
'appium:deviceName': process.env.ANDROID_DEVICE || 'emulator-5554',
'appium:app': process.env.APP_PATH,
```

---

### Fix M-6: Replace Deprecated Gesture API with W3C Actions

**When:** `driver.touchAction()`, `driver.touch()`, or `driver.swipe()` appears in screen objects.

**Action:** Replace with W3C pointer actions pattern from `BaseScreen.swipe()`.

Before:
```typescript
await this.driver.touchAction([
  { action: 'press', x: 200, y: 500 },
  { action: 'moveTo', x: 200, y: 200 },
  { action: 'release' },
]);
```

After:
```typescript
await this.swipe('up');  // use inherited BaseScreen method
```

Or for custom coordinates:
```typescript
await this.driver.action('pointer')
  .move({ duration: 0, origin: 'viewport', x: 200, y: 500 })
  .down({ button: 0 })
  .pause(100)
  .move({ duration: 600, origin: 'viewport', x: 200, y: 200 })
  .up({ button: 0 })
  .perform();
```

---

## Quality Checks After Fixes
- [ ] All locator entries with `xpath`-only now have `accessibility_id` (where analyst report confirms it exists)
- [ ] No index-based xpaths remaining
- [ ] No `this.driver.$('selector')` in any Screen Object method
- [ ] No `driver.pause()` in screens or specs
- [ ] `capabilities.ts` reads all values from `process.env.*`
- [ ] No deprecated `touchAction` / `touch` / pre-W3C gesture APIs
- [ ] Tests still pass after fixes (re-run before marking complete)
