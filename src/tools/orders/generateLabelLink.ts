import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerGenerateLabelLinkTool(server: McpServer): void {
  // Create API client instance

  // Register generateLabelLink tool
  server.registerTool(
    "generateLabelLink",
    {
      title: "Generate Secure Label Download Link",
      description:
        "Generate a secure download link for a shipping label by AWB number. This calls GET /orders/label-link/{awb}. Parameter: awb (required - the AWB number as string or number). Returns a permanent secure URL that can be shared without exposing the AWB.",
      inputSchema: {
        awb: z
          .union([z.string(), z.number()])
          .describe("The AWB number to generate a label link for"),
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
        if (!args.awb) {
          return {
            content: [
              {
                type: "text",
                text: "Error: awb parameter is required",
              },
            ],
          };
        }

        const awb = String(args.awb).trim();
        if (!awb) {
          return {
            content: [
              {
                type: "text",
                text: "Error: awb must be a non-empty string or number",
              },
            ],
          };
        }

        logger.info("Generating secure label link", { awb });

        const response = await client.generateLabelLink(awb);

        logger.info("Generated secure label link successfully");

        let formattedResponse = `🔗 Secure Label Download Link Generated\n\n`;
        formattedResponse += `📦 AWB: ${response.awb}\n`;
        formattedResponse += `📄 Format: ${response.format}\n`;
        formattedResponse += `🔒 Secure Download URL:\n${response.download_url}\n\n`;
        formattedResponse += `✅ This link is permanent and secure - it doesn't expose the AWB number.\n`;
        formattedResponse += `📋 Anyone with this link can download the shipping label PDF.\n`;
        formattedResponse += `🎯 Use this URL to share labels safely or integrate with other systems.`;

        return {
          content: [
            {
              type: "text",
              text: formattedResponse,
            },
          ],
        };
      } catch (error: any) {
        logger.error("Failed to generate label link", error);

        return {
          content: [
            {
              type: "text",
              text: `Error generating label link: ${error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("generateLabelLink tool registered successfully");
}
