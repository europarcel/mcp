# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port (Cloud Run sets PORT automatically)
EXPOSE 8080

# Set default environment variables for Cloud Run
ENV MCP_TRANSPORT=http
ENV MCP_PORT=8080

# No API key needed - customers provide via n8n requests

# Start the server
CMD ["npm", "start"]
