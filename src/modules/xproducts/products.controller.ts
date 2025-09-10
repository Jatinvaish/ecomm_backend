// // import {
// //   Controller,
// //   Get,
// //   Post,
// //   Put,
// //   Delete,
// //   Param,
// //   Body,
// //   Query,
// //   UseGuards,
// //   Req,
// // } from '@nestjs/common';
// // import { ProductsService } from './products.service';
// // import {
// //   ProductQueryDto,
// //   CreateProductDto,
// //   UpdateProductDto,
// //   CreateProductGalleryDto,
// //   UpdateProductGalleryDto,
// //   CreateProductVariantDto,
// //   UpdateProductVariantDto,
// //   CreateProductVariantValueDto,
// //   UpdateProductVariantValueDto,
// //   CreateProductVariantCombinationDto,
// //   UpdateProductVariantCombinationDto,
// //   CreateProductSpecificationDto,
// //   UpdateProductSpecificationDto,
// // } from './dtos/product.dto';
// // import { AuthGuard } from 'src/common/guards/auth.guard';
// // import { RoleGuard } from 'src/common/guards/role.guard';
// // // For simplicity, these are placeholders. You'd implement actual JWT/Auth guards.

// // @Controller('products')
// // export class ProductsController {
// //   constructor(private readonly productsService: ProductsService) {}

// //   // --- Public/User-facing APIs ---
// //   @Get()
// //   async getProducts(@Query() query: ProductQueryDto) {
// //     return this.productsService.getProductsForUser(query);
// //   }

// //   @Get(':id')
// //   async getProduct(@Param('id') id: string) {
// //     return this.productsService.getProductByIdForUser(parseInt(id, 10));
// //   }

// //   // --- Vendor-facing APIs (Core Product) ---
// //   // Assuming vendorId is extracted from authenticated user (e.g., JWT payload)
// //   @Post('vendor')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async createProduct(@Req() req, @Body() createProductDto: CreateProductDto) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder: replace with actual vendor ID from auth
// //     return this.productsService.createProductForVendor(
// //       vendorId,
// //       createProductDto,
// //     );
// //   }

// //   @Get('vendor/my-products')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async getVendorProducts(@Req() req, @Query() query: ProductQueryDto) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.getVendorProducts(vendorId, query);
// //   }

// //   @Put('vendor/:id')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async updateVendorProduct(
// //     @Req() req,
// //     @Param('id') id: string,
// //     @Body() updateProductDto: UpdateProductDto,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.updateProductForVendor(
// //       parseInt(id, 10),
// //       vendorId,
// //       updateProductDto,
// //     );
// //   }

// //   @Delete('vendor/:id')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async deleteVendorProduct(@Req() req, @Param('id') id: string) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.deleteProductForVendor(
// //       parseInt(id, 10),
// //       vendorId,
// //     );
// //   }

// //   // --- Admin-facing APIs (Core Product) ---
// //   @Get('admin/all')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async getAllProductsAdmin(@Query() query: ProductQueryDto) {
// //     return this.productsService.getAllProductsForAdmin(query);
// //   }

// //   @Get('admin/:id')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async getProductAdmin(@Param('id') id: string) {
// //     return this.productsService.getProductByIdForAdmin(parseInt(id, 10));
// //   }

// //   @Put('admin/:id')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async updateProductAdmin(
// //     @Param('id') id: string,
// //     @Body() updateProductDto: UpdateProductDto,
// //   ) {
// //     return this.productsService.updateProductForAdmin(
// //       parseInt(id, 10),
// //       updateProductDto,
// //     );
// //   }

// //   @Delete('admin/:id')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async deleteProductAdmin(@Param('id') id: string) {
// //     return this.productsService.deleteProductForAdmin(parseInt(id, 10));
// //   }

// //   // --- Product Gallery APIs (Vendor/Admin) ---
// //   @Post(':productId/gallery')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async addProductImage(
// //     @Param('productId') productId: string,
// //     @Req() req,
// //     @Body() createGalleryDto: CreateProductGalleryDto,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.addProductImage(
// //       parseInt(productId, 10),
// //       vendorId,
// //       createGalleryDto,
// //     );
// //   }

// //   @Put(':productId/gallery/:imageId')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async updateProductImage(
// //     @Param('productId') productId: string,
// //     @Param('imageId') imageId: string,
// //     @Req() req,
// //     @Body() updateGalleryDto: UpdateProductGalleryDto,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.updateProductImage(
// //       parseInt(imageId, 10),
// //       parseInt(productId, 10),
// //       vendorId,
// //       updateGalleryDto,
// //     );
// //   }

// //   @Delete(':productId/gallery/:imageId')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async deleteProductImage(
// //     @Param('productId') productId: string,
// //     @Param('imageId') imageId: string,
// //     @Req() req,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.deleteProductImage(
// //       parseInt(imageId, 10),
// //       parseInt(productId, 10),
// //       vendorId,
// //     );
// //   }

