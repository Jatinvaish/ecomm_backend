// services/payment.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentRepository } from './repositories/payment.repository';
import { IntegrationService } from './integration.service';
import { PaymentIntentDto } from './dto/checkout.dto';
import { PoolClient } from 'pg';
import Stripe from 'stripe';
import { UpdateQuery } from 'src/db/postgres.client';
import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly integrationService: IntegrationService,
  ) {}

  async getActivePaymentMethods() {
    const payment_methods = await this.paymentRepository.getPaymentMethods();
    return ApiResponse.success({
      data: payment_methods
    });
  }

  async createPaymentIntent(payment_data: PaymentIntentDto, user_id: number) {
    try {
      const payment_method = await this.paymentRepository.getPaymentMethodByCode(payment_data.payment_method_code);
      if (!payment_method) {
        throw new BadRequestException('Invalid payment method');
      }

      let result: any = {};

      switch (payment_data.payment_method_code) {
        case 'stripe_card':
          result = await this.createStripeIntent(payment_data, user_id);
          break;

        case 'razorpay':
          result = await this.createRazorpayOrder(payment_data, user_id);
          break;

        case 'cod':
          result = {
            provider: 'cod',
            message: 'Cash on Delivery selected'
          };
          break;

        default:
          throw new BadRequestException('Unsupported payment method');
      }

      return ApiResponse.success({ result });
    } catch (error) {
      throw new BadRequestException(`Payment intent creation failed: ${error.message}`);
    }
  }

  private async createStripeIntent(payment_data: PaymentIntentDto, user_id: number) {
    const config = await this.integrationService.getPaymentConfig('stripe');
    if (!config) {
      throw new BadRequestException('Stripe not configured');
    }

    const stripe = new Stripe(config.credentials.api_key, {
      apiVersion: null,
    });

    const payment_intent = await stripe.paymentIntents.create({
      amount: Math.round(payment_data.amount * 100),
      currency: payment_data.currency.toLowerCase(),
      metadata: {
        user_id: user_id.toString(),
      },
    });

    return {
      client_secret: payment_intent.client_secret,
      payment_intent_id: payment_intent.id,
      provider: 'stripe'
    };
  }

  private async createRazorpayOrder(payment_data: PaymentIntentDto, user_id: number) {
    const config = await this.integrationService.getPaymentConfig('razorpay');
    console.log("🚀 ~ PaymentService ~ createRazorpayOrder ~ config:", config)
    if (!config) {
      throw new BadRequestException('Razorpay not configured');
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: config.credentials.key_id,
      key_secret: config.credentials.key_secret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(payment_data.amount * 100),
      currency: payment_data.currency.toUpperCase(),
      receipt: `receipt_${Date.now()}`,
      notes: {
        user_id: user_id.toString(),
      },
    });

    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      provider: 'razorpay'
    };
  }

  async processPayment(order: any, payment_method_id: number, client: PoolClient): Promise<ApiResponseFormat<any>> {
    const payment_method = await this.paymentRepository.getPaymentMethodById(payment_method_id);
    if (!payment_method) {
      throw new BadRequestException('Invalid payment method');
    }

    // Create payment transaction record
    const transaction_data = {
      order_id: order.id,
      user_id: order.user_id,
      payment_method_id: payment_method_id,
      amount: order.total_amount,
      currency_id: order.currency_id,
      status: payment_method.code === 'cod' ? 'completed' : 'pending',
      transaction_type: 'payment',
      provider_payment_id: payment_method.code === 'cod' ? null : `pending_${Date.now()}`
    };

    await this.paymentRepository.createPaymentTransaction(transaction_data, client);

    if (payment_method.code === 'cod') {
      // Update order status for COD
      await client.query(
        'UPDATE orders SET status = $1, payment_status = $2, updated_at = NOW() WHERE id = $3',
        ['confirmed', 'pending', order.id]
      );

      return ApiResponse.success({
        payment_method: 'cod',
        message: 'Order confirmed. Payment will be collected on delivery.'
      });
    }

    return ApiResponse.success({
      payment_method: payment_method.code,
      message: 'Payment processing initiated'
    });
  }

  async handleWebhook(provider: string, payload: any, signature: string) {
    try {
      let event: any;

      switch (provider) {
        case 'stripe':
          event = await this.validateStripeWebhook(payload, signature);
          await this.handleStripeWebhook(event);
          break;

        case 'razorpay':
          await this.validateRazorpayWebhook(payload, signature);
          await this.handleRazorpayWebhook(payload);
          break;

        default:
          throw new BadRequestException('Unsupported webhook provider');
      }

      return ApiResponse.success({ success: true });
    } catch (error) {
      throw new BadRequestException(`Webhook processing failed: ${error.message}`);
    }
  }

  private async validateStripeWebhook(payload: any, signature: string) {
    const config = await this.integrationService.getPaymentConfig('stripe');
    if (!config) {
      throw new BadRequestException('Stripe not configured');
    }

    const stripe = new Stripe(config.credentials.api_key, {
      apiVersion: null,
    });

    return stripe.webhooks.constructEvent(
      payload,
      signature,
      config.credentials.webhook_secret
    );
  }

  private async validateRazorpayWebhook(payload: any, signature: string) {
    const config = await this.integrationService.getPaymentConfig('razorpay');
    console.log("🚀 ~ PaymentService ~ validateRazorpayWebhook ~ config:", config)
    if (!config) {
      throw new BadRequestException('Razorpay not configured');
    }

    const crypto = require('crypto');
    const expected_signature = crypto
      .createHmac('sha256', config.credentials.webhook_secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (expected_signature !== signature) {
      throw new BadRequestException('Invalid signature');
    }
  }

  private async handleStripeWebhook(event: any) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const payment_intent = event.data.object;
        await this.updatePaymentStatus(
          payment_intent.id,
          'completed',
          'stripe'
        );
        break;

      case 'payment_intent.payment_failed':
        const failed_payment = event.data.object;
        await this.updatePaymentStatus(
          failed_payment.id,
          'failed',
          'stripe'
        );
        break;
    }
  }

  private async handleRazorpayWebhook(event: any) {
    switch (event.event) {
      case 'payment.captured':
        await this.updatePaymentStatus(
          event.payload.payment.entity.order_id,
          'completed',
          'razorpay'
        );
        break;

      case 'payment.failed':
        await this.updatePaymentStatus(
          event.payload.payment.entity.order_id,
          'failed',
          'razorpay'
        );
        break;
    }
  }

  private async updatePaymentStatus(
    provider_transaction_id: string,
    status: string,
    provider: string
  ) {
    const transaction = await this.paymentRepository.findTransactionByProviderPaymentId(provider_transaction_id);

    if (transaction) {
      // Update transaction status
      await this.paymentRepository.updatePaymentTransactionStatus(transaction.id, status);

      // Update order status
      const order_status = status === 'completed' ? 'confirmed' : 'failed';
      const payment_status = status === 'completed' ? 'paid' : 'failed';

      await UpdateQuery(
        'UPDATE orders SET status = $1, payment_status = $2, updated_at = NOW() WHERE id = $3',
        [order_status, payment_status, transaction.order_id]
      );
    }
  }
}
