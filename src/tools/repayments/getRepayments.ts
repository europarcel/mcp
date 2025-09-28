import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { Repayment } from "../../types/index.js";

// Helper function to format repayment status
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "⏳ Pending",
    processing: "🔄 Processing",
    paid: "✅ Paid",
    cancelled: "❌ Cancelled",
    failed: "⚠️ Failed",
  };
  return statusMap[status] || status;
}

// Helper function to format currency amount
function formatAmount(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

export function registerGetRepaymentsTool(server: McpServer): void {
  // Create API client instance

  // Register getRepayments tool
  server.registerTool(
    "getRepayments",
    {
      title: "Get Repayments",
      description:
        "Retrieves customer repayments with AWB details, amounts, and delivery status. Parameters: page (number), order_id (number - optional filter)",
      inputSchema: {},
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
        logger.info("Fetching repayments", args);

        const response = await client.getRepayments({
          page: args.page,
          order_id: args.order_id,
        });

        logger.info(`Retrieved ${response.list.length} repayments`);

        let formattedResponse = `Found ${response.pagination.total} total repayments`;

        if (args.order_id) {
          formattedResponse += ` for order #${args.order_id}`;
        }

        formattedResponse += `\nPage ${response.pagination.current_page} of ${response.pagination.last_page}\n\n`;

        if (response.list.length === 0) {
          formattedResponse += "No repayments found.";
        } else {
          response.list.forEach((repayment: Repayment) => {
            formattedResponse += `📦 AWB: ${repayment.awb}\n`;
            formattedResponse += `   Order ID: ${repayment.order_id}\n`;
            formattedResponse += `   Carrier: ${repayment.carrier_name || repayment.carrier_id}\n`;
            formattedResponse += `   Recipient: ${repayment.recipient_name || "N/A"}\n`;
            formattedResponse += `   Amount: ${formatAmount(repayment.repayment_amount, repayment.repayment_currency)}\n`;
            formattedResponse += `   Status: ${formatStatus(repayment.status)}\n`;

            if (repayment.delivered_at) {
              formattedResponse += `   Delivered: ${repayment.delivered_at}\n`;
            }

            if (repayment.payout_id) {
              formattedResponse += `   Payout ID: ${repayment.payout_id}\n`;
              if (repayment.bank_iban) {
                formattedResponse += `   Bank: ${repayment.bank_holder || "N/A"} - ${repayment.bank_iban}\n`;
              }
            }

            formattedResponse += "\n";
          });

          // Add pagination info if there are more pages
          if (response.pagination.last_page > 1) {
            formattedResponse += `\nShowing ${response.list.length} of ${response.pagination.total} repayments`;
            if (
              response.pagination.current_page < response.pagination.last_page
            ) {
              formattedResponse += `\nUse page: ${response.pagination.current_page + 1} to see more`;
            }
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
        logger.error("Failed to fetch repayments", error);

        return {
          content: [
            {
              type: "text",
              text: `Error fetching repayments: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("getRepayments tool registered successfully");
}