// //   @Get(':productId/gallery')
// //   async getProductImages(@Param('productId') productId: string) {
// //     return this.productsService.getProductImages(parseInt(productId, 10));
// //   }

// //   // --- Product Variants APIs (Vendor/Admin) ---
// //   @Post(':productId/variants')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async createProductVariant(
// //     @Param('productId') productId: string,
// //     @Req() req,
// //     @Body() createVariantDto: CreateProductVariantDto,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.createProductVariant(
// //       parseInt(productId, 10),
// //       vendorId,
// //       createVariantDto,
// //     );
// //   }

// //   @Put(':productId/variants/:variantId')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async updateProductVariant(
// //     @Param('productId') productId: string,
// //     @Param('variantId') variantId: string,
// //     @Req() req,
// //     @Body() updateVariantDto: UpdateProductVariantDto,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.updateProductVariant(
// //       parseInt(variantId, 10),
// //       parseInt(productId, 10),
// //       vendorId,
// //       updateVariantDto,
// //     );
// //   }

// //   @Delete(':productId/variants/:variantId')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async deleteProductVariant(
// //     @Param('productId') productId: string,
// //     @Param('variantId') variantId: string,
// //     @Req() req,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.deleteProductVariant(
// //       parseInt(variantId, 10),
// //       parseInt(productId, 10),
// //       vendorId,
// //     );
// //   }

// //   @Get(':productId/variants')
// //   async getProductVariants(@Param('productId') productId: string) {
// //     return this.productsService.getProductVariants(parseInt(productId, 10));
// //   }

// //   // --- Product Variant Values APIs (Vendor/Admin) ---
// //   @Post(':productId/variants/:variantId/values')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async createProductVariantValue(
// //     @Param('productId') productId: string,
// //     @Param('variantId') variantId: string,
// //     @Req() req,
// //     @Body() createVariantValueDto: CreateProductVariantValueDto,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.createProductVariantValue(
// //       parseInt(variantId, 10),
// //       parseInt(productId, 10),
// //       vendorId,
// //       createVariantValueDto,
// //     );
// //   }

// //   @Put(':productId/variants/:variantId/values/:valueId')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async updateProductVariantValue(
// //     @Param('productId') productId: string,
// //     @Param('variantId') variantId: string,
// //     @Param('valueId') valueId: string,
// //     @Req() req,
// //     @Body() updateVariantValueDto: UpdateProductVariantValueDto,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.updateProductVariantValue(
// //       parseInt(valueId, 10),
// //       parseInt(variantId, 10),
// //       parseInt(productId, 10),
// //       vendorId,
// //       updateVariantValueDto,
// //     );
// //   }

// //   @Delete(':productId/variants/:variantId/values/:valueId')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async deleteProductVariantValue(
// //     @Param('productId') productId: string,
// //     @Param('variantId') variantId: string,
// //     @Param('valueId') valueId: string,
// //     @Req() req,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.deleteProductVariantValue(
// //       parseInt(valueId, 10),
// //       parseInt(variantId, 10),
// //       parseInt(productId, 10),
// //       vendorId,
// //     );
// //   }

// //   @Get(':productId/variants/:variantId/values')
// //   async getProductVariantValues(@Param('variantId') variantId: string) {
// //     return this.productsService.getProductVariantValues(
// //       parseInt(variantId, 10),
// //     );
// //   }

// //   // --- Product Variant Combinations APIs (Vendor/Admin) ---
// //   @Post(':productId/combinations')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async createProductVariantCombination(
// //     @Param('productId') productId: string,
// //     @Req() req,
// //     @Body() createCombinationDto: CreateProductVariantCombinationDto,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.createProductVariantCombination(
// //       parseInt(productId, 10),
// //       vendorId,
// //       createCombinationDto,
// //     );
// //   }

// //   @Put(':productId/combinations/:combinationId')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async updateProductVariantCombination(
// //     @Param('productId') productId: string,
// //     @Param('combinationId') combinationId: string,
// //     @Req() req,
// //     @Body() updateCombinationDto: UpdateProductVariantCombinationDto,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.updateProductVariantCombination(
// //       parseInt(combinationId, 10),
// //       parseInt(productId, 10),
// //       vendorId,
// //       updateCombinationDto,
// //     );
// //   }

// //   @Delete(':productId/combinations/:combinationId')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async deleteProductVariantCombination(
// //     @Param('productId') productId: string,
// //     @Param('combinationId') combinationId: string,
// //     @Req() req,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.deleteProductVariantCombination(
// //       parseInt(combinationId, 10),
// //       parseInt(productId, 10),
// //       vendorId,
// //     );
// //   }

// //   @Get(':productId/combinations')
// //   async getProductVariantCombinations(@Param('productId') productId: string) {
// //     return this.productsService.getProductVariantCombinations(
// //       parseInt(productId, 10),
// //     );
// //   }

