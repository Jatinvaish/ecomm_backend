// import {
//   Controller,
//   Post,
//   Put,
//   Get,
//   Body,
//   Param,
//   Query,
//   ParseIntPipe,
//   UseGuards,
//   Request,
//   HttpStatus,
//   HttpCode,
//   BadRequestException,
//   NotFoundException,
//   ValidationPipe,
//   UsePipes,
//   Req,
// } from '@nestjs/common';
// import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
// import { AuthGuard } from 'src/common/guards/auth.guard';
// import { RoleGuard, AdminGuard, VendorGuard } from 'src/common/guards/role.guard';
// import {
//   UpdateVendorDetailsDto,
//   VendorFilterDto,
//   VendorApprovalDto
// } from './dto/vendor.dto';
// import { VendorsRepository } from './vendors.repository';
// import { generateSlug } from 'src/common/utils/api-helpers';
// import { FastifyRequest } from 'fastify';
// import { SelectQuery } from 'src/db/postgres.client';
// import { CloudinaryService } from '../cloudinary/cloudinary.service';
// import { FormDataRequest, MemoryStoredFile } from 'nestjs-form-data';

// @Controller('vendors')
// export class VendorsController {
//   constructor(
//     private readonly vendorsRepository: VendorsRepository,
//     private readonly cloudinaryService: CloudinaryService // Add this to constructor
//   ) { }

//   /**
//    * Get vendor profile (vendor-specific profile with full details)
//    * GET /vendors/profile
//    */
//   @Get('profile')
//   @UseGuards(AuthGuard, VendorGuard)
//   async getVendorProfile(
//     @Request() req: any
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const userId = req.user.id;
//       const vendor = await this.vendorsRepository.getVendorProfileByUserId(userId);

//       if (!vendor) {
//         throw new NotFoundException('Vendor profile not found');
//       }

//       return ApiResponse.success(vendor, 'Vendor profile retrieved successfully');
//     } catch (error) {
//       console.error('Get vendor profile error:', error);
//       if (error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new BadRequestException('Failed to get vendor profile');
//     }
//   }


//   // 2nd

//   @Post('update-details')
//   @HttpCode(HttpStatus.OK)
//   @UseGuards(AuthGuard, VendorGuard)
//   @FormDataRequest()
//   async updateVendorDetails(
//     @Req() req: FastifyRequest,
//     @Body() body: UpdateVendorDetailsDto
//   ): Promise<ApiResponseFormat<any>> {
//     console.log("🚀 ~ Content-Type:", req.headers['content-type']);
//     console.log("🚀 ~ All headers:", req.headers);
//     console.log("🚀 ~ Raw body type:", typeof req.body);
//     console.log("🚀 ~ Raw body constructor:", req.body?.constructor?.name);

//     try {
//       if (!req.user) {
//         throw new BadRequestException('User authentication required');
//       }

//       // Get vendor ID
//       const getVendorIdBasedOnUserId = req.user;
//       const getVendorIdData: any = await SelectQuery(
//         `SELECT id FROM vendors WHERE user_id = $1 LIMIT 1`,
//         [getVendorIdBasedOnUserId.id]
//       );
//       const vendorId = getVendorIdData[0]?.id;

//       if (!vendorId) {
//         throw new BadRequestException('Vendor ID is required');
//       }

//       console.log("🚀 ~ Processing vendor ID:", vendorId);

//       // Check if vendor exists
//       const existingVendor = await this.vendorsRepository.findVendorById(vendorId);
//       if (!existingVendor) {
//         throw new NotFoundException(`Vendor not found with ID: ${vendorId}`);
//       }

//       // Process the form data body
//       let updateVendorData: Record<string, any> = {};
//       let filesToProcess: Array<{ file: MemoryStoredFile; fieldname: string }> = [];

//       // Enhanced body processing with detailed logging
//       if (body && typeof body === 'object') {
//         console.log("📋 Processing body structure...");

//         Object.entries(body).forEach(([key, value]) => {
//           if (value instanceof MemoryStoredFile) {
//             console.log(`📁 Found file: ${key} - ${value.originalName} (${value.size} bytes, ${value.mimetype})`);
//             filesToProcess.push({ file: value, fieldname: key });
//           } else if (Array.isArray(value)) {
//             console.log(`📋 Array field ${key}:`, value.length, 'items');
//             // Handle array of files (like verification_documents)
//             const fileItems: MemoryStoredFile[] = [];
//             const nonFileItems: any[] = [];

