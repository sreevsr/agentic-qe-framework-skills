# Skill: Review Locator Quality (Dimension 1)

## Purpose
Audit locator JSON files and page objects for selector quality. Weight: **High**.

## Scope
Web and hybrid scenarios only. Skip for API-only scenarios.

## Checklist

- [ ] Every element has a primary + at least 2 fallbacks in JSON
- [ ] Primary locators prefer `data-testid` or `id` over CSS classes
- [ ] No fragile selectors: no `nth-child`, no deep CSS paths (3+ levels), no auto-generated IDs
- [ ] No hardcoded selectors in page objects or test files — all via LocatorLoader
- [ ] Locator JSON files exist for every page referenced in specs
- [ ] Element keys in JSON use descriptive camelCase names (not `button1`, `div2`)

## What to Check

### Locator JSON Files (`output/locators/*.locators.json`)

For each file:
1. Parse the JSON — verify it's valid
2. For each element entry:
   - `primary` exists and is non-empty
   - `fallbacks` array exists with at least 2 entries
   - No `nth-child()` in any selector
   - No selectors with 3+ nested levels (e.g., `div > div > div > span`)
   - No IDs that look auto-generated (e.g., `#react-select-12345-input`)

### Page Objects (`output/pages/*.ts`)

For each page object (excluding `*.helpers.ts`):
1. Constructor initializes `LocatorLoader`
2. No `this.page.locator('...')` with hardcoded selectors
3. No `page.click('selector')` or `page.fill('selector', value)` with raw strings
4. All element access goes through `this.loc.click()`, `this.loc.fill()`, `this.loc.getText()`, etc.

### Test Specs (`output/tests/**/*.spec.ts`)

1. No `page.locator('...')` with hardcoded selectors
2. No `page.click('selector')` with raw selector strings
3. All interactions go through page object methods

## Scoring

| Score | Criteria |
|-------|----------|
| 5 | All elements have primary + 2 fallbacks, no raw selectors anywhere, all data-testid preferred |
| 4 | All elements have primary + fallbacks, minor: 1-2 elements use CSS class as primary |
| 3 | Most elements have fallbacks, 1-2 raw selectors found in page objects |
| 2 | Several elements missing fallbacks, multiple raw selectors in code |
| 1 | Most elements lack fallbacks, widespread hardcoded selectors |

## Output
Return: score (1-5), list of issues with file paths and line numbers, key finding summary.