// //   // --- Product Specifications APIs (Vendor/Admin) ---
// //   @Post(':productId/specifications')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async createProductSpecification(
// //     @Param('productId') productId: string,
// //     @Req() req,
// //     @Body() createSpecDto: CreateProductSpecificationDto,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.createProductSpecification(
// //       parseInt(productId, 10),
// //       vendorId,
// //       createSpecDto,
// //     );
// //   }

// //   @Put(':productId/specifications/:specId')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async updateProductSpecification(
// //     @Param('productId') productId: string,
// //     @Param('specId') specId: string,
// //     @Req() req,
// //     @Body() updateSpecDto: UpdateProductSpecificationDto,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.updateProductSpecification(
// //       parseInt(specId, 10),
// //       parseInt(productId, 10),
// //       vendorId,
// //       updateSpecDto,
// //     );
// //   }

// //   @Delete(':productId/specifications/:specId')
// //   @UseGuards(AuthGuard, RoleGuard)
// //   async deleteProductSpecification(
// //     @Param('productId') productId: string,
// //     @Param('specId') specId: string,
// //     @Req() req,
// //   ) {
// //     const vendorId = req.user?.vendorId || 1; // Placeholder
// //     return this.productsService.deleteProductSpecification(
// //       parseInt(specId, 10),
// //       parseInt(productId, 10),
// //       vendorId,
// //     );
// //   }

// //   @Get(':productId/specifications')
// //   async getProductSpecifications(@Param('productId') productId: string) {
// //     return this.productsService.getProductSpecifications(
// //       parseInt(productId, 10),
// //     );
// //   }
// // }


// // V2 start
// // import {
// //   Controller,
// //   Get,
// //   Post,
// //   Put,
// //   Delete,
// //   Body,
// //   Param,
// //   Query,
// //   UseGuards,
// //   UseInterceptors,
// //   UploadedFiles,
// //   ParseIntPipe,
// // } from '@nestjs/common';
// // import { FileFieldsInterceptor } from '@nestjs/platform-express';
// // import { ProductsService } from './products.service';
// // import {
// //   ProductQueryDto,
// //   CreateProductDto,
// //   UpdateProductDto,
// //   CreateReviewDto,
// //   UpdateReviewDto,
// //   CreateSpecificationDto,
// //   UpdateSpecificationDto,
// //   CreateVariantDto,
// //   UpdateVariantDto,
// //   CreateVariantValueDto,
// //   UpdateVariantValueDto,
// //   CreateVariantCombinationDto,
// //   UpdateVariantCombinationDto,
// //   ApprovalActionDto,
// // } from './dtos/product.dto';
// // import { CloudinaryService } from '../cloudinary/cloudinary.service';
// // import { AuthGuard } from 'src/common/guards/auth.guard';
// // import { CurrentUser } from 'src/common/guards/decorators/current-user.decorator';

// // @Controller('products')
// // export class ProductsController {
// //   constructor(
// //     private readonly productsService: ProductsService,
// //     private readonly cloudinaryService: CloudinaryService,
// //   ) {}

// //   // ==================== PUBLIC ENDPOINTS ====================
  
// //   @Get('public')
// //   async getPublicProducts(@Query() query: ProductQueryDto) {
// //     return this.productsService.getPublicProducts(query);
// //   }

// //   @Get('public/:id')
// //   async getPublicProduct(@Param('id', ParseIntPipe) id: number) {
// //     return this.productsService.getPublicProductById(id);
// //   }

// //   @Get('public/:id/gallery')
// //   async getProductGallery(@Param('id', ParseIntPipe) id: number) {
// //     return this.productsService.getProductGallery(id);
// //   }

// //   @Get('public/:id/variants')
// //   async getProductVariants(@Param('id', ParseIntPipe) id: number) {
// //     return this.productsService.getProductVariants(id);
// //   }

// //   @Get('public/:id/combinations')
// //   async getProductCombinations(@Param('id', ParseIntPipe) id: number) {
// //     return this.productsService.getProductCombinations(id);
// //   }

// //   @Get('public/:id/specifications')
// //   async getProductSpecifications(@Param('id', ParseIntPipe) id: number) {
// //     return this.productsService.getProductSpecifications(id);
// //   }

// //   @Get('public/:id/reviews')
// //   async getProductReviews(@Param('id', ParseIntPipe) id: number, @Query() query: any) {
// //     return this.productsService.getProductReviews(id, query);
// //   }

// //   // ==================== VENDOR ENDPOINTS ====================
  
