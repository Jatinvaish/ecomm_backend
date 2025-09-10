import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  IsEnum,
  ValidateNested,
  IsUUID,
  IsDateString,
  Min,
  Max,
  IsInt,
  IsUrl,
  IsBooleanString,
  IsNumberString,
  IsIn
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MediaType, ProductStatus, ProductVisibility, SortDirection } from 'src/common/utils/enums';


// Base DTOs
export class ProductGalleryDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsEnum(MediaType)
  media_type: MediaType;

  @IsString()
  @IsUrl({}, { message: 'Invalid URL format' })
  url: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Invalid thumbnail URL format' })
  thumbnail_url?: string;

  @IsOptional()
  @IsString()
  alt_text?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  file_size?: number;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number; // For videos and audio files

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(0)
  sort_order?: number = 0;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_primary?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_active?: boolean = true;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Invalid download URL format' })
  download_url?: string; // For downloadable files

  @IsOptional()
  @IsObject()
  metadata?: any; // Additional file metadata
}

export class ProductVariantDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  id?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : 0)
  @Min(0)
  sort_order?: number = 0;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  is_active?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  attribute_id?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantValueDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  values?: ProductVariantValueDto[];
}

export class ProductVariantValueDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsNumber()
  variant_id?: number;

  @IsString()
  value: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  attribute_value_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(0)
  sort_order?: number = 0;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_active?: boolean = true;
}

export class ProductVariantCombinationDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  combination_key?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantCombinationValueDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  combination_values?: ProductVariantCombinationValueDto[];

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : 3)
  @Min(1)
  base_currency_id?: number = 3; // Changed to match frontend default

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Min(0)
  compare_price?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Min(0)
  cost_price?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value || {};
  })
  dimensions?: any;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : 0)
  @Min(0)
  stock_quantity?: number = 0;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : 5)
  @Min(0)
  low_stock_threshold?: number = 5;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  is_active?: boolean = true;

  // Remove variant_value_ids as frontend doesn't use it anymore
  // @IsOptional()
  // @IsArray()
  // variant_value_ids?: (number | string)[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantPriceDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  prices?: ProductVariantPriceDto[];
}


export class ProductVariantPriceDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsNumber()
  combination_id?: number;

  @IsNumber()
  @Min(1)
  currency_id: number;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0.01, { message: 'Price must be greater than 0' })
  price: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  compare_price?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  cost_price?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_auto_converted?: boolean = false;
}

export class ProductSpecificationDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  id?: number;

  @IsOptional()
  @IsString()
  group_name?: string;

  @IsString()
  name: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : 0)
  @Min(0)
  sort_order?: number = 0;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  is_active?: boolean = true;
}

export class ProductPriceDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  @Min(1)
  currency_id: number;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0.01, { message: 'Price must be greater than 0' })
  price: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  compare_price?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  cost_price?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_auto_converted?: boolean = false;

  @IsOptional()
  @IsDateString()
  effective_from?: string;

  @IsOptional()
  @IsDateString()
  effective_until?: string;
}

export class ProductTranslationDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  @Min(1)
  language_id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsString()
  meta_title?: string;

  @IsOptional()
  @IsString()
  meta_description?: string;

  @IsOptional()
  @IsString()
  meta_keywords?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  search_keywords?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  tags?: string[];
}

// Main Product DTO
export class CreateProductDto {
  @IsString()
  name: string;
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Min(0)
  @Max(5)
  avg_rating?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @Min(0)
  total_reviews?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @Min(0)
  total_sales?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @Min(0)
  view_count?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @Min(0)
  wishlist_count?: number;

