# Skill: Review Maintainability (Dimension 6)

## Purpose
Audit framework extensibility and separation of concerns. Weight: **Medium**.

## Scope
All scenario types.

## Checklist

- [ ] Adding a new page requires only: new locator JSON + new page object + new spec
- [ ] Changing a selector requires editing only the locator JSON file
- [ ] Test data changes require no code changes
- [ ] Framework core (`locator-loader`, `base-page`, `test-data-loader`) is generic and reusable
- [ ] Shared reference data (users, products) lives in `test-data/shared/`, not duplicated per scenario
- [ ] If team-maintained `*.helpers.ts` files exist: they follow the convention (`{PageName}WithHelpers extends {PageName}`, JSDoc with `@scenario-triggers`, `@helpers` tag on class)
- [ ] Custom helper logic is in `*.helpers.ts` files, not mixed into Generator-owned page objects

## What to Check

### Locator Isolation
1. Selectors live ONLY in `output/locators/*.locators.json`
2. Page objects reference elements by key name, not by selector string
3. Changing a selector in JSON requires zero code changes

### Test Data Isolation
1. Test data lives in `output/test-data/` JSON files
2. Specs import data from JSON, not hardcoded inline
3. Shared data in `test-data/shared/` not duplicated in scenario files

### Framework Core
1. `output/core/` files are generic — not coupled to specific pages or scenarios
2. `LocatorLoader` works with any locator JSON file
3. `BasePage` provides reusable methods for any page

### Helper Convention (if helpers exist)
For each `*.helpers.ts` file found:
1. Class name follows `{PageName}WithHelpers` pattern
2. Class extends the corresponding base page
3. Public methods have JSDoc with `@scenario-triggers`
4. Class has `@helpers` tag in its JSDoc
5. No generated page objects contain manually-added methods (those should be in helpers)

### Single Project Structure
1. All scenarios share one `output/` project
2. One `package.json`, one `playwright.config.ts`
3. Each scenario adds files to the shared structure, not a separate project

## Scoring

| Score | Criteria |
|-------|----------|
| 5 | Perfect separation: locators in JSON, data in JSON, helpers follow convention, core is generic |
| 4 | Good separation with minor issues: 1-2 hardcoded values in specs, or helper missing JSDoc |
| 3 | Mostly separated but some coupling: selectors in 1-2 page objects, some data duplication |
| 2 | Significant coupling: widespread inline data, selectors in code |
| 1 | No separation: monolithic tests with hardcoded everything |

## Output
Return: score (1-5), list of issues with file paths and line numbers, key finding summary.
