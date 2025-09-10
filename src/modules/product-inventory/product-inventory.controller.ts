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
import { ProductInventoryService } from './product-inventory.service';
import {
  CreateProductInventoryDto,
  UpdateProductInventoryDto,
  ProductInventoryQueryDto,
} from './dto/product-inventory.dto';
import { ApiResponseFormat } from 'src/common/utils/common-response';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';

// Placeholder Guards (replace with your actual authentication and RBAC setup)

@Controller('inventory')
export class ProductInventoryController {
  constructor(
    private readonly productInventoryService: ProductInventoryService,
  ) {}

  // --- Vendor-facing APIs ---
  @Post('vendor')
  @UseGuards(AuthGuard, RoleGuard)
  async createInventory(
    @Req() req,
    @Body() createInventoryDto: CreateProductInventoryDto,
  ): Promise<ApiResponseFormat<any>> {
    const vendorId = req.user?.vendorId || 1; // Placeholder
    return this.productInventoryService.createInventoryForVendor(
      vendorId,
      createInventoryDto,
    );
  }

  @Get('vendor/my-inventory')
  @UseGuards(AuthGuard, RoleGuard)
  async getVendorInventory(
    @Req() req,
    @Query() query: ProductInventoryQueryDto,
  ): Promise<ApiResponseFormat<any[]>> {
    const vendorId = req.user?.vendorId || 1; // Placeholder
    return this.productInventoryService.getVendorInventory(vendorId, query);
  }

  @Put('vendor/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async updateVendorInventory(
    @Req() req,
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateProductInventoryDto,
  ): Promise<ApiResponseFormat<any>> {
    const vendorId = req.user?.vendorId || 1; // Placeholder
    return this.productInventoryService.updateInventoryForVendor(
      parseInt(id, 10),
      vendorId,
      updateInventoryDto,
    );
  }

  @Delete('vendor/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async deleteVendorInventory(
    @Req() req,
    @Param('id') id: string,
  ): Promise<ApiResponseFormat<boolean>> {
    const vendorId = req.user?.vendorId || 1; // Placeholder
    return this.productInventoryService.deleteInventoryForVendor(
      parseInt(id, 10),
      vendorId,
    );
  }

  // --- Admin-facing APIs ---
  @Get('admin/all')
  @UseGuards(AuthGuard, RoleGuard)
  async getAllInventoryAdmin(
    @Query() query: ProductInventoryQueryDto,
  ): Promise<ApiResponseFormat<any[]>> {
    return this.productInventoryService.getAllInventoryForAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async getInventoryAdmin(
    @Param('id') id: string,
  ): Promise<ApiResponseFormat<any>> {
    return this.productInventoryService.getInventoryByIdForAdmin(
      parseInt(id, 10),
    );
  }

  @Put('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async updateInventoryAdmin(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateProductInventoryDto,
  ): Promise<ApiResponseFormat<any>> {
    return this.productInventoryService.updateInventoryForAdmin(
      parseInt(id, 10),
      updateInventoryDto,
    );
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async deleteInventoryAdmin(
    @Param('id') id: string,
  ): Promise<ApiResponseFormat<boolean>> {
    return this.productInventoryService.deleteInventoryForAdmin(
      parseInt(id, 10),
    );
  }

  // --- Internal/Service-to-Service APIs (Example: for Order Service) ---
  // These might not be exposed directly via HTTP in a microservices architecture,
  // but are provided here for completeness if used internally or via RPC.
  @Put('adjust-quantity')
  @UseGuards(AuthGuard) // Could be a specific internal service token guard
  async adjustQuantity(
    @Body('productId') productId: number,
    @Body('warehouseId') warehouseId: number,
    @Body('quantityChange') quantityChange: number,
    @Body('combinationId') combinationId?: number,
  ): Promise<ApiResponseFormat<any>> {
    return this.productInventoryService.adjustProductQuantity(
      productId,
      warehouseId,
      quantityChange,
      combinationId,
    );
  }

  @Get('current-quantity')
  async getCurrentQuantity(
    @Query('productId') productId: string,
    @Query('warehouseId') warehouseId: string,
    @Query('combinationId') combinationId?: string,
  ): Promise<ApiResponseFormat<any>> {
    return this.productInventoryService.getProductQuantity(
      parseInt(productId, 10),
      parseInt(warehouseId, 10),
      combinationId ? parseInt(combinationId, 10) : null,
    );
  }
}
