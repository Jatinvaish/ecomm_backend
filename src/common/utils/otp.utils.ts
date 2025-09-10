// ==================== OTP UTILITIES ====================
// src/common/utils/otp.utils.ts

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiresAt: string | Date): boolean {
  const now = new Date();
  const expiry = new Date(expiresAt);
  return now > expiry;
}

/**
 * Get OTP expiry time (in minutes from now)
 */
export function getOTPExpiryTime(minutes: number = 15): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

// ==================== COMMON RESPONSE UTILITIES ====================
// src/common/utils/common-response.ts

export interface ApiResponseFormat<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ApiResponse {
  static success<T>(data: T, message: string = 'Success'): ApiResponseFormat<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static created<T>(data: T, message: string = 'Created successfully'): ApiResponseFormat<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(message: string, error?: any): ApiResponseFormat {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString()
    };
  }

  static paginated<T>(
    data: T[], 
    pagination: PaginatedResponse<T>['pagination'], 
    message: string = 'Data retrieved successfully'
  ): ApiResponseFormat<PaginatedResponse<T>> {
    return {
      success: true,
      message,
      data: {
        data,
        pagination
      },
      timestamp: new Date().toISOString()
    };
  }
}

// ==================== INTERFACES ====================
// src/common/utils/interface.ts

export interface User {
  id: number;
  uuid: string;
  full_name: string;
  email: string;
  email_verified_at?: Date;
  phone_number?: string;
  phone_verified_at?: Date;
  preferred_language_id?: number;
  preferred_currency_id?: number;
  country_id?: number;
  timezone?: string;
  avatar_url?: string;
  birth_date?: Date;
  gender?: string;
  is_active: boolean;
  roles?: Role[];
  created_at: Date;
  updated_at: Date;
}

export interface Vendor {
  id: number;
  uuid: string;
  user_id: number;
  tier_id: number;
  store_name: string;
  store_slug: string;
  business_name?: string;
  business_type?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'inactive';
  avg_rating: number;
  total_reviews: number;
  total_products: number;
  total_sales: number;
  commission_balance: number;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  permissions: any;
  is_system_role: boolean;
  is_active: boolean;
}

export interface VendorTier {
  id: number;
  name: string;
  slug: string;
  commission_rate: number;
  product_limit?: number;
  features: any;
  pricing: any;
  benefits: any;
  restrictions: any;
  sort_order: number;
  is_active: boolean;
}

export interface UserSession {
  id: number;
  user_id: number;
  session_token: string;
  device_info?: any;
  ip_address?: string;
  user_agent?: string;
  location?: any;
  is_active: boolean;
  expires_at: Date;
  last_activity_at: Date;
  created_at: Date;
}

export interface OTPVerification {
  id: number;
  user_id?: number;
  email?: string;
  phone_number?: string;
  otp: string;
  type: 'email_verification' | 'phone_verification' | 'password_reset' | 'login_2fa';
  attempts: number;
  max_attempts: number;
  expires_at: Date;
  verified_at?: Date;
  created_at: Date;
}
