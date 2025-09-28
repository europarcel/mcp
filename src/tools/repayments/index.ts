import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetRepaymentsTool } from "./getRepayments.js";
import { registerGetPayoutReportsTool } from "./getPayoutReports.js";
import { logger } from "../../utils/logger.js";

export function registerRepaymentTools(server: McpServer): void {
  logger.info("Registering repayment tools...");

  // Register all repayment-related tools
  registerGetRepaymentsTool(server);
  registerGetPayoutReportsTool(server);

  logger.info("All repayment tools registered successfully");
}

// Export individual registration functions if needed
export { registerGetRepaymentsTool } from "./getRepayments.js";
export { registerGetPayoutReportsTool } from "./getPayoutReports.js";
