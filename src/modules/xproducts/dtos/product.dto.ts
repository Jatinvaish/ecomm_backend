// import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, ArrayMinSize, ArrayMaxSize, IsUrl, ValidateNested, IsBooleanString, IsNumberString } from 'class-validator';
// import { PartialType } from '@nestjs/mapped-types';

// // --- Product Enums ---export enum ProductStatus {
//   export enum ProductStatus {
//     DRAFT = 'draft',
//     ACTIVE = 'active',
//     ARCHIVED = 'archived',
//   }
// export enum ProductVisibility {
//   VISIBLE = 'visible',
//   HIDDEN = 'hidden',
// }

// export enum MediaType {
//   IMAGE = 'image',
//   VIDEO = 'video',
// }

// // --- Product Core DTOs ---
// export class CreateProductDto {
//   @IsNotEmpty()
//   @IsNumber()
//   vendorId: number;

//   @IsNotEmpty()
//   @IsString()
//   name: string;

//   @IsNotEmpty()
//   @IsString()
//   slug: string;

//   @IsOptional()
//   @IsString()
//   description?: string;

//   @IsOptional()
//   @IsString()
//   shortDescription?: string;

//   @IsOptional()
//   @IsString()
//   sku?: string;

//   @IsOptional()
//   @IsNumber()
//   categoryId?: number;

//   @IsOptional()
//   @IsNumber()
//   brandId?: number;

//   @IsOptional()
//   @IsNumber()
//   taxId?: number;

//   @IsNotEmpty()
//   @IsNumber()
//   price: number;

//   @IsOptional()
//   @IsNumber()
//   comparePrice?: number;

//   @IsOptional()
//   @IsNumber()
//   costPrice?: number;

//   @IsOptional()
//   @IsNumber()
//   weight?: number;

//   @IsOptional()
//   @IsNumber()
//   length?: number;

//   @IsOptional()
//   @IsNumber()
//   width?: number;

//   @IsOptional()
//   @IsNumber()
//   height?: number;

//   @IsOptional()
//   @IsString()
//   metaTitle?: string;

//   @IsOptional()
//   @IsString()
//   metaDescription?: string;

//   @IsOptional()
//   @IsEnum(ProductStatus)
//   status?: ProductStatus;

//   @IsOptional()
//   @IsEnum(ProductVisibility)
//   visibility?: ProductVisibility;

//   @IsOptional()
//   @IsBoolean()
//   isFeatured?: boolean;

//   @IsOptional()
//   @IsBoolean()
//   isPhysical?: boolean;

//   @IsOptional()
//   searchMeta?: any; // JSONB field
// }

// export class UpdateProductDto extends PartialType(CreateProductDto) {}

// export class ProductQueryDto {
//   @IsOptional()
//   @IsNumberString()
//   categoryId?: string;

//   @IsOptional()
//   @IsNumberString()
//   brandId?: string;

//   vendorId?:string;
//   @IsOptional()
//   @IsBooleanString()
//   isFeatured?: string;

//   @IsOptional()
//   @IsString()
//   status?: string; // For admin/vendor to filter by status

//   @IsOptional()
//   @IsString()
//   visibility?: string; // For admin/vendor to filter by visibility

//   @IsOptional()
//   @IsString()
//   search?: string; // For general search by name/description
// }

// // --- Product Gallery DTOs ---
// export class CreateProductGalleryDto {
//   @IsNotEmpty()
//   @IsEnum(MediaType)
//   mediaType: MediaType;

//   @IsNotEmpty()
//   @IsUrl()
//   url: string; // Cloudinary URL would be stored here

//   @IsOptional()
//   @IsString()
//   altText?: string;

//   @IsOptional()
//   @IsNumber()
//   sortOrder?: number;

//   @IsOptional()
//   @IsBoolean()
//   isPrimary?: boolean;
// }

// export class UpdateProductGalleryDto extends PartialType(CreateProductGalleryDto) {}

// // --- Product Variants DTOs ---
// export class CreateProductVariantDto {
//   @IsNotEmpty()
//   @IsString()
//   name: string;

