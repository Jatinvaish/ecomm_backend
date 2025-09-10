import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { ApiResponseFormat, ApiResponse } from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import { SelectQuery, InsertQuery, UpdateQuery, DeleteQuery } from 'src/db/postgres.client';
import { SyncAction, SyncStatus } from 'src/common/utils/enums';

// Define interfaces for type safety
interface QueueItem {
  id: number;
  product_id: number;
  action: SyncAction;
  status: SyncStatus;
  created_at: Date;
}

interface QueueStats {
  pending: number;
  processing: number;
  failed: number;
  total: number;
}

interface SearchDocument {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  sku: string;
  price: number;
  compare_price?: number;
  brand_id?: number;
  category_id?: number;
  vendor_id: number;
  status: string;
  is_featured: boolean;
  is_physical?: boolean;
  gallery: any[];
  variants: any[];
  specifications: any[];
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class SearchSyncService {
  constructor(
    private readonly productsRepository: ProductsRepository,
  ) {}

  // Execute query method for internal use

  async addToQueue(productId: number, action: SyncAction): Promise<ApiResponseFormat<QueueItem>> {
    try {
      // Check if there's already a pending/processing entry for this product
      const existingEntry = await this.findPendingQueueItem(productId, action);
      
      if (existingEntry.result && existingEntry.result) {
        // Already in queue, no need to add again
        return ApiResponse.success(existingEntry.result, 'Already in sync queue');
      }

      const sql = `
        INSERT INTO search_sync_queue (product_id, action, status, created_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, product_id, action, status, created_at
      `;

      const result = await InsertQuery(sql, [
        productId,
        action,
        SyncStatus.PENDING,
        new Date()
      ]);

      if (result.rows.length === 0) {
        return ApiResponse.error('Failed to add to sync queue', 500);
      }

      return ApiResponse.success(result.rows[0] as QueueItem, 'Added to sync queue successfully');
    } catch (error) {
      console.error('Add to queue error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async processQueue(batchSize: number = 50): Promise<ApiResponseFormat<{
    processed: number;
    failed: number;
    total: number;
    failedItems: Array<{ item: QueueItem; error: string }>;
  }>> {
    try {
      // Get pending queue items
      const pendingItems = await this.getPendingQueueItems(batchSize);
      
      if (!pendingItems.result || !pendingItems.result || pendingItems.result.length === 0) {
        return ApiResponse.success(
          { processed: 0, failed: 0, total: 0, failedItems: [] },
          'No items to process'
        );
      }

      const processedItems: QueueItem[] = [];
      const failedItems: Array<{ item: QueueItem; error: string }> = [];

      for (const item of pendingItems.result) {
        // Mark as processing
        await this.updateQueueItemStatus(item.id, SyncStatus.PROCESSING);

        try {
          if (item.action === SyncAction.INDEX) {
            await this.indexProduct(item.product_id);
          } else if (item.action === SyncAction.DELETE) {
            await this.deleteFromIndex(item.product_id);
          }

          // Mark as completed and remove from queue
          await this.completeQueueItem(item.id);
          processedItems.push(item);
        } catch (error) {
          // Mark as failed
          await this.updateQueueItemStatus(item.id, SyncStatus.FAILED);
          failedItems.push({ 
            item, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return ApiResponse.success(
        {
          processed: processedItems.length,
          failed: failedItems.length,
          total: pendingItems.result.length,
          failedItems
        },
        'Queue processing completed'
      );
    } catch (error) {
      console.error('Process queue error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  private async indexProduct(productId: number): Promise<void> {
    try {
      // Get product with all related data for indexing
      const product = await this.productsRepository.getProductByIdWithDetails(productId);
      
      if (!product) {
        throw new Error(`Product ${productId} not found or inactive`);
      }

      // Prepare search document
      const searchDocument: SearchDocument = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        short_description: product.short_description || '',
        sku: product.sku || '',
        price: product.price,
        compare_price: product.compare_price,
        brand_id: product.brand_id,
        category_id: product.category_id,
        vendor_id: product.vendor_id,
        status: product.status,
        is_featured: product.is_featured,
        is_physical: !product.virtual_product,
        gallery: product.gallery || [],
        variants: product.variants || [],
        specifications: product.specifications || [],
        created_at: product.created_at,
        updated_at: product.updated_at
      };

      // Here you would integrate with your search engine (Elasticsearch, Algolia, etc.)
      // For now, we'll store in search_meta field
      await this.updateProductSearchMeta(productId, searchDocument);
    } catch (error) {
      console.error(`Index product ${productId} error:`, error);
      throw error;
    }
  }

  private async deleteFromIndex(productId: number): Promise<void> {
    try {
      // Here you would remove from your search engine
      // For now, we'll clear the search_meta field
      await this.clearProductSearchMeta(productId);
    } catch (error) {
      console.error(`Delete from index ${productId} error:`, error);
      throw error;
    }
  }

  private async updateProductSearchMeta(productId: number, searchDocument: SearchDocument): Promise<void> {
    const sql = `
      UPDATE products 
      SET search_meta = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    
    await UpdateQuery(sql, [JSON.stringify(searchDocument), productId]);
  }

  private async clearProductSearchMeta(productId: number): Promise<void> {
    const sql = `
      UPDATE products 
      SET search_meta = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    
    await UpdateQuery(sql, [productId]);
  }

  private async findPendingQueueItem(productId: number, action: SyncAction): Promise<ApiResponseFormat<QueueItem | null>> {
    try {
      const sql = `
        SELECT id, product_id, action, status, created_at
        FROM search_sync_queue
        WHERE product_id = $1 AND action = $2 AND status IN ('pending', 'processing')
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await SelectQuery<QueueItem>(sql, [productId, action]);
      
      if (result.length === 0) {
        return ApiResponse.success(null, 'No pending queue item found');
      }

      return ApiResponse.success(result[0]);
    } catch (error) {
      console.error('Find pending queue item error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  private async getPendingQueueItems(limit: number): Promise<ApiResponseFormat<QueueItem[]>> {
    try {
      const sql = `
        SELECT id, product_id, action, status, created_at
        FROM search_sync_queue
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT $1
      `;

      const result = await SelectQuery<QueueItem>(sql, [limit]);
      return ApiResponse.success(result);
    } catch (error) {
      console.error('Get pending queue items error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  private async updateQueueItemStatus(queueId: number, status: SyncStatus): Promise<void> {
    const sql = `
      UPDATE search_sync_queue 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    
    await UpdateQuery(sql, [status, queueId]);
  }

  private async completeQueueItem(queueId: number): Promise<void> {
    const sql = `
      DELETE FROM search_sync_queue 
      WHERE id = $1
    `;
    
    await DeleteQuery(sql, [queueId]);
  }

  async getQueueStats(): Promise<ApiResponseFormat<QueueStats>> {
    try {
      const sql = `
        SELECT 
          status,
          COUNT(*) as count
        FROM search_sync_queue
        GROUP BY status
      `;

      const result = await SelectQuery<{ status: keyof QueueStats; count: string }>(sql, []);
      
      const stats: QueueStats = {
        pending: 0,
        processing: 0,
        failed: 0,
        total: 0
      };

      for (const row of result) {
        if (row.status in stats && row.status !== 'total') {
          stats[row.status] = parseInt(row.count);
          stats.total += parseInt(row.count);
        }
      }

      return ApiResponse.success(stats);
    } catch (error) {
      console.error('Get queue stats error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async clearFailedQueue(): Promise<ApiResponseFormat<{ deletedCount: number }>> {
    try {
      const sql = `
        DELETE FROM search_sync_queue 
        WHERE status = 'failed'
        RETURNING id
      `;

      const result = await DeleteQuery(sql, []);
      return ApiResponse.success(
        { deletedCount: result.rows.length }, 
        'Failed queue items cleared'
      );
    } catch (error) {
      console.error('Clear failed queue error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async retryFailedQueue(): Promise<ApiResponseFormat<QueueItem[]>> {
    try {
      const sql = `
        UPDATE search_sync_queue 
        SET status = 'pending', updated_at = CURRENT_TIMESTAMP 
        WHERE status = 'failed'
        RETURNING id, product_id, action, status, created_at
      `;

      const result = await UpdateQuery(sql, []);
      return ApiResponse.success(
        result.rows as QueueItem[], 
        'Failed queue items reset to pending'
      );
    } catch (error) {
      console.error('Retry failed queue error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async removeFromQueue(productId: number, action?: SyncAction): Promise<ApiResponseFormat<QueueItem[]>> {
    try {
      let sql = `DELETE FROM search_sync_queue WHERE product_id = $1`;
      const params: any[] = [productId];

      if (action) {
        sql += ` AND action = $2`;
        params.push(action);
      }

      sql += ` RETURNING id, product_id, action, status, created_at`;

      const result = await DeleteQuery(sql, params);
      return ApiResponse.success(result.rows as QueueItem[], 'Removed from sync queue');
    } catch (error) {
      console.error('Remove from queue error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async bulkAddToQueue(productIds: number[], action: SyncAction): Promise<ApiResponseFormat<QueueItem[]>> {
    try {
      if (!productIds || productIds.length === 0) {
        return ApiResponse.error('No product IDs provided', 400);
      }

      const values = productIds.map((id, index) => {
        const baseIndex = index * 4;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`;
      }).join(', ');

      const sql = `
        INSERT INTO search_sync_queue (product_id, action, status, created_at)
        VALUES ${values}
        ON CONFLICT (product_id, action) 
        WHERE status IN ('pending', 'processing')
        DO NOTHING
        RETURNING id, product_id, action, status, created_at
      `;

      const params = productIds.flatMap(id => [
        id,
        action,
        SyncStatus.PENDING,
        new Date()
      ]);

      const result = await InsertQuery(sql, params);
      return ApiResponse.success(
        result.rows as QueueItem[], 
        `Added ${result.rows.length} items to sync queue`
      );
    } catch (error) {
      console.error('Bulk add to queue error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // Additional utility methods for better queue management
  async getQueueItemsByStatus(status: SyncStatus, limit: number = 50): Promise<ApiResponseFormat<QueueItem[]>> {
    try {
      const sql = `
        SELECT id, product_id, action, status, created_at
        FROM search_sync_queue
        WHERE status = $1
        ORDER BY created_at ASC
        LIMIT $2
      `;

      const result = await SelectQuery<QueueItem>(sql, [status, limit]);
      return ApiResponse.success(result);
    } catch (error) {
      console.error('Get queue items by status error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async getQueueItemsByProductId(productId: number): Promise<ApiResponseFormat<QueueItem[]>> {
    try {
      const sql = `
        SELECT id, product_id, action, status, created_at
        FROM search_sync_queue
        WHERE product_id = $1
        ORDER BY created_at DESC
      `;

      const result = await SelectQuery<QueueItem>(sql, [productId]);
      return ApiResponse.success(result);
    } catch (error) {
      console.error('Get queue items by product ID error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async purgeOldCompletedItems(olderThanDays: number = 7): Promise<ApiResponseFormat<{ deletedCount: number }>> {
    try {
      const sql = `
        DELETE FROM search_sync_queue 
        WHERE status = 'completed' 
        AND created_at < CURRENT_TIMESTAMP - INTERVAL '${olderThanDays} days'
        RETURNING id
      `;

      const result = await DeleteQuery(sql, []);
      return ApiResponse.success(
        { deletedCount: result.rows.length },
        `Purged ${result.rows.length} old completed items`
      );
    } catch (error) {
      console.error('Purge old completed items error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }
}