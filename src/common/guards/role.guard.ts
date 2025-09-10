import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SelectQuery } from 'src/db/postgres.client';
import { ApiResponse } from '../utils/common-response';

// ==================== DECORATORS ====================
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
export const RequireVendor = () => SetMetadata('requireVendor', true);
export const RequireActiveVendor = () => SetMetadata('requireActiveVendor', true);
export const VendorStatus = (...statuses: string[]) => SetMetadata('vendorStatuses', statuses);

// ==================== INTERFACES ====================
interface UserWithRoles {
  id: number;
  uuid: string;
  full_name: string;
  email: string;
  is_active: boolean;
  roles: Array<{
    id: number;
    name: string;
    slug: string;
    permissions: any;
  }>;
}

interface VendorInfo {
  id: number;
  uuid: string;
  user_id: number;
  store_name: string;
  store_slug: string;
  status: string;
  is_featured: boolean;
  tier_id: number;
  tier: {
    name: string;
    commission_rate: number;
    product_limit: number;
    features: any;
  };
}

// ==================== ROLE GUARD ====================
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('User not authenticated')
      );
    }

    // Get user with roles from database
    const userWithRoles = await this.getUserWithRoles(user.id);
    
    if (!userWithRoles) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('User not found')
      );
    }

    if (!userWithRoles.is_active) {
      throw new ForbiddenException(
        ApiResponse.forbidden('User account is inactive')
      );
    }

    // Attach enriched user data to request
    request.user = userWithRoles;

    // Check required roles
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = userWithRoles.roles.map(role => role.slug);
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        throw new ForbiddenException(
          ApiResponse.forbidden(`Requires one of the following roles: ${requiredRoles.join(', ')}`)
        );
      }
    }

    return true;
  }

  private async getUserWithRoles(userId: number): Promise<UserWithRoles | null> {
    try {
      const sql = `
        SELECT 
          u.id, u.uuid, u.full_name, u.email, u.is_active,
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
        WHERE u.id = $1
        GROUP BY u.id, u.uuid, u.full_name, u.email, u.is_active
      `;
      
      const result = await SelectQuery<UserWithRoles>(sql, [userId]);
      return result[0] || null;
    } catch (error) {
      console.error('Get user with roles error:', error);
      throw new UnauthorizedException(
        ApiResponse.unauthorized('Failed to fetch user data')
      );
    }
  }
}

// ==================== VENDOR GUARD ====================
@Injectable()
export class VendorGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('User not authenticated')
      );
    }

    // Check if vendor is required
    const requireVendor = this.reflector.get<boolean>('requireVendor', context.getHandler());
    const requireActiveVendor = this.reflector.get<boolean>('requireActiveVendor', context.getHandler());
    const allowedStatuses = this.reflector.get<string[]>('vendorStatuses', context.getHandler());

    if (!requireVendor && !requireActiveVendor && !allowedStatuses) {
      return true; // No vendor requirements
    }

    // Get vendor info
    const vendorInfo = await this.getVendorInfo(user.id);
    
    if (!vendorInfo) {
      throw new ForbiddenException(
        ApiResponse.forbidden('User is not a vendor')
      );
    }

    // Check vendor status requirements
    if (requireActiveVendor && vendorInfo.status !== 'approved') {
      throw new ForbiddenException(
        ApiResponse.forbidden('Vendor account must be approved')
      );
    }

    if (allowedStatuses && !allowedStatuses.includes(vendorInfo.status)) {
      throw new ForbiddenException(
        ApiResponse.forbidden(`Vendor status must be one of: ${allowedStatuses.join(', ')}`)
      );
    }

    // Attach vendor info to request
    request.vendor = vendorInfo;

    return true;
  }

  private async getVendorInfo(userId: number): Promise<VendorInfo | null> {
    try {
      const sql = `
        SELECT 
          v.id, v.uuid, v.user_id, v.store_name, v.store_slug, 
          v.status, v.is_featured, v.tier_id,
          JSON_BUILD_OBJECT(
            'name', vt.name,
            'commission_rate', vt.commission_rate,
            'product_limit', vt.product_limit,
            'features', vt.features
          ) as tier
        FROM vendors v
        LEFT JOIN vendor_tiers vt ON v.tier_id = vt.id
        WHERE v.user_id = $1
      `;
      
      const result = await SelectQuery<VendorInfo>(sql, [userId]);
      return result[0] || null;
    } catch (error) {
      console.error('Get vendor info error:', error);
      throw new ForbiddenException(
        ApiResponse.forbidden('Failed to fetch vendor data')
      );
    }
  }
}

