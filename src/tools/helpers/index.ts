import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetToolsTool } from "./getTools.js";
import { logger } from "../../utils/logger.js";

export function registerHelperTools(server: McpServer): void {
  logger.info("Registering helper tools...");

  // Register all helper-related tools
  registerGetToolsTool(server);

  logger.info("All helper tools registered successfully");
}

// Export individual registration functions if needed
export { registerGetToolsTool } from "./getTools.js";
