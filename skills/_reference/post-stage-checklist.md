# Post-Stage Checklist — Verification Gates

Every pipeline stage MUST run its checklist before handing off to the next stage. If any check fails, fix it before proceeding.

## After Generator Stage

### Core Files
- [ ] `output/core/locator-loader.ts` exists
- [ ] `output/core/base-page.ts` exists
- [ ] `output/core/shared-state.ts` exists
- [ ] `output/core/test-data-loader.ts` exists

### Config Files
- [ ] `output/playwright.config.ts` exists and uses `channel: 'chrome'` (NOT `browserName: 'chrome'`)
- [ ] `output/package.json` includes `@playwright/test`, `@types/node`, and `dotenv`
- [ ] `output/tsconfig.json` exists
- [ ] `output/.env.example` exists with placeholder-only values (no actual URLs, usernames, or passwords)

### Tools
- [ ] `output/tools/remote-control.js` exists (copy from repo root `output/tools/` or templates if missing)
- [ ] `output/tools/scout-agent-v4.spec.ts` exists

### Generated Files
- [ ] Every page in the analyst report has a corresponding `output/locators/{page-name}.locators.json`
- [ ] Every page in the analyst report has a corresponding `output/pages/{PageName}Page.ts`
- [ ] Spec file exists at `output/tests/{type}/{scenario}.spec.ts` (or `{folder}/{scenario}.spec.ts`)
- [ ] Every scenario step in the source `.md` maps to a test step in the spec

### Code Quality Gate
- [ ] No raw selectors in page objects — search for `page.locator(` in `output/pages/`; should appear only in `output/core/`
- [ ] No hardcoded credentials — search for `secret`, `password`, `sauce` (literal values) in `.ts` files
- [ ] No credential fallback defaults — search for `|| '` patterns after `process.env.` in spec files
- [ ] All page objects use `LocatorLoader` or extend `BasePage`

### Bash Verification Commands
```bash
# Core files exist (all 4 must return a path)
ls output/core/locator-loader.ts output/core/base-page.ts output/core/shared-state.ts output/core/test-data-loader.ts

# Config uses channel: 'chrome'
grep "channel.*chrome" output/playwright.config.ts

# No raw selectors in page objects (should return nothing)
grep -r "page\.locator(" output/pages/ || echo "PASS: no raw selectors"

# No credential fallback defaults in specs (should return nothing)
grep -rn "|| '" output/tests/ || echo "PASS: no fallback defaults"

# .env.example has no actual values (lines should end with = and nothing after)
grep -E "^[A-Z_]+=.+" output/.env.example && echo "FAIL: .env.example has values" || echo "PASS: placeholders only"
```

---

## After Healer Stage

### Test Results
- [ ] All tests pass OR remaining failures use `test.fixme()` with documented reason
- [ ] Fix cycle count ≤ 3

### Guardrail Compliance
- [ ] No `waitForTimeout()` introduced — search in all modified files
- [ ] No credential fallback defaults introduced
- [ ] Core files (`output/core/*`) not modified by Healer
- [ ] Helper files (`*.helpers.ts`) not modified by Healer
- [ ] Shared test data (`test-data/shared/*`) not modified by Healer

### Report
- [ ] Healer report exists at correct path (`output/healer-report-{scenario}.md` or `output/{folder}/healer-report-{scenario}.md`)
- [ ] Report cycle count matches actual cycles executed
- [ ] Report lists all fixes applied with category and description

### Bash Verification Commands
```bash
# No waitForTimeout in generated code (should return nothing)
grep -rn "waitForTimeout\|setTimeout" output/tests/ output/pages/ || echo "PASS: no timeout waits"

# Healer report exists
ls output/healer-report-*.md output/*/healer-report-*.md 2>/dev/null || echo "FAIL: no healer report"
```

---

## After Reviewer Stage

### Scorecard
- [ ] Review scorecard exists at correct path (`output/review-scorecard-{scenario}.md` or `output/{folder}/review-scorecard-{scenario}.md`)
- [ ] Overall score meets approval threshold: **28/35** (web-only) or **32/40** (with API dimension)
- [ ] No individual dimension scored below **3**
- [ ] Verdict is APPROVED or NEEDS FIXES (not missing)

### Bash Verification Commands
```bash
# Scorecard exists
ls output/review-scorecard-*.md output/*/review-scorecard-*.md 2>/dev/null || echo "FAIL: no scorecard"

# Check verdict
grep -i "verdict" output/review-scorecard-*.md output/*/review-scorecard-*.md 2>/dev/null
```

---

## After Healer-Review Stage

### Fix Compliance
- [ ] All review fixes applied or documented as blocked (with guardrail reason)
- [ ] No guardrail violations in applied fixes (core files, helpers, shared data untouched)

### Test Results
- [ ] All tests still pass after review fixes
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)

### Report
- [ ] Healer-review report exists at correct path
- [ ] Report lists every fix with dimension, file, change, and result

### Bash Verification Commands
```bash
# TypeScript compiles
cd output && npx tsc --noEmit && echo "PASS: TS compiles" || echo "FAIL: TS errors"

# Healer-review report exists
ls output/healer-review-fixes-report-*.md output/*/healer-review-fixes-report-*.md 2>/dev/null || echo "FAIL: no healer-review report"
```
