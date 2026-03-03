# Skill: Heal Loop — Orchestrate the Full Healing Cycle

## Purpose
Entry point for Stage 3 (Healer). Orchestrates the full cycle: pre-flight validation → run tests → diagnose failures → apply fixes → re-run. Maximum 3 fix-and-rerun cycles.

## Paths
Test command (always run ONLY the current scenario's spec file):
- With folder: `npx playwright test tests/{type}/{folder}/{scenario}.spec.ts --project=chrome --reporter=list`
- Without folder: `npx playwright test tests/{type}/{scenario}.spec.ts --project=chrome --reporter=list`
Never run `npx playwright test` without a file path.

Healer report:
- With folder: `output/{folder}/healer-report-{scenario}.md`
- Without folder: `output/healer-report-{scenario}.md`

## Sub-Skills Invoked
1. `skills/healer/pre-flight-validation.md`
2. `skills/healer/run-tests.md`
3. `skills/healer/diagnose-failure.md`
4. `skills/healer/apply-fix.md` (pre-edit gate inlined — no external file needed)
5. `skills/healer/generate-healer-report.md`

## Process

### Phase 1: Setup

```bash
cd output
cp .env.example .env  # if .env doesn't exist yet
npm install
npx playwright install chromium
```

### Phase 2: Pre-Flight Validation

Invoke `pre-flight-validation` skill:
- TypeScript type check (`npx tsc --noEmit`)
- Fix type errors before first test run
- Verify imports, await usage, missing packages

### Phase 3: Initial Test Run

Invoke `run-tests` skill to execute ONLY the current scenario's spec file.

If all tests pass on first run → skip to Phase 5 (report).

### Phase 4: Fix Cycles (max 3)

For each cycle:

1. **Diagnose** each failure using `diagnose-failure` skill (Categories A-H)
2. **Check for Category H (Missing Helper):** If any failure is diagnosed as Category H, do NOT attempt a code fix. The ONLY action is wrapping the affected test in `test.fixme('HELPER ISSUE: ...')`. Do NOT implement the missing method in the base page object or inline in the spec. This is a HARD STOP — no workaround is permitted.
3. **Apply fix** for each non-Category-H failure using `apply-fix` skill (which checks pre-edit gate first)
4. **Re-run tests** using `run-tests` skill
5. If all tests pass or only `test.fixme()` tests remain → break out of loop
6. If failures remain → continue to next cycle

Stop after 3 cycles. Document remaining failures.

### Phase 5: Generate Report

Invoke `generate-healer-report` skill to produce the final healer report.

## Cycle Tracking

Track across cycles:
- Which tests passed/failed each cycle
- Which fixes were applied (file, category, description)
- Which tests were flagged as potential bugs (`test.fixme()`)
- Which tests had helper issues (`test.fixme('HELPER ISSUE: ...')`)

## Exit Conditions

| Condition | Action |
|-----------|--------|
| All tests pass | Generate report, exit |
| 3 cycles exhausted | Generate report with remaining issues, exit |
| Only `test.fixme()` tests remain | Generate report — these are bugs or helper issues, not healer failures |
| Category H diagnosed (missing helper) | Apply `test.fixme('HELPER ISSUE: ...')`, do NOT count as a healer failure. Generate report with helper issue documented. |

## Rules
- Run ONLY the current scenario's spec file — never run all tests
- Never add `waitForTimeout()` to fix timing issues
- Never skip or delete failing tests — fix them or flag with `test.fixme()`
- Before EVERY fix, check the pre-edit gate (inlined in `apply-fix` skill)
- NEVER implement missing helper methods — not in base page objects, not inline in specs. The ONLY response to a missing helper is `test.fixme('HELPER ISSUE: ...')`
