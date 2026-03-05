import { closeSession, hasSession } from '../driver.js';

export const closeAppTool = {
  name: 'close_app',
  description: 'Close the app and terminate the Appium session. Call this when the scenario is finished.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },

  async execute(_args: Record<string, unknown>) {
    if (!hasSession()) {
      return {
        content: [{ type: 'text', text: 'No active session to close.' }],
      };
    }
    await closeSession();
    return {
      content: [{ type: 'text', text: 'App closed. Appium session terminated.' }],
    };
  },
};
