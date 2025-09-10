
// services/checkout.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckoutRepository } from './repositories/checkout.repository';
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
    private readonly cartRepository: CartRepository,
    private readonly shippingService: ShippingService,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
  ) { }

  async calculateCheckout(checkout_data: CheckoutDto, user_id: number) {
    // Get cart data
    const cart_response = await this.cartRepository.getCart({ user_id });
    if (!cart_response.result || cart_response.result.items.length === 0) {
      throw new BadRequestException('Cart is empty or not found');
    }

    const cart_data = cart_response.result;

    // Validate addresses
    const [billing_address, shipping_address] = await Promise.all([
      this.checkoutRepository.getAddressById(checkout_data.billing_address_id, user_id),
      this.checkoutRepository.getAddressById(checkout_data.shipping_address_id, user_id)
    ]);

    if (!billing_address || !shipping_address) {
      throw new BadRequestException('Invalid address');
    }

    // Validate payment method
    const payment_method = await this.checkoutRepository.getPaymentMethodById(checkout_data.payment_method_id);
    if (!payment_method || !payment_method.is_active) {
      throw new BadRequestException('Invalid payment method');
    }

    // Calculate shipping
    const shipping_cost = await this.shippingService.calculateShipping(
      cart_data.items,
      shipping_address.country_id
    );

    // Apply coupon discount if provided
    let coupon_discount_amount = 0;
    let applied_coupon = null;
    if (checkout_data.coupon_code) {
      const coupon = await this.checkoutRepository.validateCoupon(
        checkout_data.coupon_code,
        user_id,
        cart_data.summary.subtotal
      );

      if (coupon && coupon.is_valid) {
        applied_coupon = coupon;
        coupon_discount_amount = this.calculateCouponDiscount(coupon, cart_data.summary.subtotal);
      }
    }

    // Calculate final totals
    const subtotal = cart_data.summary.subtotal;
    const tax_amount = cart_data.summary.tax_amount;
    const total_discount = cart_data.summary.discount_amount + coupon_discount_amount;
    const total_amount = subtotal + tax_amount + shipping_cost - total_discount;

    return ApiResponse.success({
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
    });
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
      // Calculate checkout details
      const checkout_details = await this.calculateCheckout(checkout_data, user_id);
      console.log("🚀 ~ CheckoutService ~ processCheckout ~ checkout_details:", checkout_details?.result?.items)

      // Create order with proper data flow
      const order = await this.orderService.createOrder(
        user_id,
        checkout_data,
        checkout_details.result,
        client
      );

      // Process payment
      const payment_result = await this.paymentService.processPayment(
        order,
        checkout_data.payment_method_id,
        client
      );

      if (payment_result?.result) {
        // Clear cart after successful order
        await this.cartRepository.clearCart(user_id);

        return ApiResponse.success({
          order: {
            id: order.id,
            order_number: order.order_number,
            total_amount: order.total_amount,
            status: order.status,
            vendor_orders_count: order.vendor_orders.length
          },
          payment: payment_result,
        });
      } else {
        throw new BadRequestException('Payment failed');
      }
    });
  }
 

  async trackOrder(orderId: number, userId: number) {
    const order = await this.checkoutRepository.getOrderDetails(orderId, userId);
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

  async getOrderDetails(orderId: number, userId: number) {
    const order = await this.checkoutRepository.getOrderDetails(orderId, userId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return ApiResponse.success({
      order
    });
  }
}
