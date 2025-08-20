import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { BillingAddress } from "../../types/index.js";

// Helper function to format address for display
function formatAddress(address: any, type: string): string {
  let details = `${type} Address #${address.id}:
- Type: ${address.address_type}
- Contact: ${address.contact}
- Phone: ${address.phone}
- Email: ${address.email}
- Location: ${address.locality_name}, ${address.county_name} (${address.country_code})
- Street: ${address.street_name || 'N/A'} ${address.street_no}${address.street_details ? ', ' + address.street_details : ''}`;

  if (type === 'Billing' && address.address_type === 'business') {
    details += `
- Company: ${address.company || 'N/A'}
- VAT No: ${address.vat_no || 'N/A'}
- Reg Com: ${address.reg_com || 'N/A'}
- VAT Payer: ${address.vat_payer || 'N/A'}`;
  }
  
  if (type === 'Billing' && address.bank_iban) {
    details += `
- Bank IBAN: ${address.bank_iban}
- Bank: ${address.bank || 'N/A'}`;
  }
  
  details += `
- Default: ${address.is_default ? 'Yes' : 'No'}
`;
  
  return details;
}

export function registerGetBillingAddressesTool(server: McpServer): void {
  // Register getBillingAddresses tool
  server.registerTool(
    "getBillingAddresses",
    {
      title: "Get All Billing Addresses",
      description: "Retrieves all billing addresses for the authenticated customer. Returns complete list with business details, VAT info, and bank details.",
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
        logger.info("Fetching all billing addresses");
        
        const response = await client.getBillingAddresses({
          all: true
        });
        
        logger.info(`Retrieved ${response.list.length} billing addresses`);
        
        let formattedResponse = `Found ${response.meta.total} billing address${response.meta.total !== 1 ? 'es' : ''}:\n\n`;
        
        if (response.list.length === 0) {
          formattedResponse += "No billing addresses found.";
        } else {
          response.list.forEach((address: BillingAddress) => {
            formattedResponse += formatAddress(address, 'Billing') + '\n';
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
        logger.error("Failed to fetch billing addresses", error);
        
        return {
          content: [
            {
              type: "text",
              text: `Error fetching billing addresses: ${error.message || "Unknown error"}`
            }
          ]
        };
      }
    }
  );
  
  logger.info("getBillingAddresses tool registered successfully");
} 