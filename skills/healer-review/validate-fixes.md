# Skill: Validate Fixes — Post-Review Fix Verification

## Purpose
After all review fixes are applied, validate that the code compiles and tests still pass. Generate the healer-review report.

## Paths
Report output:
- With folder: `output/{folder}/healer-review-fixes-report-{scenario}.md`
- Without folder: `output/healer-review-fixes-report-{scenario}.md`

Test command:
- With folder: `npx playwright test tests/{type}/{folder}/{scenario}.spec.ts --project=chrome --reporter=list`
- Without folder: `npx playwright test tests/{type}/{scenario}.spec.ts --project=chrome --reporter=list`

## Process

### Step 1: TypeScript Compilation

```bash
cd output
npx tsc --noEmit
```

If type errors exist, fix them before proceeding.

### Step 2: JSON Validation

For each modified locator JSON file:
```bash
node -e "JSON.parse(require('fs').readFileSync('locators/{file}.locators.json', 'utf8'))"
```

Fix any JSON syntax errors (trailing commas, missing quotes, etc.).

### Step 3: Run Tests

```bash
# With folder:
npx playwright test tests/{type}/{folder}/{scenario}.spec.ts --project=chrome --reporter=list

# Without folder:
npx playwright test tests/{type}/{scenario}.spec.ts --project=chrome --reporter=list
```

All tests MUST still pass. If any fail after review fixes:
1. Check the error message
2. Verify the locator key exists in JSON
3. Verify `getElement()` is awaited
4. Fix and re-test (max 2 attempts per issue)
5. If still failing after 2 attempts: revert the fix, add `// TODO: Fix this` comment, document in report

### Step 4: Generate Report

Save the healer-review report.

**Output path:**
- With folder: `output/{folder}/healer-review-fixes-report-{scenario}.md`
- Without folder: `output/healer-review-fixes-report-{scenario}.md`

**Report format:**

```markdown
# Healer Review Fixes Report
**Date:** [today]
**Time:** [HH:MM UTC]
**Scenario:** [scenario name]
**Mode:** CODE_REVIEW_FIXES
**Scorecard:** [path to review scorecard]

## Fixes Applied

### [N]. [Short title] (Dimension [X]: [Dimension Name])
**File:** `[path]`
**Lines:** [line numbers affected]
**Priority:** [HIGH/MEDIUM/LOW]

**Before:**
```[language]
[original code]
```

**After:**
```[language]
[fixed code]
```

**Rationale:** [why this change was made — link back to the specific review finding]

---

(repeat for each fix)

## Issues Not Fixed

| Dimension | File | Issue | Reason |
|-----------|------|-------|--------|
| Locator Quality | pages/CartPage.helpers.ts | Raw selector in helper | Team-owned file — cannot modify |
| ... | | | |

## Test Verification Results
**Command:** `npx playwright test tests/{type}/{scenario}.spec.ts --project=chrome --reporter=list`
**Result:** [✓ X/Y passed]
**Duration:** [Xs]

## Summary
- **Total fixes applied:** [N]
- **Fixes skipped (blocked by guardrails):** [N]
- **Tests after fixes:** [✓ X/Y passing]

### Score Improvements (Estimated)
| Dimension | Before | After | Improvement |
|-----------|--------|-------|-------------|
| [Dimension Name] | [X/5] | [Y/5] | [+Z (description)] |
| ... | | | |
| **Overall Score** | **[before]** | **[after]** | **[+delta]** |

### Critical Issues Resolved
- [✓ description of resolved critical issue]
- ...

### Production Readiness
[1-2 sentences on whether the framework now meets enterprise QE standards after fixes]

**Healer Review Status:** CODE_REVIEW_FIXES completed. [Framework is production-ready / Issues remain.]
```

## Fix Order (Recommended)

Apply fixes in this order to minimize cascading issues. Dimension numbers match the Reviewer scorecard:

1. **Dimension 5 (Code Quality)** — remove dead code, unused imports first
2. **Dimension 7 (Security)** — credential fixes are simple and isolated
3. **Dimension 4 (Configuration)** — config fixes are isolated
4. **Dimension 2 (Wait Strategy)** — timing fixes
5. **Dimension 3 (Test Architecture)** — tag and structure fixes
6. **Dimension 6 (Maintainability)** — separation of concerns
7. **Dimension 1 (Locator Quality)** — most complex, do last (JSON + code changes)
8. **Dimension 8 (API Test Quality)** — only if API tests exist

## Rules
- All tests must pass after fixes — if a fix breaks tests, revert it
- Never weaken assertions during review fixes
- Review fixes are quality improvements only — no test behavior changes
