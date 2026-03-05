import { getDriver } from '../driver.js';
import { buildSelector, Strategy } from '../selector.js';

export const getTextTool = {
  name: 'get_text',
  description: 'Get the visible text content of a UI element.',
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
      timeout: {
        type: 'number',
        description: 'Max milliseconds to wait for the element. Default: 10000.',
      },
    },
    required: ['strategy', 'value'],
  },

  async execute(args: Record<string, unknown>) {
    const driver = getDriver();
    const selector = buildSelector(args.strategy as Strategy, args.value as string);
    const timeout = (args.timeout as number) ?? 10000;

    const el = await driver.$(selector);
    await el.waitForDisplayed({ timeout });
    const text = await el.getText();

    return {
      content: [{
        type: 'text',
        text: `Element text: "${text}"`,
      }],
    };
  },
};
