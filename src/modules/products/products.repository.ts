//v1 ========================================================================================================================================================================================================================================================================


// import {
//   SelectQuery,
//   InsertQuery,
//   UpdateQuery,
//   withTransaction,
//   BulkUpsert,
//   UpsertQuery,
//   QueryBuilder,
// } from 'src/db/postgres.client';
// import {
//   CreateProductDto,
//   UpdateProductDto,
//   ProductFilterDto,
//   ApprovalDto,
// } from './dtos/products.dto';
// import { Product, ProductWithDetails } from 'src/common/utils/interface';
// import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
// import { Messages } from 'src/common/utils/messages';
// import { PoolClient } from 'pg';
// import { buildInsertQueryWithBooleanCasting, buildPaginationMeta, getTotalCount, PaginationMeta } from 'src/common/utils/api-helpers';
// import { ProductStatus } from 'src/common/utils/enums';

// // Configuration constants
// class ProductConfig {
//   static readonly DEFAULT_CURRENCY_ID = 3;
//   static readonly DEFAULT_PAGINATION = { page: 1, perPage: 20 };
//   static readonly MAX_PAGINATION_SIZE = 100;
//   static readonly DEFAULT_LOW_STOCK_THRESHOLD = 5;
//   static readonly DEFAULT_MIN_ORDER_QUANTITY = 1;
//   static readonly TREND_CALCULATION_WEIGHTS = { view: 0.3, sales: 0.7 };
// }

// // Field definitions for cleaner code
// class ProductFields {
//   static readonly PRODUCT_SELECT = `
//     p.id, p.uuid, p.vendor_id, p.name, p.slug, p.description, p.short_description,
//     p.sku, p.barcode, p.category_id, p.brand_id, p.tax_id, p.base_currency_id,
//     p.price, p.compare_price, p.cost_price, p.margin_percentage, p.weight,
//     p.dimensions, p.shipping_class, p.min_order_quantity, p.max_order_quantity,
//     p.stock_quantity, p.low_stock_threshold, p.track_quantity, p.sold_individually,
//     p.virtual_product, p.downloadable, p.download_limit, p.download_expiry,
//     p.meta_title, p.meta_description, p.meta_keywords, p.search_keywords, p.tags,
//     p.featured_image_url, p.gallery_urls, p.video_urls, p.status, p.visibility,
//     p.password_protection, p.is_featured, p.is_bestseller, p.is_new_arrival,
//     p.is_on_sale, p.sale_starts_at, p.sale_ends_at, p.publish_at, p.avg_rating,
//     p.total_reviews, p.total_sales, p.view_count, p.wishlist_count, p.seo_data,
//     p.product_data, p.is_active, p.created_at,
//     c.name as category_name, v.store_name as vendor_name, p.updated_at
//   `;

//   static readonly PRODUCT_SEARCH_SELECT = `
//     p.id, p.uuid, p.name, p.slug, p.short_description, p.sku,
//     p.category_id, p.brand_id, p.vendor_id, p.price, p.compare_price,
//     p.featured_image_url, p.is_featured, p.is_bestseller, p.is_new_arrival,
//     p.is_on_sale, p.sale_starts_at, p.sale_ends_at, p.avg_rating,
//     p.total_reviews, p.total_sales, p.stock_quantity, p.view_count,
//     c.name as category_name, b.name as brand_name, v.store_name as vendor_name
//   `;

//   static readonly GALLERY_SELECT = `
//     pg.id, pg.media_type, pg.url, pg.thumbnail_url, pg.alt_text, pg.title,
//     pg.description, pg.file_size, pg.mime_type, pg.width, pg.height,
//     pg.duration, pg.sort_order, pg.is_primary, pg.is_active
//   `;

//   static readonly TRANSLATION_SELECT = `
//     pt.id, pt.language_id, pt.name, pt.slug, pt.description, pt.short_description,
//     pt.meta_title, pt.meta_description, pt.meta_keywords, pt.search_keywords, pt.tags
//   `;

//   static readonly PRICE_SELECT = `
//     pp.id, pp.currency_id, pp.price, pp.compare_price, pp.cost_price,
//     pp.is_auto_converted, pp.effective_from, pp.effective_until
//   `;

//   static readonly VARIANT_SELECT = `
//     pv.id, pv.attribute_id, pv.name, pv.sort_order, pv.is_active,
//     a.name as attribute_name, a.slug as attribute_slug, a.type as attribute_type
//   `;

//   static readonly VARIANT_VALUE_SELECT = `
//     pvv.id, pvv.variant_id, pvv.attribute_value_id, pvv.value, pvv.sort_order, pvv.is_active,
//     av.value as attribute_value, av.color_code, av.image_url as attribute_image_url
//   `;

//   static readonly COMBINATION_SELECT = `
//     pvc.id, pvc.sku, pvc.barcode, pvc.base_currency_id, pvc.price,
//     pvc.compare_price, pvc.cost_price, pvc.weight, pvc.dimensions,
//     pvc.image_url, pvc.stock_quantity, pvc.low_stock_threshold, pvc.is_active
//   `;

//   static readonly SPECIFICATION_SELECT = `
//     ps.id, ps.group_name, ps.name, ps.value, ps.unit, ps.sort_order, ps.is_active
//   `;
// }

// // Currency and exchange rate management
// class CurrencyManager {
//   static async getExchangeRates(client: PoolClient): Promise<any[]> {
//     const sql = `
//       SELECT from_currency_id, to_currency_id, rate
//       FROM exchange_rates
//       WHERE is_active = true
//         AND effective_date = (
//           SELECT MAX(effective_date)
//           FROM exchange_rates er2
//           WHERE er2.from_currency_id = exchange_rates.from_currency_id
//             AND er2.to_currency_id = exchange_rates.to_currency_id
//             AND er2.effective_date <= CURRENT_DATE
//             AND er2.is_active = true
//         )
//     `;
//     const result = await client.query(sql);
//     return result.rows;
//   }

//   static async getActiveCurrencies(client: PoolClient, excludeId?: number): Promise<any[]> {
//     let sql = `SELECT id, code, decimal_places FROM currencies WHERE is_active = true`;
//     const params: any[] = [];

//     if (excludeId) {
//       sql += ` AND id != $1`;
//       params.push(excludeId);
//     }

//     const result = await client.query(sql, params);
//     return result.rows;
//   }

//   static getExchangeRate(rates: any[], fromId: number, toId: number): number | null {
//     if (fromId === toId) return 1;

//     const direct = rates.find(r => r.from_currency_id === fromId && r.to_currency_id === toId);
//     if (direct) return direct.rate;

//     const inverse = rates.find(r => r.from_currency_id === toId && r.to_currency_id === fromId);
//     if (inverse) return 1 / inverse.rate;

//     return null;
//   }

//   static calculateConvertedPrice(basePrice: number, exchangeRate: number, decimalPlaces: number = 2): number {
//     const multiplier = Math.pow(10, decimalPlaces);
//     return Math.round((basePrice * exchangeRate) * multiplier) / multiplier;
//   }
// }

// // Price management utilities
// class PriceManager {
//   static async handleProductPrices(client: PoolClient, productId: number, dto: CreateProductDto): Promise<void> {
//     const baseCurrencyId = dto.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID;
//     const prices = dto.prices || [];

//     // If no prices provided, create default price entry for base currency
//     if (prices.length === 0 && dto.price) {
//       prices.push({
//         currency_id: baseCurrencyId,
//         price: dto.price,
//         compare_price: dto.compare_price,
//         cost_price: dto.cost_price,
//         is_auto_converted: false
//       });
//     }

//     const currencies = await CurrencyManager.getActiveCurrencies(client, baseCurrencyId);
//     const exchangeRates = await CurrencyManager.getExchangeRates(client);
//     console.log('✌️exchangeRates --->', exchangeRates);

//     const allPrices = [];

//     for (const currency of currencies) {
//       const existingPrice = prices.find(p => p.currency_id === currency.id);
//       console.log('currency --->', currency);
//       console.log('currency --->', baseCurrencyId);
//       if (existingPrice) {
//         allPrices.push(existingPrice);
//       } else if (dto.price) {
//         const convertedPrice = this.generateConvertedPrice(dto, baseCurrencyId, currency, exchangeRates);
//         console.log("🚀 ~ PriceManager ~ handleProductPrices ~ convertedPrice:", convertedPrice)
//         if (convertedPrice) {
//           allPrices.push(convertedPrice);
//         }
//       }
//     }
//     console.log("🚀 ~ PriceManagerasdasa:", allPrices)

//     if (allPrices.length > 0) {
//       await this.batchInsertProductPrices(client, productId, allPrices);
//     }
//   }

//   static async handleProductPricesUpdate(client: PoolClient, productId: number, dto: UpdateProductDto): Promise<void> {
//     // Delete specified price IDs
//     if (dto.delete_price_ids?.length) {
//       await this.deleteProductPrices(client, productId, dto.delete_price_ids);
//     }

//     // Handle price updates if main price fields changed
//     if (dto.price !== undefined || dto.compare_price !== undefined || dto.cost_price !== undefined) {
//       const baseCurrencyId = dto.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID;
//       await this.updateBaseCurrencyPrice(client, productId, baseCurrencyId, dto);

//       // Auto-update converted prices if base price changed
//       if (dto.price !== undefined) {
//         await this.updateAutoConvertedPrices(client, productId, baseCurrencyId, dto.price);
//       }
//     }

//     // Handle explicit prices array
//     if (dto.prices?.length) {
//       await this.bulkUpsertProductPrices(client, productId, dto.prices);
//     }
//   }

//   private static generateConvertedPrice(dto: CreateProductDto, baseCurrencyId: number, currency: any, exchangeRates: any[]): any | null {
//     const exchangeRate = CurrencyManager.getExchangeRate(exchangeRates, baseCurrencyId, currency.id);
//     if (exchangeRate === null) return null;

//     const decimalPlaces = currency.decimal_places || 2;

//     console.log("🚀 ~ PriceManager ~ generateConvertedPrice ~ return:", {
//       currency_id: currency.id,
//       price: CurrencyManager.calculateConvertedPrice(dto.price, exchangeRate, decimalPlaces),
//       compare_price: dto.compare_price ? CurrencyManager.calculateConvertedPrice(dto.compare_price, exchangeRate, decimalPlaces) : null,
//       cost_price: dto.cost_price ? CurrencyManager.calculateConvertedPrice(dto.cost_price, exchangeRate, decimalPlaces) : null,
//       is_auto_converted: currency.id !== baseCurrencyId
//     })
//     return {
//       currency_id: currency.id,
//       price: CurrencyManager.calculateConvertedPrice(dto.price, exchangeRate, decimalPlaces),
//       compare_price: dto.compare_price ? CurrencyManager.calculateConvertedPrice(dto.compare_price, exchangeRate, decimalPlaces) : null,
//       cost_price: dto.cost_price ? CurrencyManager.calculateConvertedPrice(dto.cost_price, exchangeRate, decimalPlaces) : null,
//       is_auto_converted: currency.id !== baseCurrencyId
//     };
//   }

//   private static async updateBaseCurrencyPrice(client: PoolClient, productId: number, baseCurrencyId: number, dto: UpdateProductDto): Promise<void> {
//     const sql = `
//       UPDATE product_prices
//       SET
//         price = COALESCE($1, price),
//         compare_price = COALESCE($2, compare_price),
//         cost_price = COALESCE($3, cost_price),
//         updated_at = CURRENT_TIMESTAMP
//       WHERE product_id = $4 AND currency_id = $5
//     `;

//     await client.query(sql, [dto.price, dto.compare_price, dto.cost_price, productId, baseCurrencyId]);
//   }

//   private static async updateAutoConvertedPrices(client: PoolClient, productId: number, baseCurrencyId: number, basePrice: number): Promise<void> {
//     const currencies = await CurrencyManager.getActiveCurrencies(client, baseCurrencyId);
//     const exchangeRates = await CurrencyManager.getExchangeRates(client);

//     for (const currency of currencies) {
//       const exchangeRate = CurrencyManager.getExchangeRate(exchangeRates, baseCurrencyId, currency.id);

//       if (exchangeRate !== null) {
//         const convertedPrice = CurrencyManager.calculateConvertedPrice(basePrice, exchangeRate, currency.decimal_places || 2);

//         const sql = `
//           UPDATE product_prices
//           SET price = $1, updated_at = CURRENT_TIMESTAMP
//           WHERE product_id = $2 AND currency_id = $3 AND is_auto_converted = true
//         `;

//         await client.query(sql, [convertedPrice, productId, currency.id]);
//       }
//     }
//   }

//   private static async batchInsertProductPrices(client: PoolClient, productId: number, prices: any[]): Promise<void> {
//     if (!prices.length) return;

//     const columns = [
//       'product_id', 'currency_id', 'price', 'compare_price', 'cost_price',
//       'is_auto_converted', 'effective_from', 'effective_until'
//     ];

//     const values = prices.map(p => [
//       productId,
//       p.currency_id,
//       p.price,
//       p.compare_price,
//       p.cost_price,
//       p.is_auto_converted || false,
//       p.effective_from,
//       p.effective_until
//     ]);

//     const query = `
//       INSERT INTO product_prices (${columns.join(', ')})
//       VALUES ${values.map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`).join(', ')}
//       ON CONFLICT (product_id, currency_id)
//       DO UPDATE SET
//         price = EXCLUDED.price,
//         compare_price = EXCLUDED.compare_price,
//         cost_price = EXCLUDED.cost_price,
//         is_auto_converted = EXCLUDED.is_auto_converted,
//         effective_from = EXCLUDED.effective_from,
//         effective_until = EXCLUDED.effective_until,
//         updated_at = CURRENT_TIMESTAMP
//     `;

//     await client.query(query, values.flat());
//   }

//   private static async bulkUpsertProductPrices(client: PoolClient, productId: number, prices: any[]): Promise<void> {
//     if (!prices.length) return;

//     for (const price of prices) {
//       try {
//         const query = `
//           INSERT INTO product_prices (
//             ${price.id ? 'id,' : ''} product_id, currency_id, price, compare_price, cost_price,
//             is_auto_converted, effective_from, effective_until
//           )
//           VALUES (
//             ${price.id ? '$1, $2, $3, $4, $5, $6, $7, $8, $9' : '$1, $2, $3, $4, $5, $6, $7, $8'}
//           )
//           ON CONFLICT (product_id, currency_id)
//           DO UPDATE SET
//             price = EXCLUDED.price,
//             compare_price = EXCLUDED.compare_price,
//             cost_price = EXCLUDED.cost_price,
//             is_auto_converted = EXCLUDED.is_auto_converted,
//             effective_from = EXCLUDED.effective_from,
//             effective_until = EXCLUDED.effective_until,
//             updated_at = CURRENT_TIMESTAMP
//           RETURNING *
//         `;

//         const values = price.id
//           ? [price.id, productId, price.currency_id, price.price, price.compare_price || null, price.cost_price || null, price.is_auto_converted || false, price.effective_from || null, price.effective_until || null]
//           : [productId, price.currency_id, price.price, price.compare_price || null, price.cost_price || null, price.is_auto_converted || false, price.effective_from || null, price.effective_until || null];

//         await client.query(query, values);
//       } catch (error) {
//         console.error('Error upserting individual price:', { price, error: error.message });
//         throw error;
//       }
//     }
//   }

//   private static async deleteProductPrices(client: PoolClient, productId: number, priceIds: number[]): Promise<void> {
//     if (!priceIds.length) return;

//     const sql = `DELETE FROM product_prices WHERE product_id = $1 AND id = ANY($2)`;
//     await client.query(sql, [productId, priceIds]);
//   }
// }

// // Gallery management utilities
// class GalleryManager {
//   static async handleGallery(client: PoolClient, productId: number, galleryItems: any[], isUpdate: boolean = false): Promise<void> {
//     if (!galleryItems?.length) return;

//     for (const item of galleryItems) {
//       try {
//         if (isUpdate && item.id) {
//           const updated = await this.updateGalleryItem(client, productId, item);
//           if (!updated) {
//             await this.insertGalleryItem(client, productId, item);
//           }
//         } else {
//           await this.insertGalleryItem(client, productId, item);
//         }
//       } catch (error) {
//         console.error('Gallery item processing error:', { item, error });
//         throw error;
//       }
//     }
//   }

//   private static async updateGalleryItem(client: PoolClient, productId: number, item: any): Promise<boolean> {
//     const sql = `
//       UPDATE product_gallery
//       SET media_type = $1, url = $2, thumbnail_url = $3, alt_text = $4,
//           title = $5, description = $6, file_size = $7, mime_type = $8,
//           width = $9, height = $10, duration = $11, sort_order = $12,
//           is_primary = $13, is_active = $14, updated_at = CURRENT_TIMESTAMP
//       WHERE id = $15 AND product_id = $16
//     `;

//     const result = await client.query(sql, [
//       item.media_type ?? 'image', item.url, item.thumbnail_url ?? item.url, item.alt_text ?? '',
//       item.title ?? '', item.description ?? '', item.file_size ?? null, item.mime_type ?? 'image/jpeg',
//       item.width ?? null, item.height ?? null, item.duration ?? null, item.sort_order ?? 0,
//       Boolean(item.is_primary), Boolean(item.is_active ?? true), item.id, productId
//     ]);

//     return result.rowCount > 0;
//   }

//   private static async insertGalleryItem(client: PoolClient, productId: number, item: any): Promise<void> {
//     const sql = `
//       INSERT INTO product_gallery (
//         product_id, media_type, url, thumbnail_url, alt_text, title,
//         description, file_size, mime_type, width, height, duration,
//         sort_order, is_primary, is_active
//       )
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
//     `;

//     await client.query(sql, [
//       productId, item.media_type || 'image', item.url, item.thumbnail_url || item.url,
//       item.alt_text || '', item.title || '', item.description || '', item.file_size || null,
//       item.mime_type || 'image/jpeg', item.width || null, item.height || null,
//       item.duration || null, item.sort_order || 0, Boolean(item.is_primary || false),
//       Boolean(item.is_active !== false)
//     ]);
//   }

//   static async deleteGalleryItems(client: PoolClient, productId: number, ids: number[]): Promise<void> {
//     if (!ids?.length) return;

//     const sql = `DELETE FROM product_gallery WHERE product_id = $1 AND id = ANY($2)`;
//     await client.query(sql, [productId, ids]);
//   }

//   static async batchInsertGalleryItems(client: PoolClient, productId: number, galleryItems: any[]): Promise<void> {
//     if (!galleryItems.length) return;

//     const columns = [
//       'product_id', 'media_type', 'url', 'thumbnail_url', 'alt_text', 'title',
//       'description', 'file_size', 'mime_type', 'width', 'height', 'duration',
//       'sort_order', 'is_primary', 'is_active'
//     ];

//     const booleanColumns = ['is_primary', 'is_active'];

//     const values = galleryItems.map(item => [
//       productId, item.media_type || 'image', item.url, item.thumbnail_url || item.url,
//       item.alt_text || '', item.title || '', item.description || '', item.file_size || null,
//       item.mime_type || 'image/jpeg', item.width || null, item.height || null,
//       item.duration || null, item.sort_order || 0, Boolean(item.is_primary || false),
//       Boolean(item.is_active !== false)
//     ]);

//     const { query, values: flatValues } = buildInsertQueryWithBooleanCasting(
//       'product_gallery', columns, booleanColumns, values
//     );

//     await client.query(query, flatValues);
//   }
// }

// // Variant and combination management (UPDATED)
// class VariantManager {
//   static async handleVariants(client: PoolClient, productId: number, variants: any[], isUpdate: boolean = false): Promise<number[]> {
//     const variantIds: number[] = [];

//     for (const variant of variants) {
//       if (isUpdate && variant.id) {
//         variantIds.push(await this.upsertVariant(client, productId, variant));
//       } else {
//         variantIds.push(await this.insertVariant(client, productId, variant));
//       }
//     }

//     return variantIds;
//   }

//   private static async insertVariant(client: PoolClient, productId: number, variant: any): Promise<number> {
//     const sql = `
//       INSERT INTO product_variants (product_id, attribute_id, name, sort_order, is_active)
//       VALUES ($1, $2, $3, $4, $5)
//       RETURNING id
//     `;

//     const result = await client.query(sql, [
//       productId, variant.attribute_id || null, variant.name, variant.sort_order || 0, variant.is_active ?? true
//     ]);

//     const variantId = result.rows[0].id;

//     if (variant.values?.length) {
//       await this.batchInsertVariantValues(client, variantId, variant.values);
//     }

//     return variantId;
//   }

//   private static async upsertVariant(client: PoolClient, productId: number, variant: any): Promise<number> {
//     let variantId: number;

//     if (variant.id) {
//       const updateSql = `
//         UPDATE product_variants
//         SET attribute_id = $1, name = $2, sort_order = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
//         WHERE id = $5 AND product_id = $6
//         RETURNING id
//       `;

//       const result = await client.query(updateSql, [
//         variant.attribute_id || null, variant.name, variant.sort_order || 0,
//         Boolean(variant.is_active ?? true), variant.id, productId
//       ]);

//       variantId = result.rows[0]?.id || variant.id;
//     } else {
//       variantId = await this.insertVariant(client, productId, variant);
//     }

//     // Handle variant values upsert
//     if (variant.values?.length) {
//       await this.upsertVariantValues(client, variantId, variant.values);
//     }

//     // Handle variant value deletions if specified
//     if (variant.delete_value_ids?.length) {
//       await this.deleteVariantValues(client, variantId, variant.delete_value_ids);
//     }

//     return variantId;
//   }

//   private static async batchInsertVariantValues(client: PoolClient, variantId: number, values: any[]): Promise<void> {
//     if (!values.length) return;

//     const columns = ['variant_id', 'attribute_value_id', 'value', 'sort_order', 'is_active'];
//     const booleanColumns = ['is_active'];

//     const valueRows = values.map(value => [
//       variantId, value.attribute_value_id || null, value.value, value.sort_order || 0, Boolean(value.is_active ?? true)
//     ]);

//     const { query, values: flatValues } = buildInsertQueryWithBooleanCasting(
//       'product_variant_values', columns, booleanColumns, valueRows
//     );

//     await client.query(query, flatValues);
//   }

//   private static async upsertVariantValues(client: PoolClient, variantId: number, values: any[]): Promise<void> {
//     for (const value of values) {
//       if (value.id) {
//         const updateSql = `
//           UPDATE product_variant_values
//           SET attribute_value_id = $1, value = $2, sort_order = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
//           WHERE id = $5 AND variant_id = $6
//         `;

//         await client.query(updateSql, [
//           value.attribute_value_id || null, value.value, value.sort_order || 0,
//           Boolean(value.is_active ?? true), value.id, variantId
//         ]);
//       } else {
//         const insertSql = `
//           INSERT INTO product_variant_values (variant_id, attribute_value_id, value, sort_order, is_active)
//           VALUES ($1, $2, $3, $4, $5)
//         `;

//         await client.query(insertSql, [
//           variantId, value.attribute_value_id || null, value.value, value.sort_order || 0, Boolean(value.is_active ?? true)
//         ]);
//       }
//     }
//   }

//   private static async deleteVariantValues(client: PoolClient, variantId: number, valueIds: number[]): Promise<void> {
//     if (!valueIds.length) return;

//     const sql = `DELETE FROM product_variant_values WHERE variant_id = $1 AND id = ANY($2)`;
//     await client.query(sql, [variantId, valueIds]);
//   }

//   static async deleteVariants(client: PoolClient, productId: number, variantIds: number[]): Promise<void> {
//     if (!variantIds.length) return;

//     // Delete variant values first (due to foreign key constraint)
//     const deleteValuesSql = `DELETE FROM product_variant_values WHERE variant_id = ANY($1)`;
//     await client.query(deleteValuesSql, [variantIds]);

//     // Delete variants
//     const deleteVariantsSql = `DELETE FROM product_variants WHERE product_id = $1 AND id = ANY($2)`;
//     await client.query(deleteVariantsSql, [productId, variantIds]);
//   }
// }

// // Common database operations
// class DatabaseHelper {
//   static async executeInTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
//     return await withTransaction(operation);
//   }

//   static buildPaginationParams(filters: any): { page: number; perPage: number; offset: number } {
//     const page = Math.max(1, parseInt(filters.page?.toString() || '1', 10));
//     const perPage = Math.min(
//       ProductConfig.MAX_PAGINATION_SIZE,
//       Math.max(1, parseInt(filters.per_page?.toString() || '20', 10))
//     );
//     const offset = (page - 1) * perPage;

//     return { page, perPage, offset };
//   }

//   static async addToSearchSyncQueue(productId: number, action: 'index' | 'update' | 'delete'): Promise<void> {
//     try {
//       const priority = action === 'delete' ? 10 : action === 'update' ? 5 : 0;

//       const existing = await SelectQuery(
//         'SELECT id FROM search_sync_queue WHERE product_id = $1 AND status = $2',
//         [productId, 'pending']
//       );

//       if (existing.length > 0) {
//         await UpdateQuery(
//           'UPDATE search_sync_queue SET action = $1, priority = $2, updated_at = CURRENT_TIMESTAMP WHERE product_id = $3 AND status = $4',
//           [action, priority, productId, 'pending']
//         );
//       } else {
//         await InsertQuery(
//           'INSERT INTO search_sync_queue (product_id, action, priority, status) VALUES ($1, $2, $3, $4)',
//           [productId, action, priority, 'pending']
//         );
//       }
//     } catch (error) {
//       console.error('Add to search sync queue error:', error);
//       // Don't throw, this is not critical
//     }
//   }
// }

