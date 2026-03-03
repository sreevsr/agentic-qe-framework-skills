# Skill: Run Tests

## Purpose
Execute ONLY the current scenario's Playwright test spec file. Never run all tests.

## References
- `skills/_shared/path-resolution.md` — test spec paths and run commands

## Process

### Step 1: Determine Test Command

```bash
cd output

# With folder:
npx playwright test tests/{type}/{folder}/{scenario}.spec.ts --project=chrome --reporter=list

# Without folder:
npx playwright test tests/{type}/{scenario}.spec.ts --project=chrome --reporter=list
```

**CRITICAL:** Never run `npx playwright test` without a file path — it executes ALL tests.

### Step 2: Parse Results

From the test output, extract:
- Total tests count
- Passed count
- Failed count
- Skipped/fixme count
- For each failure:
  - Test name
  - Error message
  - Stack trace
  - File and line number

### Step 3: Return Results

Return structured results to the heal-loop:
- `allPassed: boolean`
- `passed: number`
- `failed: number`
- `fixme: number`
- `failures: [{ testName, errorMessage, stackTrace, file, line }]`

## Rules
- Always use `--project=chrome` flag
- Always use `--reporter=list` for parseable output
- Run from the `output/` directory
- If the command itself fails (not test failures but command errors), check:
  - Playwright is installed (`npx playwright install chromium`)
  - The spec file path is correct
  - `node_modules/` exists (`npm install`)
