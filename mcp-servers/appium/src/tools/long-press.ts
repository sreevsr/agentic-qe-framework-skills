import { getDriver } from '../driver.js';
import { buildSelector, Strategy } from '../selector.js';

export const longPressTool = {
  name: 'long_press',
  description: 'Long-press (touch and hold) a UI element to trigger context menus or drag handles.',
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
      duration: {
        type: 'number',
        description: 'Hold duration in milliseconds. Default: 1500.',
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
    const duration = (args.duration as number) ?? 1500;

    const el = await driver.$(selector);
    await el.waitForDisplayed({ timeout });

    const location = await el.getLocation();
    const size = await el.getSize();
    const x = Math.round(location.x + size.width / 2);
    const y = Math.round(location.y + size.height / 2);

    await driver.action('pointer')
      .move({ duration: 0, origin: 'viewport', x, y })
      .down({ button: 0 })
      .pause(duration)
      .up({ button: 0 })
      .perform();

    return {
      content: [{
        type: 'text',
        text: `Long-pressed element for ${duration}ms: strategy=${args.strategy}, value="${args.value}"`,
      }],
    };
  },
};
