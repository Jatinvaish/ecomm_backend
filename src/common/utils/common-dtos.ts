// src/dto/pagination-query.dto.ts

import { IsOptional, IsString, IsIn, IsInt } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  // @IsInt()
  page?: number | string; 

  @IsOptional()
  // @IsInt()
  per_page?: number | string;

  @IsOptional()
  @IsString()
  order_by?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  order_direction?: 'ASC' | 'DESC';
}
