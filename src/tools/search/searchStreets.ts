import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerSearchStreetsTool(server: McpServer): void {
  // Create API client instance
  
  
  // Register searchStreets tool
  server.registerTool(
    "searchStreets",
    {
      title: "Search Streets",
      description: "Search for streets in a specific locality. Parameters: country_code (required), locality_id (required), search (required)",
      inputSchema: {
        country_code: z.string().describe("The country code (e.g., 'RO' for Romania)"),
        locality_id: z.union([z.string(), z.number()]).describe("The locality ID to search within"),
        search: z.string().describe("The search term for street names (minimum 1 character)")
      }
    },
    async (args: any) => {
      // Get API key from async context
      const apiKey = apiKeyStorage.getStore();
      
      if (!apiKey) {
        return {
          content: [
            {
              type: "text",
              text: "Error: X-API-KEY header is required"
            }
          ]
        };
      }
      
      // Create API client with customer's API key
      const client = new EuroparcelApiClient(apiKey);
      
      try {
        // Validate required parameters
        if (!args.country_code) {
          return {
            content: [
              {
                type: "text",
                text: "Error: country_code parameter is required"
              }
            ]
          };
        }
        
        if (!args.locality_id || !Number.isInteger(Number(args.locality_id))) {
          return {
            content: [
              {
                type: "text",
                text: "Error: locality_id parameter is required and must be a number"
              }
            ]
          };
        }
        
        if (!args.search || typeof args.search !== 'string' || args.search.length < 1) {
          return {
            content: [
              {
                type: "text",
                text: "Error: search parameter is required"
              }
            ]
          };
        }
        
        logger.info("Searching streets", { 
          country_code: args.country_code,
          locality_id: args.locality_id,
          search: args.search
        });
        
        const streets = await client.searchStreets(
          args.country_code.toUpperCase(),
          Number(args.locality_id),
          args.search
        );
        
        logger.info(`Found ${streets.length} streets`);
        
        let formattedResponse = `Found ${streets.length} streets matching "${args.search}" in locality #${args.locality_id}:\n\n`;
        
        if (streets.length === 0) {
          formattedResponse += "No streets found.";
        } else {
          streets.forEach(street => {
            formattedResponse += `🛣️  ${street.street_name}\n`;
            formattedResponse += `   ID: ${street.id}\n`;
            formattedResponse += `   Postal Code: ${street.postal_code}\n\n`;
          });
        }
        
        return {
          content: [
            {
              type: "text",
              text: formattedResponse
            }
          ]
        };
      } catch (error: any) {
        logger.error("Failed to search streets", error);
        
        return {
          content: [
            {
              type: "text",
              text: `Error searching streets: ${error.message || "Unknown error"}`
            }
          ]
        };
      }
    }
  );
  
  logger.info("searchStreets tool registered successfully");
} 