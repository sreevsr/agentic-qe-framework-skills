import { getDriver } from '../driver.js';
import { buildSelector, Strategy } from '../selector.js';

export const isDisplayedTool = {
  name: 'is_displayed',
  description: 'Check whether a UI element is currently visible on screen. Returns true/false without throwing if the element is absent.',
  inputSchema: {
    type: 'object',
    properties: {
      strategy: {
        type: 'string',
        enum: ['accessibility_id', 'id', 'xpath', 'uiautomator', 'class_chain', 'predicate_string'],
        description: 'Locator strategy.',
      },
      value: {
        type: 'string',
        description: 'Locator value.',
      },
    },
    required: ['strategy', 'value'],
  },

  async execute(args: Record<string, unknown>) {
    const driver = getDriver();
    const selector = buildSelector(args.strategy as Strategy, args.value as string);

    try {
      const el = await driver.$(selector);
      const displayed = await el.isDisplayed();
      return {
        content: [{
          type: 'text',
          text: `Element is_displayed: ${displayed}`,
        }],
      };
    } catch {
      return {
        content: [{ type: 'text', text: 'Element is_displayed: false (element not found)' }],
      };
    }
  },
};
