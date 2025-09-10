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
  ParseIntPipe,
} from '@nestjs/common';
import { TaxesRepository } from './taxes.repository';
import { ApiResponseFormat } from 'src/common/utils/common-response';
import { TaxQueryDto, CreateTaxDto, UpdateTaxDto } from './dtos/tax.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';

@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesRepository: TaxesRepository) {}

  // --- Public/User/Vendor-facing APIs (Read-only) ---
  
  @Get()
  async getActiveTaxes(
    @Query() query: TaxQueryDto,
  ): Promise<ApiResponseFormat<any[]>> {
    return this.taxesRepository.findAllActiveTaxes(query);
  }

  @Get(':id')
  async getActiveTax(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ApiResponseFormat<any>> {
    return this.taxesRepository.findActiveTaxById(id);
  }

  @Get('country/:country_id')
  async getTaxesByCountry(
    @Param('country_id', ParseIntPipe) country_id: number
  ): Promise<ApiResponseFormat<any[]>> {
    return this.taxesRepository.findActiveTaxesByCountry(country_id);
  }

  @Get('region/:region_id')
  async getTaxesByRegion(
    @Param('region_id', ParseIntPipe) region_id: number
  ): Promise<ApiResponseFormat<any[]>> {
    return this.taxesRepository.findActiveTaxesByRegion(region_id);
  }

  @Get('code/:code')
  async getTaxByCode(
    @Param('code') code: string
  ): Promise<ApiResponseFormat<any>> {
    return this.taxesRepository.findTaxByCode(code);
  }

  // --- Admin-facing APIs ---
  
  @Post('admin/create')
  @UseGuards(AuthGuard, RoleGuard)
  async createTax(
    @Body() createTaxDto: CreateTaxDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<any>> {
    const userId = req.user?.id;
    return this.taxesRepository.createTax(createTaxDto, userId);
  }

  @Get('admin/all')
  @UseGuards(AuthGuard, RoleGuard)
  async getAllTaxesAdmin(
    @Query() query: TaxQueryDto,
  ): Promise<ApiResponseFormat<any[]>> {
    console.log("🚀 ~ TaxesController ~ getAllTaxesAdmin ~ query:", query)
    return this.taxesRepository.findAllTaxesAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async getTaxAdmin(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ApiResponseFormat<any>> {
    return this.taxesRepository.findTaxByIdAdmin(id);
  }

  @Put('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async updateTax(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaxDto: UpdateTaxDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<any>> {
    const userId = req.user?.id;
    return this.taxesRepository.updateTax(id, updateTaxDto, userId);
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard, RoleGuard)
  async deleteTax(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ApiResponseFormat<boolean>> {
    return this.taxesRepository.deleteTax(id);
  }

  @Put('admin/:id/deactivate')
  @UseGuards(AuthGuard, RoleGuard)
  async deactivateTax(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ApiResponseFormat<boolean>> {
    const userId = req.user?.id;
    return this.taxesRepository.softDeleteTax(id, userId);
  }
}