//             value.forEach((item, idx) => {
//               if (item instanceof MemoryStoredFile) {
//                 console.log(`   File[${idx}]: ${item.originalName} (${item.size} bytes)`);
//                 filesToProcess.push({ file: item, fieldname: `${key}[${idx}]` });
//                 fileItems.push(item);
//               } else {
//                 console.log(`   Item[${idx}]: ${typeof item} - ${item}`);
//                 nonFileItems.push(item);
//               }
//             });

//             // If it's not all files, add non-file items to update data
//             if (nonFileItems.length > 0) {
//               updateVendorData[key] = nonFileItems;
//             }
//           } else if (value !== null && value !== undefined && value !== '') {
//             console.log(`📝 Field ${key}: ${typeof value} - ${value}`);

//             // Handle JSON fields that might come as strings
//             const jsonFields = [
//               'address',
//               'contact_info',
//               'business_hours',
//               'social_links',
//               'settings',
//               'verification_documents'
//             ];

//             if (jsonFields.includes(key) && typeof value === 'string') {
//               try {
//                 const parsedValue = JSON.parse(value);
//                 console.log(`🔄 Parsed JSON for ${key}:`, parsedValue);
//                 updateVendorData[key] = parsedValue;
//               } catch (e) {
//                 console.warn(`⚠️ Failed to parse ${key} as JSON, keeping as string:`, value);
//                 updateVendorData[key] = value;
//               }
//             } else {
//               updateVendorData[key] = value;
//             }
//           }
//         });
//       } else {
//         console.log("❌ Body is not an object:", typeof body, body);
//         throw new BadRequestException('Invalid form data received');
//       }

//       console.log("🚀 ~ Files to process:", filesToProcess.length);
//       console.log("🚀 ~ Update data keys:", Object.keys(updateVendorData));

//       // Process uploaded files
//       let uploadedFiles: {
//         logo_url?: string;
//         banner_url?: string;
//         verification_documents?: string[]
//       } = {};

//       if (filesToProcess.length > 0) {
//         console.log("🚀 ~ Processing files for Cloudinary upload...");
//         uploadedFiles = await this.processVendorFiles(filesToProcess);
//         console.log("🚀 ~ Files uploaded to Cloudinary:", uploadedFiles);
//       }

//       // Generate store slug if store name changed
//       if (updateVendorData.store_name && updateVendorData.store_name !== existingVendor.store_name) {
//         const baseSlug = generateSlug(updateVendorData.store_name);
//         updateVendorData.store_slug = await this.generateUniqueStoreSlug(baseSlug, vendorId);
//         console.log("🚀 ~ Generated new store slug:", updateVendorData.store_slug);
//       }

//       // Combine all update data
//       const updateData: Record<string, any> = {
//         ...updateVendorData,
//         ...uploadedFiles,
//         updated_by: req.user.id,
//         updated_at: new Date()
//       };

//       console.log("🚀 ~ Final updateData being sent to repository:", updateData);

//       // Update vendor in database
//       const updatedVendor = await this.vendorsRepository.updateVendorDetails(vendorId, updateData);

//       console.log("🚀 ~ Repository response:", updatedVendor);

//       return ApiResponse.success(updatedVendor, 'Vendor details updated successfully');

//     } catch (error) {
//       console.error('❌ Update vendor details error:', error);
//       if (error instanceof BadRequestException || error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new BadRequestException(`Failed to update vendor details: ${error.message}`);
//     }
//   }


//   /**
//    * Get vendor dashboard stats
//    * GET /vendors/dashboard-stats
//    */
//   @Get('dashboard-stats')
//   @UseGuards(AuthGuard, VendorGuard)
//   async getVendorDashboardStats(
//     @Request() req: any
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const userId = req.user.id;
//       const vendor = await this.vendorsRepository.getVendorByUserId(userId);

//       if (!vendor) {
//         throw new NotFoundException('Vendor not found');
//       }

//       const stats = await this.vendorsRepository.getVendorStats(vendor.id);

//       return ApiResponse.success(stats, 'Dashboard stats retrieved successfully');
//     } catch (error) {
//       console.error('Get vendor dashboard stats error:', error);
//       if (error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new BadRequestException('Failed to get dashboard stats');
//     }
//   }

//   // ==================== ADMIN ENDPOINTS ====================

