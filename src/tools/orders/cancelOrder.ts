import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerCancelOrderTool(server: McpServer): void {
  // Create API client instance

  // Register cancelOrder tool
  server.registerTool(
    "cancelOrder",
    {
      title: "Cancel Order",
      description:
        "Cancel an existing order. Parameters: order_id (required - accepts numbers like 6505 and strings like '6505'), refund_channel ('wallet' or 'card', required)",
      inputSchema: {
        order_id: z
          .union([z.string(), z.number()])
          .describe("The order ID to cancel"),
        refund_channel: z
          .enum(["wallet", "card"])
          .describe("Where to process the refund: 'wallet' or 'card'"),
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

        if (
          !args.refund_channel ||
          !["wallet", "card"].includes(args.refund_channel)
        ) {
          return {
            content: [
              {
                type: "text",
                text: "Error: refund_channel parameter is required and must be 'wallet' or 'card'",
              },
            ],
          };
        }

        logger.info("Cancelling order", {
          order_id: orderId,
          refund_channel: args.refund_channel,
        });

        const result = await client.cancelOrder(orderId, args.refund_channel);

        logger.info("Order cancellation result", result);

        let formattedResponse = result.success ? "✅ " : "❌ ";
        formattedResponse += result.message + "\n\n";

        if (result.success) {
          formattedResponse += `Order #${result.order_id} has been cancelled.\n`;
          if (result.status) {
            formattedResponse += `Status: ${result.status}\n`;
          }
          formattedResponse += `Refund will be processed to: ${args.refund_channel}\n`;

          if (result.details) {
            formattedResponse += "\nAdditional Details:\n";
            Object.entries(result.details).forEach(([key, value]) => {
              formattedResponse += `   ${key}: ${value}\n`;
            });
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
        logger.error("Failed to cancel order", error);

        return {
          content: [
            {
              type: "text",
              text: `Error cancelling order: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("cancelOrder tool registered successfully");
}
