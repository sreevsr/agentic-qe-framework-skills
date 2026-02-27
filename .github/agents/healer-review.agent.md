---
name: QE Healer (Review Fixes)
description: Fix code quality issues identified by the Reviewer agent based on the review scorecard.
tools: ['editFiles', 'runCommand', 'search']
model: ['Claude Sonnet 4.5', 'GPT-4o']
---

# Platform Compatibility

- Use Node.js path.join() for all file paths
- DO NOT use git commands or check repository state
- Self-contained execution mode

# Rules

- Do NOT use Playwright MCP browser tools or create subagents
- Use ONLY the terminal to run commands and edit files
- Work in the output/ directory
- Never weaken, remove, or modify VERIFY assertions or expected values during review fixes
- Review fixes are code quality improvements only — they must not change test behavior

# Instructions

Read [agents/03-healer.md](agents/03-healer.md) for base instructions, then apply CODE_REVIEW_FIXES mode.

The user will specify the scenario name and type (web or api) when invoking this agent.

## Phase 1: Read Review Report

1. Read the review scorecard:
   - With folder: `output/{folder}/review-scorecard-{scenario}.md`
   - Without folder: `output/review-scorecard-{scenario}.md`
2. Extract all issues with scores 0-3
3. List specific files, line numbers, and issue descriptions
4. Ignore items scored 4-5

## Phase 2: Fix Strategy by Dimension

**Dimension 1 (Code Hygiene):** Remove unused imports, dead code, console.log statements
**Dimension 2 (Import Integrity):** Fix import paths to resolve correctly
**Dimension 3 (Step Completeness):** Add missing // STEP N: comments
**Dimension 4 (Locator Quality):** 

This is the CRITICAL dimension. Framework principle: **All selectors in JSON, never in code.**

**Step A: Identify the raw selector**
```typescript
// Example from CartPage.ts:90
const removeButtons = this.page.locator('button:has-text("Remove")');
```

**Step B: Add to locators JSON file**

File: `output/locators/cart-page.locators.json` (or inventory-page.locators.json, etc.)
```json
{
  "existingKey1": { ... },
  "existingKey2": { ... },
  "removeButtons": {
    "primary": "button:has-text('Remove')",
    "fallbacks": [
      "[data-test*='remove']",
      ".btn_secondary",
      "button.cart_button"
    ],
    "role": "button",
    "description": "Remove item from cart buttons"
  }
}
```

**IMPORTANT JSON RULES:**
- Add comma after previous entry
- No trailing comma after last entry
- Use single quotes inside double-quoted strings
- Validate JSON syntax

**Step C: Update page object method**
```typescript
// BEFORE (raw selector - WRONG)
async getCartItemCount(): Promise<number> {
  const removeButtons = this.page.locator('button:has-text("Remove")');
  const count = await removeButtons.count();
  return count;
}

// AFTER (using LocatorLoader - CORRECT)
async getCartItemCount(): Promise<number> {
  const removeButtons = await this.getElement('removeButtons');
  const count = await removeButtons.count();
  return count;
}
```

**Common LocatorLoader Patterns:**
```typescript
// Pattern 1: Click element
// BEFORE: await this.page.locator('button').click();
// AFTER: await this.click('buttonKey');

// Pattern 2: Get text
// BEFORE: await this.page.locator('div').textContent();
// AFTER: await this.getText('divKey');

// Pattern 3: Check visibility
// BEFORE: await this.page.locator('h1').isVisible();
// AFTER: await this.isVisible('h1Key');

// Pattern 4: Get element for chaining
// BEFORE: const el = this.page.locator('div');
// AFTER: const el = await this.getElement('divKey');

// Pattern 5: Count elements
// BEFORE: await this.page.locator('button').count();
// AFTER: 
const buttons = await this.getElement('buttonsKey');
const count = await buttons.count();
```

**Regex Selectors in JSON:**
```json
{
  "headingWithRegex": {
    "primary": "text=/Your Cart/i",
    "fallbacks": ["h1:has-text('Your Cart')", ".title"]
  }
}
```

**Has-text Selectors in JSON:**
```json
{
  "removeButton": {
    "primary": "button:has-text('Remove')",
    "fallbacks": ["[data-test='remove']"]
  }
}
```

### DIMENSION 5 FIXES: Wait Strategy

**Bad Wait:**
```typescript
await page.waitForTimeout(3000);
```

**Good Wait:**
```typescript
await page.waitForLoadState('domcontentloaded');
// or
await page.waitForSelector('.element');
// or rely on auto-waiting (built into Playwright)
```

### DIMENSION 6 FIXES: Test Architecture

**Missing Tags:**
```typescript
// BEFORE
test('add item to cart', async ({ page }) => {

// AFTER
test('add item to cart', { tag: ['@regression', '@cart', '@P1'] }, async ({ page }) => {
```

**Copy-pasted tests → parameterized loop:**
```typescript
// BEFORE (copy-pasted)
test('add item A', async ({ page }) => { ... });
test('add item B', async ({ page }) => { ... });

// AFTER (parameterized)
for (const item of testData.items) {
  test(`add ${item.name}`, { tag: ['@regression'] }, async ({ page }) => { ... });
}
```


### DIMENSION 7 FIXES: Security

**Hardcoded Credentials:**
```typescript
// BEFORE
await page.fill('#username', 'admin');

// AFTER
await page.fill('#username', process.env.TEST_USERNAME || '');
```

Ensure `.env.example` exists with template.

### DIMENSION 8 FIXES: Configuration

**Wrong Browser:**
```typescript
// BEFORE
use: { channel: 'chromium' }

// AFTER  
use: { channel: 'chrome' }
```

## Phase 3: APPLY FIXES ───

For each issue in the review scorecard:

1. Determine which dimension (1-8)
2. Apply the appropriate fix pattern from Phase 3
3. If Dimension 4 (Locator Quality):
   a. Create a descriptive key name (e.g., removeButtons, cartHeading, loginButton)
   b. Add to correct locators JSON file with primary + 2-3 fallbacks
   c. Update page object method to use LocatorLoader
   d. Validate JSON syntax
4. Save the file

**Fix Order (recommended):**
1. Dimension 1 (Code Hygiene) - simplest
2. Dimension 7 (Security) - simple  
3. Dimension 8 (Configuration) - simple
4. Dimension 4 (Locator Quality) - most complex, do last
5. Dimension 5 (Wait Strategy)
6. Other dimensions as needed

## Phase 4: VALIDATION ───

After applying ALL fixes:

1. Verify TypeScript compiles:
```bash
   cd output
   npx tsc --noEmit
```
   If errors: fix them before proceeding

2. Verify JSON files are valid:
```bash
   # For each modified JSON file
   node -e "JSON.parse(require('fs').readFileSync('locators/cart-page.locators.json', 'utf8'))"
```

3. Run the test suite:
```bash
   # With folder:
   npx playwright test tests/{type}/{folder}/{scenario}.spec.ts --project=chrome --reporter=list
   # Without folder:
   npx playwright test tests/{type}/{scenario}.spec.ts --project=chrome --reporter=list
```
   
   All tests MUST still pass. If any fail:
   - Check the error message
   - Verify the locator key exists in JSON
   - Verify getElement() is awaited
   - Adjust and re-test

4. If tests fail after 2 fix attempts:
   - Document the issue
   - Mark with // TODO: Fix this locator
   - Move to next issue


## Phase 5: REPORT ───

Save the healer review fixes report:
- With folder: `output/{folder}/healer-review-fixes-report-{scenario}.md`
- Without folder: `output/healer-review-fixes-report-{scenario}.md`

See prompt for format.