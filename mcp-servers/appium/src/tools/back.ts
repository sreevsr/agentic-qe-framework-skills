import { getDriver } from '../driver.js';

export const backTool = {
  name: 'back',
  description: 'Navigate back — press the Android back button or iOS native back. Equivalent to the device hardware back button.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },

  async execute(_args: Record<string, unknown>) {
    const driver = getDriver();

    const caps = driver.capabilities as Record<string, unknown>;
    const platform = (caps['platformName'] as string || '').toLowerCase();

    if (platform.includes('ios')) {
      await driver.executeScript('mobile: pressButton', [{ name: 'back' }]);
    } else {
      await driver.back();
    }

    return {
      content: [{ type: 'text', text: 'Navigated back.' }],
    };
  },
};
