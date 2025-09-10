// import { Injectable } from '@nestjs/common';
// import { ApiResponseFormat, ApiResponse } from 'src/common/utils/common-response';
// import { Messages } from 'src/common/utils/messages';
// import { SyncAction, SyncStatus } from './dtos/product.dto';
// import { InsertQuery, UpdateQuery, DeleteQuery } from 'src/db/postgres.client';
// import { ProductsRepository } from '../products/products.repository';

// @Injectable()
// export class SearchSyncService {
//   constructor(
//     private readonly productsRepository: ProductsRepository,
//   ) {}

//   async addToQueue(productId: number, action: SyncAction): Promise<ApiResponseFormat<any>> {
//     try {
//       // Check if there's already a pending/processing entry for this product
//       const existingEntry = await this.findPendingQueueItem(productId, action);
      
//       if (existingEntry.result && existingEntry.result) {
//         // Already in queue, no need to add again
//         return ApiResponse.success(existingEntry.result, 'Already in sync queue');
//       }

//       const queueData = {
//         product_id: productId,
//         action,
//         status: SyncStatus.PENDING,
//         created_at: new Date()
//       };

//       const sql = `
//         INSERT INTO search_sync_queue (product_id, action, status, created_at)
//         VALUES ($1, $2, $3, $4)
//         RETURNING id, product_id, action, status, created_at
//       `;

//       const result:any = await InsertQuery(sql, [
//         queueData.product_id,
//         queueData.action,
//         queueData.status,
//         queueData.created_at
//       ]);

//       if (result.length === 0) {
//         return ApiResponse.error('Failed to add to sync queue', 500);
//       }

