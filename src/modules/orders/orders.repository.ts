import { Injectable } from '@nestjs/common';
import { SelectQuery, UpdateQuery, PaginatedQuery, QueryBuilder } from 'src/db/postgres.client';
import { OrderFiltersDto } from './dto/orders.dto';

@Injectable()
export class OrdersRepository {

  // ==================== GET ALL ORDERS (ADMIN) ====================
  
  /**
   * Get all orders with filters (Admin only)
   */
 async getAllOrders(filters: OrderFiltersDto) {
  const queryBuilder = new QueryBuilder();
  
  // Handle search
  if (filters.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    queryBuilder.addCondition('(o.order_number ILIKE ? OR u.full_name ILIKE ? OR u.email ILIKE ?)', 
                             searchTerm, searchTerm, searchTerm);
  }

  if (filters.status && filters.status !== 'all') {
    queryBuilder.addCondition('o.status = ?', filters.status);
  }

  if (filters.payment_status && filters.payment_status !== 'all') {
    queryBuilder.addCondition('o.payment_status = ?', filters.payment_status);
  }

  if (filters.fulfillment_status && filters.fulfillment_status !== 'all') {
    queryBuilder.addCondition('o.fulfillment_status = ?', filters.fulfillment_status);
  }

  if (filters.start_date) {
    queryBuilder.addCondition('o.order_date >= ?', filters.start_date);
  }

  if (filters.end_date) {
    queryBuilder.addCondition('o.order_date <= ?', filters.end_date);
  }

  const { whereClause, params } = queryBuilder.build();

  const baseQuery = `
    SELECT 
      o.id, o.uuid, o.order_number, o.user_id, o.currency_id,
      o.subtotal, o.tax_amount, o.shipping_amount, o.discount_amount, o.total_amount,
      o.status, o.payment_status, o.fulfillment_status,
      o.order_date, o.created_at, o.updated_at,
      u.full_name as customer_name, u.email as customer_email,
      c.symbol as currency_symbol,
      COUNT(oi.id) as total_items,
      COUNT(DISTINCT vo.vendor_id) as total_vendors
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN currencies c ON o.currency_id = c.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN vendor_orders vo ON o.id = vo.order_id
    WHERE ${whereClause}
    GROUP BY o.id, u.full_name, u.email, c.symbol
    ORDER BY o.${filters.sort_by || 'created_at'} ${filters.sort_order || 'DESC'}
  `;

  const countQuery = `
    SELECT COUNT(DISTINCT o.id) as total
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN currencies c ON o.currency_id = c.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN vendor_orders vo ON o.id = vo.order_id
    WHERE ${whereClause}
  `;

  console.log('Admin Orders Query:', baseQuery);
  console.log('Admin Orders Params:', params);

  return await PaginatedQuery(
    baseQuery,
    countQuery,
    params,
    filters.page || 1,
    filters.limit || 10
  );
}

  // ==================== GET VENDOR ORDERS ====================
  