// //   @UseGuards(AuthGuard, )
// //   @Get('vendor')
// //   async getVendorProducts(@CurrentUser() user: any, @Query() query: ProductQueryDto) {
// //     return this.productsService.getVendorProducts(user.id, query);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Get('vendor/:id')
// //   async getVendorProduct(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
// //     return this.productsService.getVendorProduct(user.id, id);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Post('vendor/create')
// //   @UseInterceptors(FileFieldsInterceptor([
// //     { name: 'images', maxCount: 10 },
// //     { name: 'videos', maxCount: 3 }
// //   ]))
// //   async createProduct(
// //     @CurrentUser() user: any,
// //     @Body() createProductDto: CreateProductDto,
// //     @UploadedFiles() files: { images?: Express.Multer.File[], videos?: Express.Multer.File[] }
// //   ) {
// //     return this.productsService.createProduct(user.id, createProductDto, files);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Put('vendor/:id')
// //   async updateProduct(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) id: number,
// //     @Body() updateProductDto: UpdateProductDto
// //   ) {
// //     return this.productsService.updateVendorProduct(user.id, id, updateProductDto);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Delete('vendor/:id')
// //   async deleteProduct(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
// //     return this.productsService.deleteVendorProduct(user.id, id);
// //   }

// //   // Gallery Management
// //   @UseGuards(AuthGuard, )
// //   @Post('vendor/:id/gallery')
// //   @UseInterceptors(FileFieldsInterceptor([
// //     { name: 'images', maxCount: 10 },
// //     { name: 'videos', maxCount: 3 }
// //   ]))
// //   async addProductMedia(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @UploadedFiles() files: { images?: Express.Multer.File[], videos?: Express.Multer.File[] }
// //   ) {
// //     return this.productsService.addProductMedia(user.id, productId, files);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Put('vendor/:id/gallery/:galleryId')
// //   async updateProductMedia(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Param('galleryId', ParseIntPipe) galleryId: number,
// //     @Body() updateData: any
// //   ) {
// //     return this.productsService.updateProductMedia(user.id, productId, galleryId, updateData);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Delete('vendor/:id/gallery/:galleryId')
// //   async deleteProductMedia(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Param('galleryId', ParseIntPipe) galleryId: number
// //   ) {
// //     return this.productsService.deleteProductMedia(user.id, productId, galleryId);
// //   }

// //   // Variants Management
// //   @UseGuards(AuthGuard, )
// //   @Post('vendor/:id/variants')
// //   async createVariant(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Body() createVariantDto: CreateVariantDto
// //   ) {
// //     return this.productsService.createProductVariant(user.id, productId, createVariantDto);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Put('vendor/:id/variants/:variantId')
// //   async updateVariant(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Param('variantId', ParseIntPipe) variantId: number,
// //     @Body() updateVariantDto: UpdateVariantDto
// //   ) {
// //     return this.productsService.updateProductVariant(user.id, productId, variantId, updateVariantDto);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Delete('vendor/:id/variants/:variantId')
// //   async deleteVariant(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Param('variantId', ParseIntPipe) variantId: number
// //   ) {
// //     return this.productsService.deleteProductVariant(user.id, productId, variantId);
// //   }

// //   // Variant Values Management
// //   @UseGuards(AuthGuard, )
// //   @Post('vendor/:id/variants/:variantId/values')
// //   async createVariantValue(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Param('variantId', ParseIntPipe) variantId: number,
// //     @Body() createValueDto: CreateVariantValueDto
// //   ) {
// //     return this.productsService.createVariantValue(user.id, productId, variantId, createValueDto);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Put('vendor/:id/variants/:variantId/values/:valueId')
// //   async updateVariantValue(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Param('variantId', ParseIntPipe) variantId: number,
// //     @Param('valueId', ParseIntPipe) valueId: number,
// //     @Body() updateValueDto: UpdateVariantValueDto
// //   ) {
// //     return this.productsService.updateVariantValue(user.id, productId, variantId, valueId, updateValueDto);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Delete('vendor/:id/variants/:variantId/values/:valueId')
// //   async deleteVariantValue(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Param('variantId', ParseIntPipe) variantId: number,
// //     @Param('valueId', ParseIntPipe) valueId: number
// //   ) {
// //     return this.productsService.deleteVariantValue(user.id, productId, variantId, valueId);
// //   }

// //   // Combinations Management
// //   @UseGuards(AuthGuard, )
// //   @Post('vendor/:id/combinations')
// //   @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
// //   async createCombination(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Body() createCombinationDto: CreateVariantCombinationDto,
// //     @UploadedFiles() files: { image?: Express.Multer.File[] }
// //   ) {
// //     return this.productsService.createVariantCombination(user.id, productId, createCombinationDto, files);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Put('vendor/:id/combinations/:combinationId')
// //   @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
// //   async updateCombination(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Param('combinationId', ParseIntPipe) combinationId: number,
// //     @Body() updateCombinationDto: UpdateVariantCombinationDto,
// //     @UploadedFiles() files: { image?: Express.Multer.File[] }
// //   ) {
// //     return this.productsService.updateVariantCombination(user.id, productId, combinationId, updateCombinationDto, files);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Delete('vendor/:id/combinations/:combinationId')
// //   async deleteCombination(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Param('combinationId', ParseIntPipe) combinationId: number
// //   ) {
// //     return this.productsService.deleteVariantCombination(user.id, productId, combinationId);
// //   }

