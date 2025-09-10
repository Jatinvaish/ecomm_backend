import { Injectable } from '@nestjs/common';
import {
  ApiResponseFormat,
  ApiResponse,
} from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import {
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  DeleteQuery,
} from 'src/db/postgres.client';
import {
  getTotalCount,
  buildOrderClause,
  buildPaginationMeta,
} from 'src/common/utils/api-helpers';
import { TaxQueryDto, CreateTaxDto, UpdateTaxDto } from './dtos/tax.dto';

@Injectable()
export class TaxesRepository {
  private readonly taxSelectFields = `
    id, name, code, rate, type, description, country_id, region_id, currency_id,
    is_flexible, threshold_less, threshold_greater, rate_less, rate_greater,
    is_compound, compound_order, effective_from, effective_until, is_inclusive,
    applies_to, exemptions, is_active, created_at, updated_at, created_by, updated_by
  `;



  // --- Public/User/Vendor-facing queries (Read-only) ---
  async findAllActiveTaxes(
    queryDto: TaxQueryDto,
  ): Promise<ApiResponseFormat<any>> {
    try {
      const params: any[] = [];
      let paramIndex = 1;

      let baseQuery = `
        SELECT ${this.taxSelectFields}
        FROM taxes
        WHERE is_active = true
        AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
      `;

      const { whereClause, paramIndex: newParamIndex } =
        this.buildTaxWhereClause(queryDto, params, paramIndex, true);
      baseQuery += ` ${whereClause}`;

      const total = await getTotalCount(baseQuery, params);

      let sql = baseQuery + ` ${buildOrderClause(queryDto, 'name')}`;

      const page = Math.max(1, parseInt(queryDto.page?.toString() || '1', 10));
      const perPage = Math.min(
        100,
        Math.max(1, parseInt(queryDto.per_page?.toString() || '10', 10)),
      );
      const offset = (page - 1) * perPage;

      sql += ` LIMIT $${newParamIndex} OFFSET $${newParamIndex + 1}`;
      params.push(perPage, offset);

      const result = await SelectQuery(sql, params);
      const meta = buildPaginationMeta(total, page, perPage);

      return ApiResponse.success({
        meta,
        taxes: result,
      });
    } catch (e) {
      console.error('Error in findAllActiveTaxes:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async findActiveTaxById(id: number): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT ${this.taxSelectFields}
        FROM taxes
        WHERE id = $1 
        AND is_active = true
        AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
      `;
      const result = await SelectQuery(sql, [id]);
      if (result.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result[0]);
    } catch (e) {
      console.error('Error in findActiveTaxById:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async findActiveTaxesByCountry(countryId: number): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT ${this.taxSelectFields}
        FROM taxes
        WHERE country_id = $1 
        AND is_active = true
        AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
        ORDER BY name
      `;
      const result = await SelectQuery(sql, [countryId]);
      return ApiResponse.success(result);
    } catch (e) {
      console.error('Error in findActiveTaxesByCountry:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async findActiveTaxesByRegion(regionId: number): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT ${this.taxSelectFields}
        FROM taxes
        WHERE region_id = $1 
        AND is_active = true
        AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
        AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
        ORDER BY name
      `;
      const result = await SelectQuery(sql, [regionId]);
      return ApiResponse.success(result);
    } catch (e) {
      console.error('Error in findActiveTaxesByRegion:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // --- Admin-facing queries ---
  async findAllTaxesAdmin(
    queryDto: TaxQueryDto,
  ): Promise<ApiResponseFormat<any>> {
    try {
      const params: any[] = [];
      let paramIndex = 1;

      let baseQuery = `
        SELECT ${this.taxSelectFields}
        FROM taxes
      `;

      const { whereClause, paramIndex: newParamIndex } =
        this.buildTaxWhereClause(queryDto, params, paramIndex);
      baseQuery += ` ${whereClause}`;

      const total = await getTotalCount(baseQuery, params);

      let sql = baseQuery + ` ${buildOrderClause(queryDto, 'name')}`;

      const page = Math.max(1, parseInt(queryDto.page?.toString() || '1', 10));
      const perPage = Math.min(
        100,
        Math.max(1, parseInt(queryDto.per_page?.toString() || '10', 10)),
      );
      const offset = (page - 1) * perPage;

      sql += ` LIMIT $${newParamIndex} OFFSET $${newParamIndex + 1}`;
      params.push(perPage, offset);

      const result = await SelectQuery(sql, params);
      const meta = buildPaginationMeta(total, page, perPage);

      return ApiResponse.success({
        meta,
        taxes: result,
      });
    } catch (e) {
      console.error('Error in findAllTaxesAdmin:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  private buildTaxWhereClause(
    queryDto: TaxQueryDto,
    params: any[],
    paramIndex: number,
    isActiveOnly = false,
  ): { whereClause: string; paramIndex: number } {
    let whereClause = isActiveOnly ? 'WHERE 1=1' : 'WHERE 1=1';

    if (queryDto.isActive !== undefined) {
      whereClause += ` AND is_active = ${paramIndex++}`;
      params.push(queryDto.isActive === 'true');
    }

    if (queryDto.search) {
      whereClause += ` AND (name ILIKE ${paramIndex} OR description ILIKE ${paramIndex} OR code ILIKE ${paramIndex})`;
      params.push(`%${queryDto.search}%`);
      paramIndex++;
    }

    if (queryDto.type) {
      whereClause += ` AND type = ${paramIndex++}`;
      params.push(queryDto.type);
    }

    if (queryDto.country_id) {
      whereClause += ` AND country_id = ${paramIndex++}`;
      params.push(parseInt(queryDto.country_id, 10));
    }

    if (queryDto.region_id) {
      whereClause += ` AND region_id = ${paramIndex++}`;
      params.push(parseInt(queryDto.region_id, 10));
    }

    if (queryDto.currency_id) {
      whereClause += ` AND currency_id = ${paramIndex++}`;
      params.push(parseInt(queryDto.currency_id, 10));
    }

    if (queryDto.code) {
      whereClause += ` AND code ILIKE ${paramIndex++}`;
      params.push(`%${queryDto.code}%`);
    }

    if (queryDto.is_compound !== undefined) {
      whereClause += ` AND is_compound = ${paramIndex++}`;
      params.push(queryDto.is_compound);
    }

    if (queryDto.is_flexible !== undefined) {
      whereClause += ` AND is_flexible = ${paramIndex++}`;
      params.push(queryDto.is_flexible);
    }

    if (queryDto.is_inclusive !== undefined) {
      whereClause += ` AND is_inclusive = ${paramIndex++}`;
      params.push(queryDto.is_inclusive);
    }

    return { whereClause, paramIndex };
  }

  async findTaxByIdAdmin(id: number): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT ${this.taxSelectFields}
        FROM taxes
        WHERE id = $1
      `;
      const result = await SelectQuery(sql, [id]);
      if (result.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result[0]);
    } catch (e) {
      console.error('Error in findTaxByIdAdmin:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async findTaxByCode(code: string): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT ${this.taxSelectFields}
        FROM taxes
        WHERE code = $1
      `;
      const result = await SelectQuery(sql, [code]);
      if (result.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result[0]);
    } catch (e) {
      console.error('Error in findTaxByCode:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async createTax(createTaxDto: CreateTaxDto, userId?: number): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        INSERT INTO taxes (
          name, code, rate, type, description, country_id, region_id, currency_id,
          is_flexible, threshold_less, threshold_greater, rate_less, rate_greater,
          is_compound, compound_order, effective_from, effective_until, is_inclusive,
          applies_to, exemptions, is_active, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING ${this.taxSelectFields}`;

      const params = [
        createTaxDto.name,
        createTaxDto.code,
        createTaxDto.rate,
        createTaxDto.type,
        createTaxDto.description,
        createTaxDto.country_id || null,
        createTaxDto.region_id || null,
        createTaxDto.currency_id || 1,
        createTaxDto.is_flexible ?? false,
        createTaxDto.threshold_less ?? 0,
        createTaxDto.threshold_greater ?? 0,
        createTaxDto.rate_less ?? 0.0,
        createTaxDto.rate_greater ?? 0.0,
        createTaxDto.is_compound ?? false,
        createTaxDto.compound_order ?? 0,
        createTaxDto.effective_from || null,
        createTaxDto.effective_until || null,
        createTaxDto.is_inclusive ?? false,
        createTaxDto.applies_to ? JSON.stringify(createTaxDto.applies_to) : '["products", "shipping"]',
        createTaxDto.exemptions ? JSON.stringify(createTaxDto.exemptions) : null,
        createTaxDto.is_active ?? true,
        userId || null,
      ];

      const result = await InsertQuery(sql, params);
      return ApiResponse.created(result.rows[0]);
    } catch (e) {
      console.error('Error in createTax:', e);
      if (e.code === '23505') { // Unique constraint violation
        return ApiResponse.badRequest('Tax code already exists');
      }
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async updateTax(
    id: number,
    updateTaxDto: UpdateTaxDto,
    userId?: number,
  ): Promise<ApiResponseFormat<any>> {
    try {
      const fieldsToUpdate: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const key in updateTaxDto) {
        if (!Object.prototype.hasOwnProperty.call(updateTaxDto, key)) continue;
        const value = updateTaxDto[key];
        if (value === undefined) continue;

        if (key === 'applies_to' || key === 'exemptions') {
          fieldsToUpdate.push(`${key} = $${paramIndex++}`);
          params.push(JSON.stringify(value));
        }
        else if (['is_compound', 'is_inclusive', 'is_flexible', 'is_active'].includes(key)) {
          fieldsToUpdate.push(`${key} = $${paramIndex++}::boolean`);
          params.push(Boolean(value));
        }
        else {
          fieldsToUpdate.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      }

      if (fieldsToUpdate.length === 0) {
        return ApiResponse.badRequest(Messages.NO_FIELDS_TO_UPDATE);
      }

      if (userId) {
        fieldsToUpdate.push(`updated_by = $${paramIndex++}`);
        params.push(userId);
      }

      params.push(id);
      const sql = `
      UPDATE taxes
      SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex++}
      RETURNING ${this.taxSelectFields};
    `;

      const result = await UpdateQuery(sql, params);
      if (result.rows.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result.rows[0]);
    } catch (e) {
      console.error('Error in updateTax:', e);
      if (e.code === '23505') {
        return ApiResponse.badRequest('Tax code already exists');
      }
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }


  async deleteTax(id: number): Promise<ApiResponseFormat<boolean>> {
    try {
      const sql = `DELETE FROM taxes WHERE id = $1`;
      const result = await DeleteQuery(sql, [id]);
      if (result.rowCount === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(true, Messages.RESOURCE_DELETED);
    } catch (e) {
      console.error('Error in deleteTax:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async softDeleteTax(id: number, userId?: number): Promise<ApiResponseFormat<boolean>> {
    try {
      const params: any[] = [];
      let paramIndex = 1;

      let sql = `
      UPDATE taxes
      SET is_active = $${paramIndex++}::boolean, updated_at = CURRENT_TIMESTAMP
    `;
      params.push(false);

      if (userId) {
        sql += `, updated_by = $${paramIndex++}`;
        params.push(userId);
      }

      sql += ` WHERE id = $${paramIndex}`;
      params.push(id);

      const result = await UpdateQuery(sql, params);

      if (result.rowCount === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(true, 'Tax deactivated successfully');
    } catch (e) {
      console.error('Error in softDeleteTax:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }
}