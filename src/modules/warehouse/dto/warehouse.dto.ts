import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsNumberString, IsBooleanString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateWarehouseDto {
  @IsNotEmpty()
  @IsNumber()
  vendorId: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}

export class WarehouseQueryDto {
  @IsOptional()
  @IsNumberString()
  vendorId?: string;

  @IsOptional()
  @IsBooleanString()
  isPrimary?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}