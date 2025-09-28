import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerTrackOrdersByIdsTool(server: McpServer): void {
  // Create API client instance

  // Register trackOrdersByIds tool
  server.registerTool(
    "trackOrdersByIds",
    {
      title: "Track Multiple Orders",
      description:
        "Track multiple orders by their order IDs. Parameters: order_ids (single number/string like 6505 or '6506', array like [6505, '6506'], or JSON string like '[\"6505\"]', required), language (optional, default 'ro')",
      inputSchema: {
        order_ids: z
          .union([
            z.array(z.union([z.string(), z.number()])),
            z.string(),
            z.number(),
          ])
          .describe(
            "Single order ID, array of order IDs, or JSON string array (e.g., 6505, [6505, '6506'], or '[\"6505\"]')",
          ),
        language: z
          .string()
          .optional()
          .describe("Language for tracking responses (default: 'ro')"),
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
        if (args.order_ids === undefined || args.order_ids === null) {
          return {
            content: [
              {
                type: "text",
                text: "Error: order_ids parameter is required",
              },
            ],
          };
        }

        let orderIds;
        try {
          // Handle different input types
          if (typeof args.order_ids === "number") {
            // Single number
            orderIds = [args.order_ids];
          } else if (typeof args.order_ids === "string") {
            // Try to parse as JSON string first, if it fails treat as single string ID
            try {
              orderIds = JSON.parse(args.order_ids);
              if (!Array.isArray(orderIds)) {
                // If it's not an array after parsing, treat the original string as a single ID
                orderIds = [args.order_ids];
              }
            } catch {
              // Not valid JSON, treat as single string ID
              orderIds = [args.order_ids];
            }
          } else if (Array.isArray(args.order_ids)) {
            // Already an array
            orderIds = args.order_ids;
          } else {
            throw new Error("Invalid order_ids format");
          }
        } catch (e) {
          return {
            content: [
              {
                type: "text",
                text: "Error: order_ids must be a valid number, string, array, or JSON string",
              },
            ],
          };
        }

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "Error: order_ids must result in a non-empty array",
              },
            ],
          };
        }

        // Convert all elements to numbers and validate
        const validOrderIds = orderIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0);
        if (validOrderIds.length !== orderIds.length) {
          return {
            content: [
              {
                type: "text",
                text: "Error: all order_ids must be positive integers",
              },
            ],
          };
        }

        const language = args.language || "ro";

        logger.info("Tracking orders by IDs", {
          order_count: validOrderIds.length,
          language,
        });

        const trackingInfo = await client.trackOrdersByIds(
          validOrderIds,
          language,
        );

        logger.info(
          `Retrieved tracking info for ${trackingInfo.length} orders`,
        );

        let formattedResponse = `📍 Tracking Results for ${trackingInfo.length} Orders:\n\n`;

        if (trackingInfo.length === 0) {
          formattedResponse +=
            "No tracking information found for the provided order IDs.";
        } else {
          trackingInfo.forEach((info) => {
            formattedResponse += `📦 Order #${info.order_id} - AWB: ${info.awb}\n`;
            formattedResponse += `   Carrier: ${info.carrier} (ID: ${info.carrier_id})\n`;
            formattedResponse += `   Status: ${info.current_status} (ID: ${info.current_status_id})\n`;
            formattedResponse += `   Description: ${info.current_status_description}\n`;
            formattedResponse += `   Final Status: ${info.is_current_status_final ? "Yes" : "No"}\n`;
            if (info.track_url) {
              formattedResponse += `   Track URL: ${info.track_url}\n`;
            }
            if (info.reference) {
              formattedResponse += `   Reference: ${info.reference}\n`;
            }

            if (info.history && info.history.length > 0) {
              formattedResponse += `   Latest Event: ${new Date(info.history[0].timestamp).toLocaleString()} - ${info.history[0].status}\n`;
            }

            formattedResponse += "\n";
          });
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
        logger.error("Failed to track orders", error);

        return {
          content: [
            {
              type: "text",
              text: `Error tracking orders: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("trackOrdersByIds tool registered successfully");
}
