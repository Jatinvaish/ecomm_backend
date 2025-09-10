//v1

import {
  SelectQuery,
  InsertQuery,
  withTransaction,
} from 'src/db/postgres.client';
import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import { PoolClient } from 'pg';
import { CartResponse, AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

export class CartRepository { 
  private readonly cartSelectFields = `
      sc.id, sc.user_id, sc.session_id, sc.currency_id, sc.language_id,
      sc.expires_at, sc.created_at, sc.updated_at,
      c.code as currency_code, c.symbol as currency_symbol
    `;

  private readonly cartItemSelectFields = `
      ci.id, ci.cart_id, ci.product_id, ci.combination_id, ci.quantity,
      ci.unit_price, ci.total_price, ci.added_at, ci.created_at, ci.updated_at,
      p.name as product_name, p.slug as product_slug, p.sku, p.compare_price,p.vendor_id,
      p.featured_image_url as product_image, p.stock_quantity,
      p.max_order_quantity, p.min_order_quantity, p.sold_individually,
      pvc.sku as variant_sku, pvc.stock_quantity as variant_stock,
      pvc.compare_price as variant_compare_price, pvc.dimensions as variant_dimensions
    `;

  async getCart(params: {
    user_id?: number;
    session_id?: string;
    currency_id?: number;
  }): Promise<ApiResponseFormat<CartResponse>> {
    try {
      // Validate that we have at least one identifier
      if (!params.user_id && !params.session_id) {
        return ApiResponse.badRequest('Either user_id or session_id is required');
      }

      const cart = await this.findOrCreateCart(params);
      if (!cart) {
        return ApiResponse.notFound('Cart not found');
      }

      const cartWithItems = await this.getCartWithItems(cart.id);
      return ApiResponse.success(cartWithItems);
    } catch (error) {
      console.error('Get cart error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async addToCart(
    addToCartDto: AddToCartDto,
    userId?: number,
    sessionId?: string
  ): Promise<ApiResponseFormat<CartResponse>> {
    try {
      // Validate inputs
      if (!userId && !sessionId) {
        return ApiResponse.badRequest('Either user_id or session_id is required');
      }

      return await withTransaction(async (client: PoolClient) => {
        // Find or create cart
        const cart = await this.findOrCreateCart({
          user_id: userId,
          session_id: sessionId,
          currency_id: addToCartDto.currency_id || 3
        }, client);

        // FIXED: Handle combination_id properly with explicit type casting
        let existingItemSql: string;
        let queryParams: any[];

        if (addToCartDto.combination_id === null || addToCartDto.combination_id === undefined) {
          existingItemSql = `
              SELECT id, quantity, unit_price FROM cart_items 
              WHERE cart_id = $1 AND product_id = $2 AND combination_id IS NULL
            `;
          queryParams = [cart.id, addToCartDto.product_id];
        } else {
          existingItemSql = `
              SELECT id, quantity, unit_price FROM cart_items 
              WHERE cart_id = $1 AND product_id = $2 AND combination_id = $3
            `;
          queryParams = [cart.id, addToCartDto.product_id, addToCartDto.combination_id];
        }

        const existingItemResult = await client.query(existingItemSql, queryParams);

        // Get product details and pricing
        const productDetails = await this.getProductPricing(
          addToCartDto.product_id,
          addToCartDto.combination_id,
          cart.currency_id,
          client
        );

        if (!productDetails.is_available) {
          throw new Error('Product is not available');
        }

        const unitPrice = addToCartDto.unit_price || productDetails.price;

        if (existingItemResult.rows.length > 0) {
          // Update existing item
          const existingItem = existingItemResult.rows[0];
          const newQuantity = existingItem.quantity + addToCartDto.quantity;

          if (newQuantity > productDetails.max_quantity) {
            throw new Error(`Maximum quantity available: ${productDetails.max_quantity}`);
          }

          const newTotalPrice = unitPrice * newQuantity;

          const updateSql = `
              UPDATE cart_items 
              SET quantity = $1, unit_price = $2, total_price = $3, updated_at = CURRENT_TIMESTAMP
              WHERE id = $4
            `;
          await client.query(updateSql, [newQuantity, unitPrice, newTotalPrice, existingItem.id]);
        } else {
          // Insert new item
          if (addToCartDto.quantity > productDetails.max_quantity) {
            throw new Error(`Maximum quantity available: ${productDetails.max_quantity}`);
          }

          const totalPrice = unitPrice * addToCartDto.quantity;

          const insertSql = `
              INSERT INTO cart_items (cart_id, product_id, combination_id, quantity, unit_price, total_price)
              VALUES ($1, $2, $3, $4, $5, $6)
            `;
          await client.query(insertSql, [
            cart.id,
            addToCartDto.product_id,
            addToCartDto.combination_id || null, // Explicitly convert undefined to null
            addToCartDto.quantity,
            unitPrice,
            totalPrice
          ]);
        }

        // Update cart timestamp
        await client.query(
          'UPDATE shopping_carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [cart.id]
        );

        const updatedCart = await this.getCartWithItems(cart.id, client);
        return ApiResponse.success(updatedCart);
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      return ApiResponse.error(error.message || Messages.INTERNAL_SERVER_ERROR, 400);
    }
  }

  async updateCartItem(
    itemId: number,
    updateDto: UpdateCartItemDto,
    userId?: number,
    sessionId?: any
  ): Promise<ApiResponseFormat<CartResponse>> {
    try {
      return await withTransaction(async (client: PoolClient) => {
        // FIXED: Proper condition handling for user/session validation
        let conditions = [];
        let params = [itemId];

        if (userId) {
          conditions.push('sc.user_id = $2');
          params.push(userId);
        }

        if (sessionId) {
          conditions.push(`sc.session_id = $${params.length + 1}`);
          params.push(sessionId);
        }

        if (conditions.length === 0) {
          throw new Error('Either user_id or session_id is required');
        }

        const itemSql = `
            SELECT ci.*, sc.id as cart_id, sc.currency_id
            FROM cart_items ci
            JOIN shopping_carts sc ON ci.cart_id = sc.id
            WHERE ci.id = $1 AND (${conditions.join(' OR ')})
          `;

        const itemResult = await client.query(itemSql, params);

        if (itemResult.rows.length === 0) {
          throw new Error('Cart item not found');
        }

        const item = itemResult.rows[0];

        // Get product availability
        const productDetails = await this.getProductPricing(
          item.product_id,
          item.combination_id,
          item.currency_id,
          client
        );

        if (updateDto.quantity > productDetails.max_quantity) {
          throw new Error(`Maximum quantity available: ${productDetails.max_quantity}`);
        }

        if (updateDto.quantity <= 0) {
          throw new Error('Quantity must be greater than 0');
        }

        const totalPrice = item.unit_price * updateDto.quantity;

        // Update item
        const updateSql = `
            UPDATE cart_items 
            SET quantity = $1, total_price = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `;
        await client.query(updateSql, [updateDto.quantity, totalPrice, itemId]);

        const updatedCart = await this.getCartWithItems(item.cart_id, client);
        return ApiResponse.success(updatedCart);
      });
    } catch (error) {
      console.error('Update cart item error:', error);
      return ApiResponse.error(error.message || Messages.INTERNAL_SERVER_ERROR, 400);
    }
  }

  async removeCartItem(
    itemId: number,
    userId?: number,
    sessionId?: any
  ): Promise<ApiResponseFormat<CartResponse>> {
    try {
      return await withTransaction(async (client: PoolClient) => {
        // FIXED: Proper condition handling for user/session validation
        let conditions = [];
        let params = [itemId];

        if (userId) {
          conditions.push('sc.user_id = $2');
          params.push(userId);
        }

        if (sessionId) {
          conditions.push(`sc.session_id = $${params.length + 1}`);
          params.push(sessionId);
        }

        if (conditions.length === 0) {
          throw new Error('Either user_id or session_id is required');
        }

        const itemSql = `
            SELECT sc.id as cart_id
            FROM cart_items ci
            JOIN shopping_carts sc ON ci.cart_id = sc.id
            WHERE ci.id = $1 AND (${conditions.join(' OR ')})
          `;

        const itemResult = await client.query(itemSql, params);

        if (itemResult.rows.length === 0) {
          throw new Error('Cart item not found');
        }

        const cartId = itemResult.rows[0].cart_id;

        // Delete item
        await client.query('DELETE FROM cart_items WHERE id = $1', [itemId]);

        const updatedCart: any = await this.getCartWithItems(cartId, client);
        return ApiResponse.success(updatedCart);
      });
    } catch (error) {
      console.error('Remove cart item error:', error);
      return ApiResponse.error(error.message || Messages.INTERNAL_SERVER_ERROR, 400);
    }
  }

  async clearCart(userId?: number, sessionId?: string): Promise<ApiResponseFormat<any>> {
    try {
      if (!userId && !sessionId) {
        return ApiResponse.badRequest('Either user_id or session_id is required');
      }

      const conditions = [];
      const params = [];

      if (userId) {
        conditions.push(`sc.user_id = $${params.length + 1}`);
        params.push(userId);
      }

      if (sessionId) {
        conditions.push(`sc.session_id = $${params.length + 1}`);
        params.push(sessionId);
      }

      const cartSql = `
          SELECT sc.id FROM shopping_carts sc
          WHERE ${conditions.join(' OR ')}
        `;

      const cartResult = await SelectQuery(cartSql, params);

      if (cartResult.length === 0) {
        return ApiResponse.notFound('Cart not found');
      }

      const cartId = cartResult[0].id;
      await SelectQuery('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

      return ApiResponse.success({ message: 'Cart cleared successfully' });
    } catch (error) {
      console.error('Clear cart error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async getCartCount(userId?: number, sessionId?: string): Promise<ApiResponseFormat<{ count: number }>> {
    try {
      if (!userId && !sessionId) {
        return ApiResponse.success({ count: 0 });
      }

      const conditions = [];
      const params = [];

      if (userId) {
        conditions.push(`sc.user_id = $${params.length + 1}`);
        params.push(userId);
      }

      if (sessionId) {
        conditions.push(`sc.session_id = $${params.length + 1}`);
        params.push(sessionId);
      }

      const countSql = `
          SELECT COALESCE(SUM(ci.quantity), 0)::integer as count
          FROM shopping_carts sc
          LEFT JOIN cart_items ci ON sc.id = ci.cart_id
          WHERE ${conditions.join(' OR ')}
          AND sc.expires_at > CURRENT_TIMESTAMP
        `;

      const result = await SelectQuery(countSql, params);
      const count = result[0]?.count || 0;

      return ApiResponse.success({ count });
    } catch (error) {
      console.error('Get cart count error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // Helper Methods
  private async findOrCreateCart(
    params: { user_id?: number; session_id?: string; currency_id?: number },
    client?: PoolClient
  ): Promise<any> {
    try {
      // Validate that we have at least one identifier
      if (!params.user_id && !params.session_id) {
        throw new Error('Either user_id or session_id is required');
      }

      const conditions = [];
      const queryParams = [];

      if (params.user_id) {
        conditions.push(`sc.user_id = $${queryParams.length + 1}`);
        queryParams.push(params.user_id);
      }

      if (params.session_id) {
        conditions.push(`sc.session_id = $${queryParams.length + 1}`);
        queryParams.push(params.session_id);
      }

      const cartSql = `
          SELECT ${this.cartSelectFields}
          FROM shopping_carts sc
          LEFT JOIN currencies c ON sc.currency_id = c.id
          WHERE ${conditions.join(' OR ')}
          AND sc.expires_at > CURRENT_TIMESTAMP 
          ORDER BY sc.updated_at DESC LIMIT 1
        `;

      const result = await SelectQuery(cartSql, queryParams);

      if (result && result.length > 0) {
        return result[0];
      }

      // Create new cart
      const currencyId = params.currency_id || 3;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const insertSql = `
          INSERT INTO shopping_carts (user_id, session_id, currency_id, expires_at)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

      const insertResult = await InsertQuery(insertSql, [
        params.user_id || null,
        params.session_id || null,
        currencyId,
        expiresAt
      ]);

      if (!insertResult || insertResult?.rows?.length === 0) {
        throw new Error('Failed to create cart');
      }

      const newCart = insertResult[0];

      // Get complete cart details with currency
      const newCartSql = `
          SELECT ${this.cartSelectFields}
          FROM shopping_carts sc
          LEFT JOIN currencies c ON sc.currency_id = c.id
          WHERE sc.id = $1
        `;

      const newCartResult = await SelectQuery(newCartSql, [newCart.id]);
      return newCartResult[0];
    } catch (error) {
      console.error('Error in findOrCreateCart:', error);
      throw error;
    }
  }

  private async getCartWithItems(cartId: number, client?: PoolClient): Promise<CartResponse> {
    try {
      // Get cart details
      const cartSql = `
        SELECT ${this.cartSelectFields}
        FROM shopping_carts sc
        LEFT JOIN currencies c ON sc.currency_id = c.id
        WHERE sc.id = $1
      `;

      const cartResult = await SelectQuery(cartSql, [cartId]);
      const cart = cartResult[0];

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Get cart items
      const itemsSql = `
        SELECT ${this.cartItemSelectFields}
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        LEFT JOIN product_variant_combinations pvc ON ci.combination_id = pvc.id
        WHERE ci.cart_id = $1
        ORDER BY ci.created_at
      `;

      const itemsResult = await SelectQuery(itemsSql, [cartId]);
      const items: any = itemsResult || [];

      // Calculate summary
      const summary = this.calculateSummary(items);
      //@ts-ignore
      return {
        ...cart, // This spreads all required CartResponse fields (id, currency_id, etc.)
        items: items.map(item => {
          // Calculate for each item inside the map function
          const effectiveComparePrice = item.variant_compare_price || item.compare_price;

          // Calculate discount amount for this item
          let discountAmount = 0;
          if (effectiveComparePrice && item.unit_price < effectiveComparePrice) {
            discountAmount = effectiveComparePrice - item.unit_price;
          }

          return {
            ...item,
            is_available: (item.variant_stock || item.stock_quantity) > 0,
            stock_available: item.variant_stock || item.stock_quantity,
            max_quantity: Math.min(
              item.max_order_quantity || 999,
              item.variant_stock || item.stock_quantity
            ),
            effective_compare_price: effectiveComparePrice,
            discount_amount: discountAmount,
            discount_percentage: effectiveComparePrice && effectiveComparePrice > 0
              ? Math.round(((effectiveComparePrice - item.unit_price) / effectiveComparePrice) * 100)
              : 0
          };
        }),
        summary,
        applied_coupons: []
      };
    } catch (error) {
      console.error('Error in getCartWithItems:', error);
      throw error;
    }
  }

  private calculateSummary(items: any[]): any {
    const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Correct subtotal calculation: multiply price by quantity for each item
    const subtotal = items.reduce((sum, item) => {
      const price = parseFloat(item.variant_compare_price || item.compare_price || 0);
      return sum + (price * item.quantity);
    }, 0);

    // Correct total discount amount calculation:
    let totalDiscount = 0;
    items.forEach(item => {
      const effectiveComparePrice = parseFloat(item.variant_compare_price || item.compare_price || 0);
      const unitPrice = parseFloat(item.unit_price || 0);

      if (effectiveComparePrice > unitPrice) {
        const discountPerItem = effectiveComparePrice - unitPrice;
        totalDiscount += discountPerItem * item.quantity;
      }
    });

    return {
      items_count: itemsCount,
      subtotal: Number(subtotal.toFixed(2)),
      tax_amount: 0,
      shipping_amount: 0,
      discount_amount: Number(totalDiscount.toFixed(2)),
      total: Number((subtotal - totalDiscount).toFixed(2))
    };
  }

  private async getProductPricing(
    productId: number,
    combinationId: number | null,
    currencyId: number,
    client?: PoolClient
  ): Promise<any> {
    try {
      let sql = `
          SELECT 
            p.price, p.compare_price, p.stock_quantity, p.max_order_quantity, p.min_order_quantity,
            CASE WHEN p.stock_quantity > 0 THEN true ELSE false END as is_available
          FROM products p
          WHERE p.id = $1
        `;

      const params = [productId];

      if (combinationId) {
        sql = `
            SELECT 
              COALESCE(pvc.price, p.price) as price,
              COALESCE(pvc.compare_price, p.compare_price) as compare_price,
              COALESCE(pvc.stock_quantity, p.stock_quantity) as stock_quantity,
              p.max_order_quantity, p.min_order_quantity,
              CASE WHEN COALESCE(pvc.stock_quantity, p.stock_quantity) > 0 THEN true ELSE false END as is_available
            FROM products p
            LEFT JOIN product_variant_combinations pvc ON p.id = pvc.product_id AND pvc.id = $2
            WHERE p.id = $1
          `;
        params.splice(1, 0, combinationId);
      }

      const result = await SelectQuery(sql, params);

      if (!result || result.length === 0) {
        throw new Error('Product not found');
      }

      const productData = result[0];

      // Calculate discount amount
      let discountAmount = 0;
      if (productData.compare_price && productData.price < productData.compare_price) {
        discountAmount = productData.compare_price - productData.price;
      }

      return {
        ...productData,
        discount_amount: discountAmount,
        max_quantity: Math.min(productData.max_order_quantity || 999, productData.stock_quantity || 0)
      };
    } catch (error) {
      console.error('Error in getProductPricing:', error);
      throw error;
    }
  }
}


// // v4

// import {
//   SelectQuery,
//   InsertQuery,
//   withTransaction,
// } from 'src/db/postgres.client';
// import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
// import { Messages } from 'src/common/utils/messages';
// import { PoolClient } from 'pg';
// import { CartResponse, AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

// export class CartRepository {
//   private readonly cartSelectFields = `
//     sc.id, sc.user_id, sc.session_id, sc.currency_id, sc.language_id,
//     sc.expires_at, sc.created_at, sc.updated_at,
//     c.code as currency_code, c.symbol as currency_symbol
//   `;

//   private readonly cartItemSelectFields = `
//     ci.id, ci.cart_id, ci.product_id, ci.combination_id, ci.quantity,
//     ci.unit_price, ci.total_price, ci.added_at, ci.created_at, ci.updated_at,
//     p.name as product_name, p.slug as product_slug, p.sku, p.compare_price,
//     p.featured_image_url as product_image, p.stock_quantity,
//     p.max_order_quantity, p.min_order_quantity, p.sold_individually,
//     p.tax_id, p.price as base_price,
//     pvc.sku as variant_sku, pvc.stock_quantity as variant_stock,
//     pvc.compare_price as variant_compare_price, pvc.dimensions as variant_dimensions,
//     pvc.price as variant_price,
//     t.id as tax_id, t.name as tax_name, t.code as tax_code, t.rate as tax_rate,
//     t.type as tax_type, t.is_inclusive as tax_is_inclusive,
//     t.threshold_less, t.threshold_greater, t.rate_less, t.rate_greater,
//     t.is_flexible as tax_is_flexible
//   `;

//   async getCart(params: {
//     user_id?: number;
//     session_id?: string;
//     currency_id?: number;
//   }): Promise<ApiResponseFormat<CartResponse>> {
//     try {
//       // Validate that we have at least one identifier
//       if (!params.user_id && !params.session_id) {
//         return ApiResponse.badRequest('Either user_id or session_id is required');
//       }

//       const cart = await this.findOrCreateCart(params);
//       if (!cart) {
//         return ApiResponse.notFound('Cart not found');
//       }

//       const cartWithItems = await this.getCartWithItems(cart.id);
//       return ApiResponse.success(cartWithItems);
//     } catch (error) {
//       console.error('Get cart error:', error);
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async addToCart(
//     addToCartDto: AddToCartDto,
//     userId?: number,
//     sessionId?: string
//   ): Promise<ApiResponseFormat<CartResponse>> {
//     try {
//       // Validate inputs
//       if (!userId && !sessionId) {
//         return ApiResponse.badRequest('Either user_id or session_id is required');
//       }

//       return await withTransaction(async (client: PoolClient) => {
//         // Find or create cart
//         const cart = await this.findOrCreateCart({
//           user_id: userId,
//           session_id: sessionId,
//           currency_id: addToCartDto.currency_id || 3
//         }, client);

//         // Handle combination_id properly with explicit type casting
//         let existingItemSql: string;
//         let queryParams: any[];

//         if (addToCartDto.combination_id === null || addToCartDto.combination_id === undefined) {
//           existingItemSql = `
//             SELECT id, quantity, unit_price FROM cart_items
//             WHERE cart_id = $1 AND product_id = $2 AND combination_id IS NULL
//           `;
//           queryParams = [cart.id, addToCartDto.product_id];
//         } else {
//           existingItemSql = `
//             SELECT id, quantity, unit_price FROM cart_items
//             WHERE cart_id = $1 AND product_id = $2 AND combination_id = $3
//           `;
//           queryParams = [cart.id, addToCartDto.product_id, addToCartDto.combination_id];
//         }

//         const existingItemResult = await client.query(existingItemSql, queryParams);

//         // Get product details and pricing
//         const productDetails = await this.getProductPricing(
//           addToCartDto.product_id,
//           addToCartDto.combination_id,
//           cart.currency_id,
//           client
//         );

//         if (!productDetails.is_available) {
//           throw new Error('Product is not available');
//         }

//         const unitPrice = addToCartDto.unit_price || productDetails.price;

//         if (existingItemResult.rows.length > 0) {
//           // Update existing item
//           const existingItem = existingItemResult.rows[0];
//           const newQuantity = existingItem.quantity + addToCartDto.quantity;

//           if (newQuantity > productDetails.max_quantity) {
//             throw new Error(`Maximum quantity available: ${productDetails.max_quantity}`);
//           }

//           const newTotalPrice = unitPrice * newQuantity;

//           const updateSql = `
//             UPDATE cart_items
//             SET quantity = $1, unit_price = $2, total_price = $3, updated_at = CURRENT_TIMESTAMP
//             WHERE id = $4
//           `;
//           await client.query(updateSql, [newQuantity, unitPrice, newTotalPrice, existingItem.id]);
//         } else {
//           // Insert new item
//           if (addToCartDto.quantity > productDetails.max_quantity) {
//             throw new Error(`Maximum quantity available: ${productDetails.max_quantity}`);
//           }

//           const totalPrice = unitPrice * addToCartDto.quantity;

//           const insertSql = `
//             INSERT INTO cart_items (cart_id, product_id, combination_id, quantity, unit_price, total_price)
//             VALUES ($1, $2, $3, $4, $5, $6)
//           `;
//           await client.query(insertSql, [
//             cart.id,
//             addToCartDto.product_id,
//             addToCartDto.combination_id || null, // Explicitly convert undefined to null
//             addToCartDto.quantity,
//             unitPrice,
//             totalPrice
//           ]);
//         }

//         // Update cart timestamp
//         await client.query(
//           'UPDATE shopping_carts SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
//           [cart.id]
//         );

//         const updatedCart = await this.getCartWithItems(cart.id, client);
//         return ApiResponse.success(updatedCart);
//       });
//     } catch (error) {
//       console.error('Add to cart error:', error);
//       return ApiResponse.error(error.message || Messages.INTERNAL_SERVER_ERROR, 400);
//     }
//   }

//   async updateCartItem(
//     itemId: number,
//     updateDto: UpdateCartItemDto,
//     userId?: number,
//     sessionId?: any
//   ): Promise<ApiResponseFormat<CartResponse>> {
//     try {
//       return await withTransaction(async (client: PoolClient) => {
//         // Proper condition handling for user/session validation
//         let conditions = [];
//         let params = [itemId];

//         if (userId) {
//           conditions.push('sc.user_id = $2');
//           params.push(userId);
//         }

//         if (sessionId) {
//           conditions.push(`sc.session_id = $${params.length + 1}`);
//           params.push(sessionId);
//         }

//         if (conditions.length === 0) {
//           throw new Error('Either user_id or session_id is required');
//         }

//         const itemSql = `
//           SELECT ci.*, sc.id as cart_id, sc.currency_id
//           FROM cart_items ci
//           JOIN shopping_carts sc ON ci.cart_id = sc.id
//           WHERE ci.id = $1 AND (${conditions.join(' OR ')})
//         `;

//         const itemResult = await client.query(itemSql, params);

//         if (itemResult.rows.length === 0) {
//           throw new Error('Cart item not found');
//         }

//         const item = itemResult.rows[0];

//         // Get product availability
//         const productDetails = await this.getProductPricing(
//           item.product_id,
//           item.combination_id,
//           item.currency_id,
//           client
//         );

//         if (updateDto.quantity > productDetails.max_quantity) {
//           throw new Error(`Maximum quantity available: ${productDetails.max_quantity}`);
//         }

//         if (updateDto.quantity <= 0) {
//           throw new Error('Quantity must be greater than 0');
//         }

//         const totalPrice = item.unit_price * updateDto.quantity;

//         // Update item
//         const updateSql = `
//           UPDATE cart_items
//           SET quantity = $1, total_price = $2, updated_at = CURRENT_TIMESTAMP
//           WHERE id = $3
//         `;
//         await client.query(updateSql, [updateDto.quantity, totalPrice, itemId]);

//         const updatedCart = await this.getCartWithItems(item.cart_id, client);
//         return ApiResponse.success(updatedCart);
//       });
//     } catch (error) {
//       console.error('Update cart item error:', error);
//       return ApiResponse.error(error.message || Messages.INTERNAL_SERVER_ERROR, 400);
//     }
//   }

//   async removeCartItem(
//     itemId: number,
//     userId?: number,
//     sessionId?: any
//   ): Promise<ApiResponseFormat<CartResponse>> {
//     try {
//       return await withTransaction(async (client: PoolClient) => {
//         // Proper condition handling for user/session validation
//         let conditions = [];
//         let params = [itemId];

//         if (userId) {
//           conditions.push('sc.user_id = $2');
//           params.push(userId);
//         }

//         if (sessionId) {
//           conditions.push(`sc.session_id = $${params.length + 1}`);
//           params.push(sessionId);
//         }

//         if (conditions.length === 0) {
//           throw new Error('Either user_id or session_id is required');
//         }

//         const itemSql = `
//           SELECT sc.id as cart_id
//           FROM cart_items ci
//           JOIN shopping_carts sc ON ci.cart_id = sc.id
//           WHERE ci.id = $1 AND (${conditions.join(' OR ')})
//         `;

//         const itemResult = await client.query(itemSql, params);

//         if (itemResult.rows.length === 0) {
//           throw new Error('Cart item not found');
//         }

//         const cartId = itemResult.rows[0].cart_id;

//         // Delete item
//         await client.query('DELETE FROM cart_items WHERE id = $1', [itemId]);

//         const updatedCart: any = await this.getCartWithItems(cartId, client);
//         return ApiResponse.success(updatedCart);
//       });
//     } catch (error) {
//       console.error('Remove cart item error:', error);
//       return ApiResponse.error(error.message || Messages.INTERNAL_SERVER_ERROR, 400);
//     }
//   }

//   async clearCart(userId?: number, sessionId?: string): Promise<ApiResponseFormat<any>> {
//     try {
//       if (!userId && !sessionId) {
//         return ApiResponse.badRequest('Either user_id or session_id is required');
//       }

//       const conditions = [];
//       const params = [];

//       if (userId) {
//         conditions.push(`sc.user_id = $${params.length + 1}`);
//         params.push(userId);
//       }

//       if (sessionId) {
//         conditions.push(`sc.session_id = $${params.length + 1}`);
//         params.push(sessionId);
//       }

//       const cartSql = `
//         SELECT sc.id FROM shopping_carts sc
//         WHERE ${conditions.join(' OR ')}
//       `;

//       const cartResult = await SelectQuery(cartSql, params);

//       if (cartResult.length === 0) {
//         return ApiResponse.notFound('Cart not found');
//       }

//       const cartId = cartResult[0].id;
//       await SelectQuery('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

//       return ApiResponse.success({ message: 'Cart cleared successfully' });
//     } catch (error) {
//       console.error('Clear cart error:', error);
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async getCartCount(userId?: number, sessionId?: string): Promise<ApiResponseFormat<{ count: number }>> {
//     try {
//       if (!userId && !sessionId) {
//         return ApiResponse.success({ count: 0 });
//       }

//       const conditions = [];
//       const params = [];

//       if (userId) {
//         conditions.push(`sc.user_id = $${params.length + 1}`);
//         params.push(userId);
//       }

//       if (sessionId) {
//         conditions.push(`sc.session_id = $${params.length + 1}`);
//         params.push(sessionId);
//       }

//       const countSql = `
//         SELECT COALESCE(SUM(ci.quantity), 0)::integer as count
//         FROM shopping_carts sc
//         LEFT JOIN cart_items ci ON sc.id = ci.cart_id
//         WHERE ${conditions.join(' OR ')}
//         AND sc.expires_at > CURRENT_TIMESTAMP
//       `;

//       const result = await SelectQuery(countSql, params);
//       const count = result[0]?.count || 0;

//       return ApiResponse.success({ count });
//     } catch (error) {
//       console.error('Get cart count error:', error);
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   // Helper Methods
//   private async findOrCreateCart(
//     params: { user_id?: number; session_id?: string; currency_id?: number },
//     client?: PoolClient
//   ): Promise<any> {
//     try {
//       // Validate that we have at least one identifier
//       if (!params.user_id && !params.session_id) {
//         throw new Error('Either user_id or session_id is required');
//       }

//       const conditions = [];
//       const queryParams = [];

//       if (params.user_id) {
//         conditions.push(`sc.user_id = $${queryParams.length + 1}`);
//         queryParams.push(params.user_id);
//       }

//       if (params.session_id) {
//         conditions.push(`sc.session_id = $${queryParams.length + 1}`);
//         queryParams.push(params.session_id);
//       }

//       const cartSql = `
//         SELECT ${this.cartSelectFields}
//         FROM shopping_carts sc
//         LEFT JOIN currencies c ON sc.currency_id = c.id
//         WHERE ${conditions.join(' OR ')}
//         AND sc.expires_at > CURRENT_TIMESTAMP
//         ORDER BY sc.updated_at DESC LIMIT 1
//       `;

//       const result = await SelectQuery(cartSql, queryParams);

//       if (result && result.length > 0) {
//         return result[0];
//       }

//       // Create new cart
//       const currencyId = params.currency_id || 3;
//       const expiresAt = new Date();
//       expiresAt.setDate(expiresAt.getDate() + 30);

//       const insertSql = `
//         INSERT INTO shopping_carts (user_id, session_id, currency_id, expires_at)
//         VALUES ($1, $2, $3, $4)
//         RETURNING *
//       `;

//       const insertResult = await InsertQuery(insertSql, [
//         params.user_id || null,
//         params.session_id || null,
//         currencyId,
//         expiresAt
//       ]);

//       if (!insertResult || insertResult?.rows?.length === 0) {
//         throw new Error('Failed to create cart');
//       }

//       const newCart = insertResult[0];

//       // Get complete cart details with currency
//       const newCartSql = `
//         SELECT ${this.cartSelectFields}
//         FROM shopping_carts sc
//         LEFT JOIN currencies c ON sc.currency_id = c.id
//         WHERE sc.id = $1
//       `;

//       const newCartResult = await SelectQuery(newCartSql, [newCart.id]);
//       return newCartResult[0];
//     } catch (error) {
//       console.error('Error in findOrCreateCart:', error);
//       throw error;
//     }
//   }

//   private async getCartWithItems(cartId: number, client?: PoolClient): Promise<CartResponse> {
//     try {
//       // Get cart details
//       const cartSql = `
//         SELECT ${this.cartSelectFields}
//         FROM shopping_carts sc
//         LEFT JOIN currencies c ON sc.currency_id = c.id
//         WHERE sc.id = $1
//       `;

//       const cartResult = await SelectQuery(cartSql, [cartId]);
//       const cart = cartResult[0];

//       if (!cart) {
//         throw new Error('Cart not found');
//       }

//       // Get cart items with tax information
//       const itemsSql = `
//         SELECT ${this.cartItemSelectFields}
//         FROM cart_items ci
//         JOIN products p ON ci.product_id = p.id
//         LEFT JOIN product_variant_combinations pvc ON ci.combination_id = pvc.id
//         LEFT JOIN taxes t ON p.tax_id = t.id AND t.is_active = true
//         WHERE ci.cart_id = $1
//         ORDER BY ci.created_at
//       `;

//       const itemsResult = await SelectQuery(itemsSql, [cartId]);
//       const items: any = itemsResult || [];

//       // Calculate summary with tax
//       const summary = this.calculateSummaryWithTax(items);

//       //@ts-ignore
//       return {
//         ...cart,
//         items: items.map(item => {
//           const effectivePrice = item.variant_price || item.base_price || item.unit_price;
//           const effectiveComparePrice = item.variant_compare_price || item.compare_price;

//           // Calculate tax for this item
//           const taxCalculation = this.calculateItemTax(item, effectivePrice);

//           // Calculate discount amount for this item
//           let discountAmount = 0;
//           if (effectiveComparePrice && effectivePrice < effectiveComparePrice) {
//             discountAmount = effectiveComparePrice - effectivePrice;
//           }

//           return {
//             ...item,
//             is_available: (item.variant_stock || item.stock_quantity) > 0,
//             stock_available: item.variant_stock || item.stock_quantity,
//             max_quantity: Math.min(
//               item.max_order_quantity || 999,
//               item.variant_stock || item.stock_quantity
//             ),
//             effective_price: effectivePrice,
//             effective_compare_price: effectiveComparePrice,
//             discount_amount: discountAmount,
//             discount_percentage: effectiveComparePrice && effectiveComparePrice > 0
//               ? Math.round(((effectiveComparePrice - effectivePrice) / effectiveComparePrice) * 100)
//               : 0,
//             tax_info: {
//               tax_id: item.tax_id,
//               tax_name: item.tax_name,
//               tax_code: item.tax_code,
//               tax_rate: item.tax_rate,
//               tax_type: item.tax_type,
//               is_inclusive: item.tax_is_inclusive,
//               tax_amount_per_item: taxCalculation.taxAmount,
//               taxable_amount: taxCalculation.taxableAmount
//             }
//           };
//         }),
//         summary,
//         applied_coupons: []
//       };
//     } catch (error) {
//       console.error('Error in getCartWithItems:', error);
//       throw error;
//     }
//   }

//   /**
//    * Fixed tax calculation method that handles all scenarios properly
//    */
//   private calculateItemTax(item: any, effectivePrice: number): { taxAmount: number; taxableAmount: number } {
//     if (!item.tax_id || !item.tax_rate) {
//       return { taxAmount: 0, taxableAmount: effectivePrice };
//     }

//     const baseTaxRate = parseFloat(item.tax_rate) / 100;
//     let applicableTaxRate = baseTaxRate;

//     // Determine applicable tax rate for flexible taxes
//     if (item.tax_is_flexible) {
//       const totalItemPrice = effectivePrice * item.quantity;

//       if (item.threshold_greater && totalItemPrice > parseFloat(item.threshold_greater || '0')) {
//         applicableTaxRate = item.rate_greater ? parseFloat(item.rate_greater) / 100 : baseTaxRate;
//       } else if (item.threshold_less && totalItemPrice < parseFloat(item.threshold_less || '0')) {
//         applicableTaxRate = item.rate_less ? parseFloat(item.rate_less) / 100 : baseTaxRate;
//       }
//     }

//     let taxAmount = 0;
//     let taxableAmount = effectivePrice;

//     if (item.tax_is_inclusive) {
//       // For inclusive tax: price includes tax
//       // Formula: taxAmount = price * rate / (1 + rate)
//       // Formula: taxableAmount = price - taxAmount
//       taxAmount = (effectivePrice * applicableTaxRate) / (1 + applicableTaxRate);
//       taxableAmount = effectivePrice - taxAmount;
//     } else {
//       // For exclusive tax: price doesn't include tax
//       // Formula: taxableAmount = price (unchanged)
//       // Formula: taxAmount = price * rate
//       taxableAmount = effectivePrice;
//       taxAmount = effectivePrice * applicableTaxRate;
//     }

//     return {
//       taxAmount: Number(taxAmount),
//       taxableAmount: Number(taxableAmount)
//     };
//   }

//   /**
//    * Completely rewritten summary calculation with proper tax handling
//    */
//   private calculateSummaryWithTax(items: any[]): any {
//     const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

//     // Initialize all totals
//     let subtotalBeforeTax = 0;    // Always the taxable amount
//     let totalTaxAmount = 0;       // Sum of all tax amounts
//     let totalDiscountAmount = 0;  // Sum of all discounts
//     let grossTotal = 0;           // Total including everything

//     items.forEach(item => {
//       const effectivePrice = item.variant_price || item.base_price || item.unit_price;
//       const effectiveComparePrice = item.variant_compare_price || item.compare_price;
//       const quantity = item.quantity;

//       // Get tax calculation for this item
//       const taxCalculation = this.calculateItemTax(item, effectivePrice);

//       // Calculate totals for this item
//       const itemTaxableTotal = taxCalculation.taxableAmount * quantity;
//       const itemTaxTotal = taxCalculation.taxAmount * quantity;
//       const itemGrossTotal = effectivePrice * quantity; // What customer actually pays per item

//       // Add to running totals
//       subtotalBeforeTax += itemTaxableTotal;
//       totalTaxAmount += itemTaxTotal;
//       grossTotal += itemGrossTotal;
//       // Calculate discount on the original price (before any tax considerations)
//       if (effectiveComparePrice && effectiveComparePrice > effectivePrice) {
//         const discountPerItem = effectiveComparePrice - effectivePrice;
//         totalDiscountAmount += discountPerItem * quantity;
//       }
//     });

//     // The final total should be what the customer actually pays
//     const finalTotal = grossTotal - totalDiscountAmount;

//     // Alternative calculation for verification (should match finalTotal):
//     // const calculatedTotal = subtotalBeforeTax + totalTaxAmount - totalDiscountAmount;

//     return {
//       items_count: itemsCount,
//       subtotal: Number(parseFloat(subtotalBeforeTax.toFixed(2))),      // Always excluding tax
//       tax_amount: Number(parseFloat(totalTaxAmount.toFixed(2))),        // Total tax
//       shipping_amount: 0,                                               // No shipping in this implementation
//       discount_amount: Number(parseFloat(finalTotal.toFixed(2))),            // Final amount customer pays
//       total: Number(parseFloat(totalDiscountAmount.toFixed(2))),
//     };
//   }

//   private async getProductPricing(
//     productId: number,
//     combinationId: number | null,
//     currencyId: number,
//     client?: PoolClient
//   ): Promise<any> {
//     try {
//       let sql = `
//         SELECT
//           p.price, p.compare_price, p.stock_quantity, p.max_order_quantity, p.min_order_quantity,
//           p.tax_id,
//           CASE WHEN p.stock_quantity > 0 THEN true ELSE false END as is_available
//         FROM products p
//         WHERE p.id = $1
//       `;

//       const params = [productId];

//       if (combinationId) {
//         sql = `
//           SELECT
//             COALESCE(pvc.price, p.price) as price,
//             COALESCE(pvc.compare_price, p.compare_price) as compare_price,
//             COALESCE(pvc.stock_quantity, p.stock_quantity) as stock_quantity,
//             p.max_order_quantity, p.min_order_quantity, p.tax_id,
//             CASE WHEN COALESCE(pvc.stock_quantity, p.stock_quantity) > 0 THEN true ELSE false END as is_available
//           FROM products p
//           LEFT JOIN product_variant_combinations pvc ON p.id = pvc.product_id AND pvc.id = $2
//           WHERE p.id = $1
//         `;
//         params.splice(1, 0, combinationId);
//       }

//       const result = await SelectQuery(sql, params);

//       if (!result || result.length === 0) {
//         throw new Error('Product not found');
//       }

//       const productData = result[0];

//       // Calculate discount amount
//       let discountAmount = 0;
//       if (productData.compare_price && productData.price < productData.compare_price) {
//         discountAmount = productData.compare_price - productData.price;
//       }

//       return {
//         ...productData,
//         discount_amount: discountAmount,
//         max_quantity: Math.min(productData.max_order_quantity || 999, productData.stock_quantity || 0)
//       };
//     } catch (error) {
//       console.error('Error in getProductPricing:', error);
//       throw error;
//     }
//   }
// } 