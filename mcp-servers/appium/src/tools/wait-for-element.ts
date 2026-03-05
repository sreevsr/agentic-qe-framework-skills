import { getDriver } from '../driver.js';
import { buildSelector, Strategy } from '../selector.js';

export const waitForElementTool = {
  name: 'wait_for_element',
  description: 'Wait for a UI element to become visible (or hidden) before proceeding. Use this instead of fixed delays.',
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
      state: {
        type: 'string',
        enum: ['displayed', 'hidden', 'exist', 'not exist'],
        description: 'State to wait for. Default: "displayed".',
      },
      timeout: {
        type: 'number',
        description: 'Max milliseconds to wait. Default: 15000.',
      },
    },
    required: ['strategy', 'value'],
  },

  async execute(args: Record<string, unknown>) {
    const driver = getDriver();
    const selector = buildSelector(args.strategy as Strategy, args.value as string);
    const timeout = (args.timeout as number) ?? 15000;
    const state = (args.state as string) ?? 'displayed';

    const el = await driver.$(selector);

    switch (state) {
      case 'displayed':
        await el.waitForDisplayed({ timeout });
        break;
      case 'hidden':
        await el.waitForDisplayed({ timeout, reverse: true });
        break;
      case 'exist':
        await el.waitForExist({ timeout });
        break;
      case 'not exist':
        await el.waitForExist({ timeout, reverse: true });
        break;
    }

    return {
      content: [{
        type: 'text',
        text: `Element reached state "${state}": strategy=${args.strategy}, value="${args.value}"`,
      }],
    };
  },
};
