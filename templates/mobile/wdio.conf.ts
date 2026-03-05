import * as dotenv from 'dotenv';
import * as path from 'path';
import { getCapabilities } from './core/capabilities';

// Load environment-specific .env file (same convention as playwright.config.ts)
const env = process.env.TEST_ENV || 'dev';
dotenv.config({ path: path.join(__dirname, `.env.${env}`) });
dotenv.config({ path: path.join(__dirname, '.env') });

export const config = {
  //
  // ─── Runner ───────────────────────────────────────────────────────────────
  //
  runner: 'local',

  //
  // ─── Specs ────────────────────────────────────────────────────────────────
  //
  // Run ONLY the current scenario's spec — never all specs.
  // Usage: npx wdio wdio.conf.ts --spec tests/mobile/android/{scenario}.spec.ts
  //
  specs: ['./tests/mobile/**/*.spec.ts'],
  exclude: [],

  //
  // ─── Capabilities ─────────────────────────────────────────────────────────
  //
  maxInstances: 1,
  capabilities: [getCapabilities()],

  //
  // ─── Appium ───────────────────────────────────────────────────────────────
  //
  hostname: process.env.APPIUM_HOST || 'localhost',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/',
  connectionRetryTimeout: 60000,
  connectionRetryCount: 3,

  //
  // ─── Framework ────────────────────────────────────────────────────────────
  //
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 90000,        // 90s per test — mobile is slower than web
    retries: 0,
  },

  //
  // ─── Reporters ────────────────────────────────────────────────────────────
  //
  reporters: [
    'spec',
    ['json', {
      outputDir: './test-results',
      outputFileFormat: () => 'mobile-results.json',
    }],
  ],

  //
  // ─── Timeouts ─────────────────────────────────────────────────────────────
  //
  waitforTimeout: 15000,
  waitforInterval: 500,

  //
  // ─── Hooks ────────────────────────────────────────────────────────────────
  //
  onPrepare() {
    console.log(`\nPlatform: ${process.env.PLATFORM || 'android'}`);
    console.log(`Device: ${process.env.ANDROID_DEVICE || process.env.IOS_DEVICE || 'default'}`);
    console.log(`Appium: ${process.env.APPIUM_HOST || 'localhost'}:${process.env.APPIUM_PORT || '4723'}\n`);
  },

  afterTest(test: any, _context: any, { error }: { error: any }) {
    if (error) {
      // Screenshot on failure is handled in individual specs via BaseScreen.takeScreenshot()
      console.error(`FAILED: ${test.title}`);
    }
  },
};
