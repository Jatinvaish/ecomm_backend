// import {
//   Controller,
//   Post,
//   Put,
//   Delete,
//   Body,
//   Param,
//   ParseIntPipe,
//   UseGuards,
//   Request,
//   HttpStatus,
//   HttpCode,
//   BadRequestException,
//   NotFoundException,
//   ForbiddenException,
//   ValidationPipe,
//   UsePipes,
//   Req,
//   Query,
//   Get
// } from '@nestjs/common';
// import { FastifyRequest } from 'fastify';
// import { ProductsRepository } from './products.repository';
// import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
// import {
//   CreateProductDto,
//   UpdateProductDto,
//   ProductFilterDto,
//   ApprovalDto,
// } from '../products/dtos/products.dto';
// import { AuthGuard } from 'src/common/guards/auth.guard';
// import { RoleGuard, VendorGuard, RequireActiveVendor } from 'src/common/guards/role.guard';
// import { determineMediaType, generateSlug, generateThumbnailUrl, getMimeType } from 'src/common/utils/api-helpers';
// import { FormDataRequest } from 'nestjs-form-data';
// import { SelectQuery } from 'src/db/postgres.client';
// import { CommonFileProcessorService } from '../cloudinary/common-file-processing.service';
// import { ProductStatus } from 'src/common/utils/enums';

// @Controller('products')
// export class ProductsController {
//   constructor(
//     private readonly productsRepository: ProductsRepository,
//     private readonly commonFileProcessor: CommonFileProcessorService
//   ) { }

//   // ==================== HELPER METHODS ====================

//   private async getVendorId(userId: number): Promise<number> {
//     const getVendorIdData: any = await SelectQuery(
//       `SELECT id FROM vendors WHERE user_id = $1 LIMIT 1`,
//       [userId]
//     );
//     const vendorId = getVendorIdData[0]?.id;
//     if (!vendorId) {
//       throw new BadRequestException('Vendor ID is required');
//     }
//     return vendorId;
//   }

//   private getFileUploadConfig() {
//     return {
//       allowedMimeTypes: [
//         // Images
//         'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
//         'image/svg+xml', 'image/bmp', 'image/tiff',
//         // Videos
//         'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
//         'video/wmv', 'video/flv', 'video/mkv',
//         // Documents
//         'application/pdf', 'application/msword',
//         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         'application/vnd.ms-excel',
//         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         'application/vnd.ms-powerpoint',
//         'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//         'text/plain', 'text/csv',
//         // Audio
//         'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac',
//         // Archives
//         'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
//       ],
//       maxSize: 100 * 1024 * 1024, // 100MB
//     };
//   }

//   private processGalleryData(
//     uploadedFiles: Record<string, any>,
//     cleanedBody: any,
//     productName?: string,
//     isUpdate: boolean = false
//   ): any[] {
//     // Convert uploaded files to a uniform array format
//     const allUploadedFiles: any[] = [];

//     // Helper function to convert value to array
//     const toArray = (value: any): any[] => {
//       if (!value) return [];
//       if (Array.isArray(value)) return value;
//       return [value];
//     };

//     // Process each file type
//     const fileTypeMap = {
//       images: { type: 'image', resource_type: 'image' },
//       videos: { type: 'video', resource_type: 'video' },
//       documents: { type: 'document', resource_type: 'raw' },
//       audios: { type: 'audio', resource_type: 'video' }
//     };

//     Object.entries(fileTypeMap).forEach(([key, config]) => {
//       const files = toArray(uploadedFiles[key]);
//       files.forEach(url => {
//         if (url) {
//           allUploadedFiles.push({
//             url: typeof url === 'string' ? url : url.url || url,
//             type: config.type,
//             resource_type: config.resource_type
//           });
//         }
//       });
//     });

//     console.log("🚀 ~ Processed uploaded files:", allUploadedFiles);

//     // If no gallery metadata provided, create basic gallery data
//     if (!cleanedBody.gallery || !Array.isArray(cleanedBody.gallery)) {
//       if (allUploadedFiles.length === 0) return [];

//       return allUploadedFiles.map((uploadedFile, index) => ({
//         media_type: uploadedFile.type,
//         url: uploadedFile.url,
//         thumbnail_url: this.generateThumbnailUrl(uploadedFile),
//         alt_text: cleanedBody.name || productName || '',
//         title: `${cleanedBody.name || productName} - ${uploadedFile.type} ${index + 1}`,
//         description: '',
//         file_size: null,
//         mime_type: this.getMimeType(uploadedFile.type, uploadedFile.resource_type),
//         width: null,
//         height: null,
//         duration: null,
//         sort_order: index,
//         is_primary: index === 0,
//         is_active: true
//       }));
//     }

//     // Process gallery with metadata
//     const processedGalleryItems: any[] = [];
//     let uploadedFileIndex = 0;

//     for (let index = 0; index < cleanedBody.gallery.length; index++) {
//       const galleryItem = cleanedBody.gallery[index];

//       // Convert id to number to handle string IDs
//       const itemId = parseInt(galleryItem.id) || 0;

//       // Check if this item specifically needs a file upload
//       // This should be determined by frontend logic - e.g., a flag like 'needsUpload' or checking if URL is a placeholder
//       const needsFileUpload = galleryItem.needsUpload ||
//         galleryItem._needsUpload ||
//         (galleryItem.url && typeof galleryItem.url === 'string' && galleryItem.url.startsWith('temp_')) ||
//         itemId === 0; // New items always need upload

//       const hasUploadData = uploadedFileIndex < allUploadedFiles.length;

//       if (needsFileUpload && hasUploadData) {
//         const uploadedFile = allUploadedFiles[uploadedFileIndex];

//         if (itemId === 0) {
//           // New item with uploaded file
//           processedGalleryItems.push({
//             media_type: uploadedFile.type, // Use uploaded file type
//             url: uploadedFile.url,
//             thumbnail_url: this.generateThumbnailUrl(uploadedFile),
//             alt_text: galleryItem.alt_text || cleanedBody.name || productName || '',
//             title: galleryItem.title || `${cleanedBody.name || productName} - ${uploadedFile.type} ${index + 1}`,
//             description: galleryItem.description || '',
//             file_size: galleryItem.file_size || null,
//             mime_type: this.getMimeType(uploadedFile.type, uploadedFile.resource_type),
//             width: galleryItem.width || null,
//             height: galleryItem.height || null,
//             duration: galleryItem.duration || null,
//             sort_order: galleryItem.sort_order !== undefined ? galleryItem.sort_order : index,
//             is_primary: galleryItem.is_primary || (index === 0 && !processedGalleryItems.some(item => item.is_primary)),
//             is_active: galleryItem.is_active !== false,
//             _action: 'create' // Mark as new
//           });
//         } else {
//           // Existing item that needs to be updated with new file
//           processedGalleryItems.push({
//             id: itemId,
//             media_type: uploadedFile.type, // Use uploaded file type
//             url: uploadedFile.url, // Use new uploaded URL
//             thumbnail_url: this.generateThumbnailUrl(uploadedFile), // Generate new thumbnail
//             alt_text: galleryItem.alt_text || cleanedBody.name || productName || '',
//             title: galleryItem.title || `${cleanedBody.name || productName} - ${uploadedFile.type} ${index + 1}`,
//             description: galleryItem.description || '',
//             file_size: galleryItem.file_size || null,
//             mime_type: this.getMimeType(uploadedFile.type, uploadedFile.resource_type),
//             width: galleryItem.width || null,
//             height: galleryItem.height || null,
//             duration: galleryItem.duration || null,
//             sort_order: galleryItem.sort_order !== undefined ? galleryItem.sort_order : index,
//             is_primary: galleryItem.is_primary || false,
//             is_active: galleryItem.is_active !== false,
//             _action: 'update' // Mark for update
//           });
//         }

