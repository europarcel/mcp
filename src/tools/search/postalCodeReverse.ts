import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerPostalCodeReverseTool(server: McpServer): void {
  // Create API client instance
  
  
  // Register postalCodeReverse tool
  server.registerTool(
    "postalCodeReverse",
    {
      title: "Postal Code Reverse Lookup",
      description: "Get locality, county and street information for a given postal code. Parameters: country_code (required), postal_code (required)",
      inputSchema: {
        country_code: z.string().describe("The country code (e.g., 'RO' for Romania)"),
        postal_code: z.string().describe("The postal code to look up (e.g., '010123')")
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
        
        if (!args.postal_code || typeof args.postal_code !== 'string') {
          return {
            content: [
              {
                type: "text",
                text: "Error: postal_code parameter is required"
              }
            ]
          };
        }
        
        logger.info("Reverse lookup postal code", { 
          country_code: args.country_code,
          postal_code: args.postal_code
        });
        
        const results = await client.postalCodeReverse(
          args.country_code.toUpperCase(),
          args.postal_code
        );
        
        logger.info(`Found ${results.length} results for postal code`);
        
        let formattedResponse = `Results for postal code ${args.postal_code} in ${args.country_code.toUpperCase()}:\n\n`;
        
        if (results.length === 0) {
          formattedResponse += "No results found for this postal code.";
        } else {
          // Group by locality
          const groupedByLocality = results.reduce((acc: Record<number, typeof results>, result) => {
            if (!acc[result.locality_id]) {
              acc[result.locality_id] = [];
            }
            acc[result.locality_id].push(result);
            return acc;
          }, {});
          
          Object.entries(groupedByLocality).forEach(([_, localityResults]) => {
            const first = localityResults[0];
            formattedResponse += `📍 ${first.name_and_county}\n`;
            formattedResponse += `   Locality ID: ${first.locality_id}\n`;
            formattedResponse += `   County: ${first.county_name} (${first.county_code})\n`;
            formattedResponse += `   Streets:\n`;
            
            localityResults.forEach(result => {
              formattedResponse += `     • ${result.street_name}\n`;
            });
            
            formattedResponse += '\n';
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
        logger.error("Failed to reverse lookup postal code", error);
        
        return {
          content: [
            {
              type: "text",
              text: `Error looking up postal code: ${error.message || "Unknown error"}`
            }
          ]
        };
      }
    }
  );
  
  logger.info("postalCodeReverse tool registered successfully");
} 