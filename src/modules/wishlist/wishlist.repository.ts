import {
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  withTransaction,
} from 'src/db/postgres.client';
import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import { PoolClient } from 'pg';
import { buildPaginationMeta } from 'src/common/utils/api-helpers';
import { WishlistQueryDto, WishlistResponse, CreateWishlistDto, UpdateWishlistDto, AddToWishlistDto } from './dto/wishlist.dto';

export class WishlistRepository {
  private readonly wishlistSelectFields = `
    w.id, w.user_id, w.name, w.is_public, w.is_default,
    w.created_at, w.updated_at,
    COUNT(wi.id) as items_count
  `;

  private readonly wishlistItemSelectFields = `
    wi.id, wi.product_id, wi.combination_id, wi.added_at,
    p.name as product_name, p.slug as product_slug, p.sku,
    p.featured_image_url as product_image, p.price as product_price,
    p.compare_price as product_compare_price, p.stock_quantity,
    pvc.price as variant_price, pvc.compare_price as variant_compare_price,
    pvc.stock_quantity as variant_stock_quantity,
    CASE 
      WHEN COALESCE(pvc.stock_quantity, p.stock_quantity) > 0 THEN true 
      ELSE false 
    END as is_available
  `;

  async getUserWishlists(
    userId: number,
    query: WishlistQueryDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      const { page = 1, per_page = 20, search } = query;
      const offset = (page - 1) * per_page;

      let whereClause = 'w.user_id = $1';
      const params = [userId];

      if (search) {
        whereClause += ` AND w.name ILIKE $${params.length + 1}`;
        //@ts-ignore
        params.push(`%${search}%`);
      }

      const sql = `
        SELECT ${this.wishlistSelectFields}
        FROM wishlists w
        LEFT JOIN wishlist_items wi ON w.id = wi.wishlist_id
        WHERE ${whereClause}
        GROUP BY w.id, w.user_id, w.name, w.is_public, w.is_default, w.created_at, w.updated_at
        ORDER BY w.is_default DESC, w.updated_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const countSql = `
        SELECT COUNT(*) as total
        FROM wishlists w
        WHERE ${whereClause}
      `;

      const [wishlists, countResult] = await Promise.all([
        SelectQuery(sql, [...params, per_page, offset]),
        SelectQuery(countSql, params)
      ]);

      const total = countResult[0]?.total || 0;
      const meta = buildPaginationMeta(total, page, per_page);
      //@ts-ignore
      return ApiResponse.success({ meta, wishlists });
    } catch (error) {
      console.error('Get user wishlists error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }
  async checkMultipleWishlistStatus(
    userId: number,
    productIds: number[]
  ): Promise<ApiResponseFormat<any>> {
    try {
      if (!productIds || productIds.length === 0) {
        return ApiResponse.success([]);
      }

      // Create placeholders for the product IDs
      const placeholders = productIds.map((_, index) => `$${index + 2}`).join(',');

      const sql = `
      SELECT product_id, true as is_wishlisted
      FROM wishlist_items wi
      JOIN wishlists w ON wi.wishlist_id = w.id
      WHERE w.user_id = $1 
      AND wi.product_id IN (${placeholders})
      AND wi.is_active = true
      AND w.is_active = true
    `;

      const params = [userId, ...productIds];
      const wishlistItems = await SelectQuery(sql, params);

      // Create a map of product statuses
      const statusMap = {};

      // Initialize all products as not wishlisted
      productIds.forEach(productId => {
        statusMap[productId] = false;
      });

      // Update status for wishlisted products
      wishlistItems.forEach(item => {
        statusMap[item.product_id] = true;
      });

      // Convert to array format
      const statusArray = productIds.map(productId => ({
        product_id: productId,
        is_wishlisted: statusMap[productId]
      }));

      return ApiResponse.success(statusArray);

    } catch (error) {
      console.error('Error checking multiple wishlist status:', error);
      return ApiResponse.error('Failed to check wishlist status', 500);
    }
  }
  async getWishlistById(
    wishlistId: number,
    userId: number
  ): Promise<ApiResponseFormat<WishlistResponse>> {
    try {
      // Get wishlist details
      const wishlistSql = `
        SELECT ${this.wishlistSelectFields}
        FROM wishlists w
        LEFT JOIN wishlist_items wi ON w.id = wi.wishlist_id
        WHERE w.id = $1 AND (w.user_id = $2 OR w.is_public = true)
        GROUP BY w.id, w.user_id, w.name, w.is_public, w.is_default, w.created_at, w.updated_at
      `;

      const wishlistResult = await SelectQuery(wishlistSql, [wishlistId, userId]);

      if (wishlistResult.length === 0) {
        return ApiResponse.notFound('Wishlist not found');
      }

      const wishlist = wishlistResult[0];

      // Get wishlist items
      const itemsSql = `
        SELECT ${this.wishlistItemSelectFields}
        FROM wishlist_items wi
        JOIN products p ON wi.product_id = p.id
        LEFT JOIN product_variant_combinations pvc ON wi.combination_id = pvc.id
        WHERE wi.wishlist_id = $1
        ORDER BY wi.added_at DESC
      `;

      const items: any = await SelectQuery(itemsSql, [wishlistId]);
      //@ts-ignore
      const wishlistWithItems: WishlistResponse = {
        ...wishlist,
        items: items.map(item => ({
          ...item,
          product_price: item.variant_price || item.product_price,
          product_compare_price: item.variant_compare_price || item.product_compare_price,
          stock_quantity: item.variant_stock_quantity || item.stock_quantity
        }))
      };

      return ApiResponse.success(wishlistWithItems);
    } catch (error) {
      console.error('Get wishlist by ID error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async createWishlist(
    userId: number,
    createWishlistDto: CreateWishlistDto
  ): Promise<ApiResponseFormat<WishlistResponse>> {
    try {
      return await withTransaction(async (client: PoolClient) => {
        // If this is set as default, unset other defaults
        if (createWishlistDto.is_default) {
          await client.query(
            'UPDATE wishlists SET is_default = false WHERE user_id = $1',
            [userId]
          );
        }

        const insertSql = `
          INSERT INTO wishlists (user_id, name, is_public, is_default)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `;

        const result = await client.query(insertSql, [
          userId,
          createWishlistDto.name,
          createWishlistDto.is_public || false,
          createWishlistDto.is_default || false
        ]);

        const wishlistId = result.rows[0].id;
        const wishlist = await this.getWishlistById(wishlistId, userId);

        return wishlist;
      });
    } catch (error) {
      console.error('Create wishlist error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async updateWishlist(
    wishlistId: number,
    userId: number,
    updateWishlistDto: UpdateWishlistDto
  ): Promise<ApiResponseFormat<WishlistResponse>> {
    try {
      return await withTransaction(async (client: PoolClient) => {
        // Verify ownership
        const verifyResult = await client.query(
          'SELECT id FROM wishlists WHERE id = $1 AND user_id = $2',
          [wishlistId, userId]
        );

        if (verifyResult.rows.length === 0) {
          throw new Error('Wishlist not found or access denied');
        }

        const updateSql = `
          UPDATE wishlists 
          SET name = COALESCE($1, name), 
              is_public = COALESCE($2, is_public),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3 AND user_id = $4
        `;

        await client.query(updateSql, [
          updateWishlistDto.name,
          updateWishlistDto.is_public,
          wishlistId,
          userId
        ]);

        const updatedWishlist = await this.getWishlistById(wishlistId, userId);
        return updatedWishlist;
      });
    } catch (error) {
      console.error('Update wishlist error:', error);
      return ApiResponse.error(error.message || Messages.INTERNAL_SERVER_ERROR, 400);
    }
  }

  async deleteWishlist(
    wishlistId: number,
    userId: number
  ): Promise<ApiResponseFormat<any>> {
    try {
      const deleteSql = `
        DELETE FROM wishlists 
        WHERE id = $1 AND user_id = $2 AND is_default = false
      `;

      const result = await UpdateQuery(deleteSql, [wishlistId, userId]);

      if (result.rowCount === 0) {
        return ApiResponse.error('Wishlist not found or cannot delete default wishlist', 400);
      }

      return ApiResponse.success({ message: 'Wishlist deleted successfully' });
    } catch (error) {
      console.error('Delete wishlist error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async addToWishlist(
    userId: number,
    addToWishlistDto: AddToWishlistDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      return await withTransaction(async (client: PoolClient) => {
        let wishlistId = addToWishlistDto.wishlist_id;

        // If no wishlist specified, use default or create one
        if (!wishlistId) {
          const defaultWishlistSql = `
            SELECT id FROM wishlists 
            WHERE user_id = $1 AND is_default = true
          `;
          const defaultResult = await client.query(defaultWishlistSql, [userId]);
          console.log('✌️defaultResult --->', defaultResult);

          if (defaultResult.rows.length === 0) {
            // Create default wishlist
            //TODO check
            const createResult = await client.query(
              'INSERT INTO wishlists (user_id, name, is_default) VALUES ($1, $2, $3) RETURNING id',
              [userId, 'My Wishlist', true]
            );
            wishlistId = createResult.rows[0].id;
          } else {
            wishlistId = defaultResult.rows[0]?.id;
          }
        }

        // Check if item already exists
        const existingSql = `
          SELECT id FROM wishlist_items 
          WHERE wishlist_id = $1 AND product_id = $2 AND combination_id IS NOT DISTINCT FROM $3
        `;
        const existing = await client.query(existingSql, [
          wishlistId,
          addToWishlistDto.product_id,
          addToWishlistDto.combination_id
        ]);

        if (existing.rows.length > 0) {
          return ApiResponse.error('Item already in wishlist', 400);
        }

        // Add item to wishlist
        const insertSql = `
          INSERT INTO wishlist_items (wishlist_id, product_id, combination_id)
          VALUES ($1, $2, $3)
        `;

        await client.query(insertSql, [
          wishlistId,
          addToWishlistDto.product_id,
          addToWishlistDto.combination_id
        ]);

        return ApiResponse.success({
          message: 'Item added to wishlist successfully',
          is_wishlisted: true
        });
      });
    } catch (error) {
      console.error('Add to wishlist error:', error);
      return ApiResponse.error(error.message || Messages.INTERNAL_SERVER_ERROR, 400);
    }
  }

  async removeFromWishlist(
    itemId: number,
    userId: number
  ): Promise<ApiResponseFormat<any>> {
    try {
      const deleteSql = `
        DELETE FROM wishlist_items 
        WHERE id = $1 AND wishlist_id IN (
          SELECT id FROM wishlists WHERE user_id = $2
        )
      `;

      const result = await UpdateQuery(deleteSql, [itemId, userId]);

      if (result.rowCount === 0) {
        return ApiResponse.notFound('Wishlist item not found');
      }

      return ApiResponse.success({
        message: 'Item removed from wishlist successfully',
        is_wishlisted: false
      });
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async toggleWishlistItem(
    userId: number,
    toggleDto: { product_id: number; combination_id?: number }
  ): Promise<ApiResponseFormat<{ is_wishlisted: boolean }>> {
    try {
      return await withTransaction(async (client: PoolClient) => {
        // Get default wishlist
        let wishlistId: number;
        const defaultWishlistSql = `
          SELECT id FROM wishlists WHERE user_id = $1 AND is_default = true
        `;
        const defaultResult = await client.query(defaultWishlistSql, [userId]);

        if (defaultResult.rows.length === 0) {
          // Create default wishlist
          const createResult = await client.query(
            'INSERT INTO wishlists (user_id, name, is_default) VALUES ($1, $2, $3) RETURNING id',
            [userId, 'My Wishlist', true]
          );
          wishlistId = createResult.rows[0].id;
        } else {
          wishlistId = defaultResult.rows[0].id;
        }

        // Check if item exists
        const existingSql = `
          SELECT id FROM wishlist_items 
          WHERE wishlist_id = $1 AND product_id = $2 AND combination_id IS NOT DISTINCT FROM $3
        `;
        const existing = await client.query(existingSql, [
          wishlistId,
          toggleDto.product_id,
          toggleDto.combination_id
        ]);

        if (existing.rows.length > 0) {
          // Remove from wishlist
          await client.query(
            'DELETE FROM wishlist_items WHERE id = $1',
            [existing.rows[0].id]
          );
          return ApiResponse.success({ is_wishlisted: false });
        } else {
          // Add to wishlist
          await client.query(
            'INSERT INTO wishlist_items (wishlist_id, product_id, combination_id) VALUES ($1, $2, $3)',
            [wishlistId, toggleDto.product_id, toggleDto.combination_id]
          );
          return ApiResponse.success({ is_wishlisted: true });
        }
      });
    } catch (error) {
      console.error('Toggle wishlist item error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async checkWishlistStatus(
    userId: number,
    productId: number,
    combinationId?: number
  ): Promise<ApiResponseFormat<{ is_wishlisted: boolean }>> {
    try {
      const sql = `
        SELECT 1 FROM wishlist_items wi
        JOIN wishlists w ON wi.wishlist_id = w.id
        WHERE w.user_id = $1 AND wi.product_id = $2 AND wi.combination_id IS NOT DISTINCT FROM $3
        LIMIT 1
      `;

      const result = await SelectQuery(sql, [userId, productId, combinationId]);
      const isWishlisted = result.length > 0;

      return ApiResponse.success({ is_wishlisted: isWishlisted });
    } catch (error) {
      console.error('Check wishlist status error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async moveWishlistToCart(
    wishlistId: number,
    userId: number
  ): Promise<ApiResponseFormat<any>> {
    try {
      return await withTransaction(async (client: PoolClient) => {
        // Verify wishlist ownership
        const verifyResult = await client.query(
          'SELECT id FROM wishlists WHERE id = $1 AND user_id = $2',
          [wishlistId, userId]
        );

        if (verifyResult.rows.length === 0) {
          throw new Error('Wishlist not found or access denied');
        }

        // Get wishlist items
        const itemsSql = `
          SELECT product_id, combination_id FROM wishlist_items 
          WHERE wishlist_id = $1
        `;
        const items = await client.query(itemsSql, [wishlistId]);

        // Move items to cart (this would integrate with cart service)
        // For now, just return success

        // Clear wishlist
        await client.query('DELETE FROM wishlist_items WHERE wishlist_id = $1', [wishlistId]);

        return ApiResponse.success({
          message: 'Wishlist items moved to cart successfully',
          items_moved: items.rows.length
        });
      });
    } catch (error) {
      console.error('Move wishlist to cart error:', error);
      return ApiResponse.error(error.message || Messages.INTERNAL_SERVER_ERROR, 400);
    }
  }

  async getPublicWishlists(
    userId: number,
    query: WishlistQueryDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      const { page = 1, per_page = 20 } = query;
      const offset = (page - 1) * per_page;

      const sql = `
        SELECT ${this.wishlistSelectFields}
        FROM wishlists w
        LEFT JOIN wishlist_items wi ON w.id = wi.wishlist_id
        WHERE w.user_id = $1 AND w.is_public = true
        GROUP BY w.id, w.user_id, w.name, w.is_public, w.is_default, w.created_at, w.updated_at
        ORDER BY w.updated_at DESC
        LIMIT $2 OFFSET $3
      `;

      const countSql = `
        SELECT COUNT(*) as total
        FROM wishlists
        WHERE user_id = $1 AND is_public = true
      `;

      const [wishlists, countResult] = await Promise.all([
        SelectQuery(sql, [userId, per_page, offset]),
        SelectQuery(countSql, [userId])
      ]);

      const total = countResult[0]?.total || 0;
      const meta = buildPaginationMeta(total, page, per_page);

      return ApiResponse.success({ meta, wishlists });
    } catch (error) {
      console.error('Get public wishlists error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }
}
