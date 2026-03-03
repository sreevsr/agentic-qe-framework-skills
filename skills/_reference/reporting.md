# Reporting — Reporter Configuration Patterns

Playwright supports multiple reporters simultaneously. The framework generates a default configuration and can be extended for enterprise dashboards.

## Default Configuration (Built-in)

The Generator's `setup-framework` skill configures these reporters in `playwright.config.ts`:

```typescript
reporter: [
  ['list'],                                                    // Console output during runs
  ['html', { outputFolder: 'playwright-report', open: 'never' }], // Self-contained HTML report
  ['json', { outputFile: 'test-results/results.json' }],      // Machine-readable results
],
```

This covers: human-readable console output, visual HTML report with screenshots/video/trace, and JSON for automation consumption.

## Enterprise Integration: Allure

Rich dashboards with trend analysis, test categorization, history, and defect tracking.

**Setup:**
```bash
npm install -D allure-playwright
```

**Config addition:**
```typescript
reporter: [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['allure-playwright', { outputFolder: 'allure-results' }],  // Add this line
],
```

**CI/CD step:**
```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

No changes to generated test code, page objects, or locators.

## Enterprise Integration: ReportPortal

Centralized dashboard with cross-project analytics, AI-powered failure analysis, and real-time reporting.

**Setup:**
```bash
npm install -D @reportportal/agent-js-playwright
```

**Config addition:**
```typescript
reporter: [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['@reportportal/agent-js-playwright', {                     // Add this block
    apiKey: process.env.RP_API_KEY,
    endpoint: process.env.RP_ENDPOINT,
    project: process.env.RP_PROJECT,
    launch: process.env.RP_LAUNCH || 'QE Automation',
    attributes: [{ key: 'framework', value: 'agentic-qe' }],
  }],
],
```

**Environment variables (add to `.env.example`):**
```bash
RP_API_KEY=
RP_ENDPOINT=
RP_PROJECT=
RP_LAUNCH=
```

No changes to generated test code.

## Custom Dashboard Integration

Consume the JSON output (`test-results/results.json`) in a CI/CD pipeline step:

```bash
# Example: Push results to a time-series database
node scripts/push-results.js test-results/results.json

# Example: Post summary to Slack
node scripts/notify-slack.js test-results/results.json
```

The JSON reporter output contains all test results, durations, and failure details. No framework changes needed — just add a post-test CI/CD step.

## Reviewer Validation

The `review-configuration` skill validates reporter setup:
- At least `['list']` and `['html']` reporters must be configured
- `json` reporter recommended for CI/CD pipelines
- Screenshot, trace, and video settings must be configured for failure evidence
