# Skill: Fix Locator Quality (Dimension 1 Fixes)

## Purpose
Fix raw selectors found by the Reviewer. Migrate hardcoded selectors into locator JSON files and update page objects to use LocatorLoader.

## References
- `skills/_shared/guardrails.md` — helper file protection (do NOT fix helpers)
- `skills/healer/fix-guardrails.md` — pre-edit gate

## Pre-Check
Before editing ANY file, run the pre-edit gate. If the raw selector is in a `*.helpers.ts` file, **STOP** — document it but do NOT fix it.

## Three-Step Migration Pattern

For each raw selector found by the Reviewer:

### Step A: Identify the Raw Selector

```typescript
// Example from CartPage.ts:90
const removeButtons = this.page.locator('button:has-text("Remove")');
```

### Step B: Add to Locators JSON

File: `output/locators/{page-name}.locators.json`

```json
{
  "existingKey1": { "..." : "..." },
  "removeButtons": {
    "primary": "button:has-text('Remove')",
    "fallbacks": [
      "[data-test*='remove']",
      ".btn_secondary",
      "button.cart_button"
    ],
    "type": "button",
    "description": "Remove item from cart buttons"
  }
}
```

**JSON rules:**
- Add comma after previous entry
- No trailing comma after last entry
- Use single quotes inside double-quoted strings
- Validate JSON syntax after editing

### Step C: Update Page Object Method

```typescript
// BEFORE (raw selector — WRONG)
async getCartItemCount(): Promise<number> {
  const removeButtons = this.page.locator('button:has-text("Remove")');
  const count = await removeButtons.count();
  return count;
}

// AFTER (using LocatorLoader — CORRECT)
async getCartItemCount(): Promise<number> {
  const removeButtons = await this.getElement('removeButtons');
  const count = await removeButtons.count();
  return count;
}
```

## Common LocatorLoader Replacement Patterns

| Before (raw selector) | After (LocatorLoader) |
|----------------------|----------------------|
| `this.page.locator('btn').click()` | `await this.click('btnKey')` |
| `this.page.locator('div').textContent()` | `await this.getText('divKey')` |
| `this.page.locator('h1').isVisible()` | `await this.isVisible('h1Key')` |
| `const el = this.page.locator('div')` | `const el = await this.getElement('divKey')` |
| `this.page.locator('btn').count()` | `const el = await this.getElement('btnKey'); await el.count()` |

## Regex and Has-Text Selectors in JSON

```json
{
  "headingWithRegex": {
    "primary": "text=/Your Cart/i",
    "fallbacks": ["h1:has-text('Your Cart')", ".title"]
  },
  "removeButton": {
    "primary": "button:has-text('Remove')",
    "fallbacks": ["[data-test='remove']", ".remove-btn"]
  }
}
```

## Validation

After all fixes:
1. Validate JSON syntax: `node -e "JSON.parse(require('fs').readFileSync('locators/{file}.json', 'utf8'))"`
2. Run TypeScript check: `npx tsc --noEmit`
3. Run tests to verify they still pass

## Rules
- Never weaken or remove assertions during locator fixes
- Never modify `*.helpers.ts` files — document raw selectors found in helpers
- Create descriptive key names (e.g., `removeButtons`, `cartHeading`, not `btn1`, `el2`)
- Each new JSON entry needs primary + at least 2 fallbacks
