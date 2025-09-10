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
import { WishlistQueryDto, WishlistResponse, CreateWishlistDto, UpdateWishlistDto, AddToWishlistDto } from './dto/wishlist.dto';
import { WishlistRepository } from './wishlist.repository';

@Controller('wishlist')
@UseGuards(AuthGuard)
export class WishlistController {
  constructor(private readonly wishlistRepository: WishlistRepository) { }
  @Post('get-wishlists')
  async getUserWishlists(
    @Query() query: WishlistQueryDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<WishlistResponse[]>> {
    const userId = req.user.id;
    return this.wishlistRepository.getUserWishlists(userId, query);
  }


  @Get(':id')
  async getWishlist(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ApiResponseFormat<WishlistResponse>> {
    const userId = req.user.id;
    return this.wishlistRepository.getWishlistById(id, userId);
  }

  @Post()
  async createWishlist(
    @Body() createWishlistDto: CreateWishlistDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<WishlistResponse>> {
    const userId = req.user.id;
    return this.wishlistRepository.createWishlist(userId, createWishlistDto);
  }
  @Post('check-status')
  async checkMultipleWishlistStatus(
    @Body() body: { product_ids: number[] },
    @Req() req: any,
  ): Promise<ApiResponseFormat<any>> {
    const userId = req.user.id;
    return this.wishlistRepository.checkMultipleWishlistStatus(userId, body.product_ids);
  }
  @Put(':id')
  async updateWishlist(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWishlistDto: UpdateWishlistDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<WishlistResponse>> {
    const userId = req.user.id;
    return this.wishlistRepository.updateWishlist(id, userId, updateWishlistDto);
  }

  @Delete(':id')
  async deleteWishlist(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ApiResponseFormat<any>> {
    const userId = req.user.id;
    return this.wishlistRepository.deleteWishlist(id, userId);
  }

  @Post('add-item')
  async addToWishlist(
    @Body() addToWishlistDto: AddToWishlistDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<any>> {
    const userId = req.user.id;
    return this.wishlistRepository.addToWishlist(userId, addToWishlistDto);
  }

  @Delete('item/:id')
  async removeFromWishlist(
    @Param('id', ParseIntPipe) itemId: number,
    @Req() req: any,
  ): Promise<ApiResponseFormat<any>> {
    const userId = req.user.id;
    return this.wishlistRepository.removeFromWishlist(itemId, userId);
  }

  @Post('toggle')
  async toggleWishlistItem(
    @Body() toggleDto: { product_id: number; combination_id?: number },
    @Req() req: any,
  ): Promise<ApiResponseFormat<{ is_wishlisted: boolean }>> {
    const userId = req.user.id;
    return this.wishlistRepository.toggleWishlistItem(userId, toggleDto);
  }

  @Get('check/:product_id')
  async checkWishlistStatus(
    @Param('product_id', ParseIntPipe) productId: number,
    @Query('combination_id') combinationId?: number,
    @Req() req?: any,
  ): Promise<ApiResponseFormat<{ is_wishlisted: boolean }>> {
    const userId = req.user.id;
    return this.wishlistRepository.checkWishlistStatus(userId, productId, combinationId);
  }

  @Post(':id/move-to-cart')
  async moveWishlistToCart(
    @Param('id', ParseIntPipe) wishlistId: number,
    @Req() req: any,
  ): Promise<ApiResponseFormat<any>> {
    const userId = req.user.id;
    return this.wishlistRepository.moveWishlistToCart(wishlistId, userId);
  }

  @Get('public/:user_id')
  async getPublicWishlists(
    @Param('user_id', ParseIntPipe) userId: number,
    @Query() query: WishlistQueryDto,
  ): Promise<ApiResponseFormat<WishlistResponse[]>> {
    return this.wishlistRepository.getPublicWishlists(userId, query);
  }
}
