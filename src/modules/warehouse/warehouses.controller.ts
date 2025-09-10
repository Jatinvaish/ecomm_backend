import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseQueryDto,
} from './dto/warehouse.dto';
import { ApiResponseFormat } from 'src/common/utils/common-response';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/guards/decorators/role.decorator';
import { RoleGuard } from 'src/common/guards/role.guard';

// Placeholder Guards (replace with your actual authentication and RBAC setup)

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  // --- Vendor-facing APIs ---
  @Post('vendor')
  @UseGuards(AuthGuard, RoleGuard)
  async createWarehouse(
    @Req() req,
    @Body() createWarehouseDto: CreateWarehouseDto,
  ): Promise<ApiResponseFormat<any>> {
    const vendorId = req.user?.vendorId || 1; // Placeholder: replace with actual vendor ID from auth
    // Ensure the vendorId in the DTO matches the authenticated vendorId
    createWarehouseDto.vendorId = vendorId;
    return this.warehousesService.createWarehouseForVendor(
      vendorId,
      createWarehouseDto,
    );
  }

  @Get('vendor/my-warehouses')
  @UseGuards(AuthGuard, RoleGuard)
  async getVendorWarehouses(@Req() req): Promise<ApiResponseFormat<any[]>> {
    const vendorId = req.user?.vendorId || 1; // Placeholder
    return this.warehousesService.getVendorWarehouses(vendorId);
  }

  @Put('vendor/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async updateVendorWarehouse(
    @Req() req,
    @Param('id') id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ): Promise<ApiResponseFormat<any>> {
    const vendorId = req.user?.vendorId || 1; // Placeholder
    return this.warehousesService.updateWarehouseForVendor(
      parseInt(id, 10),
      vendorId,
      updateWarehouseDto,
    );
  }

  @Delete('vendor/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async deleteVendorWarehouse(
    @Req() req,
    @Param('id') id: string,
  ): Promise<ApiResponseFormat<boolean>> {
    const vendorId = req.user?.vendorId || 1; // Placeholder
    return this.warehousesService.deleteWarehouseForVendor(
      parseInt(id, 10),
      vendorId,
    );
  }

  // --- Admin-facing APIs ---
  @Post('admin')
  @UseGuards(AuthGuard, RoleGuard)
 
  async createWarehouseAdmin(
    @Body() createWarehouseDto: CreateWarehouseDto,
  ): Promise<ApiResponseFormat<any>> {
    return this.warehousesService.createWarehouseForAdmin(createWarehouseDto);
  }

  @Get('admin/all')
  @UseGuards(AuthGuard, RoleGuard)
 
  async getAllWarehousesAdmin(
    @Query() query: WarehouseQueryDto,
  ): Promise<ApiResponseFormat<any[]>> {
    return this.warehousesService.getAllWarehousesForAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
 
  async getWarehouseAdmin(
    @Param('id') id: string,
  ): Promise<ApiResponseFormat<any>> {
    return this.warehousesService.getWarehouseByIdForAdmin(parseInt(id, 10));
  }

  @Put('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
 
  async updateWarehouseAdmin(
    @Param('id') id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ): Promise<ApiResponseFormat<any>> {
    return this.warehousesService.updateWarehouseForAdmin(
      parseInt(id, 10),
      updateWarehouseDto,
    );
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
 
  async deleteWarehouseAdmin(
    @Param('id') id: string,
  ): Promise<ApiResponseFormat<boolean>> {
    return this.warehousesService.deleteWarehouseForAdmin(parseInt(id, 10));
  }
}
