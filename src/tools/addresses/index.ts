import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetBillingAddressesTool } from "./getBillingAddresses.js";
import { registerGetShippingAddressesTool } from "./getShippingAddresses.js";
import { registerGetDeliveryAddressesTool } from "./getDeliveryAddresses.js";
import { logger } from "../../utils/logger.js";

export function registerAddressTools(server: McpServer): void {
  logger.info("Registering address tools...");

  // Register all address-related tools
  registerGetBillingAddressesTool(server);
  registerGetShippingAddressesTool(server);
  registerGetDeliveryAddressesTool(server);

  logger.info("All address tools registered successfully");
}

// Export individual registration functions if needed
export { registerGetBillingAddressesTool } from "./getBillingAddresses.js";
export { registerGetShippingAddressesTool } from "./getShippingAddresses.js";
export { registerGetDeliveryAddressesTool } from "./getDeliveryAddresses.js";
