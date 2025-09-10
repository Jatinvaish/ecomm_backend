// import { Injectable } from '@nestjs/common';
// import {
//   ApiResponseFormat,
//   ApiResponse,
// } from 'src/common/utils/common-response';
// import { Messages } from 'src/common/utils/messages';
// import {
//   CreateProductDto,
//   UpdateProductDto,
//   ProductQueryDto,
//   CreateVariantCombinationDto,
//   UpdateVariantCombinationDto,
//   CreateSpecificationDto,
//   UpdateSpecificationDto,
//   ReviewQueryDto,
// } from './dtos/product.dto';
// import {
//   SelectQuery,
//   UpdateQuery,
//   DeleteQuery,
//   InsertQuery,
// } from 'src/db/postgres.client';

// // Enhanced DTOs for comprehensive product creation/update
// interface ProductGalleryDto {
//   media_type: 'image' | 'video';
//   url: string;
//   alt_text?: string;
//   sort_order?: number;
//   is_primary?: boolean;
// }

// interface ProductVariantDto {
//   name: string;
//   sort_order?: number;
//   values: {
//     value: string;
//     sort_order?: number;
//   }[];
// }

// interface ProductSpecificationDto {
//   name: string;
//   value: string;
//   sort_order?: number;
// }

// interface ProductVariantCombinationDto {
//   variant_value_ids: number[];
//   sku?: string;
//   price?: number;
//   compare_price?: number;
//   cost_price?: number;
//   weight?: number;
//   image_url?: string;
//   is_active?: boolean;
// }

// interface ComprehensiveCreateProductDto extends CreateProductDto {
//   gallery?: ProductGalleryDto[];
//   variants?: ProductVariantDto[];
//   specifications?: ProductSpecificationDto[];
//   variant_combinations?: ProductVariantCombinationDto[];
// }

// interface ComprehensiveUpdateProductDto extends UpdateProductDto {
//   gallery?: ProductGalleryDto[];
//   variants?: ProductVariantDto[];
//   specifications?: ProductSpecificationDto[];
//   variant_combinations?: ProductVariantCombinationDto[];
// }

// @Injectable()
// export class ProductsRepository {
//   private readonly productSelectFields = `
//     p.id, p.vendor_id, p.name, p.slug, p.description, p.short_description,
//     p.sku, p.category_id, p.brand_id, p.tax_id, p.price, p.compare_price,
//     p.cost_price, p.weight, p.length, p.width, p.height, p.meta_title,
//     p.meta_description, p.status, p.visibility, p.is_featured, p.is_physical,
//     p.search_meta, p.created_at, p.updated_at
//   `;

//   private readonly gallerySelectFields = `
//     pg.id, pg.product_id, pg.media_type, pg.url, pg.alt_text,
//     pg.sort_order, pg.is_primary, pg.created_at
//   `;
//   private readonly variantSelectFields = `
//      id, product_id, name, sort_order, created_at
//    `;
//   private readonly specificationSelectFields = `
//     id, product_id, name, value, sort_order, created_at
//   `;

