# Skill: Aggregate Scorecard

## Purpose
Combine scores from all 8 review dimensions into a final scorecard and issue a verdict: APPROVED or NEEDS FIXES.

## Paths
Scorecard output:
- With folder: `output/{folder}/review-scorecard-{scenario}.md`
- Without folder: `output/review-scorecard-{scenario}.md`

## Input
Scores and findings from all dimension reviews:
1. Locator Quality (High weight)
2. Wait Strategy (High weight)
3. Test Architecture (Medium weight)
4. Configuration (Medium weight)
5. Code Quality (Low weight)
6. Maintainability (Medium weight)
7. Security (High weight)
8. API Test Quality (Medium weight — N/A if no API tests)

## Verdict Criteria

**APPROVED:** Score >= 32/40 AND no single dimension below 3.

**NEEDS FIXES:** Score < 32/40 OR any dimension scores 1-2.

If API Test Quality is N/A (web-only or mobile), calculate out of 35 instead of 40. Approval threshold becomes >= 28/35.

**Type-specific scoring:**

| Type | Dimensions scored | Max | Approval threshold |
|------|------------------|-----|-------------------|
| `web` | 1–7 (API Quality N/A) | 35 | >= 28/35, no dim < 3 |
| `api` | 2–8 (Locator Quality N/A) | 35 | >= 28/35, no dim < 3 |
| `hybrid` | 1–8 (all) | 40 | >= 32/40, no dim < 3 |
| `mobile` | 1–7 + Mobile Quality (9); API Quality N/A | 40 | >= 32/40, no dim < 3 |

## Output Path
- With folder: `output/{folder}/review-scorecard-{scenario}.md`
- Without folder: `output/review-scorecard-{scenario}.md`

## Report Format

```markdown
# QE Review Scorecard
**Date:** [today]
**Time:** [HH:MM UTC]
**Scenario:** [scenario name]
**Type:** [web/api/hybrid/mobile]
**Framework:** output/ directory
**Overall Score:** [sum]/[max] ([percentage]%)

| # | Dimension | Weight | Score | Key Finding |
|---|-----------|--------|-------|-------------|
| 1 | Locator Quality | High | _/5 | [summary or N/A for api] |
| 2 | Wait Strategy | High | _/5 | [summary] |
| 3 | Test Architecture | Medium | _/5 | [summary] |
| 4 | Configuration | Medium | _/5 | [summary] |
| 5 | Code Quality | Low | _/5 | [summary] |
| 6 | Maintainability | Medium | _/5 | [summary] |
| 7 | Security | High | _/5 | [summary] |
| 8 | API Test Quality | Medium | _/5 | [summary or N/A for web/mobile] |
| 9 | Mobile Quality | High | _/5 | [summary or N/A for web/api/hybrid] |

## Detailed Findings

### [N]. [Dimension Name] ([score]/5)
**Strengths:**
- [what was done well — cite file:line evidence]

**Issues:** (if any)
- [what was wrong — cite file:line evidence]

**Score Justification:** [1-2 sentences explaining the score]

**Code Sample:** (optional — include when illustrating a strength or issue)
```typescript
// relevant code snippet
```

(repeat for each scored dimension)

## Critical Issues (must fix)
1. [Dimension X] [file:line] — [description]
2. ...

## Recommendations (nice to have)
1. [Dimension X] [file:line] — [description]
2. ...

## Files Reviewed
- `[file path]` — [brief description: e.g., "4 tests, 26 steps"]
- ...

## Verdict: [APPROVED / NEEDS FIXES]
Score [sum]/[max] ([percentage]%) [exceeds/does not meet] threshold of [28/35 or 32/40]. [No dimension below 3 / Dimension X scored below 3].
```

## Classification Rules

**Critical Issues (must fix):**
- Any finding that results in a dimension score of 1-2
- Security: any hardcoded credential
- Locator Quality: raw selectors in page objects or specs
- Wait Strategy: any `waitForTimeout` usage

**Recommendations (nice to have):**
- Findings in dimensions scored 3-4
- Missing JSDoc, minor naming issues
- Configuration improvements

## Rules
- Do NOT modify any files — only report findings
- Be specific: cite file names and line numbers for every issue
- Score each dimension independently
- The scorecard MUST be written to disk as a file (not just printed)
