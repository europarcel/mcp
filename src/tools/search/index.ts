import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchLocalitiesTool } from "./searchLocalities.js";
import { registerSearchStreetsTool } from "./searchStreets.js";
import { registerPostalCodeReverseTool } from "./postalCodeReverse.js";
import { logger } from "../../utils/logger.js";

export function registerSearchTools(server: McpServer): void {
  logger.info("Registering search tools...");

  // Register all search-related tools
  registerSearchLocalitiesTool(server);
  registerSearchStreetsTool(server);
  registerPostalCodeReverseTool(server);

  logger.info("All search tools registered successfully");
}

// Export individual registration functions if needed
export { registerSearchLocalitiesTool } from "./searchLocalities.js";
export { registerSearchStreetsTool } from "./searchStreets.js";
export { registerPostalCodeReverseTool } from "./postalCodeReverse.js";
