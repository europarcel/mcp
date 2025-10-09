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
        "Track multiple orders by their order IDs. Parameters: order_ids (array of order IDs, required), language (optional, default 'ro')",
      inputSchema: {
        order_ids: z
          .array(z.number().int().min(1))
          .min(1)
          .describe(
            "Array of order IDs to track (positive integers, minimum 1)",
          ),
        language: z
          .enum(["ro", "de", "en", "fr", "hu", "bg"])
          .optional()
          .describe(
            "Language for tracking responses: ro (default), de, en, fr, hu, bg",
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
        const language = args.language || "ro";

        logger.info("Tracking orders by IDs", {
          order_count: args.order_ids.length,
          language,
        });

        const trackingInfo = await client.trackOrdersByIds(
          args.order_ids,
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
