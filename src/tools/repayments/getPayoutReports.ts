import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { PayoutReport } from "../../types/index.js";

// Helper function to format repayment status
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': '⏳ Pending',
    'processing': '🔄 Processing',
    'paid': '✅ Paid',
    'cancelled': '❌ Cancelled',
    'failed': '⚠️ Failed'
  };
  return statusMap[status] || status;
}

// Helper function to format currency amount
function formatAmount(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

export function registerGetPayoutReportsTool(server: McpServer): void {
  // Create API client instance
  
  
  // Register getPayoutReports tool
  server.registerTool(
    "getPayoutReports",
    {
      title: "Get Payout Reports",
      description: "Retrieves payout reports showing consolidated bank transfer information. Parameters: page (number)",
      inputSchema: {}
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
        logger.info("Fetching payout reports", args);
        
        const response = await client.getPayoutReports({
          page: args.page
        });
        
        logger.info(`Retrieved ${response.list.length} payout reports`);
        
        let formattedResponse = `Found ${response.pagination.total} total payout reports\n`;
        formattedResponse += `Page ${response.pagination.current_page} of ${response.pagination.last_page}\n\n`;
        
        if (response.list.length === 0) {
          formattedResponse += "No payout reports found.";
        } else {
          // Group by status
          const grouped = response.list.reduce((acc: Record<string, PayoutReport[]>, report) => {
            if (!acc[report.status]) {
              acc[report.status] = [];
            }
            acc[report.status].push(report);
            return acc;
          }, {});
          
          // Display in order: paid, processing, pending, failed, cancelled
          const statusOrder = ['paid', 'processing', 'pending', 'failed', 'cancelled'];
          
          statusOrder.forEach(status => {
            if (grouped[status] && grouped[status].length > 0) {
              formattedResponse += `\n${formatStatus(status).toUpperCase()} (${grouped[status].length})\n`;
              formattedResponse += '─'.repeat(50) + '\n';
              
              grouped[status].forEach((report: PayoutReport) => {
                formattedResponse += `\n💰 Payout #${report.payout_id}\n`;
                formattedResponse += `   Amount: ${formatAmount(report.repayment_amount, report.repayment_currency)}\n`;
                
                if (report.bank_holder && report.bank_iban) {
                  formattedResponse += `   Bank Account: ${report.bank_holder}\n`;
                  formattedResponse += `   IBAN: ${report.bank_iban}\n`;
                }
                
                if (report.paid_at) {
                  formattedResponse += `   Paid At: ${report.paid_at}\n`;
                }
              });
            }
          });
          
          // Add summary
          formattedResponse += '\n\n📊 SUMMARY:\n';
          const totalAmount = response.list.reduce((sum, report) => sum + report.repayment_amount, 0);
          const currency = response.list[0]?.repayment_currency || 'RON';
          formattedResponse += `Total Amount: ${formatAmount(totalAmount, currency)}\n`;
          
          Object.entries(grouped).forEach(([status, reports]) => {
            const statusTotal = reports.reduce((sum, report) => sum + report.repayment_amount, 0);
            formattedResponse += `${formatStatus(status)}: ${reports.length} reports (${formatAmount(statusTotal, currency)})\n`;
          });
          
          // Add pagination info if there are more pages
          if (response.pagination.last_page > 1) {
            formattedResponse += `\nShowing page ${response.pagination.current_page} of ${response.pagination.last_page}`;
            if (response.pagination.current_page < response.pagination.last_page) {
              formattedResponse += `\nUse page: ${response.pagination.current_page + 1} to see more`;
            }
          }
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
        logger.error("Failed to fetch payout reports", error);
        
        return {
          content: [
            {
              type: "text",
              text: `Error fetching payout reports: ${error.message || "Unknown error"}`
            }
          ]
        };
      }
    }
  );
  
  logger.info("getPayoutReports tool registered successfully");
} 