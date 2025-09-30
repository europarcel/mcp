import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerGetServicesTool(server: McpServer): void {
  // Create API client instance

  // Register getServices tool
  server.registerTool(
    "getServices",
    {
      title: "Get Services",
      description:
        "Retrieves available services with carrier information. Optional filters: service_id, carrier_id, country_code",
      inputSchema: {
        service_id: z
          .union([z.string(), z.number()])
          .optional()
          .describe("Optional service ID to filter by"),
        carrier_id: z
          .number()
          .optional()
          .describe("Optional carrier ID to filter by"),
        country_code: z
          .string()
          .optional()
          .describe(
            "Optional country code to filter by (e.g., 'RO' for Romania)",
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
        logger.info("Fetching services", args);

        const services = await client.getServices({
          service_id: args.service_id,
          carrier_id: args.carrier_id,
          country_code: args.country_code,
        });

        logger.info(`Retrieved ${services.length} services`);

        let formattedResponse = `Found ${services.length} services`;

        if (args.service_id || args.carrier_id || args.country_code) {
          formattedResponse += " (filtered)";
        }
        formattedResponse += ":\n\n";

        services.forEach((service) => {
          formattedResponse += `${service.service_name} (ID: ${service.service_id})\n`;
          formattedResponse += `  Carrier: ${service.carrier_name} (${service.carrier_id})\n`;
          formattedResponse += `  Country: ${service.country_code}\n\n`;
        });

        return {
          content: [
            {
              type: "text",
              text: formattedResponse,
            },
          ],
        };
      } catch (error: any) {
        logger.error("Failed to fetch services", error);

        return {
          content: [
            {
              type: "text",
              text: `Error fetching services: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("getServices tool registered successfully");
}