// ==================== ADMIN GUARD ====================
@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.roles) {
      throw new ForbiddenException(
        ApiResponse.forbidden('User roles not loaded')
      );
    }

    const adminRoles = ['admin', 'super_admin', 'moderator'];
    const userRoles = user.roles.map((role: any) => role.slug);
    const hasAdminRole = adminRoles.some(role => userRoles.includes(role));

    if (!hasAdminRole) {
      throw new ForbiddenException(
        ApiResponse.forbidden('Admin access required')
      );
    }

    return true;
  }
}

// ==================== SUPER ADMIN GUARD ====================
@Injectable()
export class SuperAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.roles) {
      throw new ForbiddenException(
        ApiResponse.forbidden('User roles not loaded')
      );
    }

    const userRoles = user.roles.map((role: any) => role.slug);
    const isSuperAdmin = userRoles.includes('super_admin');

    if (!isSuperAdmin) {
      throw new ForbiddenException(
        ApiResponse.forbidden('Super admin access required')
      );
    }

    return true;
  }
}

// ==================== ACTIVE USER GUARD ====================
@Injectable()
export class ActiveUserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('User not authenticated')
      );
    }

    // Check if user is active
    const sql = `SELECT is_active FROM users WHERE id = $1`;
    const result = await SelectQuery<{ is_active: boolean }>(sql, [user.id]);
    
    if (!result.length || !result[0].is_active) {
      throw new ForbiddenException(
        ApiResponse.forbidden('Account is inactive')
      );
    }

    return true;
  }
}

// ==================== VERIFIED USER GUARD ====================
@Injectable()
export class VerifiedUserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('User not authenticated')
      );
    }

    // Check if user is verified (email or phone)
    const sql = `
      SELECT email_verified_at, phone_verified_at 
      FROM users 
      WHERE id = $1
    `;
    const result = await SelectQuery<{ 
      email_verified_at: Date | null; 
      phone_verified_at: Date | null; 
    }>(sql, [user.id]);
    
    if (!result.length) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('User not found')
      );
    }

    const userVerification = result[0];
    const isVerified = userVerification.email_verified_at || userVerification.phone_verified_at;

    if (!isVerified) {
      throw new ForbiddenException(
        ApiResponse.forbidden('Account verification required')
      );
    }

    return true;
  }
}

// ==================== SESSION GUARD ====================
@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const sessionToken = request.headers['x-session-token'];

    if (!user?.id) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('User not authenticated')
      );
    }

    if (!sessionToken) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('Session token required')
      );
    }

    // Verify active session
    const sql = `
      SELECT id, expires_at, is_active 
      FROM user_sessions 
      WHERE user_id = $1 AND session_token = $2
    `;
    const result = await SelectQuery<{
      id: number;
      expires_at: Date;
      is_active: boolean;
    }>(sql, [user.id, sessionToken]);

    if (!result.length) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('Invalid session')
      );
    }

    const session = result[0];

    if (!session.is_active) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('Session is inactive')
      );
    }

    if (new Date() > session.expires_at) {
      throw new UnauthorizedException(
        ApiResponse.unauthorized('Session expired')
      );
    }

    // Update last activity
    const updateSql = `
      UPDATE user_sessions 
      SET last_activity_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    await SelectQuery(updateSql, [session.id]);

    return true;
  }
}

// ==================== USAGE EXAMPLES ====================
/*
// Basic authentication
@UseGuards(AuthGuard)

// Role-based access
@UseGuards(AuthGuard, RoleGuard)
@Roles('admin', 'moderator')

// Vendor-only endpoints
@UseGuards(AuthGuard, RoleGuard, VendorGuard)
@RequireActiveVendor()

// Vendor with specific statuses
@UseGuards(AuthGuard, RoleGuard, VendorGuard)
@VendorStatus('approved', 'suspended')

// Admin only
@UseGuards(AuthGuard, RoleGuard, AdminGuard)

// Super admin only
@UseGuards(AuthGuard, RoleGuard, SuperAdminGuard)

// Active and verified users only
@UseGuards(AuthGuard, ActiveUserGuard, VerifiedUserGuard)

// Session-based access
@UseGuards(AuthGuard, SessionGuard)

// Combined example for vendor product management
@Controller('vendor/products')
@UseGuards(AuthGuard, RoleGuard, VendorGuard)
@RequireActiveVendor()
export class VendorProductsController {
  
  @Post()
  async createProduct(@Req() req, @Body() createProductDto: CreateProductDto) {
    // req.user contains full user data with roles
    // req.vendor contains vendor info with tier details
    return this.productsService.create(req.vendor.id, createProductDto);
  }
}

// Admin approval endpoint
@Controller('admin/vendors')
@UseGuards(AuthGuard, RoleGuard, AdminGuard)
export class AdminVendorController {
  
  @Patch(':id/approve')
  @Roles('admin', 'super_admin')
  async approveVendor(@Param('id') id: number, @Req() req) {
    return this.vendorService.approve(id, req.user.id);
  }
}
*/