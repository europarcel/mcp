import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetCountriesTool } from "./getCountries.js";
import { registerGetCountiesTool } from "./getCounties.js";
import { registerGetLocalitiesTool } from "./getLocalities.js";
import { registerGetCarriersTool } from "./getCarriers.js";
import { registerGetServicesTool } from "./getServices.js";
import { registerGetFixedLocationsTool } from "./getFixedLocations.js";
import { registerGetFixedLocationByIdTool } from "./getFixedLocationById.js";
import { logger } from "../../utils/logger.js";

export function registerLocationTools(server: McpServer): void {
  logger.info("Registering location tools...");

  // Register all location-related tools
  registerGetCountriesTool(server);
  registerGetCountiesTool(server);
  registerGetLocalitiesTool(server);
  registerGetCarriersTool(server);
  registerGetServicesTool(server);
  registerGetFixedLocationsTool(server);
  registerGetFixedLocationByIdTool(server);

  logger.info("All location tools registered successfully");
}

// Export individual registration functions if needed
export { registerGetCountriesTool } from "./getCountries.js";
export { registerGetCountiesTool } from "./getCounties.js";
export { registerGetLocalitiesTool } from "./getLocalities.js";
export { registerGetCarriersTool } from "./getCarriers.js";
export { registerGetServicesTool } from "./getServices.js";
export { registerGetFixedLocationsTool } from "./getFixedLocations.js";
export { registerGetFixedLocationByIdTool } from "./getFixedLocationById.js";
