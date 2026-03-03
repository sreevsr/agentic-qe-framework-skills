import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific .env file
// Usage: set TEST_ENV=qa && npx playwright test
// Windows cmd:    set TEST_ENV=qa && npx playwright test --project=qa
// PowerShell:     $env:TEST_ENV="qa"; npx playwright test --project=qa
// Linux/Mac:      TEST_ENV=qa npx playwright test --project=qa
const env = process.env.TEST_ENV || 'dev';
dotenv.config({ path: path.join(__dirname, `.env.${env}`) });
dotenv.config({ path: path.join(__dirname, '.env') }); // fallback for backward compatibility

/**
 * Playwright Configuration — Chrome Only
 * 
 * IMPORTANT: Uses `channel: 'chrome'` (installed Chrome browser).
 * Do NOT use `browserName: 'chrome'` — that is not a valid Playwright value.
 * Valid browserName values are: chromium, firefox, webkit.
 * To use real Chrome, set `channel: 'chrome'` as shown below.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    /* Base URL — set this to your application URL */
    baseURL: process.env.BASE_URL || 'https://www.saucedemo.com',

    /* Use installed Chrome browser */
    channel: 'chrome',

    /* Run headed so the demo is visible */
    headless: false,

    /* Collect evidence on failures */
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',

    /* Viewport */
    viewport: { width: 1280, height: 720 },

    /* Ignore SSL errors (common in enterprise environments) */
    ignoreHTTPSErrors: true,

    /* Timeouts */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});