//       return ApiResponse.success(result[0], 'Added to sync queue successfully');
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async processQueue(batchSize: number = 50): Promise<ApiResponseFormat<any>> {
//     try {
//       // Get pending queue items
//       const pendingItems:any= await this.getPendingQueueItems(batchSize);
      
//       if (!pendingItems.result || pendingItems?.length === 0) {
//         return ApiResponse.success(
//           { processed: 0, message: 'No items to process' },
//           'Queue processing completed'
//         );
//       }

//       const processedItems = [];
//       const failedItems = [];

//       for (const item of pendingItems.data) {
//         // Mark as processing
//         await this.updateQueueItemStatus(item.id, SyncStatus.PROCESSING);

//         try {
//           if (item.action === SyncAction.INDEX) {
//             await this.indexProduct(item.product_id);
//           } else if (item.action === SyncAction.DELETE) {
//             await this.deleteFromIndex(item.product_id);
//           }

//           // Mark as completed and remove from queue
//           await this.completeQueueItem(item.id);
//           processedItems.push(item);
//         } catch (error) {
//           // Mark as failed
//           await this.updateQueueItemStatus(item.id, SyncStatus.FAILED);
//           failedItems.push({ item, error: error.message });
//         }
//       }

//       return ApiResponse.success(
//         {
//           processed: processedItems.length,
//           failed: failedItems.length,
//           total: pendingItems.data.length,
//           failedItems
//         },
//         'Queue processing completed'
//       );
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   private async indexProduct(productId: number): Promise<void> {
//     // Get product with all related data for indexing
//     const productResult = await this.productsRepository.findActiveProductById(productId);
    
//     if (!productResult.result) {
//       throw new Error(`Product ${productId} not found or inactive`);
//     }

//     const product = productResult.result;

//     // Get all related data for search indexing
//     const [gallery, variants, specifications] = await Promise.all([
//       this.productsRepository.findProductImages(productId),
//       this.productsRepository.findProductVariants(productId),
//       this.productsRepository.findProductSpecifications(productId)
//     ]);

//     // Prepare search document
//     const searchDocument = {
//       id: product.id,
//       name: product.name,
//       slug: product.slug,
//       description: product.description || '',
//       short_description: product.short_description || '',
//       sku: product.sku || '',
//       price: product.price,
//       compare_price: product.compare_price,
//       brand_id: product.brand_id,
//       category_id: product.category_id,
//       vendor_id: product.vendor_id,
//       status: product.status,
//       is_featured: product.is_featured,
//       is_physical: product.is_physical,
//       gallery: gallery.result ? gallery.result : [],
//       variants: variants.result ? variants.result : [],
//       specifications: specifications.result ? specifications.result : [],
//       created_at: product.created_at,
//       updated_at: product.updated_at
//     };

//     // Here you would integrate with your search engine (Elasticsearch, Algolia, etc.)
//     // For now, we'll store in search_meta field
//     await this.updateProductSearchMeta(productId, searchDocument);
//   }

//   private async deleteFromIndex(productId: number): Promise<void> {
//     // Here you would remove from your search engine
//     // For now, we'll clear the search_meta field
//     await this.clearProductSearchMeta(productId);
//   }

//   private async updateProductSearchMeta(productId: number, searchDocument: any): Promise<void> {
//     const sql = `
//       UPDATE products 
//       SET search_meta = $1, updated_at = CURRENT_TIMESTAMP 
//       WHERE id = $2
//     `;
    
//     await UpdateQuery(sql, [JSON.stringify(searchDocument), productId]);
//   }

//   private async clearProductSearchMeta(productId: number): Promise<void> {
//     const sql = `
//       UPDATE products 
//       SET search_meta = NULL, updated_at = CURRENT_TIMESTAMP 
//       WHERE id = $1
//     `;
    
//     await UpdateQuery(sql, [productId]);
//   }

//   private async findPendingQueueItem(productId: number, action: SyncAction): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         SELECT id, product_id, action, status, created_at
//         FROM search_sync_queue
//         WHERE product_id = $1 AND action = $2 AND status IN ('pending', 'processing')
//         ORDER BY created_at DESC
//         LIMIT 1
//       `;

//       const result = await this.productsRepository.executeQuery(sql, [productId, action]);
      
//       if (result.length === 0) {
//         return ApiResponse.notFound('No pending queue item found');
//       }

//       return ApiResponse.success(result[0]);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   private async getPendingQueueItems(limit: number): Promise<ApiResponseFormat<any[]>> {
//     try {
//       const sql = `
//         SELECT id, product_id, action, status, created_at
//         FROM search_sync_queue
//         WHERE status = 'pending'
//         ORDER BY created_at ASC
//         LIMIT $1
//       `;

//       const result = await this.productsRepository.executeQuery(sql, [limit]);
//       return ApiResponse.success(result);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   private async updateQueueItemStatus(queueId: number, status: SyncStatus): Promise<void> {
//     const sql = `
//       UPDATE search_sync_queue 
//       SET status = $1 
//       WHERE id = $2
//     `;
    
//     await UpdateQuery(sql, [status, queueId]);
//   }

//   private async completeQueueItem(queueId: number): Promise<void> {
//     const sql = `
//       DELETE FROM search_sync_queue 
//       WHERE id = $1
//     `;
    
//     await DeleteQuery(sql, [queueId]);
//   }

//   async getQueueStats(): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         SELECT 
//           status,
//           COUNT(*) as count
//         FROM search_sync_queue
//         GROUP BY status
//       `;

//       const result = await this.productsRepository.executeQuery(sql, []);
      
//       const stats = {
//         pending: 0,
//         processing: 0,
//         failed: 0,
//         total: 0
//       };

//       for (const row of result) {
//         stats[row.status] = parseInt(row.count);
//         stats.total += parseInt(row.count);
//       }

//       return ApiResponse.success(stats);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async clearFailedQueue(): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         DELETE FROM search_sync_queue 
//         WHERE status = 'failed'
//       `;

//       const result = await DeleteQuery(sql, []);
//       return ApiResponse.success(result, 'Failed queue items cleared');
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async retryFailedQueue(): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         UPDATE search_sync_queue 
//         SET status = 'pending' 
//         WHERE status = 'failed'
//         RETURNING id, product_id, action
//       `;

//       const result = await UpdateQuery(sql, []);
//       return ApiResponse.success(result, 'Failed queue items reset to pending');
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async removeFromQueue(productId: number, action?: SyncAction): Promise<ApiResponseFormat<any>> {
//     try {
//       let sql = `DELETE FROM search_sync_queue WHERE product_id = $1`;
//       const params = [productId];

//       if (action) {
//         sql += ` AND action = $2`;
//         //TODO 
//         //@ts-ignore
//         params.push(action);
//       }

//       sql += ` RETURNING id, product_id, action`;

//       const result = await DeleteQuery(sql, params);
//       return ApiResponse.success(result, 'Removed from sync queue');
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async bulkAddToQueue(productIds: number[], action: SyncAction): Promise<ApiResponseFormat<any>> {
//     try {
//       if (!productIds || productIds.length === 0) {
//         return ApiResponse.error('No product IDs provided', 400);
//       }

//       const values = productIds.map((id, index) => {
//         const baseIndex = index * 4;
//         return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`;
//       }).join(', ');

//       const sql = `
//         INSERT INTO search_sync_queue (product_id, action, status, created_at)
//         VALUES ${values}
//         ON CONFLICT (product_id, action) 
//         WHERE status IN ('pending', 'processing')
//         DO NOTHING
//         RETURNING id, product_id, action, status
//       `;

//       const params = productIds.flatMap(id => [
//         id,
//         action,
//         SyncStatus.PENDING,
//         new Date()
//       ]);

//       const result:any = await InsertQuery(sql, params);
//       return ApiResponse.success(result, `Added ${result?.length} items to sync queue`);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }
// }