// // import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
// // import { ProductsRepository } from './products.repository';
// // import { ProductQueryDto, CreateProductDto, UpdateProductDto, CreateProductGalleryDto, UpdateProductGalleryDto, CreateProductVariantDto, UpdateProductVariantDto, CreateProductVariantValueDto, UpdateProductVariantValueDto, CreateProductVariantCombinationDto, UpdateProductVariantCombinationDto, CreateProductSpecificationDto, UpdateProductSpecificationDto } from './dtos/product.dto';
// // import { ApiResponseFormat } from 'src/common/utils/common-response';

// // @Injectable()
// // export class ProductsService {
// //   constructor(private readonly productsRepository: ProductsRepository) {}

// //   // --- Helper to check product ownership for vendor operations ---
// //   private async checkProductOwnership(productId: number, vendorId: number): Promise<void> {
// //     const productResponse = await this.productsRepository.findProductByIdAdmin(productId); // Admin query to bypass status/visibility

// //     if (productResponse.status_code === 404) {
// //       throw new NotFoundException(productResponse.message);
// //     }
// //     if (productResponse.status_code === 500) {
// //       throw new InternalServerErrorException(productResponse.message);
// //     }
// //     if (productResponse.result.vendor_id !== vendorId) {
// //       throw new UnauthorizedException('Product does not belong to this vendor.');
// //     }
// //   }