  /**
   * Get orders for a specific vendor
   */
  async getVendorOrders(vendorId: number, filters: OrderFiltersDto) {
    const queryBuilder = new QueryBuilder();
    
    // Always add vendor condition first
    queryBuilder.addCondition('vo.vendor_id = ?', vendorId);

    // Handle search with OR logic manually
    let searchWhereClause = '';
    let searchParams = [];
    if (filters.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.trim()}%`;
      searchWhereClause = `(o.order_number ILIKE ? OR vo.vendor_order_number ILIKE ? OR u.full_name ILIKE ?)`;
      searchParams = [searchTerm, searchTerm, searchTerm];
    }

    if (filters.status && filters.status !== 'all') {
      queryBuilder.addCondition('vo.status = ?', filters.status);
    }

    if (filters.payment_status && filters.payment_status !== 'all') {
      queryBuilder.addCondition('o.payment_status = ?', filters.payment_status);
    }

    if (filters.fulfillment_status && filters.fulfillment_status !== 'all') {
      queryBuilder.addCondition('o.fulfillment_status = ?', filters.fulfillment_status);
    }

    if (filters.start_date) {
      queryBuilder.addCondition('o.order_date >= ?', filters.start_date);
    }

    if (filters.end_date) {
      queryBuilder.addCondition('o.order_date <= ?', filters.end_date);
    }

    const { whereClause, params } = queryBuilder.build();
    
    // Combine search and other conditions
    let finalWhereClause = whereClause;
    let finalParams = [...params];

    if (searchWhereClause) {
      if (whereClause !== '1=1') {
        // Update parameter indices in whereClause
        let updatedWhereClause = whereClause;
        for (let i = params.length; i >= 1; i--) {
          const regex = new RegExp(`\\$${i}`, 'g');
          updatedWhereClause = updatedWhereClause.replace(regex, `$${i + searchParams.length}`);
        }
        finalWhereClause = `${updatedWhereClause} AND ${searchWhereClause}`;
        finalParams = [...params, ...searchParams];
      } else {
        finalWhereClause = searchWhereClause;
        finalParams = [...searchParams];
      }
    }

    const baseQuery = `
      SELECT 
        o.id, o.uuid, o.order_number, o.user_id,
        o.subtotal, o.tax_amount, o.shipping_amount, o.total_amount,
        o.status, o.payment_status, o.fulfillment_status,
        o.order_date, o.created_at, o.updated_at,
        u.full_name as customer_name, u.email as customer_email,
        vo.id as vendor_order_id, vo.vendor_order_number,
        vo.subtotal as vendor_subtotal, vo.total_amount as vendor_total,
        vo.status as vendor_status, vo.tracking_number,
        vo.commission_rate, vo.commission_amount,
        COUNT(oi.id) as total_items
      FROM orders o
      INNER JOIN vendor_orders vo ON o.id = vo.order_id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON vo.id = oi.vendor_order_id
      WHERE ${finalWhereClause}
      GROUP BY o.id, u.full_name, u.email, vo.id
      ORDER BY o.${filters.sort_by || 'created_at'} ${filters.sort_order || 'DESC'}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      INNER JOIN vendor_orders vo ON o.id = vo.order_id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ${finalWhereClause}
    `;

    console.log('Vendor Orders Query:', baseQuery);
    console.log('Vendor Orders Params:', finalParams);

    return await PaginatedQuery(
      baseQuery,
      countQuery,
      finalParams,
      filters.page || 1,
      filters.limit || 10
    );
  }

  // ==================== GET CUSTOMER ORDERS ====================
  
  /**
   * Get orders for a specific customer
   */
  async getCustomerOrders(userId: number, filters: OrderFiltersDto) {
    const queryBuilder = new QueryBuilder();
    queryBuilder.addCondition('o.user_id = ?', userId);

    let baseQuery = `
      SELECT 
        o.id, o.uuid, o.order_number, o.currency_id,
        o.subtotal, o.tax_amount, o.shipping_amount, o.discount_amount, o.total_amount,
        o.status, o.payment_status, o.fulfillment_status,
        o.order_date, o.created_at, o.updated_at,
        c.symbol as currency_symbol,
        COUNT(oi.id) as total_items,
        COUNT(DISTINCT vo.vendor_id) as total_vendors
      FROM orders o
      LEFT JOIN currencies c ON o.currency_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN vendor_orders vo ON o.id = vo.order_id
    `;

    if (filters.search) {
      queryBuilder.addLikeCondition('o.order_number', filters.search);
    }

    if (filters.status && filters.status !== 'all') {
      queryBuilder.addCondition('o.status = ?', filters.status);
    }

    if (filters.payment_status && filters.payment_status !== 'all') {
      queryBuilder.addCondition('o.payment_status = ?', filters.payment_status);
    }

    if (filters.fulfillment_status && filters.fulfillment_status !== 'all') {
      queryBuilder.addCondition('o.fulfillment_status = ?', filters.fulfillment_status);
    }

    if (filters.start_date) {
      queryBuilder.addCondition('o.order_date >= ?', filters.start_date);
    }

    if (filters.end_date) {
      queryBuilder.addCondition('o.order_date <= ?', filters.end_date);
    }

    const { whereClause, params } = queryBuilder.build();
    
    baseQuery += ` WHERE ${whereClause}`;
    baseQuery += `
      GROUP BY o.id, c.symbol
      ORDER BY o.${filters.sort_by || 'created_at'} ${filters.sort_order || 'DESC'}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      WHERE ${whereClause}
    `;

    console.log('Customer Orders Query:', baseQuery);
    console.log('Customer Orders Params:', params);

    return await PaginatedQuery(
      baseQuery,
      countQuery,
      params,
      filters.page || 1,
      filters.limit || 10
    );
  }

  // ==================== DEBUGGING METHOD ====================
  
  /**
   * Debug method to check if orders exist
   */
  async debugOrders() {
    try {
      // Check total orders
      const totalOrders = await SelectQuery('SELECT COUNT(*) as count FROM orders');
      console.log('Total orders in DB:', totalOrders[0]?.count);

      // Check sample orders
      const sampleOrders = await SelectQuery('SELECT * FROM orders LIMIT 5');
      console.log('Sample orders:', sampleOrders);

      // Check users table
      const totalUsers = await SelectQuery('SELECT COUNT(*) as count FROM users');
      console.log('Total users in DB:', totalUsers[0]?.count);

      // Check vendor_orders
      const totalVendorOrders = await SelectQuery('SELECT COUNT(*) as count FROM vendor_orders');
      console.log('Total vendor orders in DB:', totalVendorOrders[0]?.count);

      // Check order_items
      const totalOrderItems = await SelectQuery('SELECT COUNT(*) as count FROM order_items');
      console.log('Total order items in DB:', totalOrderItems[0]?.count);

      // Test basic join
      const joinTest = await SelectQuery(`
        SELECT 
          o.id, o.order_number, u.full_name, c.symbol
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN currencies c ON o.currency_id = c.id
        LIMIT 3
      `);
      console.log('Join test results:', joinTest);

      return {
        totalOrders: totalOrders[0]?.count,
        sampleOrders,
        totalUsers: totalUsers[0]?.count,
        totalVendorOrders: totalVendorOrders[0]?.count,
        totalOrderItems: totalOrderItems[0]?.count,
        joinTest
      };
    } catch (error) {
      console.error('Debug orders error:', error);
      throw error;
    }
  }

  // ==================== SIMPLE GET ALL ORDERS (NO FILTERS) ====================
  
  /**
   * Simple method to get all orders without any filters for testing
   */
  async getSimpleOrders() {
    const query = `
      SELECT 
        o.id, o.uuid, o.order_number, o.user_id, o.currency_id,
        o.subtotal, o.tax_amount, o.shipping_amount, o.discount_amount, o.total_amount,
        o.status, o.payment_status, o.fulfillment_status,
        o.order_date, o.created_at, o.updated_at,
        u.full_name as customer_name, u.email as customer_email,
        c.symbol as currency_symbol
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN currencies c ON o.currency_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `;

    console.log('Simple Orders Query:', query);
    
    try {
      const result = await SelectQuery(query);
      console.log('Simple Orders Result:', result);
      return result;
    } catch (error) {
      console.error('Simple Orders Error:', error);
      throw error;
    }
  }

  // ==================== GET ORDER DETAILS ====================
  
  /**
   * Get detailed order information
   */
  async getOrderDetails(orderId: number, userId?: number, vendorId?: number) {
    let whereClause = 'o.id = $1';
    let params = [orderId];
    let paramIndex = 2;

    if (userId) {
      whereClause += ` AND o.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    // Get main order details
    const orderQuery = `
      SELECT 
        o.*, 
        u.full_name as customer_name, u.email as customer_email, u.phone_number as customer_phone,
        c.symbol as currency_symbol, c.name as currency_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN currencies c ON o.currency_id = c.id
      WHERE ${whereClause}
    `;

    console.log('Order Details Query:', orderQuery);
    console.log('Order Details Params:', params);

    const orderResult = await SelectQuery(orderQuery, params);
    if (!orderResult.length) return null;

    const order = orderResult[0];

    // Get order items with product details
    let itemsQuery = `
      SELECT 
        oi.*,
        p.featured_image_url, p.slug as product_slug,
        vo.vendor_id, vo.status as vendor_status, vo.tracking_number,
        v.store_name, v.store_slug
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN vendor_orders vo ON oi.vendor_order_id = vo.id
      LEFT JOIN vendors v ON vo.vendor_id = v.id
      WHERE oi.order_id = $1
    `;

    let itemsParams = [orderId];

    if (vendorId) {
      itemsQuery += ` AND vo.vendor_id = $2`;
      itemsParams.push(vendorId);
    }

    itemsQuery += ` ORDER BY oi.id`;

    const items = await SelectQuery(itemsQuery, itemsParams);

    // Get vendor orders
    let vendorOrdersQuery = `
      SELECT 
        vo.*,
        v.store_name, v.store_slug, v.logo_url,
        sp.name as shipping_provider_name
      FROM vendor_orders vo
      LEFT JOIN vendors v ON vo.vendor_id = v.id
      LEFT JOIN shipping_providers sp ON vo.shipping_provider_id = sp.id
      WHERE vo.order_id = $1
    `;

    let vendorOrdersParams = [orderId];

    if (vendorId) {
      vendorOrdersQuery += ` AND vo.vendor_id = $2`;
      vendorOrdersParams.push(vendorId);
    }

    const vendorOrders = await SelectQuery(vendorOrdersQuery, vendorOrdersParams);

    // Get order status history
    const historyQuery = `
      SELECT * FROM order_status_history 
      WHERE order_id = $1 
      ORDER BY created_at DESC
    `;
    const history = await SelectQuery(historyQuery, [orderId]);

    return {
      ...order,
      items,
      vendor_orders: vendorOrders,
      status_history: history
    };
  }