// //   // Specifications Management
// //   @UseGuards(AuthGuard, )
// //   @Post('vendor/:id/specifications')
// //   async createSpecification(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Body() createSpecDto: CreateSpecificationDto
// //   ) {
// //     return this.productsService.createProductSpecification(user.id, productId, createSpecDto);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Put('vendor/:id/specifications/:specId')
// //   async updateSpecification(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Param('specId', ParseIntPipe) specId: number,
// //     @Body() updateSpecDto: UpdateSpecificationDto
// //   ) {
// //     return this.productsService.updateProductSpecification(user.id, productId, specId, updateSpecDto);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Delete('vendor/:id/specifications/:specId')
// //   async deleteSpecification(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Param('specId', ParseIntPipe) specId: number
// //   ) {
// //     return this.productsService.deleteProductSpecification(user.id, productId, specId);
// //   }

// //   // ==================== ADMIN ENDPOINTS ====================
  
// //   @UseGuards(AuthGuard, )
// //   @Get('admin')
// //   async getAdminProducts(@Query() query: ProductQueryDto) {
// //     return this.productsService.getAdminProducts(query);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Get('admin/:id')
// //   async getAdminProduct(@Param('id', ParseIntPipe) id: number) {
// //     return this.productsService.getAdminProduct(id);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Post('admin/:id/approve')
// //   async approveProduct(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) id: number,
// //     @Body() approvalData: ApprovalActionDto
// //   ) {
// //     return this.productsService.approveProduct(id, approvalData, user.id);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Post('admin/:id/reject')
// //   async rejectProduct(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) id: number,
// //     @Body() rejectionData: ApprovalActionDto
// //   ) {
// //     return this.productsService.rejectProduct(id, rejectionData, user.id);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Put('admin/:id')
// //   async updateAdminProduct(
// //     @Param('id', ParseIntPipe) id: number,
// //     @Body() updateProductDto: UpdateProductDto
// //   ) {
// //     return this.productsService.updateAdminProduct(id, updateProductDto);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Delete('admin/:id')
// //   async deleteAdminProduct(@Param('id', ParseIntPipe) id: number) {
// //     return this.productsService.deleteAdminProduct(id);
// //   }

// //   // Review Management
// //   @UseGuards(AuthGuard, )
// //   @Get('admin/reviews')
// //   async getAdminReviews(@Query() query: any) {
// //     return this.productsService.getAdminReviews(query);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Post('admin/reviews/:reviewId/approve')
// //   async approveReview(
// //     @CurrentUser() user: any,
// //     @Param('reviewId', ParseIntPipe) reviewId: number
// //   ) {
// //     return this.productsService.approveReview(reviewId, user.id);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Post('admin/reviews/:reviewId/reject')
// //   async rejectReview(
// //     @CurrentUser() user: any,
// //     @Param('reviewId', ParseIntPipe) reviewId: number
// //   ) {
// //     return this.productsService.rejectReview(reviewId, user.id);
// //   }

// //   // Search Sync Queue Management
// //   @UseGuards(AuthGuard, )
// //   @Get('admin/search-sync-queue')
// //   async getSearchSyncQueue(@Query() query: any) {
// //     return this.productsService.getSearchSyncQueue(query);
// //   }

// //   @UseGuards(AuthGuard, )
// //   @Post('admin/search-sync-queue/process')
// //   async processSearchSyncQueue() {
// //     return this.productsService.processSearchSyncQueue();
// //   }

// //   // ==================== USER ENDPOINTS (AUTHENTICATED) ====================
  
// //   @UseGuards(AuthGuard)
// //   @Post(':id/reviews')
// //   async createReview(
// //     @CurrentUser() user: any,
// //     @Param('id', ParseIntPipe) productId: number,
// //     @Body() createReviewDto: CreateReviewDto
// //   ) {
// //     return this.productsService.createReview(productId, user.id, createReviewDto);
// //   }

// //   @UseGuards(AuthGuard)
// //   @Put('reviews/:reviewId')
// //   async updateReview(
// //     @CurrentUser() user: any,
// //     @Param('reviewId', ParseIntPipe) reviewId: number,
// //     @Body() updateReviewDto: UpdateReviewDto
// //   ) {
// //     return this.productsService.updateReview(reviewId, user.id, updateReviewDto);
// //   }

// //   @UseGuards(AuthGuard)
// //   @Delete('reviews/:reviewId')
// //   async deleteReview(
// //     @CurrentUser() user: any,
// //     @Param('reviewId', ParseIntPipe) reviewId: number
// //   ) {
// //     return this.productsService.deleteReview(reviewId, user.id);
// //   }

// //   @UseGuards(AuthGuard)
// //   @Get('user/reviews')
// //   async getUserReviews(@CurrentUser() user: any, @Query() query: any) {
// //     return this.productsService.getUserReviews(user.id, query);
// //   }
// // }


