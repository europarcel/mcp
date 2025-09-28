import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetProfileTool } from "./getProfile.js";
import { logger } from "../../utils/logger.js";

export function registerAccountTools(server: McpServer): void {
  logger.info("Registering account tools...");

  // Register all account-related tools
  registerGetProfileTool(server);

  logger.info("All account tools registered successfully");
}

// Export individual registration functions if needed
export { registerGetProfileTool } from "./getProfile.js";
