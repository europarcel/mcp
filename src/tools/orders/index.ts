import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetOrdersTool } from "./getOrders.js";
import { registerGetOrderByIdTool } from "./getOrderById.js";
import { registerCancelOrderTool } from "./cancelOrder.js";
import { registerTrackAwbsByCarrierTool } from "./trackAwbsByCarrier.js";
import { registerGenerateLabelLinkTool } from "./generateLabelLink.js";
import { registerTrackOrdersByIdsTool } from "./trackOrdersByIds.js";
import { registerPricingTools } from "./getPricing.js";
import { registerCreateOrderTool } from "./createOrder.js";
import { logger } from "../../utils/logger.js";

export function registerOrderTools(server: McpServer): void {
  logger.info("Registering order tools...");

  // Register all order-related tools
  registerGetOrdersTool(server);
  registerGetOrderByIdTool(server);
  registerCancelOrderTool(server);
  registerTrackAwbsByCarrierTool(server);
  registerGenerateLabelLinkTool(server);
  registerTrackOrdersByIdsTool(server);
  registerCreateOrderTool(server);

  // Register pricing tools as well since they're order-related
  registerPricingTools(server);

  logger.info("All order tools registered successfully");
}

// Export individual registration functions if needed
export { registerGetOrdersTool } from "./getOrders.js";
export { registerCreateOrderTool } from "./createOrder.js";
export { registerGetOrderByIdTool } from "./getOrderById.js";
export { registerCancelOrderTool } from "./cancelOrder.js";
export { registerTrackAwbsByCarrierTool } from "./trackAwbsByCarrier.js";
export { registerGenerateLabelLinkTool } from "./generateLabelLink.js";
export { registerTrackOrdersByIdsTool } from "./trackOrdersByIds.js";
export { registerPricingTools } from "./getPricing.js";
