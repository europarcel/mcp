import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { logger } from "../../utils/logger.js";

export function registerGetToolsTool(server: McpServer): void {
  // Register getTools tool
  server.registerTool(
    "getTools",
    {
      title: "Get Available Tools",
      description:
        "Get a comprehensive list and detailed descriptions of all available MCP tools organized by category",
      inputSchema: {},
    },
    async () => {
      try {
        logger.info("Executing getTools helper");

        const toolsDocumentation = `
🛠️  **EUROPARCEL MCP TOOLS DOCUMENTATION**
═══════════════════════════════════════════════════════════════════

📊 **ACCOUNT TOOLS**
───────────────────────────────────────────────────────────────────

🔹 **getProfile**
   • Purpose: Retrieve complete customer profile information
   • Returns: Account details, wallet balance, notification preferences, marketing settings
   • Parameters: None
   • Use Case: Get full customer account overview including wallet balance

📍 **ADDRESS TOOLS**
───────────────────────────────────────────────────────────────────

🔹 **getBillingAddresses**
   • Purpose: Retrieve all billing addresses for the customer
   • Returns: Complete list of billing addresses with business details, VAT info, bank details
   • Parameters: None
   • Use Case: Get billing addresses for invoicing and payment

🔹 **getShippingAddresses**
   • Purpose: Retrieve all shipping addresses (pickup locations)
   • Returns: Complete list of shipping addresses with coordinates and postal codes
   • Parameters: None
   • Use Case: Get pickup addresses for order creation

🔹 **getDeliveryAddresses**
   • Purpose: Retrieve all delivery addresses (destination locations)
   • Returns: Complete list of delivery addresses with coordinates and postal codes
   • Parameters: None
   • Use Case: Get delivery addresses for order creation

🌍 **LOCATION & REFERENCE DATA TOOLS**
───────────────────────────────────────────────────────────────────

🔹 **getCountries**
   • Purpose: Get all available countries with currency and language info
   • Returns: Country names, codes, currencies, languages
   • Parameters: None
   • Use Case: Reference data for address creation

🔹 **getCounties**
   • Purpose: Get counties for a specific country
   • Returns: County names, codes, and IDs
   • Parameters: country_code (required, e.g., 'RO')
   • Use Case: Address validation and locality lookup

🔹 **getLocalities**
   • Purpose: Get localities (cities/towns) for a specific county
   • Returns: Locality names and IDs
   • Parameters: country_code (required), county_code (required)
   • Use Case: Address validation and precise location targeting

🔹 **getCarriers**
   • Purpose: Get all available shipping carriers
   • Returns: Carrier names, IDs, and status (active/inactive)
   • Parameters: None
   • Use Case: Choose carriers for pricing and order creation

🔹 **getServices**
   • Purpose: Get available shipping services
   • Returns: Service names, IDs, carriers, and countries
   • Parameters: service_id (optional), carrier_id (optional), country_code (optional)
   • Use Case: Choose specific shipping services for orders

🔹 **getFixedLocations**
   • Purpose: Get fixed pickup/delivery locations (lockers)
   • Returns: Location details, addresses, coordinates, schedules
   • Parameters: country_code (required), locality_id (optional), carrier_id (optional - single or comma-separated), locality_name+county_name (optional)
   • Use Case: Find pickup points and lockers for services 2, 3, 4

🔹 **getFixedLocationById**
   • Purpose: Get detailed info about a specific fixed location
   • Returns: Complete location details, schedule, capabilities
   • Parameters: id (required)
   • Use Case: Get detailed info about a specific pickup point

🔍 **SEARCH TOOLS**
───────────────────────────────────────────────────────────────────

🔹 **searchLocalities**
   • Purpose: Search for localities by name with fuzzy matching
   • Returns: Matching localities with county info in data/meta structure
   • Parameters: country_code (required, 2 letters), search (required, min 2 chars), per_page (optional: 15|50|100|200)
   • API: GET /search/localities?country_code=RO&search=bucuresti&per_page=50
   • Use Case: Find localities when creating addresses

🔹 **searchStreets**
   • Purpose: Search for streets within a specific locality
   • Returns: Street names, IDs, and postal codes (flat array)
   • Parameters: country_code (required), locality_id (required), search (required, min 2 chars)
   • API: GET /search/streets?country_code=RO&locality_id=13891&search=vic
   • Use Case: Find exact street names for precise addressing

🔹 **postalCodeReverse**
   • Purpose: Reverse lookup: get locality/streets from postal code
   • Returns: Localities, counties, and streets for the postal code in data/meta structure
   • Parameters: country_code (required), postal_code (required)
   • API: GET /search/postal-code-reverse?country_code=RO&postal_code=032111
   • Use Case: Validate and expand postal code into full address details

📦 **ORDER MANAGEMENT TOOLS**
───────────────────────────────────────────────────────────────────

🔹 **createOrder**
   • Purpose: Create a new shipping order (CHARGES YOUR WALLET!)
   • Returns: Complete order details including order ID, AWB, pricing, tracking URL
   • Parameters: Complete order structure (carrier_id, service_id, addresses, content, extra)
   • Requirements: 
     - Specific carrier_id and service_id (no 0 for 'all')
     - Valid billing address ID owned by customer
     - Complete from/to addresses (use IDs or full details)
     - Exactly one content type > 0 (envelopes/pallets/parcels)
     - Required parcel_content description
     - Fixed locations per service: 1&5=none, 2=delivery, 3=pickup, 4=both
   • Use Case: Actually place shipping orders after getting quotes

🔹 **getOrders**
   • Purpose: Get list of customer orders with tracking info
   • Returns: Orders with status, AWB, carrier, service, amounts, tracking URLs
   • Parameters: page (optional), per_page (optional, 15-200)
   • Use Case: Monitor order status and history

🔹 **getOrderById**
   • Purpose: Get detailed information about a specific order
   • Returns: Complete order details, tracking history, financial info
   • Parameters: order_id (required, number/string)
   • Use Case: Get comprehensive order details and tracking

🔹 **cancelOrder**
   • Purpose: Cancel an existing order with refund processing
   • Returns: Cancellation confirmation and refund details
   • Parameters: order_id (required), refund_channel (required: 'wallet'|'card')
   • Use Case: Cancel orders and process refunds

🔹 **generateLabelLink**
   • Purpose: Generate secure download links for individual order labels by AWB
   • Returns: Permanent secure URL that can be shared without exposing AWB numbers
   • Parameters: awb (required, string/number - the AWB number)
   • Use Case: Create shareable label download links for integration or sharing

📊 **PRICING TOOLS**
───────────────────────────────────────────────────────────────────

🔹 **calculatePrices**
   • Purpose: Calculate shipping prices for a shipment (COMPLEX TOOL)
   • Returns: Pricing options by carrier/service with dates and costs
   • Parameters: Complete PriceRequest object with addresses, content, extra services
   • Requirements:
     - Addresses: Use IDs or provide full details
     - Content: EXACTLY ONE of envelopes/pallets/parcels > 0
     - Parcels: Must provide parcels array with consecutive sequence_no
     - Fixed locations: Required for services 2,3,4
     - Extra: parcel_content required, insurance/COD with currencies
   • Use Case: Get shipping quotes before creating orders

🔹 **getPricing**
   • Purpose: Get pricing request structure and examples
   • Returns: Complete examples for different package types
   • Parameters: None
   • Use Case: Learn how to structure pricing requests

📍 **TRACKING TOOLS**
───────────────────────────────────────────────────────────────────

🔹 **trackOrdersByIds**
   • Purpose: Track multiple orders by their order IDs
   • Returns: Current status, descriptions, tracking history for each order
   • Parameters: order_ids (required, single/array/JSON string), language (optional, default 'ro')
   • Use Case: Get tracking updates for your orders

🔹 **trackAwbsByCarrier**
   • Purpose: Track multiple AWB numbers from a specific carrier
   • Returns: Tracking status and history for each AWB
   • Parameters: carrier_id (required), awb_list (required, max 200), language (optional)
   • Use Case: Track shipments using AWB numbers

💰 **FINANCIAL/REPAYMENT TOOLS**
───────────────────────────────────────────────────────────────────

🔹 **getRepayments**
   • Purpose: Get customer repayments (COD collections)
   • Returns: AWB details, amounts, delivery status, bank info
   • Parameters: page (optional), order_id (optional filter)
   • Use Case: Monitor COD collections and payments

🔹 **getPayoutReports**
   • Purpose: Get payout reports (consolidated bank transfers)
   • Returns: Bank transfer reports with amounts and status
   • Parameters: page (optional)
   • Use Case: Track consolidated bank payouts

🎯 **TOOL USAGE PATTERNS**
═══════════════════════════════════════════════════════════════════

**For Order Creation:**
1. getProfile → getBillingAddresses → getShippingAddresses/getDeliveryAddresses
2. getCarriers → getServices → getFixedLocations (if needed)
3. calculatePrices → createOrder (with selected carrier/service)

**For Address Management:**
1. getCountries → getCounties → getLocalities
2. searchLocalities → searchStreets
3. postalCodeReverse (for validation)

**For Order Monitoring:**
1. getOrders → getOrderById
2. trackOrdersByIds → trackAwbsByCarrier
3. generateLabelLink (for secure label sharing)

**For Financial Tracking:**
1. getProfile (includes wallet balance)
2. getRepayments → getPayoutReports

📋 **NOTES:**
• All tools handle error validation and provide detailed error messages
• createOrder charges your wallet - use calculatePrices first to get quotes!
• Pricing tool is complex - use getPricing first to understand structure
• Address tools return ALL addresses automatically
• Address IDs are preferred over full address details for performance
• Fixed locations are required for services 2 (delivery), 3 (pickup), 4 (both)
• COD and insurance require currency specifications
• Search tools support pagination with per_page parameters
• Order creation requires exact carrier_id/service_id (no 0 for 'all' options)
`;

        logger.info("getTools helper executed successfully");

        return {
          content: [
            {
              type: "text",
              text: toolsDocumentation,
            },
          ],
        };
      } catch (error) {
        logger.error("Error in getTools helper", error);

        return {
          content: [
            {
              type: "text",
              text: `Failed to retrieve tools documentation: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  logger.info("getTools helper tool registered successfully");
}
