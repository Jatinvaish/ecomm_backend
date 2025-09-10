import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CheckoutDto, PaymentIntentDto } from './dto/checkout.dto';
import { CheckoutService } from './checkout.service';
import { PaymentService } from './payment.service';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller('checkout')
@UseGuards(AuthGuard)
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly paymentService: PaymentService,
  ) { }

  @Post('calculate')
  async calculateCheckout(@Body() checkoutData: CheckoutDto, @Req() req) {
    const userId = req.user?.id || 1; // Mock user ID for testing
    console.log('userId',)
    return await this.checkoutService.calculateCheckout(checkoutData, userId);
  }

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() paymentData: PaymentIntentDto, @Req() req) {
    const userId = req.user?.id || 1; // Mock user ID for testing
    return await this.paymentService.createPaymentIntent(paymentData, userId);
  }

  @Post('confirm-order')
  async confirmOrder(@Body() checkoutData: CheckoutDto, @Req() req) {
    const userId = req.user?.id || 1; // Mock user ID for testing
    return await this.checkoutService.processCheckout(checkoutData, userId);
  } 

  @Get('payment-methods')
  async getPaymentMethods() {
    return await this.paymentService.getActivePaymentMethods();
  }

  @Get('shipping-methods/:addressId')
  async getShippingMethods(@Param('addressId') addressId: number) {
    return await this.checkoutService.getShippingMethods(addressId);
  }

  @Get('orders')
  async getUserOrders(@Req() req) {
    const userId = req.user?.id || 1; // Mock user ID for testing
    return await this.checkoutService.getUserOrders(userId);
  }

  @Get('orders/:orderId')
  async getOrderDetails(@Param('orderId') orderId: number, @Req() req) {
    const userId = req.user?.id || 1; // Mock user ID for testing
    return await this.checkoutService.getOrderDetails(orderId, userId);
  }

  @Get('orders/:orderId/track')
  async trackOrder(@Param('orderId') orderId: number, @Req() req) {
    const userId = req.user?.id || 1; // Mock user ID for testing
    return await this.checkoutService.trackOrder(orderId, userId);
  }
}
