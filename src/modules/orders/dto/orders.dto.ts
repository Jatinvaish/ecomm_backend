import { IsOptional, IsString, IsInt, IsIn, IsDateString, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class OrderFiltersDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned', 'failed'])
  status?: string;

  @IsOptional()
  @IsIn(['all', 'pending', 'paid', 'partial', 'failed', 'refunded', 'cancelled'])
  payment_status?: string;

  @IsOptional()
  @IsIn(['all', 'unfulfilled', 'partial', 'fulfilled', 'shipped', 'delivered'])
  fulfillment_status?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  vendor_id?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  @IsIn(['created_at', 'total_amount', 'order_number'])
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sort_order?: string = 'DESC';
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned', 'failed'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  tracking_number?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  shipping_provider_id?: number;
}

export class UpdateVendorOrderDto {
  @IsString()
  @IsIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  tracking_number?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  shipping_provider_id?: number;
}

export class OrderTrackingDto {
  @IsString()
  tracking_number: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  shipping_provider_id?: number;
}