// //   // --- Public/User-facing APIs ---
// //   async getProductsForUser(query: ProductQueryDto): Promise<ApiResponseFormat<any[]>> {
// //     const response = await this.productsRepository.findAllActiveProducts(query);
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async getProductByIdForUser(id: number): Promise<ApiResponseFormat<any>> {
// //     const response = await this.productsRepository.findActiveProductById(id);
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   // --- Vendor-facing APIs (Product Core) ---
// //   async createProductForVendor(vendorId: number, createProductDto: CreateProductDto): Promise<ApiResponseFormat<any>> {
// //     if (createProductDto.vendorId !== vendorId) {
// //       throw new UnauthorizedException('Vendor ID in payload does not match authenticated vendor.');
// //     }
// //     const response = await this.productsRepository.createProduct(createProductDto);
// //     if (response.status_code !== 201) { // Expect 201 for created
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async getVendorProducts(vendorId: number, query: ProductQueryDto): Promise<ApiResponseFormat<any[]>> {
// //     const response = await this.productsRepository.findVendorProducts(vendorId, query);
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async updateProductForVendor(id: number, vendorId: number, updateProductDto: UpdateProductDto): Promise<ApiResponseFormat<any>> {
// //     await this.checkProductOwnership(id, vendorId); // This throws NestJS exceptions
// //     const response = await this.productsRepository.updateProduct(id, updateProductDto, vendorId);
// //     if (response.status_code === 400) {
// //       throw new BadRequestException(response.message);
// //     }
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async deleteProductForVendor(id: number, vendorId: number): Promise<ApiResponseFormat<boolean>> {
// //     await this.checkProductOwnership(id, vendorId);
// //     const response = await this.productsRepository.deleteProduct(id, vendorId);
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   // --- Admin-facing APIs (Product Core) ---
// //   async getAllProductsForAdmin(query: ProductQueryDto): Promise<ApiResponseFormat<any[]>> {
// //     const response = await this.productsRepository.findAllProductsAdmin(query);
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async getProductByIdForAdmin(id: number): Promise<ApiResponseFormat<any>> {
// //     const response = await this.productsRepository.findProductByIdAdmin(id);
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async updateProductForAdmin(id: number, updateProductDto: UpdateProductDto): Promise<ApiResponseFormat<any>> {
// //     const productResponse = await this.productsRepository.findProductByIdAdmin(id);
// //     if (productResponse.status_code === 404) {
// //       throw new NotFoundException(productResponse.message);
// //     }
// //     if (productResponse.status_code !== 200) {
// //       throw new InternalServerErrorException(productResponse.message);
// //     }

// //     const response = await this.productsRepository.updateProduct(id, updateProductDto);
// //     if (response.status_code === 400) {
// //       throw new BadRequestException(response.message);
// //     }
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async deleteProductForAdmin(id: number): Promise<ApiResponseFormat<boolean>> {
// //     const productResponse = await this.productsRepository.findProductByIdAdmin(id);
// //     if (productResponse.status_code === 404) {
// //       throw new NotFoundException(productResponse.message);
// //     }
// //     if (productResponse.status_code !== 200) {
// //       throw new InternalServerErrorException(productResponse.message);
// //     }

// //     const response = await this.productsRepository.deleteProduct(id);
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   // --- Product Gallery APIs (Vendor/Admin) ---
// //   async addProductImage(productId: number, vendorId: number, createGalleryDto: CreateProductGalleryDto): Promise<ApiResponseFormat<any>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.addProductImage(productId, createGalleryDto);
// //     if (response.status_code !== 201) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async updateProductImage(id: number, productId: number, vendorId: number, updateGalleryDto: UpdateProductGalleryDto): Promise<ApiResponseFormat<any>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.updateProductImage(id, productId, updateGalleryDto);
// //     if (response.status_code === 400) {
// //       throw new BadRequestException(response.message);
// //     }
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async deleteProductImage(id: number, productId: number, vendorId: number): Promise<ApiResponseFormat<boolean>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.deleteProductImage(id, productId);
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async getProductImages(productId: number): Promise<ApiResponseFormat<any[]>> {
// //     const response = await this.productsRepository.findProductImages(productId);
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   // --- Product Variants APIs (Vendor/Admin) ---
// //   async createProductVariant(productId: number, vendorId: number, createVariantDto: CreateProductVariantDto): Promise<ApiResponseFormat<any>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.createProductVariant(productId, createVariantDto);
// //     if (response.status_code !== 201) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async updateProductVariant(id: number, productId: number, vendorId: number, updateVariantDto: UpdateProductVariantDto): Promise<ApiResponseFormat<any>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.updateProductVariant(id, productId, updateVariantDto);
// //     if (response.status_code === 400) {
// //       throw new BadRequestException(response.message);
// //     }
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async deleteProductVariant(id: number, productId: number, vendorId: number): Promise<ApiResponseFormat<boolean>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.deleteProductVariant(id, productId);
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async getProductVariants(productId: number): Promise<ApiResponseFormat<any[]>> {
// //     const response = await this.productsRepository.findProductVariants(productId);
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   // --- Product Variant Values APIs (Vendor/Admin) ---
// //   async createProductVariantValue(variantId: number, productId: number, vendorId: number, createVariantValueDto: CreateProductVariantValueDto): Promise<ApiResponseFormat<any>> {
// //     // Need to ensure the variant belongs to the product, and the product to the vendor
// //     const variantsResponse = await this.productsRepository.findProductVariants(productId);
// //     if (variantsResponse.status_code !== 200) {
// //       throw new InternalServerErrorException(variantsResponse.message);
// //     }
// //     const variantExists = variantsResponse.result.some(v => v.id === variantId);
// //     if (!variantExists) {
// //       throw new NotFoundException(`Variant with ID ${variantId} not found for product ${productId}.`);
// //     }
// //     await this.checkProductOwnership(productId, vendorId); // Check product ownership via product ID
// //     const response = await this.productsRepository.createProductVariantValue(variantId, createVariantValueDto);
// //     if (response.status_code !== 201) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async updateProductVariantValue(id: number, variantId: number, productId: number, vendorId: number, updateVariantValueDto: UpdateProductVariantValueDto): Promise<ApiResponseFormat<any>> {
// //     const variantsResponse = await this.productsRepository.findProductVariants(productId);
// //     if (variantsResponse.status_code !== 200) {
// //       throw new InternalServerErrorException(variantsResponse.message);
// //     }
// //     const variantExists = variantsResponse.result.some(v => v.id === variantId);
// //     if (!variantExists) {
// //       throw new NotFoundException(`Variant with ID ${variantId} not found for product ${productId}.`);
// //     }
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.updateProductVariantValue(id, variantId, updateVariantValueDto);
// //     if (response.status_code === 400) {
// //       throw new BadRequestException(response.message);
// //     }
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async deleteProductVariantValue(id: number, variantId: number, productId: number, vendorId: number): Promise<ApiResponseFormat<boolean>> {
// //     const variantsResponse = await this.productsRepository.findProductVariants(productId);
// //     if (variantsResponse.status_code !== 200) {
// //       throw new InternalServerErrorException(variantsResponse.message);
// //     }
// //     const variantExists = variantsResponse.result.some(v => v.id === variantId);
// //     if (!variantExists) {
// //       throw new NotFoundException(`Variant with ID ${variantId} not found for product ${productId}.`);
// //     }
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.deleteProductVariantValue(id, variantId);
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async getProductVariantValues(variantId: number): Promise<ApiResponseFormat<any[]>> {
// //     const response = await this.productsRepository.findProductVariantValues(variantId);
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   // --- Product Variant Combinations APIs (Vendor/Admin) ---
// //   async createProductVariantCombination(productId: number, vendorId: number, createCombinationDto: CreateProductVariantCombinationDto): Promise<ApiResponseFormat<any>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.createProductVariantCombination(productId, createCombinationDto);
// //     if (response.status_code !== 201) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async updateProductVariantCombination(id: number, productId: number, vendorId: number, updateCombinationDto: UpdateProductVariantCombinationDto): Promise<ApiResponseFormat<any>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.updateProductVariantCombination(id, productId, updateCombinationDto);
// //     if (response.status_code === 400) {
// //       throw new BadRequestException(response.message);
// //     }
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async deleteProductVariantCombination(id: number, productId: number, vendorId: number): Promise<ApiResponseFormat<boolean>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.deleteProductVariantCombination(id, productId);
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async getProductVariantCombinations(productId: number): Promise<ApiResponseFormat<any[]>> {
// //     const response = await this.productsRepository.findProductVariantCombinations(productId);
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   // --- Product Specifications APIs (Vendor/Admin) ---
// //   async createProductSpecification(productId: number, vendorId: number, createSpecDto: CreateProductSpecificationDto): Promise<ApiResponseFormat<any>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.createProductSpecification(productId, createSpecDto);
// //     if (response.status_code !== 201) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async updateProductSpecification(id: number, productId: number, vendorId: number, updateSpecDto: UpdateProductSpecificationDto): Promise<ApiResponseFormat<any>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.updateProductSpecification(id, productId, updateSpecDto);
// //     if (response.status_code === 400) {
// //       throw new BadRequestException(response.message);
// //     }
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async deleteProductSpecification(id: number, productId: number, vendorId: number): Promise<ApiResponseFormat<boolean>> {
// //     await this.checkProductOwnership(productId, vendorId);
// //     const response = await this.productsRepository.deleteProductSpecification(id, productId);
// //     if (response.status_code === 404) {
// //       throw new NotFoundException(response.message);
// //     }
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }

// //   async getProductSpecifications(productId: number): Promise<ApiResponseFormat<any[]>> {
// //     const response = await this.productsRepository.findProductSpecifications(productId);
// //     if (response.status_code !== 200) {
// //       throw new InternalServerErrorException(response.message);
// //     }
// //     return response;
// //   }
// // }

// // v2 start
// // import { Injectable } from '@nestjs/common';
// // import { ProductsRepository } from './products.repository';
// // import { ApiResponseFormat, ApiResponse } from 'src/common/utils/common-response';
// // import { Messages } from 'src/common/utils/messages';
// // import { ProductQueryDto, CreateProductDto, UpdateProductDto, CreateVariantDto, ApprovalActionDto, UpdateVariantDto, CreateVariantValueDto, UpdateVariantValueDto, CreateVariantCombinationDto, UpdateVariantCombinationDto, CreateSpecificationDto, UpdateSpecificationDto, CreateReviewDto, UpdateReviewDto, SyncAction } from './dtos/product.dto';
// // import { CloudinaryService } from '../cloudinary/cloudinary.service';
// // import { SearchSyncService } from './search-sync.service';

// // @Injectable()
// // export class ProductsService {
// //   constructor(
// //     private readonly productsRepository: ProductsRepository,
// //     private readonly cloudinaryService: CloudinaryService,
// //     private readonly searchSyncService: SearchSyncService,
// //   ) {}

// //   // ==================== PUBLIC METHODS ====================

// //   async getPublicProducts(query: ProductQueryDto): Promise<ApiResponseFormat<any[]>> {
// //     try {
// //       const result = await this.productsRepository.findAllActiveProducts(query);
// //       if (result.result) {
// //         // Add gallery data for each product
// //         for (const product of result.result) {
// //           const galleryResult = await this.productsRepository.findProductImages(product.id);
// //           product.gallery = galleryResult.result ? galleryResult.result : [];

// //           // Add primary image
// //           product.primaryImage = product.gallery.find(img => img.is_primary) || product.gallery[0] || null;
// //         }
// //       }
// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async getPublicProductById(id: number): Promise<ApiResponseFormat<any>> {
// //     try {
// //       const productResult = await this.productsRepository.findActiveProductById(id);
// //       if (!productResult.result) return productResult;

// //       const product = productResult.result;

// //       // Get all related data
// //       const [gallery, variants, combinations, specifications, reviews] = await Promise.all([
// //         this.productsRepository.findProductImages(id),
// //         this.productsRepository.findProductVariants(id),
// //         this.productsRepository.findProductVariantCombinations(id),
// //         this.productsRepository.findProductSpecifications(id),
// //         this.productsRepository.findProductReviews(id, { approved: true })
// //       ]);

// //       // Enrich variants with their values
// //       if (variants.result && variants.result.length > 0) {
// //         for (const variant of variants.result) {
// //           const valuesResult = await this.productsRepository.findProductVariantValues(variant.id);
// //           variant.values = valuesResult.result ? valuesResult.result : [];
// //         }
// //       }

// //       product.gallery = gallery.result ? gallery.result : [];
// //       product.variants = variants.result ? variants.result : [];
// //       product.combinations = combinations.result ? combinations.result : [];
// //       product.specifications = specifications.result ? specifications.result : [];
// //       product.reviews = reviews.result ? reviews.result : [];
// //       product.primaryImage = product.gallery.find(img => img.is_primary) || product.gallery[0] || null;

// //       // Calculate average rating
// //       if (product.reviews.length > 0) {
// //         const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
// //         product.averageRating = totalRating / product.reviews.length;
// //         product.reviewCount = product.reviews.length;
// //       } else {
// //         product.averageRating = 0;
// //         product.reviewCount = 0;
// //       }

// //       return ApiResponse.success(product);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async getProductGallery(id: number): Promise<ApiResponseFormat<any[]>> {
// //     return this.productsRepository.findProductImages(id);
// //   }

// //   async getProductVariants(id: number): Promise<ApiResponseFormat<any[]>> {
// //     try {
// //       const variantsResult = await this.productsRepository.findProductVariants(id);
// //       if (!variantsResult.result) return variantsResult;

// //       // Enrich with values
// //       for (const variant of variantsResult.result) {
// //         const valuesResult = await this.productsRepository.findProductVariantValues(variant.id);
// //         variant.values = variantsResult.result ? valuesResult.result : [];
// //       }

// //       return variantsResult;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async getProductCombinations(id: number): Promise<ApiResponseFormat<any[]>> {
// //     return this.productsRepository.findProductVariantCombinations(id);
// //   }

// //   async getProductSpecifications(id: number): Promise<ApiResponseFormat<any[]>> {
// //     return this.productsRepository.findProductSpecifications(id);
// //   }

// //   async getProductReviews(id: number, query: any): Promise<ApiResponseFormat<any[]>> {
// //     return this.productsRepository.findProductReviews(id, { ...query, approved: true });
// //   }

// //   // ==================== VENDOR METHODS ====================

// //   async getVendorProducts(vendorId: number, query: ProductQueryDto): Promise<ApiResponseFormat<any[]>> {
// //     try {
// //       const result = await this.productsRepository.findVendorProducts(vendorId, query);
// //       if (result.result) {
// //         // Add primary image for each product
// //         for (const product of result.result) {
// //           const galleryResult = await this.productsRepository.findProductImages(product.id);
// //           const gallery = galleryResult.result ? galleryResult.result : [];
// //           product.primaryImage = gallery.find(img => img.is_primary) || gallery[0] || null;
// //         }
// //       }
// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async getVendorProduct(vendorId: number, id: number): Promise<ApiResponseFormat<any>> {
// //     try {
// //       const productResult = await this.productsRepository.findProductByIdAndVendor(id, vendorId);
// //       if (!productResult.result) return productResult;

// //       const product = productResult.result;

// //       // Get all related data
// //       const [gallery, variants, combinations, specifications] = await Promise.all([
// //         this.productsRepository.findProductImages(id),
// //         this.productsRepository.findProductVariants(id),
// //         this.productsRepository.findProductVariantCombinations(id),
// //         this.productsRepository.findProductSpecifications(id)
// //       ]);

// //       // Enrich variants with values
// //       if (variants.result && variants.result.length > 0) {
// //         for (const variant of variants.result) {
// //           const valuesResult = await this.productsRepository.findProductVariantValues(variant.id);
// //           variant.values = valuesResult.result ? valuesResult.result : [];
// //         }
// //       }

// //       product.gallery = gallery.result ? gallery.result : [];
// //       product.variants = variants.result ? variants.result : [];
// //       product.combinations = combinations.result ? combinations.result : [];
// //       product.specifications = specifications.result ? specifications.result : [];

// //       return ApiResponse.success(product);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async createProduct(
// //     vendorId: number,
// //     createProductDto: CreateProductDto,
// //     files?: { images?: Express.Multer.File[], videos?: Express.Multer.File[] }
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Set vendor ID and default status
// //       createProductDto.vendor_id = vendorId;
// //       createProductDto.status = 'draft'; // New products start as draft
// //       createProductDto.visibility = 'hidden'; // Hidden until approved
// //       console.log("🚀 ~ ProductsService ~ createProduct ~ createProductDto:", createProductDto)

// //       const productResult = await this.productsRepository.createProduct(createProductDto);
// //       if (!productResult.result) return productResult;

// //       const product = productResult.result;

// //       // Upload files to Cloudinary if provided
// //       if (files && (files.images?.length > 0 || files.videos?.length > 0)) {
// //         await this.uploadProductMedia(product.id, files);
// //       }

// //       // Add to search sync queue
// //       await this.searchSyncService.addToQueue(product.id, SyncAction.INDEX);

// //       return productResult;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async updateVendorProduct(
// //     vendorId: number,
// //     id: number,
// //     updateProductDto: UpdateProductDto
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       const result = await this.productsRepository.updateProduct(id, updateProductDto, vendorId);
// //       if (result.result) {
// //         // Add to search sync queue
// //         await this.searchSyncService.addToQueue(id, SyncAction.INDEX);
// //       }
// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async deleteVendorProduct(vendorId: number, id: number): Promise<ApiResponseFormat<boolean>> {
// //     try {
// //       const result = await this.productsRepository.deleteProduct(id, vendorId);
// //       if (result.result) {
// //         // Add to search sync queue for deletion
// //         await this.searchSyncService.addToQueue(id, SyncAction.DELETE);
// //       }
// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   // Media Management
// //   async addProductMedia(
// //     vendorId: number,
// //     productId: number,
// //     files: { images?: Express.Multer.File[], videos?: Express.Multer.File[] }
// //   ): Promise<ApiResponseFormat<any[]>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       return this.uploadProductMedia(productId, files);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async updateProductMedia(
// //     vendorId: number,
// //     productId: number,
// //     galleryId: number,
// //     updateData: any
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       return this.productsRepository.updateProductImage(galleryId, productId, updateData);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async deleteProductMedia(
// //     vendorId: number,
// //     productId: number,
// //     galleryId: number
// //   ): Promise<ApiResponseFormat<boolean>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       // Get media info for Cloudinary deletion
// //       const mediaResult = await this.productsRepository.findProductImageById(galleryId, productId);
// //       if (mediaResult.result && mediaResult.result) {
// //         const publicId = this.cloudinaryService.getPublicIdFromUrl(mediaResult.result.url);
// //         if (publicId) {
// //           await this.cloudinaryService.deleteMedia(publicId, mediaResult.result.media_type);
// //         }
// //       }

// //       return this.productsRepository.deleteProductImage(galleryId, productId);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   // Variant Management
// //   async createProductVariant(
// //     vendorId: number,
// //     productId: number,
// //     createVariantDto: CreateVariantDto
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       return this.productsRepository.createProductVariant(productId, createVariantDto);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   // ... Continue with other variant, combination, and specification methods
// //   // (Implementation follows similar pattern of verification and delegation)
// // // ==================== MISSING PRODUCTS SERVICE METHODS ====================

// // // Continuing the ProductsService class from where it was cut off...

// //   async getAdminProducts(query: ProductQueryDto): Promise<ApiResponseFormat<any[]>> {
// //     try {
// //       const result = await this.productsRepository.findAllProducts(query);
// //       if (result.result) {
// //         // Add primary image and review stats for each product
// //         for (const product of result.result) {
// //           const galleryResult = await this.productsRepository.findProductImages(product.id);
// //           const gallery = galleryResult.result ? galleryResult.result : [];
// //           product.primaryImage = gallery.find(img => img.is_primary) || gallery[0] || null;

// //           // Get review stats
// //           const reviewsResult = await this.productsRepository.findProductReviews(product.id, {});
// //           if (reviewsResult.result && reviewsResult.result.length > 0) {
// //             const reviews = reviewsResult.result;
// //             product.reviewCount = reviews.length;
// //             product.averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
// //           } else {
// //             product.reviewCount = 0;
// //             product.averageRating = 0;
// //           }
// //         }
// //       }
// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async getAdminProduct(id: number): Promise<ApiResponseFormat<any>> {
// //     try {
// //       const productResult = await this.productsRepository.findProductById(id);
// //       if (!productResult.result) return productResult;

// //       const product = productResult.result;

// //       // Get all related data including unapproved reviews for admin
// //       const [gallery, variants, combinations, specifications, reviews] = await Promise.all([
// //         this.productsRepository.findProductImages(id),
// //         this.productsRepository.findProductVariants(id),
// //         this.productsRepository.findProductVariantCombinations(id),
// //         this.productsRepository.findProductSpecifications(id),
// //         this.productsRepository.findProductReviews(id, {}) // Include all reviews for admin
// //       ]);

// //       // Enrich variants with values
// //       if (variants.result && variants.result.length > 0) {
// //         for (const variant of variants.result) {
// //           const valuesResult = await this.productsRepository.findProductVariantValues(variant.id);
// //           variant.values = valuesResult.result ? valuesResult.result : [];
// //         }
// //       }

// //       product.gallery = gallery.result ? gallery.result : [];
// //       product.variants = variants.result ? variants.result : [];
// //       product.combinations = combinations.result ? combinations.result : [];
// //       product.specifications = specifications.result ? specifications.result : [];
// //       product.reviews = reviews.result ? reviews.result : [];

// //       return ApiResponse.success(product);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async approveProduct(id: number, approvalData: ApprovalActionDto, adminId: number): Promise<ApiResponseFormat<any>> {
// //     try {
// //       const updateData = {
// //         status: 'active',
// //         visibility: 'visible',
// //         updatedAt: new Date()
// //       };

// //       const result = await this.productsRepository.updateProduct(id, updateData);
// //       if (result.result) {
// //         // Add to search sync queue
// //         await this.searchSyncService.addToQueue(id, SyncAction.INDEX);

// //         // Log approval action (implement audit log if needed)
// //         console.log(`Product ${id} approved by admin ${adminId} with note: ${approvalData.note || 'No note'}`);
// //       }

// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async rejectProduct(id: number, rejectionData: ApprovalActionDto, adminId: number): Promise<ApiResponseFormat<any>> {
// //     try {
// //       const updateData = {
// //         status: 'draft',
// //         visibility: 'hidden',
// //         updatedAt: new Date()
// //       };

// //       const result = await this.productsRepository.updateProduct(id, updateData);
// //       if (result.result) {
// //         // Remove from search index
// //         await this.searchSyncService.addToQueue(id, SyncAction.DELETE);

// //         // Log rejection action
// //         console.log(`Product ${id} rejected by admin ${adminId} with reason: ${rejectionData.note || 'No reason provided'}`);
// //       }

// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async updateAdminProduct(id: number, updateProductDto: UpdateProductDto): Promise<ApiResponseFormat<any>> {
// //     try {
// //       const result = await this.productsRepository.updateProduct(id, updateProductDto);
// //       if (result.result) {
// //         // Add to search sync queue
// //         await this.searchSyncService.addToQueue(id, SyncAction.INDEX);
// //       }
// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async deleteAdminProduct(id: number): Promise<ApiResponseFormat<boolean>> {
// //     try {
// //       // Get product media for cleanup
// //       const galleryResult = await this.productsRepository.findProductImages(id);
// //       if (galleryResult.result && galleryResult.result.length > 0) {
// //         for (const media of galleryResult.result) {
// //           const publicId = this.cloudinaryService.getPublicIdFromUrl(media.url);
// //           if (publicId) {
// //             await this.cloudinaryService.deleteMedia(publicId, media.media_type);
// //           }
// //         }
// //       }

// //       const result = await this.productsRepository.deleteProduct(id);
// //       if (result.result) {
// //         // Add to search sync queue for deletion
// //         await this.searchSyncService.addToQueue(id, SyncAction.DELETE);
// //       }
// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   // ==================== VARIANT MANAGEMENT METHODS ====================

// //   async updateProductVariant(
// //     vendorId: number,
// //     productId: number,
// //     variantId: number,
// //     updateVariantDto: UpdateVariantDto
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       return this.productsRepository.updateProductVariant(variantId, updateVariantDto);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async deleteProductVariant(
// //     vendorId: number,
// //     productId: number,
// //     variantId: number
// //   ): Promise<ApiResponseFormat<boolean>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       return this.productsRepository.deleteProductVariant(variantId);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   // ==================== VARIANT VALUES MANAGEMENT ====================

// //   async createVariantValue(
// //     vendorId: number,
// //     productId: number,
// //     variantId: number,
// //     createValueDto: CreateVariantValueDto
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       return this.productsRepository.createVariantValue(variantId, createValueDto);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async updateVariantValue(
// //     vendorId: number,
// //     productId: number,
// //     variantId: number,
// //     valueId: number,
// //     updateValueDto: UpdateVariantValueDto
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       return this.productsRepository.updateVariantValue(valueId, updateValueDto);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async deleteVariantValue(
// //     vendorId: number,
// //     productId: number,
// //     variantId: number,
// //     valueId: number
// //   ): Promise<ApiResponseFormat<boolean>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       return this.productsRepository.deleteVariantValue(valueId);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   // ==================== VARIANT COMBINATIONS MANAGEMENT ====================

// //   async createVariantCombination(
// //     vendorId: number,
// //     productId: number,
// //     createCombinationDto: CreateVariantCombinationDto,
// //     files?: { image?: Express.Multer.File[] }
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       // Upload image if provided
// //       let imageUrl = null;
// //       if (files?.image && files.image.length > 0) {
// //         const uploadResult = await this.cloudinaryService.uploadImage(files.image[0]);
// //         if (uploadResult.result) {
// //           imageUrl = uploadResult.result.secure_url;
// //         }
// //       }

// //       createCombinationDto.image_url = imageUrl;
// //       const result = await this.productsRepository.createVariantCombination(productId, createCombinationDto);

// //       if (result.result) {
// //         // Add to search sync queue to update product data
// //         await this.searchSyncService.addToQueue(productId, SyncAction.INDEX);
// //       }

// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async updateVariantCombination(
// //     vendorId: number,
// //     productId: number,
// //     combinationId: number,
// //     updateCombinationDto: UpdateVariantCombinationDto,
// //     files?: { image?: Express.Multer.File[] }
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       // Handle image upload if provided
// //       if (files?.image && files.image.length > 0) {
// //         // Delete old image if exists
// //         const existingCombination = await this.productsRepository.findVariantCombinationById(combinationId);
// //         if (existingCombination.result && existingCombination.result.image_url) {
// //           const oldPublicId = this.cloudinaryService.getPublicIdFromUrl(existingCombination.result.image_url);
// //           if (oldPublicId) {
// //             await this.cloudinaryService.deleteMedia(oldPublicId, 'image');
// //           }
// //         }

// //         // Upload new image
// //         const uploadResult = await this.cloudinaryService.uploadImage(files.image[0]);
// //         if (uploadResult.result) {
// //           updateCombinationDto.image_url = uploadResult.result.secure_url;
// //         }
// //       }

// //       const result = await this.productsRepository.updateVariantCombination(combinationId, updateCombinationDto);

// //       if (result.result) {
// //         // Add to search sync queue
// //         await this.searchSyncService.addToQueue(productId, SyncAction.INDEX);
// //       }

// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async deleteVariantCombination(
// //     vendorId: number,
// //     productId: number,
// //     combinationId: number
// //   ): Promise<ApiResponseFormat<boolean>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       // Get combination data for image cleanup
// //       const combinationResult = await this.productsRepository.findVariantCombinationById(combinationId);
// //       if (combinationResult.result && combinationResult.result.image_url) {
// //         const publicId = this.cloudinaryService.getPublicIdFromUrl(combinationResult.result.image_url);
// //         if (publicId) {
// //           await this.cloudinaryService.deleteMedia(publicId, 'image');
// //         }
// //       }

// //       const result = await this.productsRepository.deleteVariantCombination(combinationId);

// //       if (result.result) {
// //         // Add to search sync queue
// //         await this.searchSyncService.addToQueue(productId, SyncAction.INDEX);
// //       }

// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   // ==================== SPECIFICATIONS MANAGEMENT ====================

// //   async createProductSpecification(
// //     vendorId: number,
// //     productId: number,
// //     createSpecDto: CreateSpecificationDto
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       return this.productsRepository.createProductSpecification(productId, createSpecDto);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async updateProductSpecification(
// //     vendorId: number,
// //     productId: number,
// //     specId: number,
// //     updateSpecDto: UpdateSpecificationDto
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       return this.productsRepository.updateProductSpecification(specId, updateSpecDto);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async deleteProductSpecification(
// //     vendorId: number,
// //     productId: number,
// //     specId: number
// //   ): Promise<ApiResponseFormat<boolean>> {
// //     try {
// //       // Verify product belongs to vendor
// //       const productCheck = await this.productsRepository.findProductByIdAndVendor(productId, vendorId);
// //       if (!productCheck.result) return productCheck;

// //       return this.productsRepository.deleteProductSpecification(specId);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   // ==================== REVIEW MANAGEMENT ====================

// //   async createReview(
// //     productId: number,
// //     userId: number,
// //     createReviewDto: CreateReviewDto
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Check if product exists and is active
// //       const productResult = await this.productsRepository.findActiveProductById(productId);
// //       if (!productResult.result) {
// //         return ApiResponse.error("Product not found or inactive", 404);
// //       }

// //       // Check if user already reviewed this product
// //       const existingReview = await this.productsRepository.findUserReviewForProduct(productId, userId);
// //       if (existingReview.result && existingReview.result) {
// //         return ApiResponse.error("You have already reviewed this product", 400);
// //       }

// //       const reviewData = {
// //         ...createReviewDto,
// //         productId,
// //         userId,
// //         isApproved: false // Reviews need approval
// //       };

// //       return this.productsRepository.createReview(reviewData);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async updateReview(
// //     reviewId: number,
// //     userId: number,
// //     updateReviewDto: UpdateReviewDto
// //   ): Promise<ApiResponseFormat<any>> {
// //     try {
// //       // Verify review belongs to user
// //       const reviewCheck = await this.productsRepository.findReviewByIdAndUser(reviewId, userId);
// //       if (!reviewCheck.result) {
// //         return ApiResponse.error("Review not found or access denied", 404);
// //       }

// //       const updateData = {
// //         ...updateReviewDto,
// //         isApproved: false // Re-approval needed after edit
// //       };

// //       return this.productsRepository.updateReview(reviewId, updateData);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async deleteReview(reviewId: number, userId: number): Promise<ApiResponseFormat<boolean>> {
// //     try {
// //       // Verify review belongs to user
// //       const reviewCheck = await this.productsRepository.findReviewByIdAndUser(reviewId, userId);
// //       if (!reviewCheck.result) {
// //         return ApiResponse.error("Review not found or access denied", 404);
// //       }

// //       return this.productsRepository.deleteReview(reviewId);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async getUserReviews(userId: number, query: any): Promise<ApiResponseFormat<any[]>> {
// //     try {
// //       return this.productsRepository.findUserReviews(userId, query);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async getAdminReviews(query: any): Promise<ApiResponseFormat<any[]>> {
// //     try {
// //       return this.productsRepository.findAllReviews(query);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async approveReview(reviewId: number, adminId: number): Promise<ApiResponseFormat<any>> {
// //     try {
// //       const result = await this.productsRepository.updateReview(reviewId, { isApproved: true });
// //       if (result.result) {
// //         console.log(`Review ${reviewId} approved by admin ${adminId}`);
// //       }
// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async rejectReview(reviewId: number, adminId: number): Promise<ApiResponseFormat<boolean>> {
// //     try {
// //       const result = await this.productsRepository.deleteReview(reviewId);
// //       if (result.result) {
// //         console.log(`Review ${reviewId} rejected and deleted by admin ${adminId}`);
// //       }
// //       return result;
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   // ==================== SEARCH SYNC QUEUE MANAGEMENT ====================

// //   async getSearchSyncQueue(query: any): Promise<ApiResponseFormat<any[]>> {
// //     try {
// //       return this.productsRepository.findSearchSyncQueue(query);
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   async processSearchSyncQueue(): Promise<ApiResponseFormat<any>> {
// //     try {
// //       const result = await this.searchSyncService.processQueue();
// //       return ApiResponse.success(result, "Search sync queue processed successfully");
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }

// //   // ==================== PRIVATE HELPER METHODS ====================

// //   private async uploadProductMedia(
// //     productId: number,
// //     files: { images?: Express.Multer.File[], videos?: Express.Multer.File[] }
// //   ): Promise<ApiResponseFormat<any[]>> {
// //     try {
// //       const uploadedMedia = [];

// //       // Upload images
// //       if (files.images && files.images.length > 0) {
// //         for (const image of files.images) {
// //           const uploadResult = await this.cloudinaryService.uploadImage(image);
// //           if (uploadResult.result) {
// //             const mediaData = {
// //               productId,
// //               mediaType: 'image',
// //               url: uploadResult.result.secure_url,
// //               altText: `${image.originalname}`,
// //               sortOrder: uploadedMedia.length,
// //               isPrimary: uploadedMedia.length === 0 // First image is primary
// //             };

// //             const saveResult = await this.productsRepository.createProductImage(mediaData);
// //             if (saveResult.result) {
// //               uploadedMedia.push(saveResult.result);
// //             }
// //           }
// //         }
// //       }

// //       // Upload videos
// //       if (files.videos && files.videos.length > 0) {
// //         for (const video of files.videos) {
// //           const uploadResult = await this.cloudinaryService.uploadVideo(video);
// //           if (uploadResult.result) {
// //             const mediaData = {
// //               productId,
// //               mediaType: 'video',
// //               url: uploadResult.result.secure_url,
// //               altText: `${video.originalname}`,
// //               sortOrder: uploadedMedia.length,
// //               isPrimary: false
// //             };

// //             const saveResult = await this.productsRepository.createProductImage(mediaData);
// //             if (saveResult.result) {
// //               uploadedMedia.push(saveResult.result);
// //             }
// //           }
// //         }
// //       }

// //       return ApiResponse.success(uploadedMedia, "Media uploaded successfully");
// //     } catch (error) {
// //       return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
// //     }
// //   }
// // }

// //================================== v3 start

// // Enhanced Product Service
// import { Injectable } from '@nestjs/common';
// import { ProductsRepository } from './products.repository';
// import {
//   ApiResponse,
//   ApiResponseFormat,
// } from 'src/common/utils/common-response';

// interface CreateProductServiceDto {
//   vendor_id: number;
//   name: string;
//   slug: string;
//   description?: string;
//   short_description?: string;
//   sku?: string;
//   category_id?: number;
//   brand_id?: number;
//   tax_id?: number;
//   price: number;
//   compare_price?: number;
//   cost_price?: number;
//   weight?: number;
//   length?: number;
//   width?: number;
//   height?: number;
//   meta_title?: string;
//   meta_description?: string;
//   status?: 'draft' | 'active' | 'archived';
//   visibility?: 'visible' | 'hidden';
//   is_featured?: boolean;
//   is_physical?: boolean;
//   gallery?: {
//     media_type: 'image' | 'video';
//     url: string;
//     alt_text?: string;
//     sort_order?: number;
//     is_primary?: boolean;
//   }[];
//   variants?: {
//     name: string;
//     sort_order?: number;
//     values: {
//       value: string;
//       sort_order?: number;
//     }[];
//   }[];
//   specifications?: {
//     name: string;
//     value: string;
//     sort_order?: number;
//   }[];
//   variant_combinations?: {
//     variant_value_ids: number[];
//     sku?: string;
//     price?: number;
//     compare_price?: number;
//     cost_price?: number;
//     weight?: number;
//     image_url?: string;
//     is_active?: boolean;
//   }[];
// }

// interface UpdateProductServiceDto {
//   name?: string;
//   slug?: string;
//   description?: string;
//   short_description?: string;
//   sku?: string;
//   category_id?: number;
//   brand_id?: number;
//   tax_id?: number;
//   price?: number;
//   compare_price?: number;
//   cost_price?: number;
//   weight?: number;
//   length?: number;
//   width?: number;
//   height?: number;
//   meta_title?: string;
//   meta_description?: string;
//   status?: 'draft' | 'active' | 'archived';
//   visibility?: 'visible' | 'hidden';
//   is_featured?: boolean;
//   is_physical?: boolean;
//   gallery?: {
//     media_type: 'image' | 'video';
//     url: string;
//     alt_text?: string;
//     sort_order?: number;
//     is_primary?: boolean;
//   }[];
//   variants?: {
//     name: string;
//     sort_order?: number;
//     values: {
//       value: string;
//       sort_order?: number;
//     }[];
//   }[];
//   specifications?: {
//     name: string;
//     value: string;
//     sort_order?: number;
//   }[];
//   variant_combinations?: {
//     variant_value_ids: number[];
//     sku?: string;
//     price?: number;
//     compare_price?: number;
//     cost_price?: number;
//     weight?: number;
//     image_url?: string;
//     is_active?: boolean;
//   }[];
// }

// @Injectable()
// export class ProductsService {
//   constructor(private readonly productsRepository: ProductsRepository) {}

//   // ==================== COMPREHENSIVE CRUD OPERATIONS ====================

//   /**
//    * Create a product with all related data in a single transaction
//    */
//   async createProduct(
//     createProductDto: any,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       // Validate required fields
//       if (
//         !createProductDto.name ||
//         !createProductDto.price ||
//         !createProductDto.vendor_id
//       ) {
//         console.log("🚀 ~ ProductsService ~ createProduct ~ createProductDto:", createProductDto)
//         return ApiResponse.error('Name, price, and vendor_id are required');
//       }

//       // Generate slug if not provided
//       if (!createProductDto.slug) {
//         createProductDto.slug = this.generateSlug(createProductDto.name);
//       }

//       // Validate variants and their combinations
//       if (createProductDto.variants && createProductDto.variant_combinations) {
//         const validationError = this.validateVariantCombinations(
//           createProductDto.variants,
//           createProductDto.variant_combinations,
//         );
//         if (validationError) {
//           return ApiResponse.error(validationError);
//         }
//       }

//       return await this.productsRepository.createProductComprehensive(
//         createProductDto,
//       );
//     } catch (error) {
//       console.error('Error in createProduct service:', error);
//       return ApiResponse.error(error);
//     }
//   }

//   /**
//    * Update a product with all related data in a single transaction
//    */
//   async updateProduct(
//     id: number,
//     updateProductDto: UpdateProductServiceDto,
//     vendorId?: number,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       // Generate slug if name is updated but slug is not provided
//       if (updateProductDto.name && !updateProductDto.slug) {
//         updateProductDto.slug = this.generateSlug(updateProductDto.name);
//       }

//       // Validate variants and their combinations if provided
//       if (updateProductDto.variants && updateProductDto.variant_combinations) {
//         const validationError = this.validateVariantCombinations(
//           updateProductDto.variants,
//           updateProductDto.variant_combinations,
//         );
//         if (validationError) {
//           return ApiResponse.error(validationError);
//         }
//       }

//       return await this.productsRepository.updateProductComprehensive(
//         id,
//         updateProductDto,
//         vendorId,
//       );
//     } catch (error) {
//       console.error('Error in updateProduct service:', error);
//       return ApiResponse.error(error);
//     }
//   }

//   /**
//    * Get a complete product with all related data
//    */
//   async getProduct(id: number): Promise<ApiResponseFormat<any>> {
//     try {
//       return await this.productsRepository.getProductComprehensive(id);
//     } catch (error) {
//       console.error('Error in getProduct service:', error);
//       return ApiResponse.error(error);
//     }
//   }

//   /**
//    * Delete a product with all related data
//    */
//   async deleteProduct(
//     id: number,
//     vendorId?: number,
//   ): Promise<ApiResponseFormat<boolean>> {
//     try {
//       return await this.productsRepository.deleteProductComprehensive(
//         id,
//         vendorId,
//       );
//     } catch (error) {
//       console.error('Error in deleteProduct service:', error);
//       return ApiResponse.error(error);
//     }
//   }

//   // ==================== VALIDATION HELPERS ====================

//   /**
//    * Validate variant combinations against available variants
//    */
//   private validateVariantCombinations(
//     variants: CreateProductServiceDto['variants'],
//     combinations: CreateProductServiceDto['variant_combinations'],
//   ): string | null {
//     if (!variants || !combinations) return null;

//     // For now, we'll skip detailed validation since variant_value_ids
//     // will be populated after variant values are created
//     // You can add more specific validation logic here based on your needs

//     for (const combination of combinations) {
//       if (combination.sku && combination.sku.trim() === '') {
//         return 'SKU cannot be empty if provided';
//       }

//       if (combination.price !== undefined && combination.price < 0) {
//         return 'Price cannot be negative';
//       }

//       if (
//         combination.compare_price !== undefined &&
//         combination.price !== undefined &&
//         combination.compare_price < combination.price
//       ) {
//         return 'Compare price should be greater than or equal to price';
//       }
//     }

//     return null;
//   }

//   /**
//    * Generate slug from name
//    */
//   private generateSlug(name: string): string {
//     return name
//       .toLowerCase()
//       .trim()
//       .replace(/[^\w\s-]/g, '') // Remove special characters
//       .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
//       .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
//   }

//   // ==================== ADDITIONAL SERVICE METHODS ====================

//   /**
//    * Get products with pagination and filters
//    */
//   async getProducts(query: any): Promise<ApiResponseFormat<any[]>> {
//     try {
//       return await this.productsRepository.findAllProducts(query);
//     } catch (error) {
//       console.error('Error in getProducts service:', error);
//       return ApiResponse.error(error);
//     }
//   }

//   /**
//    * Get active products only
//    */
//   async getActiveProducts(query: any): Promise<ApiResponseFormat<any[]>> {
//     try {
//       return await this.productsRepository.findAllActiveProducts(query);
//     } catch (error) {
//       console.error('Error in getActiveProducts service:', error);
//       return ApiResponse.error(error);
//     }
//   }

//   /**
//    * Get products by vendor
//    */
//   async getVendorProducts(
//     vendorId: number,
//     query: any,
//   ): Promise<ApiResponseFormat<any[]>> {
//     try {
//       return await this.productsRepository.findVendorProducts(vendorId, query);
//     } catch (error) {
//       console.error('Error in getVendorProducts service:', error);
//       return ApiResponse.error(error);
//     }
//   }

//   /**
//    * Bulk update product status
//    */
//   async bulkUpdateProductStatus(
//     productIds: number[],
//     status: 'draft' | 'active' | 'archived',
//     vendorId?: number,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const results = [];

//       for (const productId of productIds) {
//         const updateResult = await this.updateProduct(
//           productId,
//           { status },
//           vendorId,
//         );
//         results.push({
//           productId,
//           success: updateResult.result,
//           message: updateResult.message,
//         });
//       }
//       return ApiResponse.success(results);
//     } catch (error) {
//       console.error('Error in bulkUpdateProductStatus service:', error);
//       return ApiResponse.error(error);
//     }
//   }

//   /**
//    * Clone a product with all its data
//    */
//   async cloneProduct(
//     sourceProductId: number,
//     newName: string,
//     vendorId?: number,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       // Get the source product with all related data
//       const sourceProduct = await this.getProduct(sourceProductId);
//       if (!sourceProduct.result) {
//         return ApiResponse.error(`Source product not found`);
//       }

//       const product = sourceProduct.result;

//       // Prepare cloned product data
//       const clonedProductData: CreateProductServiceDto = {
//         vendor_id: vendorId || product.vendor_id,
//         name: newName,
//         slug: this.generateSlug(newName),
//         description: product.description,
//         short_description: product.short_description,
//         sku: null, // Will need to be unique, so set to null
//         category_id: product.category_id,
//         brand_id: product.brand_id,
//         tax_id: product.tax_id,
//         price: product.price,
//         compare_price: product.compare_price,
//         cost_price: product.cost_price,
//         weight: product.weight,
//         length: product.length,
//         width: product.width,
//         height: product.height,
//         meta_title: `${newName} - ${product.meta_title || ''}`.slice(0, 255),
//         meta_description: product.meta_description,
//         status: 'draft', // Always start as draft
//         visibility: product.visibility,
//         is_featured: false, // Don't clone featured status
//         is_physical: product.is_physical,
//         gallery: product.gallery || [],
//         variants: product.variants || [],
//         specifications: product.specifications || [],
//         variant_combinations: (product.variant_combinations || []).map(
//           (combo) => ({
//             ...combo,
//             sku: null, // Reset SKU for uniqueness
//             variant_value_ids: [], // Will be mapped after variant creation
//           }),
//         ),
//       };

//       return await this.createProduct(clonedProductData);
//     } catch (error) {
//       console.error('Error in cloneProduct service:', error);
//       return ApiResponse.error(error);
//     }
//   }

//   /**
//    * Get product analytics/statistics
//    */
//   async getProductStats(
//     product_id?: number,
//     vendor_id?: number,
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       // This would typically involve more complex queries
//       // For now, returning a basic structure
//       const stats = {
//         totalProducts: 0,
//         activeProducts: 0,
//         draftProducts: 0,
//         archivedProducts: 0,
//         featuredProducts: 0,
//         productsWithVariants: 0,
//         averagePrice: 0,
//       };

//       // You would implement actual statistics queries here
//       // Example: Get counts by status, calculate averages, etc.

//       return ApiResponse.success(
//         stats,
//         'Product statistics retrieved successfully',
//       );
//     } catch (error) {
//       console.error('Error in getProductStats service:', error);
//       return ApiResponse.error(error);
//     }
//   }
// }