// // Product data transformation utilities
// class ProductDataBuilder {
//   static buildProductParams(dto: CreateProductDto): any[] {
//     return [
//       dto.vendor_id,
//       dto.name,
//       dto.slug || this.generateSlug(dto.name),
//       dto.description,
//       dto.short_description,
//       dto.sku,
//       dto.barcode,
//       dto.category_id,
//       dto.brand_id,
//       dto.tax_id,
//       dto.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID,
//       dto.price,
//       dto.compare_price,
//       dto.cost_price,
//       dto.margin_percentage,
//       dto.weight,
//       JSON.stringify(dto.dimensions),
//       dto.shipping_class,
//       dto.min_order_quantity || ProductConfig.DEFAULT_MIN_ORDER_QUANTITY,
//       dto.max_order_quantity,
//       dto.stock_quantity || 0,
//       dto.low_stock_threshold || ProductConfig.DEFAULT_LOW_STOCK_THRESHOLD,
//       dto.track_quantity ?? true,
//       dto.sold_individually ?? false,
//       dto.virtual_product ?? false,
//       dto.downloadable ?? false,
//       dto.download_limit,
//       dto.download_expiry,
//       dto.meta_title,
//       dto.meta_description,
//       dto.meta_keywords,
//       dto.search_keywords || [],
//       dto.tags || [],
//       dto.featured_image_url,
//       dto.gallery_urls || [],
//       dto.video_urls || [],
//       dto.status || ProductStatus.DRAFT,
//       dto.visibility || 'visible',
//       dto.password_protection,
//       dto.is_featured ?? false,
//       dto.is_bestseller ?? false,
//       dto.is_new_arrival ?? false,
//       dto.is_on_sale ?? false,
//       dto.sale_starts_at,
//       dto.sale_ends_at,
//       dto.publish_at,
//       JSON.stringify(dto.seo_data),
//       JSON.stringify(dto.product_data),
//       true
//     ];
//   }

//   static buildUpdateProductData(dto: UpdateProductDto): Record<string, any> {
//     const data: Record<string, any> = {};
//     const fields = [
//       'name', 'slug', 'description', 'short_description', 'sku', 'barcode',
//       'category_id', 'brand_id', 'tax_id', 'price', 'compare_price', 'cost_price',
//       'weight', 'stock_quantity', 'status', 'is_featured', 'is_bestseller', 'is_new_arrival', 'is_on_sale',
//       'meta_title', 'meta_description', 'meta_keywords', 'search_keywords', 'shipping_class'
//     ];

//     fields.forEach(field => {
//       if (dto[field] !== undefined) {
//         data[field] = field === 'dimensions' ? JSON.stringify(dto[field]) : dto[field];
//       }
//     });

//     // Handle array fields
//     const arrayFields = ['search_keywords', 'tags', 'gallery_urls', 'video_urls'];
//     arrayFields.forEach(field => {
//       if (dto[field] !== undefined) {
//         data[field] = dto[field] || [];
//       }
//     });

//     return data;
//   }

//   private static generateSlug(name: string): string {
//     return name
//       .toLowerCase()
//       .trim()
//       .replace(/[^a-z0-9 -]/g, '')
//       .replace(/\s+/g, '-')
//       .replace(/-+/g, '-')
//       .replace(/^-|-$/g, '');
//   }
// }

// // Query building utilities
// class QueryBuilderHelper {
//   static buildSearchQuery(filters: ProductFilterDto): QueryBuilder {
//     const queryBuilder = new QueryBuilder();

//     // Base filters
//     queryBuilder.addCondition('p.status = ?', 'active');
//     queryBuilder.addCondition('p.visibility = ?', 'visible');

//     // Search filters
//     if (filters.search) {
//       queryBuilder.addCondition(`
//         (p.search_vector @@ plainto_tsquery('english', ?)
//           OR p.name ILIKE ?
//           OR p.short_description ILIKE ?
//           OR ? = ANY(p.tags))
//       `, filters.search, `%${filters.search}%`, `%${filters.search}%`, filters.search);
//     }

//     // Category and brand filters
//     queryBuilder.addCondition('p.category_id = ?', filters.category_id);
//     queryBuilder.addCondition('p.brand_id = ?', filters.brand_id);
//     queryBuilder.addCondition('p.vendor_id = ?', filters.vendor_id);

//     // Boolean filters
//     queryBuilder.addCondition('p.is_featured = ?', filters.is_featured);
//     queryBuilder.addCondition('p.is_bestseller = ?', filters.is_bestseller);
//     queryBuilder.addCondition('p.is_new_arrival = ?', filters.is_new_arrival);
//     queryBuilder.addCondition('p.is_on_sale = ?', filters.is_on_sale);

//     // Price range
//     if (filters.min_price !== undefined || filters.max_price !== undefined) {
//       const currencyId = filters.currency_id || ProductConfig.DEFAULT_CURRENCY_ID;
//       queryBuilder.addRangeCondition(
//         `COALESCE((SELECT price FROM product_prices WHERE product_id = p.id AND currency_id = ${currencyId}), p.price)`,
//         filters.min_price,
//         filters.max_price
//       );
//     }

//     // Additional filters
//     if (filters.min_rating !== undefined) {
//       queryBuilder.addCondition('p.avg_rating >= ?', filters.min_rating);
//     }

//     if (filters.tags?.length) {
//       queryBuilder.addCondition('p.tags && ?', `{${filters.tags.join(',')}}`);
//     }

//     if (filters.stock_status) {
//       this.addStockStatusFilter(queryBuilder, filters.stock_status);
//     }

//     return queryBuilder;
//   }

//   private static addStockStatusFilter(queryBuilder: QueryBuilder, stockStatus: string): void {
//     switch (stockStatus) {
//       case 'in_stock':
//         queryBuilder.addCondition('p.stock_quantity > p.low_stock_threshold');
//         break;
//       case 'low_stock':
//         queryBuilder.addCondition('p.stock_quantity > 0 AND p.stock_quantity <= p.low_stock_threshold');
//         break;
//       case 'out_of_stock':
//         queryBuilder.addCondition('p.stock_quantity = 0');
//         break;
//     }
//   }

//   static buildOrderClause(filters: ProductFilterDto): string {
//     const { sort_by = 'created_at', sort_direction = 'DESC', search, currency_id = ProductConfig.DEFAULT_CURRENCY_ID } = filters;

//     if (search && sort_by === 'relevance') {
//       return `ORDER BY
//         ts_rank(p.search_vector, plainto_tsquery('english', '${search}')) DESC,
//         p.view_count DESC,
//         p.total_sales DESC`;
//     }

//     const validSortFields = {
//       'price': `COALESCE((SELECT price FROM product_prices WHERE product_id = p.id AND currency_id = ${currency_id}), p.price)`,
//       'created_at': 'p.created_at',
//       'name': 'p.name',
//       'avg_rating': 'p.avg_rating',
//       'total_sales': 'p.total_sales',
//       'view_count': 'p.view_count'
//     };

//     const sortField = validSortFields[sort_by] || validSortFields['created_at'];
//     return `ORDER BY ${sortField} ${sort_direction}, p.id DESC`;
//   }
// }

// export class ProductsRepository {
//   private readonly productSelectFields = ProductFields.PRODUCT_SELECT;
//   private readonly productSearchSelectFields = ProductFields.PRODUCT_SEARCH_SELECT;
//   private readonly gallerySelectFields = ProductFields.GALLERY_SELECT;
//   private readonly translationSelectFields = ProductFields.TRANSLATION_SELECT;
//   private readonly priceSelectFields = ProductFields.PRICE_SELECT;
//   private readonly variantSelectFields = ProductFields.VARIANT_SELECT;
//   private readonly variantValueSelectFields = ProductFields.VARIANT_VALUE_SELECT;
//   private readonly combinationSelectFields = ProductFields.COMBINATION_SELECT;
//   private readonly specificationSelectFields = ProductFields.SPECIFICATION_SELECT;

//   // ==================== CREATE PRODUCT ====================
//   async createProduct(createProductDto: CreateProductDto): Promise<ProductWithDetails> {
//     try {
//       const productId = await DatabaseHelper.executeInTransaction(async (client: PoolClient) => {
//         // 1. Insert main product
//         const productSql = `
//           INSERT INTO products (
//             vendor_id, name, slug, description, short_description, sku, barcode,
//             category_id, brand_id, tax_id, base_currency_id, price, compare_price,
//             cost_price, margin_percentage, weight, dimensions, shipping_class,
//             min_order_quantity, max_order_quantity, stock_quantity, low_stock_threshold,
//             track_quantity, sold_individually, virtual_product, downloadable,
//             download_limit, download_expiry, meta_title, meta_description, meta_keywords,
//             search_keywords, tags, featured_image_url, gallery_urls, video_urls,
//             status, visibility, password_protection, is_featured, is_bestseller,
//             is_new_arrival, is_on_sale, sale_starts_at, sale_ends_at, publish_at,
//             seo_data, product_data, is_active
//           )
//           VALUES (
//             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
//             $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
//             $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
//             $45, $46, $47, $48, $49
//           )
//           RETURNING id, uuid
//         `;

//         const productParams = ProductDataBuilder.buildProductParams(createProductDto);
//         const productResult = await client.query(productSql, productParams);
//         const productId = productResult.rows[0].id;

//         // 2. Handle related data creation in parallel
//         await Promise.all([
//           PriceManager.handleProductPrices(client, productId, createProductDto),
//           this.handleRelatedDataCreation(client, productId, createProductDto)
//         ]);

//         // 3. Handle variants and combinations (sequential due to dependencies)
//         await this.handleVariantsAndCombinations(client, productId, createProductDto);

//         return productId;
//       });

//       await DatabaseHelper.addToSearchSyncQueue(productId, 'index');

//       const product = await this.getProductByIdWithDetails(productId);
//       if (!product) {
//         throw new Error('Failed to retrieve created product');
//       }
//       return product;

//     } catch (error) {
//       console.error('Create product error:', error);
//       throw error;
//     }
//   }

//   // ==================== UPDATE PRODUCT ====================
//   async updateProduct(productId: number, updateProductDto: UpdateProductDto & { vendor_id: number }): Promise<ProductWithDetails> {
//     try {
//       await DatabaseHelper.executeInTransaction(async (client: PoolClient) => {
//         // 1. Update main product
//         const productUpdateData = ProductDataBuilder.buildUpdateProductData(updateProductDto);
//         if (Object.keys(productUpdateData).length > 0) {
//           const updateResult = await UpsertQuery(
//             'products',
//             { id: productId, vendor_id: updateProductDto.vendor_id, ...productUpdateData },
//             ['id'],
//             Object.keys(productUpdateData)
//           );

//           if (updateResult.rowCount === 0) {
//             throw new Error('Product not found or access denied');
//           }
//         }

//         // 2. Handle deletions first
//         await this.handleDeletions(client, productId, updateProductDto);

//         // 3. Handle updates and inserts in parallel
//         await Promise.all([
//           PriceManager.handleProductPricesUpdate(client, productId, updateProductDto),
//           this.handleRelatedDataUpdates(client, productId, updateProductDto)
//         ]);
//       });

//       await DatabaseHelper.addToSearchSyncQueue(productId, 'update');

//       const product = await this.getProductByIdWithDetails(productId);
//       if (!product) {
//         throw new Error('Failed to retrieve updated product');
//       }
//       return product;

//     } catch (error) {
//       console.error('Update product error:', error);
//       throw error;
//     }
//   }

//   // ==================== PRODUCT RETRIEVAL ====================
//   async getProductByIdWithDetails(productId: number, vendorId?: number): Promise<ProductWithDetails | null> {
//     try {
//       let productSql = `SELECT ${this.productSelectFields} FROM products p
//       LEFT JOIN categories c ON p.category_id = c.id
//       LEFT JOIN vendors v ON p.vendor_id = v.id WHERE p.id = $1`;
//       const productParams: any[] = [productId];

//       if (vendorId) {
//         productSql += ` AND p.vendor_id = $2`;
//         productParams.push(vendorId);
//       }

//       const productResult = await SelectQuery<Product>(productSql, productParams);
//       if (!productResult.length) return null;

//       const product = productResult[0];
//       const relatedData = await this.getProductRelatedData(productId);

//       return { ...product, ...relatedData };
//     } catch (error) {
//       console.error('Get product by ID with details error:', error);
//       throw error;
//     }
//   }

//   // ==================== PUBLIC SEARCH ====================
//   async searchProducts(filters: ProductFilterDto): Promise<ApiResponseFormat<any>> {
//     try {
//       const { page, perPage, offset } = DatabaseHelper.buildPaginationParams(filters);
//       const queryBuilder = QueryBuilderHelper.buildSearchQuery(filters);
//       const { whereClause, params } = queryBuilder.build();
//       const orderClause = QueryBuilderHelper.buildOrderClause(filters);

//       const productSearchSelectFields = `
//         p.id, p.uuid, p.name, p.slug, p.short_description, p.sku,
//         p.category_id, p.brand_id, p.vendor_id, p.price, p.compare_price,
//         COALESCE(pg.url, p.featured_image_url) as featured_image_url,
//         pg.media_type, pg.thumbnail_url, pg.alt_text, pg.title as media_title,
//         p.is_featured, p.is_bestseller, p.is_new_arrival,
//         p.is_on_sale, p.sale_starts_at, p.sale_ends_at, p.avg_rating,
//         p.total_reviews, p.total_sales, p.stock_quantity, p.view_count,
//         c.name as category_name, b.name as brand_name, v.store_name as vendor_name
//       `;

//       const baseQuery = `
//         SELECT ${productSearchSelectFields}
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.id
//         LEFT JOIN brands b ON p.brand_id = b.id
//         LEFT JOIN vendors v ON p.vendor_id = v.id
//         LEFT JOIN product_gallery pg ON p.id = pg.product_id AND pg.is_primary = true AND pg.is_active = true
//         WHERE ${whereClause}
//         ${orderClause}
//         LIMIT $${params.length + 1} OFFSET $${params.length + 2}
//       `;

//       const countQuery = `
//         SELECT COUNT(DISTINCT p.id) as total
//         FROM products p
//         WHERE ${whereClause}
//       `;

//       const [products, countResult, aggregations] = await Promise.all([
//         SelectQuery(baseQuery, [...params, perPage, offset]),
//         SelectQuery<{ total: number }>(countQuery, params),
//         this.getSearchAggregations(whereClause, params, filters.currency_id || ProductConfig.DEFAULT_CURRENCY_ID)
//       ]);

//       const total = countResult[0]?.total || 0;
//       const meta = buildPaginationMeta(total, page, perPage);

//       return ApiResponse.success({ meta, products, aggregations });

//     } catch (error) {
//       console.error('Search products error:', error);
//       throw error;
//     }
//   }

//   // ==================== HELPER METHODS ====================
//   private async handleRelatedDataCreation(client: PoolClient, productId: number, dto: CreateProductDto): Promise<void> {
//     const operations = [];

//     if (dto.gallery?.length) {
//       operations.push(GalleryManager.batchInsertGalleryItems(client, productId, dto.gallery));
//     }

//     if (dto.translations?.length) {
//       operations.push(this.batchInsertTranslations(client, productId, dto.translations));
//     }

//     if (dto.specifications?.length) {
//       operations.push(this.batchInsertSpecifications(client, productId, dto.specifications));
//     }

//     await Promise.all(operations);
//   }

//   private async handleRelatedDataUpdates(client: PoolClient, productId: number, dto: UpdateProductDto): Promise<void> {
//     const operations = [];

//     if (dto.gallery?.length) {
//       operations.push(GalleryManager.handleGallery(client, productId, dto.gallery, true));
//     }

//     if (dto.translations?.length) {
//       operations.push(this.bulkUpsertTranslations(client, productId, dto.translations));
//     }

//     if (dto.specifications?.length) {
//       operations.push(this.upsertSpecifications(client, productId, dto.specifications));
//     }

//     if (dto.variants?.length) {
//       operations.push(this.upsertVariants(client, productId, dto.variants));
//     }

//     if (dto.variant_combinations?.length) {
//       operations.push(this.upsertCombinationsWithPrices(client, productId, dto.variant_combinations));
//     }

//     await Promise.all(operations);
//   }

//   private async handleDeletions(client: PoolClient, productId: number, dto: UpdateProductDto): Promise<void> {
//     const deletions = [];

//     if (dto.delete_gallery_ids?.length) {
//       deletions.push(GalleryManager.deleteGalleryItems(client, productId, dto.delete_gallery_ids));
//     }

//     if (dto.delete_translation_ids?.length) {
//       deletions.push(this.deleteTranslations(client, productId, dto.delete_translation_ids));
//     }

//     if (dto.delete_combination_ids?.length) {
//       deletions.push(this.deleteCombinationsWithPrices(client, productId, dto.delete_combination_ids));
//     }

//     await Promise.all(deletions);
//   }

//   private async handleVariantsAndCombinations(client: PoolClient, productId: number, dto: CreateProductDto): Promise<void> {
//     const variantValueMap = new Map<string, number>();

//     if (dto.variants?.length) {
//       const variantIds = await VariantManager.handleVariants(client, productId, dto.variants);

//       // Build variant value map for combinations using attribute-based keys
//       for (let i = 0; i < dto.variants.length; i++) {
//         const variant = dto.variants[i];
//         const variantId = variantIds[i];

//         if (variant.values) {
//           const valuesSql = `
//             SELECT id, value, attribute_value_id FROM product_variant_values
//             WHERE variant_id = $1 AND is_active = true
//           `;
//           const valuesResult = await client.query(valuesSql, [variantId]);

//           valuesResult.rows.forEach(row => {
//             // Use attribute_id-attribute_value_id format for combination keys
//             const key = `${variant.attribute_id}-${row.attribute_value_id}`;
//             variantValueMap.set(key, row.id);
//           });
//         }
//       }
//     }

//     if (dto.variant_combinations?.length) {
//       await this.insertCombinationsWithPrices(client, productId, dto.variant_combinations, variantValueMap);
//     }
//   }

//   /**  ░░ getProductRelatedData ░░
//  *  – only the relevant part that adds `combination_values`
//  *  – keep the rest of the method unchanged
//  */
//   private async getProductRelatedData(productId: number) {
//     const [
//       gallery,
//       translations,
//       prices,
//       variants,
//       combinations,   // ← raw combinations coming from getProductCombinations
//       specifications
//     ] = await Promise.all([
//       this.getProductGallery(productId),
//       this.getProductTranslations(productId),
//       this.getProductPrices(productId),
//       this.getProductVariants(productId),
//       this.getProductCombinations(productId),   // ⚠︎ ensure pvcv.id is selected in that helper
//       this.getProductSpecifications(productId)
//     ]);

//     /* 🔑  map the raw “variant_values” into the shape required by the Zod schema */
//     const enrichedCombinations = combinations.map(c => ({
//       ...c,
//       combination_values: (c.variant_values || []).map(v => ({
//         id: v.id ?? undefined,                     // Junction-table PK  (pvcv.id)
//         variant_value_id: v.variant_value_id,      // FK → product_variant_values.id
//         variant_name: v.variant_name,              // e.g. “Color”
//         variant_value: v.value                     // e.g. “Red”
//       }))
//     }));

//     return {
//       gallery,
//       translations,
//       prices,
//       variants,
//       variant_combinations: enrichedCombinations,
//       specifications
//     };
//   }


//   // ==================== VARIANTS AND COMBINATIONS (UPDATED) ====================
//   private async upsertVariants(client: PoolClient, productId: number, variants: any[]): Promise<void> {
//     await VariantManager.handleVariants(client, productId, variants, true);
//   }

//   private async insertCombinationsWithPrices(client: PoolClient, productId: number, combinations: any[], variantValueMap: Map<string, number>): Promise<void> {
//     for (const combination of combinations) {
//       const combinationSql = `
//         INSERT INTO product_variant_combinations (
//           product_id, sku, barcode, base_currency_id, price, compare_price,
//           cost_price, weight, dimensions, image_url, stock_quantity,
//           low_stock_threshold, is_active
//         )
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
//         RETURNING id
//       `;

//       const combinationParams = [
//         productId, combination.sku, combination.barcode,
//         combination.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID,
//         combination.price, combination.compare_price, combination.cost_price,
//         combination.weight, JSON.stringify(combination.dimensions),
//         combination.image_url, combination.stock_quantity || 0,
//         combination.low_stock_threshold || ProductConfig.DEFAULT_LOW_STOCK_THRESHOLD,
//         combination.is_active ?? true
//       ];

//       const combinationResult = await client.query(combinationSql, combinationParams);
//       const combinationId = combinationResult.rows[0].id;

//       // Handle variant value IDs using combination_key (format: "1-1|4-23")
//       if (combination.combination_key) {
//         const resolvedValueIds = this.resolveVariantValueIdsFromKey(combination.combination_key, variantValueMap);
//         if (resolvedValueIds.length > 0) {
//           await this.batchInsertCombinationValues(client, combinationId, resolvedValueIds);
//         }
//       }

//       // Insert combination prices
//       await this.handleCombinationPrices(client, combinationId, combination);
//     }
//   }

//   private resolveVariantValueIdsFromKey(combinationKey: string, variantValueMap: Map<string, number>): number[] {
//     const resolvedIds: number[] = [];

//     // Parse combination key like "1-1|4-23" to get attribute-value pairs
//     const attributeValuePairs = combinationKey.split('|');

//     for (const pair of attributeValuePairs) {
//       const valueId = variantValueMap.get(pair);
//       if (valueId) {
//         resolvedIds.push(valueId);
//       } else {
//         console.warn(`Variant value ID not found for combination key: ${pair}`);
//       }
//     }

//     return resolvedIds;
//   }

//   private async handleCombinationPrices(client: PoolClient, combinationId: number, combination: any): Promise<void> {
//     const baseCurrencyId = combination.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID;
//     const prices = combination.prices || [];
//     console.log('baseCurrencyId --->', prices);
//     console.log('baseCurrencyId --->', combination);

//     if (prices.length === 0 && combination.price) {
//       prices.push({
//         currency_id: baseCurrencyId,
//         price: combination.price,
//         compare_price: combination.compare_price,
//         cost_price: combination.cost_price,
//         is_auto_converted: false
//       });
//     }
//     console.log('✌️prices --->', prices);

//     const currencies = await CurrencyManager.getActiveCurrencies(client);
//     console.log("🚀 ~ ProductsRepository ~ handleCombinationPrices ~ currencies:", currencies)
//     const exchangeRates = await CurrencyManager.getExchangeRates(client);
//     console.log("🚀 ~ ProductsRepository ~ handleCombinationPrices ~ exchangeRates:", exchangeRates)
//     const allPrices = [];

//     for (const currency of currencies) {
//       console.log('✌️currency --->', currency);
//       const existingPrice = prices.find(p => p.currency_id === currency.id);
//       console.log("🚀 ~ ProductsRepository ~ handleCombinationPrices ~ existingPrice:", existingPrice)

//       if (existingPrice) {
//         allPrices.push(existingPrice);
//       } else if (combination.price) {
//         const exchangeRate = CurrencyManager.getExchangeRate(exchangeRates, baseCurrencyId, currency.id);

//         if (exchangeRate !== null) {
//           const decimalPlaces = currency.decimal_places || 2;

//           allPrices.push({
//             currency_id: currency.id,
//             price: CurrencyManager.calculateConvertedPrice(combination.price, exchangeRate, decimalPlaces),
//             compare_price: combination.compare_price
//               ? CurrencyManager.calculateConvertedPrice(combination.compare_price, exchangeRate, decimalPlaces)
//               : null,
//             cost_price: combination.cost_price
//               ? CurrencyManager.calculateConvertedPrice(combination.cost_price, exchangeRate, decimalPlaces)
//               : null,
//             is_auto_converted: currency.id !== baseCurrencyId
//           });
//         }
//       }
//     }
//     console.log("🚀 ~ ProductsRepository ~ handleCombinationPrices ~ existingPrice:", allPrices)

//     if (allPrices.length > 0) {
//       await this.batchInsertCombinationPrices(client, combinationId, allPrices);
//     }
//   }

//   private async upsertCombinationsWithPrices(client: PoolClient, productId: number, combinations: any[]): Promise<void> {
//     for (const combination of combinations) {
//       if (combination.id) {
//         await this.updateExistingCombination(client, productId, combination);
//       } else {
//         await this.insertNewCombination(client, productId, combination);
//       }
//     }
//   }

//   private async updateExistingCombination(client: PoolClient, productId: number, combination: any): Promise<void> {
//     const updateSql = `
//       UPDATE product_variant_combinations
//       SET
//         sku = $1, barcode = $2, price = $3, compare_price = $4, cost_price = $5,
//         weight = $6, dimensions = $7, image_url = $8, stock_quantity = $9,
//         low_stock_threshold = $10, is_active = $11, updated_at = CURRENT_TIMESTAMP
//       WHERE id = $12 AND product_id = $13
//     `;

//     await client.query(updateSql, [
//       combination.sku, combination.barcode, combination.price,
//       combination.compare_price, combination.cost_price, combination.weight,
//       JSON.stringify(combination.dimensions), combination.image_url,
//       combination.stock_quantity || 0, combination.low_stock_threshold || ProductConfig.DEFAULT_LOW_STOCK_THRESHOLD,
//       combination.is_active ?? true, combination.id, productId
//     ]);

//     // Update combination prices
//     if (combination.prices?.length) {
//       await this.upsertCombinationPrices(client, combination.id, combination.prices);
//     } else {
//       await this.handleCombinationPrices(client, combination.id, combination);
//     }
//   }

//   private async insertNewCombination(client: PoolClient, productId: number, combination: any): Promise<void> {
//     const insertSql = `
//       INSERT INTO product_variant_combinations (
//         product_id, sku, barcode, base_currency_id, price, compare_price,
//         cost_price, weight, dimensions, image_url, stock_quantity,
//         low_stock_threshold, is_active
//       )
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
//       RETURNING id
//     `;

//     const insertParams = [
//       productId, combination.sku, combination.barcode,
//       combination.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID,
//       combination.price, combination.compare_price, combination.cost_price,
//       combination.weight, JSON.stringify(combination.dimensions),
//       combination.image_url, combination.stock_quantity || 0,
//       combination.low_stock_threshold || ProductConfig.DEFAULT_LOW_STOCK_THRESHOLD,
//       combination.is_active ?? true
//     ];

