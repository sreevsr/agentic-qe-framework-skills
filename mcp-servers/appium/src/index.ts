import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { launchAppTool } from './tools/launch-app.js';
import { closeAppTool } from './tools/close-app.js';
import { tapTool } from './tools/tap.js';
import { typeTextTool } from './tools/type-text.js';
import { getTextTool } from './tools/get-text.js';
import { getAttributeTool } from './tools/get-attribute.js';
import { isDisplayedTool } from './tools/is-displayed.js';
import { waitForElementTool } from './tools/wait-for-element.js';
import { pageSourceTool } from './tools/page-source.js';
import { screenshotTool } from './tools/screenshot.js';
import { swipeTool } from './tools/swipe.js';
import { scrollToElementTool } from './tools/scroll-to-element.js';
import { pressKeyTool } from './tools/press-key.js';
import { backTool } from './tools/back.js';
import { longPressTool } from './tools/long-press.js';

// ─── Tool Registry ───────────────────────────────────────────────────────────

const ALL_TOOLS = [
  launchAppTool,
  closeAppTool,
  tapTool,
  typeTextTool,
  getTextTool,
  getAttributeTool,
  isDisplayedTool,
  waitForElementTool,
  pageSourceTool,
  screenshotTool,
  swipeTool,
  scrollToElementTool,
  pressKeyTool,
  backTool,
  longPressTool,
];

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'appium', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  const tool = ALL_TOOLS.find((t) => t.name === name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: "${name}"` }],
      isError: true,
    };
  }

  try {
    return await tool.execute(args as Record<string, unknown>);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: 'text', text: `Tool "${name}" failed: ${message}` }],
      isError: true,
    };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is running — stdio transport handles all communication
}

main().catch((err) => {
  console.error('Appium MCP server failed to start:', err);
  process.exit(1);
});
