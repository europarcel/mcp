#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { logger } from "./utils/logger.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.EUROPARCEL_API_KEY) {
  logger.error("EUROPARCEL_API_KEY environment variable is required");
  console.error("Error: EUROPARCEL_API_KEY environment variable is required");
  console.error("Please set it using: export EUROPARCEL_API_KEY=your-api-key");
  process.exit(1);
}

async function main() {
  try {
    // Create the MCP server
    const server = createServer();
    
    // Determine transport type
    const transportType = process.env.MCP_TRANSPORT || "stdio";
    
    if (transportType === "stdio") {
      // Use stdio transport (default for CLI usage)
      logger.info("Starting Europarcel MCP server with stdio transport");
      const transport = new StdioServerTransport();
      await server.connect(transport);
      logger.info("Europarcel MCP server connected via stdio");
    } else if (transportType === "http") {
      // Use HTTP transport (for web-based clients)
      const port = parseInt(process.env.MCP_PORT || "3000", 10);
      logger.info(`Starting Europarcel MCP server with HTTP transport on port ${port}`);
      
      // Create Express app for HTTP transport
      const express = await import('express');
      const app = express.default();
      
      app.use(express.default.json());
      
      // Simple stateless MCP endpoint at root - each request is independent  
      app.post('/', async (req, res) => {
        try {
          // Create fresh transport for each request - truly stateless
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined, // Disable session management completely
          });
          
          await server.connect(transport);
          await transport.handleRequest(req, res, req.body);
        } catch (error) {
          logger.error('MCP request error:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      });
      
      // Start Express server
      app.listen(port, () => {
        logger.info(`Europarcel MCP server listening on port ${port}`);
        logger.info(`MCP endpoint available at http://localhost:${port}/`);
      });
    } else {
      throw new Error(`Unknown transport type: ${transportType}`);
    }
    
    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Shutting down Europarcel MCP server...");
      process.exit(0);
    });
    
    process.on("SIGTERM", async () => {
      logger.info("Shutting down Europarcel MCP server...");
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