//     const result = await client.query(insertSql, insertParams);
//     const combinationId = result.rows[0].id;

//     await this.handleCombinationPrices(client, combinationId, combination);
//   }

//   // ==================== SPECIFICATIONS ====================
//   private async upsertSpecifications(client: PoolClient, productId: number, specifications: any[]): Promise<void> {
//     for (const spec of specifications) {
//       if (spec.id) {
//         const updateSql = `
//           UPDATE product_specifications
//           SET
//             group_name = $1, name = $2, value = $3, unit = $4,
//             sort_order = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
//           WHERE id = $7 AND product_id = $8
//         `;

//         await client.query(updateSql, [
//           spec.group_name || 'General', spec.name, spec.value, spec.unit || '',
//           spec.sort_order || 0, Boolean(spec.is_active ?? true), spec.id, productId
//         ]);
//       } else {
//         const insertSql = `
//           INSERT INTO product_specifications (
//             product_id, group_name, name, value, unit, sort_order, is_active
//           )
//           VALUES ($1, $2, $3, $4, $5, $6, $7)
//         `;

//         await client.query(insertSql, [
//           productId, spec.group_name || 'General', spec.name, spec.value,
//           spec.unit || '', spec.sort_order || 0, Boolean(spec.is_active ?? true)
//         ]);
//       }
//     }
//   }

//   private async deleteSpecifications(client: PoolClient, productId: number, specificationIds: number[]): Promise<void> {
//     if (!specificationIds.length) return;

//     const sql = `DELETE FROM product_specifications WHERE product_id = $1 AND id = ANY($2)`;
//     await client.query(sql, [productId, specificationIds]);
//   }

//   // ==================== BATCH OPERATIONS ====================
//   private async batchInsertSpecifications(client: PoolClient, productId: number, specifications: any[]): Promise<void> {
//     if (!specifications.length) return;

//     const columns = ['product_id', 'group_name', 'name', 'value', 'unit', 'sort_order', 'is_active'];
//     const booleanColumns = ['is_active'];

//     const values = specifications.map(spec => [
//       productId, spec.group_name || 'General', spec.name, spec.value,
//       spec.unit || '', spec.sort_order || 0, Boolean(spec.is_active ?? true)
//     ]);

//     const { query, values: flatValues } = buildInsertQueryWithBooleanCasting(
//       'product_specifications', columns, booleanColumns, values
//     );

//     await client.query(query, flatValues);
//   }

//   private async batchInsertTranslations(client: PoolClient, productId: number, translations: any[]): Promise<void> {
//     if (!translations.length) return;

//     const columns = [
//       'product_id', 'language_id', 'name', 'slug', 'description', 'short_description',
//       'meta_title', 'meta_description', 'meta_keywords', 'search_keywords', 'tags'
//     ];

//     const values = translations.map(t => [
//       productId, t.language_id, t.name, t.slug, t.description, t.short_description,
//       t.meta_title, t.meta_description, t.meta_keywords,
//       JSON.stringify(t.search_keywords), JSON.stringify(t.tags)
//     ]);

//     const query = `
//       INSERT INTO product_translations (${columns.join(', ')})
//       VALUES ${values.map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`).join(', ')}
//     `;

//     await client.query(query, values.flat());
//   }

//   private async batchInsertCombinationValues(client: PoolClient, combinationId: number, variantValueIds: number[]): Promise<void> {
//     if (!variantValueIds.length) return;

//     const columns = ['combination_id', 'variant_value_id'];
//     const values = variantValueIds.map(id => [combinationId, id]);

//     const query = `
//       INSERT INTO product_variant_combination_values (${columns.join(', ')})
//       VALUES ${values.map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`).join(', ')}
//     `;

//     await client.query(query, values.flat());
//   }

//   private async batchInsertCombinationPrices(client: PoolClient, combinationId: number, prices: any[]): Promise<void> {
//     if (!prices.length) return;

//     const columns = [
//       'combination_id', 'currency_id', 'price', 'compare_price', 'cost_price', 'is_auto_converted'
//     ];

//     const values = prices.map(price => [
//       combinationId, price.currency_id, price.price, price.compare_price,
//       price.cost_price, price.is_auto_converted || false
//     ]);
//     console.log("🚀 ~ ProductsRepository ~ batchInsertCombinationPrices ~ prices:", prices)

//     const query = `
//       INSERT INTO product_variant_prices (${columns.join(', ')})
//       VALUES ${values.map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`).join(', ')}
//       ON CONFLICT (combination_id, currency_id)
//       DO UPDATE SET
//         price = EXCLUDED.price,
//         compare_price = EXCLUDED.compare_price,
//         cost_price = EXCLUDED.cost_price,
//         is_auto_converted = EXCLUDED.is_auto_converted,
//         updated_at = CURRENT_TIMESTAMP
//     `;
//     console.log(`'query'`, query)
//     await client.query(query, values.flat());
//   }

//   // ==================== UPSERT OPERATIONS ====================
//   private async bulkUpsertTranslations(client: PoolClient, productId: number, translations: any[]): Promise<void> {
//     if (!translations.length) return;

//     const records = translations.map(t => ({
//       id: t.id,
//       product_id: productId,
//       language_id: t.language_id,
//       name: t.name,
//       slug: t.slug,
//       description: t.description,
//       short_description: t.short_description,
//       meta_title: t.meta_title,
//       meta_description: t.meta_description,
//       meta_keywords: t.meta_keywords,
//       search_keywords: JSON.stringify(t.search_keywords),
//       tags: JSON.stringify(t.tags)
//     }));

//     await BulkUpsert('product_translations', records, ['id'], [
//       'name', 'slug', 'description', 'short_description', 'meta_title',
//       'meta_description', 'meta_keywords', 'search_keywords', 'tags'
//     ]);
//   }

//   private async upsertCombinationPrices(client: PoolClient, combinationId: number, prices: any[]): Promise<void> {
//     if (!prices.length) return;

//     for (const price of prices) {
//       if (price.id) {
//         const updateSql = `
//           UPDATE product_variant_prices
//           SET
//             price = $1, compare_price = $2, cost_price = $3,
//             is_auto_converted = $4, updated_at = CURRENT_TIMESTAMP
//           WHERE id = $5 AND combination_id = $6
//         `;

//         await client.query(updateSql, [
//           price.price, price.compare_price, price.cost_price,
//           price.is_auto_converted || false, price.id, combinationId
//         ]);
//       } else {
//         const insertSql = `
//           INSERT INTO product_variant_prices (
//             combination_id, currency_id, price, compare_price, cost_price, is_auto_converted
//           )
//           VALUES ($1, $2, $3, $4, $5, $6)
//           ON CONFLICT (combination_id, currency_id)
//           DO UPDATE SET
//             price = EXCLUDED.price,
//             compare_price = EXCLUDED.compare_price,
//             cost_price = EXCLUDED.cost_price,
//             is_auto_converted = EXCLUDED.is_auto_converted,
//             updated_at = CURRENT_TIMESTAMP
//         `;

//         await client.query(insertSql, [
//           combinationId, price.currency_id, price.price,
//           price.compare_price, price.cost_price, price.is_auto_converted || false
//         ]);
//       }
//     }
//   }

//   // ==================== DELETE OPERATIONS ====================
//   private async deleteTranslations(client: PoolClient, productId: number, translationIds: number[]): Promise<void> {
//     if (!translationIds.length) return;

//     const sql = `DELETE FROM product_translations WHERE product_id = $1 AND id = ANY($2)`;
//     await client.query(sql, [productId, translationIds]);
//   }

//   private async deleteCombinationsWithPrices(client: PoolClient, productId: number, combinationIds: number[]): Promise<void> {
//     if (!combinationIds.length) return;

//     // Delete combination prices first (due to foreign key constraint)
//     const deletePricesSql = `DELETE FROM product_variant_prices WHERE combination_id = ANY($1)`;
//     await client.query(deletePricesSql, [combinationIds]);

//     // Delete combination values
//     const deleteValuesSql = `DELETE FROM product_variant_combination_values WHERE combination_id = ANY($1)`;
//     await client.query(deleteValuesSql, [combinationIds]);

//     // Delete combinations
//     const deleteCombinationsSql = `DELETE FROM product_variant_combinations WHERE product_id = $1 AND id = ANY($2)`;
//     await client.query(deleteCombinationsSql, [productId, combinationIds]);
//   }

//   // ==================== DATA RETRIEVAL METHODS (UPDATED) ====================
//   private async getProductSpecifications(productId: number): Promise<any[]> {
//     try {
//       const sql = `
//         SELECT ${this.specificationSelectFields}
//         FROM product_specifications ps
//         WHERE ps.product_id = $1 AND ps.is_active = true
//         ORDER BY ps.group_name, ps.sort_order, ps.id
//       `;
//       return await SelectQuery(sql, [productId]);
//     } catch (error) {
//       console.error('Get product specifications error:', error);
//       return [];
//     }
//   }

//   private async getProductCombinations(productId: number): Promise<any[]> {
//     try {
//       const combinationsSql = `
//         SELECT ${this.combinationSelectFields}
//         FROM product_variant_combinations pvc
//         WHERE pvc.product_id = $1 AND pvc.is_active = true
//         ORDER BY pvc.id
//       `;
//       const combinations = await SelectQuery(combinationsSql, [productId]);

//       const combinationPromises = combinations.map(async combination => {
//         const [variantValues, prices] = await Promise.all([
//           SelectQuery(`
//             SELECT 
//               pvcv.variant_value_id, pvv.value, pvv.attribute_value_id, pvv.variant_id, 
//               pv.name as variant_name, pv.attribute_id,
//               a.name as attribute_name, a.slug as attribute_slug,
//               av.value as attribute_value, av.color_code, av.image_url as attribute_image_url
//             FROM product_variant_combination_values pvcv
//             JOIN product_variant_values pvv ON pvcv.variant_value_id = pvv.id
//             JOIN product_variants pv ON pvv.variant_id = pv.id
//             LEFT JOIN attributes a ON pv.attribute_id = a.id
//             LEFT JOIN attribute_values av ON pvv.attribute_value_id = av.id
//             WHERE pvcv.combination_id = $1
//           `, [combination.id]),

//           SelectQuery(`
//             SELECT pvp.currency_id, pvp.price, pvp.compare_price, pvp.cost_price, pvp.is_auto_converted
//             FROM product_variant_prices pvp
//             WHERE pvp.combination_id = $1
//           `, [combination.id])
//         ]);

//         return { ...combination, variant_values: variantValues, prices: prices };
//       });

//       return await Promise.all(combinationPromises);
//     } catch (error) {
//       console.error('Get product combinations error:', error);
//       return [];
//     }
//   }

//   private async getProductVariants(productId: number): Promise<any[]> {
//     try {
//       const variantsSql = `
//         SELECT ${this.variantSelectFields}
//         FROM product_variants pv
//         LEFT JOIN attributes a ON pv.attribute_id = a.id
//         WHERE pv.product_id = $1 AND pv.is_active = true
//         ORDER BY pv.sort_order, pv.id
//       `;
//       const variants = await SelectQuery(variantsSql, [productId]);

//       const variantValuePromises = variants.map(variant => {
//         const valuesSql = `
//           SELECT ${this.variantValueSelectFields}
//           FROM product_variant_values pvv
//           LEFT JOIN attribute_values av ON pvv.attribute_value_id = av.id
//           WHERE pvv.variant_id = $1 AND pvv.is_active = true
//           ORDER BY pvv.sort_order, pvv.id
//         `;
//         return SelectQuery(valuesSql, [variant.id]);
//       });

//       const allVariantValues = await Promise.all(variantValuePromises);
//       variants.forEach((variant, index) => {
//         variant.values = allVariantValues[index];
//       });

//       return variants;
//     } catch (error) {
//       console.error('Get product variants error:', error);
//       return [];
//     }
//   }

//   private async getProductAttributes(productId: number): Promise<any[]> {
//     try {
//       const sql = `
//         SELECT pa.id, pa.attribute_id, pa.attribute_value_id, pa.custom_value,
//                pa.is_variation, pa.sort_order,
//                a.name as attribute_name, a.slug as attribute_slug, a.type as attribute_type,
//                av.value as attribute_value, av.color_code, av.image_url
//         FROM product_attributes pa
//         LEFT JOIN attributes a ON pa.attribute_id = a.id
//         LEFT JOIN attribute_values av ON pa.attribute_value_id = av.id
//         WHERE pa.product_id = $1
//         ORDER BY pa.sort_order, pa.id
//       `;
//       return await SelectQuery(sql, [productId]);
//     } catch (error) {
//       console.error('Get product attributes error:', error);
//       return [];
//     }
//   }

//   private async getProductTranslations(productId: number, languageId?: number): Promise<any[]> {
//     try {
//       let sql = `
//         SELECT ${this.translationSelectFields}
//         FROM product_translations pt
//         WHERE pt.product_id = $1
//       `;
//       const params = [productId];

//       if (languageId) {
//         sql += ` AND pt.language_id = $2`;
//         params.push(languageId);
//       }

//       sql += ` ORDER BY pt.language_id`;
//       return await SelectQuery(sql, params);
//     } catch (error) {
//       console.error('Get product translations error:', error);
//       return [];
//     }
//   }

//   private async getProductPrices(productId: number, currencyId?: number): Promise<any[]> {
//     try {
//       let sql = `
//         SELECT ${this.priceSelectFields}
//         FROM product_prices pp
//         WHERE pp.product_id = $1
//       `;
//       const params = [productId];

//       if (currencyId) {
//         sql += ` AND pp.currency_id = $2`;
//         params.push(currencyId);
//       }

//       sql += ` ORDER BY pp.currency_id`;
//       return await SelectQuery(sql, params);
//     } catch (error) {
//       console.error('Get product prices error:', error);
//       return [];
//     }
//   }

//   private async getProductGallery(productId: number): Promise<any[]> {
//     try {
//       const sql = `
//         SELECT ${this.gallerySelectFields}
//         FROM product_gallery pg
//         WHERE pg.product_id = $1 AND pg.is_active = true
//         ORDER BY pg.sort_order, pg.id
//       `;
//       return await SelectQuery(sql, [productId]);
//     } catch (error) {
//       console.error('Get product gallery error:', error);
//       return [];
//     }
//   }

//   // ==================== AGGREGATION METHODS ====================
//   private async getSearchAggregations(whereClause: string, params: any[], currencyId: number) {
//     const currencyParamPos = params.length + 1;

//     const [totalValueResult, avgPriceResult, topCategoriesResult, topBrandsResult] = await Promise.all([
//       SelectQuery<{ total_value: number }>(`
//         SELECT SUM(COALESCE((SELECT price FROM product_prices WHERE product_id = p.id AND currency_id = $${currencyParamPos}), p.price)) as total_value
//         FROM products p WHERE ${whereClause}
//       `, [...params, currencyId]),

//       SelectQuery<{ avg_price: number }>(`
//         SELECT AVG(COALESCE((SELECT price FROM product_prices WHERE product_id = p.id AND currency_id = $${currencyParamPos}), p.price)) as avg_price
//         FROM products p WHERE ${whereClause}
//       `, [...params, currencyId]),

//       SelectQuery<{ name: string; count: number }>(`
//         SELECT c.name, COUNT(p.id)::int as count
//         FROM products p
//         JOIN categories c ON p.category_id = c.id
//         WHERE ${whereClause}
//         GROUP BY c.id, c.name
//         ORDER BY count DESC
//         LIMIT 5
//       `, params),

//       SelectQuery<{ name: string; count: number }>(`
//         SELECT b.name, COUNT(p.id)::int as count
//         FROM products p
//         JOIN brands b ON p.brand_id = b.id
//         WHERE ${whereClause} AND p.brand_id IS NOT NULL
//         GROUP BY b.id, b.name
//         ORDER BY count DESC
//         LIMIT 5
//       `, params)
//     ]);

//     return {
//       totalValue: totalValueResult[0]?.total_value || 0,
//       avgPrice: avgPriceResult || 0,
//       topCategories: topCategoriesResult,
//       topBrands: topBrandsResult
//     };
//   }

//   // ==================== PUBLIC METHODS ====================
//   async getProductById(productId: number): Promise<Product | null> {
//     try {
//       const sql = `SELECT ${this.productSelectFields} FROM products p
//       LEFT JOIN categories c ON p.category_id = c.id
//       LEFT JOIN vendors v ON p.vendor_id = v.id WHERE p.id = $1`;
//       const result = await SelectQuery<Product>(sql, [productId]);
//       return result[0] || null;
//     } catch (error) {
//       console.error('Get product by ID error:', error);
//       throw error;
//     }
//   }

//   async deleteProduct(productId: number): Promise<boolean> {
//     try {
//       return await DatabaseHelper.executeInTransaction(async (client: PoolClient) => {
//         await DatabaseHelper.addToSearchSyncQueue(productId, 'delete');

//         const sql = `DELETE FROM products WHERE id = $1 RETURNING id`;
//         const result = await client.query(sql, [productId]);
//         return result.rows.length > 0;
//       });
//     } catch (error) {
//       console.error('Delete product error:', error);
//       throw error;
//     }
//   }

//   async approveProduct(productId: number, approvalDto: ApprovalDto, adminId: number): Promise<Product | null> {
//     try {
//       const status = approvalDto.status || ProductStatus.ACTIVE;
//       const sql = `
//         UPDATE products
//         SET status = $1, updated_at = CURRENT_TIMESTAMP
//         WHERE id = $2
//         RETURNING ${this.productSelectFields}
//       `;
//       const result = await UpdateQuery(sql, [status, productId]);

//       if (result.rows.length > 0) {
//         await DatabaseHelper.addToSearchSyncQueue(productId, 'update');
//         return result.rows[0] as Product;
//       }
//       return null;
//     } catch (error) {
//       console.error('Approve product error:', error);
//       throw error;
//     }
//   }

//   async quickSearch(query: string, limit: number = 10, languageId?: number): Promise<any[]> {
//     try {
//       const searchQuery = `
//         SELECT
//           p.id, p.name, p.slug, p.featured_image_url, p.price, p.avg_rating,
//           c.name as category_name, b.name as brand_name,
//           ts_rank(p.search_vector, plainto_tsquery('english', $1)) as rank
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.id
//         LEFT JOIN brands b ON p.brand_id = b.id
//         WHERE p.status = 'active'
//         AND p.visibility = 'visible'
//         AND (
//           p.search_vector @@ plainto_tsquery('english', $2)
//           OR p.name ILIKE $3
//           OR p.sku ILIKE $4
//         )
//         ORDER BY rank DESC, p.total_sales DESC, p.view_count DESC
//         LIMIT $5
//       `;

//       const searchPattern = `%${query}%`;
//       return await SelectQuery(searchQuery, [query, query, searchPattern, searchPattern, limit]);
//     } catch (error) {
//       console.error('Quick search error:', error);
//       throw error;
//     }
//   }

//   async getTrendingProducts(limit: number = 20, period: string = '7days', languageId?: number): Promise<any[]> {
//     try {
//       const daysBack = period === '24hours' ? 1 : period === '7days' ? 7 : 30;

//       const trendingQuery = `
//         SELECT ${this.productSearchSelectFields},
//           (p.view_count * ${ProductConfig.TREND_CALCULATION_WEIGHTS.view} + p.total_sales * ${ProductConfig.TREND_CALCULATION_WEIGHTS.sales}) as trend_score
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.id
//         LEFT JOIN brands b ON p.brand_id = b.id
//         LEFT JOIN vendors v ON p.vendor_id = v.id
//         WHERE p.status = 'active'
//         AND p.visibility = 'visible'
//         AND p.created_at >= NOW() - INTERVAL '${daysBack} days'
//         ORDER BY trend_score DESC, p.avg_rating DESC
//         LIMIT $1
//       `;

//       return await SelectQuery(trendingQuery, [limit]);
//     } catch (error) {
//       console.error('Get trending products error:', error);
//       throw error;
//     }
//   }

//   async getRecommendations(productId: number, limit: number = 10, languageId?: number): Promise<any[]> {
//     try {
//       const recommendationQuery = `
//         WITH product_info AS (
//           SELECT category_id, brand_id, price, tags
//           FROM products WHERE id = $1
//         ),
//         similar_products AS (
//           SELECT ${this.productSearchSelectFields},
//             CASE
//               WHEN p.category_id = pi.category_id THEN 30
//               ELSE 0
//             END +
//             CASE
//               WHEN p.brand_id = pi.brand_id THEN 20
//               ELSE 0
//             END +
//             CASE
//               WHEN ABS(p.price - pi.price) <= pi.price * 0.3 THEN 15
//               ELSE 0
//             END +
//             CASE
//               WHEN p.tags && pi.tags THEN 10
//               ELSE 0
//             END as similarity_score
//           FROM products p
//           LEFT JOIN categories c ON p.category_id = c.id
//           LEFT JOIN brands b ON p.brand_id = b.id
//           LEFT JOIN vendors v ON p.vendor_id = v.id
//           CROSS JOIN product_info pi
//           WHERE p.id != $2
//           AND p.status = 'active'
//           AND p.visibility = 'visible'
//         )
//         SELECT * FROM similar_products
//         WHERE similarity_score > 0
//         ORDER BY similarity_score DESC, avg_rating DESC, total_sales DESC
//         LIMIT $3
//       `;

//       return await SelectQuery(recommendationQuery, [productId, productId, limit]);
//     } catch (error) {
//       console.error('Get recommendations error:', error);
//       throw error;
//     }
//   }

//   async getPublicProducts(filters: ProductFilterDto): Promise<ApiResponseFormat<Product>> {
//     const publicFilters: any = {
//       ...filters,
//       status: 'active',
//       visibility: 'visible'
//     };

//     return this.searchProducts(publicFilters);
//   }

//   async getPublicProductByIdWithDetails(
//     productId: number,
//     languageId?: number,
//     currencyId: number = 1,
//     userId?: number,
//     combinationId?: number,
//     includeReviews: boolean = true,
//     includeRelated: boolean = true,
//     reviewsPage: number = 1,
//     reviewsLimit: number = 10
//   ): Promise<any> {
//     try {
//       // Increment view count first
//       await this.incrementViewCount(productId);

//       // Get main product data with enhanced fields
//       const sql = `
//       SELECT ${this.productSelectFields}
//       FROM products p
//       LEFT JOIN categories c ON p.category_id = c.id
//       LEFT JOIN vendors v ON p.vendor_id = v.id
//       WHERE p.id = $1 AND p.status = 'active' AND p.visibility = 'visible'
//     `;
//       const result = await SelectQuery<Product>(sql, [productId]);

//       if (!result.length) return null;

//       const product = result[0];

//       // Get all related data in parallel for optimal performance
//       const [
//         gallery,
//         translations,
//         prices,
//         variants,
//         combinations,
//         specifications,
//         reviews,
//         ratingStats,
//         faqs,
//         relatedProducts,
//         seoData,
//         wishlistStatus
//       ] = await Promise.all([
//         this.getProductGallery(productId),
//         this.getProductTranslations(productId, languageId),
//         this.getProductPrices(productId, currencyId),
//         this.getProductVariants(productId),
//         this.getEnhancedProductCombinations(productId, currencyId),
//         this.getProductSpecifications(productId),
//         includeReviews ? this.getProductReviews(productId, reviewsLimit, (reviewsPage - 1) * reviewsLimit) : Promise.resolve([]),
//         includeReviews ? this.getProductRatingStats(productId) : Promise.resolve({}),
//         this.getProductFAQs(productId),
//         includeRelated ? this.getRelatedProducts(productId) : Promise.resolve([]),
//         this.getProductSEOData(productId, languageId),
//         this.getProductWishlistStatus(productId, userId)
//       ]);

//       // Calculate main product stock status
//       const stockStatus = product.stock_quantity === 0 ? 'out_of_stock' :
//         product.stock_quantity <= product.low_stock_threshold ? 'low_stock' : 'in_stock';

//       // Get current price for the specified currency
//       const currentPrice = prices.find(p => p.currency_id === currencyId);

//       // Handle specific combination selection
//       let selectedCombination = null;
//       let effectivePrice = product.price;
//       let effectiveComparePrice = product.compare_price;
//       let effectiveStockQuantity = product.stock_quantity;
//       let effectiveStockStatus = stockStatus;

//       if (combinationId && combinations.length > 0) {
//         selectedCombination = combinations.find(c => c.id === combinationId);
//         if (selectedCombination) {
//           effectivePrice = selectedCombination.current_price;
//           effectiveComparePrice = selectedCombination.current_compare_price;
//           effectiveStockQuantity = selectedCombination.stock_quantity;
//           effectiveStockStatus = selectedCombination.stock_info.stock_status;
//         }
//       }

//       // Calculate discount percentage
//       const discountPercentage = effectiveComparePrice && effectivePrice < effectiveComparePrice
//         ? Math.round(((effectiveComparePrice - effectivePrice) / effectiveComparePrice) * 100)
//         : 0;

//       // Check if product is currently on sale
//       const now = new Date();
//       const isOnSale = product.is_on_sale &&
//         (!product.sale_starts_at || now >= new Date(product.sale_starts_at)) &&
//         (!product.sale_ends_at || now <= new Date(product.sale_ends_at));

//       // Build variant selection map for frontend
//       const variantSelectionMap = {};
//       if (variants.length > 0) {
//         variants.forEach(variant => {
//           variantSelectionMap[variant.id] = {
//             name: variant.name || variant.store_name,
//             values: variant.values || [],
//             selected: null
//           };
//         });
//       }

//       // Generate structured data for SEO
//       const structuredData = {
//         "@context": "https://schema.org/",
//         "@type": "Product",
//         "name": product.name,
//         "description": product.description || product.short_description,
//         "sku": product.sku,
//         "image": product.featured_image_url,
//         "offers": {
//           "@type": "Offer",
//           "price": effectivePrice,
//           "priceCurrency": currentPrice?.currency_code || "USD",
//           "availability": effectiveStockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
//         },
//         "aggregateRating": ratingStats.total_reviews > 0 ? {
//           "@type": "AggregateRating",
//           "ratingValue": ratingStats.avg_rating,
//           "reviewCount": ratingStats.total_reviews
//         } : null
//       };