//   private readonly variantValueSelectFields = `
//      id, variant_id, value, sort_order, created_at
//    `;
//   async findProductById(id: number): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         SELECT ${this.productSelectFields}
//         FROM products p
//         WHERE p.id = $1
//       `;
//       const result: any = await SelectQuery(sql, [id]);
//       if (result.length === 0) {
//         return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
//       }
//       return ApiResponse.success(result[0]);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }
//   async findProductImages(
//     productId: number,
//   ): Promise<ApiResponseFormat<any[]>> {
//     try {
//       const sql = `
//         SELECT ${this.gallerySelectFields}
//         FROM product_gallery pg
//         WHERE pg.product_id = $1
//         ORDER BY pg.sort_order ASC, pg.created_at ASC
//       `;
//       const result: any = await SelectQuery(sql, [productId]);
//       return ApiResponse.success(result);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }
//   async findProductVariants(
//     productId: number,
//   ): Promise<ApiResponseFormat<any[]>> {
//     try {
//       const sql = `
//         SELECT ${this.variantSelectFields}
//         FROM product_variants
//         WHERE product_id = $1
//         ORDER BY sort_order ASC, name ASC
//       `;
//       const result: any = await SelectQuery(sql, [productId]);
//       return ApiResponse.success(result); // Corrected: SelectQuery returns rows directly
//     } catch (e) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }
//   async findProductSpecifications(
//     productId: number,
//   ): Promise<ApiResponseFormat<any[]>> {
//     try {
//       const sql = `
//         SELECT ${this.specificationSelectFields}
//         FROM product_specifications
//         WHERE product_id = $1
//         ORDER BY sort_order ASC, name ASC
//       `;
//       const result: any = await SelectQuery(sql, [productId]);
//       return ApiResponse.success(result); // Corrected: SelectQuery returns rows directly
//     } catch (e) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }
//   async findProductVariantCombinations(
//     productId: number,
//   ): Promise<ApiResponseFormat<any[]>> {
//     try {
//       const sql = `
//         SELECT pvc.*,
//                ARRAY_AGG(pvcv.variant_value_id) AS variant_value_ids
//         FROM product_variant_combinations pvc
//         LEFT JOIN product_variant_combination_values pvcv ON pvc.id = pvcv.combination_id
//         WHERE pvc.product_id = $1
//         GROUP BY pvc.id
//         ORDER BY pvc.created_at ASC
//       `;
//       const result: any = await SelectQuery(sql, [productId]);
//       return ApiResponse.success(result); // Corrected: SelectQuery returns rows directly
//     } catch (e) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async findProductVariantValues(
//     variantId: number,
//   ): Promise<ApiResponseFormat<any[]>> {
//     try {
//       const sql = `
//         SELECT ${this.variantValueSelectFields}
//         FROM product_variant_values
//         WHERE variant_id = $1
//         ORDER BY sort_order ASC, value ASC
//       `;
//       const result: any = await SelectQuery(sql, [variantId]);
//       return ApiResponse.success(result); // Corrected: SelectQuery returns rows directly
//     } catch (e) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async findAllProducts(
//     query: ProductQueryDto,
//   ): Promise<ApiResponseFormat<any[]>> {
//     try {
//       let sql = `
//         SELECT ${this.productSelectFields}
//         FROM products p
//         WHERE 1=1
//       `;
//       const params: any[] = [];
//       let paramIndex = 1;

//       // Add filters
//       if (query.search) {
//         sql += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`;
//         params.push(`%${query.search}%`);
//         paramIndex++;
//       }

//       if (query.category_id) {
//         sql += ` AND p.category_id = $${paramIndex}`;
//         params.push(query.category_id);
//         paramIndex++;
//       }

//       if (query.brand_id) {
//         sql += ` AND p.brand_id = $${paramIndex}`;
//         params.push(query.brand_id);
//         paramIndex++;
//       }

//       if (query.vendor_id) {
//         sql += ` AND p.vendor_id = $${paramIndex}`;
//         params.push(query.vendor_id);
//         paramIndex++;
//       }

//       if (query.status) {
//         sql += ` AND p.status = $${paramIndex}`;
//         params.push(query.status);
//         paramIndex++;
//       }

//       if (query.visibility) {
//         sql += ` AND p.visibility = $${paramIndex}`;
//         params.push(query.visibility);
//         paramIndex++;
//       }

//       if (query.is_featured !== undefined) {
//         sql += ` AND p.is_featured = $${paramIndex}`;
//         params.push(query.is_featured);
//         paramIndex++;
//       }

//       if (query.min_price) {
//         sql += ` AND p.price >= $${paramIndex}`;
//         params.push(query.min_price);
//         paramIndex++;
//       }

//       if (query.max_price) {
//         sql += ` AND p.price <= $${paramIndex}`;
//         params.push(query.max_price);
//         paramIndex++;
//       }

//       // Add sorting
//       const sortBy = query.sort_by || 'created_at';
//       const sortOrder = query.sort_order || 'DESC';
//       sql += ` ORDER BY p.${sortBy} ${sortOrder}`;

//       // Add pagination
//       const limit = query.limit || 10;
//       const offset = ((query.page || 1) - 1) * limit;
//       sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
//       params.push(limit, offset);

