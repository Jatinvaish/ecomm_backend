// import { Injectable } from '@nestjs/common';
// import { CreateVendorDto, UpdateVendorDto, VendorQueryDto, VendorStatus } from './dto/vendor.dto';
// import { ApiResponseFormat, ApiResponse } from 'src/common/utils/common-response';
// import { Messages } from 'src/common/utils/messages';
// import { SelectQuery, InsertQuery, UpdateQuery, DeleteQuery } from 'src/db/postgres.client';

// @Injectable()
// export class VendorsRepository {
//   private readonly vendorSelectFields = `
//     id, user_id, tier_id, store_name, store_slug, status, created_at, updated_at
//   `;

//   private camelToSnakeCase(key: string): string {
//     return key.replace(/([A-Z])/g, '_$1').toLowerCase();
//   }

//   // --- Admin-facing queries ---
//   async findAllVendorsAdmin(queryDto: VendorQueryDto): Promise<ApiResponseFormat<any[]>> {
//     try {
//       let sql = `
//         SELECT ${this.vendorSelectFields}
//         FROM vendors
//         WHERE 1=1
//       `;
//       const params: any[] = [];
//       let paramIndex = 1;

//       if (queryDto.userId) {
//         sql += ` AND user_id = $${paramIndex++}`;
//         params.push(parseInt(queryDto.userId, 10));
//       }
//       if (queryDto.tierId) {
//         sql += ` AND tier_id = $${paramIndex++}`;
//         params.push(parseInt(queryDto.tierId, 10));
//       }
//       if (queryDto.status) {
//         sql += ` AND status = $${paramIndex++}`;
//         params.push(queryDto.status);
//       }
//       if (queryDto.search) {
//         sql += ` AND (store_name ILIKE $${paramIndex++} OR store_slug ILIKE $${paramIndex++})`;
//         params.push(`%${queryDto.search}%`, `%${queryDto.search}%`);
//       }

