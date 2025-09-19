import { Injectable } from '@nestjs/common';
import { SelectQuery, InsertQuery, UpdateQuery } from 'src/db/postgres.client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { generateOTP } from 'src/common/utils/otp.utils';
import { EmailService } from 'src/common/email.service';
import { CreateUserDto } from './dto/user.dto';
import { CreateVendorDto } from '../vendors/dto/vendor.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly emailService: EmailService) { }

  // ==================== USER MANAGEMENT ====================

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<any> {
    const sql = `
      SELECT u.*, 
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
        AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
      LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
      WHERE u.email = $1
      GROUP BY u.id
    `;
    const result = await SelectQuery(sql, [email]);
    return result[0] || null;
  }

  /**
   * Find vendor by store name
   */
  async findVendorByStoreName(storeName: string): Promise<any> {
    const sql = `SELECT * FROM vendors WHERE store_name = $1`;
    const result = await SelectQuery(sql, [storeName]);
    return result[0] || null;
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserDto): Promise<any> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Convert birth_date if it's a timestamp
    let formattedBirthDate = null;
    if (userData.birth_date) {
      if (typeof userData.birth_date === 'number') {
        // Convert timestamp to PostgreSQL date format
        formattedBirthDate = new Date(userData.birth_date).toISOString().split('T')[0];
      } else if (typeof userData.birth_date === 'string') {
        // Ensure string dates are in correct format
        formattedBirthDate = new Date(userData.birth_date).toISOString().split('T')[0];
      }
    }

    const sql = `
    INSERT INTO users (
      full_name, email, password_hash, phone_number, 
      preferred_language_id, preferred_currency_id, country_id,
      timezone, birth_date, gender, 
      is_email_notifications_enabled, is_sms_notifications_enabled
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, uuid, email, full_name, created_at
  `;

    const values = [
      userData.full_name,
      userData.email.toLowerCase(),
      hashedPassword,
      userData.phone_number || null,
      userData.preferred_language_id || 1,
      userData.preferred_currency_id || 1,
      userData.country_id || null,
      userData.timezone || 'UTC',
      formattedBirthDate, // Use formatted date instead of raw timestamp
      userData.gender || null,
      userData.is_email_notifications_enabled ?? true,
      userData.is_sms_notifications_enabled ?? true
    ];

    const result = await InsertQuery(sql, values);
    const user = result?.rows[0];

    // Assign customer role by default
    await this.assignUserRole(user.id, 'customer');

    return user;
  }

  /**
   * Create new vendor (user + vendor record)
   */
  async createVendor(vendorData: CreateVendorDto): Promise<any> {
    const hashedPassword = await bcrypt.hash(vendorData.password, 12);

    // Convert birth_date if it's a timestamp
    let formattedBirthDate = null;
    if (vendorData.birth_date) {
      if (typeof vendorData.birth_date === 'number') {
        // Convert timestamp to PostgreSQL date format
        formattedBirthDate = new Date(vendorData.birth_date).toISOString().split('T')[0];
      } else if (typeof vendorData.birth_date === 'string') {
        // Ensure string dates are in correct format
        formattedBirthDate = new Date(vendorData.birth_date).toISOString().split('T')[0];
      }
    }

    // Create user first
    const userSql = `
    INSERT INTO users (
      full_name, email, password_hash, phone_number, 
      preferred_language_id, preferred_currency_id, country_id,
      timezone, birth_date, gender, 
      is_email_notifications_enabled, is_sms_notifications_enabled
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, uuid, email, full_name, created_at
  `;

    const userValues = [
      vendorData.full_name,
      vendorData.email.toLowerCase(),
      hashedPassword,
      vendorData.phone_number || null,
      vendorData.preferred_language_id || 1,
      vendorData.preferred_currency_id || 1,
      vendorData.country_id || null,
      'UTC',
      formattedBirthDate, // Use formatted date instead of raw timestamp
      vendorData.gender || null,
      vendorData.is_email_notifications_enabled ?? true,
      vendorData.is_sms_notifications_enabled ?? true
    ];

    const userResult = await InsertQuery(userSql, userValues);
    const user = userResult?.rows[0];

    // Create vendor record
    const storeSlug = this.generateStoreSlug(vendorData.store_name);

    const vendorSql = `
    INSERT INTO vendors (
      user_id, tier_id, store_name, store_slug, business_name,
      business_type, tax_number, registration_number, description,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, uuid, store_name, store_slug, status
  `;

    const vendorValues = [
      user.id,
      1, // Default to basic tier
      vendorData.store_name,
      storeSlug,
      vendorData.business_name || null,
      vendorData.business_type || null,
      vendorData.tax_number || null,
      vendorData.business_registration_number || null,
      vendorData.description || null,
      'pending'
    ];

    const vendorResult = await InsertQuery(vendorSql, vendorValues);
    const vendor = vendorResult?.rows[0];

    // Assign vendor role
    await this.assignUserRole(user.id, 'vendor');

    return {
      ...user,
      vendor_id: vendor.id,
      store_name: vendor.store_name,
      store_slug: vendor.store_slug,
      status: vendor.status
    };
  }

  /**
   * Assign role to user
   */
  private async assignUserRole(userId: number, roleSlug: string): Promise<void> {
    const roleSql = `SELECT id FROM roles WHERE slug = $1 AND is_active = true`;
    const roleResult = await SelectQuery(roleSql, [roleSlug]);

    if (roleResult.length > 0) {
      const assignSql = `
        INSERT INTO user_role_assignments (user_id, role_id, assigned_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, role_id) DO NOTHING
      `;
      await InsertQuery(assignSql, [userId, roleResult[0].id, userId]);
    }
  }

  /**
   * Generate unique store slug
   */
  private generateStoreSlug(storeName: string): string {
    let slug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${slug}-${randomSuffix}`;
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Authenticate user with enhanced security
   */
  async authenticateUser(email: string, password: string): Promise<any> {
    const user = await this.findUserByEmail(email.toLowerCase());

    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Check if account is locked
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return {
        success: false,
        message: 'Account is temporarily locked due to multiple failed attempts. Please try again later.'
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Increment failed attempts
      await this.incrementFailedLoginAttempts(user.id);
      return { success: false, message: 'Invalid credentials' };
    }

    // Check if user is active
    if (!user.is_active) {
      return { success: false, message: 'Account is inactive' };
    }

    // Reset failed attempts on successful login
    await this.resetFailedLoginAttempts(user.id);

    // Update last login
    await this.updateLastLogin(user.id);

    // Prepare session data
    const sessionData = {
      ip_address: null, // Will be set by controller
      user_agent: null, // Will be set by controller
      device_info: null // Will be set by controller
    };

    return {
      success: true,
      user: {
        id: user.id,
        uuid: user.uuid,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        avatar_url: user.avatar_url,
        email_verified_at: user.email_verified_at,
        roles: user.roles,
        is_active: user.is_active
      },
      sessionData
    };
  }

  /**
   * Increment failed login attempts
   */
  private async incrementFailedLoginAttempts(userId: number): Promise<void> {
    const sql = `
      UPDATE users 
      SET 
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE 
          WHEN failed_login_attempts + 1 >= 5 THEN CURRENT_TIMESTAMP + INTERVAL '30 minutes'
          ELSE locked_until
        END
      WHERE id = $1
    `;
    await UpdateQuery(sql, [userId]);
  }

  /**
   * Reset failed login attempts
   */
  private async resetFailedLoginAttempts(userId: number): Promise<void> {
    const sql = `
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL 
      WHERE id = $1
    `;
    await UpdateQuery(sql, [userId]);
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: number): Promise<void> {
    const sql = `
      UPDATE users 
      SET 
        last_login_at = CURRENT_TIMESTAMP,
        login_count = login_count + 1
      WHERE id = $1
    `;
    await UpdateQuery(sql, [userId]);
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Create user session with enhanced security - FIXED
   */
  async createUserSession(userId: number, sessionData: any): Promise<any> {
    try {
      // Generate secure session token
      const sessionToken = this.generateSecureToken();
      console.log("🚀 ~ UsersRepository ~ createUserSession ~ sessionToken:", sessionToken)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 10); // 10 hours

      const sql = `
        INSERT INTO user_sessions (
          user_id, session_token, device_info, ip_address, 
          user_agent, expires_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING session_token, expires_at, id, created_at
      `;

      const values = [
        userId,
        sessionToken,
        sessionData.device_info ? JSON.stringify(sessionData.device_info) : null,
        sessionData.ip_address || null,
        sessionData.user_agent || null,
        expiresAt,
        true
      ];

      const result = await InsertQuery(sql, values);
      console.log("🚀 ~ UsersRepository ~ createUserSession ~ result:", result)

      if (!result || result?.rows?.length === 0) {
        console.error('Session creation failed - no result returned from database');
        throw new Error('Failed to create session in database');
      }

      const session = result?.rows[0];
      console.log('Session created successfully:', {
        session_token: session?.session_token ? 'EXISTS' : 'MISSING',
        expires_at: session?.expires_at,
        id: session?.id
      });

      return {
        session_token: session?.session_token,
        expires_at: session?.expires_at,
        id: session?.id,
        created_at: session?.created_at
      };
    } catch (error) {
      console.error('Session creation error:', error);
      throw error;
    }
  }

  /**
   * Generate secure session token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
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
   * Invalidate all user sessions
   */
  async invalidateAllUserSessions(userId: number): Promise<void> {
    const sql = `
      UPDATE user_sessions 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1
    `;
    await UpdateQuery(sql, [userId]);
  }

  // ==================== EMAIL VERIFICATION ====================

  /**
   * Create and send email OTP
   */
  async createAndSendEmailOTP(email: string, type: string = 'email_verification'): Promise<void> {
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes

    // Delete existing OTPs for this email and type
    await this.deleteExistingOTPs(email, type);

    // Create new OTP
    const sql = `
      INSERT INTO otp_verifications (email, otp, type, expires_at, max_attempts)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await InsertQuery(sql, [email, otp, type, expiresAt, 3]);

    // Send email
    await this.sendOTPEmail(email, otp, type);
  }

  /**
   * Delete existing OTPs
   */
  private async deleteExistingOTPs(email: string, type: string): Promise<void> {
    const sql = `DELETE FROM otp_verifications WHERE email = $1 AND type = $2`;
    await UpdateQuery(sql, [email, type]);
  }

  /**
   * Send OTP email
   */
  private async sendOTPEmail(email: string, otp: string, type: string): Promise<void> {
    let subject: string;
    let template: string;

    switch (type) {
      case 'email_verification':
        subject = 'Verify Your Email - KalalyGlobal';
        template = 'email_verification';
        break;
      case 'password_reset':
        subject = 'Reset Your Password - KalalyGlobal';
        template = 'password_reset';
        break;
      default:
        subject = 'Verification Code - KalalyGlobal';
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
    const sql = `
      SELECT * FROM otp_verifications 
      WHERE email = $1 AND type = $2 AND verified_at IS NULL
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await SelectQuery(sql, [email, type]);

    if (!result.length) {
      return false;
    }

    const otpRecord = result[0];

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      return false;
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      return false;
    }

    // Increment attempts
    await this.incrementOTPAttempts(otpRecord.id);

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return false;
    }

    // Mark as verified
    await this.markOTPAsVerified(otpRecord.id);
    return true;
  }

  /**
   * Increment OTP attempts
   */
  private async incrementOTPAttempts(otpId: number): Promise<void> {
    const sql = `UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1`;
    await UpdateQuery(sql, [otpId]);
  }

  /**
   * Mark OTP as verified
   */
  private async markOTPAsVerified(otpId: number): Promise<void> {
    const sql = `UPDATE otp_verifications SET verified_at = CURRENT_TIMESTAMP WHERE id = $1`;
    await UpdateQuery(sql, [otpId]);
  }

  /**
   * Update email verification status - FIXED
   */
  async updateEmailVerificationStatus(email: string): Promise<any> {
    const sql = `
    UPDATE users 
    SET email_verified_at = CURRENT_TIMESTAMP 
    WHERE email = $1
    RETURNING id, email, email_verified_at
  `;
    const result = await UpdateQuery(sql, [email]);

    // Fix the result checking - remove .rows check as it's not needed for our implementation
    if (result && result?.rows?.length > 0) {
      const user = result?.rows[0];

      // Get vendor info if exists
      const vendorSql = `
      SELECT v.id as vendor_id, v.store_name, v.status 
      FROM vendors v 
      WHERE v.user_id = $1
    `;
      const vendorResult = await SelectQuery(vendorSql, [user.id]);

      return {
        ...user,
        vendor_id: vendorResult[0]?.vendor_id || null,
        store_name: vendorResult[0]?.store_name || null,
        status: vendorResult[0]?.status || null
      };
    }

    return null;
  }

  // ==================== USER PROFILE ====================

  /**
   * Get user profile with vendor details
   */
  async getUserProfileWithVendorDetails(userId: number): Promise<any> {
    const sql = `
      SELECT 
        u.id, u.uuid, u.full_name, u.email, u.phone_number, u.avatar_url,
        u.birth_date, u.gender, u.timezone, u.is_active, u.email_verified_at,
        u.preferred_language_id, u.preferred_currency_id, u.country_id,
        
        -- Roles
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
        ) as roles,
        
        -- Vendor details
        v.id as vendor_id,
        v.uuid as vendor_uuid,
        v.store_name,
        v.store_slug,
        v.business_name,
        v.business_type,
        v.description as vendor_description,
        v.status as vendor_status,
        v.tier_id,
        v.is_featured as vendor_featured,
        v.avg_rating as vendor_rating,
        v.total_reviews as vendor_reviews,
        
        -- Vendor tier
        vt.name as tier_name,
        vt.commission_rate,
        vt.product_limit
        
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id 
        AND (ura.expires_at IS NULL OR ura.expires_at > CURRENT_TIMESTAMP)
      LEFT JOIN roles r ON ura.role_id = r.id AND r.is_active = true
      LEFT JOIN vendors v ON u.id = v.user_id
      LEFT JOIN vendor_tiers vt ON v.tier_id = vt.id
      WHERE u.id = $1
      GROUP BY u.id, u.uuid, u.full_name, u.email, u.phone_number, u.avatar_url,
               u.birth_date, u.gender, u.timezone, u.is_active, u.email_verified_at,
               u.preferred_language_id, u.preferred_currency_id, u.country_id,
               v.id, v.uuid, v.store_name, v.store_slug, v.business_name, v.business_type,
               v.description, v.status, v.tier_id, v.is_featured, v.avg_rating, v.total_reviews,
               vt.name, vt.commission_rate, vt.product_limit
    `;

    const result = await SelectQuery(sql, [userId]);
    return result[0] || null;
  }

  // ==================== PASSWORD MANAGEMENT ====================

  /**
   * Update user password
   */
  async updateUserPassword(email: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const sql = `
      UPDATE users 
      SET 
        password_hash = $1, 
        password_changed_at = CURRENT_TIMESTAMP,
        failed_login_attempts = 0,
        locked_until = NULL
      WHERE email = $2
    `;
    await UpdateQuery(sql, [hashedPassword, email]);
  }
}