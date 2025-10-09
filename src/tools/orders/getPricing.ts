import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EuroparcelApiClient } from "../../api/client.js";
import { logger } from "../../utils/logger.js";
import { apiKeyStorage } from "../../index.js";
import { PriceRequest } from "../../types/index.js";
import { z } from "zod";

export function registerPricingTools(server: McpServer): void {
  // Create API client instance

  // Define Zod schema for price calculation
  const PriceRequestSchema = {
    carrier_id: z
      .union([
        z.literal(0),
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(6),
        z.literal(16),
      ])
      .describe(
        "Carrier ID: 0=All carriers, 1=Cargus, 2=DPD, 3=FAN Courier, 4=GLS, 6=Sameday, 16=Bookurier",
      ),
    service_id: z
      .union([
        z.literal(0),
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
      ])
      .describe(
        "Service ID: 0=All services, 1=From home to home, 2=From home to locker, 3=From locker to home, 4=From locker to locker",
      ),
    billing_to: z.object({
      billing_address_id: z
        .number()
        .min(1)
        .describe(
          "Billing address ID (must be a billing address owned by customer)",
        ),
    }),
    address_from: z.object({
      address_from_id: z
        .number()
        .min(1)
        .optional()
        .describe("Existing shipping/delivery address ID"),
      email: z.string().email().max(100).optional().describe("Sender email"),
      phone: z.string().min(7).max(64).optional().describe("Sender phone"),
      contact: z
        .string()
        .min(5)
        .max(100)
        .optional()
        .describe("Sender contact name"),
      company: z
        .string()
        .min(5)
        .max(64)
        .optional()
        .describe("Sender company name"),
      country_code: z
        .enum(["RO"])
        .optional()
        .describe("Country code - must be 'RO' (Romania)"),
      locality_id: z.number().min(1).optional().describe("Locality ID"),
      postal_code: z.string().min(4).max(50).optional().describe("Postal code"),
      locality_name: z.string().max(100).optional().describe("Locality name"),
      county_name: z
        .string()
        .max(100)
        .optional()
        .describe("County name or code"),
      street_name: z
        .string()
        .min(5)
        .max(100)
        .optional()
        .describe("Street name"),
      street_number: z.string().max(25).optional().describe("Street number"),
      street_details: z
        .string()
        .max(50)
        .optional()
        .describe("Additional address details"),
      fixed_location_id: z
        .number()
        .min(1)
        .optional()
        .describe("Fixed location ID for services 3 & 4"),
    }),
    address_to: z.object({
      address_to_id: z
        .number()
        .min(1)
        .optional()
        .describe("Existing shipping/delivery address ID"),
      email: z.string().email().max(100).optional().describe("Recipient email"),
      phone: z.string().min(7).max(64).optional().describe("Recipient phone"),
      contact: z
        .string()
        .min(5)
        .max(100)
        .optional()
        .describe("Recipient contact name"),
      company: z
        .string()
        .min(5)
        .max(64)
        .optional()
        .describe("Recipient company name"),
      country_code: z
        .enum(["RO"])
        .optional()
        .describe("Country code - must be 'RO' (Romania)"),
      locality_id: z.number().min(1).optional().describe("Locality ID"),
      postal_code: z.string().min(4).max(50).optional().describe("Postal code"),
      locality_name: z.string().max(100).optional().describe("Locality name"),
      county_name: z
        .string()
        .max(100)
        .optional()
        .describe("County name or code"),
      street_name: z
        .string()
        .min(5)
        .max(100)
        .optional()
        .describe("Street name"),
      street_number: z.string().max(25).optional().describe("Street number"),
      street_details: z
        .string()
        .max(50)
        .optional()
        .describe("Additional address details"),
      fixed_location_id: z
        .number()
        .min(1)
        .optional()
        .describe("Fixed location ID for services 2 & 4"),
    }),
    content: z.object({
      envelopes_count: z
        .union([z.literal(0), z.literal(1)])
        .describe(
          "Number of envelopes (0 or 1 only). Exactly one of envelopes/parcels must be > 0. For envelopes: no size details needed",
        ),
      parcels_count: z
        .number()
        .min(0)
        .max(10)
        .describe(
          "Number of parcels (0-10, exactly one of envelopes/parcels must be > 0)",
        ),
      total_weight: z
        .number()
        .positive()
        .describe(
          "Total weight (must match sum of parcel weights if parcels_count > 0)",
        ),
      parcels: z
        .array(
          z.object({
            size: z.object({
              weight: z
                .number()
                .min(0)
                .max(31)
                .describe("Parcel weight (0-31 kg)"),
              width: z
                .number()
                .min(0)
                .max(100)
                .describe("Parcel width (0-100 cm)"),
              height: z
                .number()
                .min(0)
                .max(100)
                .describe("Parcel height (0-100 cm)"),
              length: z
                .number()
                .min(0)
                .max(100)
                .describe("Parcel length (0-100 cm)"),
            }),
            sequence_no: z
              .number()
              .positive()
              .describe(
                "Parcel sequence number (must be consecutive: 1, 2, 3... and match parcels_count)",
              ),
          }),
        )
        .optional()
        .describe(
          "Array of parcels (required only if parcels_count > 0, must match parcels_count length)",
        ),
    }),
    extra: z.object({
      parcel_content: z
        .string()
        .min(4)
        .max(100)
        .describe("Content description (required, 4-100 characters)"),
      internal_identifier: z
        .string()
        .optional()
        .describe("Internal order identifier"),
      sms_sender: z.boolean().optional().describe("Send SMS to sender"),
      sms_recipient: z.boolean().optional().describe("Send SMS to recipient"),
      open_package: z.boolean().optional().describe("Allow package opening"),
      return_package: z
        .boolean()
        .optional()
        .describe("Return package if delivery fails"),
      return_of_documents: z.boolean().optional().describe("Return documents"),
      insurance_amount: z
        .number()
        .min(0)
        .max(10000)
        .optional()
        .describe("Insurance amount (0-10000)"),
      insurance_amount_currency: z
        .string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .optional()
        .describe(
          "Insurance currency - 3 uppercase letters (e.g., 'RON', required if insurance_amount > 0)",
        ),
      bank_repayment_amount: z
        .number()
        .min(0)
        .max(7000)
        .optional()
        .describe("COD amount (0-7000)"),
      bank_repayment_currency: z
        .string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .optional()
        .describe(
          "COD currency - 3 uppercase letters (e.g., 'RON', required if bank_repayment_amount > 0)",
        ),
      bank_holder: z
        .string()
        .min(5)
        .max(70)
        .optional()
        .describe("Bank account holder name (5-70 characters)"),
      bank_iban: z
        .string()
        .min(15)
        .max(34)
        .optional()
        .describe(
          "Bank IBAN (15-34 characters, validated if bank_repayment_amount > 0)",
        ),
    }),
  };

  // Register calculatePrices tool
  server.registerTool(
    "calculatePrices",
    {
      title: "Calculate Shipping Prices",
      description: `Calculate shipping prices for a shipment. This is a complex tool with specific requirements:

ADDRESSES:
- Use address IDs (address_from_id, address_to_id) if available, OR provide full address details
- billing_address_id: Must be type 'billing_address'
- address_from_id/address_to_id: Must be type 'shipping_address' or 'delivery_address'
- For full addresses, provide EITHER: locality_id OR postal_code OR (locality_name + county_name)
- Required fields: country_code, contact, street_name, street_number, phone, email

CONTENT:
- EXACTLY ONE of envelopes_count or parcels_count must be > 0
- ENVELOPES: Max 1 envelope, no parcels array or size details needed
- PARCELS: If parcels_count > 0, provide parcels array with matching count
- Parcel sequence_no must be consecutive (1, 2, 3...) and match parcels_count
- Sum of parcel weights must equal total_weight

FIXED LOCATIONS:
- Service 1 & 5: No fixed locations allowed
- Service 2: Delivery location required (address_to.fixed_location_id)
- Service 3: Pickup location required (address_from.fixed_location_id)
- Service 4: Both locations required

EXTRA SERVICES:
- parcel_content is required
- Insurance: If insurance_amount > 0, insurance_amount_currency required
- Bank repayment: If bank_repayment_amount > 0, currency and IBAN required

Parameters: Full PriceRequest object (see example)`,
      inputSchema: PriceRequestSchema,
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
        // Basic validation
        if (!args || typeof args !== "object") {
          return {
            content: [
              {
                type: "text",
                text: "Error: Request body is required and must be an object",
              },
            ],
          };
        }

        // Validate required top-level fields
        const requiredFields = [
          "carrier_id",
          "service_id",
          "billing_to",
          "address_from",
          "address_to",
          "content",
          "extra",
        ];
        const missingFields = requiredFields.filter(
          (field) => !(field in args),
        );

        if (missingFields.length > 0) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Missing required fields: ${missingFields.join(", ")}`,
              },
            ],
          };
        }

        // Build price request
        const priceRequest: PriceRequest = args as PriceRequest;

        logger.info("Calculating prices", {
          carrier_id: priceRequest.carrier_id,
          service_id: priceRequest.service_id,
          from:
            priceRequest.address_from.locality_name ||
            priceRequest.address_from.locality_id ||
            priceRequest.address_from.postal_code,
          to:
            priceRequest.address_to.locality_name ||
            priceRequest.address_to.locality_id ||
            priceRequest.address_to.postal_code,
        });

        const response = await client.calculatePrices(priceRequest);

        logger.info(`Retrieved ${response.data.length} pricing options`);

        let formattedResponse = `💰 Pricing Options (${response.data.length} results):\n\n`;

        if (response.data.length === 0) {
          formattedResponse +=
            "No pricing options available for this route/configuration.";
        } else {
          // Group by carrier
          const byCarrier = response.data.reduce(
            (acc: Record<string, typeof response.data>, option) => {
              const key = option.carrier;
              if (!acc[key]) acc[key] = [];
              acc[key].push(option);
              return acc;
            },
            {},
          );

          Object.entries(byCarrier).forEach(([carrier, options]) => {
            formattedResponse += `🚚 ${carrier}:\n`;

            options.forEach((option) => {
              formattedResponse += `   📦 ${option.service_name} (Service #${option.service_id})\n`;
              formattedResponse += `      💵 Price: ${option.price.amount.toFixed(2)} + ${option.price.vat.toFixed(2)} VAT = ${option.price.total.toFixed(2)} ${option.price.currency}\n`;
              formattedResponse += `      📅 Pickup: ${option.estimated_pickup_date}\n`;
              formattedResponse += `      📅 Delivery: ${option.estimated_delivery_date}\n\n`;
            });
          });
        }

        // Add validated address information
        if (response.validation_address) {
          formattedResponse += `\n📍 Validated Addresses:\n`;
          formattedResponse += `From: ${response.validation_address.address_from.locality_name}, ${response.validation_address.address_from.county_name} (${response.validation_address.address_from.country_code})\n`;
          formattedResponse += `      Locality ID: ${response.validation_address.address_from.locality_id}`;
          if (response.validation_address.address_from.postal_code) {
            formattedResponse += `, Postal: ${response.validation_address.address_from.postal_code}`;
          }
          formattedResponse += `\n\nTo:   ${response.validation_address.address_to.locality_name}, ${response.validation_address.address_to.county_name} (${response.validation_address.address_to.country_code})\n`;
          formattedResponse += `      Locality ID: ${response.validation_address.address_to.locality_id}`;
          if (response.validation_address.address_to.postal_code) {
            formattedResponse += `, Postal: ${response.validation_address.address_to.postal_code}`;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: formattedResponse,
            },
          ],
        };
      } catch (error: any) {
        logger.error("Failed to calculate prices", error);

        // Handle validation errors
        if (error.response?.status === 400 && error.response?.data?.errors) {
          let errorMessage = "❌ Validation errors:\n\n";
          const errors = error.response.data.errors;

          Object.entries(errors).forEach(([field, messages]) => {
            errorMessage += `${field}:\n`;
            if (Array.isArray(messages)) {
              messages.forEach((msg) => {
                errorMessage += `  • ${msg}\n`;
              });
            } else {
              errorMessage += `  • ${messages}\n`;
            }
          });

          return {
            content: [
              {
                type: "text",
                text: errorMessage,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Error calculating prices: ${error.response?.data?.message || error.message || "Unknown error"}`,
            },
          ],
        };
      }
    },
  );

  logger.info("Pricing tools registered successfully");
}
