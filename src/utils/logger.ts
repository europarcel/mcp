// EUROPARCEL/src/utils/logger.ts
// This file provides logging functionality for the MCP server
// This file IS NOT responsible for any business logic


import * as winston from "winston";

// Create logger instance
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    // Only log to stderr to avoid interfering with MCP JSON-RPC on stdout
    new winston.transports.Console({
      stderrLevels: ['error', 'warn', 'info', 'debug'],
      silent: true
    })
  ]
}); 