//   @Get('admin/list')
//   @UseGuards(AuthGuard, RoleGuard, AdminGuard)
//   async getAllVendors(
//     @Query() filterDto: VendorFilterDto
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const vendors = await this.vendorsRepository.getAllVendors(filterDto);
//       return ApiResponse.success(vendors, 'Vendors retrieved successfully');
//     } catch (error) {
//       console.error('Get all vendors error:', error);
//       throw new BadRequestException('Failed to get vendors');
//     }
//   }

//   @Get('admin/:id')
//   @UseGuards(AuthGuard, RoleGuard, AdminGuard)
//   async getVendorById(
//     @Param('id', ParseIntPipe) vendorId: number
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const vendor = await this.vendorsRepository.getVendorById(vendorId);

//       if (!vendor) {
//         throw new NotFoundException('Vendor not found');
//       }

//       return ApiResponse.success(vendor, 'Vendor details retrieved successfully');
//     } catch (error) {
//       console.error('Get vendor by ID error:', error);
//       if (error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new BadRequestException('Failed to get vendor details');
//     }
//   }

//   @Put('admin/approval')
//   @UseGuards(AuthGuard, RoleGuard, AdminGuard)
//   @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
//   async updateVendorApproval(
//     @Request() req: any,
//     @Body() approvalDto: VendorApprovalDto
//   ): Promise<ApiResponseFormat<any>> {
//     try {
//       const adminId = req.user.id;
//       const updatedVendor = await this.vendorsRepository.updateVendorStatus(
//         approvalDto.vendor_id,
//         approvalDto.status,
//         adminId,
//         approvalDto.verification_notes
//       );

//       return ApiResponse.success(updatedVendor, 'Vendor status updated successfully');
//     } catch (error) {
//       console.error('Update vendor approval error:', error);
//       if (error instanceof NotFoundException) {
//         throw error;
//       }
//       throw new BadRequestException('Failed to update vendor status');
//     }
//   }

//   // ==================== HELPER METHODS ====================

//   private async processVendorFiles(files: Array<{ file: MemoryStoredFile; fieldname: string }>): Promise<{
//     logo_url?: string;
//     banner_url?: string;
//     verification_documents?: string[]
//   }> {
//     const result: {
//       logo_url?: string;
//       banner_url?: string;
//       verification_documents?: string[]
//     } = {};

//     // Handle verification_documents array
//     const verificationDocs: string[] = [];

//     for (const { file, fieldname } of files) {
//       try {
//         console.log(`Processing file: ${fieldname}, filename: ${file.originalName}, mimetype: ${file.mimetype}`);

//         // Convert MemoryStoredFile to Express.Multer.File format for Cloudinary
//         const buffer = file.buffer;
//         console.log(`File buffer size: ${buffer.length}`);

//         const multerFile: Express.Multer.File = {
//           buffer,
//           originalname: file.originalName || `${fieldname}_${Date.now()}`,
//           mimetype: file.mimetype,
//           size: buffer.length,
//           fieldname,
//           filename: file.originalName || `${fieldname}_${Date.now()}`,
//           encoding: file.encoding || '7bit',
//           destination: '',
//           path: '',
//           stream: null as any
//         };

//         // Validate file
//         this.validateVendorFile(multerFile);

//         // Upload to Cloudinary with specific folder structure
//         let uploadResult: any;
//         if (fieldname === 'logo') {
//           uploadResult = await this.cloudinaryService.uploadVendorFile(multerFile, 'multivendor_ecommerce/vendors/logos');
//         } else if (fieldname === 'banner') {
//           uploadResult = await this.cloudinaryService.uploadVendorFile(multerFile, 'multivendor_ecommerce/vendors/banners');
//         } else if (fieldname.startsWith('verification_documents')) {
//           uploadResult = await this.cloudinaryService.uploadVendorFile(multerFile, 'multivendor_ecommerce/vendors/documents');
//         } else {
//           uploadResult = await this.cloudinaryService.uploadVendorFile(multerFile, 'multivendor_ecommerce/vendors/others');
//         }

//         console.log(`Upload result for ${fieldname}:`, uploadResult);

//         // Fix: Check the correct properties from ApiResponse
//         if (uploadResult && uploadResult.status_code === 200 && uploadResult.result?.secure_url) {
//           const secureUrl = uploadResult.result.secure_url;