//       const result: any = await SelectQuery(sql, params);
//       return ApiResponse.success(result);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async findAllActiveProducts(
//     queryDto: ProductQueryDto,
//   ): Promise<ApiResponseFormat<any[]>> {
//     try {
//       let sql = `
//         SELECT ${this.productSelectFields}
//         FROM products
//         WHERE status = 'active' AND visibility = 'visible'
//       `;
//       const params: any[] = [];
//       let paramIndex = 1;

//       if (queryDto.category_id) {
//         sql += ` AND category_id = $${paramIndex++}`;
//         params.push(queryDto.category_id);
//       }
//       if (queryDto.brand_id) {
//         sql += ` AND brand_id = $${paramIndex++}`;
//         params.push(queryDto.brand_id);
//       }
//       if (queryDto.is_featured === true) {
//         sql += ` AND is_featured = true`;
//       }
//       if (queryDto.search) {
//         sql += ` AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})`;
//         params.push(`%${queryDto.search}%`, `%${queryDto.search}%`);
//       }

//       sql += ` ORDER BY created_at DESC`;
//       const result: any = await SelectQuery(sql, params);
//       return ApiResponse.success(result); // Corrected: SelectQuery returns rows directly
//     } catch (e) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   async findVendorProducts(
//     vendorId: number,
//     queryDto: ProductQueryDto,
//   ): Promise<ApiResponseFormat<any[]>> {
//     try {
//       let sql = `
//         SELECT ${this.productSelectFields}
//         FROM products
//         WHERE vendor_id = $1
//       `;
//       const params: any[] = [vendorId];
//       let paramIndex = 2;

//       if (queryDto.status) {
//         sql += ` AND status = $${paramIndex++}`;
//         params.push(queryDto.status);
//       }
//       if (queryDto.visibility) {
//         sql += ` AND visibility = $${paramIndex++}`;
//         params.push(queryDto.visibility);
//       }
//       if (queryDto.search) {
//         sql += ` AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})`;
//         params.push(`%${queryDto.search}%`, `%${queryDto.search}%`);
//       }

//       sql += ` ORDER BY created_at DESC`;
//       const result: any = await SelectQuery(sql, params);
//       return ApiResponse.success(result); // Corrected: SelectQuery returns rows directly
//     } catch (e) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }
//   async executeQuery(sql: string, params: any[] = []): Promise<any[]> {
//     return await SelectQuery(sql, params);
//   }

//   async findActiveProductById(id: number): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         SELECT ${this.productSelectFields}
//         FROM products
//         WHERE id = $1 AND status = 'active' AND visibility = 'visible'
//       `;
//       const result: any = await SelectQuery(sql, [id]);
//       if (result.length === 0) {
//         // Corrected: check length of the array directly
//         return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
//       }
//       return ApiResponse.success(result[0]); // Corrected: access first element directly
//     } catch (e) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   // ==================== COMPREHENSIVE CREATE PRODUCT ====================
//   async createProductComprehensive(
//     createProductDto: ComprehensiveCreateProductDto,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       // Start transaction logic (you'll need to implement transaction wrapper)
//       const product: any = await this.createProductCore(createProductDto);
//       if (!product.result || !product.data) {
//         return product;
//       }

//       const productId = product.data.id;
//       const results: any = {
//         product: product.data,
//         gallery: [],
//         variants: [],
//         specifications: [],
//         variant_combinations: [],
//       };

//       // Create gallery items
//       if (createProductDto.gallery && createProductDto.gallery.length > 0) {
//         for (const galleryItem of createProductDto.gallery) {
//           const galleryResult = await this.createProductImageCore(
//             productId,
//             galleryItem,
//           );
//           if (galleryResult.result) {
//             results.gallery.push(galleryResult.result);
//           }
//         }
//       }

//       // Create specifications
//       if (
//         createProductDto.specifications &&
//         createProductDto.specifications.length > 0
//       ) {
//         for (const spec of createProductDto.specifications) {
//           const specResult = await this.createProductSpecificationCore(
//             productId,
//             spec,
//           );
//           if (specResult.result) {
//             results.specifications.push(specResult.result);
//           }
//         }
//       }

//       // Create variants and their values
//       const variantValueMap = new Map<string, number[]>(); // variant name -> value IDs

