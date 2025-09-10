import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { WarehousesRepository } from './warehouses.repository';
import { ApiResponseFormat } from 'src/common/utils/common-response';
import { CreateWarehouseDto, UpdateWarehouseDto, WarehouseQueryDto } from './dto/warehouse.dto';
import { VendorsRepository } from '../vendors/vendors.repository';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly warehousesRepository: WarehousesRepository,
    private readonly vendorsRepository: VendorsRepository, // Inject VendorsRepository
  ) {}

  // Helper to check if a vendor exists
  private async checkVendorExists(vendorId: number): Promise<void> {
    const vendorResponse = await this.vendorsRepository.findVendorByIdAdmin(vendorId); // Assuming an admin-level find
    if (vendorResponse.status_code === 404) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found.`);
    }
    if (vendorResponse.status_code === 500) {
      throw new InternalServerErrorException(vendorResponse.message);
    }
  }

  // Helper to check if a warehouse belongs to a vendor
  private async checkWarehouseOwnership(warehouseId: number, vendorId: number): Promise<void> {
    const warehouseResponse = await this.warehousesRepository.findWarehouseById(warehouseId);
    if (warehouseResponse.status_code === 404) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found.`);
    }
    if (warehouseResponse.status_code === 500) {
      throw new InternalServerErrorException(warehouseResponse.message);
    }
    if (warehouseResponse.result.vendor_id !== vendorId) {
      throw new UnauthorizedException(`Warehouse with ID ${warehouseId} does not belong to this vendor.`);
    }
  }

  // --- Vendor-facing APIs ---
  async createWarehouseForVendor(vendorId: number, createWarehouseDto: CreateWarehouseDto): Promise<ApiResponseFormat<any>> {
    if (createWarehouseDto.vendorId !== vendorId) {
      throw new UnauthorizedException('Vendor ID in payload does not match authenticated vendor.');
    }
    await this.checkVendorExists(vendorId); // Ensure the vendor actually exists

    const response = await this.warehousesRepository.createWarehouse(createWarehouseDto);
    if (response.status_code !== 201) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async getVendorWarehouses(vendorId: number): Promise<ApiResponseFormat<any[]>> {
    const response = await this.warehousesRepository.findVendorWarehouses(vendorId);
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async updateWarehouseForVendor(id: number, vendorId: number, updateWarehouseDto: UpdateWarehouseDto): Promise<ApiResponseFormat<any>> {
    await this.checkWarehouseOwnership(id, vendorId); // Ensure vendor owns this warehouse

    const response = await this.warehousesRepository.updateWarehouse(id, updateWarehouseDto, vendorId);
    if (response.status_code === 400) {
      throw new BadRequestException(response.message);
    }
    if (response.status_code === 404) {
      throw new NotFoundException(response.message);
    }
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async deleteWarehouseForVendor(id: number, vendorId: number): Promise<ApiResponseFormat<boolean>> {
    await this.checkWarehouseOwnership(id, vendorId); // Ensure vendor owns this warehouse

    const response = await this.warehousesRepository.deleteWarehouse(id, vendorId);
    if (response.status_code === 404) {
      throw new NotFoundException(response.message);
    }
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  // --- Admin-facing APIs ---
  async getAllWarehousesForAdmin(query: WarehouseQueryDto): Promise<ApiResponseFormat<any[]>> {
    const response = await this.warehousesRepository.findAllWarehouses(query);
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async getWarehouseByIdForAdmin(id: number): Promise<ApiResponseFormat<any>> {
    const response = await this.warehousesRepository.findWarehouseById(id);
    if (response.status_code === 404) {
      throw new NotFoundException(response.message);
    }
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async createWarehouseForAdmin(createWarehouseDto: CreateWarehouseDto): Promise<ApiResponseFormat<any>> {
    await this.checkVendorExists(createWarehouseDto.vendorId); // Ensure the vendor exists
    const response = await this.warehousesRepository.createWarehouse(createWarehouseDto);
    if (response.status_code !== 201) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async updateWarehouseForAdmin(id: number, updateWarehouseDto: UpdateWarehouseDto): Promise<ApiResponseFormat<any>> {
    const warehouseResponse = await this.warehousesRepository.findWarehouseById(id);
    if (warehouseResponse.status_code === 404) {
      throw new NotFoundException(warehouseResponse.message);
    }
    if (warehouseResponse.status_code !== 200) {
      throw new InternalServerErrorException(warehouseResponse.message);
    }

    // If vendorId is being changed by admin, ensure new vendor exists
    if (updateWarehouseDto.vendorId && updateWarehouseDto.vendorId !== warehouseResponse.result.vendor_id) {
      await this.checkVendorExists(updateWarehouseDto.vendorId);
    }

    const response = await this.warehousesRepository.updateWarehouse(id, updateWarehouseDto);
    if (response.status_code === 400) {
      throw new BadRequestException(response.message);
    }
    if (response.status_code === 404) {
      throw new NotFoundException(response.message);
    }
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }

  async deleteWarehouseForAdmin(id: number): Promise<ApiResponseFormat<boolean>> {
    const warehouseResponse = await this.warehousesRepository.findWarehouseById(id);
    if (warehouseResponse.status_code === 404) {
      throw new NotFoundException(warehouseResponse.message);
    }
    if (warehouseResponse.status_code !== 200) {
      throw new InternalServerErrorException(warehouseResponse.message);
    }

    const response = await this.warehousesRepository.deleteWarehouse(id);
    if (response.status_code === 404) {
      throw new NotFoundException(response.message);
    }
    if (response.status_code !== 200) {
      throw new InternalServerErrorException(response.message);
    }
    return response;
  }
}
