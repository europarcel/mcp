import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerGetFixedLocationsTool(server: McpServer): void {
  // Create API client instance
  
  
  // Register getFixedLocations tool
  server.registerTool(
    "getFixedLocations",
    {
      title: "Get Fixed Locations",
      description: "Retrieves fixed locations (lockers) for a country. Requires country_code. Optional filters: locality_id, carrier_id (single or comma-separated list), locality_name+county_name combination.",
      inputSchema: {
        country_code: z.string().describe("The country code (e.g., 'RO' for Romania)"),
        locality_id: z.union([z.string(), z.number()]).optional().describe("Optional locality ID to filter by"),
        carrier_id: z.union([z.string(), z.number()]).optional().describe("Optional carrier ID to filter by. Can be single ID (e.g., 1) or comma-separated list (e.g., '1,2,3')"),
        locality_name: z.string().optional().describe("Optional locality name to filter by (must be used with county_name)"),
        county_name: z.string().optional().describe("Optional county name to filter by (must be used with locality_name)")
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

        // Validate locality_name and county_name combination
        if ((args.locality_name && !args.county_name) || (!args.locality_name && args.county_name)) {
          return {
            content: [
              {
                type: "text", 
                text: "Error: locality_name and county_name must be used together"
              }
            ]
          };
        }
        
        logger.info("Fetching fixed locations", args);
        
        // Build parameters object 
        const params: any = {};
        if (args.locality_id) params.locality_id = args.locality_id;
        if (args.carrier_id) params.carrier_id = args.carrier_id;
        if (args.locality_name) params.locality_name = args.locality_name;
        if (args.county_name) params.county_name = args.county_name;
        
        const locations = await client.getFixedLocations(args.country_code, params);
        
        logger.info(`Retrieved ${locations.length} fixed locations`);
        
        let formattedResponse = `Found ${locations.length} fixed locations in ${args.country_code}`;
        
        // Show applied filters
        const filters = [];
        if (args.locality_id) filters.push(`locality_id: ${args.locality_id}`);
        if (args.locality_name && args.county_name) filters.push(`locality: ${args.locality_name}, ${args.county_name}`);
        if (args.carrier_id) filters.push(`carrier_id: ${args.carrier_id}`);
        
        if (filters.length > 0) {
          formattedResponse += ` (filtered by ${filters.join(', ')})`;
        }
        formattedResponse += ":\n\n";
        
        locations.forEach(location => {
          formattedResponse += `${location.name} (ID: ${location.id})\n`;
          formattedResponse += `  Type: ${location.fixed_location_type}\n`;
          formattedResponse += `  Carrier: ${location.carrier_name}\n`;
          formattedResponse += `  Address: ${location.address}\n`;
          formattedResponse += `  Location: ${location.locality_name}, ${location.county_name}\n`;
          formattedResponse += `  Drop-off: ${location.allows_drop_off ? 'Yes' : 'No'}\n`;
          formattedResponse += `  Coordinates: ${location.coordinates.lat}, ${location.coordinates.long}\n\n`;
        });
        
        return {
          content: [
            {
              type: "text",
              text: formattedResponse
            }
          ]
        };
      } catch (error: any) {
        logger.error("Failed to fetch fixed locations", error);
        
        return {
          content: [
            {
              type: "text",
              text: `Error fetching fixed locations: ${error.message || "Unknown error"}`
            }
          ]
        };
      }
    }
  );
  
  logger.info("getFixedLocations tool registered successfully");
} 