import { Module } from '@nestjs/common';
import { ProductInventoryController } from './product-inventory.controller';
import { ProductInventoryService } from './product-inventory.service';
import { ProductInventoryRepository } from './product-inventory.repository';
import { VendorsRepository } from '../vendors/vendors.repository';
import { WarehousesRepository } from '../warehouse/warehouses.repository';
import { EmailService } from 'src/common/email.service';
import { ProductsRepository } from '../products/products.repository';

@Module({
  controllers: [ProductInventoryController],
  providers: [
    ProductInventoryService,
    ProductInventoryRepository,
    VendorsRepository, // Provide VendorsRepository
    WarehousesRepository, // Provide WarehousesRepository
    ProductsRepository, // Provide WarehousesRepository
    EmailService, // Provide EmailService
  ],
  exports: [ProductInventoryService],
})
export class ProductInventoryModule { }
