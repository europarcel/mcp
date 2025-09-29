# Europarcel MCP Server

<div align="center">
  <img src="https://www.eawb.ro/eawb-square.png" alt="Europarcel MCP Server" width="200" height="200">
  <h3>MCP server for Europarcel API integration</h3>
  <p>Supports Claude Desktop (stdio) and web integrations (HTTP)</p>
</div>

## Install via Docker

### For Claude Desktop (Stdio Mode)
```bash
docker run -d \
  -e MCP_TRANSPORT=stdio \
  -e EUROPARCEL_API_KEY=your-api-key \
  --name europarcel-mcp \
  europarcel/mcp:latest
```

### For Web Integrations (HTTP Mode)  
```bash
docker run -d \
  -p 3000:3000 \
  -e MCP_TRANSPORT=http \
  --name europarcel-mcp \
  europarcel/mcp:latest
```
Server runs on `http://localhost:3000`

## Install via Docker Compose

### For HTTP Mode (Web Integrations)
```yaml
# docker-compose.yml
version: '3.8'
services:
  europarcel-mcp:
    image: europarcel/mcp:latest
    container_name: europarcel-mcp
    ports:
      - "3000:3000"
    environment:
      - MCP_TRANSPORT=http
      - MCP_PORT=3000
    restart: unless-stopped
```

### For Stdio Mode (Claude Desktop)
```yaml
# docker-compose.yml
version: '3.8'
services:
  europarcel-mcp:
    image: europarcel/mcp:latest
    container_name: europarcel-mcp
    environment:
      - MCP_TRANSPORT=stdio
      - EUROPARCEL_API_KEY=your-api-key-here
    restart: unless-stopped
```

Then run:
```bash
docker-compose up -d
```

## Available Tools

**Account**: `getProfile`  
**Addresses**: `getBillingAddresses`, `getShippingAddresses`, `getDeliveryAddresses`  
**Locations**: `getCountries`, `getCounties`, `getLocalities`, `getCarriers`, `getServices`, `getFixedLocations`, `getFixedLocationById`  
**Search**: `searchLocalities`, `searchStreets`, `postalCodeReverse`  
**Orders**: `getOrders`, `getOrderById`, `createOrder`, `cancelOrder`, `trackAwbsByCarrier`, `getOrderLabels`, `trackOrdersByIds`  
**Pricing**: `calculatePrices`, `getPricingExample`  
**Repayments**: `getRepayments`, `getPayoutReports`  

## Get API Key

Contact: cs@europarcel.com

## API Documentation

https://api.europarcel.com/api/documentation

## License

MIT License