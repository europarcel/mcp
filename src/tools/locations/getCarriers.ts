import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";

export function registerGetCarriersTool(server: McpServer): void {
  // Create API client instance

  // Register getCarriers tool
  server.registerTool(
    "getCarriers",
    {
      title: "Get Carriers",
      description: "Retrieves all available carriers with their status",
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
        logger.info("Fetching carriers");

        const carriers = await client.getCarriers();

        logger.info(`Retrieved ${carriers.length} carriers`);

        let formattedResponse = `Found ${carriers.length} carriers:\n\n`;

        carriers.forEach((carrier) => {
          formattedResponse += `${carrier.name} (ID: ${carrier.id})\n`;
          formattedResponse += `  Status: ${carrier.is_active ? "Active" : "Inactive"}\n\n`;
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
        logger.error("Failed to fetch carriers", error);

        return {
          content: [
            {
              type: "text",
              text: `Error fetching carriers: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("getCarriers tool registered successfully");
}
