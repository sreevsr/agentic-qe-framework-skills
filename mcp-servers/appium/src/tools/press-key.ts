import { getDriver } from '../driver.js';

/**
 * Android key codes (subset of android.view.KeyEvent)
 * See: https://developer.android.com/reference/android/view/KeyEvent
 */
const ANDROID_KEY_CODES: Record<string, number> = {
  back: 4,
  home: 3,
  enter: 66,
  search: 84,
  delete: 67,      // backspace
  dpad_up: 19,
  dpad_down: 20,
  dpad_left: 21,
  dpad_right: 22,
  dpad_center: 23,
  volume_up: 24,
  volume_down: 25,
  menu: 82,
  tab: 61,
  space: 62,
};

export const pressKeyTool = {
  name: 'press_key',
  description: 'Press a hardware or keyboard key. On Android, uses key codes. On iOS, uses XCUITest key sequences.',
  inputSchema: {
    type: 'object',
    properties: {
      key: {
        type: 'string',
        description: 'Key name. Common values: "back", "home", "enter", "search", "delete", "tab", "space". Android-specific: "menu", "dpad_up/down/left/right".',
      },
      platform: {
        type: 'string',
        enum: ['android', 'ios'],
        description: 'Platform. Default: auto-detected from active session.',
      },
    },
    required: ['key'],
  },

  async execute(args: Record<string, unknown>) {
    const driver = getDriver();
    const key = (args.key as string).toLowerCase();

    // Detect platform from capabilities if not provided
    const caps = driver.capabilities as Record<string, unknown>;
    const platform = (args.platform as string) ||
      ((caps['platformName'] as string || '').toLowerCase());

    if (platform === 'android' || platform.includes('android')) {
      const keyCode = ANDROID_KEY_CODES[key];
      if (!keyCode) {
        throw new Error(`Unknown Android key: "${key}". Known keys: ${Object.keys(ANDROID_KEY_CODES).join(', ')}`);
      }
      await driver.pressKeyCode(keyCode);
    } else {
      // iOS — use XCUITest key names
      await driver.executeScript('mobile: pressButton', [{ name: key }]);
    }

    return {
      content: [{ type: 'text', text: `Pressed key: "${args.key}"` }],
    };
  },
};