//       // Build comprehensive response
//       console.log('selectedCombination?.dimensions', product.dimensions)

//       return {
//         ...product,
//         // Core product data
//         gallery,
//         translations,
//         prices,
//         variants,
//         variant_combinations: combinations,
//         specifications,

//         // Enhanced data for public site
//         reviews: includeReviews ? reviews : [],
//         rating_stats: includeReviews ? ratingStats : {},
//         faqs,
//         related_products: includeRelated ? relatedProducts : [],
//         seo_data: seoData,

//         // User-specific data
//         wishlist_status: wishlistStatus,

//         // Computed fields with effective values (considering combination)
//         effective_price: effectivePrice,
//         effective_compare_price: effectiveComparePrice,
//         effective_stock_quantity: effectiveStockQuantity,
//         stock_status: effectiveStockStatus,
//         is_in_stock: effectiveStockQuantity > 0,
//         discount_percentage: discountPercentage,
//         savings_amount: effectiveComparePrice ? (effectiveComparePrice - effectivePrice) : 0,
//         is_currently_on_sale: isOnSale,
//         estimated_delivery: this.calculateEstimatedDelivery({ ...product, stock_quantity: effectiveStockQuantity }),

//         // Current selection info
//         selected_combination: selectedCombination,
//         current_currency: currentPrice,
//         variant_selection_map: variantSelectionMap,

//         // Availability info
//         availability_info: {
//           is_available: effectiveStockQuantity > 0,
//           stock_quantity: product.track_quantity ? effectiveStockQuantity : null,
//           max_order_quantity: product.max_order_quantity,
//           min_order_quantity: product.min_order_quantity || 1,
//           sold_individually: product.sold_individually,
//           backorder_allowed: false // Can be enhanced based on business logic
//         },

//         // Shipping info
//         shipping_info: {
//           weight: selectedCombination?.weight || product.weight,
//           dimensions: product.dimensions || null,
//           shipping_class: product.shipping_class,
//           is_virtual: product.virtual_product,
//           is_downloadable: product.downloadable,
//           free_shipping: false // Can be enhanced based on business rules
//         },

//         // Enhanced metadata for frontend
//         meta: {
//           has_variants: variants.length > 0,
//           has_combinations: combinations.length > 0,
//           total_reviews: ratingStats.total_reviews || 0,
//           verified_reviews: ratingStats.verified_reviews || 0,
//           reviews_with_media: (ratingStats.reviews_with_images || 0) + (ratingStats.reviews_with_videos || 0),
//           view_count: product.view_count + 1,
//           last_updated: product.updated_at,
//           combination_count: combinations.length,
//           available_combinations: combinations.filter(c => c.is_available).length,
//           price_range: combinations.length > 0 ? {
//             min: Math.min(...combinations.map(c => c.current_price)),
//             max: Math.max(...combinations.map(c => c.current_price))
//           } : null
//         },

//         // SEO and structured data
//         structured_data: structuredData,

//         // Review pagination info
//         review_pagination: includeReviews ? {
//           current_page: reviewsPage,
//           per_page: reviewsLimit,
//           total_reviews: ratingStats.total_reviews || 0,
//           has_more: (ratingStats.total_reviews || 0) > (reviewsPage * reviewsLimit)
//         } : null
//       };
//     } catch (error) {
//       console.error('Get public product by ID with details error:', error);
//       throw error;
//     }
//   }
//   async getVendorProducts(vendorId: number, filters: ProductFilterDto): Promise<ApiResponseFormat<any>> {
//     try {
//       const params: any[] = [];
//       let paramIndex = 1;

//       let baseQuery = `SELECT ${this.productSelectFields} FROM products p
//       LEFT JOIN categories c ON p.category_id = c.id
//       LEFT JOIN vendors v ON p.vendor_id = v.id`;

//       const { whereClause, paramIndex: newParamIndex } = this.buildProductWhereClause(
//         vendorId, filters, params, paramIndex
//       );
//       baseQuery += ` WHERE ${whereClause}`;

//       const total = await getTotalCount(baseQuery, params);

//       const { sort_by = 'created_at', sort_direction = 'DESC' } = filters;
//       const orderClause = ` ORDER BY p.${sort_by} ${sort_direction}`;
//       let sql = baseQuery + orderClause;

//       const { page, perPage, offset } = DatabaseHelper.buildPaginationParams(filters);

//       sql += ` LIMIT $${newParamIndex} OFFSET $${newParamIndex + 1}`;
//       params.push(perPage, offset);

//       const result = await SelectQuery(sql, params);
//       const meta = buildPaginationMeta(total, page, perPage);

//       return ApiResponse.success({ meta, products: result });
//     } catch (error) {
//       console.error('Error in getVendorProducts:', error);
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   private buildProductWhereClause(
//     vendorId: number,
//     filters: ProductFilterDto,
//     params: any[],
//     paramIndex: number,
//   ): { whereClause: string; paramIndex: number } {
//     const conditions: string[] = [];
//     let currentParamIndex = paramIndex;

//     conditions.push(`p.vendor_id = $${currentParamIndex++}`);
//     params.push(vendorId);

//     if (filters.search) {
//       conditions.push(`(p.name ILIKE $${currentParamIndex} OR p.sku ILIKE $${currentParamIndex})`);
//       params.push(`%${filters.search}%`);
//       currentParamIndex++;
//     }

//     if (filters.status) {
//       conditions.push(`p.status = $${currentParamIndex++}`);
//       params.push(filters.status);
//     }

//     const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

//     return { whereClause, paramIndex: currentParamIndex };
//   }

//   async getPublicProductBySlugWithDetails(slug: string, languageId?: number, currencyId?: number): Promise<ProductWithDetails | null> {
//     try {
//       const sql = `
//         SELECT ${this.productSelectFields}
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.id
//        LEFT JOIN vendors v ON p.vendor_id = v.id
//         WHERE p.slug = $1 AND p.status = 'active' AND p.visibility = 'visible'
//       `;
//       const result = await SelectQuery<Product>(sql, [slug]);

//       if (!result.length) return null;

//       const product = result[0];

//       const [gallery, translations, prices, variants, combinations, specifications] = await Promise.all([
//         this.getProductGallery(product.id),
//         this.getProductTranslations(product.id, languageId),
//         this.getProductPrices(product.id, currencyId),
//         this.getProductVariants(product.id),
//         this.getProductCombinations(product.id),
//         this.getProductSpecifications(product.id)
//       ]);

//       return {
//         ...product,
//         gallery,
//         translations,
//         prices,
//         variants,
//         variant_combinations: combinations,
//         specifications
//       };
//     } catch (error) {
//       console.error('Get public product by slug error:', error);
//       throw error;
//     }
//   }

//   async incrementViewCount(productId: number): Promise<void> {
//     try {
//       const sql = `UPDATE products SET view_count = view_count + 1 WHERE id = $1`;
//       await UpdateQuery(sql, [productId]);
//     } catch (error) {
//       console.error('Increment view count error:', error);
//       // Don't throw, this is not critical
//     }
//   }

//   async getProductFilters(options: {
//     category_id?: number;
//     brand_id?: number;
//     vendor_id?: number;
//     search?: string;
//     language_id?: number;
//     currency_id?: number;
//   }): Promise<{
//     priceRange: { min_price: number; max_price: number };
//     brands: Array<{ id: number; name: string; product_count: number }>;
//     categories: Array<{ id: number; name: string; product_count: number }>;
//     vendors: Array<{ id: number; name: string; product_count: number }>;
//     variants: Array<{
//       id: number;
//       name: string;
//       values:
//       Array<{ id: number; value: string; count: number }>
//     }>;
//     stockStatus: Array<{ status: string; count: number }>;
//     ratings: Array<{ rating: number; count: number }>;
//   }> {
//     try {
//       const { category_id, brand_id, vendor_id, search, currency_id = ProductConfig.DEFAULT_CURRENCY_ID } = options;

//       const queryBuilder = new QueryBuilder();
//       queryBuilder.addCondition('p.status = ?', 'active');
//       queryBuilder.addCondition('p.visibility = ?', 'visible');
//       queryBuilder.addCondition('p.category_id = ?', category_id);
//       queryBuilder.addCondition('p.brand_id = ?', brand_id);
//       queryBuilder.addCondition('p.vendor_id = ?', vendor_id);

//       if (search) {
//         queryBuilder.addCondition('p.search_vector @@ plainto_tsquery(\'english\', ?)', search);
//       }

//       const { whereClause, params } = queryBuilder.build();
//       const baseParamCount = params.length;

//       const [
//         priceRangeResult,
//         brandsResult,
//         categoriesResult,
//         vendorsResult,
//         variantsResult,
//         stockStatusResult,
//         ratingsResult
//       ] = await Promise.all([
//         SelectQuery<{ min_price: number; max_price: number }>(`
//         SELECT
//           COALESCE(MIN(CASE WHEN pp.currency_id = $${baseParamCount + 1} THEN pp.price ELSE p.price END), 0) as min_price,
//           COALESCE(MAX(CASE WHEN pp.currency_id = $${baseParamCount + 2} THEN pp.price ELSE p.price END), 0) as max_price
//         FROM products p
//         LEFT JOIN product_prices pp ON p.id = pp.product_id AND pp.currency_id = $${baseParamCount + 3}
//         WHERE ${whereClause}
//       `, [...params, currency_id, currency_id, currency_id]),

//         SelectQuery<{ id: number; name: string; product_count: number }>(`
//         SELECT DISTINCT b.id, b.name, COUNT(p.id)::int as product_count
//         FROM products p
//         JOIN brands b ON p.brand_id = b.id
//         WHERE ${whereClause} AND p.brand_id IS NOT NULL
//         GROUP BY b.id, b.name
//         HAVING COUNT(p.id) > 0
//         ORDER BY product_count DESC, b.name
//       `, params),

//         SelectQuery<{ id: number; name: string; product_count: number }>(`
//         SELECT DISTINCT c.id, c.name, COUNT(p.id)::int as product_count
//         FROM products p
//         JOIN categories c ON p.category_id = c.id
//         WHERE ${whereClause} AND p.category_id IS NOT NULL
//         GROUP BY c.id, c.name
//         HAVING COUNT(p.id) > 0
//         ORDER BY product_count DESC, c.name
//       `, params),

//         SelectQuery<{ id: number; name: string; product_count: number }>(`
//         SELECT DISTINCT v.id, v.store_name as name, COUNT(p.id)::int as product_count
//         FROM products p
//         JOIN vendors v ON p.vendor_id = v.id
//         WHERE ${whereClause}
//         GROUP BY v.id, v.store_name
//         HAVING COUNT(p.id) > 0
//         ORDER BY product_count DESC, v.store_name
//       `, params),

//         // UPDATED: Get variants with attribute information
//         SelectQuery<{
//           variant_id: number;
//           variant_name: string;
//           attribute_id: number;
//           attribute_name: string;
//           value_id: number;
//           value: string;
//           attribute_value_id: number;
//           count: number
//         }>(`
//         SELECT
//           pv.id as variant_id,
//           pv.name as variant_name,
//           pv.attribute_id,
//           a.name as attribute_name,
//           pvv.id as value_id,
//           pvv.value,
//           pvv.attribute_value_id,
//           COUNT(DISTINCT p.id)::int as count
//         FROM products p
//         JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
//         LEFT JOIN attributes a ON pv.attribute_id = a.id
//         JOIN product_variant_values pvv ON pv.id = pvv.variant_id AND pvv.is_active = true
//         WHERE ${whereClause}
//         GROUP BY pv.id, pv.name, pv.attribute_id, a.name, pvv.id, pvv.value, pvv.attribute_value_id
//         HAVING COUNT(DISTINCT p.id) > 0
//         ORDER BY pv.sort_order, pv.name, pvv.sort_order, pvv.value
//       `, params),

//         SelectQuery<{ status: string; count: number }>(`
//         SELECT
//           CASE
//             WHEN p.stock_quantity = 0 THEN 'out_of_stock'
//             WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
//             ELSE 'in_stock'
//           END as status,
//           COUNT(p.id)::int as count
//         FROM products p
//         WHERE ${whereClause}
//         GROUP BY status, p.stock_quantity , p.low_stock_threshold
//         HAVING COUNT(p.id) > 0
//       `, params),

//         SelectQuery<{ rating: number; count: number }>(`
//         SELECT
//           FLOOR(p.avg_rating) as rating,
//           COUNT(p.id)::int as count
//         FROM products p
//         WHERE ${whereClause} AND p.avg_rating > 0
//         GROUP BY FLOOR(p.avg_rating)
//         ORDER BY rating DESC
//       `, params)
//       ]);

//       // Group variants by variant with enhanced attribute information
//       const variantsMap = new Map();
//       variantsResult.forEach(variant => {
//         if (!variantsMap.has(variant.variant_id)) {
//           variantsMap.set(variant.variant_id, {
//             id: variant.variant_id,
//             name: variant.variant_name,
//             attribute_id: variant.attribute_id,
//             attribute_name: variant.attribute_name,
//             values: []
//           });
//         }
//         variantsMap.get(variant.variant_id).values.push({
//           id: variant.value_id,
//           value: variant.value,
//           attribute_value_id: variant.attribute_value_id,
//           count: variant.count
//         });
//       });

//       const stockStatusUnique: any = Object.values(
//         stockStatusResult.reduce((acc, item) => {
//           if (!acc[item.status]) {
//             acc[item.status] = { ...item };
//           } else {
//             acc[item.status].count += item.count;
//           }
//           return acc;
//         }, {})
//       );

//       return {
//         priceRange: priceRangeResult[0] || { min_price: 0, max_price: 0 },
//         brands: brandsResult,
//         categories: categoriesResult,
//         vendors: vendorsResult,
//         variants: Array.from(variantsMap.values()),
//         stockStatus: stockStatusUnique,
//         ratings: ratingsResult
//       };
//     } catch (error) {
//       console.error('Get product filters error:', error);
//       throw error;
//     }
//   }

//   async findProductById(id: number): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         SELECT ${this.productSearchSelectFields}
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.id
//         LEFT JOIN brands b ON p.brand_id = b.id
//         LEFT JOIN vendors v ON p.vendor_id = v.id
//         WHERE p.id = $1
//       `;
//       const result = await SelectQuery(sql, [id]);

//       if (result.length === 0) {
//         return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
//       }

//       return ApiResponse.success(result[0]);
//     } catch (error) {
//       console.error('Find product by ID error:', error);
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async getProductsByIds(productIds: number[]): Promise<Product[]> {
//     try {
//       if (!productIds.length) return [];

//       const sql = `
//         SELECT ${this.productSearchSelectFields}
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.id
//         LEFT JOIN brands b ON p.brand_id = b.id
//         LEFT JOIN vendors v ON p.vendor_id = v.id
//         WHERE p.id = ANY($1)
//         ORDER BY p.id
//       `;

//       return await SelectQuery<Product>(sql, [productIds]);
//     } catch (error) {
//       console.error('Get products by IDs error:', error);
//       return [];
//     }
//   }

//   async bulkUpdateProductStatus(productIds: number[], status: ProductStatus): Promise<boolean> {
//     try {
//       return await DatabaseHelper.executeInTransaction(async (client: PoolClient) => {
//         const sql = `
//           UPDATE products
//           SET status = $1, updated_at = CURRENT_TIMESTAMP
//           WHERE id = ANY($2)
//         `;

//         const result = await client.query(sql, [status, productIds]);

//         // Add all products to search sync queue
//         for (const productId of productIds) {
//           await DatabaseHelper.addToSearchSyncQueue(productId, 'update');
//         }

//         return result.rowCount > 0;
//       });
//     } catch (error) {
//       console.error('Bulk update product status error:', error);
//       throw error;
//     }
//   }

//   async getProductAnalytics(vendorId: number, dateRange?: { from: Date; to: Date }): Promise<{
//     totalProducts: number;
//     activeProducts: number;
//     totalSales: number;
//     totalRevenue: number;
//     topProducts: Array<{ id: number; name: string; sales: number; revenue: number }>;
//   }> {
//     try {
//       const queryBuilder = new QueryBuilder();
//       queryBuilder.addCondition('p.vendor_id = ?', vendorId);

//       if (dateRange) {
//         queryBuilder.addRangeCondition('p.created_at', dateRange.from, dateRange.to);
//       }

//       const { whereClause, params } = queryBuilder.build();

//       const [analyticsResult, topProductsResult] = await Promise.all([
//         SelectQuery<{
//           total_products: number;
//           active_products: number;
//           total_sales: number;
//           total_revenue: number;
//         }>(`
//           SELECT
//             COUNT(*) as total_products,
//             COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
//             SUM(total_sales) as total_sales,
//             SUM(total_sales * price) as total_revenue
//           FROM products p
//           WHERE ${whereClause}
//         `, params),

//         SelectQuery<{
//           id: number;
//           name: string;
//           sales: number;
//           revenue: number;
//         }>(`
//           SELECT p.id, p.name, p.total_sales as sales, (p.total_sales * p.price) as revenue
//           FROM products p
//           WHERE ${whereClause}
//           ORDER BY p.total_sales DESC
//           LIMIT 10
//         `, params)
//       ]);

//       const analytics = analyticsResult[0] || {
//         total_products: 0,
//         active_products: 0,
//         total_sales: 0,
//         total_revenue: 0
//       };

//       return {
//         totalProducts: analytics.total_products,
//         activeProducts: analytics.active_products,
//         totalSales: analytics.total_sales || 0,
//         totalRevenue: analytics.total_revenue || 0,
//         topProducts: topProductsResult
//       };
//     } catch (error) {
//       console.error('Get product analytics error:', error);
//       throw error;
//     }
//   }

//   // ==================== NEW METHODS USER SIDE ====================
//   // ==================== HELPER METHODS FOR ENHANCED PUBLIC PRODUCT ====================

//   private async getProductReviews(productId: number, limit: number = 10, offset: number = 0): Promise<any[]> {
//     try {
//       const sql = `
//       SELECT
//         pr.id, pr.user_id, pr.rating, pr.title, pr.comment, pr.pros, pr.cons,
//         pr.images, pr.videos, pr.helpful_votes, pr.verified_purchase, pr.is_approved,
//         pr.replied_at, pr.reply_text, pr.created_at, pr.updated_at,
//         u.full_name as user_name, u.avatar_url as user_avatar,
//         CASE
//           WHEN pr.verified_purchase = true THEN 'Verified Purchase'
//           ELSE 'Unverified'
//         END as purchase_status
//       FROM product_reviews pr
//       LEFT JOIN users u ON pr.user_id = u.id
//       WHERE pr.product_id = $1 AND pr.is_approved = true
//       ORDER BY pr.helpful_votes DESC, pr.created_at DESC
//       LIMIT $2 OFFSET $3
//     `;
//       return await SelectQuery(sql, [productId, limit, offset]);
//     } catch (error) {
//       console.error('Get product reviews error:', error);
//       return [];
//     }
//   }

//   private async getProductRatingStats(productId: number): Promise<any> {
//     try {
//       const sql = `
//       SELECT
//         COUNT(*) as total_reviews,
//         AVG(rating)::NUMERIC(3,2) as avg_rating,
//         COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
//         COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
//         COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
//         COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
//         COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
//         COUNT(CASE WHEN verified_purchase = true THEN 1 END) as verified_reviews,
//         COUNT(CASE WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN 1 END) as reviews_with_images,
//         COUNT(CASE WHEN videos IS NOT NULL AND array_length(videos, 1) > 0 THEN 1 END) as reviews_with_videos
//       FROM product_reviews
//       WHERE product_id = $1 AND is_approved = true
//     `;
//       const result = await SelectQuery(sql, [productId]);
//       return result[0] || {
//         total_reviews: 0, avg_rating: 0, five_star: 0, four_star: 0, three_star: 0,
//         two_star: 0, one_star: 0, verified_reviews: 0, reviews_with_images: 0, reviews_with_videos: 0
//       };
//     } catch (error) {
//       console.error('Get product rating stats error:', error);
//       return {
//         total_reviews: 0, avg_rating: 0, five_star: 0, four_star: 0, three_star: 0,
//         two_star: 0, one_star: 0, verified_reviews: 0, reviews_with_images: 0, reviews_with_videos: 0
//       };
//     }
//   }

//   private async getProductFAQs(productId: number): Promise<any[]> {
//     try {
//       const sql = `
//       SELECT
//         pf.id, pf.question, pf.answer, pf.is_featured,
//         pf.created_at, pf.updated_at,
//         u.full_name as asked_by
//       FROM product_questions pf
//       LEFT JOIN users u ON pf.user_id = u.id
//       WHERE pf.product_id = $1 AND pf.is_active = true
//       ORDER BY pf.is_featured DESC,  pf.created_at DESC
//     `;
//       return await SelectQuery(sql, [productId]);
//     } catch (error) {
//       console.error('Get product FAQs error:', error);
//       return [];
//     }
//   }

//   private async getEnhancedProductCombinations(productId: number, currencyId: number = 1): Promise<any[]> {
//     try {
//       const combinationsSql = `
//       SELECT ${this.combinationSelectFields}
//       FROM product_variant_combinations pvc
//       WHERE pvc.product_id = $1 AND pvc.is_active = true
//       ORDER BY pvc.id
//     `;
//       const combinations = await SelectQuery(combinationsSql, [productId]);

//       const combinationPromises = combinations.map(async combination => {
//         const [variantValues, prices, stockInfo] = await Promise.all([
//           SelectQuery(`
//           SELECT
//             pvcv.variant_value_id, pvv.value, pvv.attribute_value_id, pvv.variant_id,
//             pv.name as variant_name, pv.attribute_id, pv.sort_order as variant_sort_order,
//             pvv.sort_order as value_sort_order,
//             a.name as attribute_name, a.slug as attribute_slug,
//             av.value as attribute_value, av.color_code, av.image_url as attribute_image_url
//           FROM product_variant_combination_values pvcv
//           JOIN product_variant_values pvv ON pvcv.variant_value_id = pvv.id
//           JOIN product_variants pv ON pvv.variant_id = pv.id
//           LEFT JOIN attributes a ON pv.attribute_id = a.id
//           LEFT JOIN attribute_values av ON pvv.attribute_value_id = av.id
//           WHERE pvcv.combination_id = $1
//           ORDER BY pv.sort_order, pvv.sort_order
//         `, [combination.id]),

//           SelectQuery(`
//           SELECT
//             pvp.currency_id, pvp.price, pvp.compare_price, pvp.cost_price,
//             pvp.is_auto_converted, c.code as currency_code, c.symbol as currency_symbol,
//             c.decimal_places
//           FROM product_variant_prices pvp
//           LEFT JOIN currencies c ON pvp.currency_id = c.id
//           WHERE pvp.combination_id = $1
//           ORDER BY CASE WHEN pvp.currency_id = $2 THEN 0 ELSE 1 END, pvp.currency_id
//         `, [combination.id, currencyId]),

//           SelectQuery(`
//           SELECT
//             CASE
//               WHEN pvc.stock_quantity = 0 THEN 'out_of_stock'
//               WHEN pvc.stock_quantity <= pvc.low_stock_threshold THEN 'low_stock'
//               ELSE 'in_stock'
//             END as stock_status,
//             pvc.stock_quantity,
//             pvc.low_stock_threshold
//           FROM product_variant_combinations pvc
//           WHERE pvc.id = $1
//         `, [combination.id])
//         ]);

//         // Generate combination key for frontend selection using attribute-value pairs
//         const combinationKey = variantValues
//           .map(v => `${v.attribute_id}-${v.attribute_value_id}`)
//           .sort()
//           .join('|');

//         // Get current price for specified currency
//         const currentPriceData = prices.find(p => p.currency_id === currencyId);
//         const currentPrice = currentPriceData?.price || combination.price;
//         const currentComparePrice = currentPriceData?.compare_price || combination.compare_price;

//         // Calculate discount
//         const discountPercentage = currentComparePrice && currentPrice < currentComparePrice
//           ? Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)
//           : 0;

//         return {
//           ...combination,
//           variant_values: variantValues,
//           prices: prices,
//           stock_info: stockInfo[0] || { stock_status: 'unknown', stock_quantity: 0, low_stock_threshold: 0 },
//           combination_key: combinationKey,
//           current_price: currentPrice,
//           current_compare_price: currentComparePrice,
//           discount_percentage: discountPercentage,
//           savings: currentComparePrice ? (currentComparePrice - currentPrice) : 0,
//           is_available: combination.stock_quantity > 0 && combination.is_active,
//           formatted_variant_text: variantValues.map(v => `${v.variant_name}: ${v.value}`).join(', ')
//         };
//       });

//       return await Promise.all(combinationPromises);
//     } catch (error) {
//       console.error('Get enhanced product combinations error:', error);
//       return [];
//     }
//   }

//   private async getRelatedProducts(productId: number, limit: number = 8): Promise<any[]> {
//     try {
//       const sql = `
//       WITH product_info AS (
//         SELECT category_id, brand_id, price, tags
//         FROM products WHERE id = $1
//       )
//       SELECT
//         p.id, p.name, p.slug, p.price, p.compare_price, p.featured_image_url,
//         p.avg_rating, p.total_reviews, p.is_featured, p.is_on_sale,
//         p.sale_starts_at, p.sale_ends_at, p.stock_quantity,
//         COALESCE(pg.url, p.featured_image_url) as image_url,
//         pg.thumbnail_url,
//         c.name as category_name,
//         CASE
//           WHEN p.category_id = pi.category_id THEN 30
//           ELSE 0
//         END +
//         CASE
//           WHEN p.brand_id = pi.brand_id THEN 20
//           ELSE 0
//         END +
//         CASE
//           WHEN ABS(p.price - pi.price) <= pi.price * 0.3 THEN 15
//           ELSE 0
//         END +
//         CASE
//           WHEN p.tags && pi.tags THEN 10
//           ELSE 0
//         END as similarity_score,
//         CASE
//           WHEN p.stock_quantity = 0 THEN 'out_of_stock'
//           WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
//           ELSE 'in_stock'
//         END as stock_status
//       FROM products p
//       LEFT JOIN product_gallery pg ON p.id = pg.product_id AND pg.is_primary = true AND pg.is_active = true
//       LEFT JOIN categories c ON p.category_id = c.id
//       CROSS JOIN product_info pi
//       WHERE p.id != $2 AND p.status = 'active' AND p.visibility = 'visible'
//       ORDER BY similarity_score DESC, p.avg_rating DESC, p.total_sales DESC
//       LIMIT $3
//     `;
//       return await SelectQuery(sql, [productId, productId, limit]);
//     } catch (error) {
//       console.error('Get related products error:', error);
//       return [];
//     }
//   }

//   private async getProductSEOData(productId: number, languageId?: number): Promise<any> {
//     try {
//       let sql = `
//       SELECT
//         p.meta_title, p.meta_description, p.meta_keywords, p.seo_data,
//         pt.meta_title as translated_meta_title,
//         pt.meta_description as translated_meta_description,
//         pt.meta_keywords as translated_meta_keywords
//       FROM products p
//       LEFT JOIN product_translations pt ON p.id = pt.product_id
//     `;
//       const params = [productId];

//       if (languageId) {
//         sql += ` AND pt.language_id = $2`;
//         params.push(languageId);
//       }

//       sql += ` WHERE p.id = $1`;

//       const result = await SelectQuery(sql, params);
//       return result[0] || null;
//     } catch (error) {
//       console.error('Get product SEO data error:', error);
//       return null;
//     }
//   }

//   private async getProductWishlistStatus(productId: number, userId?: number): Promise<any> {
//     if (!userId) return { is_wishlisted: false, wishlist_count: 0 };

//     try {
//       const [wishlistStatus, totalWishlistCount] = await Promise.all([
//         SelectQuery(`
//         SELECT id FROM wishlists
//         WHERE user_id = $1 AND product_id = $2 AND is_active = true
//         LIMIT 1
//       `, [userId, productId]),

//         SelectQuery(`
//         SELECT COUNT(*) as count
//         FROM wishlists
//         WHERE product_id = $1 AND is_active = true
//       `, [productId])
//       ]);

//       return {
//         is_wishlisted: wishlistStatus.length > 0,
//         wishlist_count: totalWishlistCount[0]?.count || 0
//       };
//     } catch (error) {
//       console.error('Get product wishlist status error:', error);
//       return { is_wishlisted: false, wishlist_count: 0 };
//     }
//   }

//   // Helper method for delivery estimation
//   private calculateEstimatedDelivery(product: any): string {
//     try {
//       if (product.virtual_product || product.downloadable) {
//         return 'Instant delivery';
//       }

//       if (product.stock_quantity > 0) {
//         return '2-5 business days';
//       } else {
//         return 'Out of stock';
//       }
//     } catch (error) {
//       return 'Contact support';
//     }
//   }

//   // Additional method for dynamic combination price calculation
//   async getProductCombinationPrice(
//     productId: number,
//     combinationId: number,
//     currencyId: number = 1,
//     quantity: number = 1
//   ): Promise<any> {
//     try {
//       const sql = `
//       SELECT
//         pvc.id, pvc.price, pvc.compare_price, pvc.stock_quantity, pvc.sku,
//         pvp.price as currency_price, pvp.compare_price as currency_compare_price,
//         c.code as currency_code, c.symbol as currency_symbol, c.decimal_places,
//         CASE
//           WHEN pvc.stock_quantity = 0 THEN 'out_of_stock'
//           WHEN pvc.stock_quantity <= pvc.low_stock_threshold THEN 'low_stock'
//           ELSE 'in_stock'
//         END as stock_status
//       FROM product_variant_combinations pvc
//       LEFT JOIN product_variant_prices pvp ON pvc.id = pvp.combination_id AND pvp.currency_id = $3
//       LEFT JOIN currencies c ON c.id = $3
//       WHERE pvc.product_id = $1 AND pvc.id = $2 AND pvc.is_active = true
//     `;

//       const result = await SelectQuery(sql, [productId, combinationId, currencyId]);

//       if (!result.length) {
//         throw new Error('Combination not found');
//       }

//       const combination = result[0];
//       const unitPrice = combination.currency_price || combination.price;
//       const comparePrice = combination.currency_compare_price || combination.compare_price;

//       return {
//         combination_id: combination.id,
//         sku: combination.sku,
//         unit_price: unitPrice,
//         compare_price: comparePrice,
//         total_price: unitPrice * quantity,
//         total_savings: comparePrice ? (comparePrice - unitPrice) * quantity : 0,
//         discount_percentage: comparePrice ? Math.round(((comparePrice - unitPrice) / comparePrice) * 100) : 0,
//         currency_code: combination.currency_code,
//         currency_symbol: combination.currency_symbol,
//         stock_status: combination.stock_status,
//         stock_available: combination.stock_quantity,
//         is_available: combination.stock_quantity >= quantity,
//         max_quantity: combination.stock_quantity
//       };
//     } catch (error) {
//       console.error('Get product combination price error:', error);
//       throw error;
//     }
//   }
// }






//v2==============================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================================


import {
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  withTransaction,
  BulkUpsert,
  UpsertQuery,
  QueryBuilder,
} from 'src/db/postgres.client';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductFilterDto,
  ApprovalDto,
} from './dtos/products.dto';
import { Product, ProductWithDetails } from 'src/common/utils/interface';
import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import { PoolClient } from 'pg';
import { buildInsertQueryWithBooleanCasting, buildPaginationMeta, buildRatingStats, calcDiscount, Currency, getTotalCount, mapCombinations, mapGallery, mapReviews, mapVariants, PaginationMeta } from 'src/common/utils/api-helpers';
import { ProductStatus } from 'src/common/utils/enums';

// Configuration constants
class ProductConfig {
  static readonly DEFAULT_CURRENCY_ID = 3;
  static readonly DEFAULT_PAGINATION = { page: 1, perPage: 20 };
  static readonly MAX_PAGINATION_SIZE = 100;
  static readonly DEFAULT_LOW_STOCK_THRESHOLD = 5;
  static readonly DEFAULT_MIN_ORDER_QUANTITY = 1;
  static readonly TREND_CALCULATION_WEIGHTS = { view: 0.3, sales: 0.7 };
}

// Field definitions for cleaner code
class ProductFields {
  static readonly PRODUCT_SELECT = `
    p.id, p.uuid, p.vendor_id, p.name, p.slug, p.description, p.short_description,
    p.sku, p.barcode, p.category_id, p.brand_id, p.tax_id, p.base_currency_id,
    p.price, p.compare_price, p.cost_price, p.margin_percentage, p.weight,
    p.dimensions, p.shipping_class, p.min_order_quantity, p.max_order_quantity,
    p.stock_quantity, p.low_stock_threshold, p.track_quantity, p.sold_individually,
    p.virtual_product, p.downloadable, p.download_limit, p.download_expiry,
    p.meta_title, p.meta_description, p.meta_keywords, p.search_keywords, p.tags,
    p.featured_image_url, p.gallery_urls, p.video_urls, p.status, p.visibility,
    p.password_protection, p.is_featured, p.is_bestseller, p.is_new_arrival,
    p.is_on_sale, p.sale_starts_at, p.sale_ends_at, p.publish_at, p.avg_rating,
    p.total_reviews, p.total_sales, p.view_count, p.wishlist_count, p.seo_data,
    p.product_data, p.is_active, p.created_at,
    c.name as category_name, v.store_name as vendor_name, p.updated_at
  `;

  static readonly PRODUCT_SEARCH_SELECT = `
    p.id, p.uuid, p.name, p.slug, p.short_description, p.sku,
    p.category_id, p.brand_id, p.vendor_id, p.price, p.compare_price,
    p.featured_image_url, p.is_featured, p.is_bestseller, p.is_new_arrival,
    p.is_on_sale, p.sale_starts_at, p.sale_ends_at, p.avg_rating,
    p.total_reviews, p.total_sales, p.stock_quantity, p.view_count,
    c.name as category_name, b.name as brand_name, v.store_name as vendor_name
  `;

  static readonly GALLERY_SELECT = `
    pg.id, pg.media_type, pg.url, pg.thumbnail_url, pg.alt_text, pg.title,
    pg.description, pg.file_size, pg.mime_type, pg.width, pg.height,
    pg.duration, pg.sort_order, pg.is_primary, pg.is_active
  `;

  static readonly TRANSLATION_SELECT = `
    pt.id, pt.language_id, pt.name, pt.slug, pt.description, pt.short_description,
    pt.meta_title, pt.meta_description, pt.meta_keywords, pt.search_keywords, pt.tags
  `;

  static readonly PRICE_SELECT = `
    pp.id, pp.currency_id, pp.price, pp.compare_price, pp.cost_price,
    pp.is_auto_converted, pp.effective_from, pp.effective_until
  `;

  static readonly VARIANT_SELECT = `
    pv.id, pv.attribute_id, pv.name, pv.sort_order, pv.is_active,
    a.name as attribute_name, a.slug as attribute_slug, a.type as attribute_type
  `;

  static readonly VARIANT_VALUE_SELECT = `
    pvv.id, pvv.variant_id, pvv.attribute_value_id, pvv.value, pvv.sort_order, pvv.is_active,
    av.value as attribute_value, av.color_code, av.image_url as attribute_image_url
  `;

  static readonly COMBINATION_SELECT = `
    pvc.id, pvc.sku, pvc.barcode, pvc.base_currency_id, pvc.price,
    pvc.compare_price, pvc.cost_price, pvc.weight, pvc.dimensions,
    pvc.image_url, pvc.stock_quantity, pvc.low_stock_threshold, pvc.is_active
  `;

  static readonly SPECIFICATION_SELECT = `
    ps.id, ps.group_name, ps.name, ps.value, ps.unit, ps.sort_order, ps.is_active
  `;
}

// Currency and exchange rate management
class CurrencyManager {
  static async getExchangeRates(client: PoolClient): Promise<any[]> {
    const sql = `
      SELECT from_currency_id, to_currency_id, rate
      FROM exchange_rates
      WHERE is_active = true
        AND effective_date = (
          SELECT MAX(effective_date)
          FROM exchange_rates er2
          WHERE er2.from_currency_id = exchange_rates.from_currency_id
            AND er2.to_currency_id = exchange_rates.to_currency_id
            AND er2.effective_date <= CURRENT_DATE
            AND er2.is_active = true
        )
    `;
    const result = await client.query(sql);
    return result.rows;
  }

  static async getActiveCurrencies(client: PoolClient, excludeId?: number): Promise<any[]> {
    let sql = `SELECT id, code, decimal_places FROM currencies WHERE is_active = true`;
    const params: any[] = [];

    if (excludeId) {
      sql += ` AND id != $1`;
      params.push(excludeId);
    }

    const result = await client.query(sql, params);
    return result.rows;
  }

  static getExchangeRate(rates: any[], fromId: number, toId: number): number | null {
    if (fromId === toId) return 1;

    const direct = rates.find(r => r.from_currency_id === fromId && r.to_currency_id === toId);
    if (direct) return direct.rate;

    const inverse = rates.find(r => r.from_currency_id === toId && r.to_currency_id === fromId);
    if (inverse) return 1 / inverse.rate;

    return null;
  }

  static calculateConvertedPrice(basePrice: number, exchangeRate: number, decimalPlaces: number = 2): number {
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.round((basePrice * exchangeRate) * multiplier) / multiplier;
  }
}

// Price management utilities
class PriceManager {
  static async handleProductPrices(client: PoolClient, productId: number, dto: CreateProductDto): Promise<void> {
    const baseCurrencyId = dto.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID;
    const prices = dto.prices || [];

    // If no prices provided, create default price entry for base currency
    if (prices.length === 0 && dto.price) {
      prices.push({
        currency_id: baseCurrencyId,
        price: dto.price,
        compare_price: dto.compare_price,
        cost_price: dto.cost_price,
        is_auto_converted: false
      });
    }

    const currencies = await CurrencyManager.getActiveCurrencies(client, baseCurrencyId);
    const exchangeRates = await CurrencyManager.getExchangeRates(client);
    console.log('✌️exchangeRates --->', exchangeRates);

    const allPrices = [];

    for (const currency of currencies) {
      const existingPrice = prices.find(p => p.currency_id === currency.id);
      console.log('currency --->', currency);
      console.log('currency --->', baseCurrencyId);
      if (existingPrice) {
        allPrices.push(existingPrice);
      } else if (dto.price) {
        const convertedPrice = this.generateConvertedPrice(dto, baseCurrencyId, currency, exchangeRates);
        console.log("🚀 ~ PriceManager ~ handleProductPrices ~ convertedPrice:", convertedPrice)
        if (convertedPrice) {
          allPrices.push(convertedPrice);
        }
      }
    }
    console.log("🚀 ~ PriceManagerasdasa:", allPrices)

    if (allPrices.length > 0) {
      await this.batchInsertProductPrices(client, productId, allPrices);
    }
  }

  static async handleProductPricesUpdate(client: PoolClient, productId: number, dto: UpdateProductDto): Promise<void> {
    // Delete specified price IDs
    if (dto.delete_price_ids?.length) {
      await this.deleteProductPrices(client, productId, dto.delete_price_ids);
    }

    // Handle price updates if main price fields changed
    if (dto.price !== undefined || dto.compare_price !== undefined || dto.cost_price !== undefined) {
      const baseCurrencyId = dto.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID;
      await this.updateBaseCurrencyPrice(client, productId, baseCurrencyId, dto);

      // Auto-update converted prices if base price changed
      if (dto.price !== undefined) {
        await this.updateAutoConvertedPrices(client, productId, baseCurrencyId, dto.price);
      }
    }

    // Handle explicit prices array
    if (dto.prices?.length) {
      await this.bulkUpsertProductPrices(client, productId, dto.prices);
    }
  }

  private static generateConvertedPrice(dto: CreateProductDto, baseCurrencyId: number, currency: any, exchangeRates: any[]): any | null {
    const exchangeRate = CurrencyManager.getExchangeRate(exchangeRates, baseCurrencyId, currency.id);
    if (exchangeRate === null) return null;

    const decimalPlaces = currency.decimal_places || 2;

    console.log("🚀 ~ PriceManager ~ generateConvertedPrice ~ return:", {
      currency_id: currency.id,
      price: CurrencyManager.calculateConvertedPrice(dto.price, exchangeRate, decimalPlaces),
      compare_price: dto.compare_price ? CurrencyManager.calculateConvertedPrice(dto.compare_price, exchangeRate, decimalPlaces) : null,
      cost_price: dto.cost_price ? CurrencyManager.calculateConvertedPrice(dto.cost_price, exchangeRate, decimalPlaces) : null,
      is_auto_converted: currency.id !== baseCurrencyId
    })
    return {
      currency_id: currency.id,
      price: CurrencyManager.calculateConvertedPrice(dto.price, exchangeRate, decimalPlaces),
      compare_price: dto.compare_price ? CurrencyManager.calculateConvertedPrice(dto.compare_price, exchangeRate, decimalPlaces) : null,
      cost_price: dto.cost_price ? CurrencyManager.calculateConvertedPrice(dto.cost_price, exchangeRate, decimalPlaces) : null,
      is_auto_converted: currency.id !== baseCurrencyId
    };
  }

  private static async updateBaseCurrencyPrice(client: PoolClient, productId: number, baseCurrencyId: number, dto: UpdateProductDto): Promise<void> {
    const sql = `
      UPDATE product_prices
      SET
        price = COALESCE($1, price),
        compare_price = COALESCE($2, compare_price),
        cost_price = COALESCE($3, cost_price),
        updated_at = CURRENT_TIMESTAMP
      WHERE product_id = $4 AND currency_id = $5
    `;

    await client.query(sql, [dto.price, dto.compare_price, dto.cost_price, productId, baseCurrencyId]);
  }

  private static async updateAutoConvertedPrices(client: PoolClient, productId: number, baseCurrencyId: number, basePrice: number): Promise<void> {
    const currencies = await CurrencyManager.getActiveCurrencies(client, baseCurrencyId);
    const exchangeRates = await CurrencyManager.getExchangeRates(client);

    for (const currency of currencies) {
      const exchangeRate = CurrencyManager.getExchangeRate(exchangeRates, baseCurrencyId, currency.id);

      if (exchangeRate !== null) {
        const convertedPrice = CurrencyManager.calculateConvertedPrice(basePrice, exchangeRate, currency.decimal_places || 2);

        const sql = `
          UPDATE product_prices
          SET price = $1, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = $2 AND currency_id = $3 AND is_auto_converted = true
        `;

        await client.query(sql, [convertedPrice, productId, currency.id]);
      }
    }
  }

  private static async batchInsertProductPrices(client: PoolClient, productId: number, prices: any[]): Promise<void> {
    if (!prices.length) return;

    const columns = [
      'product_id', 'currency_id', 'price', 'compare_price', 'cost_price',
      'is_auto_converted', 'effective_from', 'effective_until'
    ];

    const values = prices.map(p => [
      productId,
      p.currency_id,
      p.price,
      p.compare_price,
      p.cost_price,
      p.is_auto_converted || false,
      p.effective_from,
      p.effective_until
    ]);

    const query = `
      INSERT INTO product_prices (${columns.join(', ')})
      VALUES ${values.map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`).join(', ')}
      ON CONFLICT (product_id, currency_id)
      DO UPDATE SET
        price = EXCLUDED.price,
        compare_price = EXCLUDED.compare_price,
        cost_price = EXCLUDED.cost_price,
        is_auto_converted = EXCLUDED.is_auto_converted,
        effective_from = EXCLUDED.effective_from,
        effective_until = EXCLUDED.effective_until,
        updated_at = CURRENT_TIMESTAMP
    `;

    await client.query(query, values.flat());
  }

  private static async bulkUpsertProductPrices(client: PoolClient, productId: number, prices: any[]): Promise<void> {
    if (!prices.length) return;

    for (const price of prices) {
      try {
        const query = `
          INSERT INTO product_prices (
            ${price.id ? 'id,' : ''} product_id, currency_id, price, compare_price, cost_price,
            is_auto_converted, effective_from, effective_until
          )
          VALUES (
            ${price.id ? '$1, $2, $3, $4, $5, $6, $7, $8, $9' : '$1, $2, $3, $4, $5, $6, $7, $8'}
          )
          ON CONFLICT (product_id, currency_id)
          DO UPDATE SET
            price = EXCLUDED.price,
            compare_price = EXCLUDED.compare_price,
            cost_price = EXCLUDED.cost_price,
            is_auto_converted = EXCLUDED.is_auto_converted,
            effective_from = EXCLUDED.effective_from,
            effective_until = EXCLUDED.effective_until,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;

        const values = price.id
          ? [price.id, productId, price.currency_id, price.price, price.compare_price || null, price.cost_price || null, price.is_auto_converted || false, price.effective_from || null, price.effective_until || null]
          : [productId, price.currency_id, price.price, price.compare_price || null, price.cost_price || null, price.is_auto_converted || false, price.effective_from || null, price.effective_until || null];

        await client.query(query, values);
      } catch (error) {
        console.error('Error upserting individual price:', { price, error: error.message });
        throw error;
      }
    }
  }

  private static async deleteProductPrices(client: PoolClient, productId: number, priceIds: number[]): Promise<void> {
    if (!priceIds.length) return;

    const sql = `DELETE FROM product_prices WHERE product_id = $1 AND id = ANY($2)`;
    await client.query(sql, [productId, priceIds]);
  }
}