  // UUID field
  @IsOptional()
  @IsUUID()
  uuid?: string;

  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  vendor_id?: number; // Made optional since controller sets it

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @Min(1)
  category_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @Min(1)
  brand_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @Min(1)
  tax_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : 3)
  @Min(1)
  base_currency_id?: number = 3;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0.01, { message: 'Price must be greater than 0' })
  price: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Min(0)
  compare_price?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Min(0)
  cost_price?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Min(0)
  @Max(100)
  margin_percentage?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value || {};
  })
  dimensions?: any;

  @IsOptional()
  @IsString()
  shipping_class?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : 1)
  @Min(1)
  min_order_quantity?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @Min(1)
  max_order_quantity?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : 0)
  @Min(0)
  stock_quantity?: number = 0;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : 5)
  @Min(0)
  low_stock_threshold?: number = 5;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  track_quantity?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  sold_individually?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  virtual_product?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  downloadable?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @Min(0)
  download_limit?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @Min(0)
  download_expiry?: number;

  @IsOptional()
  @IsString()
  meta_title?: string;

  @IsOptional()
  @IsString()
  meta_description?: string;

  @IsOptional()
  @IsString()
  meta_keywords?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  search_keywords?: string[] = [];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  tags?: string[] = [];

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Invalid featured image URL format' })
  featured_image_url?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  gallery_urls?: string[] = [];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  video_urls?: string[] = [];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus = ProductStatus.DRAFT;

  @IsOptional()
  @IsEnum(ProductVisibility)
  visibility?: ProductVisibility = ProductVisibility.VISIBLE;

  @IsOptional()
  @IsString()
  password_protection?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  is_featured?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  is_bestseller?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  is_new_arrival?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  is_on_sale?: boolean = false;

  @IsOptional()
  @IsDateString()
  sale_starts_at?: string;

  @IsOptional()
  @IsDateString()
  sale_ends_at?: string;

  @IsOptional()
  @IsDateString()
  publish_at?: string;

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value || {};
  })
  seo_data?: any;

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return value || {};
  })
  product_data?: any = {};

  // Added missing field
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return Boolean(value);
  })
  is_active?: boolean = true;

  // Related data with proper transformations
  @IsOptional()
  // @IsArray()
  // @ValidateNested({ each: true })
  @Type(() => ProductGalleryDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  gallery?: ProductGalleryDto[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductTranslationDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  translations?: ProductTranslationDto[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPriceDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  prices?: ProductPriceDto[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  variants?: ProductVariantDto[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantCombinationDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  variant_combinations?: ProductVariantCombinationDto[] = [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  specifications?: ProductSpecificationDto[] = [];
}

export class UpdateProductDto extends CreateProductDto {
  @IsOptional()
  // @IsNumber()
  id?: number | string;

  @IsOptional()
  @IsArray()
  delete_gallery_ids?: number[];

  @IsOptional()
  @IsArray()
  delete_translation_ids?: number[];

  @IsOptional()
  @IsArray()
  delete_price_ids?: number[];

  @IsOptional()
  @IsArray()
  delete_attribute_ids?: number[];

  @IsOptional()
  @IsArray()
  delete_variant_ids?: number[];

  @IsOptional()
  @IsArray()
  delete_combination_ids?: number[];

  @IsOptional()
  @IsArray()
  delete_specification_ids?: number[];
}

// Query DTOs
export class ProductFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  is_active?: string;

  @IsOptional()
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsEnum(SortDirection)
  sort_direction?: SortDirection;

  @IsOptional()
  page?: any;

  @IsOptional()
  per_page?: any;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  category_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  brand_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  vendor_id?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsEnum(ProductVisibility)
  visibility?: ProductVisibility;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_featured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_bestseller?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_new_arrival?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_on_sale?: boolean;


  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  min_price?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  max_price?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  @Max(5)
  min_rating?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0)
  @Max(5)
  max_rating?: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  tags?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => Array.isArray(value) ? value.map(Number) : [Number(value)])
  attribute_filters?: number[];


  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  language_id?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  currency_id?: number;

  @IsOptional()
  @IsIn(['in_stock', 'out_of_stock', 'low_stock'])
  stock_status?: string;
}

export class ApprovalDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsObject()
  admin_data?: any;
}

export class ProductVariantCombinationValueDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  variant_value_id: number; // This should remain required as the frontend filters by it

  @IsOptional()
  @IsString()
  variant_name?: string;

  @IsOptional()
  @IsString()
  variant_value?: string;
}