import { getDriver } from '../driver.js';
import { buildSelector, Strategy } from '../selector.js';

export const typeTextTool = {
  name: 'type_text',
  description: 'Clear a text field and type the given text into it.',
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
      text: {
        type: 'string',
        description: 'Text to type into the field.',
      },
      clearFirst: {
        type: 'boolean',
        description: 'Clear the field before typing. Default: true.',
      },
      timeout: {
        type: 'number',
        description: 'Max milliseconds to wait for the element. Default: 10000.',
      },
    },
    required: ['strategy', 'value', 'text'],
  },

  async execute(args: Record<string, unknown>) {
    const driver = getDriver();
    const selector = buildSelector(args.strategy as Strategy, args.value as string);
    const timeout = (args.timeout as number) ?? 10000;
    const clearFirst = (args.clearFirst as boolean) ?? true;

    const el = await driver.$(selector);
    await el.waitForDisplayed({ timeout });

    if (clearFirst) {
      await el.clearValue();
    }
    await el.setValue(args.text as string);

    return {
      content: [{
        type: 'text',
        text: `Typed "${args.text}" into element: strategy=${args.strategy}, value="${args.value}"`,
      }],
    };
  },
};
