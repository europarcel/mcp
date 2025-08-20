import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { ShippingAddress } from "../../types/index.js";

// Helper function to format address for display
function formatAddress(address: any, type: string): string {
  let details = `${type} Address #${address.id}:
- Type: ${address.address_type}
- Contact: ${address.contact}
- Phone: ${address.phone}
- Email: ${address.email}
- Location: ${address.locality_name}, ${address.county_name} (${address.country_code})
- Street: ${address.street_name || 'N/A'} ${address.street_no}${address.street_details ? ', ' + address.street_details : ''}`;

  if ((type === 'Shipping' || type === 'Delivery') && address.zipcode) {
    details += `
- Zip Code: ${address.zipcode}`;
  }
  
  if ((type === 'Shipping' || type === 'Delivery') && address.coordinates) {
    details += `
- Coordinates: ${address.coordinates.lat}, ${address.coordinates.lng}`;
  }
  
  details += `
- Default: ${address.is_default ? 'Yes' : 'No'}
`;
  
  return details;
}

export function registerGetShippingAddressesTool(server: McpServer): void {
  // Create API client instance
  
  
  // Register getShippingAddresses tool
  server.registerTool(
    "getShippingAddresses",
    {
      title: "Get All Shipping Addresses",
      description: "Retrieves all shipping addresses (pickup locations) for the authenticated customer. Returns complete list with coordinates and postal codes.",
      inputSchema: {}
    },
    async () => {
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
        logger.info("Fetching all shipping addresses");
        
        const response = await client.getShippingAddresses({
          all: true
        });
        
        logger.info(`Retrieved ${response.list.length} shipping addresses`);
        
        let formattedResponse = `Found ${response.meta.total} shipping address${response.meta.total !== 1 ? 'es' : ''}:\n\n`;
        
        if (response.list.length === 0) {
          formattedResponse += "No shipping addresses found.";
        } else {
          response.list.forEach((address: ShippingAddress) => {
            formattedResponse += formatAddress(address, 'Shipping') + '\n';
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
        logger.error("Failed to fetch shipping addresses", error);
        
        return {
          content: [
            {
              type: "text",
              text: `Error fetching shipping addresses: ${error.message || "Unknown error"}`
            }
          ]
        };
      }
    }
  );
  
  logger.info("getShippingAddresses tool registered successfully");
} 