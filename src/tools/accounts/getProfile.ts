import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";

export function registerGetProfileTool(server: McpServer): void {
  // Register getProfile tool
  server.registerTool(
    "getProfile",
    {
      title: "Get Customer Profile",
      description: "Retrieves the authenticated customer's complete profile information including wallet balance, notification preferences, and account settings",
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
        logger.info("Executing getProfile tool");
        
        // Call the API
        const profileData = await client.getProfile();
        
        // Type assertion to access actual API response properties
        const notifications = profileData.data.notification_settings as any;
        
        // Format the response for the AI
        const formattedResponse = `
Customer Profile Retrieved Successfully:

Account Information:
- Customer ID: ${profileData.data.customer_id}
- Name: ${profileData.data.name}
- Email: ${profileData.data.email} ${profileData.data.email_verified ? '✓ Verified' : '✗ Not verified'}
- Phone: ${profileData.data.phone || 'Not provided'} ${profileData.data.phone_verified ? '✓ Verified' : '✗ Not verified'}
- Country: ${profileData.data.billing_country}
- Language: ${profileData.data.preferred_language}
- Currency: ${profileData.data.currency}

Wallet Information:
- Balance: ${profileData.data.wallet_balance} ${profileData.data.wallet_currency}

Preferences:
- AWB Format: ${profileData.data.awb_format}
- Bank IBAN: ${profileData.data.bank_iban || 'Not configured'}
- Bank Holder: ${profileData.data.bank_holder || 'Not configured'}

Notification Settings:
- Bordero Notifications: ${notifications.receive_bordero ? 'Enabled' : 'Disabled'}
  Email: ${notifications.email_bordero}
- Prevention Email: ${notifications.prevention_email_notification ? 'Enabled' : 'Disabled'}
  Email: ${notifications.email_prevention}
- Non-Pickup Alerts: ${notifications.non_pickup_notification ? 'Enabled' : 'Disabled'}
  Email: ${notifications.email_non_pickup}
- Recipient Pickup Confirmation: ${notifications.recipient_pickup_confirmation_email ? 'Enabled' : 'Disabled'}
- Delivery Confirmation: ${notifications.delivery_confirmation_email ? 'Enabled' : 'Disabled'}
  Email: ${notifications.email_delivery_confirmation}
- Wallet Transactions: ${notifications.wallet_transaction_email ? 'Enabled' : 'Disabled'}
  Email: ${notifications.email_wallet_transaction}
- Placed Orders: ${notifications.placed_order_email ? 'Enabled' : 'Disabled'}
  Email: ${notifications.email_placed_order}
- Phone Delivery Notifications: ${notifications.phone_delivery_notification || 'Not configured'}

Marketing Preferences:
- Email Notifications: ${profileData.data.marketing_settings.email_notifications ? 'Enabled' : 'Disabled'}
- SMS Notifications: ${profileData.data.marketing_settings.sms_notifications ? 'Enabled' : 'Disabled'}
`;
        
        logger.info("getProfile tool executed successfully");
        
        return {
          content: [
            {
              type: "text",
              text: formattedResponse
            }
          ]
        };
      } catch (error) {
        logger.error("Error in getProfile tool", error);
        
        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve profile: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );
  
  logger.info("getProfile tool registered successfully");
} 