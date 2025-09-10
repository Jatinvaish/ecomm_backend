import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SearchSyncService } from './search-sync.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [ProductsController],
  providers: [  ProductsRepository, CloudinaryService,SearchSyncService],
  exports: [ProductsRepository]
})
export class ProductsModule {}
