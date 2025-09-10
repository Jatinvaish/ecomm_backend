import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import {
  ApiResponseFormat,
  ApiResponse,
} from 'src/common/utils/common-response';
import { Messages } from 'src/common/utils/messages';
import * as streamifier from 'streamifier';

type CloudinaryResourceType = 'image' | 'auto' | 'video' | 'raw';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'products/images'): Promise<ApiResponseFormat<any>> {
    try {
      return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image' as const,
            folder,
            quality: 'auto',
            format: 'webp',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto:good' }
            ]
          },
          (error, result) => {
            if (error) {
              resolve(ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500));
            } else {
              resolve(ApiResponse.success(result, 'Image uploaded successfully'));
            }
          }
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    } catch (error) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  // Main upload method for vendor files with dynamic resource type detection
  async uploadVendorFile(file: Express.Multer.File, folder: string): Promise<ApiResponseFormat<any>> {
    try {
      console.log(`Cloudinary upload started for folder: ${folder}`);
      console.log(`File details: size=${file.size}, mimetype=${file.mimetype}, filename=${file.originalname}`);
      
      // Get the appropriate upload configuration based on file type
      const { resourceType, uploadOptions } = this.getUploadConfig(file.mimetype, folder, file.originalname);
      
      return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              resolve(ApiResponse.error('Upload failed: ' + error.message, 500));
            } else {
              console.log('Cloudinary upload success:', result?.secure_url);
              resolve(ApiResponse.success(result, `${resourceType} uploaded successfully`));
            }
          }
        );
        
        // Create stream from buffer
        const readableStream = streamifier.createReadStream(file.buffer);
        readableStream.pipe(uploadStream);
        
        // Handle stream errors
        readableStream.on('error', (error) => {
          console.error('Stream error:', error);
          resolve(ApiResponse.error('Stream error: ' + error.message, 500));
        });
      });
    } catch (error) {
      console.error('Upload method error:', error);
      return ApiResponse.error('Upload failed: ' + error.message, 500);
    }
  }

  // Helper method to determine upload configuration based on file type
  private getUploadConfig(mimetype: string, folder: string, originalname?: string) {
    const basePublicId = `${Date.now()}_${originalname?.split('.')[0] || 'file'}`;
    
    if (mimetype.startsWith('image/')) {
      return {
        resourceType: 'Image',
        uploadOptions: {
          resource_type: 'image' as const,
          folder: folder,
          quality: 'auto',
          format: 'webp',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' }
          ],
          public_id: basePublicId
        }
      };
    } else if (mimetype.startsWith('video/')) {
      return {
        resourceType: 'Video',
        uploadOptions: {
          resource_type: 'video' as const,
          folder: folder,
          quality: 'auto',
          format: 'mp4', // Convert videos to mp4
          transformation: [
            { width: 1920, height: 1080, crop: 'limit' },
            { quality: 'auto:good' }
          ],
          public_id: basePublicId
        }
      };
    } else if (mimetype.startsWith('audio/')) {
      return {
        resourceType: 'Audio',
        uploadOptions: {
          resource_type: 'video' as const, // Cloudinary treats audio as video resource type
          folder: folder,
          public_id: basePublicId
        }
      };
    } else {
      // For documents, archives, etc.
      return {
        resourceType: 'Document',
        uploadOptions: {
          resource_type: 'raw' as const,
          folder: folder,
          public_id: basePublicId
        }
      };
    }
  }

  async uploadVideo(
    file: Express.Multer.File,
  ): Promise<ApiResponseFormat<any>> {
    try {
      return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video' as const,
            folder: 'products/videos',
            quality: 'auto',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto:good' },
            ],
          },
          (error, result) => {
            if (error) {
              resolve(ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500));
            } else {
              resolve(
                ApiResponse.success(result, 'Video uploaded successfully'),
              );
            }
          },
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    } catch (error) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async deleteMedia(
    publicId: string,
    resourceType: CloudinaryResourceType = 'image',
  ): Promise<ApiResponseFormat<any>> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      if (result.result === 'ok' || result.result === 'not found') {
        return ApiResponse.success(result, 'Media deleted successfully');
      } else {
        return ApiResponse.error('Failed to delete media', 400);
      }
    } catch (error) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  getPublicIdFromUrl(url: string): string | null {
    try {
      if (!url || !url.includes('cloudinary.com')) {
        return null;
      }

      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex((part) => part === 'upload');

      if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) {
        return null;
      }

      const pathAfterUpload = urlParts.slice(uploadIndex + 1);
      const versionRegex = /^v\d+$/;
      if (pathAfterUpload.length > 0 && versionRegex.test(pathAfterUpload[0])) {
        pathAfterUpload.shift();
      }

      const publicIdWithExt = pathAfterUpload.join('/');
      const lastDotIndex = publicIdWithExt.lastIndexOf('.');

      return lastDotIndex > -1
        ? publicIdWithExt.substring(0, lastDotIndex)
        : publicIdWithExt;
    } catch (error) {
      return null;
    }
  }

  async generateThumbnail(
    originalUrl: string,
    width: number = 300,
    height: number = 300,
  ): Promise<string> {
    try {
      const publicId = this.getPublicIdFromUrl(originalUrl);
      if (!publicId) {
        return originalUrl;
      }

      return cloudinary.url(publicId, {
        resource_type: 'image',
        transformation: [
          { width, height, crop: 'fill' },
          { quality: 'auto:good' },
          { format: 'webp' },
        ],
      });
    } catch (error) {
      return originalUrl;
    }
  }

  async optimizeImageUrl(
    originalUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
    } = {},
  ): Promise<string> {
    try {
      const publicId = this.getPublicIdFromUrl(originalUrl);
      if (!publicId) {
        return originalUrl;
      }

      const transformation: any[] = [];

      if (options.width || options.height) {
        transformation.push({
          width: options.width,
          height: options.height,
          crop: 'limit',
        });
      }

      if (options.quality) {
        transformation.push({ quality: options.quality });
      }

      return cloudinary.url(publicId, {
        resource_type: 'image',
        transformation,
        format: options.format || 'webp',
      });
    } catch (error) {
      return originalUrl;
    }
  }

  async getMediaDetails(url: string): Promise<ApiResponseFormat<any>> {
    try {
      const publicId = this.getPublicIdFromUrl(url);
      if (!publicId) {
        return ApiResponse.error('Invalid Cloudinary URL', 400);
      }

      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'auto',
      });

      return ApiResponse.success(
        result,
        'Media details retrieved successfully',
      );
    } catch (error) {
      if (error.http_code === 404) {
        return ApiResponse.notFound('Media not found');
      }
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }

  async bulkDelete(
    publicIds: string[],
    resourceType: CloudinaryResourceType = 'image',
  ): Promise<ApiResponseFormat<any>> {
    try {
      if (!publicIds || publicIds.length === 0) {
        return ApiResponse.error('No public IDs provided', 400);
      }

      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType,
      });

      return ApiResponse.success(result, 'Bulk delete completed');
    } catch (error) {
      return ApiResponse.error(Messages.INTERNAL_SERVER_ERROR, 500);
    }
  }
}