import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerGetFixedLocationByIdTool(server: McpServer): void {
  // Create API client instance

  // Register getFixedLocationById tool
  server.registerTool(
    "getFixedLocationById",
    {
      title: "Get Fixed Location by ID",
      description:
        "Retrieves detailed information about a specific fixed location. Requires id parameter.",
      inputSchema: {
        id: z.union([z.string(), z.number()]).describe("The fixed location ID"),
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
        if (!args.id) {
          return {
            content: [
              {
                type: "text",
                text: "Error: id parameter is required",
              },
            ],
          };
        }

        logger.info("Fetching fixed location by ID", { id: args.id });

        const location = await client.getFixedLocationById(args.id);

        logger.info(`Retrieved fixed location ${location.id}`);

        let formattedResponse = `Fixed Location Details:\n\n`;
        formattedResponse += `Name: ${location.name}\n`;
        formattedResponse += `ID: ${location.id}\n`;
        formattedResponse += `Type: ${location.fixed_location_type}\n`;
        formattedResponse += `Status: ${location.is_active ? "Active" : "Inactive"}\n\n`;

        formattedResponse += `Carrier: ${location.carrier_name} (ID: ${location.carrier_id})\n`;
        formattedResponse += `Address: ${location.address}\n`;
        formattedResponse += `Location: ${location.locality_name}, ${location.county_name}, ${location.country_code}\n`;
        formattedResponse += `Drop-off allowed: ${location.allows_drop_off ? "Yes" : "No"}\n`;
        formattedResponse += `Payment type: ${location.payment_type}\n\n`;

        formattedResponse += `Coordinates:\n`;
        formattedResponse += `  Latitude: ${location.coordinates.lat}\n`;
        formattedResponse += `  Longitude: ${location.coordinates.long}\n\n`;

        if (location.schedule) {
          formattedResponse += `Schedule: ${JSON.stringify(location.schedule, null, 2)}\n`;
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
        logger.error("Failed to fetch fixed location by ID", error);

        return {
          content: [
            {
              type: "text",
              text: `Error fetching fixed location: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("getFixedLocationById tool registered successfully");
}
