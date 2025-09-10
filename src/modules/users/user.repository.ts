// import * as bcrypt from 'bcrypt';
// import { Injectable } from '@nestjs/common';
// import {
//   SelectQuery,
//   InsertQuery,
//   UpdateQuery,
//   DeleteQuery,
// } from 'src/db/postgres.client';
// import { CreateUserDto } from './dto/user.dto';
// import { EmailService } from 'src/common/email.service';
// import { generateOTP, isOTPExpired } from 'src/common/utils/otp.utils';

// @Injectable()
// export class UsersRepository {
//   constructor(private readonly emailService: EmailService) { }

//   // ==================== USER CRUD OPERATIONS ====================

//   /**
//    * Find user by email
//    */
//   async findUserByEmail(email: string): Promise<any> {
//     const sql = `
//       SELECT 
//         u.id, u.uuid, u.full_name, u.email, u.email_verified_at, u.phone_number,
//         u.phone_verified_at, u.preferred_language_id, u.preferred_currency_id,
//         u.country_id, u.timezone, u.avatar_url, u.birth_date, u.gender,
//         u.is_active, u.last_login_at, u.created_at, u.updated_at
//       FROM users u 
//       WHERE u.email = $1 AND u.is_active = true
//     `;
//     const result: any = await SelectQuery(sql, [email]);
//     console.log("🚀 ~ UsersRepository ~ findUserByEmail ~ result:", result)
//     return result[0];
//   }

//   /**
//    * Find user by phone number
//    */
//   async findUserByPhone(phone: string): Promise<any> {
//     const sql = `
//       SELECT 
//         u.id, u.uuid, u.full_name, u.email, u.phone_number,
//         u.is_active, u.created_at
//       FROM users u 
//       WHERE u.phone_number = $1 AND u.is_active = true
//     `;
//     const result: any = await SelectQuery(sql, [phone]);
//     return result[0];
//   }

//   /**
//    * Create new user
//    */
//   async createUser(createUserDto: CreateUserDto): Promise<any> {
//     try {
//       // Hash password
//       const saltRounds = 12;
//       const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

//       const sql = `
//         INSERT INTO users (
//           full_name, email, password_hash, phone_number, preferred_language_id,
//           preferred_currency_id, country_id, timezone, birth_date, gender,
//           is_email_notifications_enabled, is_sms_notifications_enabled, is_active
//         )
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
//         RETURNING id, uuid, full_name, email, phone_number, created_at
//       `;

//       const params = [
//         createUserDto.full_name,
//         createUserDto.email.toLowerCase(),
//         passwordHash,
//         createUserDto.phone_number || null,
//         createUserDto.preferred_language_id || 1,
//         createUserDto.preferred_currency_id || 1,
//         createUserDto.country_id || 1,
//         createUserDto.timezone || 'UTC',
//         createUserDto.birth_date || null,
//         createUserDto.gender || null,
//         createUserDto.is_email_notifications_enabled ?? true,
//         createUserDto.is_sms_notifications_enabled ?? true
//       ];

//       const result: any = await InsertQuery(sql, params);
//       console.log("🚀 ~ UsersRepository ~ createUser ~ result:", result)
//       const user = result?.rows[0];

//       // Assign default customer role
//       await this.assignUserRole(user.id, 3); // Assuming 3 is customer role

//       return user;
//     } catch (error) {
//       console.error('Create user error:', error);
//       throw error;
//     }
//   }

//   /**
//    * Assign role to user
//    */
//   async assignUserRole(userId: number, roleId: number): Promise<void> {
//     const sql = `
//       INSERT INTO user_role_assignments (user_id, role_id, assigned_by)
//       VALUES ($1, $2, $1)
//       ON CONFLICT (user_id, role_id) DO NOTHING
//     `;
//     await InsertQuery(sql, [userId, roleId]);
//   }

