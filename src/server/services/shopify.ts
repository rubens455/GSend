import axios from 'axios';

export interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
  updated_at: string;
  tags: string;
  accepts_marketing: boolean;
  accepts_marketing_updated_at: string;
}

export interface ShopifyCustomersResponse {
  customers: ShopifyCustomer[];
}

export class ShopifyService {
  private config: ShopifyConfig;

  constructor(config: ShopifyConfig) {
    this.config = config;
  }

  async getCustomers(limit: number = 250, sinceId?: number): Promise<ShopifyCustomer[]> {
    try {
      const url = `https://${this.config.shopDomain}.myshopify.com/admin/api/2023-10/customers.json`;
      const params: any = { limit };
      if (sinceId) params.since_id = sinceId;

      const response = await axios.get<ShopifyCustomersResponse>(url, {
        headers: {
          'X-Shopify-Access-Token': this.config.accessToken,
          'Content-Type': 'application/json',
        },
        params,
      });

      return response.data.customers;
    } catch (error: any) {
      console.error('Shopify API error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch customers from Shopify: ${error.response?.data?.errors || error.message}`);
    }
  }

  async getAllCustomersWithPhone(): Promise<ShopifyCustomer[]> {
    const allCustomers: ShopifyCustomer[] = [];
    let sinceId: number | undefined;
    
    try {
      while (true) {
        const customers = await this.getCustomers(250, sinceId);
        
        if (customers.length === 0) break;
        
        // Filter customers with phone numbers
        const customersWithPhone = customers.filter(customer => customer.phone);
        allCustomers.push(...customersWithPhone);
        
        // Get the last customer ID for pagination
        sinceId = customers[customers.length - 1].id;
        
        // Break if we got less than the limit (no more pages)
        if (customers.length < 250) break;
        
        // Rate limiting - Shopify allows 2 requests per second
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return allCustomers;
    } catch (error: any) {
      console.error('Error fetching all Shopify customers:', error);
      throw error;
    }
  }

  async getCustomersByPhone(phone: string): Promise<ShopifyCustomer[]> {
    try {
      const url = `https://${this.config.shopDomain}.myshopify.com/admin/api/2023-10/customers/search.json`;
      const response = await axios.get<ShopifyCustomersResponse>(url, {
        headers: {
          'X-Shopify-Access-Token': this.config.accessToken,
          'Content-Type': 'application/json',
        },
        params: {
          query: `phone:${phone}`,
        },
      });

      return response.data.customers;
    } catch (error: any) {
      console.error('Shopify search error:', error.response?.data || error.message);
      throw new Error(`Failed to search customers in Shopify: ${error.response?.data?.errors || error.message}`);
    }
  }
}

export function createShopifyService(shopDomain: string, accessToken: string): ShopifyService {
  return new ShopifyService({ shopDomain, accessToken });
}

export function formatShopifyPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add +1 for US numbers if not present and it's 10 digits
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return phone;
}
