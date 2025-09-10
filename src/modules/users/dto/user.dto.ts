// ==================== USER DTOs ====================

import { 
  IsEmail, 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsInt, 
  IsDateString, 
  IsIn, 
  MinLength, 
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  full_name: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  // @IsPhoneNumber()
  phone_number?: string;

  @IsOptional()
  @IsInt()
  preferred_language_id?: number;

  @IsOptional()
  @IsInt()
  preferred_currency_id?: number;

  @IsOptional()
  @IsInt()
  country_id?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: string;

  @IsOptional()
  @IsBoolean()
  is_email_notifications_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  is_sms_notifications_enabled?: boolean;
}

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;
}

export class ResendOtpDto {
  @IsEmail()
  email: string;
}

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}


export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  new_password: string;
}

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty()
  current_password: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  new_password: string;
}
