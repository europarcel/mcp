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

export function registerGetOrderByIdTool(server: McpServer): void {
  // Create API client instance

  // Register getOrderById tool
  server.registerTool(
    "getOrderById",
    {
      title: "Get Order Details",
      description:
        "Get detailed information about a specific order by ID. This calls GET /orders/{order_id}. Parameter: order_id (required - the order ID, accepts both numbers like 6505 and strings like '6505')",
      inputSchema: {
        order_id: z
          .union([z.string(), z.number()])
          .describe("The order ID to retrieve details for"),
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
        if (!args.order_id) {
          return {
            content: [
              {
                type: "text",
                text: "Error: order_id parameter is required",
              },
            ],
          };
        }

        const orderId = Number(args.order_id);
        if (!Number.isInteger(orderId) || orderId <= 0) {
          return {
            content: [
              {
                type: "text",
                text: "Error: order_id must be a positive integer",
              },
            ],
          };
        }

        logger.info("Fetching order details", { order_id: orderId });

        const order = await client.getOrderById(orderId);

        logger.info("Retrieved order details");

        let formattedResponse = `📦 Order Details #${order.id}\n\n`;
        formattedResponse += `Status: ${order.order_status}\n`;
        formattedResponse += `Created: ${new Date(order.created_at).toLocaleString()}\n`;
        formattedResponse += `Updated: ${new Date(order.updated_at).toLocaleString()}\n\n`;

        formattedResponse += `🚚 Shipping Details:\n`;
        formattedResponse += `   Carrier: ${order.carrier_name} (ID: ${order.carrier_id})\n`;
        formattedResponse += `   Service: ${order.service_name} (ID: ${order.service_id})\n`;

        if (order.awb) {
          formattedResponse += `   AWB: ${order.awb}\n`;
          if (order.current_status) {
            formattedResponse += `   Current Status: ${order.current_status}\n`;
            formattedResponse += `   Description: ${order.current_status_description}\n`;
            formattedResponse += `   Final Status: ${order.is_current_status_final ? "Yes" : "No"}\n`;
          }
          if (order.track_url) {
            formattedResponse += `   Track URL: ${order.track_url}\n`;
          }
        }

        formattedResponse += `\n💰 Financial Details:\n`;
        formattedResponse += `   Subtotal: ${formatAmount(order.subtotal, order.currency)}\n`;
        formattedResponse += `   Tax: ${formatAmount(order.tax_amount, order.currency)}\n`;
        if (order.discount_amount > 0) {
          formattedResponse += `   Discount: ${formatAmount(order.discount_amount, order.currency)}\n`;
        }
        formattedResponse += `   Total: ${formatAmount(order.total_amount, order.currency)}\n`;

        if (order.repayment_amount > 0) {
          formattedResponse += `\n💵 COD Details:\n`;
          formattedResponse += `   Amount: ${formatAmount(order.repayment_amount, order.repayment_currency)}\n`;
        }

        if (order.history && order.history.length > 0) {
          formattedResponse += `\n📜 Tracking History (${order.history.length} events):\n`;
          order.history.slice(0, 5).forEach((event) => {
            formattedResponse += `   • ${new Date(event.timestamp).toLocaleString()}: ${event.status}\n`;
            if (event.location) {
              formattedResponse += `     Location: ${event.location}\n`;
            }
          });
          if (order.history.length > 5) {
            formattedResponse += `   ... and ${order.history.length - 5} more events\n`;
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
        logger.error("Failed to fetch order details", error);

        return {
          content: [
            {
              type: "text",
              text: `Error fetching order details: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("getOrderById tool registered successfully");
}
