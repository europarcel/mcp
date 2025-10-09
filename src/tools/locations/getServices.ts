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
          .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
          .optional()
          .describe(
            "Optional service ID: 1=From home to home, 2=From home to locker, 3=From locker to home, 4=From locker to locker",
          ),
        carrier_id: z
          .union([
            z.literal(1),
            z.literal(2),
            z.literal(3),
            z.literal(4),
            z.literal(6),
            z.literal(16),
          ])
          .optional()
          .describe(
            "Optional carrier ID: 1=Cargus, 2=DPD, 3=FAN Courier, 4=GLS, 6=Sameday, 16=Bookurier",
          ),
        country_code: z
          .enum(["RO"])
          .optional()
          .describe("Optional country code - must be 'RO' (Romania)"),
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
