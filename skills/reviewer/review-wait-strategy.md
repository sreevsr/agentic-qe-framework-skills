# Skill: Review Wait Strategy (Dimension 2)

## Purpose
Audit for proper wait strategies. Zero tolerance for `waitForTimeout`. Weight: **High**.

## Scope
All scenario types (web, api, hybrid).

## Checklist

- [ ] Zero instances of `waitForTimeout` or `setTimeout` in all files
- [ ] Navigation actions followed by `waitForLoadState` or `waitForURL`
- [ ] Form submissions followed by response/navigation waits
- [ ] Dynamic content uses `waitForSelector` with explicit state
- [ ] API calls use proper response awaiting (no artificial delays)

## What to Check

### Global Search

Search all `.ts` files in `output/` for:
- `waitForTimeout` — must be ZERO instances
- `setTimeout` — must be ZERO instances
- `sleep` — must be ZERO instances
- `delay` — check if it's a custom delay function

### Navigation Patterns

Every `page.goto()` should be followed by one of:
- `await page.waitForLoadState('domcontentloaded')`
- `await page.waitForLoadState('networkidle')`
- `await page.waitForURL()`
- `await expect(page).toHaveURL()`

### Form Submission Patterns

After form submissions (click submit, press Enter), verify:
- Wait for navigation response, URL change, or element appearance
- Not just proceeding to next assertion without waiting

### Dynamic Content

For content that appears after user actions:
- Uses `waitForSelector` with explicit visibility state
- Or relies on Playwright's built-in auto-waiting (acceptable)
- Not using arbitrary timeouts

## Scoring

| Score | Criteria |
|-------|----------|
| 5 | Zero timeouts, all navigation has proper waits, dynamic content handled correctly |
| 4 | Zero timeouts, 1-2 navigation actions missing explicit waits (but auto-wait covers them) |
| 3 | Zero timeouts, but several navigation actions without waits |
| 2 | 1-2 instances of waitForTimeout found |
| 1 | Multiple waitForTimeout/setTimeout instances |

## Output
Return: score (1-5), list of issues with file paths and line numbers, key finding summary.