//           if (fieldname === 'logo') {
//             result.logo_url = secureUrl;
//           } else if (fieldname === 'banner') {
//             result.banner_url = secureUrl;
//           } else if (fieldname.startsWith('verification_documents')) {
//             verificationDocs.push(secureUrl);
//           }

//           console.log(`Successfully uploaded ${fieldname}: ${secureUrl}`);
//         } else {
//           console.error(`Upload failed for ${fieldname}:`, uploadResult);
//           throw new Error(`Upload failed for ${fieldname}: ${uploadResult?.message || 'Unknown error'}`);
//         }

//       } catch (error) {
//         console.error(`Error processing file ${file.originalName}:`, error);
//         throw new BadRequestException(`Failed to process file: ${file.originalName || fieldname}`);
//       }
//     }

//     // Add verification documents if any were uploaded
//     if (verificationDocs.length > 0) {
//       result.verification_documents = verificationDocs;
//     }

//     return result;
//   }

//   private validateVendorFile(file: Express.Multer.File): void {
//     const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
//     const maxSize = 5 * 1024 * 1024; // 5MB

//     if (!allowedMimeTypes.includes(file.mimetype)) {
//       throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
//     }

//     if (file.size > maxSize) {
//       throw new BadRequestException('File size too large. Maximum size is 5MB.');
//     }
//   }

//   private async generateUniqueStoreSlug(baseSlug: string, excludeVendorId: number): Promise<string> {
//     let counter = 0;
//     let slug = baseSlug;

//     while (await this.vendorsRepository.isStoreSlugTaken(slug, excludeVendorId)) {
//       counter++;
//       slug = `${baseSlug}-${counter}`;
//     }

//     return slug;
//   }
// }






//v2
import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  ValidationPipe,
  UsePipes,
  Req,
} from '@nestjs/common';
import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard, AdminGuard, VendorGuard } from 'src/common/guards/role.guard';
import {
  UpdateVendorDetailsDto,
  VendorFilterDto,
  VendorApprovalDto
} from './dto/vendor.dto';
import { VendorsRepository } from './vendors.repository';
import { generateSlug } from 'src/common/utils/api-helpers';
import { FastifyRequest } from 'fastify';
import { SelectQuery } from 'src/db/postgres.client';
import { FormDataRequest } from 'nestjs-form-data';
import { CommonFileProcessorService } from '../cloudinary/common-file-processing.service';

@Controller('vendors')
export class VendorsController {
  constructor(
    private readonly vendorsRepository: VendorsRepository,
    private readonly commonFileProcessor: CommonFileProcessorService
  ) { }