//   /**
//    * Get user profile with roles
//    */
//   async getUserProfile(userId: number): Promise<any> {
//     const sql = `
//       SELECT 
//         u.id, u.uuid, u.full_name, u.email, u.email_verified_at, u.phone_number,
//         u.phone_verified_at, u.preferred_language_id, u.preferred_currency_id,
//         u.country_id, u.timezone, u.date_format, u.time_format, u.avatar_url,
//         u.birth_date, u.gender, u.is_active, u.is_email_notifications_enabled,
//         u.is_sms_notifications_enabled, u.last_login_at, u.login_count, u.created_at,
//         COALESCE(
//           JSON_AGG(
//             JSON_BUILD_OBJECT(
//               'id', r.id,
//               'name', r.name,
//               'slug', r.slug,
//               'permissions', r.permissions
//             )
//           ) FILTER (WHERE r.id IS NOT NULL), 
//           '[]'::json
//         ) as roles
//       FROM users u
//       LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
//       LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
//       WHERE u.id = $1 AND u.is_active = true
//       GROUP BY u.id
//     `;
//     const result: any = await SelectQuery(sql, [userId]);
//     return result[0];
//   }

//   // ==================== AUTHENTICATION ====================

//   /**
//    * Authenticate user
//    */
//   async authenticateUser(email: string, password: string): Promise<any> {
//     try {
//       // Get user with password hash and roles
//       const sql = `
//         SELECT 
//           u.id, u.uuid, u.full_name, u.email, u.email_verified_at, u.phone_number,
//           u.password_hash, u.is_active, u.failed_login_attempts, u.locked_until,
//           u.last_login_at, u.login_count,
//           COALESCE(
//             JSON_AGG(
//               JSON_BUILD_OBJECT(
//                 'id', r.id,
//                 'name', r.name,
//                 'slug', r.slug,
//                 'permissions', r.permissions
//               )
//             ) FILTER (WHERE r.id IS NOT NULL), 
//             '[]'::json
//           ) as roles
//         FROM users u
//         LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
//         LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
//         WHERE u.email = $1 AND u.is_active = true
//         GROUP BY u.id, u.password_hash
//       `;

//       const result: any = await SelectQuery(sql, [email.toLowerCase()]);
//       const user = result[0];

//       if (!user) {
//         return { success: false, message: 'Invalid credentials' };
//       }

//       // Check if account is locked
//       if (user.locked_until && new Date(user.locked_until) > new Date()) {
//         return { success: false, message: 'Account is temporarily locked' };
//       }

//       // Verify password
//       const isPasswordValid = await bcrypt.compare(password, user.password_hash);

//       if (!isPasswordValid) {
//         // Increment failed login attempts
//         await this.incrementFailedLoginAttempts(user.id);
//         return { success: false, message: 'Invalid credentials' };
//       }

//       // Reset failed attempts and update login info
//       await this.updateLoginSuccess(user.id);

//       // Remove password hash from user object
//       delete user.password_hash;

//       return {
//         success: true,
//         user,
//         sessionData: {
//           user_id: user.id,
//           ip_address: null, // Will be set in controller
//           user_agent: null, // Will be set in controller
//           device_info: null // Will be set in controller
//         }
//       };
//     } catch (error) {
//       console.error('Authenticate user error:', error);
//       throw error;
//     }
//   }

//   /**
//    * Increment failed login attempts
//    */
//   async incrementFailedLoginAttempts(userId: number): Promise<void> {
//     const sql = `
//       UPDATE users 
//       SET 
//         failed_login_attempts = failed_login_attempts + 1,
//         locked_until = CASE 
//           WHEN failed_login_attempts >= 4 THEN CURRENT_TIMESTAMP + INTERVAL '30 minutes'
//           ELSE locked_until
//         END,
//         updated_at = CURRENT_TIMESTAMP
//       WHERE id = $1
//     `;
//     await UpdateQuery(sql, [userId]);
//   }