//       if (createProductDto.variants && createProductDto.variants.length > 0) {
//         for (const variant of createProductDto.variants) {
//           const variantResult = await this.createProductVariantCore(
//             productId,
//             variant,
//           );
//           if (variantResult.result && variantResult.result) {
//             results.variants.push({
//               ...variantResult.result,
//               values: [],
//             });

//             const variantId = variantResult.result.id;
//             const valueIds: number[] = [];

//             // Create variant values
//             for (const value of variant.values) {
//               const valueResult = await this.createVariantValueCore(
//                 variantId,
//                 value,
//               );
//               if (valueResult.result && valueResult.result) {
//                 results.variants[results.variants.length - 1].values.push(
//                   valueResult.result,
//                 );
//                 valueIds.push(valueResult.result.id);
//               }
//             }

//             variantValueMap.set(variant.name, valueIds);
//           }
//         }
//       }

//       // Create variant combinations
//       if (
//         createProductDto.variant_combinations &&
//         createProductDto.variant_combinations.length > 0
//       ) {
//         for (const combination of createProductDto.variant_combinations) {
//           const combinationResult = await this.createVariantCombinationCore(
//             productId,
//             combination,
//           );
//           if (combinationResult.result) {
//             results.variant_combinations.push(combinationResult.result);
//           }
//         }
//       }

//       // Add to search sync queue
//       await this.addToSearchSyncQueue(productId, 'index');

//       return ApiResponse.success(
//         results,
//         'Product created successfully with all related data',
//       );
//     } catch (error) {
//       console.error('Error creating comprehensive product:', error);
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   // ==================== COMPREHENSIVE UPDATE PRODUCT ====================
//   async updateProductComprehensive(
//     id: number,
//     updateProductDto: ComprehensiveUpdateProductDto,
//     vendorId?: number,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const results: any = {
//         product: null,
//         gallery: [],
//         variants: [],
//         specifications: [],
//         variant_combinations: [],
//       };

//       // Update core product
//       if (this.hasProductCoreFields(updateProductDto)) {
//         const productResult = await this.updateProductCore(
//           id,
//           updateProductDto,
//           vendorId,
//         );
//         if (!productResult.result) {
//           return productResult;
//         }
//         results.product = productResult.result;
//       }

//       // Update gallery (replace all)
//       if (updateProductDto.gallery !== undefined) {
//         // Delete existing gallery items
//         await this.deleteProductGalleryByProductId(id);

//         // Create new gallery items
//         if (updateProductDto.gallery.length > 0) {
//           for (const galleryItem of updateProductDto.gallery) {
//             const galleryResult = await this.createProductImageCore(
//               id,
//               galleryItem,
//             );
//             if (galleryResult.result) {
//               results.gallery.push(galleryResult.result);
//             }
//           }
//         }
//       }

//       // Update specifications (replace all)
//       if (updateProductDto.specifications !== undefined) {
//         // Delete existing specifications
//         await this.deleteProductSpecificationsByProductId(id);

//         // Create new specifications
//         if (updateProductDto.specifications.length > 0) {
//           for (const spec of updateProductDto.specifications) {
//             const specResult = await this.createProductSpecificationCore(
//               id,
//               spec,
//             );
//             if (specResult.result) {
//               results.specifications.push(specResult.result);
//             }
//           }
//         }
//       }

//       // Update variants (replace all)
//       if (updateProductDto.variants !== undefined) {
//         // Delete existing variants (cascade will handle values and combinations)
//         await this.deleteProductVariantsByProductId(id);

//         // Create new variants and values
//         const variantValueMap = new Map<string, number[]>();

//         if (updateProductDto.variants.length > 0) {
//           for (const variant of updateProductDto.variants) {
//             const variantResult = await this.createProductVariantCore(
//               id,
//               variant,
//             );
//             if (variantResult.result && variantResult.result) {
//               results.variants.push({
//                 ...variantResult.result,
//                 values: [],
//               });

//               const variantId = variantResult.result.id;
//               const valueIds: number[] = [];

//               // Create variant values
//               for (const value of variant.values) {
//                 const valueResult = await this.createVariantValueCore(
//                   variantId,
//                   value,
//                 );
//                 if (valueResult.result && valueResult.result) {
//                   results.variants[results.variants.length - 1].values.push(
//                     valueResult.result,
//                   );
//                   valueIds.push(valueResult.result.id);
//                 }
//               }

