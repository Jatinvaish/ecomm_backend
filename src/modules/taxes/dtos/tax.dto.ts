import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsIn,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PaginationQueryDto } from 'src/common/utils/common-dtos';

export enum TaxType {
  GST = 'GST',
  VAT = 'VAT',
  SALES_TAX = 'SALES_TAX',
  EXCISE = 'EXCISE',
  IMPORT_DUTY = 'IMPORT_DUTY',
  SERVICE_TAX = 'SERVICE_TAX',
}

export class CreateTaxDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @IsNotEmpty()
  @IsEnum(TaxType)
  type: TaxType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  country_id?: number;

  @IsOptional()
  @IsInt()
  region_id?: number;

  @IsOptional()
  @IsInt()
  currency_id?: number = 1;

  @IsOptional()
  @IsBoolean()
  is_flexible?: any;

  @IsOptional()
  @IsNumber()
  @Min(0)
  threshold_less?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  threshold_greater?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate_less?: number = 0.0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rate_greater?: number = 0.0;

  @IsOptional()
  @IsBoolean()
  is_compound?: boolean = false;

  @IsOptional()
  @IsInt()
  @Min(0)
  compound_order?: number = 0;

  @IsOptional()
  @IsDateString()
  effective_from?: string;

  @IsOptional()
  @IsDateString()
  effective_until?: string;

  @IsOptional()
  @IsBoolean()
  is_inclusive?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applies_to?: string[] = ['products', 'shipping'];

  @IsOptional()
  @IsArray()
  exemptions?: any[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

export class UpdateTaxDto extends PartialType(CreateTaxDto) {}

export class TaxQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'], {
    message: 'isActive must be a boolean string ("true" or "false")',
  })
  isActive?: string;

  @IsOptional()
  @IsEnum(TaxType)
  type?: TaxType;

  @IsOptional()
  @IsString()
  country_id?: string;

  @IsOptional()
  @IsString()
  region_id?: string;

  @IsOptional()
  @IsString()
  currency_id?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsBoolean()
  is_compound?: boolean;

  @IsOptional()
  @IsBoolean()
  is_flexible?: boolean;

  @IsOptional()
  @IsBoolean()
  is_inclusive?: boolean;
}