//   /**
//    * Update login success
//    */
//   async updateLoginSuccess(userId: number): Promise<void> {
//     const sql = `
//       UPDATE users 
//       SET 
//         failed_login_attempts = 0,
//         locked_until = NULL,
//         last_login_at = CURRENT_TIMESTAMP,
//         login_count = login_count + 1,
//         updated_at = CURRENT_TIMESTAMP
//       WHERE id = $1
//     `;
//     await UpdateQuery(sql, [userId]);
//   }

//   /**
//    * Update user password
//    */
//   async updateUserPassword(email: string, newPassword: string): Promise<void> {
//     const saltRounds = 12;
//     const passwordHash = await bcrypt.hash(newPassword, saltRounds);

//     const sql = `
//       UPDATE users 
//       SET 
//         password_hash = $1,
//         password_changed_at = CURRENT_TIMESTAMP,
//         failed_login_attempts = 0,
//         locked_until = NULL,
//         updated_at = CURRENT_TIMESTAMP
//       WHERE email = $2 AND is_active = true
//     `;
//     await UpdateQuery(sql, [passwordHash, email.toLowerCase()]);
//   }

//   // ==================== EMAIL VERIFICATION ====================

//   /**
//    * Create and send email OTP
//    */
//   async createAndSendEmailOTP(email: string, type: string = 'email_verification'): Promise<void> {
//     try {
//       // Delete any existing OTPs for this email and type
//       await this.deleteExistingOTPs(email, type);

//       // Generate new OTP
//       const otp = generateOTP();
//       const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

//       // Insert new OTP
//       const sql = `
//         INSERT INTO otp_verifications (email, otp, type, expires_at, max_attempts)
//         VALUES ($1, $2, $3, $4, 3)
//         RETURNING id
//       `;
//       await InsertQuery(sql, [email.toLowerCase(), otp, type, expiresAt]);

//       // Send email based on type
//       await this.sendOTPEmail(email, otp, type);
//     } catch (error) {
//       console.error('Create and send email OTP error:', error);
//       throw error;
//     }
//   }

//   /**
//    * Delete existing OTPs
//    */
//   async deleteExistingOTPs(email: string, type: string): Promise<void> {
//     const sql = `
//       DELETE FROM otp_verifications 
//       WHERE email = $1 AND type = $2 AND verified_at IS NULL
//     `;
//     await DeleteQuery(sql, [email.toLowerCase(), type]);
//   }

//   /**
//    * Send OTP email
//    */
//   async sendOTPEmail(email: string, otp: string, type: string): Promise<void> {
//     let subject: string;
//     let template: string;

//     switch (type) {
//       case 'email_verification':
//         subject = 'Verify Your Email Address';
//         template = 'email_verification';
//         break;
//       case 'password_reset':
//         subject = 'Password Reset Request';
//         template = 'password_reset';
//         break;
//       case 'login_2fa':
//         subject = 'Two-Factor Authentication Code';
//         template = 'login_2fa';
//         break;
//       case 'vendor_email_verification':
//         subject = 'Vendor Email Verification';
//         template = 'vendor-email-verification';
//         break;
//       default:
//         subject = 'Verification Code';
//         template = 'generic-otp';
//     }

//     await this.emailService.sendEmail({
//       to: email,
//       subject,
//       template,
//       data: {
//         otp,
//         email,
//         expires_in: '15 minutes'
//       }
//     });
//   }

//   /**
//    * Verify email OTP
//    */
//   async verifyEmailOTP(email: string, otp: string, type: string = 'email_verification'): Promise<boolean> {
//     try {
//       const sql = `
//         SELECT id, otp, attempts, max_attempts, expires_at, verified_at
//         FROM otp_verifications 
//         WHERE email = $1 AND type = $2 AND verified_at IS NULL
//         ORDER BY created_at DESC 
//         LIMIT 1
//       `;
//       const result: any = await SelectQuery(sql, [email.toLowerCase(), type]);
//       const otpRecord = result[0];

