// dto/checkout.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsNumber()
  @IsNotEmpty()
  billing_address_id: number;

  @IsNumber()
  @IsNotEmpty()
  shipping_address_id: number;

  @IsNumber()
  @IsNotEmpty()
  payment_method_id: number;

  @IsOptional()
  @IsString()
  coupon_code?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PaymentIntentDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  payment_method_code: string;
}