//               variantValueMap.set(variant.name, valueIds);
//             }
//           }
//         }
//       }

//       // Update variant combinations (replace all)
//       if (updateProductDto.variant_combinations !== undefined) {
//         // Delete existing combinations
//         await this.deleteProductVariantCombinationsByProductId(id);

//         // Create new combinations
//         if (updateProductDto.variant_combinations.length > 0) {
//           for (const combination of updateProductDto.variant_combinations) {
//             const combinationResult = await this.createVariantCombinationCore(
//               id,
//               combination,
//             );
//             if (combinationResult.result) {
//               results.variant_combinations.push(combinationResult.result);
//             }
//           }
//         }
//       }

//       // Add to search sync queue
//       await this.addToSearchSyncQueue(id, 'index');

//       return ApiResponse.success(
//         results,
//         'Product updated successfully with all related data',
//       );
//     } catch (error) {
//       console.error('Error updating comprehensive product:', error);
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   // ==================== CORE CREATION METHODS ====================

//   private async createProductCore(
//     createProductDto: CreateProductDto,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         INSERT INTO products (
//           vendor_id, name, slug, description, short_description, sku,
//           category_id, brand_id, tax_id, price, compare_price, cost_price,
//           weight, length, width, height, meta_title, meta_description,
//           status, visibility, is_featured, is_physical, created_at, updated_at
//         )
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
//         RETURNING ${this.productSelectFields}
//       `;

//       const params = [
//         createProductDto.vendor_id,
//         createProductDto.name,
//         createProductDto.slug,
//         createProductDto.description,
//         createProductDto.short_description,
//         createProductDto.sku,
//         createProductDto.category_id,
//         createProductDto.brand_id,
//         createProductDto.tax_id,
//         createProductDto.price,
//         createProductDto.compare_price,
//         createProductDto.cost_price,
//         createProductDto.weight,
//         createProductDto.length,
//         createProductDto.width,
//         createProductDto.height,
//         createProductDto.meta_title,
//         createProductDto.meta_description,
//         createProductDto.status || 'draft',
//         createProductDto.visibility || 'visible',
//         createProductDto.is_featured || false,
//         createProductDto.is_physical !== false,
//         new Date(),
//         new Date(),
//       ];

//       const result: any = await InsertQuery(sql, params);
//       if (result.length === 0) {
//         return ApiResponse.error('Failed to create product', 500);
//       }
//       return ApiResponse.success(result[0]);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   private async createProductImageCore(
//     productId: number,
//     imageData: ProductGalleryDto,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         INSERT INTO product_gallery (
//           product_id, media_type, url, alt_text, sort_order, is_primary, created_at
//         )
//         VALUES ($1, $2, $3, $4, $5, $6, $7)
//         RETURNING id, product_id, media_type, url, alt_text, sort_order, is_primary, created_at
//       `;

//       const params = [
//         productId,
//         imageData.media_type,
//         imageData.url,
//         imageData.alt_text || null,
//         imageData.sort_order || 0,
//         imageData.is_primary || false,
//         new Date(),
//       ];

//       const result: any = await InsertQuery(sql, params);
//       if (result.length === 0) {
//         return ApiResponse.error('Failed to create product image', 500);
//       }
//       return ApiResponse.success(result[0]);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   private async createProductVariantCore(
//     productId: number,
//     variantData: ProductVariantDto,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         INSERT INTO product_variants (product_id, name, sort_order, created_at)
//         VALUES ($1, $2, $3, $4)
//         RETURNING id, product_id, name, sort_order, created_at
//       `;

//       const params = [
//         productId,
//         variantData.name,
//         variantData.sort_order || 0,
//         new Date(),
//       ];

//       const result: any = await InsertQuery(sql, params);
//       if (result.length === 0) {
//         return ApiResponse.error('Failed to create product variant', 500);
//       }
//       return ApiResponse.success(result[0]);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   private async createVariantValueCore(
//     variantId: number,
//     valueData: { value: string; sort_order?: number },
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         INSERT INTO product_variant_values (variant_id, value, sort_order, created_at)
//         VALUES ($1, $2, $3, $4)
//         RETURNING id, variant_id, value, sort_order, created_at
//       `;

