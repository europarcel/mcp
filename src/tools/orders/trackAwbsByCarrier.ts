import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerTrackAwbsByCarrierTool(server: McpServer): void {
  // Create API client instance

  // Register trackAwbsByCarrier tool
  server.registerTool(
    "trackAwbsByCarrier",
    {
      title: "Track Multiple AWBs by Carrier",
      description:
        "Track multiple AWB numbers from a specific carrier. Parameters: carrier_id (required - accepts numbers like 3 and strings like '3'), awb_list (array, max 200, required), language (optional, default 'ro')",
      inputSchema: {
        carrier_id: z
          .union([
            z.literal(1),
            z.literal(2),
            z.literal(3),
            z.literal(4),
            z.literal(6),
            z.literal(16),
          ])
          .describe(
            "Carrier ID: 1=Cargus, 2=DPD, 3=FAN Courier, 4=GLS, 6=Sameday, 16=Bookurier",
          ),
        awb_list: z
          .array(z.string())
          .min(1)
          .max(200)
          .describe("Array of AWB numbers to track (1-200)"),
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
        const carrierId = args.carrier_id;
        const language = args.language || "ro";

        logger.info("Tracking AWBs by carrier", {
          carrier_id: carrierId,
          awb_count: args.awb_list.length,
          language,
        });

        const trackingInfo = await client.trackAwbsByCarrier(
          carrierId,
          args.awb_list,
          language,
        );

        logger.info(`Retrieved tracking info for ${trackingInfo.length} AWBs`);

        let formattedResponse = `📍 Tracking Results for Carrier #${carrierId} (${trackingInfo.length} AWBs):\n\n`;

        if (trackingInfo.length === 0) {
          formattedResponse +=
            "No tracking information found for the provided AWBs.";
        } else {
          trackingInfo.forEach((info) => {
            formattedResponse += `📦 AWB: ${info.awb}\n`;
            if (info.order_id) {
              formattedResponse += `   Order ID: ${info.order_id}\n`;
            }
            formattedResponse += `   Carrier: ${info.carrier}\n`;
            formattedResponse += `   Status: ${info.current_status} (ID: ${info.current_status_id})\n`;
            formattedResponse += `   Description: ${info.current_status_description}\n`;
            formattedResponse += `   Final Status: ${info.is_current_status_final ? "Yes" : "No"}\n`;
            if (info.track_url) {
              formattedResponse += `   Track URL: ${info.track_url}\n`;
            }
            if (info.reference) {
              formattedResponse += `   Reference: ${info.reference}\n`;
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
        logger.error("Failed to track AWBs", error);

        return {
          content: [
            {
              type: "text",
              text: `Error tracking AWBs: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("trackAwbsByCarrier tool registered successfully");
}
