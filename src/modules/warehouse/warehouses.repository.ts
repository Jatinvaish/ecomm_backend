import { Injectable } from '@nestjs/common';
import { ApiResponseFormat, ApiResponse } from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import { SelectQuery, InsertQuery, UpdateQuery, DeleteQuery } from 'src/db/postgres.client';
import { WarehouseQueryDto, CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

@Injectable()
export class WarehousesRepository {
  private readonly warehouseSelectFields = `
    id, vendor_id, name, address_line1, city, postal_code, is_primary, is_active, created_at
  `;

  private camelToSnakeCase(key: string): string {
    return key.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  // --- Common Warehouse Queries (Vendor/Admin) ---
  async findAllWarehouses(queryDto: WarehouseQueryDto): Promise<ApiResponseFormat<any[]>> {
    try {
      let sql = `
        SELECT ${this.warehouseSelectFields}
        FROM warehouses
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (queryDto.vendorId) {
        sql += ` AND vendor_id = $${paramIndex++}`;
        params.push(parseInt(queryDto.vendorId, 10));
      }
      if (queryDto.isPrimary !== undefined) {
        sql += ` AND is_primary = $${paramIndex++}`;
        params.push(queryDto.isPrimary === 'true');
      }
      if (queryDto.isActive !== undefined) {
        sql += ` AND is_active = $${paramIndex++}`;
        params.push(queryDto.isActive === 'true');
      }

      sql += ` ORDER BY vendor_id ASC, is_primary DESC, name ASC`;
      const result = await SelectQuery(sql, params);
      return ApiResponse.success(result); // SelectQuery returns rows directly
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async findWarehouseById(id: number): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT ${this.warehouseSelectFields}
        FROM warehouses
        WHERE id = $1
      `;
      const result = await SelectQuery(sql, [id]);
      if (result.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result[0]); // Access first element directly
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async createWarehouse(createWarehouseDto: CreateWarehouseDto): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        INSERT INTO warehouses (vendor_id, name, address_line1, city, postal_code, is_primary, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING ${this.warehouseSelectFields}`;
      const params = [
        createWarehouseDto.vendorId,
        createWarehouseDto.name,
        createWarehouseDto.addressLine1,
        createWarehouseDto.city,
        createWarehouseDto.postalCode,
        createWarehouseDto.isPrimary ?? false,
        createWarehouseDto.isActive ?? true,
      ];
      const result = await InsertQuery(sql, params);
      return ApiResponse.created(result.rows[0]);
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async updateWarehouse(id: number, updateWarehouseDto: UpdateWarehouseDto, vendorId?: number): Promise<ApiResponseFormat<any>> {
    try {
      const fieldsToUpdate: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const key in updateWarehouseDto) {
        if (updateWarehouseDto.hasOwnProperty(key)) {
          const dbColumnName = this.camelToSnakeCase(key);
          if (updateWarehouseDto[key] !== undefined) {
            fieldsToUpdate.push(`${dbColumnName} = $${paramIndex++}`);
            params.push(updateWarehouseDto[key]);
          }
        }
      }

      if (fieldsToUpdate.length === 0) {
        return ApiResponse.badRequest(Messages.NO_FIELDS_TO_UPDATE);
      }

      let sql = `
        UPDATE warehouses
        SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex++}
      `;
      params.push(id);

      if (vendorId) { // For vendor-specific update
        sql += ` AND vendor_id = $${paramIndex++}`;
        params.push(vendorId);
      }

      sql += ` RETURNING ${this.warehouseSelectFields}`;

      const result = await UpdateQuery(sql, params);
      if (result.rows.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result.rows[0]);
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async deleteWarehouse(id: number, vendorId?: number): Promise<ApiResponseFormat<boolean>> {
    try {
      let sql = `DELETE FROM warehouses WHERE id = $1`;
      const params: any[] = [id];
      let paramIndex = 2;

      if (vendorId) { // For vendor-specific delete
        sql += ` AND vendor_id = $${paramIndex++}`;
        params.push(vendorId);
      }

      const result = await DeleteQuery(sql, params);
      if (result.rowCount === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(true, Messages.RESOURCE_DELETED);
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // --- Specific Vendor-facing queries ---
  async findVendorWarehouses(vendorId: number): Promise<ApiResponseFormat<any[]>> {
    try {
      const sql = `
        SELECT ${this.warehouseSelectFields}
        FROM warehouses
        WHERE vendor_id = $1
        ORDER BY is_primary DESC, name ASC
      `;
      const result = await SelectQuery(sql, [vendorId]);
      return ApiResponse.success(result);
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }
}

