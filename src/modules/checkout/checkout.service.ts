
// services/checkout.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckoutRepository } from './repositories/checkout.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { CheckoutDto } from './dto/checkout.dto';
import { ShippingService } from './shipping.service';
import { ApiResponse } from 'src/common/utils/common-response';
import { withTransaction } from 'src/db/postgres.client';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';
import { CartRepository } from '../cart/cart.repository';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly cartRepository: CartRepository,
    private readonly shippingService: ShippingService,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) { }

  async calculateCheckout(checkout_data: CheckoutDto, user_id: number) {
    try {
      console.log(`🔄 Calculating checkout for user ${user_id}`);
      console.log(`📦 Checkout data: ${JSON.stringify(checkout_data)}`);

      // Get cart data
      const cart_response = await this.cartRepository.getCart({ user_id });
      if (!cart_response.result || cart_response.result.items.length === 0) {
        console.error(`❌ Cart is empty for user ${user_id}`);
        throw new BadRequestException('Cart is empty or not found');
      }

      const cart_data = cart_response.result;
      console.log(`✅ Cart found with ${cart_data.items.length} items`);

      // Validate addresses
      console.log(`🏠 Validating addresses: billing=${checkout_data.billing_address_id}, shipping=${checkout_data.shipping_address_id}`);
      const [billing_address, shipping_address] = await Promise.all([
        this.checkoutRepository.getAddressById(checkout_data.billing_address_id, user_id),
        this.checkoutRepository.getAddressById(checkout_data.shipping_address_id, user_id)
      ]);

      if (!billing_address || !shipping_address) {
        console.error(`❌ Invalid addresses for user ${user_id}`);
        throw new BadRequestException('Invalid address');
      }
      console.log(`✅ Addresses validated successfully`);

      // Validate payment method
      console.log(`💳 Validating payment method: ${checkout_data.payment_method_id}`);
      const payment_method = await this.checkoutRepository.getPaymentMethodById(checkout_data.payment_method_id);
      if (!payment_method || !payment_method.is_active) {
        console.error(`❌ Invalid payment method: ${checkout_data.payment_method_id}`);
        throw new BadRequestException('Invalid payment method');
      }
      console.log(`✅ Payment method validated: ${payment_method.code}`);

      // Calculate shipping
      console.log(`🚚 Calculating shipping for country ${shipping_address.country_id}`);
      const shipping_cost = await this.shippingService.calculateShipping(
        cart_data.items,
        shipping_address.country_id
      );
      console.log(`✅ Shipping cost calculated: ₹${shipping_cost}`);

      // Apply coupon discount if provided
      let coupon_discount_amount = 0;
      let applied_coupon = null;
      if (checkout_data.coupon_code) {
        console.log(`🎫 Validating coupon: ${checkout_data.coupon_code}`);
        const coupon = await this.checkoutRepository.validateCoupon(
          checkout_data.coupon_code,
          user_id,
          cart_data.summary.subtotal
        );

        if (coupon && coupon.is_valid) {
          applied_coupon = coupon;
          coupon_discount_amount = this.calculateCouponDiscount(coupon, cart_data.summary.subtotal);
          console.log(`✅ Coupon applied: ${checkout_data.coupon_code}, discount: ₹${coupon_discount_amount}`);
        } else {
          console.log(`⚠️ Invalid coupon: ${checkout_data.coupon_code}`);
        }
      }

      // Calculate final totals
      const subtotal = cart_data.summary.subtotal;
      const tax_amount = cart_data.summary.tax_amount;
      const total_discount = cart_data.summary.discount_amount + coupon_discount_amount;
      const total_amount = subtotal + tax_amount + shipping_cost - total_discount;

      console.log(`💰 Final calculation: Subtotal: ₹${subtotal}, Tax: ₹${tax_amount}, Shipping: ₹${shipping_cost}, Discount: ₹${total_discount}, Total: ₹${total_amount}`);

      const result = {
        currency_id: cart_data.currency_id,
        subtotal,
        tax_amount,
        shipping_amount: parseFloat(shipping_cost.toFixed(2)),
        discount_amount: total_discount,
        total_amount: parseFloat(total_amount.toFixed(2)),
        currency_code: cart_data.currency_code || 'INR',
        items: cart_data.items,
        addresses: {
          billing: billing_address,
          shipping: shipping_address
        },
        payment_method,
        applied_coupon
      };

      console.log(`✅ Checkout calculation completed successfully`);
      return ApiResponse.success(result);
    } catch (error) {
      console.error(`❌ Error calculating checkout: ${error.message}`, error.stack);
      throw error;
    }
  }

  private calculateCouponDiscount(coupon: any, subtotal: number): number {
    let discount = 0;

    if (coupon.type === 'PERCENTAGE_ORDER') {
      discount = (subtotal * parseFloat(coupon.value)) / 100;
    } else if (coupon.type === 'FIXED_ORDER') {
      discount = parseFloat(coupon.value);
    }

    if (coupon.maximum_discount_amount && discount > parseFloat(coupon.maximum_discount_amount)) {
      discount = parseFloat(coupon.maximum_discount_amount);
    }

    return Math.min(discount, subtotal);
  }

  async processCheckout(checkout_data: CheckoutDto, user_id: number) {
    return await withTransaction(async (client) => {
      try {
        console.log(`🚀 Starting checkout process for user ${user_id}`);
        console.log(`📋 Checkout data: ${JSON.stringify(checkout_data)}`);

        // Calculate checkout details
        console.log(`🔢 Calculating checkout details...`);
        const checkout_details = await this.calculateCheckout(checkout_data, user_id);
        console.log(`✅ Checkout calculated: ₹${checkout_details.result.total_amount}`);

        // Create order with proper data flow
        console.log(`📦 Creating order...`);
        const order = await this.orderService.createOrder(
          user_id,
          checkout_data,
          checkout_details.result,
          client
        );
        console.log(`✅ Order created: ${order.order_number} (ID: ${order.id})`);

        // Process payment
        console.log(`💳 Processing payment for order ${order.id}...`);
        const payment_result = await this.paymentService.processPayment(
          order,
          checkout_data.payment_method_id,
          client
        );
        console.log(`✅ Payment processed: ${JSON.stringify(payment_result.result)}`);

        if (payment_result?.result) {
          // Clear cart after successful order
          console.log(`🗑️ Clearing cart for user ${user_id}...`);
          await this.cartRepository.clearCart(user_id);
          console.log(`✅ Cart cleared successfully`);

          const response = {
            order: {
              id: order.id,
              order_number: order.order_number,
              total_amount: order.total_amount,
              status: order.status,
              vendor_orders_count: order.vendor_orders.length
            },
            payment: payment_result.result,
          };

          console.log(`🎉 Checkout process completed successfully for order ${order.order_number}`);
          return ApiResponse.success(response);
        } else {
          console.error(`❌ Payment failed for order ${order.id}`);
          throw new BadRequestException('Payment failed');
        }
      } catch (error) {
        console.error(`❌ Error in checkout process: ${error.message}`, error.stack);
        throw error;
      }
    });
  }
 

  async trackOrder(orderIdentifier: string | number, userId: number) {
    const order = await this.checkoutRepository.getOrderDetails(orderIdentifier, userId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Get tracking info from shipping providers
    const trackingInfo = [];
    for (const vendorOrder of order.vendorOrders) {
      if (vendorOrder.tracking_number) {
        const tracking = await this.shippingService.getTrackingInfo(
          vendorOrder.tracking_number,
          vendorOrder.shipping_provider_id
        );
        trackingInfo.push({
          vendorOrderId: vendorOrder.id,
          storeName: vendorOrder.store_name,
          trackingNumber: vendorOrder.tracking_number,
          ...tracking
        });
      }
    }
    return ApiResponse.success({
      order: {
        //@ts-ignore
        id: order?.id,
        //@ts-ignore
        orderNumber: order?.order_number,
        //@ts-ignore
        status: order?.status,
        //@ts-ignore
        fulfillmentStatus: order?.fulfillment_status,
        //@ts-ignore
        paymentStatus: order?.payment_status
      },
      tracking: trackingInfo
    });
  }

  async getShippingMethods(addressId: number) {
    const countryId = await this.checkoutRepository.getCountryByAddressId(addressId);
    const getRepone = await this.shippingService.getShippingMethods(countryId);
    return ApiResponse.success({
      getRepone
    });
  }

  async getUserOrders(userId: number) {
    const getRepone = await this.checkoutRepository.getUserOrders(userId);
    return ApiResponse.success({
      getRepone
    });
  }

  async getOrderDetails(orderIdentifier: string | number, userId: number) {
    const order = await this.checkoutRepository.getOrderDetails(orderIdentifier, userId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return ApiResponse.success({
      order
    });
  }

  async getCheckoutConfig() {
    try {
      console.log(`🔄 Fetching checkout configuration`);

      // Get payment methods with full configuration
      const paymentMethods = await this.checkoutRepository.getPaymentMethods();

      // Get integrations for payment gateway credentials
      const integrations = await this.checkoutRepository.getIntegrations();

      // Get currencies
      const currencies = await this.checkoutRepository.getCurrencies();

      // Get countries for shipping
      const countries = await this.checkoutRepository.getCountries();

      // Get system settings
      const settings = await this.checkoutRepository.getSystemSettings();

      // Extract Razorpay and Stripe configurations from integrations
      const razorpayIntegration = integrations.find(int => int.provider === 'razorpay' && int.type === 'payment');
      const stripeIntegration = integrations.find(int => int.provider === 'stripe' && int.type === 'payment');

      const config = {
        payment_methods: paymentMethods.map(method => ({
          id: method.id,
          name: method.name,
          code: method.code,
          type: method.type,
          provider: method.provider,
          supported_countries: method.supported_countries,
          supported_currencies: method.supported_currencies,
          configuration: method.configuration,
          is_active: method.is_active,
          sort_order: method.sort_order
        })),
        currencies: currencies.map(currency => ({
          id: currency.id,
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          decimal_places: currency.decimal_places,
          is_base_currency: currency.is_base_currency,
          is_active: currency.is_active
        })),
        countries: countries.map(country => ({
          id: country.id,
          code: country.code,
          name: country.name,
          phone_prefix: country.phone_prefix,
          default_currency_id: country.default_currency_id,
          is_active: country.is_active
        })),
        settings: {
          default_currency: (settings as any)?.default_currency || 'INR',
          tax_inclusive: (settings as any)?.tax_inclusive || false,
          free_shipping_threshold: (settings as any)?.free_shipping_threshold || 1000,
          max_cod_amount: (settings as any)?.max_cod_amount || 50000,
          order_timeout_minutes: (settings as any)?.order_timeout_minutes || 30,
          razorpay_config: {
            key_id: razorpayIntegration?.credentials?.key_id || (settings as any)?.razorpay_key_id || null,
            webhook_secret: razorpayIntegration?.credentials?.webhook_secret || (settings as any)?.razorpay_webhook_secret || null,
            is_sandbox: razorpayIntegration?.configuration?.is_sandbox || (settings as any)?.razorpay_is_sandbox || true
          },
          stripe_config: {
            public_key: stripeIntegration?.credentials?.public_key || (settings as any)?.stripe_public_key || null,
            webhook_secret: stripeIntegration?.credentials?.webhook_secret || (settings as any)?.stripe_webhook_secret || null,
            is_sandbox: stripeIntegration?.configuration?.is_sandbox || (settings as any)?.stripe_is_sandbox || true
          }
        },
        features: {
          guest_checkout: (settings as any)?.guest_checkout || false,
          multi_currency: (settings as any)?.multi_currency || false,
          coupon_system: (settings as any)?.coupon_system || true,
          wishlist: (settings as any)?.wishlist || true,
          reviews: (settings as any)?.reviews || true,
          notifications: (settings as any)?.notifications || true
        }
      };

      console.log(`✅ Checkout configuration fetched successfully`);
      return ApiResponse.success(config);
    } catch (error) {
      console.error(`❌ Error fetching checkout config: ${error.message}`, error.stack);
      throw error;
    }
  }
}
