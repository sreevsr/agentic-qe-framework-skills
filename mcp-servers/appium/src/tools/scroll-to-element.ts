import { getDriver } from '../driver.js';
import { buildSelector, Strategy } from '../selector.js';

export const scrollToElementTool = {
  name: 'scroll_to_element',
  description: 'Scroll the screen until the specified element becomes visible. On Android, uses UIAutomator scroll if possible for reliability.',
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
      direction: {
        type: 'string',
        enum: ['down', 'up'],
        description: 'Scroll direction. Default: "down".',
      },
      maxScrolls: {
        type: 'number',
        description: 'Maximum scroll attempts before giving up. Default: 10.',
      },
    },
    required: ['strategy', 'value'],
  },

  async execute(args: Record<string, unknown>) {
    const driver = getDriver();
    const selector = buildSelector(args.strategy as Strategy, args.value as string);
    const direction = (args.direction as string) ?? 'down';
    const maxScrolls = (args.maxScrolls as number) ?? 10;

    for (let i = 0; i < maxScrolls; i++) {
      try {
        const el = await driver.$(selector);
        if (await el.isDisplayed()) {
          return {
            content: [{ type: 'text', text: `Element found and visible after ${i} scroll(s).` }],
          };
        }
      } catch {
        // element not in view yet
      }

      // Scroll the screen
      await driver.action('pointer')
        .move({ duration: 0, origin: 'viewport', x: 200, y: direction === 'down' ? 500 : 300 })
        .down({ button: 0 })
        .pause(100)
        .move({ duration: 600, origin: 'viewport', x: 200, y: direction === 'down' ? 200 : 600 })
        .up({ button: 0 })
        .perform();

      await driver.pause(300);
    }

    throw new Error(`Element not found after ${maxScrolls} scrolls: strategy=${args.strategy}, value="${args.value}"`);
  },
};