//   @IsOptional()
//   @IsNumber()
//   sortOrder?: number;
// }

// export class UpdateProductVariantDto extends PartialType(CreateProductVariantDto) {}

// // --- Product Variant Values DTOs ---
// export class CreateProductVariantValueDto {
//   @IsNotEmpty()
//   @IsString()
//   value: string;

//   @IsOptional()
//   @IsNumber()
//   sortOrder?: number;
// }

// export class UpdateProductVariantValueDto extends PartialType(CreateProductVariantValueDto) {}

// // --- Product Variant Combinations DTOs ---
// export class CreateProductVariantCombinationDto {
//   @IsOptional()
//   @IsString()
//   sku?: string;

//   @IsOptional()
//   @IsNumber()
//   price?: number;

//   @IsOptional()
//   @IsNumber()
//   comparePrice?: number;

//   @IsOptional()
//   @IsNumber()
//   costPrice?: number;

//   @IsOptional()
//   @IsNumber()
//   weight?: number;

//   @IsOptional()
//   @IsUrl()
//   imageUrl?: string; // Cloudinary URL would be stored here

//   @IsOptional()
//   @IsBoolean()
//   isActive?: boolean;

//   @IsArray()
//   @ArrayMinSize(1)
//   @IsNumber({},{each: true})
//   variantValueIds: number[]; // IDs from product_variant_values
// }

// export class UpdateProductVariantCombinationDto extends PartialType(CreateProductVariantCombinationDto) {}

// // --- Product Specifications DTOs ---
// export class CreateProductSpecificationDto {
//   @IsNotEmpty()
//   @IsString()
//   name: string;

//   @IsNotEmpty()
//   @IsString()
//   value: string;

//   @IsOptional()
//   @IsNumber()
//   sortOrder?: number;
// }
// export class UpdateProductSpecificationDto extends PartialType(CreateProductSpecificationDto) {}

// ==================== PRODUCT DTOs ====================

import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Length,
  IsInt,
  IsUrl,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

// =================================================================================
// ENUMS
// =================================================================================

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum ProductVisibility {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum SyncAction {
  INDEX = 'index',
  DELETE = 'delete',
}

export enum SyncStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// =================================================================================
// GENERIC & QUERY DTOs
// =================================================================================

class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

export class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// =================================================================================
// PRODUCT DTOs
// =================================================================================

export class CreateProductDto {
  @IsInt()
  vendor_id: number;

  @IsString()
  @Length(1, 500)
  name: string;

  @IsString()
  @Length(1, 500)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  sku?: string;

  @IsOptional()
  @IsInt()
  category_id?: number;

  @IsOptional()
  @IsInt()
  brand_id?: number;

  @IsOptional()
  @IsInt()
  tax_id?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  compare_price?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  cost_price?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  length?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  width?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  height?: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  meta_title?: string;

  @IsOptional()
  @IsString()
  meta_description?: string;

  @IsOptional()
  //TODO
  // @IsEnum(ProductStatus)
  // status?: ProductStatus = ProductStatus.DRAFT;
  status?: any;

  @IsOptional()
   //TODO
  // @IsEnum(ProductVisibility)
  // visibility?: ProductVisibility;
  visibility?: any;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean = false;

  @IsOptional()
  @IsBoolean()
  is_physical?: boolean = true;

  @IsOptional()
  @IsObject()
  search_meta?: object;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  category_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  brand_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  vendor_id?: number;

  @IsOptional()
  //TODO
  // @IsEnum(ProductStatus)
  // status?: ProductStatus = ProductStatus.DRAFT;
  status?: any;

  @IsOptional()
    //TODO
  // @IsEnum(ProductVisibility)
  // visibility?: ProductVisibility;
  visibility?: any;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_featured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_physical?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  min_price?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  max_price?: number;

  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

// =================================================================================
// PRODUCT GALLERY DTOs
// =================================================================================

export class CreateGalleryItemDto {
  @IsEnum(MediaType)
  media_type: MediaType;

  @IsUrl()
  @Length(1, 1000)
  url: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  alt_text?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number = 0;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean = false;
}

export class UpdateGalleryItemDto extends PartialType(CreateGalleryItemDto) {}

// =================================================================================
// PRODUCT VARIANT DTOs
// =================================================================================

export class CreateVariantDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number = 0;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantValueDto)
  values: CreateVariantValueDto[];
}

