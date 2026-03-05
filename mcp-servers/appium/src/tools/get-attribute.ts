import { getDriver } from '../driver.js';
import { buildSelector, Strategy } from '../selector.js';

export const getAttributeTool = {
  name: 'get_attribute',
  description: 'Get the value of an attribute on a UI element (e.g. "text", "content-desc", "resource-id", "enabled", "checked").',
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
      attribute: {
        type: 'string',
        description: 'Attribute name to read. Common values: "text", "content-desc", "resource-id", "class", "enabled", "checked", "selected", "bounds".',
      },
      timeout: {
        type: 'number',
        description: 'Max milliseconds to wait for the element. Default: 10000.',
      },
    },
    required: ['strategy', 'value', 'attribute'],
  },

  async execute(args: Record<string, unknown>) {
    const driver = getDriver();
    const selector = buildSelector(args.strategy as Strategy, args.value as string);
    const timeout = (args.timeout as number) ?? 10000;

    const el = await driver.$(selector);
    await el.waitForExist({ timeout });
    const attrValue = await el.getAttribute(args.attribute as string);

    return {
      content: [{
        type: 'text',
        text: `Attribute "${args.attribute}" = "${attrValue}"`,
      }],
    };
  },
};
