# Skill: Generate Report — Generator Stage Output Summary

## Purpose
Produce `generator-report-{scenario}.md` at the end of the Generator stage. Documents every file created, every scenario step mapped, keyword implementations, helper integration, and quality checks. This report is consumed by the Healer (known issues, potential fixes) and Reviewer (traceability audit).

## Paths
- Without folder: `output/generator-report-{scenario}.md`
- With folder: `output/{folder}/generator-report-{scenario}.md`

## Rules
- The report MUST list every file created — use the directory tree from `setup-framework` skill as baseline.
- File naming follows kebab-case conventions (e.g., `cart-page.locators.json`, `saucedemo-cart-feature.spec.ts`).

## Output Path
- Without folder: `output/generator-report-{scenario}.md`
- With folder: `output/{folder}/generator-report-{scenario}.md`

## Report Structure

### 1. Header
```markdown
# Generator Report
**Scenario:** {scenario}
**Date:** {today}
**Time:** {HH:MM UTC}
**Type:** {web|api|hybrid}
**Status:** COMPLETED
```

### 2. Summary
One paragraph describing what was generated.

### 3. Files Generated/Verified
Categorized checklist of every file, grouped by type:

- **Locator Files** — list each JSON file with element count
- **Page Object Files** — list each page with method count
- **Helper Files Discovery** — list any `*.helpers.ts` found, their classes, methods, and trigger phrases. Note which were/weren't used by this scenario and why.
- **Test Spec File** — path, test count, step count, tags, keywords used
- **Test Data File** — path and contents summary (if created)
- **Core Framework Files** — verify all 4 exist
- **Configuration Files** — verify playwright.config.ts, package.json, tsconfig.json, .env.example

Use checkmarks: `✅` for present/correct, note any skipped files and why.

### 4. Scenario Coverage — Step Mapping Table
Map EVERY scenario step to its test implementation:

```markdown
| Step | Type | Test Implementation |
|------|------|---------------------|
| 1 | Navigate | `loginPage.navigate()` |
| 2 | Login | `loginPage.login(username, password)` |
| 3 | VERIFY | `expect(page).toHaveURL(/\/inventory/)` |
```

For multi-scenario files (with `---` separators), include Common Setup steps once, then a table per scenario.

### 5. Keyword Implementation
For each keyword used in the scenario, show the code pattern generated:
- `VERIFY` → `expect()` assertions
- `CAPTURE` → variable assignments via getter methods
- `CALCULATE` → arithmetic on captured values
- `SCREENSHOT` → `page.screenshot()` + `test.info().attach()`
- `REPORT` → `console.log()` + `test.info().annotations`
- `SAVE` → `saveState()` from shared-state.ts
- `DATASETS` → parameterized `for...of` loop
- `SHARED_DATA` → `loadTestData()` from test-data-loader.ts

Only include keywords actually used by this scenario.

### 6. Helper Integration Details (if any helpers exist)
- List each helper file discovered
- Class name, methods, trigger phrases
- Which methods were called (matched scenario steps) vs not called (no match)
- Import aliasing pattern applied in spec

If no helpers exist, note: "No helper files found in `output/pages/`."

### 7. Code Quality Checks
Inline checklist covering:
- [ ] All import paths correct
- [ ] All page objects use LocatorLoader/BasePage — no raw selectors
- [ ] All interactions use page objects — no direct `page.click(selector)` in specs
- [ ] Config uses `channel: 'chrome'`
- [ ] No `waitForTimeout()` anywhere
- [ ] Test count matches scenario count
- [ ] All async methods properly awaited
- [ ] Dependencies present in package.json
- [ ] Credentials via `process.env` with no fallback defaults
- [ ] Tags correctly formatted
- [ ] Locator strategy: primary + 2 fallbacks per element

### 8. Environment Variables Required
List all `process.env.*` references and their source.

### 9. Test Execution Commands
```bash
cd output
npx playwright test tests/{type}/{scenario}.spec.ts --project=chrome --reporter=list
```
Include tag-based commands if tags are used.

### 10. Notes for Healer Agent
- Known characteristics of the application under test
- Elements that may be tricky (dynamic content, conditional visibility)
- Test execution order dependencies (if any)
- Potential fixes if common failures occur

### 11. Code Statistics
- Total lines generated (spec + pages + locators)
- Test count
- Assertion count
- Page objects and methods count
- Locator elements count

## Rules
- The report MUST cover every file created — nothing omitted
- The step mapping table MUST have one row per scenario step — no skipping
- Quality checks MUST be honest — flag issues rather than hiding them
- Helper discovery MUST scan `output/pages/*.helpers.ts` even if none exist