//         uploadedFileIndex++;
//       } else if (itemId > 0) {
//         // Existing item that doesn't need file update - keep as is
//         processedGalleryItems.push({
//           id: itemId,
//           media_type: galleryItem.media_type,
//           url: galleryItem.url,
//           thumbnail_url: galleryItem.thumbnail_url,
//           alt_text: galleryItem.alt_text || cleanedBody.name || productName || '',
//           title: galleryItem.title || `${cleanedBody.name || productName} - ${galleryItem.media_type} ${index + 1}`,
//           description: galleryItem.description || '',
//           file_size: galleryItem.file_size || null,
//           mime_type: galleryItem.mime_type,
//           width: galleryItem.width || null,
//           height: galleryItem.height || null,
//           duration: galleryItem.duration || null,
//           sort_order: galleryItem.sort_order !== undefined ? galleryItem.sort_order : index,
//           is_primary: galleryItem.is_primary || false,
//           is_active: galleryItem.is_active !== false,
//           _action: 'keep' // Mark to keep existing
//         });
//       } else if (needsFileUpload && !hasUploadData) {
//         // Item needs upload but no file available - warn and skip
//         console.warn(`Gallery item at index ${index} needs upload but no file available. Skipping.`);
//       } else {
//         // Item without id and without upload - skip or warn
//         console.warn(`Gallery item at index ${index} has no id and no file to upload. Skipping.`);
//       }
//     }

//     // Handle any remaining uploaded files that weren't matched to gallery items
//     while (uploadedFileIndex < allUploadedFiles.length) {
//       const uploadedFile = allUploadedFiles[uploadedFileIndex];
//       const newIndex = processedGalleryItems.length;

//       processedGalleryItems.push({
//         media_type: uploadedFile.type,
//         url: uploadedFile.url,
//         thumbnail_url: this.generateThumbnailUrl(uploadedFile),
//         alt_text: cleanedBody.name || productName || '',
//         title: `${cleanedBody.name || productName} - ${uploadedFile.type} ${newIndex + 1}`,
//         description: '',
//         file_size: null,
//         mime_type: this.getMimeType(uploadedFile.type, uploadedFile.resource_type),
//         width: null,
//         height: null,
//         duration: null,
//         sort_order: newIndex,
//         is_primary: newIndex === 0 && !processedGalleryItems.some(item => item.is_primary),
//         is_active: true,
//         _action: 'create' // Mark as new
//       });

//       uploadedFileIndex++;
//       console.log(`🚀 ~ Added remaining uploaded file as new gallery item: ${uploadedFile.url}`);
//     }

//     return processedGalleryItems;
//   }



//   private generateThumbnailUrl(uploadedFile: any): string | null {
//     if (uploadedFile.resource_type === 'image') {
//       return uploadedFile.url.replace('/upload/', '/upload/w_300,h_300,c_fill/');
//     }
//     if (uploadedFile.resource_type === 'video' && uploadedFile.type === 'video') {
//       return uploadedFile.url.replace('/upload/', '/upload/w_300,h_300,c_fill/').replace(/\.[^.]+$/, '.jpg');
//     }
//     return null;
//   }

//   private getMimeType(fileType: string, resourceType: string): string {
//     const mimeTypeMap: Record<string, string> = {
//       'image': 'image/webp', 'video': 'video/mp4', 'audio': 'audio/mp3', 'document': 'application/octet-stream',
//       'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp',
//       'mp4': 'video/mp4', 'webm': 'video/webm', 'ogg': 'video/ogg', 'mp3': 'audio/mp3', 'wav': 'audio/wav',
//       'pdf': 'application/pdf', 'doc': 'application/msword',
//     };
//     return mimeTypeMap[fileType] || mimeTypeMap[resourceType] || 'application/octet-stream';
//   }

//   private async generateUniqueProductSlug(baseSlug: string, vendorId: number, excludeProductId?: number): Promise<string> {
//     let counter = 0;
//     let slug = baseSlug;

//     while (await this.isProductSlugTaken(slug, vendorId, excludeProductId)) {
//       counter++;
//       slug = `${baseSlug}-${counter}`;
//     }
//     return slug;
//   }

//   private async isProductSlugTaken(slug: string, vendorId: number, excludeProductId?: number): Promise<boolean> {
//     try {
//       let query = `SELECT id FROM products WHERE slug = $1 AND vendor_id = $2`;
//       const params: any[] = [slug, vendorId];

//       if (excludeProductId) {
//         query += ` AND id != $3`;
//         params.push(excludeProductId);
//       }
//       query += ` LIMIT 1`;

//       const result = await SelectQuery(query, params);
//       return result.length > 0;
//     } catch (error) {
//       console.error('Error checking product slug:', error);
//       return false;
//     }
//   }

//   private validateAdmin(req: any): void {
//     const adminId = req?.user?.id;
//     if (!adminId) {
//       throw new BadRequestException('Admin ID is required');
//     }

//     const isAdmin = req?.user?.roles?.includes('admin') || req?.user?.role === 'admin';
//     if (!isAdmin) {
//       throw new ForbiddenException('Admin access required');
//     }
//   }

//   // ==================== VENDOR ENDPOINTS ====================

