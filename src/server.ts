import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAccountTools } from "./tools/accounts/index.js";
import { registerAddressTools } from "./tools/addresses/index.js";
import { registerLocationTools } from "./tools/locations/index.js";
import { registerRepaymentTools } from "./tools/repayments/index.js";
import { registerSearchTools } from "./tools/search/index.js";
import { registerOrderTools } from "./tools/orders/index.js";
import { registerHelperTools } from "./tools/helpers/index.js";
import { logger } from "./utils/logger.js";

export function createServer(): McpServer {
  logger.info("Creating Europarcel MCP server");
  
  // Create the MCP server instance
  const server = new McpServer({
    name: "europarcel",
    description: "MCP server for Europarcel API - Shipping and logistics services",
    version: "1.0.0"
  });
  
  // Register all tools
  registerAccountTools(server);
  registerAddressTools(server);
  registerLocationTools(server);
  registerRepaymentTools(server);
  registerSearchTools(server);
  registerOrderTools(server);
  registerHelperTools(server);
  
  logger.info("Europarcel MCP server created with all tools registered");
  
  return server;
} 