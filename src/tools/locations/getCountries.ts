import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";

export function registerGetCountriesTool(server: McpServer): void {
  // Create API client instance

  // Register getCountries tool
  server.registerTool(
    "getCountries",
    {
      title: "Get Countries",
      description:
        "Retrieves all available countries with their currency and language information",
      inputSchema: {},
    },
    async () => {
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
        logger.info("Fetching countries");

        const countries = await client.getCountries();

        logger.info(`Retrieved ${countries.length} countries`);

        let formattedResponse = `Found ${countries.length} countries:\n\n`;

        countries.forEach((country) => {
          formattedResponse += `${country.name} (${country.country_code})\n`;
          formattedResponse += `  Currency: ${country.currency}\n`;
          formattedResponse += `  Language: ${country.language}\n\n`;
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
        logger.error("Failed to fetch countries", error);

        return {
          content: [
            {
              type: "text",
              text: `Error fetching countries: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("getCountries tool registered successfully");
}
