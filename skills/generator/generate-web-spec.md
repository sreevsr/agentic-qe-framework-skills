# Skill: Generate Web Spec

## Purpose
Generate Playwright TypeScript test spec files for `type=web` scenarios. Produces one `.spec.ts` file per scenario with Page Object imports, assertions, and all keyword implementations.

## Paths
- Output (with folder): `output/tests/web/{folder}/{scenario}.spec.ts`
- Output (without folder): `output/tests/web/{scenario}.spec.ts`
- Test data (scenario): `output/test-data/{type}/{scenario}.json`
- Test data (shared): `output/test-data/shared/{name}.json`

## Rules
- **Helper File Protection:** If a page has a `*.helpers.ts` file, import the helpers class aliased to the base name. NEVER create or modify helper files.
- **Assertion Protection:** VERIFY steps produce `expect()` assertions that match the scenario's explicit expected values. Never weaken or remove them.

## Keyword Patterns
Apply keyword patterns from `skills/_shared/keyword-reference.md` (loaded separately by the orchestrator before this skill runs).

## Input
- Analyst report — step results, page map, captured values
- Page objects (from `generate-pages` skill)
- Helper registry (from `discover-helpers` skill)
- Original scenario `.md` file — for tags, datasets, keywords
- Test data files (from `setup-test-data` skill)

## Output Path
- With folder: `output/tests/web/{folder}/{scenario}.spec.ts`
- Without folder: `output/tests/web/{scenario}.spec.ts`

## Process

### Step 1: Read Scenario Structure

Determine the scenario shape:
- **Single scenario:** One `test()` block
- **Multi-scenario (has `---` separators):** `test.describe()` with multiple `test()` blocks
- **Has Common Setup:** Convert to `test.beforeEach()`
- **Has DATASETS:** Create `for...of` loop with parameterized tests

### Step 2: Generate Imports

```typescript
import { test, expect } from '@playwright/test';
```

For each page used in the scenario, add import:
```typescript
// If helpers exist for this page (from discover-helpers registry):
import { CartPageWithHelpers as CartPage } from '../pages/CartPage.helpers';

// If no helpers:
import { CartPage } from '../pages/CartPage';
```

For SHARED_DATA keyword:
```typescript
import { loadTestData } from '../../core/test-data-loader';
const testData = loadTestData('web/{scenario}', ['users', 'products']);
```

For SAVE keyword:
```typescript
import { saveState } from '../../core/shared-state';
```

### Step 3: Generate Test Body

**Single scenario:**
```typescript
test('scenario name', { tag: ['@smoke', '@P0'] }, async ({ page }) => {
  const loginPage = new LoginPage(page);
  // Steps...
});
```

**Multi-scenario:**
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Common Setup steps
  });

  test('Scenario 1', { tag: ['@smoke'] }, async ({ page }) => {
    // Scenario 1 steps
  });

  test('Scenario 2', { tag: ['@regression'] }, async ({ page }) => {
    // Scenario 2 steps
  });
});
```

**DATASETS:**
```typescript
import testData from '../../test-data/{dataset-name}.json';

for (const data of testData) {
  test(`Test: ${data.description}`, { tag: ['@regression'] }, async ({ page }) => {
    // Use data.field1, data.field2, etc.
  });
}
```

### Step 4: Implement Keywords

For each scenario step, apply the corresponding keyword pattern from `keyword-reference.md`:

- Plain steps → page object method calls
- **VERIFY** → `expect()` assertions inline where they appear
- **CAPTURE** → variable assignment via getter methods
- **CALCULATE** → arithmetic on captured values
- **SCREENSHOT** → `page.screenshot()` + `test.info().attach()`
- **REPORT** → `console.log()` + `test.info().annotations.push()`
- **SAVE** → `saveState()` call
- **USE_HELPER** → call helper method from registry

### Step 5: Helper Method Resolution (HARD STOP)

For `USE_HELPER: PageName.methodName → {{variable}}`:
1. Check the helper registry (from `discover-helpers` skill) for the method
2. **If found:** `const variable = await pageName.methodName();`
3. **If NOT found — HARD STOP. The pipeline MUST NOT work around missing helpers.**

**When the helpers file does not exist or the method is not found:**

Do ALL of the following:
1. Emit a warning comment at the USE_HELPER step location:
```typescript
// WARNING: USE_HELPER requested PageName.methodName but PageName.helpers.ts not found
// ACTION REQUIRED: Team must create output/pages/PageName.helpers.ts with methodName()
```
2. Do NOT call the method — it does not exist.
3. Do NOT add the method to the base page object. Base page objects are pipeline-owned and will be overwritten on regeneration. Custom business logic belongs exclusively in `*.helpers.ts` files.
4. Do NOT implement equivalent inline logic in the spec as a workaround.
5. The test WILL fail or must be wrapped in `test.fixme('HELPER ISSUE: USE_HELPER requested PageName.methodName but helpers file not found')`. This is the CORRECT outcome — it signals the team to create the helpers file.

**Why this matters:** If the pipeline creates the missing method (in the page object or inline in the spec), it silently masks the missing team-owned file. The test will "pass" but the implementation is wrong — it will be overwritten on the next regeneration, and the team will never know they need to create the helpers file.

For implicit trigger matching (step text matches `@scenario-triggers`):
1. Check if any helper method's triggers match the step's natural language
2. If match found: call the helper method
3. If no match: generate inline code using base page methods only (no custom business logic)

## Prohibited Patterns
- No direct Playwright API in tests (`page.click('selector')`) — always use page objects
- No `waitForTimeout()` or `setTimeout`
- No hardcoded selectors — all via page objects which use LocatorLoader
- No hardcoded credentials — use `process.env.VARIABLE`
- No raw JSON imports when SHARED_DATA is used — use `loadTestData()`

## Quality Checks
- [ ] Every test uses page objects — no direct `page.click()` with selectors
- [ ] Tags formatted correctly: `{ tag: ['@tagName'] }`
- [ ] VERIFY steps produce `expect()` assertions
- [ ] CAPTURE steps produce variable assignments
- [ ] DATASETS produce parameterized `for...of` loops
- [ ] Multi-scenario uses `test.describe()` with `test.beforeEach()`
- [ ] If helpers exist, spec imports helpers class (not base class)
- [ ] If USE_HELPER references a missing helpers file, spec contains warning comment and `test.fixme()` — NOT inline logic
- [ ] Every async call uses `await`
- [ ] Import paths are correct relative to file location
- [ ] Test count matches scenario count from analyst report
