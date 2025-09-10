import { Injectable } from '@nestjs/common';
import { ApiResponseFormat, ApiResponse } from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import { SelectQuery, InsertQuery, UpdateQuery, DeleteQuery } from 'src/db/postgres.client';
import { ProductInventoryQueryDto, CreateProductInventoryDto, UpdateProductInventoryDto } from './dto/product-inventory.dto';

@Injectable()
export class ProductInventoryRepository {
  private readonly inventorySelectFields = `
    id, product_id, combination_id, warehouse_id, quantity, low_stock_threshold, track_inventory, updated_at
  `;

  private camelToSnakeCase(key: string): string {
    return key.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  // --- Common Inventory Queries (Vendor/Admin) ---
  async findAllInventory(queryDto: ProductInventoryQueryDto): Promise<ApiResponseFormat<any[]>> {
    try {
      let sql = `
        SELECT ${this.inventorySelectFields}
        FROM product_inventory
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (queryDto.productId) {
        sql += ` AND product_id = $${paramIndex++}`;
        params.push(parseInt(queryDto.productId, 10));
      }
      if (queryDto.warehouseId) {
        sql += ` AND warehouse_id = $${paramIndex++}`;
        params.push(parseInt(queryDto.warehouseId, 10));
      }
      if (queryDto.trackInventory !== undefined) {
        sql += ` AND track_inventory = $${paramIndex++}`;
        params.push(queryDto.trackInventory === 'true');
      }

      sql += ` ORDER BY product_id ASC, warehouse_id ASC`;
      const result = await SelectQuery(sql, params);
      return ApiResponse.success(result);
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async findInventoryById(id: number): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT ${this.inventorySelectFields}
        FROM product_inventory
        WHERE id = $1
      `;
      const result = await SelectQuery(sql, [id]);
      if (result.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result[0]);
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async createInventory(createInventoryDto: CreateProductInventoryDto): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        INSERT INTO product_inventory (product_id, combination_id, warehouse_id, quantity, low_stock_threshold, track_inventory)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING ${this.inventorySelectFields}`;
      const params = [
        createInventoryDto.productId,
        createInventoryDto.combinationId,
        createInventoryDto.warehouseId,
        createInventoryDto.quantity,
        createInventoryDto.lowStockThreshold ?? 5,
        createInventoryDto.trackInventory ?? true,
      ];
      const result = await InsertQuery(sql, params);
      return ApiResponse.created(result.rows[0]);
    } catch (e) {
      // Handle potential unique constraint violation for (product_id, combination_id, warehouse_id)
      if (e.code === '23505') { // PostgreSQL unique_violation error code
        return ApiResponse.badRequest('Inventory entry for this product, combination, and warehouse already exists.');
      }
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async updateInventory(id: number, updateInventoryDto: UpdateProductInventoryDto): Promise<ApiResponseFormat<any>> {
    try {
      const fieldsToUpdate: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const key in updateInventoryDto) {
        if (updateInventoryDto.hasOwnProperty(key)) {
          const dbColumnName = this.camelToSnakeCase(key);
          if (updateInventoryDto[key] !== undefined) {
            fieldsToUpdate.push(`${dbColumnName} = $${paramIndex++}`);
            params.push(updateInventoryDto[key]);
          }
        }
      }

      if (fieldsToUpdate.length === 0) {
        return ApiResponse.badRequest(Messages.NO_FIELDS_TO_UPDATE);
      }

      params.push(id);
      const sql = `
        UPDATE product_inventory
        SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex++}
        RETURNING ${this.inventorySelectFields}`;

      const result = await UpdateQuery(sql, params);
      if (result.rows.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result.rows[0]);
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async deleteInventory(id: number): Promise<ApiResponseFormat<boolean>> {
    try {
      const sql = `DELETE FROM product_inventory WHERE id = $1`;
      const result = await DeleteQuery(sql, [id]);
      if (result.rowCount === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(true, Messages.RESOURCE_DELETED);
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // --- Specific queries for managing quantity (e.g., after order or return) ---
  async updateInventoryQuantity(
    productId: number,
    warehouseId: number,
    quantityChange: number, // positive for add, negative for subtract
    combinationId?: number,
  ): Promise<ApiResponseFormat<any>> {
    try {
      let sql = `
        UPDATE product_inventory
        SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2 AND warehouse_id = $3
      `;
      const params: any[] = [quantityChange, productId, warehouseId];
      let paramIndex = 4;

      if (combinationId !== undefined && combinationId !== null) {
        sql += ` AND combination_id = $${paramIndex++}`;
        params.push(combinationId);
      } else {
        sql += ` AND combination_id IS NULL`; // For products without variants
      }

      sql += ` RETURNING ${this.inventorySelectFields}`;

      const result = await UpdateQuery(sql, params);
      if (result.rows.length === 0) {
        return ApiResponse.notFound('Inventory entry not found for the given product, warehouse, and combination.');
      }
      return ApiResponse.success(result.rows[0], 'Inventory quantity updated successfully.');
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async getInventoryForProductAndWarehouse(
    productId: number,
    warehouseId: number,
    combinationId?: number,
  ): Promise<ApiResponseFormat<any>> {
    try {
      let sql = `
        SELECT ${this.inventorySelectFields}
        FROM product_inventory
        WHERE product_id = $1 AND warehouse_id = $2
      `;
      const params: any[] = [productId, warehouseId];
      let paramIndex = 3;

      if (combinationId !== undefined && combinationId !== null) {
        sql += ` AND combination_id = $${paramIndex++}`;
        params.push(combinationId);
      } else {
        sql += ` AND combination_id IS NULL`;
      }

      const result = await SelectQuery(sql, params);
      if (result.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result[0]);
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }
}