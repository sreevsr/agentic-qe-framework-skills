---
mode: agent
description: "Run QE Healer in Code Review mode to fix quality issues from Reviewer scorecard"
---

---
PLATFORM COMPATIBILITY MODE:
- Use Node.js path.join() for all file paths
- DO NOT use git commands or check repository state
- Self-contained execution mode
---

MODE: CODE_REVIEW_FIXES
SCENARIO_NAME = {{scenario}}
SCENARIO_TYPE = {{type}}

Read agents/03-healer.md for base instructions, then apply CODE_REVIEW_FIXES mode.

─── PHASE 1: READ REVIEW REPORT ───

1. Read output/review-scorecard.md completely
2. Extract all issues with these statuses:
   - CRITICAL (score 0-2)
   - NEEDS ATTENTION (score 3)
3. List the specific files, line numbers, and issue descriptions
4. Ignore GOOD (score 4-5) items — those don't need fixes

─── PHASE 2: FIX STRATEGY BY DIMENSION ───

**Dimension 1 (Code Hygiene):** Remove unused imports, dead code, console.log statements
**Dimension 2 (Import Integrity):** Fix import paths to resolve correctly
**Dimension 3 (Step Completeness):** Add missing // STEP N: comments
**Dimension 4 (Locator Quality — MOST CRITICAL):**
  All selectors MUST be in locator JSON files.
  Page objects MUST use LocatorLoader (this.getElement, this.click, this.getText).
  NEVER use raw this.page.locator() in page objects.
  Steps: Identify raw selector → Add to locators JSON with primary + 2-3 fallbacks → Update page object method to use LocatorLoader
**Dimension 5 (Wait Strategy):** Replace waitForTimeout with waitForSelector/waitForLoadState
**Dimension 6 (Test Architecture):** Add tags, fix test isolation
**Dimension 7 (Security):** Move credentials to process.env
**Dimension 8 (Configuration):** Fix channel, timeouts, reporter settings

─── PHASE 3: APPLY FIXES ───

Fix order: Dimension 1 → 7 → 8 → 5 → 4 (most complex last)

For Dimension 4 fixes:
  Step A: Identify the raw selector in page object
  Step B: Add to locators JSON file with primary + 2-3 fallbacks
  Step C: Update page object method to use LocatorLoader pattern:
    - this.click('keyName') instead of this.page.locator('selector').click()
    - this.getText('keyName') instead of this.page.locator('selector').textContent()
    - this.getElement('keyName') instead of this.page.locator('selector')

JSON RULES:
- Add comma after previous entry
- No trailing comma after last entry
- Use single quotes inside double-quoted strings
- Validate JSON syntax

─── PHASE 4: VALIDATION ───

After applying ALL fixes:
1. Verify TypeScript compiles: cd output && npx tsc --noEmit
2. Verify JSON files are valid
3. Run tests: npx playwright test tests/{{type}}/{{scenario}}.spec.ts --reporter=list
4. All tests MUST still pass after fixes

─── PHASE 5: REPORT ───

Save output/healer-review-fixes-report.md:
```markdown
# Healer Code Review Fixes Report

**Date:** [Current Date]  
**Scenario:** {{SCENARIO_NAME}} ({{SCENARIO_TYPE}})  
**Mode:** Code Review Fixes

---

## Review Score

- **Before Fixes:** [X]/40 ([Score]/5) — [Status]
- **After Fixes:** [Y]/40 ([Score]/5) — [Status]

---

## Issues Addressed

### Dimension 1: Code Hygiene ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 2: Import Integrity ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 3: Step Completeness ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 4: Locator Quality ([Score]/5)
[List each raw selector that was moved to JSON]
- ✅ Fixed [File]:[Line] — [Method name] now uses LocatorLoader key '[keyName]'

### Dimension 5: Wait Strategy ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 6: Test Architecture ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 7: Security ([Score]/5)
[List what was fixed or "✅ No issues"]

### Dimension 8: Configuration ([Score]/5)
[List what was fixed or "✅ No issues"]

---

## Files Modified

1. output/locators/[page]-page.locators.json — Added [N] selector keys
2. output/pages/[Page].ts — Updated [N] methods to use LocatorLoader
3. [Other files...]

---

## New Locator Keys Added

**In cart-page.locators.json:**
- `keyName1` — [primary selector]
- `keyName2` — [primary selector]

**In inventory-page.locators.json:**
- `keyName3` — [primary selector]

---

## Test Results After Fixes
```
Running [N] tests...

✓ Scenario 1: [Name]
✓ Scenario 2: [Name]
✓ Scenario 3: [Name]
✓ Scenario 4: [Name]

[N] passed
