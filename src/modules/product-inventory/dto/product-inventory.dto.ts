import { IsNumber, IsNotEmpty, IsOptional, IsBoolean, IsNumberString, IsBooleanString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateProductInventoryDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsOptional()
  @IsNumber()
  combinationId?: number; // Nullable if product has no variants

  @IsNotEmpty()
  @IsNumber()
  warehouseId: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  lowStockThreshold?: number;

  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;
}

export class UpdateProductInventoryDto extends PartialType(CreateProductInventoryDto) {}

export class ProductInventoryQueryDto {
  @IsOptional()
  @IsNumberString()
  productId?: string;

  @IsOptional()
  @IsNumberString()
  warehouseId?: string;

  @IsOptional()
  @IsBooleanString()
  trackInventory?: string;
}
