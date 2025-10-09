import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

// Helper function to format currency
const formatAmount = (amount: number | string, currency: string): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${numAmount.toFixed(2)} ${currency}`;
};

// Helper function to format order status
const formatOrderStatus = (order: any): string => {
  let status = `📦 Order #${order.id}\n`;
  status += `   Status: ${order.order_status}\n`;
  status += `   Carrier: ${order.carrier_name} (ID: ${order.carrier_id})\n`;
  status += `   Service: ${order.service_name} (ID: ${order.service_id})\n`;
  status += `   Total: ${formatAmount(order.total_amount, order.currency)}\n`;

  if (order.awb) {
    status += `   AWB: ${order.awb}\n`;
    if (order.current_status) {
      status += `   Tracking: ${order.current_status}${order.is_current_status_final ? " (Final)" : ""}\n`;
    }
    if (order.track_url) {
      status += `   Track URL: ${order.track_url}\n`;
    }
  }

  if (order.repayment_amount > 0) {
    status += `   COD: ${formatAmount(order.repayment_amount, order.repayment_currency)}\n`;
  }

  return status;
};

export function registerGetOrdersTool(server: McpServer): void {
  // Create API client instance

  // Register getOrders tool
  server.registerTool(
    "getOrders",
    {
      title: "Get Orders List",
      description:
        "Get list of customer orders with tracking information. Parameters: page (optional), per_page (15-200, optional)",
      inputSchema: {
        page: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Page number for pagination (default: 1)"),
        per_page: z
          .union([
            z.literal(15),
            z.literal(50),
            z.literal(100),
            z.literal(200),
          ])
          .optional()
          .describe(
            "Number of orders per page - must be 15, 50, 100, or 200 (default: 15)",
          ),
      },
    },
    async (args: any) => {
      // Get API key from async context
      const apiKey = apiKeyStorage.getStore();

      if (!apiKey) {
        return {
          content: [
            {
              type: "text",
              text: "Error: X-API-KEY header is required",
            },
          ],
        };
      }

      // Create API client with customer's API key
      const client = new EuroparcelApiClient(apiKey);

      try {
        const page = args.page || 1;
        const perPage = args.per_page || 15;

        logger.info("Fetching orders", { page, per_page: perPage });

        const response = await client.getOrders({
          page,
          per_page: perPage,
        });

        logger.info(`Retrieved ${response.list.length} orders`);

        let formattedResponse = `📋 Orders (Page ${response.pagination.current_page}/${response.pagination.last_page}):\n\n`;

        if (response.list.length === 0) {
          formattedResponse += "No orders found.";
        } else {
          response.list.forEach((order) => {
            formattedResponse += formatOrderStatus(order) + "\n";
          });

          formattedResponse += `\nShowing ${response.list.length} of ${response.pagination.total} total orders.`;

          if (
            response.pagination.current_page < response.pagination.last_page
          ) {
            formattedResponse += `\nUse page parameter to see more (next page: ${response.pagination.current_page + 1}).`;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: formattedResponse,
            },
          ],
        };
      } catch (error: any) {
        logger.error("Failed to fetch orders", error);

        return {
          content: [
            {
              type: "text",
              text: `Error fetching orders: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("getOrders tool registered successfully");
}
