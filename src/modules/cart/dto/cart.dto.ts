  // dto/cart.dto.ts
  import { IsNotEmpty, IsOptional, IsNumber, IsString, IsBoolean, IsArray, ValidateNested, Min, Max } from 'class-validator';
  import { Transform, Type } from 'class-transformer';

  // Base DTOs
  export class AddToCartDto {
    @IsNumber()
    @IsNotEmpty()
    product_id: number;

    @IsOptional()
    @IsNumber()
    user_id?: number;

    @IsOptional()
    @IsString()
    session_id?: string;

    @IsOptional()
    @IsNumber()
    combination_id?: number;

    @IsNumber()
    @Min(1)
    @Max(999)
    quantity: number;

    @IsOptional()
    @IsNumber()
    unit_price?: number;

    @IsOptional()
    @IsNumber()
    currency_id?: number;
  }

  export class UpdateCartItemDto {
    @IsNumber()
    @Min(1)
    @Max(999)
    quantity: number;

    @IsOptional()
    @IsNumber()
    user_id?: number;

    @IsOptional()
    @IsString()
    session_id?: string;
  }

  export class CartQueryDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    user_id?: number;

    @IsOptional()
    @IsString()
    session_id?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    currency_id?: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    include_expired?: boolean;
  }

  // Service layer DTOs (for frontend communication)
  export class CartItemRequestDto {
    @IsNumber()
    @IsNotEmpty()
    cart_item_id: number;

    @IsOptional()
    @IsNumber()
    user_id?: number;

    @IsOptional()
    @IsString()
    session_id?: string;
  }

  export class CartRequestDto {
    @IsOptional()
    @IsNumber()
    user_id?: number;

    @IsOptional()
    @IsString()
    session_id?: string;

    @IsOptional()
    @IsNumber()
    currency_id?: number;
  }

  export class TransferCartDto {
    @IsString()
    @IsNotEmpty()
    from_session_id: string;

    @IsNumber()
    @IsNotEmpty()
    to_user_id: number;

    @IsOptional()
    @IsBoolean()
    merge_duplicates?: boolean;
  }

  // Response Interfaces remain the same...
  export interface CartItemResponse {
    id: number;
    cart_id: number;
    product_id: number;
    combination_id?: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name: string;
    product_slug: string;
    product_image: string;
    sku: string;
    variant_sku?: string;
    variant_details?: any;
    stock_available: number;
    variant_stock?: number;
    max_quantity: number;
    min_order_quantity?: number;
    max_order_quantity?: number;
    sold_individually?: boolean;
    is_available: boolean;
    added_at: Date;
    created_at: Date;
    updated_at: Date;
    
    // Enhanced properties
    effective_compare_price?: number;
    discount_amount?: number;
    discount_percentage?: number;
    weight?: number;
    vendor_name?: string;
    tax_amount?: number;
    applicable_taxes?: any[];
  }
  export interface CartSummary {
    items_count: number;
    subtotal: number;
    tax_amount: number;
    shipping_amount: number;
    shipping_tax?: number;  // Add this
    discount_amount: number;
    total: number;
    total_weight?: number;  // Add this
  }


  export interface CartResponse {
    id: number;
    user_id?: number;
    session_id?: string;
    currency_id: number;
    language_id?: number;
    currency_code: string;
    currency_symbol: string;
    items: CartItemResponse[];
    summary: CartSummary;
    applied_coupons: any[];
    tax_breakdown: any;
    expires_at?: Date;
    created_at: Date;
    updated_at: Date;
  }
