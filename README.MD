# Europarcel MCP Server (Hosted)

A Model Context Protocol (MCP) server for the Europarcel Public API, providing AI assistants with tools to interact with shipping and logistics services. This hosted version supports both stdio and HTTP transport modes, making it deployable as a web service.

## Features

- 🚚 **Comprehensive Shipping Tools** - 25 tools covering account, addresses, locations, orders, tracking, and pricing
- 🔐 **Secure API Integration** - Uses your own Europarcel API key
- 🌐 **HTTP Server Mode** - Run as web service with RESTful MCP endpoint
- 📡 **Dual Transport** - Supports both stdio (CLI) and HTTP (web) transport modes
- ⚡ **Stateless Design** - Each request is independent, perfect for AI assistants
- 🛠️ **Local Development** - Clone, build, and run locally
- 🤖 **AI Assistant Ready** - Works with Claude Desktop and other MCP-compatible clients

## Quick Start

### Local Development Only

```bash
# Clone and setup locally
git clone <your-repo-url>
cd EUROPARCEL-MCP-HOSTED
npm install
npm run build

# Run stdio mode (for Claude Desktop)
EUROPARCEL_API_KEY=your-api-key-here npm start

# Run HTTP server mode (for web integration)
EUROPARCEL_API_KEY=your-api-key-here MCP_TRANSPORT=http MCP_PORT=3001 npm start
```

### Local Claude Desktop Setup

