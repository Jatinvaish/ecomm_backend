import { Injectable } from '@nestjs/common';
import { VendorOrderRepository } from './repositories/vendor-order.repository';
import { PoolClient } from 'pg';

@Injectable()
export class VendorOrderService {
  constructor(private readonly vendorOrderRepository: VendorOrderRepository) {}

  async splitOrderByVendors(order: any, checkoutDetails: any, client: PoolClient) {
    const vendorOrders = [];

    // Split by vendor groups
    for (const vendorGroup of checkoutDetails.vendorGroups) {
      // Calculate vendor order totals
      const subtotal = vendorGroup.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = subtotal * 0.18; // 18% tax
      const shippingAmount = 50; // Simplified shipping calculation
      const totalAmount = subtotal + taxAmount + shippingAmount;

      // Create vendor order
      const vendorOrderData = {
        orderId: order.id,
        vendorId: vendorGroup.vendorId,
        vendorOrderNumber: `VO-${Date.now()}-${vendorGroup.vendorId}`,
        subtotal,
        taxAmount,
        shippingAmount,
        totalAmount,
        commissionRate: vendorGroup.commissionRate,
        commissionAmount: totalAmount * (vendorGroup.commissionRate / 100)
      };

      const vendorOrder = await this.vendorOrderRepository.createVendorOrder(vendorOrderData, client);

      // Update order items with vendor order reference and create commissions
      for (const item of vendorGroup.items) {
        // Find the actual order item
        const orderItem = order.items.find(oi => oi.product_id === item.productId);
        
        if (orderItem) {
          // Update order item with vendor order ID
          await this.vendorOrderRepository.updateOrderItemWithVendorOrder(
            orderItem.id, 
            vendorOrder.id, 
            client
          );

          // Create commission record
          const commissionData = {
            orderItemId: orderItem.id,
            vendorId: vendorGroup.vendorId,
            commissionRate: vendorGroup.commissionRate,
            baseAmount: item.totalPrice,
            commissionAmount: item.totalPrice * (vendorGroup.commissionRate / 100),
            currencyId: 2 // INR
          };

          await this.vendorOrderRepository.createCommission(commissionData, client);
        }
      }

      vendorOrders.push(vendorOrder);
    }

    return vendorOrders;
  }

  async getVendorOrders(vendorId: number) {
    return await this.vendorOrderRepository.getVendorOrders(vendorId);
  }

  async updateVendorOrderStatus(
    vendorOrderId: number,
    status: string,
    trackingNumber?: string,
    shippingProviderId?: number
  ) {
    return await this.vendorOrderRepository.updateVendorOrderStatus(
      vendorOrderId, 
      status, 
      trackingNumber, 
      shippingProviderId
    );
  }
}