//       if (!otpRecord) {
//         return false;
//       }

//       // Check if already verified
//       if (otpRecord.verified_at) {
//         return false;
//       }

//       // Check if expired
//       if (isOTPExpired(otpRecord.expires_at)) {
//         return false;
//       }

//       // Check if max attempts exceeded
//       if (otpRecord.attempts >= otpRecord.max_attempts) {
//         return false;
//       }

//       // Increment attempts
//       await this.incrementOTPAttempts(otpRecord.id);

//       // Check if OTP matches
//       if (otpRecord.otp !== otp) {
//         return false;
//       }

//       // Mark as verified
//       await this.markOTPAsVerified(otpRecord.id);
//       return true;
//     } catch (error) {
//       console.error('Verify email OTP error:', error);
//       return false;
//     }
//   }

//   /**
//    * Increment OTP attempts
//    */
//   async incrementOTPAttempts(otpId: number): Promise<void> {
//     const sql = `
//       UPDATE otp_verifications 
//       SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP
//       WHERE id = $1
//     `;
//     await UpdateQuery(sql, [otpId]);
//   }

//   /**
//    * Mark OTP as verified
//    */
//   async markOTPAsVerified(otpId: number): Promise<void> {
//     const sql = `
//       UPDATE otp_verifications 
//       SET verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
//       WHERE id = $1
//     `;
//     await UpdateQuery(sql, [otpId]);
//   }

//   /**
//    * Update email verification status
//    */
//   async updateEmailVerificationStatus(email: string): Promise<any> {
//     const sql = `
//       UPDATE users 
//       SET 
//         email_verified_at = CURRENT_TIMESTAMP,
//         updated_at = CURRENT_TIMESTAMP
//       WHERE email = $1 AND is_active = true
//       RETURNING id, uuid, full_name, email, email_verified_at
//     `;
//     const result: any = await UpdateQuery(sql, [email.toLowerCase()]);
//     return result?.rows[0];
//   }

//   // ==================== SESSION MANAGEMENT ====================

//   /**
//    * Create user session
//    */
//   async createUserSession(userId: number, sessionData: any): Promise<any> {
//     const sessionToken = this.generateSessionToken();
//     const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

//     const sql = `
//       INSERT INTO user_sessions (
//         user_id, session_token, device_info, ip_address, user_agent,
//         expires_at, is_active
//       )
//       VALUES ($1, $2, $3, $4, $5, $6, true)
//       RETURNING id, session_token, expires_at, created_at
//     `;

//     const params = [
//       userId,
//       sessionToken,
//       JSON.stringify(sessionData.device_info),
//       sessionData.ip_address,
//       sessionData.user_agent,
//       expiresAt
//     ];

//     const result: any = await InsertQuery(sql, params);
//     return result?.rows[0];
//   }

//   /**
//    * Generate session token
//    */
//   private generateSessionToken(): string {
//     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let result: any = '';
//     for (let i = 0; i < 64; i++) {
//       result += characters.charAt(Math.floor(Math.random() * characters.length));
//     }
//     return result;
//   }

//   /**
//    * Invalidate session
//    */
//   async invalidateSession(sessionToken: string): Promise<void> {
//     const sql = `
//       UPDATE user_sessions 
//       SET is_active = false, updated_at = CURRENT_TIMESTAMP
//       WHERE session_token = $1
//     `;
//     await UpdateQuery(sql, [sessionToken]);
//   }

