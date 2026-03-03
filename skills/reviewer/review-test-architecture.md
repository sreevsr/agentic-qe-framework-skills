# Skill: Review Test Architecture (Dimension 3)

## Purpose
Audit test structure patterns: Page Object Model, parameterization, tags, helpers, shared data. Weight: **Medium**.

## Scope
All scenario types.

## Checklist

- [ ] Page Object Model properly implemented — every page has a class
- [ ] Test files import page objects — no direct Playwright API in tests
- [ ] Test data externalized to JSON — no hardcoded values in specs
- [ ] Multi-scenario files use `test.describe()` with `test.beforeEach()` for common setup
- [ ] DATASETS produce parameterized `for...of` loops, not duplicated test code
- [ ] VERIFY steps produce `expect()` assertions inline, not just at the end
- [ ] Tags formatted correctly: `{ tag: ['@tagName'] }` on every test
- [ ] If `test-data/shared/` exists: scenario JSONs do not duplicate values already in shared files
- [ ] If `SHARED_DATA` keyword is used: spec imports `loadTestData` from `core/test-data-loader` (not direct JSON import)
- [ ] If `*.helpers.ts` exists for a page: spec imports the helpers class (`{PageName}WithHelpers as {PageName}`), not the base class
- [ ] If `USE_HELPER` keyword is used in the scenario: verify the referenced method exists in the corresponding `*.helpers.ts` file and the spec calls it

## What to Check

### Page Object Model
1. Every page referenced in tests has a corresponding `output/pages/{PageName}Page.ts`
2. Tests instantiate page objects (`new LoginPage(page)`) — never use `page.click()` with selectors directly
3. Business logic lives in page objects, tests focus on scenario flow

### Tags
1. Every `test()` call has a tag object: `{ tag: ['@tagName'] }`
2. Tags prefixed with `@`
3. Tags match scenario's `**Tags:**` line

### Data Patterns
1. DATASETS → `for...of` loop (not copy-pasted test blocks)
2. Hardcoded test values in specs → should be in JSON files
3. Shared data not duplicated in scenario JSON

### Helper Integration
1. If `output/pages/CartPage.helpers.ts` exists AND the spec uses CartPage:
   - Spec SHOULD import `CartPageWithHelpers as CartPage` from `CartPage.helpers`
   - Spec should NOT import `CartPage` from `CartPage`
   - Flag if helpers exist but spec imports the base class

## Scoring

| Score | Criteria |
|-------|----------|
| 5 | Full POM, all tags, proper parameterization, helpers correctly imported, shared data not duplicated |
| 4 | Full POM, most tags, minor: 1 test missing tags or 1 helper import using base class |
| 3 | POM used but some direct API calls in tests, or multiple missing tags |
| 2 | Inconsistent POM, hardcoded test data, no parameterization |
| 1 | No POM, tests use raw selectors, no tags |

## Output
Return: score (1-5), list of issues with file paths and line numbers, key finding summary.
