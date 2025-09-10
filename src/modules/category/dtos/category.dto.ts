import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsNumberString,
  IsBooleanString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { SortDirection } from 'src/common/utils/enums';

// Translation DTO
export class CategoryTranslationDto {
  @IsNumber()
  language_id: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  slug: string;
}

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  parent_id?: number;

  @IsOptional()
  @IsString()
  @IsUrl()
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations?: CategoryTranslationDto[];
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations?: CategoryTranslationDto[];
}

// Defines the allowed fields for sorting categories
enum CategorySortBy {
  NAME = 'name',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  SORT_ORDER = 'sort_order',
  PARENT_NAME = 'parent_name',
  TRANSLATED_NAME = 'translated_name',
}

export class CategoryQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  is_active?: string;

  @IsOptional()
  @IsEnum(CategorySortBy)
  sort_by?: CategorySortBy;

  @IsOptional()
  @IsEnum(SortDirection)
  sort_direction?: SortDirection;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  per_page?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;

  @IsOptional()
  @IsBooleanString()
  has_products?: string;

  @IsOptional()
  @IsNumberString()
  language_id?: string;
}

// DTO for getting parent categories
export class GetParentCategoriesDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  ids?: number[];
}

// DTO for creating category translations
export class CreateCategoryTranslationDto {
  @IsNumber()
  language_id: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  slug: string;
}

// DTO for updating category translations
export class UpdateCategoryTranslationDto extends PartialType(CreateCategoryTranslationDto) {
  @IsOptional()
  @IsNumber()
  language_id?: number;
}

// DTO for bulk operations
export class BulkCategoryOperationDto {
  @IsArray()
  @IsNumber({}, { each: true })
  category_ids: number[];

  @IsString()
  @IsEnum(['activate', 'deactivate', 'delete'])
  operation: 'activate' | 'deactivate' | 'delete';
}

// DTO for category reordering
export class ReorderCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderDto)
  categories: CategoryOrderDto[];
}

export class CategoryOrderDto {
  @IsNumber()
  id: number;

  @IsNumber()
  sort_order: number;

  @IsOptional()
  @IsNumber()
  parent_id?: number;
}

// Export interface for better type safety
export interface CategoryInterface {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  parent_name?: string;
  translated_name?: string;
  translated_description?: string;
  translated_slug?: string;
}

export interface CategoryTranslationInterface {
  id: number;
  category_id: number;
  language_id: number;
  name: string;
  description?: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
  language_name?: string;
  language_code?: string;
}

export interface CategoryStatsInterface {
  total_categories: number;
  active_categories: number;
  root_categories: number;
  sub_categories: number;
  categories_with_children: number;
  total_translations: number;
}

export interface CategoryWithProductCountInterface {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  product_count: number;
  active_product_count: number;
}

export interface CategoryTranslationStatsInterface {
  language_id: number;
  language_name: string;
  language_code: string;
  translated_categories: number;
  total_active_categories: number;
  completion_percentage: number;
}