//   @Post('vendor/create')
//   @HttpCode(HttpStatus.CREATED)
//   @UseGuards(AuthGuard, RoleGuard, VendorGuard)
//   @RequireActiveVendor()
//   @FormDataRequest()
//   @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
//   async createProduct(
//     @Req() req: FastifyRequest,
//     @Body() body: CreateProductDto
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       if (!req.user) {
//         throw new BadRequestException('User authentication required');
//       }

//       const vendorId = await this.getVendorId(req.user.id);
//       const { files, cleanedBody } = this.commonFileProcessor.extractFilesFromBody(body);

//       console.log("🚀 ~ Files to process:", files.length);
//       console.log("🚀 ~ Cleaned body keys:", Object.keys(cleanedBody));

//       let processedGalleryData: any[] = [];

//       if (files.length > 0) {
//         console.log("🚀 ~ Processing files for Cloudinary upload...");
//         const uploadedFiles = await this.commonFileProcessor.processFiles(files, 'product', this.getFileUploadConfig());
//         console.log("🚀 ~ Files uploaded to Cloudinary:", uploadedFiles);

//         processedGalleryData = this.processGalleryData(uploadedFiles, cleanedBody);
//       }

//       // Generate slug if not provided
//       if (!cleanedBody.slug && cleanedBody.name) {
//         cleanedBody.slug = await this.generateUniqueProductSlug(generateSlug(cleanedBody.name), vendorId);
//       }

//       // UPDATED: Enhanced createProductData to handle all schema fields
//       const createProductData: any = {
//         ...cleanedBody,
//         vendor_id: Number(vendorId),
//         created_by: req.user.id,
//         created_at: new Date(),
//         gallery: processedGalleryData,

//         // Set defaults for required fields from schema
//         base_currency_id: cleanedBody.base_currency_id || 3,
//         min_order_quantity: cleanedBody.min_order_quantity || 1,
//         stock_quantity: cleanedBody.stock_quantity || 0,
//         low_stock_threshold: cleanedBody.low_stock_threshold || 5,
//         track_quantity: cleanedBody.track_quantity !== undefined ? cleanedBody.track_quantity : true,
//         sold_individually: cleanedBody.sold_individually || false,
//         virtual_product: cleanedBody.virtual_product || false,
//         downloadable: cleanedBody.downloadable || false,
//         status: cleanedBody.status || 'draft',
//         visibility: cleanedBody.visibility || 'visible',
//         is_featured: cleanedBody.is_featured || false,
//         is_bestseller: cleanedBody.is_bestseller || false,
//         is_new_arrival: cleanedBody.is_new_arrival || false,
//         is_on_sale: cleanedBody.is_on_sale || false,
//         is_active: cleanedBody.is_active !== undefined ? cleanedBody.is_active : true,

//         // Handle array fields with defaults
//         search_keywords: cleanedBody.search_keywords || [],
//         tags: cleanedBody.tags || [],
//         gallery_urls: cleanedBody.gallery_urls || [],
//         video_urls: cleanedBody.video_urls || [],
//         product_data: cleanedBody.product_data || {},

//         // Handle nested arrays with defaults
//         prices: cleanedBody.prices || [],
//         translations: cleanedBody.translations || [],
//         variants: cleanedBody.variants || [],
//         specifications: cleanedBody.specifications || [],
//         variant_combinations: cleanedBody.variant_combinations || [],
//         attributes: cleanedBody.attributes || [],
//         product_attributes: cleanedBody.product_attributes || []
//       };

//       // REMOVED: No longer deleting gallery field since it's the correct field name
//       // delete createProductData.product_gallery; // This line is removed

//       console.log("🚀 ~ Final createProductData:", createProductData);
//       const product = await this.productsRepository.createProduct(createProductData);

//       return ApiResponse.created(product, 'Product created successfully');
//     } catch (error) {
//       console.error('❌ Create product error:', error);
//       if (error instanceof BadRequestException) throw error;
//       throw new BadRequestException(`Failed to create product: ${error.message}`);
//     }
//   }

//   @Put('vendor/update/:id')
//   @UseGuards(AuthGuard, RoleGuard, VendorGuard)
//   @RequireActiveVendor()
//   @FormDataRequest()
//   @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
//   async updateProduct(
//     @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
//     @Req() req: FastifyRequest,
//     @Body() body: UpdateProductDto
//   ): Promise<ApiResponseFormat<any>> {
//     console.log("🚀 ~ ProductsController ~ updateProduct ~ body:", body)
//     try {
//       if (!req.user) {
//         throw new BadRequestException('User authentication required');
//       }

//       const vendorId = await this.getVendorId(req.user.id);

//       // Verify ownership
//       const existingProduct = await this.productsRepository.getProductById(id);
//       if (!existingProduct || existingProduct.vendor_id !== vendorId) {
//         throw new ForbiddenException('You can only update your own products');
//       }

//       const { files, cleanedBody } = this.commonFileProcessor.extractFilesFromBody(body);
//       console.log("🚀 ~ Files to process:", files.length);
//       console.log("🚀 ~ Gallery items received:", cleanedBody.gallery?.length || 0);

//       let processedGalleryData: any[] = [];

//       // Check if there are files to upload or gallery updates needed
//       const hasFilesToUpload = files.length > 0;
//       const hasGalleryUpdates = cleanedBody.gallery && Array.isArray(cleanedBody.gallery);

//       if (hasFilesToUpload || hasGalleryUpdates) {
//         let uploadedFiles = {};

//         if (hasFilesToUpload) {
//           console.log("🚀 ~ Processing files for Cloudinary upload...");
//           uploadedFiles = await this.commonFileProcessor.processFiles(files, 'product', this.getFileUploadConfig());
//           console.log("🚀 ~ Files uploaded to Cloudinary:", uploadedFiles);
//         }

//         processedGalleryData = this.processGalleryData(
//           uploadedFiles,
//           cleanedBody,
//           existingProduct.name,
//           true // isUpdate flag
//         );

//         console.log("🚀 ~ Processed gallery data:", processedGalleryData);
//       }

//       // Generate slug if name is being updated and slug is not provided
//       if (cleanedBody.name && !cleanedBody.slug && cleanedBody.name !== existingProduct.name) {
//         cleanedBody.slug = await this.generateUniqueProductSlug(generateSlug(cleanedBody.name), vendorId, id);
//       }

//       const updateData: any = {
//         ...cleanedBody,
//         vendor_id: Number(vendorId),
//         updated_by: req.user.id,
//         updated_at: new Date(),

//         // Handle boolean fields properly (maintain existing values if not provided)
//         track_quantity: cleanedBody.track_quantity !== undefined
//           ? cleanedBody.track_quantity
//           : existingProduct.track_quantity,
//         sold_individually: cleanedBody.sold_individually !== undefined
//           ? cleanedBody.sold_individually
//           : existingProduct.sold_individually,
//         virtual_product: cleanedBody.virtual_product !== undefined
//           ? cleanedBody.virtual_product
//           : existingProduct.virtual_product,
//         downloadable: cleanedBody.downloadable !== undefined
//           ? cleanedBody.downloadable
//           : existingProduct.downloadable,
//         is_featured: cleanedBody.is_featured !== undefined
//           ? cleanedBody.is_featured
//           : existingProduct.is_featured,
//         is_bestseller: cleanedBody.is_bestseller !== undefined
//           ? cleanedBody.is_bestseller
//           : existingProduct.is_bestseller,
//         is_new_arrival: cleanedBody.is_new_arrival !== undefined
//           ? cleanedBody.is_new_arrival
//           : existingProduct.is_new_arrival,
//         is_on_sale: cleanedBody.is_on_sale !== undefined
//           ? cleanedBody.is_on_sale
//           : existingProduct.is_on_sale,
//         is_active: cleanedBody.is_active !== undefined
//           ? cleanedBody.is_active
//           : existingProduct.is_active,

//         // Handle array fields (merge with existing if not provided)
//         search_keywords: cleanedBody.search_keywords !== undefined
//           ? cleanedBody.search_keywords
//           : existingProduct.search_keywords || [],
//         tags: cleanedBody.tags !== undefined
//           ? cleanedBody.tags
//           : existingProduct.tags || [],
//         gallery_urls: cleanedBody.gallery_urls !== undefined
//           ? cleanedBody.gallery_urls
//           : existingProduct.gallery_urls || [],
//         video_urls: cleanedBody.video_urls !== undefined
//           ? cleanedBody.video_urls
//           : existingProduct.video_urls || [],
//       };

//       // Only update gallery if there are changes
//       if (processedGalleryData.length > 0) {
//         updateData.gallery = processedGalleryData;
//       }

//       console.log("🚀 ~ ProductsController ~ updateProduct ~ updateData:", updateData)

//       const updatedProduct = await this.productsRepository.updateProduct(id, updateData);
//       return ApiResponse.success(updatedProduct, 'Product updated successfully');
//     } catch (error) {
//       console.error('❌ Update product error:', error);
//       if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new BadRequestException(`Failed to update product: ${error.message}`);
//     }
//   }

//   @Post('vendor/get-products-by-id')
//   @UseGuards(AuthGuard, RoleGuard, VendorGuard)
//   async getProductById(@Body() body: { product_id: number }, @Request() req?: any): Promise<ApiResponseFormat<any>> {
//     try {
//       const vendorId = await this.getVendorId(req.user.id);

//       if (!body.product_id) {
//         throw new BadRequestException('Product ID is required');
//       }

//       const product = await this.productsRepository.getProductByIdWithDetails(body.product_id, vendorId);

//       if (!product) {
//         throw new NotFoundException('Product not found or access denied');
//       }

//       return ApiResponse.success(product, 'Product retrieved successfully');
//     } catch (error) {
//       console.error('Get product by ID error:', error);
//       if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
//       throw new BadRequestException('Failed to retrieve product');
//     }
//   }

//   @Get('vendor/list')
//   @UseGuards(AuthGuard, RoleGuard, VendorGuard)
//   @RequireActiveVendor()
//   @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
//   async getVendorProducts(@Query() query: ProductFilterDto, @Request() req?: any): Promise<ApiResponseFormat<any>> {
//     try {
//       const vendorId = await this.getVendorId(req.user.id);
//       console.log("🚀 ~ ProductsController ~ getVendorProducts ~ vendorId:", vendorId)
//       const result = await this.productsRepository.getVendorProducts(vendorId, query);
//       return ApiResponse.success(result, 'Products retrieved successfully');
//     } catch (error) {
//       console.error('Get vendor products error:', error);
//       if (error instanceof BadRequestException) throw error;
//       throw new BadRequestException('Failed to retrieve products');
//     }
//   }

//   @Delete('vendor/delete/:id')
//   @UseGuards(AuthGuard, RoleGuard, VendorGuard)
//   @HttpCode(HttpStatus.NO_CONTENT)
//   async deleteProduct(@Param('id', ParseIntPipe) id: number, @Request() req?: any): Promise<ApiResponseFormat<boolean>> {
//     try {
//       const vendorId = await this.getVendorId(req.user.id);

//       // Verify ownership
//       const existingProduct = await this.productsRepository.getProductById(id);
//       if (!existingProduct || existingProduct.vendor_id !== vendorId) {
//         throw new ForbiddenException('You can only delete your own products');
//       }

//       const deleted = await this.productsRepository.deleteProduct(id);
//       return ApiResponse.success(deleted, 'Product deleted successfully');
//     } catch (error) {
//       console.error('Delete product error:', error);
//       if (error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
//       throw new BadRequestException('Failed to delete product');
//     }
//   }

//   // ==================== ADMIN ENDPOINTS ====================

//   @Put('admin/approved/:id')
//   @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
//   async approveProduct(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() approvalDto: ApprovalDto,
//     @Request() req?: any
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       this.validateAdmin(req);

//       const approvedProduct = await this.productsRepository.approveProduct(id, approvalDto, req.user.id);

//       if (!approvedProduct) {
//         throw new NotFoundException('Product not found');
//       }

//       return ApiResponse.success(approvedProduct, `Product ${approvalDto.status || 'approved'} successfully`);
//     } catch (error) {
//       console.error('Approve product error:', error);
//       if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new BadRequestException('Failed to update product status');
//     }
//   }

//   @Post('admin/view')
//   async adminViewProduct(@Body() body: { product_id: number }, @Request() req?: any): Promise<ApiResponseFormat<any>> {
//     try {
//       this.validateAdmin(req);

//       if (!body.product_id) {
//         throw new BadRequestException('Product ID is required');
//       }

//       const product = await this.productsRepository.getProductByIdWithDetails(body.product_id);

//       if (!product) {
//         throw new NotFoundException('Product not found');
//       }

//       return ApiResponse.success(product, 'Product retrieved successfully');
//     } catch (error) {
//       console.error('Admin view product error:', error);
//       if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new BadRequestException('Failed to retrieve product');
//     }
//   }

//   // ==================== USER/PUBLIC ENDPOINTS ====================

//   @Post('product-search')
//   @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
//   async searchProducts(@Body() filters: ProductFilterDto): Promise<ApiResponseFormat<any>> {
//     try {
//       const result = await this.productsRepository.searchProducts(filters);
//       return ApiResponse.success(result, 'Products retrieved successfully');
//     } catch (error) {
//       console.error('Search products error:', error);
//       throw new BadRequestException('Failed to retrieve products');
//     }
//   }

//   @Post('product-filter')
//   async getProductFilters(
//     @Body() body: {
//       category_id?: number;
//       brand_id?: number;
//       vendor_id?: number;
//       search?: string;
//       language_id?: number;
//       currency_id?: number;
//     }
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const filters = await this.productsRepository.getProductFilters(body);
//       return ApiResponse.success(filters, 'Filters retrieved successfully');
//     } catch (error) {
//       console.error('Get product filters error:', error);
//       throw new BadRequestException('Failed to retrieve filters');
//     }
//   }

//   //new
//   @Post('quick-search')
//   async quickSearch(
//     @Body() body: { query: string; limit?: number; language_id?: number }
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const { query, limit = 10, language_id } = body;
//       const results = await this.productsRepository.quickSearch(query, limit, language_id);
//       return ApiResponse.success(results, 'Quick search results retrieved');
//     } catch (error) {
//       console.error('Quick search error:', error);
//       throw new BadRequestException('Failed to perform quick search');
//     }
//   }

//   @Get('trending')
//   async getTrendingProducts(
//     @Query() query: { limit?: number; period?: string; language_id?: number }
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const { limit = 20, period = '7days', language_id } = query;
//       const products = await this.productsRepository.getTrendingProducts(limit, period, language_id);
//       return ApiResponse.success(products, 'Trending products retrieved successfully');
//     } catch (error) {
//       console.error('Get trending products error:', error);
//       throw new BadRequestException('Failed to retrieve trending products');
//     }
//   }

//   @Get('recommendations/:productId')
//   async getRecommendations(
//     @Param('productId', ParseIntPipe) productId: number,
//     @Query() query: { limit?: number; language_id?: number }
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const { limit = 10, language_id } = query;
//       const recommendations = await this.productsRepository.getRecommendations(productId, limit, language_id);
//       return ApiResponse.success(recommendations, 'Recommendations retrieved successfully');
//     } catch (error) {
//       console.error('Get recommendations error:', error);
//       throw new BadRequestException('Failed to retrieve recommendations');
//     }
//   }
//   // new end 

//   @Post('product-list')
//   @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
//   async getProductsList(@Body() filters: ProductFilterDto): Promise<ApiResponseFormat<any>> {
//     try {
//       const publicFilters = { ...filters, status: ProductStatus.ACTIVE, visibility: 'visible' };
//       //@ts-ignore
//       const result = await this.productsRepository.getPublicProducts(publicFilters);
//       return ApiResponse.success(result, 'Products retrieved successfully');
//     } catch (error) {
//       console.error('Get products list error:', error);
//       throw new BadRequestException('Failed to retrieve products');
//     }
//   }

//   @Post('product-detail')
//   async getProductDetail(
//     @Body() body: {
//       product_id?: number;
//       slug?: string;
//       language_id?: number;
//       currency_id?: number;
//       user_id?: number;
//       combination_id?: number;
//       include_reviews?: boolean;
//       include_related?: boolean;
//       reviews_page?: number;
//       reviews_limit?: number;
//     },
//     @Request() req?: any // Optional for getting authenticated user
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       if (!body.product_id && !body.slug) {
//         throw new BadRequestException('Product ID or slug is required');
//       }

//       // Extract parameters with defaults
//       const {
//         product_id,
//         slug,
//         language_id,
//         currency_id = 3,
//         user_id,
//         combination_id,
//         include_reviews = true,
//         include_related = true,
//         reviews_page = 1,
//         reviews_limit = 10
//       } = body;

//       // Get user ID from request if authenticated (optional)
//       const authenticatedUserId = req?.user?.id || user_id;

//       // Validate pagination parameters
//       const validatedReviewsPage = Math.max(1, reviews_page);
//       const validatedReviewsLimit = Math.min(50, Math.max(1, reviews_limit)); // Max 50 reviews per page

//       // Validate combination_id if provided
//       if (combination_id && (!Number.isInteger(combination_id) || combination_id <= 0)) {
//         throw new BadRequestException('Invalid combination ID');
//       }

//       let product;
//       if (product_id) {
//         // Get product by ID with enhanced details
//         product = await this.productsRepository.getPublicProductByIdWithDetails(
//           product_id,
//           language_id,
//           currency_id,
//           authenticatedUserId,
//           combination_id,
//           include_reviews,
//           include_related,
//           validatedReviewsPage,
//           validatedReviewsLimit
//         );
//       } else {
//         // Get product by slug - need to get product ID first
//         const productBySlug = await this.productsRepository.getPublicProductBySlugWithDetails(
//           slug,
//           language_id,
//           currency_id
//         );

//         if (productBySlug) {
//           // Now get full details with enhanced method
//           product = await this.productsRepository.getPublicProductByIdWithDetails(
//             productBySlug.id,
//             language_id,
//             currency_id,
//             authenticatedUserId,
//             combination_id,
//             include_reviews,
//             include_related,
//             validatedReviewsPage,
//             validatedReviewsLimit
//           );
//         }
//       }

//       if (!product) {
//         throw new NotFoundException('Product not found or not available');
//       }

//       // Note: View count increment is now handled inside the repository method
//       // so we don't need to call it separately here

//       // Build response with additional metadata
//       const response = {
//         product,
//         // Add request context for frontend
//         request_context: {
//           currency_id: currency_id,
//           language_id: language_id,
//           user_authenticated: !!authenticatedUserId,
//           combination_selected: !!combination_id,
//           reviews_included: include_reviews,
//           related_included: include_related
//         },
//         // Add helpful flags for frontend
//         ui_flags: {
//           show_reviews: include_reviews && product.meta?.total_reviews > 0,
//           show_related: include_related && product.related_products?.length > 0,
//           show_variants: product.meta?.has_variants,
//           show_combinations: product.meta?.has_combinations,
//           show_faqs: product.meta?.has_faqs,
//           can_add_to_wishlist: !!authenticatedUserId,
//           has_discount: product.discount_percentage > 0,
//           is_in_stock: product.is_in_stock,
//           show_quantity_selector: !product.sold_individually
//         }
//       };

//       return ApiResponse.success(
//         response,
//         `Product detail retrieved successfully${combination_id ? ' with selected variant' : ''}`
//       );

//     } catch (error) {
//       console.error('Get product detail error:', error);

//       // Handle specific error types
//       if (error instanceof BadRequestException || error instanceof NotFoundException) {
//         throw error;
//       }

//       // Handle database or other errors
//       if (error.message?.includes('invalid input syntax')) {
//         throw new BadRequestException('Invalid parameter format');
//       }

//       throw new BadRequestException('Failed to retrieve product detail');
//     }
//   }

//   // Optional: Add a separate endpoint for combination price calculation
//   @Post('product-combination-price')
//   async getProductCombinationPrice(
//     @Body() body: {
//       product_id: number;
//       combination_id: number;
//       currency_id?: number;
//       quantity?: number;
//     }
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const { product_id, combination_id, currency_id = 1, quantity = 1 } = body;

//       if (!product_id || !combination_id) {
//         throw new BadRequestException('Product ID and combination ID are required');
//       }

//       if (quantity <= 0 || quantity > 100) {
//         throw new BadRequestException('Quantity must be between 1 and 100');
//       }

//       const priceData = await this.productsRepository.getProductCombinationPrice(
//         product_id,
//         combination_id,
//         currency_id,
//         quantity
//       );

//       return ApiResponse.success(priceData, 'Combination price calculated successfully');

//     } catch (error) {
//       console.error('Get combination price error:', error);

//       if (error instanceof BadRequestException) {
//         throw error;
//       }

//       if (error.message?.includes('Combination not found')) {
//         throw new NotFoundException('Product combination not found');
//       }

//       throw new BadRequestException('Failed to calculate combination price');
//     }
//   }
// }


//v2



import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ValidationPipe,
  UsePipes,
  Req,
  Query,
  Get
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ProductsRepository } from './products.repository';
import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductFilterDto,
  ApprovalDto,
} from '../products/dtos/products.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard, VendorGuard, RequireActiveVendor } from 'src/common/guards/role.guard';
import {   generateSlug,   } from 'src/common/utils/api-helpers';
import { FormDataRequest } from 'nestjs-form-data';
import { SelectQuery } from 'src/db/postgres.client';
import { CommonFileProcessorService } from '../cloudinary/common-file-processing.service';
import { ProductStatus } from 'src/common/utils/enums';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly commonFileProcessor: CommonFileProcessorService
  ) { }

  // ==================== HELPER METHODS ====================

  private async getVendorId(userId: number): Promise<number> {
    const getVendorIdData: any = await SelectQuery(
      `SELECT id FROM vendors WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    const vendorId = getVendorIdData[0]?.id;
    if (!vendorId) {
      throw new BadRequestException('Vendor ID is required');
    }
    return vendorId;
  }

  private getFileUploadConfig() {
    return {
      allowedMimeTypes: [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'image/svg+xml', 'image/bmp', 'image/tiff',
        // Videos
        'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
        'video/wmv', 'video/flv', 'video/mkv',
        // Documents
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv',
        // Audio
        'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac',
        // Archives
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
      ],
      maxSize: 100 * 1024 * 1024, // 100MB
    };
  }

  private processGalleryData(
    uploadedFiles: Record<string, any>,
    cleanedBody: any,
    productName?: string,
    isUpdate: boolean = false
  ): any[] {
    // Convert uploaded files to a uniform array format
    const allUploadedFiles: any[] = [];

    // Helper function to convert value to array
    const toArray = (value: any): any[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return [value];
    };

    // Process each file type
    const fileTypeMap = {
      images: { type: 'image', resource_type: 'image' },
      videos: { type: 'video', resource_type: 'video' },
      documents: { type: 'document', resource_type: 'raw' },
      audios: { type: 'audio', resource_type: 'video' }
    };

    Object.entries(fileTypeMap).forEach(([key, config]) => {
      const files = toArray(uploadedFiles[key]);
      files.forEach(url => {
        if (url) {
          allUploadedFiles.push({
            url: typeof url === 'string' ? url : url.url || url,
            type: config.type,
            resource_type: config.resource_type
          });
        }
      });
    });

    console.log("🚀 ~ Processed uploaded files:", allUploadedFiles);

    // If no gallery metadata provided, create basic gallery data
    if (!cleanedBody.gallery || !Array.isArray(cleanedBody.gallery)) {
      if (allUploadedFiles.length === 0) return [];

      return allUploadedFiles.map((uploadedFile, index) => ({
        media_type: uploadedFile.type,
        url: uploadedFile.url,
        thumbnail_url: this.generateThumbnailUrl(uploadedFile),
        alt_text: cleanedBody.name || productName || '',
        title: `${cleanedBody.name || productName} - ${uploadedFile.type} ${index + 1}`,
        description: '',
        file_size: null,
        mime_type: this.getMimeType(uploadedFile.type, uploadedFile.resource_type),
        width: null,
        height: null,
        duration: null,
        sort_order: index,
        is_primary: index === 0,
        is_active: true
      }));
    }

    // Process gallery with metadata
    const processedGalleryItems: any[] = [];
    let uploadedFileIndex = 0;

    for (let index = 0; index < cleanedBody.gallery.length; index++) {
      const galleryItem = cleanedBody.gallery[index];

      // Convert id to number to handle string IDs
      const itemId = parseInt(galleryItem.id) || 0;

      // Check if this item specifically needs a file upload
      // This should be determined by frontend logic - e.g., a flag like 'needsUpload' or checking if URL is a placeholder
      const needsFileUpload = galleryItem.needsUpload ||
        galleryItem._needsUpload ||
        (galleryItem.url && typeof galleryItem.url === 'string' && galleryItem.url.startsWith('temp_')) ||
        itemId === 0; // New items always need upload

      const hasUploadData = uploadedFileIndex < allUploadedFiles.length;

      if (needsFileUpload && hasUploadData) {
        const uploadedFile = allUploadedFiles[uploadedFileIndex];

        if (itemId === 0) {
          // New item with uploaded file
          processedGalleryItems.push({
            media_type: uploadedFile.type, // Use uploaded file type
            url: uploadedFile.url,
            thumbnail_url: this.generateThumbnailUrl(uploadedFile),
            alt_text: galleryItem.alt_text || cleanedBody.name || productName || '',
            title: galleryItem.title || `${cleanedBody.name || productName} - ${uploadedFile.type} ${index + 1}`,
            description: galleryItem.description || '',
            file_size: galleryItem.file_size || null,
            mime_type: this.getMimeType(uploadedFile.type, uploadedFile.resource_type),
            width: galleryItem.width || null,
            height: galleryItem.height || null,
            duration: galleryItem.duration || null,
            sort_order: galleryItem.sort_order !== undefined ? galleryItem.sort_order : index,
            is_primary: galleryItem.is_primary || (index === 0 && !processedGalleryItems.some(item => item.is_primary)),
            is_active: galleryItem.is_active !== false,
            _action: 'create' // Mark as new
          });
        } else {
          // Existing item that needs to be updated with new file
          processedGalleryItems.push({
            id: itemId,
            media_type: uploadedFile.type, // Use uploaded file type
            url: uploadedFile.url, // Use new uploaded URL
            thumbnail_url: this.generateThumbnailUrl(uploadedFile), // Generate new thumbnail
            alt_text: galleryItem.alt_text || cleanedBody.name || productName || '',
            title: galleryItem.title || `${cleanedBody.name || productName} - ${uploadedFile.type} ${index + 1}`,
            description: galleryItem.description || '',
            file_size: galleryItem.file_size || null,
            mime_type: this.getMimeType(uploadedFile.type, uploadedFile.resource_type),
            width: galleryItem.width || null,
            height: galleryItem.height || null,
            duration: galleryItem.duration || null,
            sort_order: galleryItem.sort_order !== undefined ? galleryItem.sort_order : index,
            is_primary: galleryItem.is_primary || false,
            is_active: galleryItem.is_active !== false,
            _action: 'update' // Mark for update
          });
        }

        uploadedFileIndex++;
      } else if (itemId > 0) {
        // Existing item that doesn't need file update - keep as is
        processedGalleryItems.push({
          id: itemId,
          media_type: galleryItem.media_type,
          url: galleryItem.url,
          thumbnail_url: galleryItem.thumbnail_url,
          alt_text: galleryItem.alt_text || cleanedBody.name || productName || '',
          title: galleryItem.title || `${cleanedBody.name || productName} - ${galleryItem.media_type} ${index + 1}`,
          description: galleryItem.description || '',
          file_size: galleryItem.file_size || null,
          mime_type: galleryItem.mime_type,
          width: galleryItem.width || null,
          height: galleryItem.height || null,
          duration: galleryItem.duration || null,
          sort_order: galleryItem.sort_order !== undefined ? galleryItem.sort_order : index,
          is_primary: galleryItem.is_primary || false,
          is_active: galleryItem.is_active !== false,
          _action: 'keep' // Mark to keep existing
        });
      } else if (needsFileUpload && !hasUploadData) {
        // Item needs upload but no file available - warn and skip
        console.warn(`Gallery item at index ${index} needs upload but no file available. Skipping.`);
      } else {
        // Item without id and without upload - skip or warn
        console.warn(`Gallery item at index ${index} has no id and no file to upload. Skipping.`);
      }
    }

    // Handle any remaining uploaded files that weren't matched to gallery items
    while (uploadedFileIndex < allUploadedFiles.length) {
      const uploadedFile = allUploadedFiles[uploadedFileIndex];
      const newIndex = processedGalleryItems.length;

      processedGalleryItems.push({
        media_type: uploadedFile.type,
        url: uploadedFile.url,
        thumbnail_url: this.generateThumbnailUrl(uploadedFile),
        alt_text: cleanedBody.name || productName || '',
        title: `${cleanedBody.name || productName} - ${uploadedFile.type} ${newIndex + 1}`,
        description: '',
        file_size: null,
        mime_type: this.getMimeType(uploadedFile.type, uploadedFile.resource_type),
        width: null,
        height: null,
        duration: null,
        sort_order: newIndex,
        is_primary: newIndex === 0 && !processedGalleryItems.some(item => item.is_primary),
        is_active: true,
        _action: 'create' // Mark as new
      });

      uploadedFileIndex++;
      console.log(`🚀 ~ Added remaining uploaded file as new gallery item: ${uploadedFile.url}`);
    }

    return processedGalleryItems;
  }


  private generateThumbnailUrl(uploadedFile: any): string | null {
    if (uploadedFile.resource_type === 'image') {
      return uploadedFile.url.replace('/upload/', '/upload/w_300,h_300,c_fill/');
    }
    if (uploadedFile.resource_type === 'video' && uploadedFile.type === 'video') {
      return uploadedFile.url.replace('/upload/', '/upload/w_300,h_300,c_fill/').replace(/\.[^.]+$/, '.jpg');
    }
    return null;
  }

  private getMimeType(fileType: string, resourceType: string): string {
    const mimeTypeMap: Record<string, string> = {
      'image': 'image/webp', 'video': 'video/mp4', 'audio': 'audio/mp3', 'document': 'application/octet-stream',
      'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp',
      'mp4': 'video/mp4', 'webm': 'video/webm', 'ogg': 'video/ogg', 'mp3': 'audio/mp3', 'wav': 'audio/wav',
      'pdf': 'application/pdf', 'doc': 'application/msword',
    };
    return mimeTypeMap[fileType] || mimeTypeMap[resourceType] || 'application/octet-stream';
  }

  private async generateUniqueProductSlug(baseSlug: string, vendorId: number, excludeProductId?: number): Promise<string> {
    let counter = 0;
    let slug = baseSlug;

    while (await this.isProductSlugTaken(slug, vendorId, excludeProductId)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
    return slug;
  }

  private convertToProperTypes(data: any): any {
    const converted = { ...data };

    // Convert numeric fields
    const numericFields = [
      'category_id', 'brand_id', 'tax_id', 'base_currency_id',
      'price', 'compare_price', 'cost_price', 'margin_percentage', 'weight',
      'min_order_quantity', 'max_order_quantity', 'stock_quantity', 'low_stock_threshold',
      'download_limit', 'download_expiry', 'avg_rating', 'total_reviews',
      'total_sales', 'view_count', 'wishlist_count'
    ];

    numericFields.forEach(field => {
      if (converted[field] !== undefined && converted[field] !== null && converted[field] !== '') {
        const num = parseFloat(converted[field]);
        converted[field] = isNaN(num) ? undefined : num;
      }
    });

    // Convert boolean fields
    const booleanFields = [
      'track_quantity', 'sold_individually', 'virtual_product', 'downloadable',
      'is_featured', 'is_bestseller', 'is_new_arrival', 'is_on_sale', 'is_active'
    ];

    booleanFields.forEach(field => {
      if (converted[field] !== undefined) {
        converted[field] = converted[field] === true || converted[field] === 'true';
      }
    });

    return converted;
  }


  private async isProductSlugTaken(slug: string, vendorId: number, excludeProductId?: number): Promise<boolean> {
    try {
      let query = `SELECT id FROM products WHERE slug = $1 AND vendor_id = $2`;
      const params: any[] = [slug, vendorId];

      if (excludeProductId) {
        query += ` AND id != $3`;
        params.push(excludeProductId);
      }
      query += ` LIMIT 1`;

      const result = await SelectQuery(query, params);
      return result.length > 0;
    } catch (error) {
      console.error('Error checking product slug:', error);
      return false;
    }
  }

  private validateAdmin(req: any): void {
    const adminId = req?.user?.id;
    if (!adminId) {
      throw new BadRequestException('Admin ID is required');
    }

    const isAdmin = req?.user?.roles?.includes('admin') || req?.user?.role === 'admin';
    if (!isAdmin) {
      throw new ForbiddenException('Admin access required');
    }
  }

  // ==================== VENDOR ENDPOINTS ====================

  @Post('vendor/create')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard, RoleGuard, VendorGuard)
  @RequireActiveVendor()
  @FormDataRequest()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  async createProduct(
    @Req() req: FastifyRequest,
    @Body() body: CreateProductDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      if (!req.user) {
        throw new BadRequestException('User authentication required');
      }

      const vendorId = await this.getVendorId(req.user.id);
      const { files, cleanedBody } = this.commonFileProcessor.extractFilesFromBody(body);
      const convertedBody = this.convertToProperTypes(cleanedBody);

      console.log("🚀 ~ Files to process:", files.length);
      console.log("🚀 ~ Cleaned body keys:", Object.keys(cleanedBody));

      let processedGalleryData: any[] = [];

      if (files.length > 0) {
        console.log("🚀 ~ Processing files for Cloudinary upload...");
        const uploadedFiles = await this.commonFileProcessor.processFiles(files, 'product', this.getFileUploadConfig());
        console.log("🚀 ~ Files uploaded to Cloudinary:", uploadedFiles);

        processedGalleryData = this.processGalleryData(uploadedFiles, cleanedBody);
      }

      // Generate slug if not provided
      if (!cleanedBody.slug && cleanedBody.name) {
        cleanedBody.slug = await this.generateUniqueProductSlug(generateSlug(cleanedBody.name), vendorId);
      }

      // UPDATED: Enhanced createProductData to handle all schema fields
      const createProductData: any = {
        ...convertedBody,
        vendor_id: Number(vendorId),
        created_by: req.user.id,
        created_at: new Date(),
        gallery: processedGalleryData,

        // EXISTING FIELDS (keep as is)
        base_currency_id: cleanedBody.base_currency_id || 3,
        min_order_quantity: cleanedBody.min_order_quantity || 1,
        stock_quantity: cleanedBody.stock_quantity || 0,
        low_stock_threshold: cleanedBody.low_stock_threshold || 5,
        track_quantity: cleanedBody.track_quantity !== undefined ? cleanedBody.track_quantity : true,
        sold_individually: cleanedBody.sold_individually || false,
        virtual_product: cleanedBody.virtual_product || false,
        downloadable: cleanedBody.downloadable || false,
        status: cleanedBody.status || 'draft',
        visibility: cleanedBody.visibility || 'visible',
        is_featured: cleanedBody.is_featured || false,
        is_bestseller: cleanedBody.is_bestseller || false,
        is_new_arrival: cleanedBody.is_new_arrival || false,
        is_on_sale: cleanedBody.is_on_sale || false,
        is_active: cleanedBody.is_active !== undefined ? cleanedBody.is_active : true,

        // ADD THESE MISSING FIELDS:

        // UUID field
        // uuid: cleanedBody.uuid || undefined,

        // Analytics fields
        avg_rating: cleanedBody.avg_rating || undefined,
        total_reviews: cleanedBody.total_reviews || undefined,
        total_sales: cleanedBody.total_sales || undefined,
        view_count: cleanedBody.view_count || undefined,
        wishlist_count: cleanedBody.wishlist_count || undefined,

        // Pricing fields
        margin_percentage: cleanedBody.margin_percentage || undefined,

        // Download fields
        download_limit: cleanedBody.download_limit || undefined,
        download_expiry: cleanedBody.download_expiry || undefined,

        // SEO fields
        meta_title: cleanedBody.meta_title || undefined,
        meta_description: cleanedBody.meta_description || undefined,
        meta_keywords: cleanedBody.meta_keywords || undefined,
        featured_image_url: cleanedBody.featured_image_url || undefined,
        seo_data: cleanedBody.seo_data || undefined,

        // Security field
        password_protection: cleanedBody.password_protection || undefined,

        // Date fields - convert to Date objects if provided
        sale_starts_at: cleanedBody.sale_starts_at ? new Date(cleanedBody.sale_starts_at) : undefined,
        sale_ends_at: cleanedBody.sale_ends_at ? new Date(cleanedBody.sale_ends_at) : undefined,
        publish_at: cleanedBody.publish_at ? new Date(cleanedBody.publish_at) : undefined,

        // EXISTING ARRAY FIELDS (keep as is)
        search_keywords: cleanedBody.search_keywords || [],
        tags: cleanedBody.tags || [],
        gallery_urls: cleanedBody.gallery_urls || [],
        video_urls: cleanedBody.video_urls || [],
        product_data: cleanedBody.product_data || {},
        prices: cleanedBody.prices || [],
        translations: cleanedBody.translations || [],
        variants: cleanedBody.variants || [],
        specifications: cleanedBody.specifications || [],
        variant_combinations: cleanedBody.variant_combinations || [],
        attributes: cleanedBody.attributes || [],
        product_attributes: cleanedBody.product_attributes || []
      };

      // REMOVED: No longer deleting gallery field since it's the correct field name
      // delete createProductData.product_gallery; // This line is removed

      console.log("🚀 ~ Final createProductData:", createProductData);
      const product = await this.productsRepository.createProduct(createProductData);

      return ApiResponse.created(product, 'Product created successfully');
    } catch (error) {
      console.error('❌ Create product error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to create product: ${error.message}`);
    }
  }

  @Put('vendor/update/:id')
  @UseGuards(AuthGuard, RoleGuard, VendorGuard)
  @RequireActiveVendor()
  @FormDataRequest()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  async updateProduct(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
    @Req() req: FastifyRequest,
    @Body() body: UpdateProductDto
  ): Promise<ApiResponseFormat<any>> {
    console.log("🚀 ~ ProductsController ~ updateProduct ~ body:", body)
    try {
      if (!req.user) {
        throw new BadRequestException('User authentication required');
      }

      const vendorId = await this.getVendorId(req.user.id);

      // Verify ownership
      const existingProduct = await this.productsRepository.getProductById(id);
      if (!existingProduct || existingProduct.vendor_id !== vendorId) {
        throw new ForbiddenException('You can only update your own products');
      }

      const { files, cleanedBody } = this.commonFileProcessor.extractFilesFromBody(body);
      const convertedBody = this.convertToProperTypes(cleanedBody);
      console.log("🚀 ~ Files to process:", files.length);
      console.log("🚀 ~ Gallery items received:", cleanedBody.gallery?.length || 0);

      let processedGalleryData: any[] = [];

      // Check if there are files to upload or gallery updates needed
      const hasFilesToUpload = files.length > 0;
      const hasGalleryUpdates = cleanedBody.gallery && Array.isArray(cleanedBody.gallery);

      if (hasFilesToUpload || hasGalleryUpdates) {
        let uploadedFiles = {};

        if (hasFilesToUpload) {
          console.log("🚀 ~ Processing files for Cloudinary upload...");
          uploadedFiles = await this.commonFileProcessor.processFiles(files, 'product', this.getFileUploadConfig());
          console.log("🚀 ~ Files uploaded to Cloudinary:", uploadedFiles);
        }

        processedGalleryData = this.processGalleryData(
          uploadedFiles,
          cleanedBody,
          existingProduct.name,
          true // isUpdate flag
        );

        console.log("🚀 ~ Processed gallery data:", processedGalleryData);
      }

      // Generate slug if name is being updated and slug is not provided
      if (cleanedBody.name && !cleanedBody.slug && cleanedBody.name !== existingProduct.name) {
        cleanedBody.slug = await this.generateUniqueProductSlug(generateSlug(cleanedBody.name), vendorId, id);
      }

      const updateData: any = {
        ...convertedBody,
        vendor_id: Number(vendorId),
        updated_by: req.user.id,
        updated_at: new Date(),

        // Handle boolean fields properly (maintain existing values if not provided)
        track_quantity: cleanedBody.track_quantity !== undefined
          ? cleanedBody.track_quantity
          : existingProduct.track_quantity,
        sold_individually: cleanedBody.sold_individually !== undefined
          ? cleanedBody.sold_individually
          : existingProduct.sold_individually,
        virtual_product: cleanedBody.virtual_product !== undefined
          ? cleanedBody.virtual_product
          : existingProduct.virtual_product,
        downloadable: cleanedBody.downloadable !== undefined
          ? cleanedBody.downloadable
          : existingProduct.downloadable,
        is_featured: cleanedBody.is_featured !== undefined
          ? cleanedBody.is_featured
          : existingProduct.is_featured,
        is_bestseller: cleanedBody.is_bestseller !== undefined
          ? cleanedBody.is_bestseller
          : existingProduct.is_bestseller,
        is_new_arrival: cleanedBody.is_new_arrival !== undefined
          ? cleanedBody.is_new_arrival
          : existingProduct.is_new_arrival,
        is_on_sale: cleanedBody.is_on_sale !== undefined
          ? cleanedBody.is_on_sale
          : existingProduct.is_on_sale,
        is_active: cleanedBody.is_active !== undefined
          ? cleanedBody.is_active
          : existingProduct.is_active,

        // Handle array fields (merge with existing if not provided)
        search_keywords: cleanedBody.search_keywords !== undefined
          ? cleanedBody.search_keywords
          : existingProduct.search_keywords || [],
        tags: cleanedBody.tags !== undefined
          ? cleanedBody.tags
          : existingProduct.tags || [],
        gallery_urls: cleanedBody.gallery_urls !== undefined
          ? cleanedBody.gallery_urls
          : existingProduct.gallery_urls || [],
        video_urls: cleanedBody.video_urls !== undefined
          ? cleanedBody.video_urls
          : existingProduct.video_urls || [],
      };

      // Only update gallery if there are changes
      if (processedGalleryData.length > 0) {
        updateData.gallery = processedGalleryData;
      }

      console.log("🚀 ~ ProductsController ~ updateProduct ~ updateData:", updateData)

      const updatedProduct = await this.productsRepository.updateProduct(id, updateData);
      return ApiResponse.success(updatedProduct, 'Product updated successfully');
    } catch (error) {
      console.error('❌ Update product error:', error);
      if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update product: ${error.message}`);
    }
  }

  @Post('vendor/get-products-by-id')
  @UseGuards(AuthGuard, RoleGuard, VendorGuard)
  async getProductById(@Body() body: { product_id: number }, @Request() req?: any): Promise<ApiResponseFormat<any>> {
    try {
      const vendorId = await this.getVendorId(req.user.id);

      if (!body.product_id) {
        throw new BadRequestException('Product ID is required');
      }

      const product = await this.productsRepository.getProductByIdWithDetails(body.product_id, vendorId);

      if (!product) {
        throw new NotFoundException('Product not found or access denied');
      }

      return ApiResponse.success(product, 'Product retrieved successfully');
    } catch (error) {
      console.error('Get product by ID error:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to retrieve product');
    }
  }

  @Get('vendor/list')
  @UseGuards(AuthGuard, RoleGuard, VendorGuard)
  @RequireActiveVendor()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getVendorProducts(@Query() query: ProductFilterDto, @Request() req?: any): Promise<ApiResponseFormat<any>> {
    try {
      const vendorId = await this.getVendorId(req.user.id);
      console.log("🚀 ~ ProductsController ~ getVendorProducts ~ vendorId:", vendorId)
      const result = await this.productsRepository.getVendorProducts(vendorId, query);
      return ApiResponse.success(result, 'Products retrieved successfully');
    } catch (error) {
      console.error('Get vendor products error:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to retrieve products');
    }
  }

  @Delete('vendor/delete/:id')
  @UseGuards(AuthGuard, RoleGuard, VendorGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(@Param('id', ParseIntPipe) id: number, @Request() req?: any): Promise<ApiResponseFormat<boolean>> {
    try {
      const vendorId = await this.getVendorId(req.user.id);

      // Verify ownership
      const existingProduct = await this.productsRepository.getProductById(id);
      if (!existingProduct || existingProduct.vendor_id !== vendorId) {
        throw new ForbiddenException('You can only delete your own products');
      }

      const deleted = await this.productsRepository.deleteProduct(id);
      return ApiResponse.success(deleted, 'Product deleted successfully');
    } catch (error) {
      console.error('Delete product error:', error);
      if (error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
      throw new BadRequestException('Failed to delete product');
    }
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Put('admin/approved/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async approveProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() approvalDto: ApprovalDto,
    @Request() req?: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      this.validateAdmin(req);

      const approvedProduct = await this.productsRepository.approveProduct(id, approvalDto, req.user.id);

      if (!approvedProduct) {
        throw new NotFoundException('Product not found');
      }

      return ApiResponse.success(approvedProduct, `Product ${approvalDto.status || 'approved'} successfully`);
    } catch (error) {
      console.error('Approve product error:', error);
      if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update product status');
    }
  }

  @Post('admin/view')
  async adminViewProduct(@Body() body: { product_id: number }, @Request() req?: any): Promise<ApiResponseFormat<any>> {
    try {
      this.validateAdmin(req);

      if (!body.product_id) {
        throw new BadRequestException('Product ID is required');
      }

      const product = await this.productsRepository.getProductByIdWithDetails(body.product_id);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return ApiResponse.success(product, 'Product retrieved successfully');
    } catch (error) {
      console.error('Admin view product error:', error);
      if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve product');
    }
  }

  // ==================== USER/PUBLIC ENDPOINTS ====================

  @Post('product-search')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async searchProducts(@Body() filters: ProductFilterDto): Promise<ApiResponseFormat<any>> {
    try {
      const result = await this.productsRepository.searchProducts(filters);
      return ApiResponse.success(result, 'Products retrieved successfully');
    } catch (error) {
      console.error('Search products error:', error);
      throw new BadRequestException('Failed to retrieve products');
    }
  }

  @Post('product-filter')
  async getProductFilters(
    @Body() body: {
      category_id?: number;
      brand_id?: number;
      vendor_id?: number;
      search?: string;
      language_id?: number;
      currency_id?: number;
    }
  ): Promise<ApiResponseFormat<any>> {
    try {
      const filters = await this.productsRepository.getProductFilters(body);
      return ApiResponse.success(filters, 'Filters retrieved successfully');
    } catch (error) {
      console.error('Get product filters error:', error);
      throw new BadRequestException('Failed to retrieve filters');
    }
  }

  //new
  @Post('quick-search')
  async quickSearch(
    @Body() body: { query: string; limit?: number; language_id?: number }
  ): Promise<ApiResponseFormat<any>> {
    try {
      const { query, limit = 10, language_id } = body;
      const results = await this.productsRepository.quickSearch(query, limit, language_id);
      return ApiResponse.success(results, 'Quick search results retrieved');
    } catch (error) {
      console.error('Quick search error:', error);
      throw new BadRequestException('Failed to perform quick search');
    }
  }

  @Get('trending')
  async getTrendingProducts(
    @Query() query: { limit?: number; period?: string; language_id?: number }
  ): Promise<ApiResponseFormat<any>> {
    try {
      const { limit = 20, period = '7days', language_id } = query;
      const products = await this.productsRepository.getTrendingProducts(limit, period, language_id);
      return ApiResponse.success(products, 'Trending products retrieved successfully');
    } catch (error) {
      console.error('Get trending products error:', error);
      throw new BadRequestException('Failed to retrieve trending products');
    }
  }

  @Get('recommendations/:productId')
  async getRecommendations(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: { limit?: number; language_id?: number }
  ): Promise<ApiResponseFormat<any>> {
    try {
      const { limit = 10, language_id } = query;
      const recommendations = await this.productsRepository.getRecommendations(productId, limit, language_id);
      return ApiResponse.success(recommendations, 'Recommendations retrieved successfully');
    } catch (error) {
      console.error('Get recommendations error:', error);
      throw new BadRequestException('Failed to retrieve recommendations');
    }
  }
  // new end 

  @Post('product-list')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getProductsList(@Body() filters: ProductFilterDto): Promise<ApiResponseFormat<any>> {
    try {
      const publicFilters = { ...filters, status: ProductStatus.ACTIVE, visibility: 'visible' };
      //@ts-ignore
      const result = await this.productsRepository.getPublicProducts(publicFilters);
      return ApiResponse.success(result, 'Products retrieved successfully');
    } catch (error) {
      console.error('Get products list error:', error);
      throw new BadRequestException('Failed to retrieve products');
    }
  }

  @Post('product-detail')
  async getProductDetail(
    @Body() body: {
      product_id?: number;
      slug?: string;
      language_id?: number;
      currency_id?: number;
      user_id?: number;
      combination_id?: number;
      include_reviews?: boolean;
      include_related?: boolean;
      reviews_page?: number;  
      reviews_limit?: number;
    },
    @Request() req?: any // Optional for getting authenticated user
  ): Promise<ApiResponseFormat<any>> {
    try {
      if (!body.product_id && !body.slug) {
        throw new BadRequestException('Product ID or slug is required');
      }

      // Extract parameters with defaults
      const {
        product_id,
        slug,
        language_id,
        currency_id = 3,
        user_id,
        combination_id,
        include_reviews = true,
        include_related = true,
        reviews_page = 1,
        reviews_limit = 10
      } = body;

      // Get user ID from request if authenticated (optional)
      const authenticatedUserId = req?.user?.id || user_id;

      // Validate pagination parameters
      const validatedReviewsPage = Math.max(1, reviews_page);
      const validatedReviewsLimit = Math.min(50, Math.max(1, reviews_limit)); // Max 50 reviews per page

      // Validate combination_id if provided
      if (combination_id && (!Number.isInteger(combination_id) || combination_id <= 0)) {
        throw new BadRequestException('Invalid combination ID');
      }

      let product;
      if (product_id) {
        // Get product by ID with enhanced details
        product = await this.productsRepository.getPublicProductByIdWithDetails(
          product_id,
          language_id,
          currency_id,
          authenticatedUserId,
          combination_id,
          include_reviews,
          include_related,
          validatedReviewsPage,
          validatedReviewsLimit
        );
      }
      //  else {
      //   // Get product by slug - need to get product ID first
      //   const productBySlug = await this.productsRepository.getPublicProductBySlugWithDetails(
      //     slug,
      //     language_id,
      //     currency_id
      //   );

      //   if (productBySlug) {
      //     // Now get full details with enhanced method
      //     product = await this.productsRepository.getPublicProductByIdWithDetails(
      //       productBySlug.id,
      //       language_id,
      //       currency_id,
      //       authenticatedUserId,
      //       combination_id,
      //       include_reviews,
      //       include_related,
      //       validatedReviewsPage,
      //       validatedReviewsLimit
      //     );
      //   }
      // }

      if (!product) {
        throw new NotFoundException('Product not found or not available');
      }

      // Note: View count increment is now handled inside the repository method
      // so we don't need to call it separately here

      // Build response with additional metadata
      const response = {
        product,
        // Add request context for frontend
        request_context: {
          currency_id: currency_id,
          language_id: language_id,
          user_authenticated: !!authenticatedUserId,
          combination_selected: !!combination_id,
          reviews_included: include_reviews,
          related_included: include_related
        },
        // Add helpful flags for frontend
        ui_flags: {
          show_reviews: include_reviews && product.meta?.total_reviews > 0,
          show_related: include_related && product.related_products?.length > 0,
          show_variants: product.meta?.has_variants,
          show_combinations: product.meta?.has_combinations,
          show_faqs: product.meta?.has_faqs,
          can_add_to_wishlist: !!authenticatedUserId,
          has_discount: product.discount_percentage > 0,
          is_in_stock: product.is_in_stock,
          show_quantity_selector: !product.sold_individually
        }
      };

      return ApiResponse.success(
        response,
        `Product detail retrieved successfully${combination_id ? ' with selected variant' : ''}`
      );

    } catch (error) {
      console.error('Get product detail error:', error);

      // Handle specific error types
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      // Handle database or other errors
      if (error.message?.includes('invalid input syntax')) {
        throw new BadRequestException('Invalid parameter format');
      }

      throw new BadRequestException('Failed to retrieve product detail');
    }
  }
 
}
