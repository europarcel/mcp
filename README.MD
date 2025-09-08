# Europarcel MCP Server - Self-Hosted

Self-hosted MCP server for Europarcel API. Supports both stdio (Claude Desktop) and HTTP (web integrations) modes.

## 🚀 Quick Start

### Docker (HTTP Mode)
```bash
git clone https://github.com/europarcel/mcp-self-hosted.git
cd mcp-self-hosted
docker-compose up -d
```

Server runs on `http://localhost:3000`

### Local Development (Stdio Mode)
```bash
git clone https://github.com/europarcel/mcp-self-hosted.git
cd mcp-self-hosted
npm install
npm run build
EUROPARCEL_API_KEY=your-key npm start
```

### Docker Hub
```bash
docker run -d -p 3000:3000 -e MCP_TRANSPORT=http europarcel/mcp-self-hosted:latest
```

## 🔌 Usage

### HTTP Mode
All requests need your Europarcel API key in the `X-API-KEY` header:

```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-europarcel-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

## 🛠️ Available Tools

**Account**: `getProfile`  
**Addresses**: `getBillingAddresses`, `getShippingAddresses`, `getDeliveryAddresses`  
**Locations**: `getCountries`, `getCounties`, `getLocalities`, `getCarriers`, `getServices`, `getFixedLocations`, `getFixedLocationById`  
**Search**: `searchLocalities`, `searchStreets`, `postalCodeReverse`  
**Orders**: `getOrders`, `getOrderById`, `createOrder`, `cancelOrder`, `trackAwbsByCarrier`, `getOrderLabels`, `trackOrdersByIds`  
**Pricing**: `calculatePrices`, `getPricingExample`  
**Repayments**: `getRepayments`, `getPayoutReports`  

## 🔗 Integration Examples

### n8n
Use HTTP Request node:
- URL: `http://your-server:3000/`
- Method: POST
- Headers: `X-API-KEY: {{ $json.apiKey }}`
- Body: MCP JSON-RPC request

### Stdio Mode (Claude Desktop)
Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "europarcel": {
      "command": "node",
      "args": ["/path/to/mcp-self-hosted/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "EUROPARCEL_API_KEY": "your-api-key"
      }
    }
  }
}
```

## 🏗️ Local Development

```bash
npm install
npm run build
npm start
```

## 📚 API Documentation

- **Europarcel API**: https://api.europarcel.com/api/documentation
- **Get API Key**: Contact cs@europarcel.com

## 📄 License

MIT License