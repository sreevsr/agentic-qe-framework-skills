# Skill: Generate Mobile Spec

## Purpose
Generate WebdriverIO + Mocha TypeScript test spec files for `type=mobile` scenarios. Produces one `.spec.ts` file per scenario with Screen Object imports, assertions, and all keyword implementations.

## Paths
- Output (with folder, Android): `output/tests/mobile/android/{folder}/{scenario}.spec.ts`
- Output (without folder, Android): `output/tests/mobile/android/{scenario}.spec.ts`
- Output (iOS): same paths with `ios` instead of `android`
- Determine platform from `platform` pipeline parameter

## Rules
- **No direct driver calls in tests:** All interactions via Screen Objects — no `browser.$('selector').click()`
- **No `driver.pause()`:** Never — use `screen.waitForElement()` instead
- **No hardcoded selectors:** All via Screen Objects which use MobileLocatorLoader
- **No hardcoded credentials:** Use `process.env.VARIABLE` (no fallback defaults)
- **Helper File Protection:** If a screen has a `*.helpers.ts` file, import the helpers class aliased to the base name

## Input
- Analyst report — step results, screen map, captured values
- Screen objects (from `generate-screens` skill)
- Helper registry (from `discover-helpers` skill — same skill reused, checks `output/screens/`)
- Original scenario `.md` file — for tags, datasets, keywords

## Process

### Step 1: Read Scenario Structure

Determine shape:
- **Single scenario** → one `it()` block
- **Multi-scenario** (has `---` separators) → `describe()` with multiple `it()` blocks
- **Has Common Setup** → `beforeEach()` hook
- **Has DATASETS** → `for...of` loop with parameterized tests

### Step 2: Generate Imports

```typescript
import { browser } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
```

For each screen used, add import:
```typescript
// If helpers exist for this screen:
import { LoginScreenWithHelpers as LoginScreen } from '../../screens/LoginScreen.helpers';

// If no helpers:
import { LoginScreen } from '../../screens/LoginScreen';
```

For SHARED_DATA keyword:
```typescript
import { loadTestData } from '../../../core/test-data-loader';
const testData = loadTestData('mobile/{scenario}', ['users']);
```

For SAVE keyword:
```typescript
import { saveState } from '../../../core/shared-state';
```

### Step 3: Generate Test Body

**Single scenario:**
```typescript
describe('Login — Android Smoke', () => {
  it('should login successfully with valid credentials @smoke @P0', async () => {
    const loginScreen = new LoginScreen(browser);

    await loginScreen.typeUsername(process.env.TEST_USERNAME!);
    await loginScreen.typePassword(process.env.TEST_PASSWORD!);
    await loginScreen.tapLogin();

    // VERIFY: Home screen is displayed
    const homeScreen = new HomeScreen(browser);
    expect(await homeScreen.isVisible('screenTitle')).toBe(true);
  });
});
```

**Multi-scenario:**
```typescript
describe('Authentication', () => {
  beforeEach(async () => {
    // Common Setup — app is launched by wdio.conf.ts capabilities
    const splashScreen = new SplashScreen(browser);
    await splashScreen.waitForElement('loginButton');
  });

  it('should login with valid credentials @smoke', async () => { /* ... */ });
  it('should show error for invalid credentials @regression', async () => { /* ... */ });
});
```

**DATASETS:**
```typescript
import testData from '../../../test-data/mobile/login-datasets.json';

for (const data of testData) {
  it(`Login: ${data.username || '(empty)'} — expects ${data.expectedResult}`, async () => {
    // Use data.username, data.password, etc.
  });
}
```

### Step 4: Implement Keywords

All keywords from `keyword-reference.md` apply. Mobile-specific mappings:

| Keyword | Web pattern | Mobile pattern |
|---------|-------------|---------------|
| Plain step | `await page.click()` | `await screen.tap()` |
| VERIFY element visible | `expect(page.locator()).toBeVisible()` | `expect(await screen.isVisible('key')).toBe(true)` |
| VERIFY text | `expect(el).toHaveText()` | `expect(await screen.getText('key')).toBe('expected')` |
| CAPTURE | `const val = await page.getText()` | `const val = await screen.getText('key')` |
| SCREENSHOT | `page.screenshot()` + attach | `await screen.takeScreenshot('name')` |
| REPORT | `console.log()` + annotation | `console.log()` (no test.info in Mocha — use console) |
| SAVE | `saveState('key', val)` | `saveState('key', val)` (identical) |

### Step 5: App Launch Pattern

Unlike web tests, mobile tests do NOT call `navigate()`. The app is launched via `wdio.conf.ts` capabilities. The test starts from whatever screen the app shows on launch.

**Entry pattern:**
```typescript
it('test name', async () => {
  // App is already open — wait for the first screen to be ready
  const loginScreen = new LoginScreen(browser);
  await loginScreen.waitForElement('usernameField', 'displayed', 15000);

  // ... rest of test
});
```

**If the scenario requires starting from a specific screen** (not the launch screen), navigate there:
```typescript
await homeScreen.tapSettingsIcon();
const settingsScreen = new SettingsScreen(browser);
await settingsScreen.waitForElement('titleLabel');
```

### Step 6: Helper Method Resolution (HARD STOP)

Identical rules as `generate-web-spec.md`:
- If `USE_HELPER: ScreenName.methodName` and helpers file exists → call it
- If helpers file does NOT exist → emit warning comment + wrap test in `it.skip('HELPER ISSUE: ...')`
- NEVER implement missing helper logic inline

```typescript
// WARNING: USE_HELPER requested CartScreen.getTotalWithTax but CartScreen.helpers.ts not found
// ACTION REQUIRED: Team must create output/screens/CartScreen.helpers.ts with getTotalWithTax()
it.skip('HELPER ISSUE: USE_HELPER requested CartScreen.getTotalWithTax but CartScreen.helpers.ts not found', async () => {
  // test body here — skipped until helpers file is created
});
```

## Prohibited Patterns
- No `browser.$('selector').click()` — always use Screen Objects
- No `driver.pause()` or `await new Promise(resolve => setTimeout(resolve, 1000))`
- No hardcoded selectors anywhere in the spec
- No hardcoded credentials — use `process.env.VARIABLE`
- No `test.info()` calls — this is Mocha, not Playwright (use `console.log()` for REPORT)

## Quality Checks
- [ ] Every test uses Screen Objects — no direct `browser.$()` calls
- [ ] Tags in test description string with `@` prefix: `it('test name @smoke @P0', ...)`
- [ ] VERIFY steps produce `expect()` assertions
- [ ] CAPTURE steps produce variable assignments via screen getter methods
- [ ] DATASETS produce parameterized `for...of` loops
- [ ] Multi-scenario uses `describe()` with `beforeEach()`
- [ ] Entry screen uses `waitForElement()` at the start — not `pause()`
- [ ] If helpers exist, spec imports helpers class aliased to base name
- [ ] Every async call uses `await`
- [ ] Import paths are correct relative to file location
- [ ] Test count matches scenario count from analyst report
