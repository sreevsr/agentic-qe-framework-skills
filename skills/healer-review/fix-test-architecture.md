# Skill: Fix Test Architecture (Dimension 3 Fixes)

## Purpose
Fix structural issues: missing tags, wrong imports (base vs helpers), non-parameterized datasets, missing assertions.

## Pre-Edit Gate
Before editing ANY file, check its path:
| File Pattern | Edit Allowed? | Alternative |
|-------------|--------------|-------------|
| `*.helpers.ts` | **NO** | Document in report but do NOT fix |
| `test-data/shared/*` | **NO** | Create scenario override instead |
| `output/core/*` | **NO** | Document for team review |
| Everything else | **YES** | Proceed with fix |

## Fixes

### Add Missing Tags

```typescript
// BEFORE — no tags
test('add item to cart', async ({ page }) => {

// AFTER — tags added
test('add item to cart', { tag: ['@regression', '@cart', '@P1'] }, async ({ page }) => {
```

Tags come from the scenario's `**Tags:**` line. Always prefix with `@`.

### Fix Helper Imports

If `*.helpers.ts` exists for a page but the spec imports the base class:

```typescript
// BEFORE (wrong — helpers exist but not imported)
import { CartPage } from '../pages/CartPage';

// AFTER (correct — import helpers aliased to base name)
import { CartPageWithHelpers as CartPage } from '../pages/CartPage.helpers';
```

### Convert Copy-Pasted Tests to Parameterized Loops

```typescript
// BEFORE (copy-pasted — WRONG)
test('add item A to cart', async ({ page }) => { /* ... */ });
test('add item B to cart', async ({ page }) => { /* ... */ });
test('add item C to cart', async ({ page }) => { /* ... */ });

// AFTER (parameterized — CORRECT)
for (const item of testData.items) {
  test(`add ${item.name} to cart`, { tag: ['@regression'] }, async ({ page }) => {
    // Use item.name, item.price, etc.
  });
}
```

### Fix Multi-Scenario Structure

```typescript
// BEFORE — flat tests without describe/beforeEach
test('scenario 1 - login', async ({ page }) => { /* includes login steps */ });
test('scenario 2 - checkout', async ({ page }) => { /* includes login steps again */ });

// AFTER — describe with beforeEach for common setup
test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup (login)
  });

  test('scenario 1', async ({ page }) => { /* scenario-specific steps */ });
  test('scenario 2', async ({ page }) => { /* scenario-specific steps */ });
});
```

### Fix SHARED_DATA Import

```typescript
// BEFORE (wrong — direct JSON import when SHARED_DATA is used)
import testData from '../../test-data/web/scenario.json';

// AFTER (correct — uses test-data-loader for merging)
import { loadTestData } from '../../core/test-data-loader';
const testData = loadTestData('web/scenario', ['users', 'products']);
```

## Validation
After fixes, run tests to verify structural changes don't break behavior.

## Rules
- Never weaken or remove VERIFY assertions
- Review fixes are code quality improvements — must NOT change test behavior
- Do not modify `*.helpers.ts` files
