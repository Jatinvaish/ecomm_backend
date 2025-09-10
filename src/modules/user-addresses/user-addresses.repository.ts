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
import { AddressQueryDto, CreateUserAddressDto, UpdateUserAddressDto } from './dto/user-addresses.dto';

@Injectable()
export class UserAddressRepository {
  private readonly addressSelectFields = `
    ua.id, ua.user_id, ua.type, ua.company, ua.first_name, ua.last_name,
    ua.address_line1, ua.address_line2, ua.city_id, ua.city_name,
    ua.region_id, ua.region_name, ua.country_id, ua.postal_code,
    ua.phone_number, ua.instructions, ua.landmark, ua.is_default,
    ua.is_verified, ua.nickname, ua.created_at, ua.updated_at,
    c.name as country_name,
    r.name as region_name_full,
    ct.name as city_name_full
  `;

  private readonly addressFromClause = `
    FROM user_addresses ua
    LEFT JOIN countries c ON ua.country_id = c.id
    LEFT JOIN regions r ON ua.region_id = r.id
    LEFT JOIN cities ct ON ua.city_id = ct.id
  `;

  // --- User-facing queries ---
  async getUserAddresses(
    userId: number,
    queryDto: AddressQueryDto,
  ): Promise<ApiResponseFormat<any>> {
    try {
      const params: any[] = [userId];
      let paramIndex = 2;

      let baseQuery = `
        SELECT ${this.addressSelectFields}
        ${this.addressFromClause}
        WHERE ua.user_id = $1
      `;

      const { whereClause, paramIndex: newParamIndex } =
        this.buildAddressWhereClause(queryDto, params, paramIndex);
      baseQuery += ` ${whereClause}`;

      const total = await getTotalCount(baseQuery, params);
      //@ts-ignore
      let sql = baseQuery + ` ${buildOrderClause(queryDto, 'ua.is_default DESC, ua.created_at')}`;

      const page = Math.max(1, parseInt(queryDto.page?.toString() || '1', 10));
      const perPage = Math.min(
        50,
        Math.max(1, parseInt(queryDto.per_page?.toString() || '20', 10)),
      );
      const offset = (page - 1) * perPage;

      sql += ` LIMIT $${newParamIndex} OFFSET $${newParamIndex + 1}`;
      params.push(perPage, offset);

      const result = await SelectQuery(sql, params);
      const meta = buildPaginationMeta(total, page, perPage);

      return ApiResponse.success({
        meta,
        addresses: result,
      });
    } catch (e) {
      console.error('Error in getUserAddresses:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async getUserAddressById(id: number, userId: number): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT ${this.addressSelectFields}
        ${this.addressFromClause}
        WHERE ua.id = $1 AND ua.user_id = $2
      `;
      const result = await SelectQuery(sql, [id, userId]);
      if (result.length === 0) {
        return ApiResponse.notFound('Address not found or you do not have permission to access it');
      }
      return ApiResponse.success(result[0]);
    } catch (e) {
      console.error('Error in getUserAddressById:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async createUserAddress(
    userId: number,
    createAddressDto: CreateUserAddressDto,
  ): Promise<ApiResponseFormat<any>> {
    try {
      // If setting as default, first unset other defaults
      if (createAddressDto.is_default) {
        await this.unsetDefaultAddresses(userId, createAddressDto.type);
      }

      const sql = `
        INSERT INTO user_addresses (
          user_id, type, company, first_name, last_name, address_line1, address_line2,
          city_id, city_name, region_id, region_name, country_id, postal_code,
          phone_number, instructions, landmark, is_default, is_verified, nickname, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING id
      `;

      const params = [
        userId,
        createAddressDto.type,
        createAddressDto.company || null,
        createAddressDto.first_name,
        createAddressDto.last_name,
        createAddressDto.address_line1,
        createAddressDto.address_line2 || null,
        createAddressDto.city_id || null,
        createAddressDto.city_name,
        createAddressDto.region_id || null,
        createAddressDto.region_name || null,
        createAddressDto.country_id,
        createAddressDto.postal_code,
        createAddressDto.phone_number || null,
        createAddressDto.instructions || null,
        createAddressDto.landmark || null,
        createAddressDto.is_default || false,
        true, // is_verified - always true since addresses are pre-approved
        createAddressDto.nickname || null,
        userId,
      ];

      const insertResult = await InsertQuery(sql, params);
      const newId = insertResult.rows[0].id;

      // Fetch the complete address with joined data
      const fetchSql = `
        SELECT ${this.addressSelectFields}
        ${this.addressFromClause}
        WHERE ua.id = $1
      `;
      const result = await SelectQuery(fetchSql, [newId]);

      return ApiResponse.created(result[0]);
    } catch (e) {
      console.error('Error in createUserAddress:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async updateUserAddress(
    id: number,
    userId: number,
    updateAddressDto: UpdateUserAddressDto,
  ): Promise<ApiResponseFormat<any>> {
    try {
      // Check if address exists and belongs to user
      const existsCheck = await SelectQuery(
        'SELECT id, type FROM user_addresses WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (existsCheck.length === 0) {
        return ApiResponse.notFound('Address not found or you do not have permission to update it');
      }

      // If setting as default, unset other defaults
      if (updateAddressDto.is_default) {
        const addressType = updateAddressDto.type || existsCheck[0].type;
        await this.unsetDefaultAddresses(userId, addressType);
      }

      const fieldsToUpdate: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (const key in updateAddressDto) {
        if (!Object.prototype.hasOwnProperty.call(updateAddressDto, key)) continue;
        const value = updateAddressDto[key];
        if (value === undefined) continue;

        if (key === 'is_default') {
          fieldsToUpdate.push(`${key} = $${paramIndex++}::boolean`);
          params.push(Boolean(value));
        } else {
          fieldsToUpdate.push(`${key} = $${paramIndex++}`);
          params.push(value);
        }
      }

      if (fieldsToUpdate.length === 0) {
        return ApiResponse.badRequest(Messages.NO_FIELDS_TO_UPDATE);
      }

      fieldsToUpdate.push(`updated_by = $${paramIndex++}`);
      params.push(userId);

      params.push(id, userId);
      const sql = `
        UPDATE user_addresses
        SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
        RETURNING id
      `;

      const updateResult = await UpdateQuery(sql, params);
      if (updateResult.rows.length === 0) {
        return ApiResponse.notFound('Address not found or you do not have permission to update it');
      }

      // Fetch the updated address with joined data
      const fetchSql = `
        SELECT ${this.addressSelectFields}
        ${this.addressFromClause}
        WHERE ua.id = $1
      `;
      const result = await SelectQuery(fetchSql, [id]);

      return ApiResponse.success(result[0]);
    } catch (e) {
      console.error('Error in updateUserAddress:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async deleteUserAddress(id: number, userId: number): Promise<ApiResponseFormat<boolean>> {
    try {
      const sql = `DELETE FROM user_addresses WHERE id = $1 AND user_id = $2`;
      const result = await DeleteQuery(sql, [id, userId]);

      if (result.rowCount === 0) {
        return ApiResponse.notFound('Address not found or you do not have permission to delete it');
      }

      return ApiResponse.success(true, 'Address deleted successfully');
    } catch (e) {
      console.error('Error in deleteUserAddress:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async setDefaultAddress(id: number, userId: number): Promise<ApiResponseFormat<any>> {
    try {
      // Get the address type first
      const addressCheck = await SelectQuery(
        'SELECT type FROM user_addresses WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (addressCheck.length === 0) {
        return ApiResponse.notFound('Address not found or you do not have permission to access it');
      }

      const addressType = addressCheck[0].type;

      // Unset other default addresses of the same type
      await this.unsetDefaultAddresses(userId, addressType);

      // Set this address as default
      const sql = `
        UPDATE user_addresses
        SET is_default = true, updated_at = CURRENT_TIMESTAMP, updated_by = $1
        WHERE id = $2 AND user_id = $1
        RETURNING id
      `;

      const result = await UpdateQuery(sql, [userId, id]);

      if (result.rows.length === 0) {
        return ApiResponse.notFound('Address not found');
      }

      return ApiResponse.success({
        address_id: id,
        type: addressType
      }, 'Default address updated successfully');
    } catch (e) {
      console.error('Error in setDefaultAddress:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // --- Admin queries ---
  async findAllAddressesAdmin(
    queryDto: AddressQueryDto,
  ): Promise<ApiResponseFormat<any>> {
    try {
      const params: any[] = [];
      let paramIndex = 1;

      let baseQuery = `
        SELECT ${this.addressSelectFields}
        ${this.addressFromClause}
        WHERE 1=1
      `;

      const { whereClause, paramIndex: newParamIndex } =
        this.buildAddressWhereClause(queryDto, params, paramIndex, true);
      baseQuery += ` ${whereClause}`;

      const total = await getTotalCount(baseQuery, params);
      //@ts-ignore
      let sql = baseQuery + ` ${buildOrderClause(queryDto, 'ua.created_at')}`;

      const page = Math.max(1, parseInt(queryDto.page?.toString() || '1', 10));
      const perPage = Math.min(
        100,
        Math.max(1, parseInt(queryDto.per_page?.toString() || '20', 10)),
      );
      const offset = (page - 1) * perPage;

      sql += ` LIMIT $${newParamIndex} OFFSET $${newParamIndex + 1}`;
      params.push(perPage, offset);

      const result = await SelectQuery(sql, params);
      const meta = buildPaginationMeta(total, page, perPage);

      return ApiResponse.success({
        meta,
        addresses: result,
      });
    } catch (e) {
      console.error('Error in findAllAddressesAdmin:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async findAddressByIdAdmin(id: number): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT ${this.addressSelectFields}
        ${this.addressFromClause}
        WHERE ua.id = $1
      `;
      const result = await SelectQuery(sql, [id]);
      if (result.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result[0]);
    } catch (e) {
      console.error('Error in findAddressByIdAdmin:', e);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // --- Helper methods ---
  private buildAddressWhereClause(
    queryDto: AddressQueryDto,
    params: any[],
    paramIndex: number,
    isAdmin = false,
  ): { whereClause: string; paramIndex: number } {
    let whereClause = '';

    // Define allowed search columns for security
    const allowedSearchColumns = [
      'ua.first_name', 'ua.last_name', 'ua.company', 'ua.address_line1',
      'ua.city_name', 'ua.nickname', 'ua.postal_code'
    ];

    // Validate and sanitize search fields
    if (queryDto.search  ) {
      const searchConditions = allowedSearchColumns.map(() =>
        `ILIKE $${paramIndex}`
      ).join(' OR ');

      whereClause += ` AND (${searchConditions})`;

      // Add the search term for each column
      allowedSearchColumns.forEach(() => {
        params.push(`%${queryDto.search}%`);
      });
      paramIndex += allowedSearchColumns.length;
    }

    // Validate address type
    if (queryDto.type && this.isValidAddressType(queryDto.type)) {
      whereClause += ` AND (ua.type = $${paramIndex} OR ua.type = 'both')`;
      params.push(queryDto.type);
      paramIndex++;
    }

    // Validate and sanitize numeric IDs
    if (queryDto.country_id && this.isValidId(queryDto.country_id)) {
      whereClause += ` AND ua.country_id = $${paramIndex}`;
      params.push(parseInt(queryDto.country_id.toString(), 10));
      paramIndex++;
    }

    if (queryDto.region_id && this.isValidId(queryDto.region_id)) {
      whereClause += ` AND ua.region_id = $${paramIndex}`;
      params.push(parseInt(queryDto.region_id.toString(), 10));
      paramIndex++;
    }

    if (queryDto.city_id && this.isValidId(queryDto.city_id)) {
      whereClause += ` AND ua.city_id = $${paramIndex}`;
      params.push(parseInt(queryDto.city_id.toString(), 10));
      paramIndex++;
    }

    // Validate boolean fields
    if (queryDto.is_default !== undefined && this.isValidBoolean(queryDto.is_default)) {
      whereClause += ` AND ua.is_default = $${paramIndex}`;
      //@ts-ignore
      params.push(queryDto.is_default === 'true' || queryDto.is_default === true);
      paramIndex++;
    }

    // Admin-only filters with validation
    if (isAdmin) {
      if (queryDto.user_id && this.isValidId(queryDto.user_id)) {
        whereClause += ` AND ua.user_id = $${paramIndex}`;
        params.push(parseInt(queryDto.user_id.toString(), 10));
        paramIndex++;
      }

      if (queryDto.verified_only !== undefined && this.isValidBoolean(queryDto.verified_only)) {
        whereClause += ` AND ua.is_verified = $${paramIndex}`;
        //@ts-ignore
        params.push(queryDto.verified_only === 'true' || queryDto.verified_only === true);
        paramIndex++;
      }
    }

    return { whereClause, paramIndex };
  }


  private isValidAddressType(type: string | any): type is ('shipping' | 'billing' | 'both') {
    return typeof type === 'string' && ['shipping', 'billing', 'both'].includes(type);
  }

  private isValidId(id: number | string | any): id is number {
    if (typeof id === 'number') {
      return Number.isInteger(id) && id > 0 && id <= 2147483647; // PostgreSQL INT limit
    }

    if (typeof id === 'string') {
      const parsed = parseInt(id, 10);
      return !isNaN(parsed) && parsed > 0 && parsed <= 2147483647;
    }

    return false;
  }

  private isValidBoolean(value: boolean | string | any): boolean {
    if (typeof value === 'boolean') return true;
    if (typeof value === 'string') {
      return ['true', 'false', '1', '0'].includes(value.toLowerCase());
    }
    return false;
  }

  private async unsetDefaultAddresses(userId: number, addressType: string): Promise<void> {
    try {
      let sql: string;
      let params: any[];

      if (addressType === 'both') {
        // If setting 'both', unset all default addresses
        sql = `
          UPDATE user_addresses 
          SET is_default = false, updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = $1 AND is_default = true
        `;
        params = [userId];
      } else {
        // Unset default for same type and 'both' type
        sql = `
          UPDATE user_addresses 
          SET is_default = false, updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = $1 AND is_default = true AND (type = $2 OR type = 'both')
        `;
        params = [userId, addressType];
      }

      await UpdateQuery(sql, params);
    } catch (e) {
      console.error('Error in unsetDefaultAddresses:', e);
      throw e;
    }
  }
}