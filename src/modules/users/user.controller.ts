import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
import { AuthGuard } from 'src/common/guards/auth.guard';
import {
  CreateUserDto,
  VerifyEmailDto,
  ResendOtpDto,
  LoginUserDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdatePasswordDto
} from './dto/user.dto';
import { CreateVendorDto } from '../vendors/dto/vendor.dto';
import { UsersRepository } from './user.repository';

@Controller('users')
export class UsersController {
  constructor(private readonly usersRepository: UsersRepository) { }

  /**
   * Register a new user (supports all user types including vendors)
   * POST /users/register
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async registerUser(
    @Body() createUserDto: CreateUserDto | CreateVendorDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      // Check if user already exists
      const existingUser = await this.usersRepository.findUserByEmail(createUserDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      let user: any;

      // Check if this is a vendor registration (has store_name)
      if ('store_name' in createUserDto) {
        const vendorDto = createUserDto as CreateVendorDto;

        // Check if store name is already taken
        const existingStore = await this.usersRepository.findVendorByStoreName(vendorDto.store_name);
        if (existingStore) {
          throw new ConflictException('Store name is already taken');
        }

        // Create vendor account (user + vendor)
        user = await this.usersRepository.createVendor(vendorDto);
      } else {
        // Create regular user account
        user = await this.usersRepository.createUser(createUserDto as CreateUserDto);
      }

      // Send verification email with OTP
      await this.usersRepository.createAndSendEmailOTP(user.email, 'email_verification');

      return ApiResponse.created({
        user_id: user.id,
        vendor_id: user.vendor_id || null,
        email: user.email,
        store_name: user.store_name || null,
        status: user.status || null,
        message: 'User registered successfully. Please check your email for verification code.'
      }, 'User registration successful');
    } catch (error) {
      console.error('User registration error:', error);
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to register user');
    }
  }

  /**
   * Verify user email with OTP (works for all user types)
   * POST /users/verify-email
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      console.log(`🔐 Verifying email for ${verifyEmailDto.email} with OTP: ${verifyEmailDto.otp}`);

      // Verify OTP
      const isValidOtp = await this.usersRepository.verifyEmailOTP(
        verifyEmailDto.email,
        verifyEmailDto.otp
      );

      if (!isValidOtp) {
        console.error(`❌ OTP verification failed for ${verifyEmailDto.email}`);
        throw new BadRequestException('Invalid or expired verification code. Please request a new one.');
      }

      console.log(`✅ OTP verified successfully for ${verifyEmailDto.email}`);

      // Update user email verification status
      const user = await this.usersRepository.updateEmailVerificationStatus(verifyEmailDto.email);

      console.log(`📧 Email verification status updated for user ${user.id}`);

      return ApiResponse.success({
        user_id: user.id,
        vendor_id: user.vendor_id || null,
        email: user.email,
        email_verified: true,
        store_name: user.store_name || null,
        status: user.status || null
      }, 'Email verified successfully');
    } catch (error) {
      console.error('❌ Email verification error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to verify email');
    }
  }

  /**
   * Resend email verification OTP (works for all user types)
   * POST /users/resend-otp
   */
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async resendOTP(
    @Body() resendOtpDto: ResendOtpDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      console.log(`🔄 Resending OTP for ${resendOtpDto.email}`);

      // Check if user exists
      const user = await this.usersRepository.findUserByEmail(resendOtpDto.email);
      if (!user) {
        console.error(`❌ User not found: ${resendOtpDto.email}`);
        throw new NotFoundException('User not found');
      }

      console.log(`✅ User found: ${user.id}`);

      // Check if user is already verified
      if (user.email_verified_at) {
        console.log(`⚠️ Email already verified for ${resendOtpDto.email}`);
        throw new BadRequestException('Email is already verified');
      }

      // Send new OTP
      await this.usersRepository.createAndSendEmailOTP(resendOtpDto.email, 'email_verification');

      console.log(`✅ New OTP sent successfully to ${resendOtpDto.email}`);

      return ApiResponse.success({
        email: resendOtpDto.email,
        message: 'Verification code sent to your email'
      }, 'OTP sent successfully');
    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to send OTP');
    }
  }

  /**
   * User login (works for all user types - no OTP required, just password)
   * POST /users/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Request() req: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      // Authenticate user
      const authResult = await this.usersRepository.authenticateUser(
        loginUserDto.email,
        loginUserDto.password
      );

      if (!authResult.success) {
        throw new BadRequestException(authResult.message);
      }

      // Check if email is verified
      if (!authResult.user.email_verified_at) {
        console.log(`📧 Email not verified for user ${authResult.user.email}, sending verification OTP`);

        // Send verification email
        await this.usersRepository.createAndSendEmailOTP(authResult.user.email, 'email_verification');

        console.log(`✅ Verification OTP sent to ${authResult.user.email}`);
        throw new BadRequestException('Please verify your email before logging in. Verification code sent to your email.');
      }

      // Prepare session data with request info (Fixed for Fastify)
      const sessionData = {
        ip_address: req.ip || req.raw?.connection?.remoteAddress || req.raw?.socket?.remoteAddress || null,
        user_agent: req.headers['user-agent'] || null,
        device_info: this.extractDeviceInfo(req.headers['user-agent'])
      };

      // Create session
      const session = await this.usersRepository.createUserSession(
        authResult.user.id,
        sessionData
      );

      if (!session || !session?.session_token) {
        console.error('Failed to create session - session is null or missing session_token');
        throw new BadRequestException('Failed to create session');
      }

      // Get user profile with vendor details if applicable
      const userProfile = await this.usersRepository.getUserProfileWithVendorDetails(authResult.user.id);

      // Prepare role-based response data
      const responseData = this.prepareRoleBasedResponse(userProfile);

      return ApiResponse.success({
        user: responseData.user,
        session: {
          token: session?.session_token,
          expires_at: session?.expires_at
        },
        permissions: responseData.permissions,
      }, 'Login successful');
    } catch (error) {
      console.error('User login error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to login');
    }
  }

  /**
   * Extract device information from user agent
   */
  private extractDeviceInfo(userAgent: string): any {
    if (!userAgent) return null;

    const deviceInfo: any = {
      user_agent: userAgent,
      browser: null,
      os: null,
      device_type: 'desktop'
    };

    // Simple browser detection
    if (userAgent.includes('Chrome')) deviceInfo.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) deviceInfo.browser = 'Firefox';
    else if (userAgent.includes('Safari')) deviceInfo.browser = 'Safari';
    else if (userAgent.includes('Edge')) deviceInfo.browser = 'Edge';

    // Simple OS detection
    if (userAgent.includes('Windows')) deviceInfo.os = 'Windows';
    else if (userAgent.includes('Mac')) deviceInfo.os = 'macOS';
    else if (userAgent.includes('Linux')) deviceInfo.os = 'Linux';
    else if (userAgent.includes('Android')) deviceInfo.os = 'Android';
    else if (userAgent.includes('iOS')) deviceInfo.os = 'iOS';

    // Device type detection
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
      deviceInfo.device_type = 'mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      deviceInfo.device_type = 'tablet';
    }

    return deviceInfo;
  }

  /**
   * Prepare role-based response data
   */
  private prepareRoleBasedResponse(userProfile: any): any {
    const userRoles = userProfile.roles?.map((role: any) => role.slug) || [];

    let userData: any = {
      id: userProfile.id,
      uuid: userProfile.uuid,
      full_name: userProfile.full_name,
      email: userProfile.email,
      phone_number: userProfile.phone_number,
      avatar_url: userProfile.avatar_url,
      roles: userProfile.roles,
      is_active: userProfile.is_active,
      email_verified_at: userProfile.email_verified_at
    };

    // Add role-specific data
    if (userRoles.includes('vendor')) {
      userData = {
        ...userData,
        vendor_id: userProfile.vendor_id,
        store_name: userProfile.store_name,
        store_slug: userProfile.store_slug,
        business_name: userProfile.business_name,
        vendor_status: userProfile.vendor_status,
        tier_id: userProfile.tier_id,
        tier_name: userProfile.tier_name,
        commission_rate: userProfile.commission_rate,
        product_limit: userProfile.product_limit,
        vendor_rating: userProfile.vendor_rating,
        vendor_reviews: userProfile.vendor_reviews
      };
    }

    if (userRoles.includes('admin') || userRoles.includes('super_admin')) {
      userData = {
        ...userData,
        admin_level: userRoles.includes('super_admin') ? 'super_admin' : 'admin'
      };
    }

    return {
      user: userData,
      permissions: this.getUserPermissions(userProfile.roles),
    };
  }

  /**
   * Get user permissions based on roles
   */
  private getUserPermissions(roles: any[]): string[] {
    const permissions = new Set<string>();

    roles?.forEach(role => {
      if (role.permissions) {
        if (role.permissions.all === true) {
          permissions.add('*'); // Super admin has all permissions
        } else if (typeof role.permissions === 'object') {
          Object.keys(role.permissions).forEach(resource => {
            const actions = role.permissions[resource];
            if (Array.isArray(actions)) {
              actions.forEach(action => {
                permissions.add(`${resource}.${action}`);
              });
            }
          });
        }
      }
    });

    return Array.from(permissions);
  }

  /**
   * Get user profile (works for all user types)
   * GET /users/profile
   */
  @Get('profile')
  @UseGuards(AuthGuard)
  async getUserProfile(
    @Request() req: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      const userId = req.user.id;
      const user = await this.usersRepository.getUserProfileWithVendorDetails(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return ApiResponse.success(user, 'User profile retrieved successfully');
    } catch (error) {
      console.error('Get user profile error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get user profile');
    }
  }

  /**
   * Logout user - Enhanced with complete cleanup and logout all logic
   * POST /users/logout
   * Query param: all=true for logout from all devices
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async logoutUser(
    @Request() req: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');
      const userId = req.user?.id;
      const logoutAll = req.query?.all === 'true';

      if (logoutAll && userId) {
        // Invalidate all sessions for this user
        await this.usersRepository.invalidateAllUserSessions(userId);

        return ApiResponse.success({
          message: 'Logged out from all devices successfully',
          timestamp: new Date().toISOString(),
          force_clear: true, // Signal frontend to do nuclear cleanup
          clear_data: {
            localStorage: 'all', // Clear everything
            sessionStorage: 'all', // Clear everything  
            cookies: 'all', // Clear everything
            indexedDB: 'all', // Clear everything
            cache: 'all' // Clear everything
          }
        }, 'Logout from all devices successful');
      } else {
        // Invalidate current session only
        if (sessionToken) {
          await this.usersRepository.invalidateSession(sessionToken);
        }

        return ApiResponse.success({
          message: 'Logout successful',
          timestamp: new Date().toISOString(),
          force_clear: true, // Signal frontend to do nuclear cleanup
          clear_data: {
            localStorage: 'all', // Clear everything
            sessionStorage: 'all', // Clear everything
            cookies: 'all', // Clear everything
            indexedDB: 'all', // Clear everything  
            cache: 'all' // Clear everything
          }
        }, 'Logout successful');
      }
    } catch (error) {
      console.error('User logout error:', error);
      // Even on error, signal frontend to clear everything
      throw new BadRequestException({
        message: 'Failed to logout',
        force_clear: true // Still signal cleanup
      });
    }
  }

  /**
   * Request password reset
   * POST /users/forgot-password
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      const user = await this.usersRepository.findUserByEmail(forgotPasswordDto.email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return ApiResponse.success({
          message: 'If the email exists, password reset instructions have been sent.'
        }, 'Password reset request processed');
      }

      // Send password reset OTP
      await this.usersRepository.createAndSendEmailOTP(forgotPasswordDto.email, 'password_reset');

      return ApiResponse.success({
        email: forgotPasswordDto.email,
        message: 'Password reset code sent to your email'
      }, 'Password reset request processed');
    } catch (error) {
      console.error('Forgot password error:', error);
      throw new BadRequestException('Failed to process password reset request');
    }
  }

  /**
   * Reset password with OTP
   * POST /users/reset-password
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      // Verify OTP
      const isValidOtp = await this.usersRepository.verifyEmailOTP(
        resetPasswordDto.email,
        resetPasswordDto.otp,
        'password_reset'
      );

      if (!isValidOtp) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Update password
      await this.usersRepository.updateUserPassword(resetPasswordDto.email, resetPasswordDto.new_password);

      return ApiResponse.success(null, 'Password reset successfully');
    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to reset password');
    }
  }

  /**
   * Update password (for logged in users)
   * PUT /users/update-password
   */
  @Put('update-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updatePassword(
    @Request() req: any,
    @Body() updatePasswordDto: UpdatePasswordDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      const userEmail = req.user.email;

      // Verify current password
      const authResult = await this.usersRepository.authenticateUser(
        userEmail,
        updatePasswordDto.current_password
      );

      if (!authResult.success) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Update password
      await this.usersRepository.updateUserPassword(userEmail, updatePasswordDto.new_password);

      return ApiResponse.success(null, 'Password updated successfully');
    } catch (error) {
      console.error('Update password error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update password');
    }
  }
}