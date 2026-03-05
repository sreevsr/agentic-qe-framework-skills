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

    await loginScreen.typeUsername(process.env.MOBILE_USERNAME!);
    await loginScreen.typePassword(process.env.MOBILE_PASSWORD!);
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

### Step 5: Debug Screenshots Between Critical Steps

For mobile tests, insert `takeScreenshot()` calls at key navigation boundaries to aid diagnosis if the test fails in the healer stage. Without these, the healer wastes cycles guessing which screen the app is on.

**Insert a screenshot AFTER every screen transition** (not after every action — only when the expected screen changes):

```typescript
// After navigating to a new screen
await filterScreen.tapSearch();
await filterScreen.takeScreenshot('debug-after-search-tap');  // Where did we land?

// Before assertions that depend on being on the right screen
await resultsScreen.takeScreenshot('debug-before-results-check');
const title = await resultsScreen.getResultsTitle();
expect(title).toContain('Homes in');
```

**Naming convention:** `debug-{scenario}-{step-description}` (e.g., `debug-airbnb-after-search-tap`)

These screenshots are automatically saved by `BaseScreen.takeScreenshot()` and are invaluable for the healer's `diagnose-failure-mobile` skill. They cost ~200ms each — negligible compared to a wasted healer cycle.

### Step 6: App Launch and Session State Management

Unlike web tests (where each test gets a fresh browser context), **WDIO reuses a single session across all tests**. `noReset: false` only applies at session creation, not between tests. This means:

- App state persists between tests (form fields, navigation, login state)
- Tests MUST explicitly manage their own starting state
- Form fields may contain stale values from previous tests

**Entry pattern — single session awareness:**
```typescript
// Create a navigation helper that all tests call
async function navigateToScreen(screen: SomeScreen): Promise<void> {
  // 1. Dismiss any lingering dialogs from previous tests
  // 2. Navigate via stable path (e.g., side menu, tab bar)
  // 3. Wait for the target screen to be ready
  await screen.waitForScreen();
}

describe('My Tests', () => {
  let myScreen: MyScreen;

  before(async () => {
    myScreen = new MyScreen(browser);
  });

  it('test 1', async () => {
    await navigateToScreen(myScreen);
    // ... test logic
  });
});
```

**Critical: Clear form fields for "empty state" tests.** If a test verifies empty-field validation (e.g., "tap submit without entering data"), it MUST explicitly clear all fields first — a previous test may have left stale values:
```typescript
// WRONG — fields may contain stale values from previous test
await loginScreen.tapLogin();

// CORRECT — explicitly clear fields first
await loginScreen.clearUsername();
await loginScreen.clearPassword();
await loginScreen.tapLogin();
```

Generate `clear{FieldName}()` methods on Screen Objects for any text input field:
```typescript
async clearUsername(): Promise<void> {
  const el = await this.loc.get('usernameField');
  await el.clearValue();
}
```

**If the scenario requires starting from a specific screen** (not the launch screen), navigate there via screen objects — never use raw `browser.$()` selectors in the spec:
```typescript
// WRONG
const menuBtn = await browser.$('~open menu');
await menuBtn.click();

// CORRECT
await homeScreen.openMenu();
await sideMenu.waitForElement('targetItem');
await sideMenu.tapTarget();
```

### Step 7: Helper Method Resolution (HARD STOP)

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
- [ ] No `browser.pause()` in spec — use `waitForElement()` or screen methods
- [ ] Tags in test description string with `@` prefix: `it('test name @smoke @P0', ...)`
- [ ] VERIFY steps produce `expect()` assertions
- [ ] CAPTURE steps produce variable assignments via screen getter methods
- [ ] DATASETS produce parameterized `for...of` loops
- [ ] Multi-scenario: each test handles its own navigation state (no reliance on test order)
- [ ] Empty-field tests explicitly clear fields before assertions (single-session state leaks)
- [ ] Entry screen uses `waitForElement()` at the start — not `pause()`
- [ ] If helpers exist, spec imports helpers class aliased to base name
- [ ] Every async call uses `await`
- [ ] Import paths are correct relative to file location
- [ ] Test count matches scenario count from analyst report
- [ ] Debug screenshots inserted after every screen transition (not just SCREENSHOT keywords)
