import { IsNotEmpty, IsOptional, IsNumber, IsString, IsBoolean, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateUserAddressDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['shipping', 'billing', 'both'])
  type: 'shipping' | 'billing' | 'both';

  @IsOptional()
  @IsString()
  company?: string;

  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsString()
  @IsNotEmpty()
  address_line1: string;

  @IsOptional()
  @IsString()
  address_line2?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  city_id?: number;

  @IsString()
  @IsNotEmpty()
  city_name: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  region_id?: number;

  @IsOptional()
  @IsString()
  region_name?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  country_id: number;

  @IsString()
  @IsNotEmpty()
  postal_code: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_default?: boolean;

  @IsOptional()
  @IsString()
  nickname?: string;
}

export class UpdateUserAddressDto {
  @IsOptional()
  @IsString()
  @IsIn(['shipping', 'billing', 'both'])
  type?: 'shipping' | 'billing' | 'both';

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  address_line1?: string;

  @IsOptional()
  @IsString()
  address_line2?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  city_id?: number;

  @IsOptional()
  @IsString()
  city_name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  region_id?: number;

  @IsOptional()
  @IsString()
  region_name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  country_id?: number;

  @IsOptional()
  @IsString()
  postal_code?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_default?: boolean;

  @IsOptional()
  @IsString()
  nickname?: string;
}

export class AddressQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['shipping', 'billing', 'both'])
  type?: 'shipping' | 'billing' | 'both';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  country_id?: number;

  @IsOptional()
  region_id?: any;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  city_id?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_default?: boolean;

  // Admin-only fields
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  user_id?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  verified_only?: boolean;

  // Pagination
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  per_page?: number;

  // Sorting
  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC';
}

export interface UserAddressResponse {
  id: number;
  user_id: number;
  type: string;
  company?: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city_id?: number;
  city_name: string;
  region_id?: number;
  region_name?: string;
  region_name_full?: string;
  country_id: number;
  country_name: string;
  city_name_full?: string;
  postal_code: string;
  phone_number?: string;
  instructions?: string;
  landmark?: string;
  is_default: boolean;
  is_verified: boolean;
  nickname?: string;
  created_at: Date;
  updated_at: Date;
}
