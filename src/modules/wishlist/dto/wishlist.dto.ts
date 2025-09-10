import { IsNotEmpty, IsOptional, IsNumber, IsString, IsBoolean, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWishlistDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class UpdateWishlistDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

export class AddToWishlistDto {
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @IsOptional()
  @IsNumber()
  combination_id?: number;

  @IsOptional()
  @IsNumber()
  wishlist_id?: number;
}

export class WishlistQueryDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  per_page?: number = 20;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_public?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

export interface WishlistItemResponse {
  id: number;
  product_id: number;
  combination_id?: number;
  product_name: string;
  product_slug: string;
  product_image: string;
  product_price: number;
  product_compare_price?: number;
  sku: string;
  variant_details?: any;
  is_available: boolean;
  stock_quantity: number;
  added_at: Date;
}

export interface WishlistResponse {
  id: number;
  user_id: number;
  name: string;
  is_public: boolean;
  is_default: boolean;
  items_count: number;
  items: WishlistItemResponse[];
  created_at: Date;
  updated_at: Date;
}
