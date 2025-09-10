import { Module } from '@nestjs/common';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { WarehousesRepository } from './warehouses.repository';
import { VendorsRepository } from '../vendors/vendors.repository';

@Module({
  controllers: [WarehousesController],
  providers: [
    WarehousesService,
    WarehousesRepository,
    VendorsRepository, // Provide VendorsRepository as it's a dependency of WarehousesService
  ],
  exports: [WarehousesService],
})
export class WarehousesModule {}
