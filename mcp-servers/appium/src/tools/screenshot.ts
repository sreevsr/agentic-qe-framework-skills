import { getDriver } from '../driver.js';
import * as fs from 'fs';
import * as path from 'path';

export const screenshotTool = {
  name: 'screenshot',
  description: 'Take a screenshot of the current app screen. Returns the image as base64 and optionally saves it to disk.',
  inputSchema: {
    type: 'object',
    properties: {
      savePath: {
        type: 'string',
        description: 'Optional file path to save the screenshot (e.g. "screenshots/login.png"). Directory is created if it does not exist.',
      },
    },
    required: [],
  },

  async execute(args: Record<string, unknown>) {
    const driver = getDriver();
    const base64 = await driver.takeScreenshot();

    if (args.savePath) {
      const filePath = args.savePath as string;
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
    }

    return {
      content: [
        {
          type: 'image',
          data: base64,
          mimeType: 'image/png',
        },
        {
          type: 'text',
          text: args.savePath
            ? `Screenshot taken and saved to: ${args.savePath}`
            : 'Screenshot taken.',
        },
      ],
    };
  },
};