  // ==================== UPDATE ORDER STATUS ====================
  
  /**
   * Update order status
   */
  async updateOrderStatus(orderId: number, status: string, notes?: string) {
    // First get current status
    const currentOrder = await SelectQuery('SELECT status FROM orders WHERE id = $1', [orderId]);
    if (!currentOrder.length) return null;

    const oldStatus = currentOrder[0].status;

    // Update order status
    const updateQuery = `
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await UpdateQuery(updateQuery, [status, orderId]);

    // Add to status history
    if (result.rows && result.rows.length > 0) {
      const historyQuery = `
        INSERT INTO order_status_history (order_id, old_status, new_status, notes)
        VALUES ($1, $2, $3, $4)
      `;
      await UpdateQuery(historyQuery, [orderId, oldStatus, status, notes || null]);
    }

    return result.rows ? result.rows[0] : null;
  }

  /**
   * Update vendor order status
   */
  async updateVendorOrderStatus(vendorOrderId: number, status: string, trackingNumber?: string, shippingProviderId?: number, notes?: string) {
    let query = 'UPDATE vendor_orders SET status = $1, updated_at = CURRENT_TIMESTAMP';
    let params = [status];
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

    if (notes) {
      query += `, notes = $${paramIndex}`;
      params.push(notes);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(String(vendorOrderId));

    const result = await UpdateQuery(query, params);
    return result.rows ? result.rows[0] : null;
  }

  // ==================== ORDER TRACKING ====================
  
  /**
   * Get order tracking information
   */
  async getOrderTracking(orderId: number, userId?: number) {
    let whereClause = 'o.id = $1';
    let params = [orderId];

    if (userId) {
      whereClause += ' AND o.user_id = $2';
      params.push(userId);
    }

    const query = `
      SELECT 
        o.id, o.order_number, o.status,
        vo.id as vendor_order_id, vo.vendor_order_number, vo.status as vendor_status,
        vo.tracking_number, vo.shipped_at, vo.delivered_at,
        v.store_name, v.store_slug,
        sp.name as shipping_provider_name, sp.code as shipping_provider_code,
        sp.tracking_url_template
      FROM orders o
      LEFT JOIN vendor_orders vo ON o.id = vo.order_id
      LEFT JOIN vendors v ON vo.vendor_id = v.id
      LEFT JOIN shipping_providers sp ON vo.shipping_provider_id = sp.id
      WHERE ${whereClause}
      ORDER BY vo.id
    `;

    return await SelectQuery(query, params);
  }
}