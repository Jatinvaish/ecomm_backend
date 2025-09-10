import { BadRequestException, Injectable } from "@nestjs/common";
import { MemoryStoredFile } from "nestjs-form-data";
import { CloudinaryService } from "./cloudinary.service";

export interface ProcessedFile {
  file: MemoryStoredFile;
  fieldname: string;
}

export interface FileUploadResult {
  [key: string]: string | string[];
}

@Injectable()
export class CommonFileProcessorService {
  constructor(private readonly cloudinaryService: CloudinaryService) { }

  /**
   * Process files for different entity types (vendor, product, etc.)
   */
  async processFiles(
    files: ProcessedFile[],
    entityType: 'vendor' | 'product' | 'category',
    options: {
      allowedMimeTypes?: string[];
      maxSize?: number;
      folders?: Record<string, string>;
    } = {}
  ): Promise<FileUploadResult> {
    const {
      allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'image/bmp',
        'image/tiff',
        // Videos
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv',
        'video/mkv',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        // Audio
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/flac',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
      ],
      maxSize = 5 * 1024 * 1024, // 5MB default
      folders = this.getDefaultFolders(entityType)
    } = options;

    const result: FileUploadResult = {};
    const arrayFields: Record<string, string[]> = {};

    for (const { file, fieldname } of files) {
      try {
        console.log(`Processing file: ${fieldname}, filename: ${file.originalName}, mimetype: ${file.mimetype}`);

        // Validate file
        this.validateFile(file, allowedMimeTypes, maxSize);

        // Convert to Express.Multer.File format
        const multerFile = this.convertToMulterFile(file, fieldname);

        // Determine upload folder
        const folder = this.determineUploadFolder(fieldname, folders, entityType);

        // Upload to Cloudinary
        const uploadResult = await this.cloudinaryService.uploadVendorFile(multerFile, folder);

        if (uploadResult && uploadResult.status_code === 200 && uploadResult.result?.secure_url) {
          const secureUrl = uploadResult.result.secure_url;

          // Handle different field types
          if (this.isArrayField(fieldname)) {
            const baseFieldName = this.getBaseFieldName(fieldname);
            if (!arrayFields[baseFieldName]) {
              arrayFields[baseFieldName] = [];
            }
            arrayFields[baseFieldName].push(secureUrl);
          } else {
            result[fieldname] = secureUrl;
          }

          console.log(`Successfully uploaded ${fieldname}: ${secureUrl}`);
        } else {
          console.error(`Upload failed for ${fieldname}:`, uploadResult);
          throw new Error(`Upload failed for ${fieldname}: ${uploadResult?.message || 'Unknown error'}`);
        }

      } catch (error) {
        console.error(`Error processing file ${file.originalName}:`, error);
        throw new BadRequestException(`Failed to process file: ${file.originalName || fieldname}`);
      }
    }

    // Add array fields to result
    Object.entries(arrayFields).forEach(([key, urls]) => {
      result[key] = urls;
    });

    return result;
  }

  /**
   * Extract files from form data body
   */
  extractFilesFromBody(body: any): {
    files: ProcessedFile[];
    cleanedBody: Record<string, any>;
  } {
    const files: ProcessedFile[] = [];
    const cleanedBody: Record<string, any> = {};

    if (!body || typeof body !== 'object') {
      return { files, cleanedBody };
    }

    Object.entries(body).forEach(([key, value]) => {
      if (value instanceof MemoryStoredFile) {
        files.push({ file: value, fieldname: key });
      } else if (Array.isArray(value)) {
        const arrayFiles: ProcessedFile[] = [];
        const nonFileItems: any[] = [];

        value.forEach((item, idx) => {
          if (item instanceof MemoryStoredFile) {
            files.push({ file: item, fieldname: `${key}[${idx}]` });
            arrayFiles.push({ file: item, fieldname: `${key}[${idx}]` });
          } else if (item !== null && item !== undefined && item !== '') {
            nonFileItems.push(item);
          }
        });

        // If it's not all files, add non-file items to cleaned body
        if (nonFileItems.length > 0) {
          cleanedBody[key] = nonFileItems;
        }
      } else if (value !== null && value !== undefined && value !== '') {
        // Handle JSON fields that might come as strings
        const jsonFields = [
          'address',
          'contact_info',
          'business_hours',
          'social_links',
          'settings',
          'verification_documents',
          'gallery',
          'variations',
          'attributes',
          'specifications',
          'seo_data',
          'shipping_info'
        ];

        if (jsonFields.includes(key) && typeof value === 'string') {
          try {
            cleanedBody[key] = JSON.parse(value);
          } catch (e) {
            console.warn(`Failed to parse ${key} as JSON, keeping as string:`, value);
            cleanedBody[key] = value;
          }
        } else {
          cleanedBody[key] = value;
        }
      }
    });

    return { files, cleanedBody };
  }

  private validateFile(
    file: MemoryStoredFile,
    allowedMimeTypes: string[],
    maxSize: number
  ): void {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size too large: ${file.size} bytes. Maximum size: ${maxSize} bytes.`
      );
    }
  }

  private convertToMulterFile(file: MemoryStoredFile, fieldname: string): Express.Multer.File {
    return {
      buffer: file.buffer,
      originalname: file.originalName || `${fieldname}_${Date.now()}`,
      mimetype: file.mimetype,
      size: file.buffer.length,
      fieldname,
      filename: file.originalName || `${fieldname}_${Date.now()}`,
      encoding: file.encoding || '7bit',
      destination: '',
      path: '',
      stream: null as any
    };
  }

  private getDefaultFolders(entityType: 'vendor' | 'product' | 'category'): Record<string, string> {
    if (entityType === 'vendor') {
      return {
        logo: 'multivendor_ecommerce/vendors/logos',
        banner: 'multivendor_ecommerce/vendors/banners',
        verification_documents: 'multivendor_ecommerce/vendors/documents',
        default: 'multivendor_ecommerce/vendors/others'
      };
    } else if (entityType === 'product') {
      return {
        gallery: 'multivendor_ecommerce/products/gallery',
        thumbnail: 'multivendor_ecommerce/products/thumbnails',
        featured_image: 'multivendor_ecommerce/products/featured',
        default: 'multivendor_ecommerce/products/others'
      };
    } else if (entityType === 'category') {
      return {
        icon: 'multivendor_ecommerce/categories/icons',
        banner: 'multivendor_ecommerce/categories/banners',
        default: 'multivendor_ecommerce/categories/others'
      };
    }
    return { default: 'multivendor_ecommerce/uploads' };
  }

  private determineUploadFolder(
    fieldname: string,
    folders: Record<string, string>,
    entityType: string
  ): string {
    // Handle array field names like "gallery[0]"
    const baseFieldName = this.getBaseFieldName(fieldname);

    return folders[baseFieldName] || folders[fieldname] || folders.default || `multivendor_ecommerce/${entityType}s`;
  }

  private isArrayField(fieldname: string): boolean {
    return fieldname.includes('[') && fieldname.includes(']');
  }

  private getBaseFieldName(fieldname: string): string {
    const match = fieldname.match(/^([^[]+)/);
    return match ? match[1] : fieldname;
  }
}

