import { Module } from '@nestjs/common';
import { VendorsController } from './vendors.controller';
import { VendorsRepository } from './vendors.repository';
import { EmailService } from 'src/common/email.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [VendorsController],
  providers: [VendorsRepository, EmailService, CloudinaryService],
  exports: [VendorsRepository,],

})
export class VendorsModule { }
