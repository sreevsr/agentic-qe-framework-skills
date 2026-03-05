import { getDriver } from '../driver.js';
import { buildSelector, Strategy } from '../selector.js';

export const tapTool = {
  name: 'tap',
  description: 'Tap (click) a UI element identified by a locator strategy and value.',
  inputSchema: {
    type: 'object',
    properties: {
      strategy: {
        type: 'string',
        enum: ['accessibility_id', 'id', 'xpath', 'uiautomator', 'class_chain', 'predicate_string'],
        description: 'Locator strategy. Prefer accessibility_id > id > xpath.',
      },
      value: {
        type: 'string',
        description: 'Locator value matching the chosen strategy.',
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
    await el.click();

    return {
      content: [{
        type: 'text',
        text: `Tapped element: strategy=${args.strategy}, value="${args.value}"`,
      }],
    };
  },
};