Add to your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "europarcel-local": {
      "command": "node",
      "args": ["/absolute/path/to/EUROPARCEL-MCP-HOSTED/dist/index.js"],
      "env": {
        "EUROPARCEL_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Configuration

Only set your API key - everything else has sensible defaults:

```bash
export EUROPARCEL_API_KEY=your-api-key-here
```

**Optional environment variables:**
- `MCP_TRANSPORT=http` - Enable HTTP server mode (default: stdio)
- `MCP_PORT=3001` - HTTP server port (default: 3000)  
- `LOG_LEVEL=debug` - Logging level (default: info)

### HTTP Endpoint Usage

When running in HTTP mode, the server exposes a RESTful MCP endpoint at the root `/` that accepts POST requests:

```bash
# List available tools (no auth needed)
curl -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'

# Call tools with customer API key
curl -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "X-API-KEY: customer-europarcel-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "getProfile",
      "arguments": {}
    }
  }'
```

**Multi-Tenant Design:**
- Each request is completely independent and stateless
- API keys provided via `X-API-KEY` header per request
- No hardcoded credentials - each customer uses their own API key
- Perfect for n8n workflows and multi-customer deployments

**Integration with Web Applications:**
The HTTP mode makes it easy to integrate with web applications, allowing you to build custom interfaces on top of the Europarcel API tools.

## Available Tools

### Account Tools

1. **getProfile** - Retrieves complete customer profile information
   - Account details (name, email, phone)
   - Wallet balance and currency
   - Notification preferences
   - Marketing settings

### Address Tools

2. **getBillingAddresses** - Retrieves all billing addresses
   - Parameters: None
   - Returns: complete list of billing addresses with business details, VAT info, bank details

3. **getShippingAddresses** - Retrieves all shipping addresses (pickup locations)
   - Parameters: None  
   - Returns: complete list of shipping addresses with coordinates and postal codes

4. **getDeliveryAddresses** - Retrieves all delivery addresses (destination locations)
   - Parameters: None
   - Returns: complete list of delivery addresses with coordinates and postal codes

### Location Tools

5. **getCountries** - Retrieves all available countries
   - Returns: country code, name, currency, and language

6. **getCounties** - Retrieves counties for a specific country
   - Parameters: country_code (required)
   - Returns: county ID, code, and name

7. **getLocalities** - Retrieves localities for a specific country and county
   - Parameters: country_code (required), county_code (required)
   - Returns: locality ID and name

8. **getCarriers** - Retrieves all available carriers
   - Returns: carrier ID, name, and active status

9. **getServices** - Retrieves services with carrier information
    - Parameters: service_id, carrier_id, country_code (all optional)
    - Returns: service details with carrier and country information

10. **getFixedLocations** - Retrieves fixed locations (lockers) for a country
    - Parameters: country_code (required), locality_id, carrier_id (single or comma-separated), locality_name+county_name (optional)
    - Returns: locker details including coordinates and schedule

11. **getFixedLocationById** - Gets detailed information about a specific fixed location
    - Parameters: id (required)
    - Returns: complete locker details including schedule and payment type

### Repayment Tools

12. **getRepayments** - Retrieves customer repayments with payment details
    - Parameters: page (number), order_id (number - optional filter)
    - Returns: AWB, amounts, carrier info, delivery status, payout details

13. **getPayoutReports** - Gets consolidated payout reports for bank transfers
    - Parameters: page (number)
    - Returns: payout amounts, bank details, payment dates, status summary

### Search Tools

14. **searchLocalities** - Advanced locality search with intelligent matching
    - Parameters: country_code (2 letters, required), search (min 2 chars, required), per_page (15|50|100|200)
    - Supports: diacritics, punctuation, reversed county-city queries
    - Returns: locality ID, name, county information

15. **searchStreets** - Search streets within a specific locality
    - Parameters: country_code (required), locality_id (required), search (required)
    - Returns: street name, ID, and postal code

16. **postalCodeReverse** - Reverse lookup postal code to get location details
    - Parameters: country_code (required), postal_code (required)
    - Returns: locality, county, and street information for the postal code

### Order Tools

17. **getOrders** - List customer orders with tracking information
    - Parameters: page (optional), per_page (15-200, optional)
    - Returns: paginated list of orders with status, carrier, AWB details

18. **getOrderById** - Get detailed information about a specific order
   - Parameters: order_id (required)
   - Returns: complete order details, tracking history, financial breakdown

19. **createOrder** - Create a new shipping order ⚠️ **CHARGES YOUR WALLET**
   - Parameters: complete order structure (carrier_id, service_id, addresses, content, extra)
   - Returns: order details including order ID, AWB, pricing, tracking URL
   - Requirements: exact carrier/service IDs, valid addresses, correct content structure

20. **cancelOrder** - Cancel an existing order
   - Parameters: order_id (required), refund_channel ('wallet' or 'card', required)
   - Returns: cancellation status and refund details

21. **trackAwbsByCarrier** - Track multiple AWB numbers from a specific carrier
   - Parameters: carrier_id (required), awb_list (array, max 200, required), language (optional)
   - Returns: tracking status and history for each AWB

22. **getOrderLabels** - Download shipping labels for multiple orders
   - Parameters: order_ids (array, required), format ('A4' or 'A6', optional)
   - Returns: PDF containing all shipping labels (binary data)

23. **trackOrdersByIds** - Track multiple orders by their IDs
   - Parameters: order_ids (array, required), language (optional)
   - Returns: tracking information for each order

### Pricing Tools

24. **calculatePrices** - Calculate shipping prices for a shipment
   - Complex tool with specific validation requirements
   - Supports address IDs or full address details
   - Handles multiple package types (envelopes, parcels, pallets)
   - Service-specific fixed location requirements
   - Returns prices from multiple carriers with delivery estimates

25. **getPricingExample** - Get a complete pricing request example
   - Shows all required and optional fields
   - Includes helpful comments and validation notes
   - Great for learning the pricing API structure

## Usage Examples

### With Claude Desktop

After configuration, you can ask Claude:

- "Get my Europarcel profile"
- "Show me all my billing addresses"
- "Get all my shipping addresses"
- "List my delivery addresses"
- "What countries does Europarcel support?"
- "Show me all counties in Romania (RO)"
- "List localities in Bucharest county (B) in Romania"
- "What carriers are available?"
- "Show me services for carrier GLS in Romania"
- "Find fixed locations (lockers) in Romania"
- "Find lockers for carriers 1,2,3 in Bucharest, Romania"
- "Get details for fixed location ID 123"
- "Show my repayments"
- "Get repayments for order 12345"
- "Show my payout reports"
- "Search for localities named 'Bucuresti' in Romania"
- "Find streets containing 'Victoria' in locality 1234"
- "What location has postal code 010123 in Romania?"
- "Show my recent orders"
- "Get details for order 12345"
- "Cancel order 12345 with refund to wallet"
- "Create order with carrier 1, service 1, from address 123 to address 456"
- "Track AWBs 123456, 789012 from carrier 1"
- "Download shipping labels for orders 100, 101, 102"
- "Calculate shipping price from Bucharest to Cluj for 2 parcels"
- "Show me a pricing request example"

## Development

### Prerequisites

- Node.js 20+
- TypeScript 5+
- npm or yarn

### Setup

```bash
# Setup the local project
npm install
npm run build

# Development mode (stdio)
npm run dev

# Development mode (HTTP)
npm run dev:http
```

### Testing

```bash
# Run tests
npm test

# Test with MCP Inspector (stdio mode)  
EUROPARCEL_API_KEY=your-key npx @modelcontextprotocol/inspector node dist/index.js

# Test HTTP mode with curl
EUROPARCEL_API_KEY=your-key MCP_TRANSPORT=http MCP_PORT=3001 npm start &
curl -X POST http://localhost:3001/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}'
```

## API Documentation

For detailed API documentation, visit:
- Public API Docs: https://api.europarcel.com/api/documentation
- Developer Portal: https://www.eawb.ro/docs/direct

## Support

- 📧 Email: cs@europarcel.com
- 📚 Documentation: https://www.eawb.ro/docs
- 🐛 Issues: Create an issue in your project repository

## License

MIT License - see LICENSE file for details