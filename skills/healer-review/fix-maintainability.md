# Skill: Fix Maintainability (Dimension 6 Fixes)

## Purpose
Fix separation-of-concerns issues: inline data, duplicated shared data, selector leaks.

## Fixes

### Extract Hardcoded Test Data to JSON

```typescript
// BEFORE (hardcoded in spec)
const username = 'standard_user';
const password = 'secret_sauce';

// AFTER (from test data JSON)
import testData from '../../test-data/web/scenario.json';
// or with shared data:
import { loadTestData } from '../../core/test-data-loader';
const testData = loadTestData('web/scenario', ['users']);
```

1. Create or update the scenario JSON file with the extracted values
2. Update the spec to import from JSON

### Remove Duplicated Shared Data

If scenario-specific JSON duplicates values from `test-data/shared/`:

1. Remove the duplicated keys from the scenario JSON
2. Add the shared file name to the `loadTestData` call
3. Verify the spec uses `loadTestData` (not direct import)

### Fix Selector Leaks in Page Objects

If a page object contains a hardcoded selector that should be in JSON:

1. Add the selector to the locator JSON (see `fix-locator-quality.md`)
2. Update the page object to use LocatorLoader

### Flag Helper Convention Issues

If `*.helpers.ts` files don't follow conventions:
- Document the issue in the report
- Do NOT modify the helper file (team-owned)
- Note: missing `@scenario-triggers` JSDoc, missing `@helpers` tag, wrong class naming

## Validation
After fixes, run tests to verify behavior is unchanged.

## Rules
- Never modify `*.helpers.ts` files — only document convention issues
- Never modify `test-data/shared/*` — create scenario overrides instead
- Maintainability fixes must not change test behavior
