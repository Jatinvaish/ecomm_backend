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
      // Verify OTP
      const isValidOtp = await this.usersRepository.verifyEmailOTP(
        verifyEmailDto.email,
        verifyEmailDto.otp
      );

      if (!isValidOtp) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      // Update user email verification status
      const user = await this.usersRepository.updateEmailVerificationStatus(verifyEmailDto.email);

      return ApiResponse.success({
        user_id: user.id,
        vendor_id: user.vendor_id || null,
        email: user.email,
        email_verified: true,
        store_name: user.store_name || null,
        status: user.status || null
      }, 'Email verified successfully');
    } catch (error) {
      console.error('Email verification error:', error);
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
      // Check if user exists
      const user = await this.usersRepository.findUserByEmail(resendOtpDto.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user is already verified
      if (user.email_verified_at) {
        throw new BadRequestException('Email is already verified');
      }

      // Send new OTP
      await this.usersRepository.createAndSendEmailOTP(resendOtpDto.email, 'email_verification');

      return ApiResponse.success({
        email: resendOtpDto.email,
        message: 'Verification code sent to your email'
      }, 'OTP sent successfully');
    } catch (error) {
      console.error('Resend OTP error:', error);
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
    @Body() loginUserDto: LoginUserDto
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
        // Send verification email
        await this.usersRepository.createAndSendEmailOTP(authResult.user.email, 'email_verification');

        throw new BadRequestException('Please verify your email before logging in. Verification code sent to your email(Register yourself).');
      }

      // Create session
      const session = await this.usersRepository.createUserSession(
        authResult.user.id,
        authResult.sessionData
      );

      // Get user profile with vendor details if applicable
      const userProfile = await this.usersRepository.getUserProfileWithVendorDetails(authResult.user.id);

      return ApiResponse.success({
        user: {
          id: userProfile.id,
          uuid: userProfile.uuid,
          full_name: userProfile.full_name,
          email: userProfile.email,
          phone_number: userProfile.phone_number,
          avatar_url: userProfile.avatar_url,
          roles: userProfile.roles,
          // Vendor details if applicable
          vendor_id: userProfile?.vendor_id || null,
          store_name: userProfile?.store_name || null,
          store_slug: userProfile?.store_slug || null,
          business_name: userProfile?.business_name || null,
          vendor_status: userProfile?.vendor_status || null,
          tier: userProfile?.tier_id || null
        },
        session: {
          token: session.session_token,
          expires_at: session.expires_at
        }
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
   * Logout user (works for all user types)
   * POST /users/logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async logoutUser(
    @Request() req: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');

      if (sessionToken) {
        await this.usersRepository.invalidateSession(sessionToken);
      }

      return ApiResponse.success(null, 'Logout successful');
    } catch (error) {
      console.error('User logout error:', error);
      throw new BadRequestException('Failed to logout');
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