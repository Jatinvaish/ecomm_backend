import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { InsertQuery, SelectQuery, UpdateQuery } from 'src/db/postgres.client';

@Injectable()
export class OrderRepository {

  async createOrder(orderData: any, client?: PoolClient) {
    console.log("🚀 ~ OrderRepository ~ createOrder ~ orderData:", orderData)
    const query = `
      INSERT INTO orders (
        order_number, user_id, currency_id, subtotal, tax_amount, 
        shipping_amount, discount_amount, total_amount, billing_address, 
        shipping_address, notes, status, payment_status, fulfillment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const values = [
      orderData.order_number,
      orderData.user_id,
      orderData.currency_id || 3, // Default to INR
      orderData.subtotal,
      orderData.tax_amount,
      orderData.shipping_amount,
      orderData.discount_amount,
      orderData.total_amount,
      JSON.stringify(orderData?.billing_address),
      JSON.stringify(orderData?.shipping_address),
      orderData.notes,
      'pending',
      'pending',
      'unfulfilled'
    ];
    console.log("🚀 ~ OrderRepository ~ createOrder ~ values:", values)

    if (client) {
      const result = await client.query(query, values);
      return result.rows[0];
    } else {
      const result = await InsertQuery(query, values);
      return result.rows[0];
    }
  }

  async createOrderItem(orderItemData: any, client?: PoolClient) {
    console.log("🚀 ~ OrderRepository ~ orderItemData:", orderItemData)
    const query = `
      INSERT INTO order_items (
        order_id,vendor_order_id, product_id, combination_id, product_name, product_sku,
        variant_details, quantity, unit_price, total_price, tax_rate, tax_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      orderItemData?.order_id,
      orderItemData?.vendor_order_id,
      orderItemData?.product_id,
      orderItemData?.combination_id || null,
      orderItemData?.product_name,
      orderItemData?.product_sku,
      orderItemData?.variant_details ? JSON.stringify(orderItemData.variant_details) : null,
      orderItemData?.quantity,
      orderItemData?.unit_price,
      orderItemData?.total_price,
      orderItemData?.tax_rate || 0,
      orderItemData?.tax_amount || 0
    ];

    if (client) {
      const result = await client.query(query, values);
      return result.rows[0];
    } else {
      const result = await InsertQuery(query, values);
      return result.rows[0];
    }
  }

  async getUserOrders(userId: number, limit = 50) {
    const query = `
      SELECT o.*, COUNT(oi.id) as total_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $2
    `;
    return await SelectQuery(query, [userId, limit]);
  }

  async getOrderDetails(orderId: number, userId: number) {
    const orderQuery = `
      SELECT * FROM orders 
      WHERE id = $1 AND user_id = $2
    `;
    const orderResult = await SelectQuery(orderQuery, [orderId, userId]);
    
    if (orderResult.length === 0) {
      return null;
    }

    const order = orderResult[0];

    const itemsQuery = `
      SELECT oi.*, p.featured_image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    const items = await SelectQuery(itemsQuery, [orderId]);

    const vendorOrdersQuery = `
      SELECT vo.*, v.store_name
      FROM vendor_orders vo
      LEFT JOIN vendors v ON vo.vendor_id = v.id
      WHERE vo.order_id = $1
    `;
    const vendorOrders = await SelectQuery(vendorOrdersQuery, [orderId]);

    return {
      ...order,
      items,
      vendorOrders
    };
  }

  async updateOrderStatus(orderId: number, status: string, paymentStatus?: string, fulfillmentStatus?: string) {
    let query = 'UPDATE orders SET status = $1';
    const params = [status];
    let paramIndex = 2;

    if (paymentStatus) {
      query += `, payment_status = $${paramIndex}`;
      params.push(paymentStatus);
      paramIndex++;
    }

    if (fulfillmentStatus) {
      query += `, fulfillment_status = $${paramIndex}`;
      params.push(fulfillmentStatus);
      paramIndex++;
    }

    query += `, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
    params.push(String(orderId));

    const result = await UpdateQuery(query, params);
    return result.rows[0];
  }
}