// // =============================================================================================== v3
// // Enhanced Product Controller
// import { 
//   Controller, 
//   Get, 
//   Post, 
//   Put, 
//   Delete, 
//   Body, 
//   Param, 
//   Query, 
//   ParseIntPipe,
//   UseGuards,
//   Request,
//   HttpStatus,
//   HttpCode,
//   UseInterceptors,
//   UploadedFiles,
//   BadRequestException
// } from '@nestjs/common';
// import { FilesInterceptor } from '@nestjs/platform-express';
// import {  ProductsService } from './products.service';
// import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';

// // DTO Interfaces for request validation
// export  interface CreateProductRequestDto {
//   name: string;
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
//   slug?: string;
//   status?: 'draft' | 'active' | 'archived';
//   visibility?: 'visible' | 'hidden';
//   is_featured?: boolean;
//   is_physical?: boolean;
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
//   gallery?: {
//     media_type: 'image' | 'video';
//     url: string;
//     alt_text?: string;
//     sort_order?: number;
//     is_primary?: boolean;
//   }[];
// }

// interface UpdateProductRequestDto {
//   name?: string;
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
//   slug?: string;
//   status?: 'draft' | 'active' | 'archived';
//   visibility?: 'visible' | 'hidden';
//   is_featured?: boolean;
//   is_physical?: boolean;
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
//   gallery?: {
//     media_type: 'image' | 'video';
//     url: string;
//     alt_text?: string;
//     sort_order?: number;
//     is_primary?: boolean;
//   }[];
// }

// interface ProductQueryDto {
//   search?: string;
//   category_id?: number;
//   brand_id?: number;
//   vendor_id?: number;
//   status?: 'draft' | 'active' | 'archived';
//   visibility?: 'visible' | 'hidden';
//   is_featured?: boolean;
//   min_price?: number;
//   max_price?: number;
//   sort_by?: string;
//   sort_order?: 'ASC' | 'DESC';
//   page?: number;
//   limit?: number;
// }

// interface BulkUpdateStatusDto {
//   product_ids: number[];
//   status: 'draft' | 'active' | 'archived';
// }

// interface CloneProductDto {
//   name: string;
// }

// @Controller('products')
// export class ProductsController {
//   constructor(private readonly productsService: ProductsService) {}

//   // ==================== COMPREHENSIVE CRUD OPERATIONS ====================

//   /**
//    * Create a new product with all related data
//    * POST /products
//    */
//   @Post('vendor/create')
//   @HttpCode(HttpStatus.CREATED)
//   @UseInterceptors(FilesInterceptor('files', 20)) // Support up to 20 files
//   async createProduct(
//     @Body() createProductDto: CreateProductRequestDto,
//     @UploadedFiles() files?: Express.Multer.File[],
//     @Request() req?: any
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       // Extract vendor_id from authenticated user (adjust based on your auth system)
//       const vendorId = req?.user?.vendor_id || req?.user?.id;
//       if (!vendorId) {
//         throw new BadRequestException('Vendor ID is required');
//       }

//       // Process uploaded files if any
//       if (files && files.length > 0) {
//         const galleryItems = await this.processUploadedFiles(files);
//         createProductDto.gallery = [...(createProductDto.gallery || []), ...galleryItems];
//       }

//       const productData:any = {
//         ...createProductDto,
//         vendor_id: vendorId
//       };

//       return await this.productsService.createProduct(productData);
//     } catch (error) {
//       throw new BadRequestException(error.message || 'Failed to create product');
//     }
//   }



//   //   @Post('vendor/create')
//   // @HttpCode(HttpStatus.CREATED)
//   // @UseGuards(AuthGuard, RoleGuard)
//   // @UseInterceptors(MultipartInterceptor())
//   // async createProduct(
//   //   @Body() body: any,
//   //   @Req() req: any, // Use @Req() to access the full request object
//   //   @Headers('authorization') authHeader: string,
//   // ): Promise<ApiResponseFormat<any>> {
//   //   console.log("🚀 ~ ProductsController ~ createProduct ~ req:", req)
//   //   try {
//   //     const tokenValues: any = ProductsController.decodeToken(authHeader);
//   //     const vendorId = tokenValues?.userId;
//   //     if (!vendorId) {
//   //       throw new BadRequestException('Vendor ID is required');
//   //     }

//   //     // Access the files from the custom 'storedFiles' property set by the interceptor
//   //     const files = req.storedFiles;

//   //     // Parse the JSON data from the 'data' field in the body
//   //     let productData = null;
//   //     if (body.data) {
//   //       productData = JSON.parse(body.data);
//   //     }

//   //     console.log('🚀 ~ ProductsController ~ createProduct ~ body:', body);
//   //     console.log(
//   //       '🚀 ~ ProductsController ~ createProduct ~ productData:',
//   //       productData,
//   //     );
//   //     console.log('🚀 ~ ProductsController ~ createProduct ~ files:', files);

