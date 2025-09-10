// controllers/user-addresses.controller.ts
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
import { ApiResponseFormat } from 'src/common/utils/common-response';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserAddressRepository } from './user-addresses.repository';
import { AdminGuard } from 'src/common/guards/role.guard';
import { AddressQueryDto, UserAddressResponse, CreateUserAddressDto, UpdateUserAddressDto } from './dto/user-addresses.dto';

@Controller('user-addresses')
@UseGuards(AuthGuard)
export class UserAddressesController {
  constructor(private readonly userAddressRepository: UserAddressRepository) { }

  @Post('get-user-addresses')
  async getUserAddresses(
    @Body() query: AddressQueryDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<any>> {
    const userId = req.user.id;
    return this.userAddressRepository.getUserAddresses(userId, query);
  }

  @Get(':id')
  async getUserAddress(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ApiResponseFormat<UserAddressResponse>> {
    const userId = req.user.id;
    return this.userAddressRepository.getUserAddressById(id, userId);
  }

  @Post('add-address')
  async createUserAddress(
    @Body() createUserAddressDto: CreateUserAddressDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<UserAddressResponse>> {
    const userId = req.user.id;
    return this.userAddressRepository.createUserAddress(userId, createUserAddressDto);
  }

  @Put(':id')
  async updateUserAddress(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserAddressDto: UpdateUserAddressDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<UserAddressResponse>> {
    const userId = req.user.id;
    return this.userAddressRepository.updateUserAddress(id, userId, updateUserAddressDto);
  }

  @Delete(':id')
  async deleteUserAddress(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ApiResponseFormat<boolean>> {
    const userId = req.user.id;
    return this.userAddressRepository.deleteUserAddress(id, userId);
  }

  @Post(':id/set-default')
  async setDefaultAddress(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ApiResponseFormat<any>> {
    const userId = req.user.id;
    return this.userAddressRepository.setDefaultAddress(id, userId);
  }
}

// Admin Controller (optional - for admin panel)
@Controller('admin/user-addresses')
@UseGuards(AuthGuard, AdminGuard)
export class AdminUserAddressesController {
  constructor(private readonly userAddressRepository: UserAddressRepository) { }

  @Get()
  async getAllAddresses(
    @Query() query: AddressQueryDto,
  ): Promise<ApiResponseFormat<any>> {
    return this.userAddressRepository.findAllAddressesAdmin(query);
  }

  @Get(':id')
  async getAddressById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseFormat<UserAddressResponse>> {
    return this.userAddressRepository.findAddressByIdAdmin(id);
  }

  @Delete(':id')
  async deleteAddressAdmin(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponseFormat<boolean>> {
    // Admin can delete any address - you might want to add additional validation
    const result = await this.userAddressRepository.deleteUserAddress(id, 0); // Pass 0 or handle differently
    return result;
  }
}