export class UpdateVariantDto extends PartialType(CreateVariantDto) {}

// =================================================================================
// PRODUCT VARIANT VALUE DTOs
// =================================================================================

export class CreateVariantValueDto {
  @IsString()
  @Length(1, 255)
  value: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number = 0;
}

export class UpdateVariantValueDto extends PartialType(CreateVariantValueDto) {}

// =================================================================================
// PRODUCT VARIANT COMBINATION DTOs
// =================================================================================

export class CreateVariantCombinationDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  variant_value_ids: number[];

  @IsOptional()
  @IsString()
  @Length(1, 100)
  sku?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  compare_price?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  cost_price?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @IsOptional()
  @IsUrl()
  @Length(1, 500)
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

export class UpdateVariantCombinationDto extends PartialType(
  CreateVariantCombinationDto,
) {}

// =================================================================================
// PRODUCT SPECIFICATION DTOs
// =================================================================================

export class CreateSpecificationDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number = 0;
}

export class UpdateSpecificationDto extends PartialType(
  CreateSpecificationDto,
) {}

// =================================================================================
// PRODUCT REVIEW DTOs
// =================================================================================

export class CreateReviewDto {
  @IsInt()
  user_id: number;

  @IsInt()
  product_id: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  is_approved?: boolean = true;
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}

export class ReviewQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  product_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  user_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_approved?: boolean;

  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

// =================================================================================
// APPROVAL & MODERATION DTOs
// =================================================================================

export class ApprovalActionDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

// =================================================================================
// WAREHOUSE DTOs
// =================================================================================

export class CreateWarehouseDto {
  @IsInt()
  vendor_id: number;

  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  address_line1?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  postal_code?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean = false;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}

// =================================================================================
// PRODUCT INVENTORY DTOs
// =================================================================================

export class CreateInventoryDto {
  @IsInt()
  product_id: number;

  @IsOptional()
  @IsInt()
  combination_id?: number;

  @IsInt()
  warehouse_id: number;

  @IsInt()
  @Min(0)
  quantity: number = 0;

  @IsOptional()
  @IsInt()
  @Min(0)
  low_stock_threshold?: number = 5;

  @IsOptional()
  @IsBoolean()
  track_inventory?: boolean = true;
}

export class UpdateInventoryDto extends PartialType(CreateInventoryDto) {}

export class InventoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  product_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  warehouse_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  vendor_id?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  low_stock?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  track_inventory?: boolean;

  @IsOptional()
  @IsString()
  sort_by?: string = 'updated_at';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

// =================================================================================
// SEARCH SYNC QUEUE DTOs
// =================================================================================

export class CreateSearchSyncDto {
  @IsInt()
  product_id: number;

  @IsEnum(SyncAction)
  action: SyncAction;
}

export class SearchSyncQueueQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  product_id?: number;

  @IsOptional()
  @IsEnum(SyncAction)
  action?: SyncAction;

  @IsOptional()
  @IsEnum(SyncStatus)
  status?: SyncStatus;

  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

// =================================================================================
// BULK OPERATION DTOs
// =================================================================================

export class BulkUpdateProductDto {
  @IsArray()
  @IsInt({ each: true })
  product_ids: number[];

  @IsOptional()
  //TODO
  // @IsEnum(ProductStatus)
  // status?: ProductStatus = ProductStatus.DRAFT;
  status?: any;

  @IsOptional()
  //TODO
  // @IsEnum(ProductVisibility)
  // visibility?: ProductVisibility;
  visibility?: any;


  @IsOptional()
  @IsInt()
  category_id?: number;

  @IsOptional()
  @IsInt()
  brand_id?: number;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;
}

export class BulkDeleteProductDto {
  @IsArray()
  @IsInt({ each: true })
  product_ids: number[];

  @IsOptional()
  @IsString()
  reason?: string;
}
