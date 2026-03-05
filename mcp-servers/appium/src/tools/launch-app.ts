import { createSession } from '../driver.js';

export const launchAppTool = {
  name: 'launch_app',
  description: 'Launch the mobile app and start an Appium session. Must be called before any other tool. Reads capabilities from environment variables by default; all can be overridden via parameters.',
  inputSchema: {
    type: 'object',
    properties: {
      platform: {
        type: 'string',
        enum: ['android', 'ios'],
        description: 'Target platform',
      },
      appPath: {
        type: 'string',
        description: 'Absolute path to .apk (Android) or .app/.ipa (iOS). Overrides APP_PATH / IOS_APP_PATH env var.',
      },
      deviceName: {
        type: 'string',
        description: 'Device name or emulator serial (e.g. "emulator-5554", "Pixel 7"). Overrides ANDROID_DEVICE / IOS_DEVICE env var.',
      },
      appPackage: {
        type: 'string',
        description: 'Android: app package name (e.g. "com.saucelabs.rdc"). Overrides APP_PACKAGE env var.',
      },
      appActivity: {
        type: 'string',
        description: 'Android: main activity (e.g. ".MainActivity"). Overrides APP_ACTIVITY env var.',
      },
      bundleId: {
        type: 'string',
        description: 'iOS: bundle identifier (e.g. "com.example.app"). Overrides IOS_BUNDLE_ID env var.',
      },
      platformVersion: {
        type: 'string',
        description: 'iOS: OS version (e.g. "17.0"). Overrides IOS_VERSION env var.',
      },
      noReset: {
        type: 'boolean',
        description: 'If true, preserve app state between sessions. Default: false.',
      },
    },
    required: ['platform'],
  },

  async execute(args: Record<string, unknown>) {
    const platform = args.platform as string;
    const noReset = (args.noReset as boolean) ?? false;

    let caps: Record<string, unknown>;

    if (platform === 'android') {
      caps = {
        platformName: 'Android',
        'appium:automationName': 'UIAutomator2',
        'appium:deviceName': (args.deviceName as string) || process.env.ANDROID_DEVICE || 'emulator-5554',
        'appium:app': (args.appPath as string) || process.env.APP_PATH,
        'appium:appPackage': (args.appPackage as string) || process.env.APP_PACKAGE,
        'appium:appActivity': (args.appActivity as string) || process.env.APP_ACTIVITY,
        'appium:noReset': noReset,
        'appium:autoGrantPermissions': true,
        'appium:newCommandTimeout': 60,
      };
    } else {
      caps = {
        platformName: 'iOS',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': (args.deviceName as string) || process.env.IOS_DEVICE || 'iPhone 15',
        'appium:platformVersion': (args.platformVersion as string) || process.env.IOS_VERSION || '17.0',
        'appium:app': (args.appPath as string) || process.env.IOS_APP_PATH,
        'appium:bundleId': (args.bundleId as string) || process.env.IOS_BUNDLE_ID,
        'appium:noReset': noReset,
        'appium:autoAcceptAlerts': true,
        'appium:newCommandTimeout': 60,
      };
    }

    await createSession(caps);

    return {
      content: [{
        type: 'text',
        text: `App launched on ${platform}. Appium session created successfully.\nDevice: ${caps['appium:deviceName']}\nApp: ${caps['appium:app'] || caps['appium:bundleId'] || 'N/A'}`,
      }],
    };
  },
};