//       const params = [
//         variantId,
//         valueData.value,
//         valueData.sort_order || 0,
//         new Date(),
//       ];

//       const result: any = await InsertQuery(sql, params);
//       if (result.length === 0) {
//         return ApiResponse.error('Failed to create variant value', 500);
//       }
//       return ApiResponse.success(result[0]);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   private async createVariantCombinationCore(
//     productId: number,
//     combinationData: ProductVariantCombinationDto,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         INSERT INTO product_variant_combinations (
//           product_id, sku, price, compare_price, cost_price, weight, image_url, is_active, created_at, updated_at
//         )
//         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//         RETURNING id, product_id, sku, price, compare_price, cost_price, weight, image_url, is_active, created_at, updated_at
//       `;

//       const params = [
//         productId,
//         combinationData.sku || null,
//         combinationData.price || null,
//         combinationData.compare_price || null,
//         combinationData.cost_price || null,
//         combinationData.weight || null,
//         combinationData.image_url || null,
//         combinationData.is_active !== false,
//         new Date(),
//         new Date(),
//       ];

//       const result: any = await InsertQuery(sql, params);
//       if (result.length === 0) {
//         return ApiResponse.error('Failed to create variant combination', 500);
//       }

//       const combination = result[0];

//       // Add variant value mappings
//       if (
//         combinationData.variant_value_ids &&
//         combinationData.variant_value_ids.length > 0
//       ) {
//         await this.addVariantCombinationValuesCore(
//           combination.id,
//           combinationData.variant_value_ids,
//         );
//       }

//       return ApiResponse.success(combination);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   private async createProductSpecificationCore(
//     productId: number,
//     specData: ProductSpecificationDto,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const sql = `
//         INSERT INTO product_specifications (product_id, name, value, sort_order, created_at)
//         VALUES ($1, $2, $3, $4, $5)
//         RETURNING id, product_id, name, value, sort_order, created_at
//       `;

//       const params = [
//         productId,
//         specData.name,
//         specData.value,
//         specData.sort_order || 0,
//         new Date(),
//       ];

//       const result: any = await InsertQuery(sql, params);
//       if (result.length === 0) {
//         return ApiResponse.error('Failed to create product specification', 500);
//       }
//       return ApiResponse.success(result[0]);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   private async addVariantCombinationValuesCore(
//     combinationId: number,
//     variantValueIds: number[],
//   ): Promise<void> {
//     if (variantValueIds.length === 0) return;

//     const values = variantValueIds
//       .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
//       .join(', ');

//     const sql = `
//       INSERT INTO product_variant_combination_values (combination_id, variant_value_id)
//       VALUES ${values}
//     `;

//     const params = variantValueIds.flatMap((valueId) => [
//       combinationId,
//       valueId,
//     ]);
//     await InsertQuery(sql, params);
//   }

//   // ==================== CORE UPDATE METHODS ====================

//   private async updateProductCore(
//     id: number,
//     updateProductDto: UpdateProductDto,
//     vendorId?: number,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const fields = [];
//       const params = [];
//       let paramIndex = 1;

//       Object.keys(updateProductDto).forEach((key) => {
//         if (
//           updateProductDto[key] !== undefined &&
//           !this.isRelatedDataField(key)
//         ) {
//           fields.push(`${key} = $${paramIndex}`);
//           params.push(updateProductDto[key]);
//           paramIndex++;
//         }
//       });

//       if (fields.length === 0) {
//         return ApiResponse.error('No fields to update', 400);
//       }

//       fields.push(`updated_at = $${paramIndex}`);
//       params.push(new Date());
//       paramIndex++;

//       let sql = `
//         UPDATE products 
//         SET ${fields.join(', ')}
//         WHERE id = $${paramIndex}
//       `;
//       params.push(id);

//       if (vendorId) {
//         paramIndex++;
//         sql += ` AND vendor_id = $${paramIndex}`;
//         params.push(vendorId);
//       }

//       sql += ` RETURNING ${this.productSelectFields}`;

//       const result: any = await UpdateQuery(sql, params);
//       if (result.length === 0) {
//         return ApiResponse.notFound(Messages.RESOURCE_NOT_FOUND);
//       }
//       return ApiResponse.success(result[0]);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   // ==================== DELETE HELPERS ====================