  /**
   * Get vendor profile (vendor-specific profile with full details)
   * GET /vendors/profile
   */
  @Get('profile')
  @UseGuards(AuthGuard, VendorGuard)
  async getVendorProfile(
    @Request() req: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      const userId = req.user.id;
      const vendor = await this.vendorsRepository.getVendorProfileByUserId(userId);

      if (!vendor) {
        throw new NotFoundException('Vendor profile not found');
      }

      return ApiResponse.success(vendor, 'Vendor profile retrieved successfully');
    } catch (error) {
      console.error('Get vendor profile error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get vendor profile');
    }
  }

  @Post('update-details')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard, VendorGuard)
  @FormDataRequest()
  async updateVendorDetails(
    @Req() req: FastifyRequest,
    @Body() body: UpdateVendorDetailsDto
  ): Promise<ApiResponseFormat<any>> {
    console.log("🚀 ~ Content-Type:", req.headers['content-type']);
    console.log("🚀 ~ All headers:", req.headers);
    console.log("🚀 ~ Raw body type:", typeof req.body);
    console.log("🚀 ~ Raw body constructor:", req.body?.constructor?.name);

    try {
      if (!req.user) {
        throw new BadRequestException('User authentication required');
      }

      // Get vendor ID
      const getVendorIdBasedOnUserId = req.user;
      const getVendorIdData: any = await SelectQuery(
        `SELECT id FROM vendors WHERE user_id = $1 LIMIT 1`,
        [getVendorIdBasedOnUserId.id]
      );
      const vendorId = getVendorIdData[0]?.id;

      if (!vendorId) {
        throw new BadRequestException('Vendor ID is required');
      }

      console.log("🚀 ~ Processing vendor ID:", vendorId);

      // Check if vendor exists
      const existingVendor = await this.vendorsRepository.findVendorById(vendorId);
      if (!existingVendor) {
        throw new NotFoundException(`Vendor not found with ID: ${vendorId}`);
      }

      // Extract files and clean body data using common file processor
      const { files, cleanedBody } = this.commonFileProcessor.extractFilesFromBody(body);
      
      console.log("🚀 ~ Files to process:", files.length);
      console.log("🚀 ~ Cleaned body keys:", Object.keys(cleanedBody));

      // Process uploaded files if any
      let uploadedFiles: Record<string, any> = {};
      if (files.length > 0) {
        console.log("🚀 ~ Processing files for Cloudinary upload...");
        uploadedFiles = await this.commonFileProcessor.processFiles(files, 'vendor', {
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp','application/pdf'],
          maxSize: 5 * 1024 * 1024, // 5MB for vendors
        });
        console.log("🚀 ~ Files uploaded to Cloudinary:", uploadedFiles);
      }

      // Generate store slug if store name changed
      if (cleanedBody.store_name && cleanedBody.store_name !== existingVendor.store_name) {
        const baseSlug = generateSlug(cleanedBody.store_name);
        cleanedBody.store_slug = await this.generateUniqueStoreSlug(baseSlug, vendorId);
        console.log("🚀 ~ Generated new store slug:", cleanedBody.store_slug);
      }

      // Combine all update data
      const updateData: Record<string, any> = {
        ...cleanedBody,
        ...uploadedFiles,
        updated_by: req.user.id,
        updated_at: new Date()
      };

      console.log("🚀 ~ Final updateData being sent to repository:", updateData);

      // Update vendor in database
      const updatedVendor = await this.vendorsRepository.updateVendorDetails(vendorId, updateData);

      console.log("🚀 ~ Repository response:", updatedVendor);

      return ApiResponse.success(updatedVendor, 'Vendor details updated successfully');

    } catch (error) {
      console.error('❌ Update vendor details error:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update vendor details: ${error.message}`);
    }
  }

  /**
   * Get vendor dashboard stats
   * GET /vendors/dashboard-stats
   */
  @Get('dashboard-stats')
  @UseGuards(AuthGuard, VendorGuard)
  async getVendorDashboardStats(
    @Request() req: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      const userId = req.user.id;
      const vendor = await this.vendorsRepository.getVendorByUserId(userId);

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      const stats = await this.vendorsRepository.getVendorStats(vendor.id);

      return ApiResponse.success(stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      console.error('Get vendor dashboard stats error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get dashboard stats');
    }
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/list')
  @UseGuards(AuthGuard, RoleGuard, AdminGuard)
  async getAllVendors(
    @Query() filterDto: VendorFilterDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      const vendors = await this.vendorsRepository.getAllVendors(filterDto);
      return ApiResponse.success(vendors, 'Vendors retrieved successfully');
    } catch (error) {
      console.error('Get all vendors error:', error);
      throw new BadRequestException('Failed to get vendors');
    }
  }

  @Get('admin/:id')
  @UseGuards(AuthGuard, RoleGuard, AdminGuard)
  async getVendorById(
    @Param('id', ParseIntPipe) vendorId: number
  ): Promise<ApiResponseFormat<any>> {
    try {
      const vendor = await this.vendorsRepository.getVendorById(vendorId);

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      return ApiResponse.success(vendor, 'Vendor details retrieved successfully');
    } catch (error) {
      console.error('Get vendor by ID error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get vendor details');
    }
  }

  @Put('admin/approval')
  @UseGuards(AuthGuard, RoleGuard, AdminGuard)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateVendorApproval(
    @Request() req: any,
    @Body() approvalDto: VendorApprovalDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      const adminId = req.user.id;
      const updatedVendor = await this.vendorsRepository.updateVendorStatus(
        approvalDto.vendor_id,
        approvalDto.status,
        adminId,
        approvalDto.verification_notes
      );

      return ApiResponse.success(updatedVendor, 'Vendor status updated successfully');
    } catch (error) {
      console.error('Update vendor approval error:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update vendor status');
    }
  }

  // ==================== HELPER METHODS ====================

  private async generateUniqueStoreSlug(baseSlug: string, excludeVendorId: number): Promise<string> {
    let counter = 0;
    let slug = baseSlug;

    while (await this.vendorsRepository.isStoreSlugTaken(slug, excludeVendorId)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }
}