//   //     if (!productData) {
//   //       throw new BadRequestException('Product data is required');
//   //     }

//   //     const createProductDto: CreateProductRequestDto = productData;

//   //     // Handle file uploads if any
//   //     if (files.files && files.files.length > 0) {
//   //       const galleryItems = [];
//   //       for (const file of files.files) {
//   //         // Convert to format your Cloudinary service expects
//   //         const multipartFile: any = {
//   //           file: file.buffer,
//   //           filename: file.filename,
//   //           mimetype: file.mimetype,
//   //           fieldname: file.fieldname,
//   //         };

//   //         const uploadedFileResult: any =
//   //           await this.cloudinaryService.uploadImage(multipartFile);
//   //         if (uploadedFileResult.hasOwnProperty('secure_url')) {
//   //           galleryItems.push({
//   //             url: (uploadedFileResult as unknown as UploadApiResponse)
//   //               .secure_url,
//   //           });
//   //         } else {
//   //           throw new BadRequestException(
//   //             'Failed to upload image to Cloudinary',
//   //           );
//   //         }
//   //       }
//   //       createProductDto.gallery = [
//   //         ...(createProductDto.gallery || []),
//   //         ...galleryItems,
//   //       ];
//   //     }

//   //     const finalProductData: any = {
//   //       ...createProductDto,
//   //       vendor_id: vendorId,
//   //     };

//   //     return ApiResponse.success(
//   //       await this.productsService.createProduct(finalProductData),
//   //       'Product created successfully',
//   //     );
//   //   } catch (error) {
//   //     console.error('Error in createProduct:', error);
//   //     throw new BadRequestException(
//   //       error.message || 'Failed to create product',
//   //     );
//   //   }
//   // }
//   /**
//    * Update a product with all related data
//    * PUT /products/:id
//    */
//   @Put(':id')
//   @UseInterceptors(FilesInterceptor('files', 20))
//   async updateProduct(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() updateProductDto: UpdateProductRequestDto,
//     @UploadedFiles() files?: Express.Multer.File[],
//     @Request() req?: any
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const vendorId = req?.user?.vendor_id || req?.user?.id;

//       // Process uploaded files if any
//       if (files && files.length > 0) {
//         const galleryItems = await this.processUploadedFiles(files);
//         updateProductDto.gallery = [...(updateProductDto.gallery || []), ...galleryItems];
//       }

//       return await this.productsService.updateProduct(id, updateProductDto, vendorId);
//     } catch (error) {
//       throw new BadRequestException(error.message || 'Failed to update product');
//     }
//   }

//   /**
//    * Get a single product with all related data
//    * GET /products/:id
//    */
//   @Get(':id')
//   async getProduct(@Param('id', ParseIntPipe) id: number): Promise<ApiResponseFormat<any>> {
//     return await this.productsService.getProduct(id);
//   }

//   /**
//    * Delete a product with all related data
//    * DELETE /products/:id
//    */
//   @Delete(':id')
//   @HttpCode(HttpStatus.NO_CONTENT)
//   async deleteProduct(
//     @Param('id', ParseIntPipe) id: number,
//     @Request() req?: any
//   ): Promise<ApiResponseFormat<boolean>> {
//     const vendorId = req?.user?.vendor_id || req?.user?.id;
//     return await this.productsService.deleteProduct(id, vendorId);
//   }

//   // ==================== PRODUCT LISTING & FILTERING ====================

//   /**
//    * Get all products with pagination and filters
//    * GET /products
//    */
//   @Get()
//   async getProducts(@Query() query: ProductQueryDto): Promise<ApiResponseFormat<any[]>> {
//     return await this.productsService.getProducts(query);
//   }

//   /**
//    * Get active products only
//    * GET /products/active
//    */
//   @Get('active/list')
//   async getActiveProducts(@Query() query: ProductQueryDto): Promise<ApiResponseFormat<any[]>> {
//     return await this.productsService.getActiveProducts(query);
//   }

//   /**
//    * Get vendor products
//    * GET /products/vendor/:vendorId
//    */
//   @Get('vendor/:vendorId')
//   async getVendorProducts(
//     @Param('vendorId', ParseIntPipe) vendorId: number,
//     @Query() query: ProductQueryDto
//   ): Promise<ApiResponseFormat<any[]>> {
//     return await this.productsService.getVendorProducts(vendorId, query);
//   }

//   /**
//    * Get current vendor's products (requires authentication)
//    * GET /products/my/list
//    */
//   @Get('my/list')
//   // @UseGuards(AuthGuard) // Add your auth guard
//   async getMyProducts(
//     @Query() query: ProductQueryDto,
//     @Request() req: any
//   ): Promise<ApiResponseFormat<any[]>> {
//     const vendorId = req?.user?.vendor_id || req?.user?.id;
//     return await this.productsService.getVendorProducts(vendorId, query);
//   }