// Gallery management utilities
class GalleryManager {
  static async handleGallery(client: PoolClient, productId: number, galleryItems: any[], isUpdate: boolean = false): Promise<void> {
    if (!galleryItems?.length) return;

    for (const item of galleryItems) {
      try {
        if (isUpdate && item.id) {
          const updated = await this.updateGalleryItem(client, productId, item);
          if (!updated) {
            await this.insertGalleryItem(client, productId, item);
          }
        } else {
          await this.insertGalleryItem(client, productId, item);
        }
      } catch (error) {
        console.error('Gallery item processing error:', { item, error });
        throw error;
      }
    }
  }

  private static async updateGalleryItem(client: PoolClient, productId: number, item: any): Promise<boolean> {
    const sql = `
      UPDATE product_gallery
      SET media_type = $1, url = $2, thumbnail_url = $3, alt_text = $4,
          title = $5, description = $6, file_size = $7, mime_type = $8,
          width = $9, height = $10, duration = $11, sort_order = $12,
          is_primary = $13, is_active = $14, updated_at = CURRENT_TIMESTAMP
      WHERE id = $15 AND product_id = $16
    `;

    const result = await client.query(sql, [
      item.media_type ?? 'image', item.url, item.thumbnail_url ?? item.url, item.alt_text ?? '',
      item.title ?? '', item.description ?? '', item.file_size ?? null, item.mime_type ?? 'image/jpeg',
      item.width ?? null, item.height ?? null, item.duration ?? null, item.sort_order ?? 0,
      Boolean(item.is_primary), Boolean(item.is_active ?? true), item.id, productId
    ]);

    return result.rowCount > 0;
  }

  private static async insertGalleryItem(client: PoolClient, productId: number, item: any): Promise<void> {
    const sql = `
      INSERT INTO product_gallery (
        product_id, media_type, url, thumbnail_url, alt_text, title,
        description, file_size, mime_type, width, height, duration,
        sort_order, is_primary, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `;

    await client.query(sql, [
      productId, item.media_type || 'image', item.url, item.thumbnail_url || item.url,
      item.alt_text || '', item.title || '', item.description || '', item.file_size || null,
      item.mime_type || 'image/jpeg', item.width || null, item.height || null,
      item.duration || null, item.sort_order || 0, Boolean(item.is_primary || false),
      Boolean(item.is_active !== false)
    ]);
  }

  static async deleteGalleryItems(client: PoolClient, productId: number, ids: number[]): Promise<void> {
    if (!ids?.length) return;

    const sql = `DELETE FROM product_gallery WHERE product_id = $1 AND id = ANY($2)`;
    await client.query(sql, [productId, ids]);
  }

  static async batchInsertGalleryItems(client: PoolClient, productId: number, galleryItems: any[]): Promise<void> {
    if (!galleryItems.length) return;

    const columns = [
      'product_id', 'media_type', 'url', 'thumbnail_url', 'alt_text', 'title',
      'description', 'file_size', 'mime_type', 'width', 'height', 'duration',
      'sort_order', 'is_primary', 'is_active'
    ];

    const booleanColumns = ['is_primary', 'is_active'];

    const values = galleryItems.map(item => [
      productId, item.media_type || 'image', item.url, item.thumbnail_url || item.url,
      item.alt_text || '', item.title || '', item.description || '', item.file_size || null,
      item.mime_type || 'image/jpeg', item.width || null, item.height || null,
      item.duration || null, item.sort_order || 0, Boolean(item.is_primary || false),
      Boolean(item.is_active !== false)
    ]);

    const { query, values: flatValues } = buildInsertQueryWithBooleanCasting(
      'product_gallery', columns, booleanColumns, values
    );

    await client.query(query, flatValues);
  }
}

// Variant and combination management (UPDATED)
class VariantManager {
  static async handleVariants(client: PoolClient, productId: number, variants: any[], isUpdate: boolean = false): Promise<number[]> {
    const variantIds: number[] = [];

    for (const variant of variants) {
      if (isUpdate && variant.id) {
        variantIds.push(await this.upsertVariant(client, productId, variant));
      } else {
        variantIds.push(await this.insertVariant(client, productId, variant));
      }
    }

    return variantIds;
  }

