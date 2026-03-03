# Skill: Fix Configuration (Dimension 4 Fixes)

## Purpose
Fix Playwright configuration issues: channel, timeouts, reporters, evidence collection.

## Fixes

### Fix Browser Channel

```typescript
// BEFORE (wrong)
use: { channel: 'chromium' }
// or
use: { browserName: 'chrome' }

// AFTER (correct)
use: { channel: 'chrome' }
```

### Add Missing Timeouts

```typescript
use: {
  actionTimeout: 15_000,      // Add if missing
  navigationTimeout: 30_000,  // Add if missing
}
```

### Add Evidence Collection

```typescript
use: {
  screenshot: 'only-on-failure',   // Add if missing
  trace: 'on-first-retry',         // Add if missing
  video: 'retain-on-failure',      // Add if missing
}
```

### Fix Reporters

```typescript
// Minimum required:
reporter: [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['json', { outputFile: 'test-results/results.json' }],
],
```

### Fix package.json Dependencies

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.0.0",
    "dotenv": "^16.0.0"
  }
}
```

Add missing entries with `npm install --save-dev {package}`.

## Validation
After config fixes, run `npx tsc --noEmit` and then run tests to verify.

## Rules
- Config fixes must not change test behavior
- Keep all existing config values that are correct — only fix what the Reviewer flagged
