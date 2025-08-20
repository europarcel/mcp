import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { z } from "zod";

export function registerCreateOrderTool(server: McpServer): void {
  // Create API client instance
  

  // Define Zod schema for order creation - similar to pricing but with stricter requirements
  const CreateOrderSchema = {
    carrier_id: z.number().min(1).describe("Carrier ID (must be greater than 0, no 'all carriers' option)"),
    service_id: z.number().min(1).describe("Service ID (must be greater than 0, no 'all services' option)"),
    billing_to: z.object({
      billing_address_id: z.number().min(1).describe("Billing address ID (must be owned by customer)")
    }).describe("Billing information"),
    address_from: z.object({
      address_id: z.number().min(1).optional().describe("Existing address ID (shipping/delivery address owned by customer)"),
      email: z.string().email().max(100).optional().describe("Email address (required if address_id not provided)"),
      phone: z.string().min(7).max(64).optional().describe("Phone number (required if address_id not provided)"),
      contact: z.string().min(5).max(100).optional().describe("Contact name (required if address_id not provided)"),
      company: z.string().min(5).max(64).optional().describe("Company name"),
      country_code: z.string().length(2).optional().describe("Country code e.g. 'RO' (required if address_id not provided)"),
      county_name: z.string().max(100).optional().describe("County name (not required if postal_code or locality_id provided)"),
      locality_name: z.string().max(100).optional().describe("Locality name (not required if postal_code or locality_id provided)"),
      locality_id: z.number().min(1).optional().describe("Locality ID (sufficient by itself)"),
      street_name: z.string().min(5).max(100).optional().describe("Street name (required if address_id not provided)"),
      street_number: z.string().max(25).optional().describe("Street number (required if address_id not provided)"),
      street_details: z.string().max(50).optional().describe("Additional street details"),
      postal_code: z.string().min(4).max(50).optional().describe("Postal code (sufficient by itself)"),
      fixed_location_id: z.number().min(1).optional().describe("Fixed location ID for PICKUP (Service 3&4 only)")
    }).describe("From address - provide address_id OR full address details"),
    address_to: z.object({
      address_id: z.number().min(1).optional().describe("Existing address ID (shipping/delivery address owned by customer)"),
      email: z.string().email().max(100).optional().describe("Email address (required if address_id not provided)"),
      phone: z.string().min(7).max(64).optional().describe("Phone number (required if address_id not provided)"),
      contact: z.string().min(5).max(100).optional().describe("Contact name (required if address_id not provided)"),
      company: z.string().min(5).max(64).optional().describe("Company name"),
      country_code: z.string().length(2).optional().describe("Country code e.g. 'RO' (required if address_id not provided)"),
      county_name: z.string().max(100).optional().describe("County name (not required if postal_code or locality_id provided)"),
      locality_name: z.string().max(100).optional().describe("Locality name (not required if postal_code or locality_id provided)"),
      locality_id: z.number().min(1).optional().describe("Locality ID (sufficient by itself)"),
      street_name: z.string().min(5).max(100).optional().describe("Street name (required if address_id not provided)"),
      street_number: z.string().max(25).optional().describe("Street number (required if address_id not provided)"),
      street_details: z.string().max(50).optional().describe("Additional street details"),
      postal_code: z.string().min(4).max(50).optional().describe("Postal code (sufficient by itself)"),
      fixed_location_id: z.number().min(1).optional().describe("Fixed location ID for DELIVERY (Service 2&4 only)")
    }).describe("To address - provide address_id OR full address details"),
    content: z.object({
      envelopes_count: z.number().min(0).describe("Number of envelopes (exactly one of envelopes/pallets/parcels must be > 0)"),
      pallets_count: z.number().min(0).describe("Number of pallets (exactly one of envelopes/pallets/parcels must be > 0)"),
      parcels_count: z.number().min(0).describe("Number of parcels (exactly one of envelopes/pallets/parcels must be > 0)"),
      total_weight: z.number().min(0).describe("Total weight - must equal sum of individual parcel weights"),
      parcels: z.array(z.object({
        size: z.object({
          weight: z.number().min(0).describe("Parcel weight"),
          width: z.number().min(0).describe("Parcel width"),
          height: z.number().min(0).describe("Parcel height"),
          length: z.number().min(0).describe("Parcel length")
        }),
        sequence_no: z.number().min(1).describe("Parcel sequence number (consecutive: 1,2,3...)")
      })).default([]).describe("Parcel details array (required when parcels_count > 0, empty array for envelopes/pallets)")
    }).describe("Package content - exactly one count type must be > 0"),
    extra: z.object({
      parcel_content: z.string().max(100).describe("Package content description (required)"),
      sms_sender: z.boolean().optional().describe("SMS notification to sender"),
      sms_recipient: z.boolean().optional().describe("SMS notification to recipient"),
      open_package: z.boolean().optional().describe("Open package service"),
      return_package: z.boolean().optional().describe("Return package service"),
      return_of_documents: z.boolean().optional().describe("Return documents service"),
      internal_identifier: z.string().max(100).optional().describe("Internal order identifier"),
      insurance_amount: z.number().min(0).optional().describe("Insurance amount"),
      insurance_amount_currency: z.string().length(3).optional().describe("Insurance currency (required if insurance_amount > 0)"),
      bank_repayment_amount: z.number().min(0).optional().describe("COD amount"),
      bank_repayment_currency: z.string().length(3).optional().describe("COD currency (required if bank_repayment_amount > 0)"),
      bank_holder: z.string().max(200).optional().describe("Bank account holder name"),
      bank_iban: z.string().max(34).optional().describe("Bank IBAN for COD transfers")
    }).describe("Extra services and package details")
  };

  // Register createOrder tool
  server.registerTool(
    "createOrder",
    {
      title: "Create Order",
      description: "Create a new shipping order with the specified carrier and service. IMPORTANT: This will charge your wallet and create a real order! Use calculatePrices first to get quotes. Service requirements: 1&5=no fixed locations, 2=delivery location required, 3=pickup location required, 4=both locations required.",
      inputSchema: CreateOrderSchema
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
        logger.info("Creating new order", { 
          carrier_id: args.carrier_id, 
          service_id: args.service_id 
        });

        // Validate required fields
        if (!args.carrier_id || args.carrier_id <= 0) {
          throw new Error("carrier_id is required and must be greater than 0");
        }
        if (!args.service_id || args.service_id <= 0) {
          throw new Error("service_id is required and must be greater than 0");
        }
        if (!args.billing_to?.billing_address_id) {
          throw new Error("billing_to.billing_address_id is required");
        }
        if (!args.extra?.parcel_content) {
          throw new Error("extra.parcel_content is required");
        }

        // Validate content requirements
        const contentCounts = [
          args.content?.envelopes_count || 0,
          args.content?.pallets_count || 0, 
          args.content?.parcels_count || 0
        ];
        const nonZeroCounts = contentCounts.filter(count => count > 0);
        if (nonZeroCounts.length !== 1) {
          throw new Error("Exactly one of envelopes_count, pallets_count, or parcels_count must be greater than 0");
        }

        // Validate parcels array if parcels_count > 0
        if (args.content?.parcels_count > 0) {
          if (!args.content.parcels || !Array.isArray(args.content.parcels)) {
            throw new Error("parcels array is required when parcels_count > 0");
          }
          if (args.content.parcels.length !== args.content.parcels_count) {
            throw new Error("parcels array length must match parcels_count");
          }
          
          // Validate sequence numbers and total weight
          let totalWeight = 0;
          for (let i = 0; i < args.content.parcels.length; i++) {
            const parcel = args.content.parcels[i];
            if (parcel.sequence_no !== i + 1) {
              throw new Error("Parcel sequence numbers must be consecutive starting from 1");
            }
            totalWeight += parcel.size.weight;
          }
          
          if (Math.abs(totalWeight - args.content.total_weight) > 0.01) {
            throw new Error("total_weight must equal sum of individual parcel weights");
          }
        }

        // Validate insurance currency
        if (args.extra?.insurance_amount > 0 && !args.extra?.insurance_amount_currency) {
          throw new Error("insurance_amount_currency is required when insurance_amount > 0");
        }

        // Validate COD currency and IBAN
        if (args.extra?.bank_repayment_amount > 0) {
          if (!args.extra?.bank_repayment_currency) {
            throw new Error("bank_repayment_currency is required when bank_repayment_amount > 0");
          }
          if (!args.extra?.bank_iban) {
            throw new Error("bank_iban is required when bank_repayment_amount > 0");
          }
        }

        // Add parcels field if missing (always required, even for envelopes/pallets)
        if (!args.content.parcels) {
          args.content.parcels = [];
        }

        // Create the order by calling the API
        const orderResponse = await client.createOrder(args);

        logger.info("Order created successfully", {
          order_id: orderResponse.data?.order_id,
          awb: orderResponse.data?.awb_number
        });

        // Format the success response
        const responseText = `✅ ORDER CREATED SUCCESSFULLY!

📦 ORDER DETAILS:
   Order ID: ${orderResponse.data.order_id}
   AWB Number: ${orderResponse.data.awb_number}
   
🚚 SHIPPING INFO:
   Carrier: ${orderResponse.data.carrier} (ID: ${orderResponse.data.carrier_id})
   Service: ${orderResponse.data.service_name} (ID: ${orderResponse.data.service_id})
   
💰 PRICING:
   Subtotal: ${orderResponse.data.price.amount} ${orderResponse.data.price.currency}
   VAT: ${orderResponse.data.price.vat} ${orderResponse.data.price.currency}
   Total: ${orderResponse.data.price.total} ${orderResponse.data.price.currency}
   
📅 ESTIMATED DATES:
   Pickup: ${orderResponse.data.estimated_pickup_date}
   Delivery: ${orderResponse.data.estimated_delivery_date}
   
🔗 TRACKING:
   ${orderResponse.data.track_url || 'Tracking URL will be available once pickup is scheduled'}

${Object.keys(orderResponse.data.extra || {}).length > 0 ? `
🎯 EXTRA SERVICES:
${Object.entries(orderResponse.data.extra).map(([key, value]) => 
  `   ${key}: ${value}`
).join('\n')}
` : ''}
✅ Your wallet has been charged ${orderResponse.data.price.total} ${orderResponse.data.price.currency}
⚡ Order is now in the system and will be processed automatically

📍 VALIDATED ADDRESSES:
From: ${orderResponse.validation_address?.address_from?.locality_name}, ${orderResponse.validation_address?.address_from?.county_name} (${orderResponse.validation_address?.address_from?.country_code})
To: ${orderResponse.validation_address?.address_to?.locality_name}, ${orderResponse.validation_address?.address_to?.county_name} (${orderResponse.validation_address?.address_to?.country_code})
`;

        return {
          content: [
            {
              type: "text",
              text: responseText
            }
          ]
        };

      } catch (error: any) {
        logger.error("Failed to create order", error);
        
        // Parse API error response if available
        let errorMessage = error.message || "Unknown error occurred";
        
        if (error.response?.data) {
          const apiError = error.response.data;
          if (apiError.message) {
            errorMessage = apiError.message;
          }
          if (apiError.errors && typeof apiError.errors === 'object') {
            const errorDetails = Object.entries(apiError.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n');
            errorMessage += `\n\nValidation Errors:\n${errorDetails}`;
          }
          if (apiError.error_code) {
            errorMessage += `\n\nError Code: ${apiError.error_code}`;
          }
        }

        return {
          content: [
            {
              type: "text", 
              text: `❌ ORDER CREATION FAILED

${errorMessage}

💡 TROUBLESHOOTING TIPS:
• Make sure you have sufficient wallet balance
• Verify all addresses belong to your account
• Use calculatePrices first to validate the request
• For existing addresses, use address_id inside address_from/address_to objects
• Check that fixed locations match service requirements:
  - Service 1&5: No fixed locations allowed
  - Service 2: Delivery location required  
  - Service 3: Pickup location required
  - Service 4: Both locations required
• Ensure exactly one of envelopes/pallets/parcels count is > 0
• Verify parcel sequence numbers are consecutive (1,2,3...)
• Check that total_weight equals sum of parcel weights`
            }
          ]
        };
      }
    }
  );
  
  logger.info("createOrder tool registered successfully");
}
