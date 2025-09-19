// repositories/checkout.repository.ts
import { Injectable } from '@nestjs/common';
import { SelectQuery } from 'src/db/postgres.client';

@Injectable()
export class CheckoutRepository {

  async getProductWithTax(productId: number) {
    const query = `
      SELECT 
        p.*,
        v.store_name,
        v.commission_balance,
        vt.commission_rate,
        t.id as tax_id,
        t.name as tax_name,
        t.type as tax_type,
        t.rate as tax_rate,
        t.is_flexible as tax_is_flexible,
        t.threshold_less as tax_threshold_less,
        t.threshold_greater as tax_threshold_greater,
        t.rate_less as tax_rate_less,
        t.rate_greater as tax_rate_greater
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN vendor_tiers vt ON v.tier_id = vt.id
      LEFT JOIN taxes t ON p.tax_id = t.id AND t.is_active = true
      WHERE p.id = $1 AND p.status = 'active' AND p.is_active = true
    `;

    const result = await SelectQuery(query, [productId]);
    return result[0] || null;
  }

  async getTaxById(taxId: number) {
    const query = `
      SELECT * FROM taxes 
      WHERE id = $1 AND is_active = true
    `;

    const result = await SelectQuery(query, [taxId]);
    return result[0] || null;
  }

  async getAddressById(addressId: number, userId: number) {
    const query = `
      SELECT ua.*, c.name as country_name, r.name as region_name
      FROM user_addresses ua
      LEFT JOIN countries c ON ua.country_id = c.id
      LEFT JOIN regions r ON ua.region_id = r.id
      WHERE ua.id = $1 AND ua.user_id = $2
    `;

    const result = await SelectQuery(query, [addressId, userId]);
    return result[0] || null;
  }

  async getPaymentMethodById(paymentMethodId: number) {
    const query = `
      SELECT * FROM payment_methods 
      WHERE id = $1 AND is_active = true
    `;

    const result = await SelectQuery(query, [paymentMethodId]);
    return result[0] || null;
  }

  async getProductVariantCombination(combinationId: number) {
    const query = `
      SELECT 
        pvc.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'attribute_name', pv.name,
              'attribute_value', pvv.value,
              'attribute_id', pv.attribute_id
            )
            ORDER BY pv.sort_order
          ) FILTER (WHERE pv.id IS NOT NULL), 
          '[]'::json
        ) as variant_details
      FROM product_variant_combinations pvc
      LEFT JOIN product_variant_combination_values pvcv ON pvc.id = pvcv.combination_id
      LEFT JOIN product_variant_values pvv ON pvcv.variant_value_id = pvv.id
      LEFT JOIN product_variants pv ON pvv.variant_id = pv.id
      WHERE pvc.id = $1 AND pvc.is_active = true
      GROUP BY pvc.id
    `;

    const result = await SelectQuery(query, [combinationId]);
    return result[0] || null;
  }

  async validateCoupon(couponCode: string, userId: number, orderAmount: number) {
    const query = `
      SELECT 
        p.*,
        c.usage_count,
        c.expires_at as coupon_expires_at,
        CASE 
          WHEN p.status != 'active' THEN false
          WHEN p.start_date > CURRENT_TIMESTAMP THEN false
          WHEN p.end_date IS NOT NULL AND p.end_date < CURRENT_TIMESTAMP THEN false
          WHEN c.expires_at IS NOT NULL AND c.expires_at < CURRENT_TIMESTAMP THEN false
          WHEN p.usage_limit IS NOT NULL AND p.current_usage_count >= p.usage_limit THEN false
          WHEN p.minimum_order_amount IS NOT NULL AND $3 < p.minimum_order_amount THEN false
          WHEN c.usage_count >= p.usage_limit_per_customer THEN false
          ELSE true
        END as is_valid
      FROM coupons c
      JOIN promotions p ON c.promotion_id = p.id
      WHERE c.code = $1 
        AND c.is_active = true
        AND (c.user_id IS NULL OR c.user_id = $2)
    `;

    const result = await SelectQuery(query, [couponCode, userId, orderAmount]);
    return result[0] || null;
  }

  async getCountryByAddressId(addressId: number): Promise<number> {
    const query = `
      SELECT country_id FROM user_addresses WHERE id = $1
    `;

    const result = await SelectQuery(query, [addressId]);
    return result[0]?.country_id || 1; // Default to 1 if not found
  }

  // ADD THESE MISSING METHODS:
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

  async getOrderDetails(orderIdentifier: string | number, userId: number) {
    // Check if orderIdentifier is a number (ID) or string (order number)
    const isOrderNumber = typeof orderIdentifier === 'string' && orderIdentifier.startsWith('ORD-');

    let orderQuery: string;
    let params: any[];

    if (isOrderNumber) {
      // Search by order number
      orderQuery = `
        SELECT * FROM orders
        WHERE order_number = $1 AND user_id = $2
      `;
      params = [orderIdentifier, userId];
    } else {
      // Search by order ID
      orderQuery = `
        SELECT * FROM orders
        WHERE id = $1 AND user_id = $2
      `;
      params = [orderIdentifier, userId];
    }

    const orderResult = await SelectQuery(orderQuery, params);

    if (orderResult.length === 0) {
      return null;
    }

    const order = orderResult[0];
    const actualOrderId = order.id;

    const itemsQuery = `
      SELECT oi.*, p.featured_image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    const items = await SelectQuery(itemsQuery, [actualOrderId]);

    const vendorOrdersQuery = `
      SELECT vo.*, v.store_name
      FROM vendor_orders vo
      LEFT JOIN vendors v ON vo.vendor_id = v.id
      WHERE vo.order_id = $1
    `;
    const vendorOrders = await SelectQuery(vendorOrdersQuery, [actualOrderId]);

    return {
      ...order,
      items,
      vendorOrders
    };
  }
  async getShippingMethods(countryId?: number) {
    const query = `
      SELECT sm.*, sz.name as zone_name
      FROM shipping_methods sm
      LEFT JOIN shipping_zones sz ON sm.zone_id = sz.id
      WHERE sm.is_active = true
      ${countryId ? 'AND $1 = ANY(sz.countries)' : ''}
      ORDER BY sm.sort_order ASC
    `;
    const params = countryId ? [countryId] : [];
    return await SelectQuery(query, params);
  }

  async getCurrencies() {
    const query = `
      SELECT * FROM currencies
      WHERE is_active = true
      ORDER BY code ASC
    `;
    return await SelectQuery(query);
  }

  async getCountries() {
    const query = `
      SELECT * FROM countries
      WHERE is_active = true
      ORDER BY name ASC
    `;
    return await SelectQuery(query);
  }

  async getPaymentMethods() {
    const query = `
      SELECT id, name, code, type, provider, supported_countries, supported_currencies,
             configuration, is_active, sort_order
      FROM payment_methods
      WHERE is_active = true
      ORDER BY sort_order ASC
    `;
    return await SelectQuery(query);
  }

  async getIntegrations() {
    const query = `
      SELECT id, name, type, provider, configuration, credentials, is_active
      FROM integrations
      WHERE is_active = true
      ORDER BY type, name
    `;
    return await SelectQuery(query);
  }

  async getSystemSettings() {
    const query = `
      SELECT * FROM settings
      WHERE category = 'checkout'
      ORDER BY setting_key ASC
    `;
    const result = await SelectQuery(query);

    // Convert to key-value object
    const settings = {};
    result.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value;
    });

    return settings;
  }
}