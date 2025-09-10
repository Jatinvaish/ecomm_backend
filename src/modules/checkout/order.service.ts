// services/order.service.ts
import { Injectable } from '@nestjs/common';
import { OrderRepository } from './repositories/order.repository';
import { VendorOrderRepository } from './repositories/vendor-order.repository';
import { CheckoutDto } from './dto/checkout.dto';
import { PoolClient } from 'pg';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly vendorOrderRepository: VendorOrderRepository,
  ) {}

  async createOrder(user_id: number, checkout_data: CheckoutDto, checkout_details: any, client: PoolClient) {
    // Generate order number
    const order_number = `ORD-${Date.now()}-${user_id}`;

    // Create main order first
    const order_data = {
      order_number,
      user_id,
      currency_id: checkout_details.currency_id || 3,
      subtotal: checkout_details.subtotal,
      tax_amount: checkout_details.tax_amount,
      shipping_amount: checkout_details.shipping_amount,
      discount_amount: checkout_details.discount_amount,
      total_amount: checkout_details.total_amount,
      billing_address: checkout_details.addresses?.billing,
      shipping_address: checkout_details.addresses?.shipping,
      notes: checkout_data.notes
    };

    const order = await this.orderRepository.createOrder(order_data, client);

    // Group items by vendor
    const vendor_groups = this.groupItemsByVendor(checkout_details.items);

    // Create vendor orders first (before order items)
    const created_vendor_orders = [];
    for (const vendor_group of vendor_groups) {
      const vendor_order = await this.createVendorOrder(order, vendor_group, client);
      created_vendor_orders.push(vendor_order);
    }

    // Now create order items with vendor_order_id references
    const created_items = [];
    for (const vendor_order of created_vendor_orders) {
      const vendor_items = vendor_groups.find(vg => vg.vendor_id === vendor_order.vendor_id)?.items || [];
      console.log("🚀 ~ OrderService ~ createOrder ~ vendor_items:", vendor_items)
      
      for (const item of vendor_items) {
        const order_item_data = {
          order_id: order.id,
          vendor_order_id: vendor_order.id,
          product_id: item.product_id,
          combination_id: item.combination_id,
          product_name: item.product_name,
          product_sku: item.sku,
          variant_details: item.variant_details,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          tax_rate: item.tax_rate || 0,
          tax_amount: item.tax_amount || 0
        };

        const order_item = await this.orderRepository.createOrderItem(order_item_data, client);
        
        // Create commission record
        await this.createCommission(order_item, vendor_order, item, client);
        
        created_items.push(order_item);
      }
    }

    return {
      ...order,
      items: created_items,
      vendor_orders: created_vendor_orders
    };
  }

  private groupItemsByVendor(items: any[]) {
    console.log("🚀 ~ OrderService ~ groupItemsByVendor ~ items:", items)
    const groups = new Map();
    
    items.forEach(item => {
      const vendor_id = item.vendor_id;
      if (!groups.has(vendor_id)) {
        groups.set(vendor_id, {
          vendor_id,
          items: [],
          commission_rate: item.commission_rate || 0
        });
      }
      groups.get(vendor_id).items.push(item);
    });

    return Array.from(groups.values());
  }

  private async createVendorOrder(order: any, vendor_group: any, client: PoolClient) {
    const subtotal = vendor_group.items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    const tax_amount = vendor_group.items.reduce((sum, item) => sum + parseFloat(item.tax_amount || 0), 0);
    const shipping_amount = 0; // Calculate based on shipping rules
    const total_amount = subtotal + tax_amount + shipping_amount;
    const commission_amount = total_amount * (vendor_group.commission_rate / 100);

    const vendor_order_data = {
      order_id: order.id,
      vendor_id: vendor_group.vendor_id,
      vendor_order_number: `VO-${Date.now()}-${vendor_group.vendor_id}`,
      subtotal,
      tax_amount,
      shipping_amount,
      total_amount,
      commission_rate: vendor_group.commission_rate,
      commission_amount
    };

    return await this.vendorOrderRepository.createVendorOrder(vendor_order_data, client);
  }

  private async createCommission(order_item: any, vendor_order: any, item: any, client: PoolClient) {
    const query = `
      INSERT INTO commissions (
        order_item_id, vendor_id, commission_rate, base_amount,
        commission_amount, currency_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `;
    
    const values = [
      order_item.id,
      vendor_order.vendor_id,
      vendor_order.commission_rate,
      parseFloat(item.total_price),
      parseFloat(item.total_price) * (vendor_order.commission_rate / 100),
      order_item.currency_id || 3
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  }

  async updateOrderStatus(order_id: number, status: string, payment_status?: string, fulfillment_status?: string) {
    return await this.orderRepository.updateOrderStatus(order_id, status, payment_status, fulfillment_status);
  }

  async getUserOrders(user_id: number) {
    return await this.orderRepository.getUserOrders(user_id);
  }

  async getOrderDetails(order_id: number, user_id: number) {
    return await this.orderRepository.getOrderDetails(order_id, user_id);
  }
}
