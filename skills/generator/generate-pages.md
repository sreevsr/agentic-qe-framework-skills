# Skill: Generate Page Objects

## Purpose
Create TypeScript Page Object classes for each page discovered in the analyst report. Every page object uses LocatorLoader — no raw selectors in code.

## References
- `skills/_shared/output-structure.md` — file naming conventions
- `skills/_shared/guardrails.md` — helper file protection (do not create *.helpers.ts)

## Input
- Locator JSON files (from `generate-locators` skill)
- Analyst report — page map with element interactions and business actions
- Scout report — check `output/scout-reports/{folder}/{scenario}-page-inventory-latest.md` first.
  If the file exists, it MUST be used: Scout's METHOD and INTERACTION fields are authoritative for any
  component it identifies. If the file does not exist, proceed with analyst report alone.

## Process

### Step 1: Create Page Object per Page

For each page, create `output/pages/{PageName}Page.ts`:

```typescript
import { Page } from '@playwright/test';
import { LocatorLoader } from '../core/locator-loader';

export class ExamplePage {
  private loc: LocatorLoader;

  constructor(private page: Page) {
    this.loc = new LocatorLoader(page, 'example-page');
  }

  /** Navigate to the page */
  async navigate(): Promise<void> {
    await this.page.goto('/path');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Fill username field */
  async fillUsername(value: string): Promise<void> {
    await this.loc.fill('usernameInput', value);
  }

  /** Click the login button */
  async clickLogin(): Promise<void> {
    await this.loc.click('loginButton');
  }
}
```

### Step 2: Apply Scout Interaction Patterns (if Scout report exists)

Before writing any method body, check the Scout report for each element. Scout identifies three tiers:

| Scout METHOD | What it means | Page object method body |
|-------------|---------------|------------------------|
| `fill` | Standard text input | `await this.loc.fill('key', value)` |
| `click` | Standard button/link | `await this.loc.click('key')` |
| `selectOption` | Native `<select>` | `await this.loc.selectOption('key', value)` |
| `fluentComboBoxSelect` | Fluent UI v8/v9 ComboBox — multi-step | See interaction pattern from Scout |
| `fluentDropdownSelect` | Fluent UI Dropdown — multi-step | See interaction pattern from Scout |
| `fluentContextMenuSelect` | Fluent UI ContextualMenu | See interaction pattern from Scout |
| `fluentGridClick` | Fluent UI DetailsList / DataGrid | See interaction pattern from Scout |
| `waitForDialog` | Modal/Dialog wait pattern | `await this.page.waitForSelector('[role="dialog"]')` |
| `waitForPanel` | Panel/Drawer wait pattern | See interaction pattern from Scout |
| `muiSelectOption` | MUI Select — multi-step | See interaction pattern from Scout |
| `muiAutocompleteSelect` | MUI Autocomplete — fill + wait + click | See interaction pattern from Scout |
| `antSelectOption` | Ant Design Select — multi-step | See interaction pattern from Scout |
| `primeDropdownSelect` | PrimeNG Dropdown — multi-step | See interaction pattern from Scout |
| `kendoDropdownSelect` | Kendo ComboBox/Dropdown — multi-step | See interaction pattern from Scout |

For any METHOD that is multi-step, implement the page object method body following the exact INTERACTION sequence reported by Scout. Do not simplify to a plain `this.loc.click()`. If Scout reports a `HIT-AREA MISMATCH` warning, add `{ force: true }` to the click call.

### Step 3: Method Design Rules

- **Method names reflect business actions:** `login()`, `addToCart()`, `checkout()` — not `clickButton1()`
- **Every interaction uses `this.loc`:** `this.loc.click('key')`, `this.loc.fill('key', value)`, `this.loc.getText('key')`
- **No raw selectors:** Never use `this.page.locator('selector')` directly in page objects
- **JSDoc on all public methods:** Include a brief description of what the method does
- **CAPTURE targets get getter methods:** e.g., `getSubtotal(): Promise<string>`, `getCartBadgeCount(): Promise<number>`

### Step 4: LocatorLoader API

Common patterns using the LocatorLoader:

```typescript
// Click an element
await this.loc.click('elementKey');

// Fill a text input
await this.loc.fill('elementKey', 'value');

// Get text content
const text = await this.loc.getText('elementKey');

// Check visibility
const visible = await this.loc.isVisible('elementKey');

// Get the raw Playwright Locator for advanced operations
const element = await this.loc.getElement('elementKey');
const count = await element.count();
```

### Step 5: Navigation Methods

Every page object should have a `navigate()` method that:
1. Calls `this.page.goto('/path')`
2. Follows with `await this.page.waitForLoadState('domcontentloaded')`

Never use `waitForTimeout()` for navigation waits.

## Prohibited Patterns
- No `page.waitForTimeout()` or `setTimeout`
- No raw selectors (`this.page.locator('.class')`)
- No `any` types where avoidable
- No mixed JS/TS — pure TypeScript
- Do NOT create `*.helpers.ts` files (team-owned)

## Quality Checks
- [ ] Every page object uses `LocatorLoader` — no raw selectors
- [ ] Method names reflect business actions
- [ ] JSDoc on all public methods
- [ ] CAPTURE targets have getter methods
- [ ] Every async method uses `await`
- [ ] Constructor takes `Page` and initializes `LocatorLoader` with correct locator file name
- [ ] Import paths are correct relative to file location