//       sql += ` ORDER BY created_at DESC`;
//       const result:any = await SelectQuery(sql, params);
//       return ApiResponse.success(result); // SelectQuery returns rows directly
//     } catch (e) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async findVendorByIdAdmin(id: number): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         SELECT ${this.vendorSelectFields}
//         FROM vendors
//         WHERE id = $1
//       `;
//       const result:any = await SelectQuery(sql, [id]);
//       if (result.length === 0) {
//         return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
//       }
//       return ApiResponse.success(result[0]); // Access first element directly
//     } catch (e) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async createVendor(createVendorDto: CreateVendorDto): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         INSERT INTO vendors (user_id, tier_id, store_name, store_slug, status)
//         VALUES ($1, $2, $3, $4, $5)
//         RETURNING ${this.vendorSelectFields}`;
//       const params = [
//         createVendorDto.userId,
//         createVendorDto.tierId,
//         createVendorDto.storeName,
//         createVendorDto.storeSlug,
//         createVendorDto.status || VendorStatus.PENDING,
//       ];
//       const result:any = await InsertQuery(sql, params);
//       return ApiResponse.created(result.rows[0]);
//     } catch (e) {
//       // Handle potential unique constraint violation for store_name, store_slug, user_id
//       if (e.code === '23505') { // PostgreSQL unique_violation error code
//         return ApiResponse.badRequest('Vendor with this user ID, store name, or store slug already exists.');
//       }
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async updateVendor(id: number, updateVendorDto: UpdateVendorDto): Promise<ApiResponseFormat<any>> {
//     try {
//       const fieldsToUpdate: string[] = [];
//       const params: any[] = [];
//       let paramIndex = 1;

//       for (const key in updateVendorDto) {
//         if (updateVendorDto.hasOwnProperty(key)) {
//           const dbColumnName = this.camelToSnakeCase(key);
//           if (updateVendorDto[key] !== undefined) {
//             fieldsToUpdate.push(`${dbColumnName} = $${paramIndex++}`);
//             params.push(updateVendorDto[key]);
//           }
//         }
//       }

//       if (fieldsToUpdate.length === 0) {
//         return ApiResponse.badRequest(Messages.NO_FIELDS_TO_UPDATE);
//       }

//       params.push(id); // Add id for WHERE clause
//       const sql = `
//         UPDATE vendors
//         SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP
//         WHERE id = $${paramIndex++}
//         RETURNING ${this.vendorSelectFields}`;

//       const result:any = await UpdateQuery(sql, params);
//       if (result.rows.length === 0) {
//         return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
//       }
//       return ApiResponse.success(result.rows[0]);
//     } catch (e) {
//       // Handle potential unique constraint violation for store_name, store_slug, user_id
//       if (e.code === '23505') {
//         return ApiResponse.badRequest('Update failed: Vendor with this store name or store slug already exists.');
//       }
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async deleteVendor(id: number): Promise<ApiResponseFormat<boolean>> {
//     try {
//       const sql = `DELETE FROM vendors WHERE id = $1`;
//       const result:any = await DeleteQuery(sql, [id]);
//       if (result.rowCount === 0) {
//         return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
//       }
//       return ApiResponse.success(true, Messages.RESOURCE_DELETED);
//     } catch (e) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   // --- Public/User-facing queries (e.g., to view vendor store details) ---
//   async findActiveVendorBySlug(slug: string): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         SELECT ${this.vendorSelectFields}
//         FROM vendors
//         WHERE store_slug = $1 AND status = '${VendorStatus.APPROVED}'
//       `;
//       const result:any = await SelectQuery(sql, [slug]);
//       if (result.length === 0) {
//         return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
//       }
//       return ApiResponse.success(result[0]);
//     } catch (e) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }
// }

//v2

import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import {
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  DeleteQuery,
} from 'src/db/postgres.client';
import { PaginatedResponse } from 'src/common/utils/interface';
import { CreateVendorDto, UpdateVendorDetailsDto, UpdateVendorDto, VendorFilterDto } from './dto/vendor.dto';
import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import { EmailService } from 'src/common/email.service';
import { generateOTP, isOTPExpired } from 'src/common/utils/otp.utils';

@Injectable()
export class VendorsRepository {
  constructor(private readonly emailService: EmailService) { }

  // ==================== USER OPERATIONS ====================

  /**
   * Find user by email
   */

  private readonly vendorSelectFields = `
      id, user_id, tier_id, store_name, store_slug, status, created_at, updated_at
    `;
  async findUserByEmail(email: string): Promise<any> {
    const sql = `
      SELECT 
        u.id, u.uuid, u.full_name, u.email, u.email_verified_at, u.phone_number,
        u.is_active, u.created_at
      FROM users u 
      WHERE u.email = $1 AND u.is_active = true
    `;
    const result: any = await SelectQuery(sql, [email]);
    return result[0];
  }

  /**
   * Find user by phone number
   */
  async findUserByPhone(phone: string): Promise<any> {
    const sql = `
      SELECT 
        u.id, u.uuid, u.full_name, u.email, u.phone_number,
        u.is_active, u.created_at
      FROM users u 
      WHERE u.phone_number = $1 AND u.is_active = true
    `;
    const result: any = await SelectQuery(sql, [phone]);
    return result[0];
  }

  /**
   * Find vendor by store name
   */
  async findVendorByStoreName(storeName: string): Promise<any> {
    const sql = `
      SELECT v.id, v.store_name, v.store_slug, v.user_id
      FROM vendors v 
      WHERE v.store_name = $1 AND v.status != 'inactive'
    `;
    const result: any = await SelectQuery(sql, [storeName]);
    return result[0];
  }

  // ==================== VENDOR CRUD OPERATIONS ====================

  /**
   * Create new vendor with user account
   */
  async createVendor(createVendorDto: CreateVendorDto): Promise<any> {
    let client: any = null;

    try {
      // For transaction handling, you might need to get client from pool
      // client = await pool.connect();
      // await client.query('BEGIN');

      // 1. Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(createVendorDto.password, saltRounds);

      // 2. Create user account
      const userSql = `
        INSERT INTO users (
          full_name, email, password_hash, phone_number, preferred_language_id,
          preferred_currency_id, country_id, timezone, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING id, uuid, full_name, email, phone_number, created_at
      `;

      const userParams = [
        createVendorDto.full_name,
        createVendorDto.email.toLowerCase(),
        passwordHash,
        createVendorDto.phone_number || null,
        createVendorDto.preferred_language_id || 1,
        createVendorDto.preferred_currency_id || 1,
        createVendorDto.country_id || 1,
        'UTC'
      ];

      const userResult = await InsertQuery(userSql, userParams);
      const user = userResult.rows[0];

      // 3. Assign vendor role
      await this.assignUserRole(user.id, 2); // Assuming 2 is vendor role

      // 4. Generate store slug
      const storeSlug = this.generateSlug(createVendorDto.store_name);

      // 5. Create vendor profile
      const vendorSql = `
        INSERT INTO vendors (
          user_id, tier_id, store_name, store_slug, business_name, business_type,
          tax_number, registration_number, description, address, contact_info,
          business_hours, social_links, status, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', true)
        RETURNING id, uuid, store_name, store_slug, status, created_at
      `;

      const vendorParams = [
        user.id,
        createVendorDto.tier_id || 1, // Default to basic tier
        createVendorDto.store_name,
        storeSlug,
        createVendorDto.business_name || null,
        createVendorDto.business_type || null,
        createVendorDto.tax_number || null,
        createVendorDto.registration_number || null,
        createVendorDto.description || null,
        JSON.stringify(createVendorDto.address || {}),
        JSON.stringify(createVendorDto.contact_info || {}),
        JSON.stringify(createVendorDto.business_hours || {}),
        JSON.stringify(createVendorDto.social_links || {})
      ];

      const vendorResult = await InsertQuery(vendorSql, vendorParams);
      const vendor = vendorResult.rows[0];

      // await client.query('COMMIT');

      return {
        id: vendor.id,
        user_id: user.id,
        uuid: vendor.uuid,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        store_name: vendor.store_name,
        store_slug: vendor.store_slug,
        status: vendor.status,
        created_at: vendor.created_at
      };
    } catch (error) {
      // if (client) await client.query('ROLLBACK');
      console.error('Create vendor error:', error);
      throw error;
    } finally {
      // if (client) client.release();
    }
  }

  /**
   * Generate slug from text
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Assign role to user
   */
  async assignUserRole(userId: number, roleId: number): Promise<void> {
    const sql = `
      INSERT INTO user_role_assignments (user_id, role_id, assigned_by)
      VALUES ($1, $2, $1)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `;
    await InsertQuery(sql, [userId, roleId]);
  }

  /**
   * Get vendor by user ID
   */
  async getVendorByUserId(userId: number): Promise<any> {
    const sql = `
      SELECT 
        v.id, v.uuid, v.user_id, v.tier_id, v.store_name, v.store_slug,
        v.business_name, v.business_type, v.description, v.status,
        v.avg_rating, v.total_reviews, v.total_products, v.total_sales,
        v.commission_balance, v.is_featured, v.created_at, v.updated_at,
        u.full_name, u.email, u.phone_number, u.email_verified_at,
        vt.name as tier_name, vt.commission_rate
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN vendor_tiers vt ON v.tier_id = vt.id
      WHERE v.user_id = $1 AND v.is_active = true AND u.is_active = true
    `;
    const result: any = await SelectQuery(sql, [userId]);
    return result[0];
  }

  /**
   * Get vendor profile by user ID
   */
  async getVendorProfileByUserId(userId: number): Promise<any> {
    const sql = `
    SELECT 
      v.*,
      u.full_name, u.email, u.phone_number, u.email_verified_at,
      u.phone_verified_at, u.preferred_language_id, u.preferred_currency_id,
      u.country_id, u.timezone, u.avatar_url,
      vt.name as tier_name, vt.slug as tier_slug, vt.commission_rate,
      vt.product_limit, vt.features, vt.pricing, vt.benefits,
      -- Bank details
      vbd.id as bank_details_id,
      vbd.account_type,
      vbd.bank_name,
      vbd.bank_code,
      vbd.branch_name,
      vbd.branch_code,
      vbd.account_holder_name,
      vbd.account_number,
      vbd.routing_number,
      vbd.swift_code,
      vbd.iban,
      vbd.ifsc_code,
      vbd.tax_id,
      vbd.is_verified as bank_is_verified,
      vbd.verification_documents as bank_verification_documents,
      vbd.verified_at as bank_verified_at,
      vbd.verified_by as bank_verified_by,
      vbd.created_at as bank_created_at,
      vbd.updated_at as bank_updated_at,
      -- Roles aggregation
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', r.id,
            'name', r.name,
            'slug', r.slug,
            'permissions', r.permissions
          )
        ) FILTER (WHERE r.id IS NOT NULL), 
        '[]'::json
      ) as roles
    FROM vendors v
    JOIN users u ON v.user_id = u.id
    LEFT JOIN vendor_tiers vt ON v.tier_id = vt.id
    LEFT JOIN vendor_bank_details vbd ON v.id = vbd.vendor_id
    LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
    LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
    WHERE v.user_id = $1 AND v.is_active = true AND u.is_active = true
    GROUP BY v.id, u.id, vt.id, vbd.id
  `;
    const result: any = await SelectQuery(sql, [userId]);
    return result[0];
  }
  /**
   * Update vendor profile
   */

  async updateVendorDetails(vendorId: number, updateData: Partial<UpdateVendorDetailsDto>): Promise<any> {
    try {
      console.log("🚀 ~ VendorsRepository ~ updateVendorDetails ~ updateData:", updateData);

      // Remove undefined/null values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );
      console.log("🚀 ~ VendorsRepository ~ updateVendorDetails ~ cleanedData:", cleanedData)

      if (Object.keys(cleanedData).length === 0) {
        throw new Error('No valid fields to update');
      }

      let updatedVendor = null;
      let bankDetails = null;

      // 1. UPDATE VENDORS TABLE
      const vendorFields = [
        'store_name', 'store_slug', 'business_name', 'business_type', 'tax_number',
        'registration_number', 'description', 'logo_url', 'banner_url', 'address',
        'contact_info', 'business_hours', 'social_links', 'shipping_policies',
        'return_policies', 'terms_conditions', 'settings', 'updated_by'
      ];

      const vendorUpdateData = {};
      vendorFields.forEach(field => {
        if (cleanedData[field] !== undefined) {
          vendorUpdateData[field] = cleanedData[field];
        }
      });

      if (Object.keys(vendorUpdateData).length > 0) {
        const vendorKeys = Object.keys(vendorUpdateData);
        const vendorSetClause = vendorKeys.map((key, index) => {
          // Handle JSONB fields
          if (['address', 'contact_info', 'business_hours', 'social_links', 'settings'].includes(key)) {
            return `${key} = $${index + 2}::jsonb`;
          }
          return `${key} = $${index + 2}`;
        }).join(', ');

        const vendorValues = [
          vendorId,
          ...vendorKeys.map(key => {
            const value = vendorUpdateData[key];
            // Handle JSONB serialization
            if (['address', 'contact_info', 'business_hours', 'social_links', 'settings'].includes(key)) {
              return typeof value === 'string' ? value : JSON.stringify(value);
            }
            return value;
          })
        ];

        const vendorSql = `
        UPDATE vendors 
        SET ${vendorSetClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING *
      `;

        console.log("🚀 ~ Vendor SQL:", vendorSql);
        console.log("🚀 ~ Vendor Values:", vendorValues);

        const vendorResult = await UpdateQuery(vendorSql, vendorValues);
        updatedVendor = vendorResult && vendorResult?.rows?.length > 0 ? vendorResult[0] : null;
        console.log("🚀 ~ Updated Vendor:", updatedVendor);
      }

      // 2. HANDLE BANK DETAILS (INSERT OR UPDATE)
      const bankFields = [
        'account_type', 'bank_name', 'bank_code', 'branch_name', 'branch_code',
        'account_holder_name', 'account_number', 'routing_number', 'swift_code',
        'iban', 'ifsc_code', 'tax_id', 'verification_documents'
      ];

      const bankUpdateData = {};
      bankFields.forEach(field => {
        if (cleanedData[field] !== undefined) {
          bankUpdateData[field] = cleanedData[field];
        }
      });

      if (Object.keys(bankUpdateData).length > 0) {
        // Check if bank details exist
        const existingBank = await SelectQuery(
          `SELECT id FROM vendor_bank_details WHERE vendor_id = $1`,
          [vendorId]
        );

        if (existingBank && existingBank.length > 0) {
          // UPDATE existing bank details
          const bankId = existingBank[0].id;
          const bankKeys = Object.keys(bankUpdateData);
          const bankSetClause = bankKeys.map((key, index) => {
            if (key === 'verification_documents') {
              return `${key} = $${index + 2}::jsonb`;
            }
            return `${key} = $${index + 2}`;
          }).join(', ');

          const bankValues = [
            bankId,
            ...bankKeys.map(key => {
              const value = bankUpdateData[key];
              if (key === 'verification_documents') {
                return typeof value === 'string' ? value : JSON.stringify(value);
              }
              return value;
            })
          ];

          const bankUpdateSql = `
          UPDATE vendor_bank_details 
          SET ${bankSetClause}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;

          console.log("🚀 ~ Bank Update SQL:", bankUpdateSql);
          console.log("🚀 ~ Bank Update Values:", bankValues);

          const bankResult = await UpdateQuery(bankUpdateSql, bankValues);
          bankDetails = bankResult && bankResult?.rows?.length > 0 ? bankResult[0] : null;

        } else {
          // INSERT new bank details
          const bankKeys = Object.keys(bankUpdateData);
          const bankColumns = ['vendor_id', ...bankKeys];
          const bankPlaceholders = bankColumns.map((col, index) => {
            if (col === 'verification_documents') {
              return `$${index + 1}::jsonb`;
            }
            return `$${index + 1}`;
          });

          const bankValues = [
            vendorId,
            ...bankKeys.map(key => {
              const value = bankUpdateData[key];
              if (key === 'verification_documents') {
                return typeof value === 'string' ? value : JSON.stringify(value);
              }
              return value;
            })
          ];

          const bankInsertSql = `
          INSERT INTO vendor_bank_details (${bankColumns.join(', ')}, created_at, updated_at)
          VALUES (${bankPlaceholders.join(', ')}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `;

          console.log("🚀 ~ Bank Insert SQL:", bankInsertSql);
          console.log("🚀 ~ Bank Insert Values:", bankValues);

          const bankResult = await UpdateQuery(bankInsertSql, bankValues);
          bankDetails = bankResult && bankResult?.rows?.length > 0 ? bankResult[0] : null;
        }

        console.log("🚀 ~ Bank Details Result:", bankDetails);
      }

      // 3. GET FINAL DATA IF NOT UPDATED
      if (!updatedVendor) {
        const vendorResult = await SelectQuery(`SELECT * FROM vendors WHERE id = $1 AND is_active = true`, [vendorId]);
        updatedVendor = vendorResult && vendorResult.length > 0 ? vendorResult[0] : null;
      }

      if (!bankDetails) {
        const bankResult = await SelectQuery(`SELECT * FROM vendor_bank_details WHERE vendor_id = $1`, [vendorId]);
        bankDetails = bankResult && bankResult.length > 0 ? bankResult[0] : null;
      }
      console.log("🚀 ~ Final Result - Vendor:", updatedVendor);
      console.log("🚀 ~ Final Result - Bank:", bankDetails);

      return {
        vendor: updatedVendor,
        bankDetails: bankDetails
      };

    } catch (error) {
      console.error('🚀 ~ Update vendor details repository error:', error);
      throw error;
    }
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Authenticate vendor
   */
  async authenticateVendor(email: string, password: string): Promise<any> {
    try {
      const sql = `
        SELECT 
          v.id, v.uuid, v.user_id, v.store_name, v.store_slug, v.business_name,
          v.status, v.tier_id, v.is_active as vendor_active,
          u.id as user_id, u.uuid as user_uuid, u.full_name, u.email,
          u.email_verified_at, u.phone_number, u.password_hash, u.is_active,
          u.failed_login_attempts, u.locked_until, u.last_login_at, u.login_count,
          vt.name as tier_name, vt.slug as tier_slug, vt.commission_rate,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', r.id,
                'name', r.name,
                'slug', r.slug,
                'permissions', r.permissions
              )
            ) FILTER (WHERE r.id IS NOT NULL), 
            '[]'::json
          ) as roles
        FROM vendors v
        JOIN users u ON v.user_id = u.id
        LEFT JOIN vendor_tiers vt ON v.tier_id = vt.id
        LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
        LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
        WHERE u.email = $1 AND u.is_active = true AND v.is_active = true
        GROUP BY v.id, u.id, vt.id
      `;

      const result: any = await SelectQuery(sql, [email.toLowerCase()]);
      const vendor = result[0];

      if (!vendor) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if vendor account is suspended
      if (vendor.status === 'suspended') {
        return { success: false, message: 'Vendor account is suspended' };
      }

      // Check if account is locked
      if (vendor.locked_until && new Date(vendor.locked_until) > new Date()) {
        return { success: false, message: 'Account is temporarily locked' };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, vendor.password_hash);

      if (!isPasswordValid) {
        // Increment failed login attempts
        await this.incrementFailedLoginAttempts(vendor.user_id);
        return { success: false, message: 'Invalid credentials' };
      }

      // Reset failed attempts and update login info
      await this.updateLoginSuccess(vendor.user_id);

      // Remove password hash from vendor object
      delete vendor.password_hash;

      return {
        success: true,
        vendor,
        sessionData: {
          user_id: vendor.user_id,
          ip_address: null,
          user_agent: null,
          device_info: null
        }
      };
    } catch (error) {
      console.error('Authenticate vendor error:', error);
      throw error;
    }
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLoginAttempts(userId: number): Promise<void> {
    const sql = `
      UPDATE users 
      SET 
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE 
          WHEN failed_login_attempts >= 4 THEN CURRENT_TIMESTAMP + INTERVAL '30 minutes'
          ELSE locked_until
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await UpdateQuery(sql, [userId]);
  }

  /**
   * Update login success
   */
  async updateLoginSuccess(userId: number): Promise<void> {
    const sql = `
      UPDATE users 
      SET 
        failed_login_attempts = 0,
        locked_until = NULL,
        last_login_at = CURRENT_TIMESTAMP,
        login_count = login_count + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await UpdateQuery(sql, [userId]);
  }

  // ==================== EMAIL VERIFICATION ====================

  /**
   * Create and send email OTP
   */
  async createAndSendEmailOTP(email: string, type: string = 'email_verification'): Promise<void> {
    try {
      // Delete any existing OTPs for this email and type
      await this.deleteExistingOTPs(email, type);

      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Insert new OTP
      const sql = `
        INSERT INTO otp_verifications (email, otp, type, expires_at, max_attempts)
        VALUES ($1, $2, $3, $4, 3)
        RETURNING id
      `;
      await InsertQuery(sql, [email.toLowerCase(), otp, type, expiresAt]);

      // Send email based on type
      await this.sendOTPEmail(email, otp, type);
    } catch (error) {
      console.error('Create and send email OTP error:', error);
      throw error;
    }
  }

  /**
   * Delete existing OTPs
   */
  async deleteExistingOTPs(email: string, type: string): Promise<void> {
    const sql = `
      DELETE FROM otp_verifications 
      WHERE email = $1 AND type = $2 AND verified_at IS NULL
    `;
    await DeleteQuery(sql, [email.toLowerCase(), type]);
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(email: string, otp: string, type: string): Promise<void> {
    let subject: string;
    let template: string;

    switch (type) {
      case 'email_verification':
        subject = 'Verify Your Vendor Email Address';
        template = 'vendor-email-verification';
        break;
      case 'password_reset':
        subject = 'Vendor Password Reset Request';
        template = 'vendor-password-reset';
        break;
      default:
        subject = 'Vendor Verification Code';
        template = 'vendor-generic-otp';
    }

    await this.emailService.sendEmail({
      to: email,
      subject,
      template,
      data: {
        otp,
        email,
        expires_in: '15 minutes'
      }
    });
  }

  /**
   * Verify email OTP
   */
  async verifyEmailOTP(email: string, otp: string, type: string = 'email_verification'): Promise<boolean> {
    try {
      const sql = `
        SELECT id, otp, attempts, max_attempts, expires_at, verified_at
        FROM otp_verifications 
        WHERE email = $1 AND type = $2 AND verified_at IS NULL
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      const result: any = await SelectQuery(sql, [email.toLowerCase(), type]);
      const otpRecord = result[0];

      if (!otpRecord) {
        return false;
      }

      // Check if already verified
      if (otpRecord.verified_at) {
        return false;
      }

      // Check if expired
      if (isOTPExpired(otpRecord.expires_at)) {
        return false;
      }

      // Check if max attempts exceeded
      if (otpRecord.attempts >= otpRecord.max_attempts) {
        return false;
      }

      // Increment attempts
      await this.incrementOTPAttempts(otpRecord.id);

      // Check if OTP matches
      if (otpRecord.otp !== otp) {
        return false;
      }

      // Mark as verified
      await this.markOTPAsVerified(otpRecord.id);
      return true;
    } catch (error) {
      console.error('Verify email OTP error:', error);
      return false;
    }
  }

  /**
   * Increment OTP attempts
   */
  async incrementOTPAttempts(otpId: number): Promise<void> {
    const sql = `
      UPDATE otp_verifications 
      SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await UpdateQuery(sql, [otpId]);
  }

  /**
   * Mark OTP as verified
   */
  async markOTPAsVerified(otpId: number): Promise<void> {
    const sql = `
      UPDATE otp_verifications 
      SET verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await UpdateQuery(sql, [otpId]);
  }

  /**
   * Update email verification status
   */
  async updateEmailVerificationStatus(email: string): Promise<any> {
    const sql = `
      UPDATE users 
      SET 
        email_verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = $1 AND is_active = true
      RETURNING id, uuid, full_name, email, email_verified_at
    `;
    const userResult = await UpdateQuery(sql, [email.toLowerCase()]);
    const user = userResult.rows[0];

    // Get vendor details
    const vendorSql = `
      SELECT v.id, v.uuid, v.user_id, v.store_name, v.store_slug, v.status
      FROM vendors v
      WHERE v.user_id = $1 AND v.is_active = true
    `;
    const vendorResult: any = await SelectQuery(vendorSql, [user.id]);
    const vendor = vendorResult[0];

    return {
      ...user,
      ...vendor
    };
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Create user session
   */
  async createUserSession(userId: number, sessionData: any): Promise<any> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const sql = `
      INSERT INTO user_sessions (
        user_id, session_token, device_info, ip_address, user_agent,
        expires_at, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, session_token, expires_at, created_at
    `;

    const params = [
      userId,
      sessionToken,
      JSON.stringify(sessionData.device_info),
      sessionData.ip_address,
      sessionData.user_agent,
      expiresAt
    ];

    const result: any = await InsertQuery(sql, params);
    return result.rows[0];
  }

  /**
   * Generate session token
   */
  private generateSessionToken(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result: any = '';
    for (let i = 0; i < 64; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionToken: string): Promise<void> {
    const sql = `
      UPDATE user_sessions 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE session_token = $1
    `;
    await UpdateQuery(sql, [sessionToken]);
  }

  // ==================== ADMIN OPERATIONS ====================

  /**
   * Get all vendors (Admin)
   */
  async getAllVendors(filterDto: VendorFilterDto): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, search, status, tier_id, is_featured, sort_by = 'created_at', sort_order = 'DESC' } = filterDto;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = ['v.is_active = true'];
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(v.store_name ILIKE ${paramIndex} OR v.business_name ILIKE ${paramIndex} OR u.full_name ILIKE ${paramIndex} OR u.email ILIKE ${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`v.status = ${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (tier_id) {
      whereConditions.push(`v.tier_id = ${paramIndex}`);
      params.push(tier_id);
      paramIndex++;
    }

    if (is_featured !== undefined) {
      whereConditions.push(`v.is_featured = ${paramIndex}`);
      params.push(is_featured);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      WHERE ${whereClause}
    `;
    const countResult: any = await SelectQuery(countSql, params);
    const total = parseInt(countResult[0]?.total);

    // Data query
    const dataSql = `
      SELECT 
        v.id, v.uuid, v.user_id, v.tier_id, v.store_name, v.store_slug,
        v.business_name, v.business_type, v.description, v.status,
        v.avg_rating, v.total_reviews, v.total_products, v.total_sales,
        v.commission_balance, v.is_featured, v.approved_at, v.created_at,
        u.full_name, u.email, u.phone_number, u.email_verified_at,
        vt.name as tier_name, vt.commission_rate
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN vendor_tiers vt ON v.tier_id = vt.id
      WHERE ${whereClause}
      ORDER BY v.${sort_by} ${sort_order}
      LIMIT ${paramIndex} OFFSET ${paramIndex + 1}
    `;

    params.push(limit, offset);
    const dataResult: any = await SelectQuery(dataSql, params);

    return {
      data: dataResult,
      pagination: {
        limit,
        total,
        page: Math.ceil(total / limit),
        //@ts-ignore
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get vendor by ID (Admin)
   */
  async getVendorById(vendorId: number): Promise<any> {
    const sql = `
      SELECT 
        v.*, u.full_name, u.email, u.phone_number, u.email_verified_at,
        u.phone_verified_at, u.created_at as user_created_at,
        vt.name as tier_name, vt.slug as tier_slug, vt.commission_rate,
        vt.product_limit, vt.features, vt.pricing, vt.benefits,
        approver.full_name as approved_by_name
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      LEFT JOIN vendor_tiers vt ON v.tier_id = vt.id
      LEFT JOIN users approver ON v.approved_by = approver.id
      WHERE v.id = $1
    `;
    const result: any = await SelectQuery(sql, [vendorId]);
    return result[0];
  }

  /**
   * Update vendor status (Admin)
   */
  async updateVendorStatus(vendorId: number, status: string, approvedBy: number, notes?: string): Promise<any> {
    const sql = `
      UPDATE vendors 
      SET 
        status = $1,
        approved_by = $2,
        approved_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
        verification_notes = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, uuid, store_name, status, approved_at, updated_at
    `;
    const result: any = await UpdateQuery(sql, [status, approvedBy, notes, vendorId]);
    return result.rows[0];
  }

  /**
   * Get vendor statistics
   */
  async getVendorStats(vendorId: number): Promise<any> {
    const sql = `
      SELECT 
        v.total_products,
        v.total_sales,
        v.commission_balance,
        v.avg_rating,
        v.total_reviews,
        v.status,
        v.created_at,
        (SELECT COUNT(*) FROM products WHERE vendor_id = v.id AND status = 'active') as active_products,
        (SELECT COUNT(*) FROM products WHERE vendor_id = v.id AND status = 'pending') as pending_products,
        (SELECT COUNT(*) FROM products WHERE vendor_id = v.id AND created_at >= CURRENT_DATE - INTERVAL '30 days') as products_this_month
      FROM vendors v
      WHERE v.id = $1
    `;
    const result: any = await SelectQuery(sql, [vendorId]);
    return result[0];
  }

  async findVendorByIdAdmin(id: number): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT ${this.vendorSelectFields}
        FROM vendors
        WHERE id = $1
      `;
      const result: any = await SelectQuery(sql, [id]);
      if (result.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }
      return ApiResponse.success(result[0]); // Access first element directly
    } catch (e) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  //helperas
  async findVendorById(vendorId: number): Promise<any> {
    try {
      const sql = `
      SELECT 
        id, uuid, user_id, store_name, store_slug, business_name, business_type,
        tax_number, registration_number, description, logo_url, banner_url,
        address, contact_info, business_hours, social_links,
        shipping_policies, return_policies, terms_conditions,
        avg_rating, total_reviews, total_products, total_sales,
        commission_balance, status, verification_documents, verification_notes,
        approved_at, approved_by, last_activity_at, settings, is_featured,
        is_active, created_at, updated_at
      FROM vendors 
      WHERE id = $1  
    `;
      const result = await SelectQuery(sql, [vendorId]);
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Find vendor by ID repository error:', error);
      throw error;
    }
  }

  async isStoreSlugTaken(slug: string, excludeVendorId?: number): Promise<boolean> {
    try {
      let sql = `
      SELECT COUNT(*) as count 
      FROM vendors 
      WHERE store_slug = $1 AND is_active = true
    `;
      const params = [slug];

      if (excludeVendorId) {
        sql += ` AND id != $2`;
        //@ts-ignore
        params.push(excludeVendorId);
      }

      const result = await SelectQuery(sql, params);
      return result && result.length > 0 && parseInt(result[0].count) > 0;
    } catch (error) {
      console.error('Check store slug repository error:', error);
      throw error;
    }
  }

  async updateVendorActivity(vendorId: number): Promise<void> {
    try {
      const sql = `
      UPDATE vendors 
      SET last_activity_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
    `;

      await UpdateQuery(sql, [vendorId]);
    } catch (error) {
      console.error('Update vendor activity repository error:', error);
      // Don't throw error for activity updates to avoid breaking main functionality
    }
  }
}