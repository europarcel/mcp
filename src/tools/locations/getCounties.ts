import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerGetCountiesTool(server: McpServer): void {
  // Create API client instance

  // Register getCounties tool
  server.registerTool(
    "getCounties",
    {
      title: "Get Counties",
      description:
        "Retrieves counties for a specific country. Requires country_code parameter.",
      inputSchema: {
        country_code: z
          .enum(["RO"])
          .describe("The country code - must be 'RO' (Romania)"),
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
        if (!args.country_code) {
          return {
            content: [
              {
                type: "text",
                text: "Error: country_code parameter is required",
              },
            ],
          };
        }

        logger.info("Fetching counties", { country_code: args.country_code });

        const counties = await client.getCounties(args.country_code);

        logger.info(`Retrieved ${counties.length} counties`);

        let formattedResponse = `Found ${counties.length} counties in ${args.country_code}:\n\n`;

        counties.forEach((county) => {
          formattedResponse += `${county.county_name} (${county.county_code}) - ID: ${county.id}\n`;
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
        logger.error("Failed to fetch counties", error);

        return {
          content: [
            {
              type: "text",
              text: `Error fetching counties: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("getCounties tool registered successfully");
}
