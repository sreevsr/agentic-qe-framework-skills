import { getDriver } from '../driver.js';

export const pageSourceTool = {
  name: 'page_source',
  description: 'Get the full XML page source (UI hierarchy) of the current screen. Use this to discover element attributes (resource-id, content-desc, text, class) for building locators.',
  inputSchema: {
    type: 'object',
    properties: {
      truncate: {
        type: 'number',
        description: 'Max characters to return (default: 50000). Increase for complex screens.',
      },
    },
    required: [],
  },

  async execute(args: Record<string, unknown>) {
    const driver = getDriver();
    const maxLength = (args.truncate as number) ?? 50000;

    const source = await driver.getPageSource();
    const truncated = source.length > maxLength
      ? source.substring(0, maxLength) + `\n\n[... truncated at ${maxLength} chars. Total length: ${source.length}]`
      : source;

    return {
      content: [{
        type: 'text',
        text: truncated,
      }],
    };
  },
};