  private static async insertVariant(client: PoolClient, productId: number, variant: any): Promise<number> {
    const sql = `
      INSERT INTO product_variants (product_id, attribute_id, name, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await client.query(sql, [
      productId, variant.attribute_id || null, variant.name, variant.sort_order || 0, variant.is_active ?? true
    ]);

    const variantId = result.rows[0].id;

    if (variant.values?.length) {
      await this.batchInsertVariantValues(client, variantId, variant.values);
    }

    return variantId;
  }

  private static async upsertVariant(client: PoolClient, productId: number, variant: any): Promise<number> {
    let variantId: number;

    if (variant.id) {
      const updateSql = `
        UPDATE product_variants
        SET attribute_id = $1, name = $2, sort_order = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 AND product_id = $6
        RETURNING id
      `;

      const result = await client.query(updateSql, [
        variant.attribute_id || null, variant.name, variant.sort_order || 0,
        Boolean(variant.is_active ?? true), variant.id, productId
      ]);

      variantId = result.rows[0]?.id || variant.id;
    } else {
      variantId = await this.insertVariant(client, productId, variant);
    }

    // Handle variant values upsert
    if (variant.values?.length) {
      await this.upsertVariantValues(client, variantId, variant.values);
    }

    // Handle variant value deletions if specified
    if (variant.delete_value_ids?.length) {
      await this.deleteVariantValues(client, variantId, variant.delete_value_ids);
    }

    return variantId;
  }

  private static async batchInsertVariantValues(client: PoolClient, variantId: number, values: any[]): Promise<void> {
    if (!values.length) return;

    const columns = ['variant_id', 'attribute_value_id', 'value', 'sort_order', 'is_active'];
    const booleanColumns = ['is_active'];

    const valueRows = values.map(value => [
      variantId, value.attribute_value_id || null, value.value, value.sort_order || 0, Boolean(value.is_active ?? true)
    ]);

    const { query, values: flatValues } = buildInsertQueryWithBooleanCasting(
      'product_variant_values', columns, booleanColumns, valueRows
    );

    await client.query(query, flatValues);
  }

  private static async upsertVariantValues(client: PoolClient, variantId: number, values: any[]): Promise<void> {
    for (const value of values) {
      if (value.id) {
        const updateSql = `
          UPDATE product_variant_values
          SET attribute_value_id = $1, value = $2, sort_order = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5 AND variant_id = $6
        `;

        await client.query(updateSql, [
          value.attribute_value_id || null, value.value, value.sort_order || 0,
          Boolean(value.is_active ?? true), value.id, variantId
        ]);
      } else {
        const insertSql = `
          INSERT INTO product_variant_values (variant_id, attribute_value_id, value, sort_order, is_active)
          VALUES ($1, $2, $3, $4, $5)
        `;

        await client.query(insertSql, [
          variantId, value.attribute_value_id || null, value.value, value.sort_order || 0, Boolean(value.is_active ?? true)
        ]);
      }
    }
  }

  private static async deleteVariantValues(client: PoolClient, variantId: number, valueIds: number[]): Promise<void> {
    if (!valueIds.length) return;

    const sql = `DELETE FROM product_variant_values WHERE variant_id = $1 AND id = ANY($2)`;
    await client.query(sql, [variantId, valueIds]);
  }

  static async deleteVariants(client: PoolClient, productId: number, variantIds: number[]): Promise<void> {
    if (!variantIds.length) return;

    // Delete variant values first (due to foreign key constraint)
    const deleteValuesSql = `DELETE FROM product_variant_values WHERE variant_id = ANY($1)`;
    await client.query(deleteValuesSql, [variantIds]);

    // Delete variants
    const deleteVariantsSql = `DELETE FROM product_variants WHERE product_id = $1 AND id = ANY($2)`;
    await client.query(deleteVariantsSql, [productId, variantIds]);
  }
}

// Common database operations
class DatabaseHelper {
  static async executeInTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    return await withTransaction(operation);
  }

  static buildPaginationParams(filters: any): { page: number; perPage: number; offset: number } {
    const page = Math.max(1, parseInt(filters.page?.toString() || '1', 10));
    const perPage = Math.min(
      ProductConfig.MAX_PAGINATION_SIZE,
      Math.max(1, parseInt(filters.per_page?.toString() || '20', 10))
    );
    const offset = (page - 1) * perPage;

    return { page, perPage, offset };
  }

  static async addToSearchSyncQueue(productId: number, action: 'index' | 'update' | 'delete'): Promise<void> {
    try {
      const priority = action === 'delete' ? 10 : action === 'update' ? 5 : 0;

      const existing = await SelectQuery(
        'SELECT id FROM search_sync_queue WHERE product_id = $1 AND status = $2',
        [productId, 'pending']
      );

      if (existing.length > 0) {
        await UpdateQuery(
          'UPDATE search_sync_queue SET action = $1, priority = $2, updated_at = CURRENT_TIMESTAMP WHERE product_id = $3 AND status = $4',
          [action, priority, productId, 'pending']
        );
      } else {
        await InsertQuery(
          'INSERT INTO search_sync_queue (product_id, action, priority, status) VALUES ($1, $2, $3, $4)',
          [productId, action, priority, 'pending']
        );
      }
    } catch (error) {
      console.error('Add to search sync queue error:', error);
      // Don't throw, this is not critical
    }
  }
}

// Product data transformation utilities
class ProductDataBuilder {
  static buildProductParams(dto: CreateProductDto): any[] {
    return [
      dto.vendor_id,
      dto.name,
      dto.slug || this.generateSlug(dto.name),
      dto.description,
      dto.short_description,
      dto.sku,
      dto.barcode,
      dto.category_id,
      dto.brand_id,
      dto.tax_id,
      dto.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID,
      dto.price,
      dto.compare_price,
      dto.cost_price,
      dto.margin_percentage,
      dto.weight,
      JSON.stringify(dto.dimensions),
      dto.shipping_class,
      dto.min_order_quantity || ProductConfig.DEFAULT_MIN_ORDER_QUANTITY,
      dto.max_order_quantity,
      dto.stock_quantity || 0,
      dto.low_stock_threshold || ProductConfig.DEFAULT_LOW_STOCK_THRESHOLD,
      dto.track_quantity ?? true,
      dto.sold_individually ?? false,
      dto.virtual_product ?? false,
      dto.downloadable ?? false,
      dto.download_limit,
      dto.download_expiry,
      dto.meta_title,
      dto.meta_description,
      dto.meta_keywords,
      dto.search_keywords || [],
      dto.tags || [],
      dto.featured_image_url,
      dto.gallery_urls || [],
      dto.video_urls || [],
      dto.status || ProductStatus.DRAFT,
      dto.visibility || 'visible',
      dto.password_protection,
      dto.is_featured ?? false,
      dto.is_bestseller ?? false,
      dto.is_new_arrival ?? false,
      dto.is_on_sale ?? false,
      dto.sale_starts_at,
      dto.sale_ends_at,
      dto.publish_at,
      JSON.stringify(dto.seo_data),
      JSON.stringify(dto.product_data),
      true
    ];
  }

  static buildUpdateProductData(dto: UpdateProductDto): Record<string, any> {
    const data: Record<string, any> = {};
    const fields = [
      'name', 'slug', 'description', 'short_description', 'sku', 'barcode',
      'category_id', 'brand_id', 'tax_id', 'price', 'compare_price', 'cost_price',
      'weight', 'stock_quantity', 'status', 'is_featured', 'is_bestseller', 'is_new_arrival', 'is_on_sale',
      'meta_title', 'meta_description', 'meta_keywords', 'search_keywords', 'shipping_class'
    ];

    fields.forEach(field => {
      if (dto[field] !== undefined) {
        data[field] = field === 'dimensions' ? JSON.stringify(dto[field]) : dto[field];
      }
    });

    // Handle array fields
    const arrayFields = ['search_keywords', 'tags', 'gallery_urls', 'video_urls'];
    arrayFields.forEach(field => {
      if (dto[field] !== undefined) {
        data[field] = dto[field] || [];
      }
    });

    return data;
  }

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

// Query building utilities
class QueryBuilderHelper {
  static buildSearchQuery(filters: ProductFilterDto): QueryBuilder {
    const queryBuilder = new QueryBuilder();

    // Base filters
    queryBuilder.addCondition('p.status = ?', 'active');
    queryBuilder.addCondition('p.visibility = ?', 'visible');

    // Search filters
    if (filters.search) {
      queryBuilder.addCondition(`
        (p.search_vector @@ plainto_tsquery('english', ?)
          OR p.name ILIKE ?
          OR p.short_description ILIKE ?
          OR ? = ANY(p.tags))
      `, filters.search, `%${filters.search}%`, `%${filters.search}%`, filters.search);
    }

    // Category and brand filters
    queryBuilder.addCondition('p.category_id = ?', filters.category_id);
    queryBuilder.addCondition('p.brand_id = ?', filters.brand_id);
    queryBuilder.addCondition('p.vendor_id = ?', filters.vendor_id);

    // Boolean filters
    queryBuilder.addCondition('p.is_featured = ?', filters.is_featured);
    queryBuilder.addCondition('p.is_bestseller = ?', filters.is_bestseller);
    queryBuilder.addCondition('p.is_new_arrival = ?', filters.is_new_arrival);
    queryBuilder.addCondition('p.is_on_sale = ?', filters.is_on_sale);

    // Price range
    if (filters.min_price !== undefined || filters.max_price !== undefined) {
      const currencyId = filters.currency_id || ProductConfig.DEFAULT_CURRENCY_ID;
      queryBuilder.addRangeCondition(
        `COALESCE((SELECT price FROM product_prices WHERE product_id = p.id AND currency_id = ${currencyId}), p.price)`,
        filters.min_price,
        filters.max_price
      );
    }

    // Additional filters
    if (filters.min_rating !== undefined) {
      queryBuilder.addCondition('p.avg_rating >= ?', filters.min_rating);
    }

    if (filters.tags?.length) {
      queryBuilder.addCondition('p.tags && ?', `{${filters.tags.join(',')}}`);
    }

    if (filters.stock_status) {
      this.addStockStatusFilter(queryBuilder, filters.stock_status);
    }

    return queryBuilder;
  }

  private static addStockStatusFilter(queryBuilder: QueryBuilder, stockStatus: string): void {
    switch (stockStatus) {
      case 'in_stock':
        queryBuilder.addCondition('p.stock_quantity > p.low_stock_threshold');
        break;
      case 'low_stock':
        queryBuilder.addCondition('p.stock_quantity > 0 AND p.stock_quantity <= p.low_stock_threshold');
        break;
      case 'out_of_stock':
        queryBuilder.addCondition('p.stock_quantity = 0');
        break;
    }
  }

  static buildOrderClause(filters: ProductFilterDto): string {
    const { sort_by = 'created_at', sort_direction = 'DESC', search, currency_id = ProductConfig.DEFAULT_CURRENCY_ID } = filters;

    if (search && sort_by === 'relevance') {
      return `ORDER BY
        ts_rank(p.search_vector, plainto_tsquery('english', '${search}')) DESC,
        p.view_count DESC,
        p.total_sales DESC`;
    }

    const validSortFields = {
      'price': `COALESCE((SELECT price FROM product_prices WHERE product_id = p.id AND currency_id = ${currency_id}), p.price)`,
      'created_at': 'p.created_at',
      'name': 'p.name',
      'avg_rating': 'p.avg_rating',
      'total_sales': 'p.total_sales',
      'view_count': 'p.view_count'
    };

    const sortField = validSortFields[sort_by] || validSortFields['created_at'];
    return `ORDER BY ${sortField} ${sort_direction}, p.id DESC`;
  }
}

export class ProductsRepository {
  private readonly productSelectFields = ProductFields.PRODUCT_SELECT;
  private readonly productSearchSelectFields = ProductFields.PRODUCT_SEARCH_SELECT;
  private readonly gallerySelectFields = ProductFields.GALLERY_SELECT;
  private readonly translationSelectFields = ProductFields.TRANSLATION_SELECT;
  private readonly priceSelectFields = ProductFields.PRICE_SELECT;
  private readonly variantSelectFields = ProductFields.VARIANT_SELECT;
  private readonly variantValueSelectFields = ProductFields.VARIANT_VALUE_SELECT;
  private readonly combinationSelectFields = ProductFields.COMBINATION_SELECT;
  private readonly specificationSelectFields = ProductFields.SPECIFICATION_SELECT;

  // ==================== CREATE PRODUCT ====================
  async createProduct(createProductDto: CreateProductDto): Promise<ProductWithDetails> {
    try {
      const productId = await DatabaseHelper.executeInTransaction(async (client: PoolClient) => {
        // 1. Insert main product
        const productSql = `
          INSERT INTO products (
            vendor_id, name, slug, description, short_description, sku, barcode,
            category_id, brand_id, tax_id, base_currency_id, price, compare_price,
            cost_price, margin_percentage, weight, dimensions, shipping_class,
            min_order_quantity, max_order_quantity, stock_quantity, low_stock_threshold,
            track_quantity, sold_individually, virtual_product, downloadable,
            download_limit, download_expiry, meta_title, meta_description, meta_keywords,
            search_keywords, tags, featured_image_url, gallery_urls, video_urls,
            status, visibility, password_protection, is_featured, is_bestseller,
            is_new_arrival, is_on_sale, sale_starts_at, sale_ends_at, publish_at,
            seo_data, product_data, is_active
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
            $45, $46, $47, $48, $49
          )
          RETURNING id, uuid
        `;

        const productParams = ProductDataBuilder.buildProductParams(createProductDto);
        const productResult = await client.query(productSql, productParams);
        const productId = productResult.rows[0].id;

        // 2. Handle related data creation in parallel
        await Promise.all([
          PriceManager.handleProductPrices(client, productId, createProductDto),
          this.handleRelatedDataCreation(client, productId, createProductDto)
        ]);

        // 3. Handle variants and combinations (sequential due to dependencies)
        await this.handleVariantsAndCombinations(client, productId, createProductDto);

        return productId;
      });

      await DatabaseHelper.addToSearchSyncQueue(productId, 'index');

      const product = await this.getProductByIdWithDetails(productId);
      if (!product) {
        throw new Error('Failed to retrieve created product');
      }
      return product;

    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  }

  // ==================== UPDATE PRODUCT ====================
  async updateProduct(productId: number, updateProductDto: UpdateProductDto & { vendor_id: number }): Promise<ProductWithDetails> {
    try {
      await DatabaseHelper.executeInTransaction(async (client: PoolClient) => {
        // 1. Update main product
        const productUpdateData = ProductDataBuilder.buildUpdateProductData(updateProductDto);
        if (Object.keys(productUpdateData).length > 0) {
          const updateResult = await UpsertQuery(
            'products',
            { id: productId, vendor_id: updateProductDto.vendor_id, ...productUpdateData },
            ['id'],
            Object.keys(productUpdateData)
          );

          if (updateResult.rowCount === 0) {
            throw new Error('Product not found or access denied');
          }
        }

        // 2. Handle deletions first
        await this.handleDeletions(client, productId, updateProductDto);

        // 3. Handle updates and inserts in parallel
        await Promise.all([
          PriceManager.handleProductPricesUpdate(client, productId, updateProductDto),
          this.handleRelatedDataUpdates(client, productId, updateProductDto)
        ]);
      });

      await DatabaseHelper.addToSearchSyncQueue(productId, 'update');

      const product = await this.getProductByIdWithDetails(productId);
      if (!product) {
        throw new Error('Failed to retrieve updated product');
      }
      return product;

    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  }

  // ==================== PRODUCT RETRIEVAL ====================
  async getProductByIdWithDetails(productId: number, vendorId?: number): Promise<ProductWithDetails | null> {
    try {
      let productSql = `SELECT ${this.productSelectFields} FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN vendors v ON p.vendor_id = v.id WHERE p.id = $1`;
      const productParams: any[] = [productId];

      if (vendorId) {
        productSql += ` AND p.vendor_id = $2`;
        productParams.push(vendorId);
      }

      const productResult = await SelectQuery<Product>(productSql, productParams);
      if (!productResult.length) return null;

      const product = productResult[0];
      const relatedData = await this.getProductRelatedData(productId);

      return { ...product, ...relatedData };
    } catch (error) {
      console.error('Get product by ID with details error:', error);
      throw error;
    }
  }

  // ==================== PUBLIC SEARCH ====================
  async searchProducts(filters: ProductFilterDto): Promise<ApiResponseFormat<any>> {
    try {
      const { page, perPage, offset } = DatabaseHelper.buildPaginationParams(filters);
      const queryBuilder = QueryBuilderHelper.buildSearchQuery(filters);
      const { whereClause, params } = queryBuilder.build();
      const orderClause = QueryBuilderHelper.buildOrderClause(filters);

      const productSearchSelectFields = `
        p.id, p.uuid, p.name, p.slug, p.short_description, p.sku,
        p.category_id, p.brand_id, p.vendor_id, p.price, p.compare_price,
        COALESCE(pg.url, p.featured_image_url) as featured_image_url,
        pg.media_type, pg.thumbnail_url, pg.alt_text, pg.title as media_title,
        p.is_featured, p.is_bestseller, p.is_new_arrival,
        p.is_on_sale, p.sale_starts_at, p.sale_ends_at, p.avg_rating,
        p.total_reviews, p.total_sales, p.stock_quantity, p.view_count,
        c.name as category_name, b.name as brand_name, v.store_name as vendor_name
      `;

      const baseQuery = `
        SELECT ${productSearchSelectFields}
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN vendors v ON p.vendor_id = v.id
        LEFT JOIN product_gallery pg ON p.id = pg.product_id AND pg.is_primary = true AND pg.is_active = true
        WHERE ${whereClause}
        ${orderClause}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        WHERE ${whereClause}
      `;

      const [products, countResult, aggregations] = await Promise.all([
        SelectQuery(baseQuery, [...params, perPage, offset]),
        SelectQuery<{ total: number }>(countQuery, params),
        this.getSearchAggregations(whereClause, params, filters.currency_id || ProductConfig.DEFAULT_CURRENCY_ID)
      ]);

      const total = countResult[0]?.total || 0;
      const meta = buildPaginationMeta(total, page, perPage);

      return ApiResponse.success({ meta, products, aggregations });

    } catch (error) {
      console.error('Search products error:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================
  private async handleRelatedDataCreation(client: PoolClient, productId: number, dto: CreateProductDto): Promise<void> {
    const operations = [];

    if (dto.gallery?.length) {
      operations.push(GalleryManager.batchInsertGalleryItems(client, productId, dto.gallery));
    }

    if (dto.translations?.length) {
      operations.push(this.batchInsertTranslations(client, productId, dto.translations));
    }

    if (dto.specifications?.length) {
      operations.push(this.batchInsertSpecifications(client, productId, dto.specifications));
    }

    await Promise.all(operations);
  }

  private async handleRelatedDataUpdates(client: PoolClient, productId: number, dto: UpdateProductDto): Promise<void> {
    const operations = [];

    if (dto.gallery?.length) {
      operations.push(GalleryManager.handleGallery(client, productId, dto.gallery, true));
    }

    if (dto.translations?.length) {
      operations.push(this.bulkUpsertTranslations(client, productId, dto.translations));
    }

    if (dto.specifications?.length) {
      operations.push(this.upsertSpecifications(client, productId, dto.specifications));
    }

    if (dto.variants?.length) {
      operations.push(this.upsertVariants(client, productId, dto.variants));
    }

    if (dto.variant_combinations?.length) {
      operations.push(this.upsertCombinationsWithPrices(client, productId, dto.variant_combinations));
    }

    await Promise.all(operations);
  }

  private async handleDeletions(client: PoolClient, productId: number, dto: UpdateProductDto): Promise<void> {
    const deletions = [];

    if (dto.delete_gallery_ids?.length) {
      deletions.push(GalleryManager.deleteGalleryItems(client, productId, dto.delete_gallery_ids));
    }

    if (dto.delete_translation_ids?.length) {
      deletions.push(this.deleteTranslations(client, productId, dto.delete_translation_ids));
    }

    if (dto.delete_combination_ids?.length) {
      deletions.push(this.deleteCombinationsWithPrices(client, productId, dto.delete_combination_ids));
    }

    await Promise.all(deletions);
  }

  private async handleVariantsAndCombinations(client: PoolClient, productId: number, dto: CreateProductDto): Promise<void> {
    const variantValueMap = new Map<string, number>();

    if (dto.variants?.length) {
      const variantIds = await VariantManager.handleVariants(client, productId, dto.variants);

      // Build variant value map for combinations using attribute-based keys
      for (let i = 0; i < dto.variants.length; i++) {
        const variant = dto.variants[i];
        const variantId = variantIds[i];

        if (variant.values) {
          const valuesSql = `
            SELECT id, value, attribute_value_id FROM product_variant_values
            WHERE variant_id = $1 AND is_active = true
          `;
          const valuesResult = await client.query(valuesSql, [variantId]);

          valuesResult.rows.forEach(row => {
            // Use attribute_id-attribute_value_id format for combination keys
            const key = `${variant.attribute_id}-${row.attribute_value_id}`;
            variantValueMap.set(key, row.id);
          });
        }
      }
    }

    if (dto.variant_combinations?.length) {
      await this.insertCombinationsWithPrices(client, productId, dto.variant_combinations, variantValueMap);
    }
  }

  /**  ░░ getProductRelatedData ░░
 *  – only the relevant part that adds `combination_values`
 *  – keep the rest of the method unchanged
 */
  private async getProductRelatedData(productId: number) {
    const [
      gallery,
      translations,
      prices,
      variants,
      combinations,   // ← raw combinations coming from getProductCombinations
      specifications
    ] = await Promise.all([
      this.getProductGallery(productId),
      this.getProductTranslations(productId),
      this.getProductPrices(productId),
      this.getProductVariants(productId),
      this.getProductCombinations(productId),   // ⚠︎ ensure pvcv.id is selected in that helper
      this.getProductSpecifications(productId)
    ]);

    /* 🔑  map the raw “variant_values” into the shape required by the Zod schema */
    const enrichedCombinations = combinations.map(c => ({
      ...c,
      combination_values: (c.variant_values || []).map(v => ({
        id: v.id ?? undefined,                     // Junction-table PK  (pvcv.id)
        variant_value_id: v.variant_value_id,      // FK → product_variant_values.id
        variant_name: v.variant_name,              // e.g. “Color”
        variant_value: v.value                     // e.g. “Red”
      }))
    }));

    return {
      gallery,
      translations,
      prices,
      variants,
      variant_combinations: enrichedCombinations,
      specifications
    };
  }


  // ==================== VARIANTS AND COMBINATIONS (UPDATED) ====================
  private async upsertVariants(client: PoolClient, productId: number, variants: any[]): Promise<void> {
    await VariantManager.handleVariants(client, productId, variants, true);
  }

  private async insertCombinationsWithPrices(client: PoolClient, productId: number, combinations: any[], variantValueMap: Map<string, number>): Promise<void> {
    for (const combination of combinations) {
      const combinationSql = `
        INSERT INTO product_variant_combinations (
          product_id, sku, barcode, base_currency_id, price, compare_price,
          cost_price, weight, dimensions, image_url, stock_quantity,
          low_stock_threshold, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `;

      const combinationParams = [
        productId, combination.sku, combination.barcode,
        combination.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID,
        combination.price, combination.compare_price, combination.cost_price,
        combination.weight, JSON.stringify(combination.dimensions),
        combination.image_url, combination.stock_quantity || 0,
        combination.low_stock_threshold || ProductConfig.DEFAULT_LOW_STOCK_THRESHOLD,
        combination.is_active ?? true
      ];

      const combinationResult = await client.query(combinationSql, combinationParams);
      const combinationId = combinationResult.rows[0].id;

      // Handle variant value IDs using combination_key (format: "1-1|4-23")
      if (combination.combination_key) {
        const resolvedValueIds = this.resolveVariantValueIdsFromKey(combination.combination_key, variantValueMap);
        if (resolvedValueIds.length > 0) {
          await this.batchInsertCombinationValues(client, combinationId, resolvedValueIds);
        }
      }

      // Insert combination prices
      await this.handleCombinationPrices(client, combinationId, combination);
    }
  }

  private resolveVariantValueIdsFromKey(combinationKey: string, variantValueMap: Map<string, number>): number[] {
    const resolvedIds: number[] = [];

    // Parse combination key like "1-1|4-23" to get attribute-value pairs
    const attributeValuePairs = combinationKey.split('|');

    for (const pair of attributeValuePairs) {
      const valueId = variantValueMap.get(pair);
      if (valueId) {
        resolvedIds.push(valueId);
      } else {
        console.warn(`Variant value ID not found for combination key: ${pair}`);
      }
    }

    return resolvedIds;
  }

  private async handleCombinationPrices(client: PoolClient, combinationId: number, combination: any): Promise<void> {
    const baseCurrencyId = combination.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID;
    const prices = combination.prices || [];
    console.log('baseCurrencyId --->', prices);
    console.log('baseCurrencyId --->', combination);

    if (prices.length === 0 && combination.price) {
      prices.push({
        currency_id: baseCurrencyId,
        price: combination.price,
        compare_price: combination.compare_price,
        cost_price: combination.cost_price,
        is_auto_converted: false
      });
    }
    console.log('✌️prices --->', prices);

    const currencies = await CurrencyManager.getActiveCurrencies(client);
    console.log("🚀 ~ ProductsRepository ~ handleCombinationPrices ~ currencies:", currencies)
    const exchangeRates = await CurrencyManager.getExchangeRates(client);
    console.log("🚀 ~ ProductsRepository ~ handleCombinationPrices ~ exchangeRates:", exchangeRates)
    const allPrices = [];

    for (const currency of currencies) {
      console.log('✌️currency --->', currency);
      const existingPrice = prices.find(p => p.currency_id === currency.id);
      console.log("🚀 ~ ProductsRepository ~ handleCombinationPrices ~ existingPrice:", existingPrice)

      if (existingPrice) {
        allPrices.push(existingPrice);
      } else if (combination.price) {
        const exchangeRate = CurrencyManager.getExchangeRate(exchangeRates, baseCurrencyId, currency.id);

        if (exchangeRate !== null) {
          const decimalPlaces = currency.decimal_places || 2;

          allPrices.push({
            currency_id: currency.id,
            price: CurrencyManager.calculateConvertedPrice(combination.price, exchangeRate, decimalPlaces),
            compare_price: combination.compare_price
              ? CurrencyManager.calculateConvertedPrice(combination.compare_price, exchangeRate, decimalPlaces)
              : null,
            cost_price: combination.cost_price
              ? CurrencyManager.calculateConvertedPrice(combination.cost_price, exchangeRate, decimalPlaces)
              : null,
            is_auto_converted: currency.id !== baseCurrencyId
          });
        }
      }
    }
    console.log("🚀 ~ ProductsRepository ~ handleCombinationPrices ~ existingPrice:", allPrices)

    if (allPrices.length > 0) {
      await this.batchInsertCombinationPrices(client, combinationId, allPrices);
    }
  }

  private async upsertCombinationsWithPrices(client: PoolClient, productId: number, combinations: any[]): Promise<void> {
    for (const combination of combinations) {
      if (combination.id) {
        await this.updateExistingCombination(client, productId, combination);
      } else {
        await this.insertNewCombination(client, productId, combination);
      }
    }
  }

  private async updateExistingCombination(client: PoolClient, productId: number, combination: any): Promise<void> {
    const updateSql = `
      UPDATE product_variant_combinations
      SET
        sku = $1, barcode = $2, price = $3, compare_price = $4, cost_price = $5,
        weight = $6, dimensions = $7, image_url = $8, stock_quantity = $9,
        low_stock_threshold = $10, is_active = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 AND product_id = $13
    `;

    await client.query(updateSql, [
      combination.sku, combination.barcode, combination.price,
      combination.compare_price, combination.cost_price, combination.weight,
      JSON.stringify(combination.dimensions), combination.image_url,
      combination.stock_quantity || 0, combination.low_stock_threshold || ProductConfig.DEFAULT_LOW_STOCK_THRESHOLD,
      combination.is_active ?? true, combination.id, productId
    ]);

    // Update combination prices
    if (combination.prices?.length) {
      await this.upsertCombinationPrices(client, combination.id, combination.prices);
    } else {
      await this.handleCombinationPrices(client, combination.id, combination);
    }
  }

  private async insertNewCombination(client: PoolClient, productId: number, combination: any): Promise<void> {
    const insertSql = `
      INSERT INTO product_variant_combinations (
        product_id, sku, barcode, base_currency_id, price, compare_price,
        cost_price, weight, dimensions, image_url, stock_quantity,
        low_stock_threshold, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

    const insertParams = [
      productId, combination.sku, combination.barcode,
      combination.base_currency_id || ProductConfig.DEFAULT_CURRENCY_ID,
      combination.price, combination.compare_price, combination.cost_price,
      combination.weight, JSON.stringify(combination.dimensions),
      combination.image_url, combination.stock_quantity || 0,
      combination.low_stock_threshold || ProductConfig.DEFAULT_LOW_STOCK_THRESHOLD,
      combination.is_active ?? true
    ];

    const result = await client.query(insertSql, insertParams);
    const combinationId = result.rows[0].id;

    await this.handleCombinationPrices(client, combinationId, combination);
  }

  // ==================== SPECIFICATIONS ====================
  private async upsertSpecifications(client: PoolClient, productId: number, specifications: any[]): Promise<void> {
    for (const spec of specifications) {
      if (spec.id) {
        const updateSql = `
          UPDATE product_specifications
          SET
            group_name = $1, name = $2, value = $3, unit = $4,
            sort_order = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
          WHERE id = $7 AND product_id = $8
        `;

        await client.query(updateSql, [
          spec.group_name || 'General', spec.name, spec.value, spec.unit || '',
          spec.sort_order || 0, Boolean(spec.is_active ?? true), spec.id, productId
        ]);
      } else {
        const insertSql = `
          INSERT INTO product_specifications (
            product_id, group_name, name, value, unit, sort_order, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await client.query(insertSql, [
          productId, spec.group_name || 'General', spec.name, spec.value,
          spec.unit || '', spec.sort_order || 0, Boolean(spec.is_active ?? true)
        ]);
      }
    }
  }

  private async deleteSpecifications(client: PoolClient, productId: number, specificationIds: number[]): Promise<void> {
    if (!specificationIds.length) return;

    const sql = `DELETE FROM product_specifications WHERE product_id = $1 AND id = ANY($2)`;
    await client.query(sql, [productId, specificationIds]);
  }

  // ==================== BATCH OPERATIONS ====================
  private async batchInsertSpecifications(client: PoolClient, productId: number, specifications: any[]): Promise<void> {
    if (!specifications.length) return;

    const columns = ['product_id', 'group_name', 'name', 'value', 'unit', 'sort_order', 'is_active'];
    const booleanColumns = ['is_active'];

    const values = specifications.map(spec => [
      productId, spec.group_name || 'General', spec.name, spec.value,
      spec.unit || '', spec.sort_order || 0, Boolean(spec.is_active ?? true)
    ]);

    const { query, values: flatValues } = buildInsertQueryWithBooleanCasting(
      'product_specifications', columns, booleanColumns, values
    );

    await client.query(query, flatValues);
  }

  private async batchInsertTranslations(client: PoolClient, productId: number, translations: any[]): Promise<void> {
    if (!translations.length) return;

    const columns = [
      'product_id', 'language_id', 'name', 'slug', 'description', 'short_description',
      'meta_title', 'meta_description', 'meta_keywords', 'search_keywords', 'tags'
    ];

    const values = translations.map(t => [
      productId, t.language_id, t.name, t.slug, t.description, t.short_description,
      t.meta_title, t.meta_description, t.meta_keywords,
      JSON.stringify(t.search_keywords), JSON.stringify(t.tags)
    ]);

    const query = `
      INSERT INTO product_translations (${columns.join(', ')})
      VALUES ${values.map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`).join(', ')}
    `;

    await client.query(query, values.flat());
  }

  private async batchInsertCombinationValues(client: PoolClient, combinationId: number, variantValueIds: number[]): Promise<void> {
    if (!variantValueIds.length) return;

    const columns = ['combination_id', 'variant_value_id'];
    const values = variantValueIds.map(id => [combinationId, id]);

    const query = `
      INSERT INTO product_variant_combination_values (${columns.join(', ')})
      VALUES ${values.map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`).join(', ')}
    `;

    await client.query(query, values.flat());
  }

  private async batchInsertCombinationPrices(client: PoolClient, combinationId: number, prices: any[]): Promise<void> {
    if (!prices.length) return;

    const columns = [
      'combination_id', 'currency_id', 'price', 'compare_price', 'cost_price', 'is_auto_converted'
    ];

    const values = prices.map(price => [
      combinationId, price.currency_id, price.price, price.compare_price,
      price.cost_price, price.is_auto_converted || false
    ]);
    console.log("🚀 ~ ProductsRepository ~ batchInsertCombinationPrices ~ prices:", prices)

    const query = `
      INSERT INTO product_variant_prices (${columns.join(', ')})
      VALUES ${values.map((_, i) => `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`).join(', ')}
      ON CONFLICT (combination_id, currency_id)
      DO UPDATE SET
        price = EXCLUDED.price,
        compare_price = EXCLUDED.compare_price,
        cost_price = EXCLUDED.cost_price,
        is_auto_converted = EXCLUDED.is_auto_converted,
        updated_at = CURRENT_TIMESTAMP
    `;
    console.log(`'query'`, query)
    await client.query(query, values.flat());
  }

  // ==================== UPSERT OPERATIONS ====================
  private async bulkUpsertTranslations(client: PoolClient, productId: number, translations: any[]): Promise<void> {
    if (!translations.length) return;

    const records = translations.map(t => ({
      id: t.id,
      product_id: productId,
      language_id: t.language_id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      short_description: t.short_description,
      meta_title: t.meta_title,
      meta_description: t.meta_description,
      meta_keywords: t.meta_keywords,
      search_keywords: JSON.stringify(t.search_keywords),
      tags: JSON.stringify(t.tags)
    }));

    await BulkUpsert('product_translations', records, ['id'], [
      'name', 'slug', 'description', 'short_description', 'meta_title',
      'meta_description', 'meta_keywords', 'search_keywords', 'tags'
    ]);
  }

  private async upsertCombinationPrices(client: PoolClient, combinationId: number, prices: any[]): Promise<void> {
    if (!prices.length) return;

    for (const price of prices) {
      if (price.id) {
        const updateSql = `
          UPDATE product_variant_prices
          SET
            price = $1, compare_price = $2, cost_price = $3,
            is_auto_converted = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5 AND combination_id = $6
        `;

        await client.query(updateSql, [
          price.price, price.compare_price, price.cost_price,
          price.is_auto_converted || false, price.id, combinationId
        ]);
      } else {
        const insertSql = `
          INSERT INTO product_variant_prices (
            combination_id, currency_id, price, compare_price, cost_price, is_auto_converted
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (combination_id, currency_id)
          DO UPDATE SET
            price = EXCLUDED.price,
            compare_price = EXCLUDED.compare_price,
            cost_price = EXCLUDED.cost_price,
            is_auto_converted = EXCLUDED.is_auto_converted,
            updated_at = CURRENT_TIMESTAMP
        `;

        await client.query(insertSql, [
          combinationId, price.currency_id, price.price,
          price.compare_price, price.cost_price, price.is_auto_converted || false
        ]);
      }
    }
  }

  // ==================== DELETE OPERATIONS ====================
  private async deleteTranslations(client: PoolClient, productId: number, translationIds: number[]): Promise<void> {
    if (!translationIds.length) return;

    const sql = `DELETE FROM product_translations WHERE product_id = $1 AND id = ANY($2)`;
    await client.query(sql, [productId, translationIds]);
  }

  private async deleteCombinationsWithPrices(client: PoolClient, productId: number, combinationIds: number[]): Promise<void> {
    if (!combinationIds.length) return;

    // Delete combination prices first (due to foreign key constraint)
    const deletePricesSql = `DELETE FROM product_variant_prices WHERE combination_id = ANY($1)`;
    await client.query(deletePricesSql, [combinationIds]);

    // Delete combination values
    const deleteValuesSql = `DELETE FROM product_variant_combination_values WHERE combination_id = ANY($1)`;
    await client.query(deleteValuesSql, [combinationIds]);

    // Delete combinations
    const deleteCombinationsSql = `DELETE FROM product_variant_combinations WHERE product_id = $1 AND id = ANY($2)`;
    await client.query(deleteCombinationsSql, [productId, combinationIds]);
  }

  // ==================== DATA RETRIEVAL METHODS (UPDATED) ====================
  private async getProductSpecifications(productId: number): Promise<any[]> {
    try {
      const sql = `
        SELECT ${this.specificationSelectFields}
        FROM product_specifications ps
        WHERE ps.product_id = $1 AND ps.is_active = true
        ORDER BY ps.group_name, ps.sort_order, ps.id
      `;
      return await SelectQuery(sql, [productId]);
    } catch (error) {
      console.error('Get product specifications error:', error);
      return [];
    }
  }

  private async getProductCombinations(productId: number): Promise<any[]> {
    try {
      const combinationsSql = `
        SELECT ${this.combinationSelectFields}
        FROM product_variant_combinations pvc
        WHERE pvc.product_id = $1 AND pvc.is_active = true
        ORDER BY pvc.id
      `;
      const combinations = await SelectQuery(combinationsSql, [productId]);

      const combinationPromises = combinations.map(async combination => {
        const [variantValues, prices] = await Promise.all([
          SelectQuery(`
            SELECT 
              pvcv.variant_value_id, pvv.value, pvv.attribute_value_id, pvv.variant_id, 
              pv.name as variant_name, pv.attribute_id,
              a.name as attribute_name, a.slug as attribute_slug,
              av.value as attribute_value, av.color_code, av.image_url as attribute_image_url
            FROM product_variant_combination_values pvcv
            JOIN product_variant_values pvv ON pvcv.variant_value_id = pvv.id
            JOIN product_variants pv ON pvv.variant_id = pv.id
            LEFT JOIN attributes a ON pv.attribute_id = a.id
            LEFT JOIN attribute_values av ON pvv.attribute_value_id = av.id
            WHERE pvcv.combination_id = $1
          `, [combination.id]),

          SelectQuery(`
            SELECT pvp.currency_id, pvp.price, pvp.compare_price, pvp.cost_price, pvp.is_auto_converted
            FROM product_variant_prices pvp
            WHERE pvp.combination_id = $1
          `, [combination.id])
        ]);

        return { ...combination, variant_values: variantValues, prices: prices };
      });

      return await Promise.all(combinationPromises);
    } catch (error) {
      console.error('Get product combinations error:', error);
      return [];
    }
  }

  private async getProductVariants(productId: number): Promise<any[]> {
    try {
      const variantsSql = `
        SELECT ${this.variantSelectFields}
        FROM product_variants pv
        LEFT JOIN attributes a ON pv.attribute_id = a.id
        WHERE pv.product_id = $1 AND pv.is_active = true
        ORDER BY pv.sort_order, pv.id
      `;
      const variants = await SelectQuery(variantsSql, [productId]);

      const variantValuePromises = variants.map(variant => {
        const valuesSql = `
          SELECT ${this.variantValueSelectFields}
          FROM product_variant_values pvv
          LEFT JOIN attribute_values av ON pvv.attribute_value_id = av.id
          WHERE pvv.variant_id = $1 AND pvv.is_active = true
          ORDER BY pvv.sort_order, pvv.id
        `;
        return SelectQuery(valuesSql, [variant.id]);
      });

      const allVariantValues = await Promise.all(variantValuePromises);
      variants.forEach((variant, index) => {
        variant.values = allVariantValues[index];
      });

      return variants;
    } catch (error) {
      console.error('Get product variants error:', error);
      return [];
    }
  }

  private async getProductAttributes(productId: number): Promise<any[]> {
    try {
      const sql = `
        SELECT pa.id, pa.attribute_id, pa.attribute_value_id, pa.custom_value,
               pa.is_variation, pa.sort_order,
               a.name as attribute_name, a.slug as attribute_slug, a.type as attribute_type,
               av.value as attribute_value, av.color_code, av.image_url
        FROM product_attributes pa
        LEFT JOIN attributes a ON pa.attribute_id = a.id
        LEFT JOIN attribute_values av ON pa.attribute_value_id = av.id
        WHERE pa.product_id = $1
        ORDER BY pa.sort_order, pa.id
      `;
      return await SelectQuery(sql, [productId]);
    } catch (error) {
      console.error('Get product attributes error:', error);
      return [];
    }
  }

  private async getProductTranslations(productId: number, languageId?: number): Promise<any[]> {
    try {
      let sql = `
        SELECT ${this.translationSelectFields}
        FROM product_translations pt
        WHERE pt.product_id = $1
      `;
      const params = [productId];

      if (languageId) {
        sql += ` AND pt.language_id = $2`;
        params.push(languageId);
      }

      sql += ` ORDER BY pt.language_id`;
      return await SelectQuery(sql, params);
    } catch (error) {
      console.error('Get product translations error:', error);
      return [];
    }
  }

  private async getProductPrices(productId: number, currencyId?: number): Promise<any[]> {
    try {
      let sql = `
        SELECT ${this.priceSelectFields}
        FROM product_prices pp
        WHERE pp.product_id = $1
      `;
      const params = [productId];

      if (currencyId) {
        sql += ` AND pp.currency_id = $2`;
        params.push(currencyId);
      }

      sql += ` ORDER BY pp.currency_id`;
      return await SelectQuery(sql, params);
    } catch (error) {
      console.error('Get product prices error:', error);
      return [];
    }
  }

  private async getProductGallery(productId: number): Promise<any[]> {
    try {
      const sql = `
        SELECT ${this.gallerySelectFields}
        FROM product_gallery pg
        WHERE pg.product_id = $1 AND pg.is_active = true
        ORDER BY pg.sort_order, pg.id
      `;
      return await SelectQuery(sql, [productId]);
    } catch (error) {
      console.error('Get product gallery error:', error);
      return [];
    }
  }

  // ==================== AGGREGATION METHODS ====================
  private async getSearchAggregations(whereClause: string, params: any[], currencyId: number) {
    const currencyParamPos = params.length + 1;

    const [totalValueResult, avgPriceResult, topCategoriesResult, topBrandsResult] = await Promise.all([
      SelectQuery<{ total_value: number }>(`
        SELECT SUM(COALESCE((SELECT price FROM product_prices WHERE product_id = p.id AND currency_id = $${currencyParamPos}), p.price)) as total_value
        FROM products p WHERE ${whereClause}
      `, [...params, currencyId]),

      SelectQuery<{ avg_price: number }>(`
        SELECT AVG(COALESCE((SELECT price FROM product_prices WHERE product_id = p.id AND currency_id = $${currencyParamPos}), p.price)) as avg_price
        FROM products p WHERE ${whereClause}
      `, [...params, currencyId]),

      SelectQuery<{ name: string; count: number }>(`
        SELECT c.name, COUNT(p.id)::int as count
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE ${whereClause}
        GROUP BY c.id, c.name
        ORDER BY count DESC
        LIMIT 5
      `, params),

      SelectQuery<{ name: string; count: number }>(`
        SELECT b.name, COUNT(p.id)::int as count
        FROM products p
        JOIN brands b ON p.brand_id = b.id
        WHERE ${whereClause} AND p.brand_id IS NOT NULL
        GROUP BY b.id, b.name
        ORDER BY count DESC
        LIMIT 5
      `, params)
    ]);

    return {
      totalValue: totalValueResult[0]?.total_value || 0,
      avgPrice: avgPriceResult || 0,
      topCategories: topCategoriesResult,
      topBrands: topBrandsResult
    };
  }

  // ==================== PUBLIC METHODS ====================
  async getProductById(productId: number): Promise<Product | null> {
    try {
      const sql = `SELECT ${this.productSelectFields} FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN vendors v ON p.vendor_id = v.id WHERE p.id = $1`;
      const result = await SelectQuery<Product>(sql, [productId]);
      return result[0] || null;
    } catch (error) {
      console.error('Get product by ID error:', error);
      throw error;
    }
  }

  async deleteProduct(productId: number): Promise<boolean> {
    try {
      return await DatabaseHelper.executeInTransaction(async (client: PoolClient) => {
        await DatabaseHelper.addToSearchSyncQueue(productId, 'delete');

        const sql = `DELETE FROM products WHERE id = $1 RETURNING id`;
        const result = await client.query(sql, [productId]);
        return result.rows.length > 0;
      });
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  }

  async approveProduct(productId: number, approvalDto: ApprovalDto, adminId: number): Promise<Product | null> {
    try {
      const status = approvalDto.status || ProductStatus.ACTIVE;
      const sql = `
        UPDATE products
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING ${this.productSelectFields}
      `;
      const result = await UpdateQuery(sql, [status, productId]);

      if (result.rows.length > 0) {
        await DatabaseHelper.addToSearchSyncQueue(productId, 'update');
        return result.rows[0] as Product;
      }
      return null;
    } catch (error) {
      console.error('Approve product error:', error);
      throw error;
    }
  }

  async quickSearch(query: string, limit: number = 10, languageId?: number): Promise<any[]> {
    try {
      const searchQuery = `
        SELECT
          p.id, p.name, p.slug, p.featured_image_url, p.price, p.avg_rating,
          c.name as category_name, b.name as brand_name,
          ts_rank(p.search_vector, plainto_tsquery('english', $1)) as rank
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.status = 'active'
        AND p.visibility = 'visible'
        AND (
          p.search_vector @@ plainto_tsquery('english', $2)
          OR p.name ILIKE $3
          OR p.sku ILIKE $4
        )
        ORDER BY rank DESC, p.total_sales DESC, p.view_count DESC
        LIMIT $5
      `;

      const searchPattern = `%${query}%`;
      return await SelectQuery(searchQuery, [query, query, searchPattern, searchPattern, limit]);
    } catch (error) {
      console.error('Quick search error:', error);
      throw error;
    }
  }

  async getTrendingProducts(limit: number = 20, period: string = '7days', languageId?: number): Promise<any[]> {
    try {
      const daysBack = period === '24hours' ? 1 : period === '7days' ? 7 : 30;

      const trendingQuery = `
        SELECT ${this.productSearchSelectFields},
          (p.view_count * ${ProductConfig.TREND_CALCULATION_WEIGHTS.view} + p.total_sales * ${ProductConfig.TREND_CALCULATION_WEIGHTS.sales}) as trend_score
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN vendors v ON p.vendor_id = v.id
        WHERE p.status = 'active'
        AND p.visibility = 'visible'
        AND p.created_at >= NOW() - INTERVAL '${daysBack} days'
        ORDER BY trend_score DESC, p.avg_rating DESC
        LIMIT $1
      `;

      return await SelectQuery(trendingQuery, [limit]);
    } catch (error) {
      console.error('Get trending products error:', error);
      throw error;
    }
  }

  async getRecommendations(productId: number, limit: number = 10, languageId?: number): Promise<any[]> {
    try {
      const recommendationQuery = `
        WITH product_info AS (
          SELECT category_id, brand_id, price, tags
          FROM products WHERE id = $1
        ),
        similar_products AS (
          SELECT ${this.productSearchSelectFields},
            CASE
              WHEN p.category_id = pi.category_id THEN 30
              ELSE 0
            END +
            CASE
              WHEN p.brand_id = pi.brand_id THEN 20
              ELSE 0
            END +
            CASE
              WHEN ABS(p.price - pi.price) <= pi.price * 0.3 THEN 15
              ELSE 0
            END +
            CASE
              WHEN p.tags && pi.tags THEN 10
              ELSE 0
            END as similarity_score
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN brands b ON p.brand_id = b.id
          LEFT JOIN vendors v ON p.vendor_id = v.id
          CROSS JOIN product_info pi
          WHERE p.id != $2
          AND p.status = 'active'
          AND p.visibility = 'visible'
        )
        SELECT * FROM similar_products
        WHERE similarity_score > 0
        ORDER BY similarity_score DESC, avg_rating DESC, total_sales DESC
        LIMIT $3
      `;

      return await SelectQuery(recommendationQuery, [productId, productId, limit]);
    } catch (error) {
      console.error('Get recommendations error:', error);
      throw error;
    }
  }

  async getPublicProducts(filters: ProductFilterDto): Promise<ApiResponseFormat<Product>> {
    const publicFilters: any = {
      ...filters,
      status: 'active',
      visibility: 'visible'
    };

    return this.searchProducts(publicFilters);
  }

  async getPublicProductByIdWithDetails(
    productId: number,
    languageId?: number,
    currencyId: number = 1,
    userId?: number,
    combinationId?: number,
    includeReviews: boolean = true,
    includeRelated: boolean = true,
    reviewsPage: number = 1,
    reviewsLimit: number = 10
  ): Promise<any> {
    /* ── ① small read helpers ─────────────────────────────── */
    const onePrice = (list: any[]) => list.find(p => p.currency_id === currencyId);

    /* ── ② fetch base product ─────────────────────────────── */
    const baseSql = `
    SELECT ${this.productSelectFields}
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN vendors    v ON p.vendor_id    = v.id
    WHERE p.id = $1 AND p.status='active' AND p.visibility='visible'
  `;
    const baseRows = await SelectQuery<Product>(baseSql, [productId]);
    if (!baseRows.length) return null;
    const prod = baseRows[0];

    /* ── ③ parallel secondary data ────────────────────────── */
    const [
      galleryRows, translationsRows, priceRows, variantsRows,
      combRows, specsRows, reviewRows, ratingRow,
      faqsRows, relatedRows, seoRow, wishRow
    ] = await Promise.all([
      this.getProductGallery(productId),
      this.getProductTranslations(productId, languageId),
      this.getProductPrices(productId, currencyId),     // only ONE currency now
      this.getProductVariants(productId),
      this.getEnhancedProductCombinations(productId, currencyId),
      this.getProductSpecifications(productId),
      includeReviews ? this.getProductReviews(productId, reviewsLimit, (reviewsPage - 1) * reviewsLimit) : [],
      includeReviews ? this.getProductRatingStats(productId) : {},
      this.getProductFAQs(productId),
      includeRelated ? this.getRelatedProducts(productId) : [],
      this.getProductSEOData(productId, languageId),
      this.getProductWishlistStatus(productId, userId)
    ]);

    /* ── ④ derive effective pricing / stock ───────────────── */
    const priceObj = onePrice(priceRows) || { price: prod.price, compare_price: prod.compare_price };
    const basePrice = priceObj.price;
    const baseCompare = priceObj.compare_price;
    const currency = priceObj.currency_id ? await SelectQuery<Currency>(
      'SELECT id,code,symbol,decimal_places FROM currencies WHERE id=$1 LIMIT 1', [priceObj.currency_id])
      : [{ id: 3, code: 'INR', symbol: '₹', decimal_places: 2 }];
    const { percent: discountPercent, savings } = calcDiscount(baseCompare, basePrice);

    /* ── ⑤ map combinations & optionally pick one ─────────── */
    const combinations = mapCombinations(combRows, currencyId);
    const selectedComb = combinationId ? combinations.find(c => c.id === combinationId) : undefined;
    console.log("🚀 ~ ProductsRepository ~ getPublicProductByIdWithDetails ~ selectedComb:", selectedComb)
    console.log("🚀 ~ ProductsRepository ~ getPublicProductByIdWithDetails ~ ratingRow:", ratingRow)
    const effPrice = selectedComb?.price ?? basePrice;
    const effCompare = selectedComb?.comparePrice ?? baseCompare;
    const effStockQty = selectedComb?.stockQuantity ?? prod.stock_quantity;
    const effStockStat = selectedComb?.stockStatus ??
      (effStockQty === 0
        ? 'out_of_stock'
        : effStockQty <= prod.low_stock_threshold ? 'low_stock' : 'in_stock');
    const { percent: effDiscount, savings: effSavings } = calcDiscount(effCompare, effPrice);

    /* ── ⑥ build lean payload ─────────────────────────────── */
    return {
      id: prod.id,
      uuid: prod.uuid,
      slug: prod.slug,
      name: prod.name,
      shortDescription: prod.short_description,
      description: prod.description,
      sku: prod.sku,
      /* pricing */
      price: effPrice,
      comparePrice: effCompare,
      currency: {
        id: currency[0].id,
        code: currency[0].code,
        symbol: currency[0].symbol,
        decimals: currency[0].decimal_places
      },
      discountPercent: effDiscount,
      savings,
      /* stock */
      trackQuantity: prod.track_quantity,
      stockQuantity: effStockQty,
      stockStatus: effStockStat,
      minOrderQty: prod.min_order_quantity,
      maxOrderQty: prod.max_order_quantity,
      soldIndividually: prod.sold_individually,
      /* vendor */
      vendor: { id: prod.vendor_id, name: prod.vendor_name },
      /* shipping */
      weight: selectedComb ? selectedComb[0]?.weight ?? prod.weight : null,
      dimensions: prod.dimensions,
      shippingClass: prod.shipping_class,
      /* media */
      featuredImage: prod.featured_image_url,
      gallery: mapGallery(galleryRows),
      videoUrls: prod.video_urls,
      /* variants & combinations */
      variants: mapVariants(variantsRows),
      combinations: combinations,
      /* ratings & reviews */
      rating: buildRatingStats(ratingRow),
      reviews: includeReviews ? mapReviews(reviewRows) : [],
      reviewMeta: includeReviews ? {
        page: reviewsPage,
        perPage: reviewsLimit,
        //@ts-ignore
        hasMore: (ratingRow.total_reviews ?? 0) > reviewsPage * reviewsLimit
      } : undefined,
      /* FAQs & related */
      faqs: faqsRows,
      related: relatedRows,
      /* wishlist */
      isWishlisted: wishRow.is_wishlisted,
      /* SEO */
      seo: {
        title: seoRow?.translated_meta_title ?? seoRow?.meta_title,
        description: seoRow?.translated_meta_description ?? seoRow?.meta_description,
        keywords: seoRow?.translated_meta_keywords ?? seoRow?.meta_keywords
      },
      structuredData: this.buildStructuredData(prod, effPrice, effStockQty, discountPercent),
      /* misc */
      createdAt: prod.created_at,
      updatedAt: prod.updated_at
    };
  }

  private buildStructuredData(p: any, price: number, qty: number, discount: number) {
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: p.name,
      description: p.description ?? p.short_description,
      sku: p.sku,
      image: p.featured_image_url,
      offers: {
        "@type": "Offer",
        price,
        priceCurrency: "USD", // already converted
        availability: qty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      },
      ...(discount > 0 && { discount })
    };
  } ṣ
  async getVendorProducts(vendorId: number, filters: ProductFilterDto): Promise<ApiResponseFormat<any>> {
    try {
      const params: any[] = [];
      let paramIndex = 1;

      let baseQuery = `SELECT ${this.productSelectFields} FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN vendors v ON p.vendor_id = v.id`;

      const { whereClause, paramIndex: newParamIndex } = this.buildProductWhereClause(
        vendorId, filters, params, paramIndex
      );
      baseQuery += ` WHERE ${whereClause}`;

      const total = await getTotalCount(baseQuery, params);

      const { sort_by = 'created_at', sort_direction = 'DESC' } = filters;
      const orderClause = ` ORDER BY p.${sort_by} ${sort_direction}`;
      let sql = baseQuery + orderClause;

      const { page, perPage, offset } = DatabaseHelper.buildPaginationParams(filters);

      sql += ` LIMIT $${newParamIndex} OFFSET $${newParamIndex + 1}`;
      params.push(perPage, offset);

      const result = await SelectQuery(sql, params);
      const meta = buildPaginationMeta(total, page, perPage);

      return ApiResponse.success({ meta, products: result });
    } catch (error) {
      console.error('Error in getVendorProducts:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  private buildProductWhereClause(
    vendorId: number,
    filters: ProductFilterDto,
    params: any[],
    paramIndex: number,
  ): { whereClause: string; paramIndex: number } {
    const conditions: string[] = [];
    let currentParamIndex = paramIndex;

    conditions.push(`p.vendor_id = $${currentParamIndex++}`);
    params.push(vendorId);

    if (filters.search) {
      conditions.push(`(p.name ILIKE $${currentParamIndex} OR p.sku ILIKE $${currentParamIndex})`);
      params.push(`%${filters.search}%`);
      currentParamIndex++;
    }

    if (filters.status) {
      conditions.push(`p.status = $${currentParamIndex++}`);
      params.push(filters.status);
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    return { whereClause, paramIndex: currentParamIndex };
  }

  async getPublicProductBySlugWithDetails(slug: string, languageId?: number, currencyId?: number): Promise<ProductWithDetails | null> {
    try {
      const sql = `
        SELECT ${this.productSelectFields}
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN vendors v ON p.vendor_id = v.id
        WHERE p.slug = $1 AND p.status = 'active' AND p.visibility = 'visible'
      `;
      const result = await SelectQuery<Product>(sql, [slug]);

      if (!result.length) return null;

      const product = result[0];

      const [gallery, translations, prices, variants, combinations, specifications] = await Promise.all([
        this.getProductGallery(product.id),
        this.getProductTranslations(product.id, languageId),
        this.getProductPrices(product.id, currencyId),
        this.getProductVariants(product.id),
        this.getProductCombinations(product.id),
        this.getProductSpecifications(product.id)
      ]);

      return {
        ...product,
        gallery,
        translations,
        prices,
        variants,
        variant_combinations: combinations,
        specifications
      };
    } catch (error) {
      console.error('Get public product by slug error:', error);
      throw error;
    }
  }

  async incrementViewCount(productId: number): Promise<void> {
    try {
      const sql = `UPDATE products SET view_count = view_count + 1 WHERE id = $1`;
      await UpdateQuery(sql, [productId]);
    } catch (error) {
      console.error('Increment view count error:', error);
      // Don't throw, this is not critical
    }
  }

  async getProductFilters(options: {
    category_id?: number;
    brand_id?: number;
    vendor_id?: number;
    search?: string;
    language_id?: number;
    currency_id?: number;
  }): Promise<{
    priceRange: { min_price: number; max_price: number };
    brands: Array<{ id: number; name: string; product_count: number }>;
    categories: Array<{ id: number; name: string; product_count: number }>;
    vendors: Array<{ id: number; name: string; product_count: number }>;
    variants: Array<{
      id: number;
      name: string;
      values:
      Array<{ id: number; value: string; count: number }>
    }>;
    stockStatus: Array<{ status: string; count: number }>;
    ratings: Array<{ rating: number; count: number }>;
  }> {
    try {
      const { category_id, brand_id, vendor_id, search, currency_id = ProductConfig.DEFAULT_CURRENCY_ID } = options;

      const queryBuilder = new QueryBuilder();
      queryBuilder.addCondition('p.status = ?', 'active');
      queryBuilder.addCondition('p.visibility = ?', 'visible');
      queryBuilder.addCondition('p.category_id = ?', category_id);
      queryBuilder.addCondition('p.brand_id = ?', brand_id);
      queryBuilder.addCondition('p.vendor_id = ?', vendor_id);

      if (search) {
        queryBuilder.addCondition('p.search_vector @@ plainto_tsquery(\'english\', ?)', search);
      }

      const { whereClause, params } = queryBuilder.build();
      const baseParamCount = params.length;

      const [
        priceRangeResult,
        brandsResult,
        categoriesResult,
        vendorsResult,
        variantsResult,
        stockStatusResult,
        ratingsResult
      ] = await Promise.all([
        SelectQuery<{ min_price: number; max_price: number }>(`
        SELECT
          COALESCE(MIN(CASE WHEN pp.currency_id = $${baseParamCount + 1} THEN pp.price ELSE p.price END), 0) as min_price,
          COALESCE(MAX(CASE WHEN pp.currency_id = $${baseParamCount + 2} THEN pp.price ELSE p.price END), 0) as max_price
        FROM products p
        LEFT JOIN product_prices pp ON p.id = pp.product_id AND pp.currency_id = $${baseParamCount + 3}
        WHERE ${whereClause}
      `, [...params, currency_id, currency_id, currency_id]),

        SelectQuery<{ id: number; name: string; product_count: number }>(`
        SELECT DISTINCT b.id, b.name, COUNT(p.id)::int as product_count
        FROM products p
        JOIN brands b ON p.brand_id = b.id
        WHERE ${whereClause} AND p.brand_id IS NOT NULL
        GROUP BY b.id, b.name
        HAVING COUNT(p.id) > 0
        ORDER BY product_count DESC, b.name
      `, params),

        SelectQuery<{ id: number; name: string; product_count: number }>(`
        SELECT DISTINCT c.id, c.name, COUNT(p.id)::int as product_count
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE ${whereClause} AND p.category_id IS NOT NULL
        GROUP BY c.id, c.name
        HAVING COUNT(p.id) > 0
        ORDER BY product_count DESC, c.name
      `, params),

        SelectQuery<{ id: number; name: string; product_count: number }>(`
        SELECT DISTINCT v.id, v.store_name as name, COUNT(p.id)::int as product_count
        FROM products p
        JOIN vendors v ON p.vendor_id = v.id
        WHERE ${whereClause}
        GROUP BY v.id, v.store_name
        HAVING COUNT(p.id) > 0
        ORDER BY product_count DESC, v.store_name
      `, params),

        // UPDATED: Get variants with attribute information
        SelectQuery<{
          variant_id: number;
          variant_name: string;
          attribute_id: number;
          attribute_name: string;
          value_id: number;
          value: string;
          attribute_value_id: number;
          count: number
        }>(`
        SELECT
          pv.id as variant_id,
          pv.name as variant_name,
          pv.attribute_id,
          a.name as attribute_name,
          pvv.id as value_id,
          pvv.value,
          pvv.attribute_value_id,
          COUNT(DISTINCT p.id)::int as count
        FROM products p
        JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
        LEFT JOIN attributes a ON pv.attribute_id = a.id
        JOIN product_variant_values pvv ON pv.id = pvv.variant_id AND pvv.is_active = true
        WHERE ${whereClause}
        GROUP BY pv.id, pv.name, pv.attribute_id, a.name, pvv.id, pvv.value, pvv.attribute_value_id
        HAVING COUNT(DISTINCT p.id) > 0
        ORDER BY pv.sort_order, pv.name, pvv.sort_order, pvv.value
      `, params),

        SelectQuery<{ status: string; count: number }>(`
        SELECT
          CASE
            WHEN p.stock_quantity = 0 THEN 'out_of_stock'
            WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
            ELSE 'in_stock'
          END as status,
          COUNT(p.id)::int as count
        FROM products p
        WHERE ${whereClause}
        GROUP BY status, p.stock_quantity , p.low_stock_threshold
        HAVING COUNT(p.id) > 0
      `, params),

        SelectQuery<{ rating: number; count: number }>(`
        SELECT
          FLOOR(p.avg_rating) as rating,
          COUNT(p.id)::int as count
        FROM products p
        WHERE ${whereClause} AND p.avg_rating > 0
        GROUP BY FLOOR(p.avg_rating)
        ORDER BY rating DESC
      `, params)
      ]);

      // Group variants by variant with enhanced attribute information
      const variantsMap = new Map();
      variantsResult.forEach(variant => {
        if (!variantsMap.has(variant.variant_id)) {
          variantsMap.set(variant.variant_id, {
            id: variant.variant_id,
            name: variant.variant_name,
            attribute_id: variant.attribute_id,
            attribute_name: variant.attribute_name,
            values: []
          });
        }
        variantsMap.get(variant.variant_id).values.push({
          id: variant.value_id,
          value: variant.value,
          attribute_value_id: variant.attribute_value_id,
          count: variant.count
        });
      });

      const stockStatusUnique: any = Object.values(
        stockStatusResult.reduce((acc, item) => {
          if (!acc[item.status]) {
            acc[item.status] = { ...item };
          } else {
            acc[item.status].count += item.count;
          }
          return acc;
        }, {})
      );

      return {
        priceRange: priceRangeResult[0] || { min_price: 0, max_price: 0 },
        brands: brandsResult,
        categories: categoriesResult,
        vendors: vendorsResult,
        variants: Array.from(variantsMap.values()),
        stockStatus: stockStatusUnique,
        ratings: ratingsResult
      };
    } catch (error) {
      console.error('Get product filters error:', error);
      throw error;
    }
  }

  async findProductById(id: number): Promise<ApiResponseFormat<any>> {
    try {
      const sql = `
        SELECT ${this.productSearchSelectFields}
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN vendors v ON p.vendor_id = v.id
        WHERE p.id = $1
      `;
      const result = await SelectQuery(sql, [id]);

      if (result.length === 0) {
        return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
      }

      return ApiResponse.success(result[0]);
    } catch (error) {
      console.error('Find product by ID error:', error);
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async getProductsByIds(productIds: number[]): Promise<Product[]> {
    try {
      if (!productIds.length) return [];

      const sql = `
        SELECT ${this.productSearchSelectFields}
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN vendors v ON p.vendor_id = v.id
        WHERE p.id = ANY($1)
        ORDER BY p.id
      `;

      return await SelectQuery<Product>(sql, [productIds]);
    } catch (error) {
      console.error('Get products by IDs error:', error);
      return [];
    }
  }

  async bulkUpdateProductStatus(productIds: number[], status: ProductStatus): Promise<boolean> {
    try {
      return await DatabaseHelper.executeInTransaction(async (client: PoolClient) => {
        const sql = `
          UPDATE products
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($2)
        `;

        const result = await client.query(sql, [status, productIds]);

        // Add all products to search sync queue
        for (const productId of productIds) {
          await DatabaseHelper.addToSearchSyncQueue(productId, 'update');
        }

        return result.rowCount > 0;
      });
    } catch (error) {
      console.error('Bulk update product status error:', error);
      throw error;
    }
  }

  async getProductAnalytics(vendorId: number, dateRange?: { from: Date; to: Date }): Promise<{
    totalProducts: number;
    activeProducts: number;
    totalSales: number;
    totalRevenue: number;
    topProducts: Array<{ id: number; name: string; sales: number; revenue: number }>;
  }> {
    try {
      const queryBuilder = new QueryBuilder();
      queryBuilder.addCondition('p.vendor_id = ?', vendorId);

      if (dateRange) {
        queryBuilder.addRangeCondition('p.created_at', dateRange.from, dateRange.to);
      }

      const { whereClause, params } = queryBuilder.build();

      const [analyticsResult, topProductsResult] = await Promise.all([
        SelectQuery<{
          total_products: number;
          active_products: number;
          total_sales: number;
          total_revenue: number;
        }>(`
          SELECT
            COUNT(*) as total_products,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
            SUM(total_sales) as total_sales,
            SUM(total_sales * price) as total_revenue
          FROM products p
          WHERE ${whereClause}
        `, params),

        SelectQuery<{
          id: number;
          name: string;
          sales: number;
          revenue: number;
        }>(`
          SELECT p.id, p.name, p.total_sales as sales, (p.total_sales * p.price) as revenue
          FROM products p
          WHERE ${whereClause}
          ORDER BY p.total_sales DESC
          LIMIT 10
        `, params)
      ]);

      const analytics = analyticsResult[0] || {
        total_products: 0,
        active_products: 0,
        total_sales: 0,
        total_revenue: 0
      };

      return {
        totalProducts: analytics.total_products,
        activeProducts: analytics.active_products,
        totalSales: analytics.total_sales || 0,
        totalRevenue: analytics.total_revenue || 0,
        topProducts: topProductsResult
      };
    } catch (error) {
      console.error('Get product analytics error:', error);
      throw error;
    }
  }

  // ==================== NEW METHODS USER SIDE ====================
  // ==================== HELPER METHODS FOR ENHANCED PUBLIC PRODUCT ====================

  private async getProductReviews(productId: number, limit: number = 10, offset: number = 0): Promise<any[]> {
    try {
      const sql = `
      SELECT
        pr.id, pr.user_id, pr.rating, pr.title, pr.comment, pr.pros, pr.cons,
        pr.images, pr.videos, pr.helpful_votes, pr.verified_purchase, pr.is_approved,
        pr.replied_at, pr.reply_text, pr.created_at, pr.updated_at,
        u.full_name as user_name, u.avatar_url as user_avatar,
        CASE
          WHEN pr.verified_purchase = true THEN 'Verified Purchase'
          ELSE 'Unverified'
        END as purchase_status
      FROM product_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id = $1 AND pr.is_approved = true
      ORDER BY pr.helpful_votes DESC, pr.created_at DESC
      LIMIT $2 OFFSET $3
    `;
      return await SelectQuery(sql, [productId, limit, offset]);
    } catch (error) {
      console.error('Get product reviews error:', error);
      return [];
    }
  }

  private async getProductRatingStats(productId: number): Promise<any> {
    try {
      const sql = `
      SELECT
        COUNT(*) as total_reviews,
        AVG(rating)::NUMERIC(3,2) as avg_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
        COUNT(CASE WHEN verified_purchase = true THEN 1 END) as verified_reviews,
        COUNT(CASE WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN 1 END) as reviews_with_images,
        COUNT(CASE WHEN videos IS NOT NULL AND array_length(videos, 1) > 0 THEN 1 END) as reviews_with_videos
      FROM product_reviews
      WHERE product_id = $1 AND is_approved = true
    `;
      const result = await SelectQuery(sql, [productId]);
      return result[0] || {
        total_reviews: 0, avg_rating: 0, five_star: 0, four_star: 0, three_star: 0,
        two_star: 0, one_star: 0, verified_reviews: 0, reviews_with_images: 0, reviews_with_videos: 0
      };
    } catch (error) {
      console.error('Get product rating stats error:', error);
      return {
        total_reviews: 0, avg_rating: 0, five_star: 0, four_star: 0, three_star: 0,
        two_star: 0, one_star: 0, verified_reviews: 0, reviews_with_images: 0, reviews_with_videos: 0
      };
    }
  }

  private async getProductFAQs(productId: number): Promise<any[]> {
    try {
      const sql = `
      SELECT
        pf.id, pf.question, pf.answer, pf.is_featured,
        pf.created_at, pf.updated_at,
        u.full_name as asked_by
      FROM product_questions pf
      LEFT JOIN users u ON pf.user_id = u.id
      WHERE pf.product_id = $1 
      ORDER BY pf.is_featured DESC,  pf.created_at DESC
    `;
      return await SelectQuery(sql, [productId]);
    } catch (error) {
      console.error('Get product FAQs error:', error);
      return [];
    }
  }

  private async getEnhancedProductCombinations(productId: number, currencyId: number = 1): Promise<any[]> {
    try {
      const combinationsSql = `
      SELECT ${this.combinationSelectFields}
      FROM product_variant_combinations pvc
      WHERE pvc.product_id = $1 AND pvc.is_active = true
      ORDER BY pvc.id
    `;
      const combinations = await SelectQuery(combinationsSql, [productId]);

      const combinationPromises = combinations.map(async combination => {
        const [variantValues, prices, stockInfo] = await Promise.all([
          SelectQuery(`
          SELECT
            pvcv.variant_value_id, pvv.value, pvv.attribute_value_id, pvv.variant_id,
            pv.name as variant_name, pv.attribute_id, pv.sort_order as variant_sort_order,
            pvv.sort_order as value_sort_order,
            a.name as attribute_name, a.slug as attribute_slug,
            av.value as attribute_value, av.color_code, av.image_url as attribute_image_url
          FROM product_variant_combination_values pvcv
          JOIN product_variant_values pvv ON pvcv.variant_value_id = pvv.id
          JOIN product_variants pv ON pvv.variant_id = pv.id
          LEFT JOIN attributes a ON pv.attribute_id = a.id
          LEFT JOIN attribute_values av ON pvv.attribute_value_id = av.id
          WHERE pvcv.combination_id = $1
          ORDER BY pv.sort_order, pvv.sort_order
        `, [combination.id]),

          SelectQuery(`
          SELECT
            pvp.currency_id, pvp.price, pvp.compare_price, pvp.cost_price,
            pvp.is_auto_converted, c.code as currency_code, c.symbol as currency_symbol,
            c.decimal_places
          FROM product_variant_prices pvp
          LEFT JOIN currencies c ON pvp.currency_id = c.id
          WHERE pvp.combination_id = $1
          ORDER BY CASE WHEN pvp.currency_id = $2 THEN 0 ELSE 1 END, pvp.currency_id
        `, [combination.id, currencyId]),

          SelectQuery(`
          SELECT
            CASE
              WHEN pvc.stock_quantity = 0 THEN 'out_of_stock'
              WHEN pvc.stock_quantity <= pvc.low_stock_threshold THEN 'low_stock'
              ELSE 'in_stock'
            END as stock_status,
            pvc.stock_quantity,
            pvc.low_stock_threshold
          FROM product_variant_combinations pvc
          WHERE pvc.id = $1
        `, [combination.id])
        ]);

        // Generate combination key for frontend selection using attribute-value pairs
        const combinationKey = variantValues
          .map(v => `${v.attribute_id}-${v.attribute_value_id}`)
          .sort()
          .join('|');

        // Get current price for specified currency
        const currentPriceData = prices.find(p => p.currency_id === currencyId);
        const currentPrice = currentPriceData?.price || combination.price;
        const currentComparePrice = currentPriceData?.compare_price || combination.compare_price;

        // Calculate discount
        const discountPercentage = currentComparePrice && currentPrice < currentComparePrice
          ? Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)
          : 0;

        return {
          ...combination,
          variant_values: variantValues,
          prices: prices,
          stock_info: stockInfo[0] || { stock_status: 'unknown', stock_quantity: 0, low_stock_threshold: 0 },
          combination_key: combinationKey,
          current_price: currentPrice,
          current_compare_price: currentComparePrice,
          discount_percentage: discountPercentage,
          savings: currentComparePrice ? (currentComparePrice - currentPrice) : 0,
          is_available: combination.stock_quantity > 0 && combination.is_active,
          formatted_variant_text: variantValues.map(v => `${v.variant_name}: ${v.value}`).join(', ')
        };
      });

      return await Promise.all(combinationPromises);
    } catch (error) {
      console.error('Get enhanced product combinations error:', error);
      return [];
    }
  }

  private async getRelatedProducts(productId: number, limit: number = 8): Promise<any[]> {
    try {
      const sql = `
      WITH product_info AS (
        SELECT category_id, brand_id, price, tags
        FROM products WHERE id = $1
      )
      SELECT
        p.id, p.name, p.slug, p.price, p.compare_price, p.featured_image_url,
        p.avg_rating, p.total_reviews, p.is_featured, p.is_on_sale,
        p.sale_starts_at, p.sale_ends_at, p.stock_quantity,
        COALESCE(pg.url, p.featured_image_url) as image_url,
        pg.thumbnail_url,
        c.name as category_name,
        CASE
          WHEN p.category_id = pi.category_id THEN 30
          ELSE 0
        END +
        CASE
          WHEN p.brand_id = pi.brand_id THEN 20
          ELSE 0
        END +
        CASE
          WHEN ABS(p.price - pi.price) <= pi.price * 0.3 THEN 15
          ELSE 0
        END +
        CASE
          WHEN p.tags && pi.tags THEN 10
          ELSE 0
        END as similarity_score,
        CASE
          WHEN p.stock_quantity = 0 THEN 'out_of_stock'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN product_gallery pg ON p.id = pg.product_id AND pg.is_primary = true AND pg.is_active = true
      LEFT JOIN categories c ON p.category_id = c.id
      CROSS JOIN product_info pi
      WHERE p.id != $2 AND p.status = 'active' AND p.visibility = 'visible'
      ORDER BY similarity_score DESC, p.avg_rating DESC, p.total_sales DESC
      LIMIT $3
    `;
      return await SelectQuery(sql, [productId, productId, limit]);
    } catch (error) {
      console.error('Get related products error:', error);
      return [];
    }
  }

  private async getProductSEOData(productId: number, languageId?: number): Promise<any> {
    try {
      let sql = `
      SELECT
        p.meta_title, p.meta_description, p.meta_keywords, p.seo_data,
        pt.meta_title as translated_meta_title,
        pt.meta_description as translated_meta_description,
        pt.meta_keywords as translated_meta_keywords
      FROM products p
      LEFT JOIN product_translations pt ON p.id = pt.product_id
    `;
      const params = [productId];

      if (languageId) {
        sql += ` AND pt.language_id = $2`;
        params.push(languageId);
      }

      sql += ` WHERE p.id = $1`;

      const result = await SelectQuery(sql, params);
      return result[0] || null;
    } catch (error) {
      console.error('Get product SEO data error:', error);
      return null;
    }
  }

  private async getProductWishlistStatus(productId: number, userId?: number): Promise<any> {
    if (!userId) return { is_wishlisted: false, wishlist_count: 0 };

    try {
      const [wishlistStatus, totalWishlistCount] = await Promise.all([
        SelectQuery(`
        SELECT id FROM wishlists
        WHERE user_id = $1 AND product_id = $2 AND is_active = true
        LIMIT 1
      `, [userId, productId]),

        SelectQuery(`
        SELECT COUNT(*) as count
        FROM wishlists
        WHERE product_id = $1 AND is_active = true
      `, [productId])
      ]);

      return {
        is_wishlisted: wishlistStatus.length > 0,
        wishlist_count: totalWishlistCount[0]?.count || 0
      };
    } catch (error) {
      console.error('Get product wishlist status error:', error);
      return { is_wishlisted: false, wishlist_count: 0 };
    }
  }

  // Helper method for delivery estimation
  private calculateEstimatedDelivery(product: any): string {
    try {
      if (product.virtual_product || product.downloadable) {
        return 'Instant delivery';
      }

      if (product.stock_quantity > 0) {
        return '2-5 business days';
      } else {
        return 'Out of stock';
      }
    } catch (error) {
      return 'Contact support';
    }
  }

  // Additional method for dynamic combination price calculation
  async getProductCombinationPrice(
    productId: number,
    combinationId: number,
    currencyId: number = 1,
    quantity: number = 1
  ): Promise<any> {
    try {
      const sql = `
      SELECT
        pvc.id, pvc.price, pvc.compare_price, pvc.stock_quantity, pvc.sku,
        pvp.price as currency_price, pvp.compare_price as currency_compare_price,
        c.code as currency_code, c.symbol as currency_symbol, c.decimal_places,
        CASE
          WHEN pvc.stock_quantity = 0 THEN 'out_of_stock'
          WHEN pvc.stock_quantity <= pvc.low_stock_threshold THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM product_variant_combinations pvc
      LEFT JOIN product_variant_prices pvp ON pvc.id = pvp.combination_id AND pvp.currency_id = $3
      LEFT JOIN currencies c ON c.id = $3
      WHERE pvc.product_id = $1 AND pvc.id = $2 AND pvc.is_active = true
    `;

      const result = await SelectQuery(sql, [productId, combinationId, currencyId]);

      if (!result.length) {
        throw new Error('Combination not found');
      }

      const combination = result[0];
      const unitPrice = combination.currency_price || combination.price;
      const comparePrice = combination.currency_compare_price || combination.compare_price;

      return {
        combination_id: combination.id,
        sku: combination.sku,
        unit_price: unitPrice,  
        compare_price: comparePrice,
        total_price: unitPrice * quantity,
        total_savings: comparePrice ? (comparePrice - unitPrice) * quantity : 0,
        discount_percentage: comparePrice ? Math.round(((comparePrice - unitPrice) / comparePrice) * 100) : 0,
        currency_code: combination.currency_code,
        currency_symbol: combination.currency_symbol,
        stock_status: combination.stock_status,
        stock_available: combination.stock_quantity,
        is_available: combination.stock_quantity >= quantity,
        max_quantity: combination.stock_quantity
      };
    } catch (error) {
      console.error('Get product combination price error:', error);
      throw error;    
    }
  }
}
