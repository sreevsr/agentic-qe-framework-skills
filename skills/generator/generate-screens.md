# Skill: Generate Screen Objects

## Purpose
Create TypeScript Screen Object classes for each screen discovered in the analyst report. Every screen object uses MobileLocatorLoader — no raw selectors in code. Mirrors the web `generate-pages` skill pattern.

## Paths
- Output: `output/screens/{ScreenName}Screen.ts` (PascalCase)
- Helpers: `output/screens/{ScreenName}Screen.helpers.ts` — team-owned, read-only. NEVER create or modify.

## Rules
- **Helper File Protection:** Files matching `output/screens/*.helpers.ts` are team-owned. The pipeline NEVER creates, modifies, or deletes them. Read helpers for discovery only.
- **No raw selectors:** Never use `driver.$('selector')` directly in Screen Objects. All element access via `this.loc.get('key')`.
- **No `driver.pause()`:** Use `this.waitForElement()` for all timing — same rule as `waitForTimeout` on web.

## Process

### Step 1: Create Screen Object per Screen

For each screen in the analyst report, create `output/screens/{ScreenName}Screen.ts`:

```typescript
import { browser } from '@wdio/globals';
import { BaseScreen } from '../core/base-screen';

export class LoginScreen extends BaseScreen {
  constructor(driver: WebdriverIO.Browser) {
    super(driver, 'login-screen');   // matches login-screen.locators.json
  }

  /** Navigate to this screen by launching the app */
  async launch(): Promise<void> {
    // For the entry screen — app is launched by the test setup
    await this.waitForElement('usernameField');
  }

  /** Type username into the username field */
  async typeUsername(value: string): Promise<void> {
    await this.typeText('usernameField', value);
  }

  /** Type password into the password field */
  async typePassword(value: string): Promise<void> {
    await this.typeText('passwordField', value);
  }

  /** Tap the login button */
  async tapLogin(): Promise<void> {
    await this.tap('loginButton');
  }

  /** Get the error message text (for VERIFY steps) */
  async getErrorMessage(): Promise<string> {
    return this.getText('errorMessage');
  }

  /** Check if login button is visible (for VERIFY steps) */
  async isLoginButtonVisible(): Promise<boolean> {
    return this.isVisible('loginButton');
  }
}
```

### Step 2: Constructor Locator File Name

The second argument to `super()` is the locator file name (without `.locators.json`):
- `LoginScreen` → `super(driver, 'login-screen')`
- `ProductDetailScreen` → `super(driver, 'product-detail-screen')`
- `CheckoutStepOneScreen` → `super(driver, 'checkout-step-one-screen')`

### Step 3: Method Design Rules

- **Method names reflect business actions:** `typeUsername()`, `tapLogin()`, `addToCart()` — not `clickButton1()`
- **Every interaction uses `this.loc`** via the inherited BaseScreen methods: `this.tap()`, `this.typeText()`, `this.getText()`, `this.isVisible()`
- **JSDoc on all public methods**
- **CAPTURE targets get getter methods:** `getProductPrice(): Promise<string>`, `getCartCount(): Promise<string>`
- **VERIFY targets get boolean methods:** `isErrorVisible(): Promise<boolean>`, `isHomeScreenLoaded(): Promise<boolean>`
- **Screens that require scrolling:** add `scrollTo{ElementName}()` helper methods that call `this.scrollToElement('key')`

### Step 4: Screen Transitions

Screens that navigate to another screen return the destination screen type:

```typescript
/** Tap the login button and transition to Home screen */
async tapLoginAndProceed(): Promise<void> {
  await this.tap('loginButton');
  await this.waitForElement('homeScreenTitle');   // wait for destination to appear
}
```

Do NOT return a new Screen instance from methods — tests instantiate screens directly.

### Step 5: Screens with Scroll

If the analyst report notes that elements require scrolling to be visible:

```typescript
/** Scroll down and tap the submit button */
async scrollToAndTapSubmit(): Promise<void> {
  await this.scrollToElement('submitButton');
  await this.tap('submitButton');
}
```

## PROHIBITED ACTIONS — Helper Boundary

Screen Objects MUST NOT contain:
- Business logic (price calculations, data comparisons)
- Bulk operations (remove all items, clear form)
- Methods matching `USE_HELPER: ScreenName.methodName` references in the scenario

These belong in `*.helpers.ts` files (team-owned). The same HARD STOP rules apply as for web Page Objects:

**If a scenario uses USE_HELPER and no helpers file exists:**
1. Do NOT create the method in the base screen object
2. The spec will contain a warning comment
3. The test will fail or be marked `test.fixme()` — this is correct

## Quality Checks
- [ ] Every screen object extends `BaseScreen`
- [ ] Constructor calls `super(driver, 'screen-name')` with correct kebab-case name
- [ ] All interactions use inherited methods: `this.tap()`, `this.typeText()`, `this.getText()`, etc.
- [ ] No `driver.$('selector')` or `this.driver.$('selector')` in methods
- [ ] No `driver.pause()` — use `this.waitForElement()` instead
- [ ] Method names are business-intent based, not technical
- [ ] JSDoc on all public methods
- [ ] CAPTURE targets have getter methods
- [ ] VERIFY targets have boolean `is*()` methods
- [ ] No method matches a `USE_HELPER` reference in the scenario
