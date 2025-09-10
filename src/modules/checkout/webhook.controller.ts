// controllers/webhook.controller.ts
import { Controller, Post, Body, Headers, Req, Res, RawBodyRequest } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Request, Response } from 'express';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
    @Res() res: Response
  ) {
    try {
      await this.paymentService.handleWebhook('stripe', req.rawBody, signature);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }

  @Post('razorpay')
  async handleRazorpayWebhook(
    @Body() body: any,
    @Headers('x-razorpay-signature') signature: string,
    @Res() res: Response
  ) {
    try {
      await this.paymentService.handleWebhook('razorpay', body, signature);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Razorpay webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
}