//   /**
//    * Validate session
//    */
//   async validateSession(sessionToken: string): Promise<any> {
//     const sql = `
//       SELECT 
//         us.id, us.user_id, us.expires_at, us.is_active,
//         u.id as user_id, u.uuid, u.full_name, u.email, u.is_active as user_active,
//         COALESCE(
//           JSON_AGG(
//             JSON_BUILD_OBJECT(
//               'id', r.id,
//               'name', r.name,
//               'slug', r.slug,
//               'permissions', r.permissions
//             )
//           ) FILTER (WHERE r.id IS NOT NULL), 
//           '[]'::json
//         ) as roles
//       FROM user_sessions us
//       JOIN users u ON us.user_id = u.id
//       LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
//       LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
//       WHERE us.session_token = $1 AND us.is_active = true AND us.expires_at > CURRENT_TIMESTAMP
//       GROUP BY us.id, us.user_id, us.expires_at, us.is_active, u.id, u.uuid, u.full_name, u.email, u.is_active
//     `;

//     const result: any = await SelectQuery(sql, [sessionToken]);
//     return result[0];
//   }
// }


//v3

import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import {
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  DeleteQuery,
} from 'src/db/postgres.client';
import { CreateUserDto } from './dto/user.dto';
import { CreateVendorDto } from '../vendors/dto/vendor.dto';
import { EmailService } from 'src/common/email.service';
import { generateOTP, isOTPExpired } from 'src/common/utils/otp.utils';
import { generateSlug } from 'src/common/utils/api-helpers';

@Injectable()
export class UsersRepository {
  constructor(private readonly emailService: EmailService) { }

