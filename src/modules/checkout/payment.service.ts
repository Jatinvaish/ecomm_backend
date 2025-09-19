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
      console.log(`🔄 Creating payment intent for user ${user_id}, method: ${payment_data.payment_method_code}, amount: ${payment_data.amount}`);

      const payment_method = await this.paymentRepository.getPaymentMethodByCode(payment_data.payment_method_code);
      if (!payment_method) {
        console.error(`❌ Invalid payment method: ${payment_data.payment_method_code}`);
        throw new BadRequestException('Invalid payment method');
      }

      let result: any = {};

      switch (payment_data.payment_method_code) {
        case 'stripe_card':
          console.log('💳 Processing Stripe payment intent');
          result = await this.createStripeIntent(payment_data, user_id);
          break;

        case 'razorpay':
          console.log('💰 Processing Razorpay payment intent');
          result = await this.createRazorpayIntent(payment_data, user_id);
          break;

        case 'cod':
          console.log('💵 Processing Cash on Delivery');
          result = {
            provider: 'cod',
            message: 'Cash on Delivery selected',
            amount: payment_data.amount,
            currency: payment_data.currency
          };
          break;

        default:
          console.error(`❌ Unsupported payment method: ${payment_data.payment_method_code}`);
          throw new BadRequestException('Unsupported payment method');
      }

      console.log(`✅ Payment intent created successfully: ${JSON.stringify(result)}`);
      return ApiResponse.success({ result });
    } catch (error) {
      console.error(`❌ Payment intent creation failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Payment intent creation failed: ${error.message}`);
    }
  }

  private async createStripeIntent(payment_data: PaymentIntentDto, user_id: number) {
    try {
      console.log(`🔄 Creating Stripe payment intent`);

      const config = await this.integrationService.getPaymentConfig('stripe');

      if (!config) {
        console.error(`❌ Stripe not configured`);
        throw new BadRequestException('Stripe not configured');
      }

      console.log(`✅ Stripe config found, creating payment intent`);

      const stripe = new Stripe(config.credentials.api_key, {
        apiVersion: null,
      });

      const payment_intent = await stripe.paymentIntents.create({
        amount: Math.round(payment_data.amount * 100),
        currency: payment_data.currency.toLowerCase(),
        metadata: {
          user_id: user_id.toString(),
          payment_method: payment_data.payment_method_code
        },
      });

      console.log(`✅ Stripe payment intent created: ${payment_intent.id}`);
      return {
        client_secret: payment_intent.client_secret,
        payment_intent_id: payment_intent.id,
        provider: 'stripe',
        amount: payment_data.amount,
        currency: payment_data.currency
      };
    } catch (error) {
      console.error(`❌ Error creating Stripe payment intent: ${error.message}`, error);
      throw new BadRequestException(`Stripe payment intent creation failed: ${error.message}`);
    }
  }

  private async createRazorpayIntent(payment_data: PaymentIntentDto, user_id: number) {
    try {
      console.log(`🔄 Creating Razorpay payment intent`);

      const config = await this.integrationService.getPaymentConfig('razorpay');

      if (!config) {
        console.error(`❌ Razorpay not configured`);
        throw new BadRequestException('Razorpay not configured');
      }

      console.log(`✅ Razorpay config found, creating order`);

      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: config.credentials.key_id,
        key_secret: config.credentials.key_secret,
      });

      const order = await razorpay.orders.create({
        amount: Math.round(payment_data.amount * 100), // Convert to paisa
        currency: payment_data.currency.toUpperCase(),
        receipt: `receipt_${user_id}_${Date.now()}`,
        notes: {
          user_id: user_id.toString(),
          payment_method: payment_data.payment_method_code
        },
      });

      console.log(`✅ Razorpay order created: ${order.id}`);
      return {
        order_id: order.id,
        client_secret: order.id, // Use order ID as client secret for Razorpay
        payment_intent_id: order.id,
        provider: 'razorpay',
        amount: payment_data.amount,
        currency: payment_data.currency,
        razorpay_key_id: config.credentials.key_id
      };
    } catch (error) {
      console.error(`❌ Error creating Razorpay payment intent: ${error.message}`, error);
      throw new BadRequestException(`Razorpay payment intent creation failed: ${error.message}`);
    }
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
    try {
      console.log(`🔄 Processing payment for order ${order.id}, payment method ${payment_method_id}`);

      const payment_method = await this.paymentRepository.getPaymentMethodById(payment_method_id);
      if (!payment_method) {
        console.error(`❌ Invalid payment method ID: ${payment_method_id}`);
        throw new BadRequestException('Invalid payment method');
      }

      console.log(`✅ Payment method found: ${payment_method.code}`);

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

      console.log(`💾 Creating payment transaction: ${JSON.stringify(transaction_data)}`);
      const transaction = await this.paymentRepository.createPaymentTransaction(transaction_data, client);
      console.log(`✅ Payment transaction created with ID: ${transaction.id}`);

      if (payment_method.code === 'cod') {
        console.log('💵 Processing Cash on Delivery payment');

        // Update order status for COD
        await client.query(
          'UPDATE orders SET status = $1, payment_status = $2, updated_at = NOW() WHERE id = $3',
          ['confirmed', 'pending', order.id]
        );

        console.log(`✅ COD order confirmed: ${order.id}`);
        return ApiResponse.success({
          payment_method: 'cod',
          transaction_id: transaction.id,
          message: 'Order confirmed. Payment will be collected on delivery.',
          order_status: 'confirmed',
          payment_status: 'pending'
        });
      }

      // For online payments (Stripe/Razorpay), update to processing status
      await client.query(
        'UPDATE orders SET status = $1, payment_status = $2, updated_at = NOW() WHERE id = $3',
        ['processing', 'pending', order.id]
      );

      console.log(`✅ Online payment initiated for order: ${order.id}`);
      return ApiResponse.success({
        payment_method: payment_method.code,
        transaction_id: transaction.id,
        message: 'Payment processing initiated. Please complete the payment.',
        order_status: 'processing',
        payment_status: 'pending',
        provider: payment_method.provider
      });
    } catch (error) {
      console.error(`❌ Error processing payment: ${error.message}`, error.stack);
      throw new BadRequestException(`Payment processing failed: ${error.message}`);
    }
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
    try {
      console.log(`🔄 Processing Razorpay webhook: ${event.event}`);

      switch (event.event) {
        case 'payment.captured':
          console.log(`✅ Payment captured for order: ${event.payload.payment.entity.order_id}`);
          await this.updatePaymentStatus(
            event.payload.payment.entity.order_id,
            'completed',
            'razorpay'
          );
          break;

        case 'payment.failed':
          console.log(`❌ Payment failed for order: ${event.payload.payment.entity.order_id}`);
          await this.updatePaymentStatus(
            event.payload.payment.entity.order_id,
            'failed',
            'razorpay'
          );
          break;

        case 'order.paid':
          console.log(`💰 Order paid: ${event.payload.order.entity.id}`);
          await this.updatePaymentStatus(
            event.payload.order.entity.id,
            'completed',
            'razorpay'
          );
          break;

        default:
          console.log(`⚠️ Unhandled Razorpay webhook event: ${event.event}`);
      }
    } catch (error) {
      console.error(`❌ Error handling Razorpay webhook: ${error.message}`, error);
      throw error;
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
