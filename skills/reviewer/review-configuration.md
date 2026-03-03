# Skill: Review Configuration (Dimension 4)

## Purpose
Audit Playwright configuration for correctness and best practices. Weight: **Medium**.

## Scope
All scenario types.

## References
- `skills/_shared/reporting.md` — expected reporter configuration

## Checklist

- [ ] `channel: 'chrome'` used (NOT `browserName: 'chrome'`)
- [ ] Timeouts configured (actionTimeout, navigationTimeout)
- [ ] Screenshot on failure enabled: `screenshot: 'only-on-failure'`
- [ ] Trace collection configured: `trace: 'on-first-retry'`
- [ ] Video configured: `video: 'retain-on-failure'`
- [ ] `baseURL` set correctly (matches application URL)
- [ ] Reporters configured: at least `list` + `html`, ideally also `json`
- [ ] `testDir` points to correct directory (`./tests`)

## What to Check

### playwright.config.ts

```typescript
// CORRECT
use: {
  channel: 'chrome',                         // ✅ Not browserName
  screenshot: 'only-on-failure',             // ✅ Evidence collection
  trace: 'on-first-retry',                   // ✅ Debug info
  video: 'retain-on-failure',                // ✅ Video evidence
  actionTimeout: 15_000,                     // ✅ Action timeout set
  navigationTimeout: 30_000,                 // ✅ Navigation timeout set
  baseURL: process.env.BASE_URL || '...',    // ✅ Configurable
}

// WRONG
use: {
  browserName: 'chrome',         // ❌ Not a valid Playwright value
  channel: 'chromium',           // ❌ Should be 'chrome'
}
```

### Projects Array
- Should include at minimum a Chrome project
- Project uses `channel: 'chrome'`

### Reporters
- At least `['list']` for console output
- `['html', { ... }]` for visual report
- `['json', { ... }]` for CI/CD consumption (recommended)

### package.json
- `@playwright/test` present
- `@types/node` in devDependencies
- `dotenv` in devDependencies (if `.env` used)

### tsconfig.json
- Valid TypeScript configuration
- `strict` mode recommended

## Scoring

| Score | Criteria |
|-------|----------|
| 5 | All config correct: channel, timeouts, evidence collection, reporters, baseURL |
| 4 | Most config correct, minor: missing one of trace/video/json reporter |
| 3 | Core config correct (channel, baseURL), but missing evidence collection settings |
| 2 | Config errors: wrong channel or missing timeouts |
| 1 | Major config errors: wrong browserName, no baseURL |

## Output
Return: score (1-5), list of issues with file paths and line numbers, key finding summary.
