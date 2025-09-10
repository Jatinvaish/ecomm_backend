import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { InsertQuery, UpdateQuery, SelectQuery } from 'src/db/postgres.client';

@Injectable()
export class VendorOrderRepository {

  async createVendorOrder(vendorOrderData: any, client?: PoolClient) {
    console.log("🚀 ~ VendorOrderRepository ~ createVendorOrder ~ vendorOrderData:", vendorOrderData)
    const query = `
      INSERT INTO vendor_orders (
        order_id, vendor_id, vendor_order_number, subtotal, tax_amount,
        shipping_amount, total_amount, commission_rate, commission_amount,
        status, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      vendorOrderData?.order_id,
      vendorOrderData?.vendor_id,
      vendorOrderData?.vendor_order_number,
      vendorOrderData?.subtotal,
      vendorOrderData?.tax_amount,
      vendorOrderData?.shipping_amount,
      vendorOrderData?.total_amount,
      vendorOrderData?.commission_rate,
      vendorOrderData?.commission_amount,
      'pending',
      'pending'
    ];

    if (client) {
      const result = await client.query(query, values);
      return result.rows[0];
    } else {
      const result = await InsertQuery(query, values);
      return result.rows[0];
    }
  }

  async updateOrderItemWithVendorOrder(orderItemId: number, vendorOrderId: number, client?: PoolClient) {
    const query = `
      UPDATE order_items 
      SET vendor_order_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    if (client) {
      const result = await client.query(query, [vendorOrderId, orderItemId]);
      return result.rows[0];
    } else {
      const result = await UpdateQuery(query, [vendorOrderId, orderItemId]);
      return result.rows[0];
    }
  }

  async createCommission(commissionData: any, client?: PoolClient) {
console.log('✌️commissionData --->', commissionData);
    const query = `
      INSERT INTO commissions (
        order_item_id, vendor_id, commission_rate, base_amount,
        commission_amount, currency_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      commissionData.orderItemId,
      commissionData.vendorId,
      commissionData.commissionRate,
      commissionData.baseAmount,
      commissionData.commissionAmount,
      commissionData.currencyId,
      'pending'
    ];

    if (client) {
      const result = await client.query(query, values);
      return result.rows[0];
    } else {
      const result = await InsertQuery(query, values);
      return result.rows[0];
    }
  }

  async getVendorOrders(vendorId: number, limit = 50) {
    const query = `
      SELECT vo.*, o.order_number, o.order_date,
             COUNT(oi.id) as total_items
      FROM vendor_orders vo
      LEFT JOIN orders o ON vo.order_id = o.id
      LEFT JOIN order_items oi ON vo.id = oi.vendor_order_id
      WHERE vo.vendor_id = $1
      GROUP BY vo.id, o.order_number, o.order_date
      ORDER BY vo.created_at DESC
      LIMIT $2
    `;
    return await SelectQuery(query, [vendorId, limit]);
  }

  async updateVendorOrderStatus(vendorOrderId: number, status: string, trackingNumber?: string, shippingProviderId?: number) {
    let query = 'UPDATE vendor_orders SET status = $1';
    const params = [status];
    let paramIndex = 2;

    if (trackingNumber) {
      query += `, tracking_number = $${paramIndex}`;
      params.push(trackingNumber);
      paramIndex++;
    }

    if (shippingProviderId) {
      query += `, shipping_provider_id = $${paramIndex}`;
      params.push(String(shippingProviderId));
      paramIndex++;
    }

    if (status === 'shipped') {
      query += `, shipped_at = NOW()`;
    } else if (status === 'delivered') {
      query += `, delivered_at = NOW()`;
    }

    query += `, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
    params.push(String(vendorOrderId));

    const result = await UpdateQuery(query, params);
    return result.rows[0];
  }
}
