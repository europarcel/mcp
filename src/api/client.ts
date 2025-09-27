import axios, { AxiosInstance, AxiosError } from "axios";
import { logger } from "../utils/logger.js";
import { 
  ApiError, 
  ProfileResponse,
  BillingAddress,
  ShippingAddress,
  DeliveryAddress,
  PaginatedAddressResponse,
  Country,
  County,
  Locality,
  Carrier,
  Service,
  FixedLocation,
  RepaymentListResponse,
  PayoutReportListResponse,
  LocalitySearchResponse,
  StreetSearchResult,
  PostalCodeResult,
  PostalCodeResponse,
  OrderListResponse,
  Order,
  CancelOrderResponse,
  AwbTrackingInfo,
  PriceRequest,
  PriceResponse,
  LabelLinkResponse
} from "../types/index.js";

export class EuroparcelApiClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.europarcel.com/api/public";
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      timeout: 30000, // 30 seconds
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error("API Request Error:", error);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError<ApiError>) => {
        const status = error.response?.status;
        const errorData = error.response?.data;
        
        logger.error(`API Error: ${status} ${error.config?.url}`, {
          error: errorData?.error,
          message: errorData?.message
        });
        
        // Transform axios error to our API error format
        if (error.response) {
          throw {
            error: errorData?.error || "API_ERROR",
            message: errorData?.message || error.message,
            status,
            details: errorData?.details
          };
        } else if (error.request) {
          throw {
            error: "NETWORK_ERROR",
            message: "Network request failed",
            status: 0
          };
        } else {
          throw {
            error: "REQUEST_ERROR",
            message: error.message,
            status: 0
          };
        }
      }
    );
  }
  
  /**
   * Get customer profile
   */
  async getProfile(): Promise<ProfileResponse> {
    const response = await this.client.get<ProfileResponse>("/account/profile");
    return response.data;
  }
  
  /**
   * Get billing addresses
   */
  async getBillingAddresses(params?: {
    page?: number;
    per_page?: 15 | 50 | 100 | 200;
    all?: boolean;
  }): Promise<PaginatedAddressResponse<BillingAddress>> {
    const response = await this.client.get<PaginatedAddressResponse<BillingAddress>>("/addresses/billing", {
      params
    });
    return response.data;
  }
  
  /**
   * Get shipping addresses
   */
  async getShippingAddresses(params?: {
    page?: number;
    per_page?: 15 | 50 | 100 | 200;
    all?: boolean;
  }): Promise<PaginatedAddressResponse<ShippingAddress>> {
    const response = await this.client.get<PaginatedAddressResponse<ShippingAddress>>("/addresses/shipping", {
      params
    });
    return response.data;
  }
  
  /**
   * Get delivery addresses
   */
  async getDeliveryAddresses(params?: {
    page?: number;
    per_page?: 15 | 50 | 100 | 200;
    all?: boolean;
  }): Promise<PaginatedAddressResponse<DeliveryAddress>> {
    const response = await this.client.get<PaginatedAddressResponse<DeliveryAddress>>("/addresses/delivery", {
      params
    });
    return response.data;
  }
  
  /**
   * Get all countries
   */
  async getCountries(): Promise<Country[]> {
    const response = await this.client.get<Country[]>("/locations/countries");
    return response.data;
  }
  
  /**
   * Get counties by country code
   */
  async getCounties(countryCode: string): Promise<County[]> {
    const response = await this.client.get<County[]>("/locations/counties", {
      params: { country_code: countryCode }
    });
    return response.data;
  }
  
  /**
   * Get localities by country and county code
   */
  async getLocalities(countryCode: string, countyCode: string): Promise<Locality[]> {
    const response = await this.client.get<Locality[]>("/locations/localities", {
      params: { 
        country_code: countryCode,
        county_code: countyCode
      }
    });
    return response.data;
  }
  
  /**
   * Get all carriers
   */
  async getCarriers(): Promise<Carrier[]> {
    const response = await this.client.get<Carrier[]>("/locations/carriers");
    return response.data;
  }
  
  /**
   * Get services with optional filters
   */
  async getServices(params?: {
    service_id?: number;
    carrier_id?: string;
    country_code?: string;
  }): Promise<Service[]> {
    const response = await this.client.get<Service[]>("/locations/services", {
      params
    });
    return response.data;
  }
  
  /**
   * Get fixed locations (lockers)
   */
  async getFixedLocations(countryCode: string, params?: {
    locality_id?: number;
    carrier_id?: number | string;
    locality_name?: string;
    county_name?: string;
  }): Promise<FixedLocation[]> {
    const response = await this.client.get<FixedLocation[]>("/locations/fixedlocations", {
      params: {
        country_code: countryCode,
        ...params
      }
    });
    return response.data;
  }
  
  /**
   * Get fixed location by ID
   */
  async getFixedLocationById(id: number): Promise<FixedLocation> {
    const response = await this.client.get<FixedLocation>(`/locations/fixedlocations/${id}`);
    return response.data;
  }
  
  /**
   * Get customer repayments
   */
  async getRepayments(params?: {
    page?: number;
    order_id?: number;
  }): Promise<RepaymentListResponse> {
    const response = await this.client.get<RepaymentListResponse>("/repayments", {
      params
    });
    return response.data;
  }
  
  /**
   * Get payout reports
   */
  async getPayoutReports(params?: {
    page?: number;
  }): Promise<PayoutReportListResponse> {
    const response = await this.client.get<PayoutReportListResponse>("/repayments/reports", {
      params
    });
    return response.data;
  }
  
  /**
   * Search localities by country and name
   */
  async searchLocalities(countryCode: string, search: string, perPage?: 15 | 50 | 100 | 200): Promise<LocalitySearchResponse> {
    const response = await this.client.get<LocalitySearchResponse>("/search/localities", {
      params: {
        country_code: countryCode,
        search,
        per_page: perPage
      }
    });
    return response.data;
  }
  
  /**
   * Search streets by country, locality and name
   */
  async searchStreets(countryCode: string, localityId: number, search: string): Promise<StreetSearchResult[]> {
    const response = await this.client.get<StreetSearchResult[]>("/search/streets", {
      params: {
        country_code: countryCode,
        locality_id: localityId,
        search
      }
    });
    return response.data;
  }
  
  /**
   * Reverse lookup postal code
   */
  async postalCodeReverse(countryCode: string, postalCode: string): Promise<PostalCodeResult[]> {
    const response = await this.client.get<PostalCodeResponse>("/search/postal-code-reverse", {
      params: {
        country_code: countryCode,
        postal_code: postalCode
      }
    });
    return response.data.data;
  }
  
  /**
   * Get list of orders
   */
  async getOrders(params?: {
    page?: number;
    per_page?: number;
  }): Promise<OrderListResponse> {
    const response = await this.client.get<OrderListResponse>("/orders", {
      params
    });
    return response.data;
  }
  
  /**
   * Get order details by ID
   */
  async getOrderById(orderId: number): Promise<Order> {
    const response = await this.client.get<Order>(`/orders/${orderId}`);
    return response.data;
  }
  
  /**
   * Cancel an order
   */
  async cancelOrder(orderId: number, refundChannel: 'wallet' | 'card'): Promise<CancelOrderResponse> {
    const response = await this.client.delete<CancelOrderResponse>(`/orders/${orderId}`, {
      params: {
        refund_channel: refundChannel
      }
    });
    return response.data;
  }
  
  /**
   * Track multiple AWBs by carrier
   */
  async trackAwbsByCarrier(carrierId: number, awbList: string[], language?: string): Promise<AwbTrackingInfo[]> {
    const response = await this.client.post<AwbTrackingInfo[]>("/orders/track-by-awb", {
      carrier_id: carrierId,
      awb_list: awbList,
      language: language || 'ro'
    });
    return response.data;
  }
  
  /**
   * Get shipping labels for multiple orders
   */
  async getOrderLabels(orderIds: number[], format?: 'A4' | 'A6'): Promise<Blob> {
    const response = await this.client.post("/orders/labels", 
      {
        order_ids: orderIds,
        format
      },
      {
        responseType: 'blob'
      }
    );
    return response.data;
  }
  
  /**
   * Generate secure download link for a single order label by AWB
   */
  async generateLabelLink(awb: string): Promise<LabelLinkResponse> {
    const response = await this.client.get<LabelLinkResponse>(`/orders/label-link/${awb}`);
    return response.data;
  }
  
  /**
   * Track multiple orders by order IDs
   */
  async trackOrdersByIds(orderIds: number[], language?: string): Promise<AwbTrackingInfo[]> {
    const response = await this.client.post<AwbTrackingInfo[]>("/orders/track-by-order", {
      order_ids: orderIds,
      language: language || 'ro'
    });
    return response.data;
  }
  
  /**
   * Calculate shipping prices
   */
  async calculatePrices(priceRequest: PriceRequest): Promise<PriceResponse> {
    const response = await this.client.post<PriceResponse>("/orders/prices", priceRequest);
    return response.data;
  }

  /**
   * Create a new order
   */
  async createOrder(orderRequest: any): Promise<any> {
    const response = await this.client.post("/orders", orderRequest);
    return response.data;
  }
} 