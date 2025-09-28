// Label link types
export interface LabelLinkResponse {
  download_url: string;
  awb: string;
  format: string;
}

// Profile types
export interface CustomerProfile {
  customer_id: number;
  name: string;
  email: string;
  billing_country: string;
  preferred_language: string;
  currency: string;
  awb_format: string;
  bank_iban: string | null;
  bank_holder: string | null;
  email_verified: boolean;
  phone: string | null;
  phone_verified: boolean;
  wallet_balance: number;
  wallet_currency: string;
  notification_settings: NotificationSettings;
  marketing_settings: MarketingSettings;
}

export interface NotificationSettings {
  receive_delivery_alerts: boolean;
  email_delivery_alerts: string;
  receive_bordero: boolean;
  email_bordero: string;
  confirmation_alert: boolean;
  email_confirmation: string;
  sms_recipient_notification: boolean;
  phone_delivery_notification?: string;
}

export interface MarketingSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
}

// Address types
export interface Address {
  id: number;
  address_type: "individual" | "business";
  country_code: string;
  locality_id: number;
  street_id: number | null;
  street_name: string | null;
  street_no: string;
  street_details: string | null;
  contact: string;
  phone: string;
  email: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  locality_name: string;
  county_id: number;
  county_code: string;
  county_name: string;
}

export interface BillingAddress extends Address {
  company?: string | null;
  vat_no?: string | null;
  reg_com?: string | null;
  vat_payer?: string | null;
  cnp?: string | null;
  bank_iban?: string | null;
  bank?: string | null;
}

export interface ShippingAddress extends Address {
  zipcode: string;
  company?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
}

export interface DeliveryAddress extends ShippingAddress {
  // Delivery addresses have the same structure as shipping addresses
}

export interface PaginatedAddressResponse<T extends Address> {
  list: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

// Location types
export interface Country {
  country_code: string;
  name: string;
  currency: string;
  language: string;
}

export interface County {
  id: number;
  county_code: string;
  county_name: string;
}

export interface Locality {
  id: number;
  name: string;
  county_code: string;
  county_name: string;
}

export interface Carrier {
  id: string;
  is_active: boolean;
  name: string;
}

export interface Service {
  service_id: number;
  service_name: string;
  carrier_id: string;
  carrier_name: string;
  country_code: string;
}

export interface FixedLocation {
  id: number;
  fixed_location_type: string;
  carrier_id: number;
  carrier_name: string;
  locality_id: number;
  locality_name: string;
  county_id: number;
  county_name: string;
  country_code: string;
  name: string;
  address: string;
  allows_drop_off: boolean;
  is_active: boolean;
  coordinates: {
    lat: number;
    long: number;
  };
  schedule: any;
  payment_type: string;
}

// Repayment types
export interface Repayment {
  awb: string;
  order_id: number;
  carrier_id: string;
  carrier_name: string | null;
  repayment_amount: number;
  repayment_currency: string;
  status: "pending" | "paid" | "cancelled";
  payout_id: number | null;
  bank_iban: string | null;
  bank_holder: string | null;
  recipient_name: string | null;
  delivered_at: string | null;
}

export interface PayoutReport {
  payout_id: number;
  bank_holder: string | null;
  bank_iban: string | null;
  repayment_amount: number;
  repayment_currency: string;
  status: "pending" | "processing" | "paid" | "failed" | "cancelled";
  paid_at: string | null;
}

export interface RepaymentListResponse {
  list: Repayment[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface PayoutReportListResponse {
  list: PayoutReport[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

// Search types
export interface LocalitySearchResult {
  id: number;
  name: string;
  county: string;
  name_and_county: string;
  county_code: string;
}

export interface LocalitySearchResponse {
  data: LocalitySearchResult[];
  meta: {
    count: number;
    per_page: number;
    country_code: string;
    search_term: string;
  };
}

export interface StreetSearchResult {
  id: number;
  street_name: string;
  postal_code: string;
}

export interface PostalCodeResult {
  locality_id: number;
  locality_name: string;
  name_and_county: string;
  county_name: string;
  county_code: string;
  street_name: string;
}

export interface PostalCodeResponse extends Array<PostalCodeResult> {}

// Order types
export interface OrderHistoryItem {
  status_id: number;
  status: string;
  status_description: string;
  is_final_status: boolean;
  timestamp: string;
  location: string;
}

export interface Order {
  id: string;
  order_status: string;
  carrier_id: number;
  carrier_name: string;
  service_id: number;
  service_name: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  repayment_currency: string;
  repayment_amount: number;
  awb: string;
  current_status_id: number | null;
  current_status: string | null;
  current_status_description: string | null;
  is_current_status_final: boolean;
  track_url: string | null;
  history: OrderHistoryItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  list: Order[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface CancelOrderResponse {
  success: boolean;
  order_id: number;
  status?: string;
  message: string;
  details?: any;
}

export interface AwbTrackingInfo {
  order_id?: number;
  carrier_id: number;
  carrier: string;
  awb: string;
  track_url: string;
  current_status: string;
  current_status_id: number;
  current_status_description: string;
  is_current_status_final: boolean;
  reference: string;
  history: OrderHistoryItem[];
}

// Pricing types
export interface PriceAddress {
  address_from_id?: number | null;
  address_to_id?: number | null;
  email?: string;
  phone?: string;
  contact?: string;
  company?: string;
  country_code?: string;
  county_name?: string;
  locality_name?: string;
  locality_id?: number;
  street_name?: string;
  street_number?: string;
  street_details?: string;
  postal_code?: string;
  fixed_location_id?: number;
}

export interface PriceContent {
  envelopes_count: number;
  pallets_count: number;
  parcels_count: number;
  total_weight: number;
  parcels?: Array<{
    size: {
      weight: number;
      width: number;
      height: number;
      length: number;
    };
    sequence_no: number;
  }>;
}

export interface PriceExtra {
  sms_sender?: boolean;
  open_package?: boolean;
  sms_recipient?: boolean;
  parcel_content: string;
  internal_identifier?: string;
  return_package?: boolean;
  insurance_amount?: number;
  insurance_amount_currency?: string;
  return_of_documents?: boolean;
  bank_repayment_amount?: number;
  bank_repayment_currency?: string;
  bank_holder?: string;
  bank_iban?: string;
}

export interface PriceRequest {
  carrier_id: number;
  service_id: number;
  billing_to: {
    billing_address_id: number;
  };
  address_from: PriceAddress;
  address_to: PriceAddress;
  content: PriceContent;
  extra: PriceExtra;
}

export interface PriceOption {
  carrier_id: number;
  carrier: string;
  service_id: number;
  service_name: string;
  estimated_pickup_date: string;
  estimated_delivery_date: string;
  price: {
    amount: number;
    vat: number;
    total: number;
    currency: string;
  };
}

export interface ValidatedAddress {
  locality_id: number;
  postal_code: string | null;
  locality_name: string;
  county_name: string;
  country_code: string;
}

export interface PriceResponse {
  data: PriceOption[];
  validation_address: {
    address_from: ValidatedAddress;
    address_to: ValidatedAddress;
  };
}

// API Response types
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ProfileResponse {
  message: string;
  data: CustomerProfile;
}

export interface WalletResponse {
  wallet_balance: number;
  is_active: boolean;
  wallet_currency: string;
}
