#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { logger } from "./utils/logger.js";
import { AsyncLocalStorage } from "async_hooks";
import * as dotenv from "dotenv";

// Context storage for API keys
export const apiKeyStorage = new AsyncLocalStorage<string>();

// Extend Express Request to include API key
declare global {
  namespace Express {
    interface Request {
      europarcelApiKey?: string;
    }
  }
}

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Create the MCP server
    const server = createServer();

    // Determine transport type - customers can choose stdio or http
    const transportType = process.env.MCP_TRANSPORT || "stdio";

    if (transportType === "stdio") {
      // Use stdio transport (for Claude Desktop integration)
      const transport = new StdioServerTransport();
      await server.connect(transport);
    } else if (transportType === "http") {
      // Use HTTP transport (for web integrations, n8n, etc.)
      const port = parseInt(
        process.env.PORT || process.env.MCP_PORT || "3000",
        10,
      );

      // Create Express app for HTTP transport
      const express = await import("express");
      const app = express.default();

      app.use(express.default.json());

      // Redirect GET requests (direct browser access) to configurable URL
      const redirectUrl = process.env.REDIRECT_URL || "https://europarcel.com";
      app.get("/", (_, res) => {
        res.redirect(301, redirectUrl);
      });

      // Simple stateless MCP endpoint at root - each request is independent
      app.post("/", async (req, res) => {
        try {
          // Extract API key from header
          const apiKey = req.headers["x-api-key"] as string;

          if (!apiKey) {
            res.status(401).json({
              error: "Authentication required",
              message: "X-API-KEY header is required",
            });
            return;
          }

          // Store API key in async context for tools to access
          await apiKeyStorage.run(apiKey, async () => {
            // Create fresh transport for each request - truly stateless
            const transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: undefined, // Disable session management completely
            });

            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
          });
        } catch (error) {
          logger.error("MCP request error:", error);
          res.status(500).json({ error: "Internal server error" });
        }
      });

      // Start Express server
      app.listen(port);
    } else {
      throw new Error(`Unknown transport type: ${transportType}`);
    }

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start Europarcel MCP server", error);
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  logger.error("Unhandled error", error);
  console.error("Unhandled error:", error);
  process.exit(1);
});