  // ==================== USER CRUD OPERATIONS ====================

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<any> {
    const sql = `
      SELECT 
        u.id, u.uuid, u.full_name, u.email, u.email_verified_at, u.phone_number,
        u.phone_verified_at, u.preferred_language_id, u.preferred_currency_id,
        u.country_id, u.timezone, u.avatar_url, u.birth_date, u.gender,
        u.is_active, u.last_login_at, u.created_at, u.updated_at
      FROM users u 
      WHERE u.email = $1 AND u.is_active = true
    `;
    const result: any = await SelectQuery(sql, [email]);
    console.log("🚀 ~ UsersRepository ~ findUserByEmail ~ result:", result)
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
      SELECT id, store_name, store_slug
      FROM vendors 
      WHERE store_name = $1 AND is_active = true
    `;
    const result: any = await SelectQuery(sql, [storeName]);
    return result[0];
  }

  /**
   * Create new user
   */
  async createUser(createUserDto: CreateUserDto): Promise<any> {
    try {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

      const sql = `
        INSERT INTO users (
          full_name, email, password_hash, phone_number, preferred_language_id,
          preferred_currency_id, country_id, timezone, birth_date, gender,
          is_email_notifications_enabled, is_sms_notifications_enabled, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
        RETURNING id, uuid, full_name, email, phone_number, created_at
      `;

      const params = [
        createUserDto.full_name,
        createUserDto.email.toLowerCase(),
        passwordHash,
        createUserDto.phone_number || '',
        createUserDto.preferred_language_id || 1,
        createUserDto.preferred_currency_id || 1,
        createUserDto.country_id || 1,
        createUserDto.timezone || 'UTC',
        createUserDto.birth_date || '',
        createUserDto.gender || '',
        createUserDto.is_email_notifications_enabled ?? true,
        createUserDto.is_sms_notifications_enabled ?? true
      ];

      const result: any = await InsertQuery(sql, params);
      console.log("🚀 ~ UsersRepository ~ createUser ~ result:", result)
      const user = result?.rows[0];

      // Assign default customer role
      await this.assignUserRole(user.id, 3); // Assuming 3 is customer role

      return user;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * Create new vendor (user + vendor record)
   */
  async createVendor(createVendorDto: CreateVendorDto): Promise<any> {
    try {
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(createVendorDto.password, saltRounds);

      // Generate store slug
      const storeSlug = await this.generateUniqueStoreSlug(generateSlug(createVendorDto.store_name), 0);

      // Create user first
      const userSql = `
        INSERT INTO users (
          full_name, email, password_hash, phone_number, preferred_language_id,
          preferred_currency_id, country_id, timezone, birth_date, gender,
          is_email_notifications_enabled, is_sms_notifications_enabled, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
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
        'UTC',
        createVendorDto.birth_date || null,
        createVendorDto.gender || null,
        createVendorDto.is_email_notifications_enabled ?? true,
        createVendorDto.is_sms_notifications_enabled ?? true
      ];

      const userResult: any = await InsertQuery(userSql, userParams);
      const user = userResult?.rows[0];

      // Create vendor record
      const vendorSql = `
        INSERT INTO vendors (
          user_id, store_name, store_slug, business_name, registration_number,
          business_type, tax_number, description, status, tier_id, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 1, $1)
        RETURNING id, store_name, store_slug, business_name, status, tier_id
      `;

      const vendorParams = [
        user.id,
        createVendorDto.store_name,
        storeSlug,
        createVendorDto.business_name || '',
        createVendorDto?.business_registration_number || '',
        createVendorDto?.business_type || '',
        createVendorDto?.tax_number || '',
        createVendorDto?.description || ''
      ];

      const vendorResult: any = await InsertQuery(vendorSql, vendorParams);
      const vendor = vendorResult?.rows[0];

      // Assign vendor role
      await this.assignUserRole(user.id, 2); // Assuming 2 is vendor role

      // Return combined result
      return {
        ...user,
        vendor_id: vendor.id,
        store_name: vendor.store_name,
        store_slug: vendor.store_slug,
        business_name: vendor.business_name,
        status: vendor.status,
        tier_id: vendor.tier_id
      };
    } catch (error) {
      console.error('Create vendor error:', error);
      throw error;
    }
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
   * Get user profile with roles
   */
  async getUserProfile(userId: number): Promise<any> {
    const sql = `
      SELECT 
        u.id, u.uuid, u.full_name, u.email, u.email_verified_at, u.phone_number,
        u.phone_verified_at, u.preferred_language_id, u.preferred_currency_id,
        u.country_id, u.timezone, u.date_format, u.time_format, u.avatar_url,
        u.birth_date, u.gender, u.is_active, u.is_email_notifications_enabled,
        u.is_sms_notifications_enabled, u.last_login_at, u.login_count, u.created_at,
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
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
      LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id
    `;
    const result: any = await SelectQuery(sql, [userId]);
    return result[0];
  }

  /**
   * Get user profile with vendor details if applicable
   */
  async getUserProfileWithVendorDetails(userId: number): Promise<any> {
    const sql = `
      SELECT 
        u.id, u.uuid, u.full_name, u.email, u.email_verified_at, u.phone_number,
        u.phone_verified_at, u.preferred_language_id, u.preferred_currency_id,
        u.country_id, u.timezone, u.date_format, u.time_format, u.avatar_url,
        u.birth_date, u.gender, u.is_active, u.is_email_notifications_enabled,
        u.is_sms_notifications_enabled, u.last_login_at, u.login_count, u.created_at,
        -- Vendor details
        v.id as vendor_id, v.store_name, v.store_slug, v.business_name, 
        v.status as vendor_status, v.tier_id, v.logo_url, v.banner_url,
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
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
      LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
      LEFT JOIN vendors v ON u.id = v.user_id AND v.is_active = true
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id, v.id, v.store_name, v.store_slug, v.business_name, v.status, v.tier_id, v.logo_url, v.banner_url
    `;
    const result: any = await SelectQuery(sql, [userId]);
    return result[0];
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Authenticate user (works for all user types)
   */
  async authenticateUser(email: string, password: string): Promise<any> {
    try {
      // Get user with password hash and roles
      const sql = `
        SELECT 
          u.id, u.uuid, u.full_name, u.email, u.email_verified_at, u.phone_number,
          u.password_hash, u.is_active, u.failed_login_attempts, u.locked_until,
          u.last_login_at, u.login_count,
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
        FROM users u
        LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
        LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
        WHERE u.email = $1 AND u.is_active = true
        GROUP BY u.id, u.password_hash
      `;

      const result: any = await SelectQuery(sql, [email.toLowerCase()]);
      const user = result[0];

      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return { success: false, message: 'Account is temporarily locked' };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        // Increment failed login attempts
        await this.incrementFailedLoginAttempts(user.id);
        return { success: false, message: 'Invalid credentials' };
      }

      // Reset failed attempts and update login info
      await this.updateLoginSuccess(user.id);

      // Remove password hash from user object
      delete user.password_hash;

      return {
        success: true,
        user,
        sessionData: {
          user_id: user.id,
          ip_address: null, // Will be set in controller
          user_agent: null, // Will be set in controller
          device_info: null // Will be set in controller
        }
      };
    } catch (error) {
      console.error('Authenticate user error:', error);
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

  /**
   * Update user password
   */
  async updateUserPassword(email: string, newPassword: string): Promise<void> {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const sql = `
      UPDATE users 
      SET 
        password_hash = $1,
        password_changed_at = CURRENT_TIMESTAMP,
        failed_login_attempts = 0,
        locked_until = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = $2 AND is_active = true
    `;
    await UpdateQuery(sql, [passwordHash, email.toLowerCase()]);
  }

  /**
   * Update email verification status (works for all user types)
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
    const updateResult: any = await UpdateQuery(sql, [email.toLowerCase()]);
    const user = updateResult?.rows[0];

    if (!user) {
      return null;
    }

    // Get additional details including vendor info if applicable
    const detailsSql = `
      SELECT 
        u.id, u.uuid, u.full_name, u.email, u.email_verified_at,
        v.id as vendor_id, v.store_name, v.status
      FROM users u
      LEFT JOIN vendors v ON u.id = v.user_id AND v.is_active = true
      WHERE u.id = $1
    `;
    const detailsResult: any = await SelectQuery(detailsSql, [user.id]);
    return detailsResult[0];
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
        subject = 'Verify Your Email Address';
        template = 'email_verification';
        break;
      case 'password_reset':
        subject = 'Password Reset Request';
        template = 'password_reset';
        break;
      case 'login_2fa':
        subject = 'Two-Factor Authentication Code';
        template = 'login_2fa';
        break;
      case 'vendor_email_verification':
        subject = 'Vendor Email Verification';
        template = 'vendor-email-verification';
        break;
      default:
        subject = 'Verification Code';
        template = 'generic-otp';
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
    return result?.rows[0];
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

  /**
   * Validate session
   */
  async validateSession(sessionToken: string): Promise<any> {
    const sql = `
      SELECT 
        us.id, us.user_id, us.expires_at, us.is_active,
        u.id as user_id, u.uuid, u.full_name, u.email, u.is_active as user_active,
        -- Add vendor_id for vendors
        v.id as vendor_id,
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
      FROM user_sessions us
      JOIN users u ON us.user_id = u.id
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
      LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
      LEFT JOIN vendors v ON u.id = v.user_id AND v.is_active = true
      WHERE us.session_token = $1 AND us.is_active = true AND us.expires_at > CURRENT_TIMESTAMP
      GROUP BY us.id, us.user_id, us.expires_at, us.is_active, u.id, u.uuid, u.full_name, u.email, u.is_active, v.id
    `;

    const result: any = await SelectQuery(sql, [sessionToken]);
    return result[0];
  }

  // ==================== VENDOR SPECIFIC HELPERS ====================

  /**
   * Generate unique store slug
   */
  async generateUniqueStoreSlug(baseSlug: string, excludeVendorId: number): Promise<string> {
    let counter = 0;
    let slug = baseSlug;

    while (await this.isStoreSlugTaken(slug, excludeVendorId)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  /**
   * Check if store slug is taken
   */
  async isStoreSlugTaken(slug: string, excludeVendorId: number): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count
      FROM vendors 
      WHERE store_slug = $1 AND id != $2 AND is_active = true
    `;
    const result: any = await SelectQuery(sql, [slug, excludeVendorId]);
    return parseInt(result[0].count) > 0;
  }
}