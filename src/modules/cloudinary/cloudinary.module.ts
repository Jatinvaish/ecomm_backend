// src/cloudinary/cloudinary.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';
import { CommonFileProcessorService } from './common-file-processing.service';

@Module({
  imports: [ConfigModule,], // Make sure ConfigModule is imported
  providers: [
    {
      provide: 'Cloudinary',
      useFactory: (configService: ConfigService) => {
        return cloudinary.config({
          cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
          api_key: configService.get('CLOUDINARY_API_KEY'),
          api_secret: configService.get('CLOUDINARY_API_SECRET'),
        });
      },
      inject: [ConfigService],
    },
    CloudinaryService,
    CommonFileProcessorService
  ],
  exports: [CloudinaryService, CommonFileProcessorService],
})
export class CloudinaryModule {}
