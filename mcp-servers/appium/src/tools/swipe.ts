import { getDriver } from '../driver.js';

export const swipeTool = {
  name: 'swipe',
  description: 'Perform a swipe gesture on the screen — either a directional swipe (up/down/left/right) or a precise coordinate swipe.',
  inputSchema: {
    type: 'object',
    properties: {
      direction: {
        type: 'string',
        enum: ['up', 'down', 'left', 'right'],
        description: 'Swipe direction (for simple directional swipes). Uses screen center with 50% scroll distance.',
      },
      startX: { type: 'number', description: 'Start X coordinate (0-100 as percentage of screen width, or absolute pixels if > 100).' },
      startY: { type: 'number', description: 'Start Y coordinate.' },
      endX: { type: 'number', description: 'End X coordinate.' },
      endY: { type: 'number', description: 'End Y coordinate.' },
      duration: {
        type: 'number',
        description: 'Swipe duration in milliseconds. Default: 800.',
      },
    },
    required: [],
  },

  async execute(args: Record<string, unknown>) {
    const driver = getDriver();
    const duration = (args.duration as number) ?? 800;

    if (args.direction) {
      // Directional swipe using WDIO's built-in gesture
      const dir = args.direction as 'up' | 'down' | 'left' | 'right';
      await driver.action('pointer')
        .move({ duration: 0, origin: 'viewport', x: 200, y: 400 })
        .down({ button: 0 })
        .pause(duration)
        .move({
          duration,
          origin: 'viewport',
          x: dir === 'left' ? 50 : dir === 'right' ? 350 : 200,
          y: dir === 'up' ? 200 : dir === 'down' ? 600 : 400,
        })
        .up({ button: 0 })
        .perform();

      return {
        content: [{ type: 'text', text: `Swiped ${args.direction}` }],
      };
    }

    // Coordinate-based swipe
    if (args.startX === undefined || args.startY === undefined || args.endX === undefined || args.endY === undefined) {
      throw new Error('Either direction or startX/startY/endX/endY coordinates are required.');
    }

    await driver.action('pointer')
      .move({ duration: 0, origin: 'viewport', x: args.startX as number, y: args.startY as number })
      .down({ button: 0 })
      .pause(100)
      .move({ duration, origin: 'viewport', x: args.endX as number, y: args.endY as number })
      .up({ button: 0 })
      .perform();

    return {
      content: [{
        type: 'text',
        text: `Swiped from (${args.startX},${args.startY}) to (${args.endX},${args.endY})`,
      }],
    };
  },
};
