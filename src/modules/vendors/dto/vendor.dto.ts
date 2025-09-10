import { Transform } from "class-transformer";
import { IsString, MinLength, MaxLength, IsEmail, IsOptional, IsPhoneNumber, IsInt, IsIn, IsBoolean, IsObject, IsNumber, IsDateString, IsDate } from "class-validator";
import { HasMimeType, IsFile, MaxFileSize, MemoryStoredFile } from "nestjs-form-data";
 
export class CreateVendorDto {
  // User information
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  full_name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  // @IsPhoneNumber()
  phone_number?: string;

  @IsOptional()
  @IsInt()
  preferred_language_id?: number;

  @IsOptional()
  @IsInt()
  preferred_currency_id?: number;

  @IsOptional()
  @IsInt()
  country_id?: number;

  // Store information
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  store_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  business_name?: string;

  @IsOptional()
  @IsString()
  business_type?: string;

  @IsOptional()
  @IsString()
  tax_number?: string;

  @IsOptional()
  @IsString()
  registration_number?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  tier_id?: number;

  @IsOptional()
  @IsDate()
  birth_date?: number;

  @IsOptional()
  // @IsDate()
  gender?: number;

  @IsOptional()
  @IsBoolean()
  is_email_notifications_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  is_sms_notifications_enabled?: boolean;

  @IsOptional()
  @IsString()
  business_registration_number?: string;

  @IsOptional()
  @IsString()
  tax_id?: string;

  // Contact and Business Details
  @IsOptional()
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };

  @IsOptional()
  contact_info?: {
    business_phone?: string;
    business_email?: string;
    website?: string;
  };

  @IsOptional()
  business_hours?: {
    [key: string]: {
      open: string;
      close: string;
      is_closed: boolean;
    };
  };

  @IsOptional()
  social_links?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  business_name?: string;

  @IsOptional()
  @IsString()
  business_type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  address?: object;

  @IsOptional()
  contact_info?: object;

  @IsOptional()
  business_hours?: object;

  @IsOptional()
  social_links?: object;

  @IsOptional()
  @IsString()
  shipping_policies?: string;

  @IsOptional()
  @IsString()
  return_policies?: string;

  @IsOptional()
  @IsString()
  terms_conditions?: string;
}

export class VendorApprovalDto {
  @IsInt()
  vendor_id: number;

  @IsIn(['approved', 'rejected', 'suspended'])
  status: string;

  @IsOptional()
  @IsString()
  verification_notes?: string;
}

export class VendorFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected', 'suspended', 'inactive'])
  status?: string;

  @IsOptional()
  @IsInt()
  tier_id?: number;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sort_order?: string = 'DESC';
}




export class UpdateVendorDetailsDto {
  @IsOptional()
  @IsString()
  store_name?: string;

  @IsOptional()
  @IsString()
  business_name?: string;

  @IsOptional()
  @IsString()
  business_type?: string;

  @IsOptional()
  @IsString()
  tax_number?: string;

  @IsOptional()
  @IsString()
  registration_number?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  contact_info?: {
    business_phone?: string;
    business_email?: string;
    website?: string;
  };

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  business_hours?: {
    [key: string]: {
      open: string;
      close: string;
      is_closed: boolean;
    };
  };

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  social_links?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };

  @IsOptional()
  @IsString()
  shipping_policies?: string;

  @IsOptional()
  @IsString()
  return_policies?: string;

  @IsOptional()
  @IsString()
  terms_conditions?: string;

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  settings?: {
    preferred_language?: string;
    notification_preferences?: {
      email_orders?: boolean;
      email_reviews?: boolean;
      sms_orders?: boolean;
    };
  };

  // File fields for nestjs-form-data
  // @IsOptional()
  // @IsFile()
  // @MaxFileSize(5e6) // 5MB
  // @HasMimeType(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
  // logo?: MemoryStoredFile;

  // @IsOptional()
  // @IsFile()
  // @MaxFileSize(5e6) // 5MB
  // @HasMimeType(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
  // banner?: MemoryStoredFile;

  // @IsOptional()
  // @IsFile({ each: true })
  // @MaxFileSize(10e6, { each: true }) // 10MB each
  // @HasMimeType([
  //   'application/pdf',
  //   'image/jpeg',
  //   'image/jpg',
  //   'image/png',
  //   'application/msword',
  //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  // ], { each: true })
  // verification_documents?: MemoryStoredFile | MemoryStoredFile[];
  @IsOptional()
  @IsFile()
  @HasMimeType(['image/jpeg', 'image/png', 'image/jpg'])
  logo?: MemoryStoredFile;

  @IsOptional()
  @IsFile()
  @HasMimeType(['image/jpeg', 'image/png', 'image/jpg'])
  banner?: MemoryStoredFile;

  @IsOptional()
  verification_documents?: MemoryStoredFile | MemoryStoredFile[];
  // These will be set by the controller after file processing
  store_slug?: string;
  logo_url?: string;
  banner_url?: string;
  verification_documents_urls?: string[];
  updated_by?: number;

  // Bank Details from the new table
  @IsOptional()
  @IsString()
  @IsIn(['savings', 'current', 'business'])
  account_type?: 'savings' | 'current' | 'business';

  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsString()
  bank_code?: string;

  @IsOptional()
  @IsString()
  branch_name?: string;

  @IsOptional()
  @IsString()
  branch_code?: string;

  @IsOptional()
  @IsString()
  account_holder_name?: string;

  @IsOptional()
  @IsString()
  account_number?: string;

  @IsOptional()
  @IsString()
  routing_number?: string;

  @IsOptional()
  @IsString()
  swift_code?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsString()
  ifsc_code?: string;

  @IsOptional()
  @IsString()
  tax_id?: string;

  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @IsOptional()
  @IsDateString()
  verified_at?: string;

  @IsOptional()
  @IsNumber()
  verified_by?: number;
}