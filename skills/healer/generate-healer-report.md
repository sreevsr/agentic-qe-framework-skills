# Skill: Generate Healer Report

## Purpose
Format the healing results into a structured markdown report and save it to disk.

## Output Path
- With folder: `output/{folder}/healer-report-{scenario}.md`
- Without folder: `output/healer-report-{scenario}.md`

## Report Format

```markdown
# Healer Report
**Date:** [today]
**Time:** [HH:MM UTC]
**Scenario:** [scenario name]
**Type:** [web/api/hybrid]
**Initial Result:** [X/Y passed]
**Final Result:** [X/Y passed]
**Fix Cycles:** [N]

## Fixes Applied

### Fix [N]: Category [A-G] — [short title]
**File:** `[path]`
**Issue:** [what failed — error message or TypeScript compilation error]
**Root Cause:** [why it failed — method name mismatch, missing selector, timing, etc.]
**Fix:** [what was changed, with specifics]
**Verification:** [compilation passed / test passed after fix]

(repeat for each fix)

## Mock API Adaptations (if API Behavior: mock)

| Test | Adaptation | Reason |
|------|-----------|--------|
| [test name] | [what was adapted] | [mock API does not persist data] |

These adaptations are NOT bugs — the scenario declared `API Behavior: mock`.

## Helper Method Issues (if any)

| Test Step | Helper | Error | Recommendation |
|-----------|--------|-------|----------------|
| [step description] | [PageName.methodName] | [error message] | [suggestion for team] |

These steps are marked with `test.fixme('HELPER ISSUE: ...')`.
The Healer does NOT fix helper files — they are team-owned. The team must fix these manually.

## Potential Application Bugs (if any)

| Test | Signal | Expected | Actual | Recommendation |
|------|--------|----------|--------|----------------|
| [test name] | [e.g., Persistence failure] | [expected behavior] | [actual behavior] | [investigation suggestion] |

These tests are marked with `test.fixme()` and should be investigated by the development team.
They are NOT counted as healer failures — the test logic is correct.

## Test Execution Results

### Test: "[test title]"
**Status:** [✅ PASSED / ❌ FAILED / ⚠️ FIXME]
**Duration:** [Xs]

**Captured Values:** (if any CAPTURE steps)
- `variableName`: value
- ...

**Verifications Passed:** (if any VERIFY steps)
- [✅/❌] [what was verified]
- ...

**Screenshots:** (if any SCREENSHOT steps)
- [filename].png
- ...

(repeat for each test in the spec)

## Remaining Issues (if any)
- [issue description and suggested manual fix]

## Summary
[1-2 paragraph narrative: what happened during healing, what was fixed, what the final state is]

**Healer Status:** [✅ SUCCESS — All tests passing / ⚠️ PARTIAL — N tests marked fixme / ❌ FAILED — N tests still failing]
```

## Counting Rules

- Tests marked with `test.fixme()` for POTENTIAL BUG are NOT healer failures
- Tests marked with `test.fixme()` for HELPER ISSUE are NOT healer failures
- Only tests that fail due to unresolved test defects count as healer failures
- "Final Result" should show `X passed, Y fixme, Z failed` where Z is genuine failures