//   private async deleteProductGalleryByProductId(
//     productId: number,
//   ): Promise<void> {
//     await DeleteQuery('DELETE FROM product_gallery WHERE product_id = $1', [
//       productId,
//     ]);
//   }

//   private async deleteProductSpecificationsByProductId(
//     productId: number,
//   ): Promise<void> {
//     await DeleteQuery(
//       'DELETE FROM product_specifications WHERE product_id = $1',
//       [productId],
//     );
//   }

//   private async deleteProductVariantsByProductId(
//     productId: number,
//   ): Promise<void> {
//     await DeleteQuery('DELETE FROM product_variants WHERE product_id = $1', [
//       productId,
//     ]);
//   }

//   private async deleteProductVariantCombinationsByProductId(
//     productId: number,
//   ): Promise<void> {
//     await DeleteQuery(
//       'DELETE FROM product_variant_combinations WHERE product_id = $1',
//       [productId],
//     );
//   }

//   // ==================== UTILITY METHODS ====================

//   private hasProductCoreFields(dto: any): boolean {
//     const relatedFields = [
//       'gallery',
//       'variants',
//       'specifications',
//       'variant_combinations',
//     ];
//     return Object.keys(dto).some((key) => !relatedFields.includes(key));
//   }

//   private isRelatedDataField(field: string): boolean {
//     return [
//       'gallery',
//       'variants',
//       'specifications',
//       'variant_combinations',
//     ].includes(field);
//   }

//   private async addToSearchSyncQueue(
//     productId: number,
//     action: 'index' | 'delete',
//   ): Promise<void> {
//     try {
//       await InsertQuery(
//         'INSERT INTO search_sync_queue (product_id, action, status, created_at) VALUES ($1, $2, $3, $4)',
//         [productId, action, 'pending', new Date()],
//       );
//     } catch (error) {
//       console.error('Error adding to search sync queue:', error);
//     }
//   }

//   // ==================== COMPREHENSIVE DELETE ====================

//   async deleteProductComprehensive(
//     id: number,
//     vendorId?: number,
//   ): Promise<ApiResponseFormat<boolean>> {
//     try {
//       // Add to search sync queue for deletion
//       await this.addToSearchSyncQueue(id, 'delete');

//       // Delete the product (cascade will handle related tables)
//       let sql = `DELETE FROM products WHERE id = $1`;
//       const params = [id];

//       if (vendorId) {
//         sql += ` AND vendor_id = $2`;
//         params.push(vendorId);
//       }

//       await DeleteQuery(sql, params);
//       return ApiResponse.success(
//         true,
//         'Product and all related data deleted successfully',
//       );
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   // ==================== GET COMPREHENSIVE PRODUCT ====================

//   async getProductComprehensive(id: number): Promise<ApiResponseFormat<any>> {
//     try {
//       // Get product
//       const productResult = await this.findProductById(id);
//       if (!productResult.result) {
//         return productResult;
//       }

//       const product = productResult.result;

//       // Get all related data
//       const [
//         galleryResult,
//         variantsResult,
//         specificationsResult,
//         combinationsResult,
//       ] = await Promise.all([
//         this.findProductImages(id),
//         this.findProductVariants(id),
//         this.findProductSpecifications(id),
//         this.findProductVariantCombinations(id),
//       ]);

//       // Get variant values for each variant
//       if (variantsResult.result && variantsResult.result.length > 0) {
//         for (const variant of variantsResult.result) {
//           const valuesResult = await this.findProductVariantValues(variant.id);
//           variant.values = valuesResult.result ? valuesResult.result : [];
//         }
//       }

//       const comprehensiveProduct = {
//         ...product,
//         gallery: galleryResult.result ? galleryResult.result : [],
//         variants: variantsResult.result ? variantsResult.result : [],
//         specifications: specificationsResult.result
//           ? specificationsResult.result
//           : [],
//         variant_combinations: combinationsResult.result
//           ? combinationsResult.result
//           : [],
//       };

//       return ApiResponse.success(comprehensiveProduct);
//     } catch (error) {
//       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
//     }
//   }

//   // Keep all your existing methods for individual operations...
//   // [All your existing methods remain unchanged]
// }
