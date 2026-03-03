# Skill: Generate Pipeline Summary

## Purpose
Produce the final `pipeline-summary-{scenario}.md` at the end of the pipeline. Summarizes all stage results, files generated, test execution details, quality metrics, healer activity, and overall verdict. This is the last file written in every pipeline run.

## References
- `skills/_shared/path-resolution.md` — `PIPELINE_SUMMARY` path

## Output Path
- With folder: `output/{folder}/pipeline-summary-{scenario}.md`
- Without folder: `output/pipeline-summary-{scenario}.md`

## Report Structure

```markdown
# Pipeline Summary
**Scenario:** {scenario}
**Date:** {today}
**Time:** {HH:MM UTC}
**Type:** {web|api|hybrid}
**Folder:** {folder or N/A}
**Pipeline:** {stages that ran, e.g., Analyst → Generator → Healer → Reviewer}

## Stage Results

| Stage | Agent | Status | Duration | Output File | Notes |
|-------|-------|--------|----------|-------------|-------|
| 1 | Analyst | [✅/⏭️] | [Xs] | `analyst-report-{scenario}.md` | [summary] |
| 2 | Generator | [✅/❌] | [Xs] | `generator-report-{scenario}.md` | [summary] |
| 3 | Healer | [✅/⚠️/❌] | [Xs] | `healer-report-{scenario}.md` | [N fix cycles, X/Y passed] |
| 4 | Reviewer | [✅/❌] | [Xs] | `review-scorecard-{scenario}.md` | [Score X/Y — APPROVED/NEEDS FIXES] |
| 5 | Healer Review | [✅/⏭️] | [Xs] | `healer-review-fixes-report-{scenario}.md` | [N fixes applied / Skipped] |

## Final Verdict

**[✅ APPROVED — PRODUCTION READY / ⚠️ NEEDS FIXES / ❌ FAILED]**

[1-3 sentences summarizing the outcome: tests passing, quality score, critical issues resolved]

## Test Results
- **[X] passed**, [Y] failed, [Z] fixme
- [All tests passed on first run / N fix cycles needed]
- Execution time: [Xs]

## Generated File Tree
```
output/
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── .env.example
├── core/
│   ├── locator-loader.ts
│   ├── base-page.ts
│   ├── shared-state.ts
│   └── test-data-loader.ts
├── locators/
│   ├── [page].locators.json   ([N] elements)
│   └── ...
├── pages/
│   ├── [PageName].ts           ([N] methods)
│   └── ...
├── tests/
│   └── {type}/
│       └── {scenario}.spec.ts  ([N] tests)
├── test-data/                   (if created)
│   └── ...
├── tools/
│   ├── remote-control.js
│   └── scout-agent-v4.spec.ts
└── [reports...]
```

## Test Execution Summary

### Test: "[test title]"
**Tags:** [tags]
**Status:** [✅ PASSED / ❌ FAILED / ⚠️ FIXME]
**Duration:** [Xs]

**Test Flow:**
1. [step description]
2. [step description]
...

**Verifications:**
- [✅/❌] [what was verified]
- ...

(repeat for each test)

## Reviewer Scorecard Summary

| Dimension | Score |
|-----------|-------|
| 1. Locator Quality | [X/5] |
| 2. Wait Strategy | [X/5] |
| 3. Test Architecture | [X/5] |
| 4. Configuration | [X/5] |
| 5. Code Quality | [X/5] |
| 6. Maintainability | [X/5] |
| 7. Security | [X/5] |
| 8. API Test Quality | [X/5 or N/A] |
| **Total** | **[sum]/[max] ([percentage]%)** |

## Healer Activity (if fix cycles > 0)

### Fix [N]: [Category] — [short title]
**File:** `[path]`
**Issue:** [what failed]
**Fix:** [what was changed]
**Result:** [✅ resolved / ❌ unresolved]

(repeat for each fix)

## Recommendations
1. [actionable suggestion from Reviewer or Healer observations]
2. ...

## Command to Run Tests
```bash
cd output && npx playwright test tests/{type}/{scenario}.spec.ts --project=chrome --reporter=list
```

Tag-based commands (if tags are used):
```bash
npx playwright test --grep @smoke
npx playwright test --grep @regression
```
```

## Rules
- This report MUST be the last file written in the pipeline
- Include ALL stages — even skipped ones (mark as ⏭️ SKIPPED with reason)
- File tree MUST reflect actual files created (not a template copy)
- Test execution summary MUST cover every test, not just passing ones
- Reviewer scorecard summary uses raw scores (not star ratings)
- Healer activity section is omitted if 0 fix cycles
- Duration fields should be populated when available; use "—" if not measured
