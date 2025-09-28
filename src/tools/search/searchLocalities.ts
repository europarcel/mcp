import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerSearchLocalitiesTool(server: McpServer): void {
  // Create API client instance

  // Register searchLocalities tool
  server.registerTool(
    "searchLocalities",
    {
      title: "Search Localities",
      description:
        "Search for localities by country and name. Supports diacritics, punctuation, and reversed county-city queries. Parameters: country_code (2 letters, required), search (min 2 chars, required), per_page (15|50|100|200)",
      inputSchema: {
        country_code: z
          .string()
          .length(2)
          .describe("The country code (exactly 2 letters, e.g., 'RO', 'HU')"),
        search: z
          .string()
          .min(2)
          .describe(
            "The search term for locality names (minimum 2 characters)",
          ),
        per_page: z
          .enum(["15", "50", "100", "200"])
          .or(z.number().refine((val) => [15, 50, 100, 200].includes(val)))
          .optional()
          .describe("Number of results per page (15, 50, 100, or 200)"),
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
        // Validate required parameters
        if (
          !args.country_code ||
          typeof args.country_code !== "string" ||
          args.country_code.length !== 2
        ) {
          return {
            content: [
              {
                type: "text",
                text: "Error: country_code is required and must be exactly 2 letters (e.g., 'RO', 'HU')",
              },
            ],
          };
        }

        if (
          !args.search ||
          typeof args.search !== "string" ||
          args.search.length < 2
        ) {
          return {
            content: [
              {
                type: "text",
                text: "Error: search parameter is required and must be at least 2 characters",
              },
            ],
          };
        }

        const perPage = args.per_page || 15;
        const allowedPerPage = [15, 50, 100, 200];
        if (!allowedPerPage.includes(perPage)) {
          return {
            content: [
              {
                type: "text",
                text: "Error: per_page must be one of: 15, 50, 100, 200",
              },
            ],
          };
        }

        logger.info("Searching localities", {
          country_code: args.country_code.toUpperCase(),
          search: args.search,
          per_page: perPage,
        });

        const response = await client.searchLocalities(
          args.country_code.toUpperCase(),
          args.search,
          perPage as 15 | 50 | 100 | 200,
        );

        logger.info(`Found ${response.data.length} localities`);

        let formattedResponse = `Found ${response.meta.count} localities matching "${response.meta.search_term}" in ${response.meta.country_code}:\n\n`;

        if (response.data.length === 0) {
          formattedResponse += "No localities found.";
        } else {
          response.data.forEach((locality) => {
            formattedResponse += `📍 ${locality.name_and_county}\n`;
            formattedResponse += `   ID: ${locality.id}\n`;
            formattedResponse += `   County: ${locality.county} (${locality.county_code})\n\n`;
          });

          if (response.meta.count > response.meta.per_page) {
            formattedResponse += `\nShowing first ${response.meta.per_page} results. Use per_page parameter to see more.`;
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
        logger.error("Failed to search localities", error);

        return {
          content: [
            {
              type: "text",
              text: `Error searching localities: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("searchLocalities tool registered successfully");
}