//   // ==================== BULK OPERATIONS ====================

//   /**
//    * Bulk update product status
//    * PUT /products/bulk/status
//    */
//   @Put('bulk/status')
//   async bulkUpdateStatus(
//     @Body() bulkUpdateDto: BulkUpdateStatusDto,
//     @Request() req?: any
//   ): Promise<ApiResponseFormat<any>> {
//     const vendorId = req?.user?.vendor_id || req?.user?.id;
//     return await this.productsService.bulkUpdateProductStatus(
//       bulkUpdateDto.product_ids,
//       bulkUpdateDto.status,
//       vendorId
//     );
//   }

//   /**
//    * Bulk delete products
//    * DELETE /products/bulk
//    */
//   @Delete('bulk')
//   async bulkDeleteProducts(
//     @Body() { product_ids }: { product_ids: number[] },
//     @Request() req?: any
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const vendorId = req?.user?.vendor_id || req?.user?.id;
//       const results = [];

//       for (const productId of product_ids) {
//         const deleteResult = await this.productsService.deleteProduct(productId, vendorId);
//         results.push({
//           productId,
//           success: deleteResult.result,
//           message: deleteResult.message
//         });
//       }

//      return ApiResponse.success(results)
//     } catch (error) {
//       throw new BadRequestException('Failed to bulk delete products');
//     }
//   }

//   // ==================== ADVANCED OPERATIONS ====================

//   /**
//    * Clone a product
//    * POST /products/:id/clone
//    */
//   @Post(':id/clone')
//   async cloneProduct(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() cloneDto: CloneProductDto,
//     @Request() req?: any
//   ): Promise<ApiResponseFormat<any>> {
//     const vendorId = req?.user?.vendor_id || req?.user?.id;
//     return await this.productsService.cloneProduct(id, cloneDto.name, vendorId);
//   }

//   /**
//    * Get product statistics
//    * GET /products/stats/overview
//    */
//   @Get('stats/overview')
//   async getProductStats(
//     @Query('product_id') productId?: number,
//     @Request() req?: any
//   ): Promise<ApiResponseFormat<any>> {
//     const vendorId = req?.user?.vendor_id || req?.user?.id;
//     return await this.productsService.getProductStats(productId, vendorId);
//   }

//   /**
//    * Search products with advanced filters
//    * POST /products/search
//    */
//   @Post('search')
//   async searchProducts(
//     @Body() searchDto: {
//       query?: string;
//       filters?: ProductQueryDto;
//       sort?: { field: string; direction: 'ASC' | 'DESC' };
//       pagination?: { page: number; limit: number };
//     }
//   ): Promise<ApiResponseFormat<any[]>> {
//     const queryParams = {
//       search: searchDto.query,
//       ...searchDto.filters,
//       sort_by: searchDto.sort?.field,
//       sort_order: searchDto.sort?.direction,
//       page: searchDto.pagination?.page,
//       limit: searchDto.pagination?.limit
//     };

//     return await this.productsService.getProducts(queryParams);
//   }

//   // ==================== HELPER METHODS ====================

//   /**
//    * Process uploaded files and return gallery items
//    */
//   private async processUploadedFiles(files: Express.Multer.File[]): Promise<any[]> {
//     const galleryItems = [];

//     for (let i = 0; i < files.length; i++) {
//       const file = files[i];
      
//       // Here you would typically upload the file to your storage service
//       // and get back the URL. For this example, we'll assume you have a storage service
//       const uploadedUrl = await this.uploadFileToStorage(file);
      
//       const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
      
//       galleryItems.push({
//         media_type: mediaType,
//         url: uploadedUrl,
//         alt_text: file.originalname,
//         sort_order: i,
//         is_primary: i === 0 // First image is primary
//       });
//     }

//     return galleryItems;
//   }

//   /**
//    * Upload file to storage service (implement based on your storage solution)
//    */
//   private async uploadFileToStorage(file: Express.Multer.File): Promise<string> {
//     // Implement your file upload logic here
//     // This could be AWS S3, Google Cloud Storage, local storage, etc.
    
//     // For example, if using AWS S3:
//     // const result = await this.s3Service.upload(file);
//     // return result.Location;
    
//     // For now, return a placeholder URL
//     return `https://your-storage-domain.com/uploads/${Date.now()}_${file.originalname}`;
//   }

//   /**
//    * Validate file types
//    */
//   private validateFileTypes(files: Express.Multer.File[]): void {
//     const allowedTypes = [
//       'image/jpeg',
//       'image/jpg', 
//       'image/png',
//       'image/gif',
//       'image/webp',
//       'video/mp4',
//       'video/avi',
//       'video/mov',
//       'video/wmv'
//     ];

//     for (const file of files) {
//       if (!allowedTypes.includes(file.mimetype)) {
//         throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
//       }
//     }
//   }
// }