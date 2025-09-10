// cart.controller.ts
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
import { 
  CartQueryDto, 
  CartResponse, 
  AddToCartDto, 
  UpdateCartItemDto,
  CartRequestDto,
  CartItemRequestDto,
  TransferCartDto
} from './dto/cart.dto';
import { CartRepository } from './cart.repository';

@Controller('cart')
export class CartController {
  constructor(private readonly cartRepository: CartRepository) {}

  // --- Core Cart Operations ---

  @Post('get-cart')
  async getCart(
    @Body() cartRequest: CartRequestDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<CartResponse>> {
    // Prioritize body params, fallback to headers/session
    const userId = cartRequest.user_id || req.user?.id;
    const sessionId = cartRequest.session_id || req.session?.id || req.headers['x-session-id'];

    return this.cartRepository.getCart({
      user_id: userId,
      session_id: sessionId,
      currency_id: cartRequest.currency_id || 1
    });
  }


  @Post('add-item')
  async addToCart(
    @Body() addToCartDto: AddToCartDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<CartResponse>> {
    // Prioritize body params, fallback to headers/session
    const userId = addToCartDto.user_id || req.user?.id;
    const sessionId = addToCartDto.session_id || req.session?.id || req.headers['x-session-id'];

    return this.cartRepository.addToCart(addToCartDto, userId, sessionId);
  }

  @Put('item/:id')
  async updateCartItem(
    @Param('id', ParseIntPipe) itemId: number,
    @Body() updateDto: UpdateCartItemDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<CartResponse>> {
    // Prioritize body params, fallback to headers/session
    const userId = updateDto.user_id || req.user?.id;
    const sessionId = updateDto.session_id || req.session?.id || req.headers['x-session-id'];

    return this.cartRepository.updateCartItem(itemId, updateDto, userId, sessionId);
  }

  @Delete('item/:id')
  async removeCartItem(
    @Param('id', ParseIntPipe) itemId: number,
    @Req() req: any,
  ): Promise<ApiResponseFormat<CartResponse>> {
    const userId = req.user?.id;
    const sessionId = req.session?.id || req.headers['x-session-id'];

    return this.cartRepository.removeCartItem(itemId, userId, sessionId);
  }

  @Post('remove-item')
  async removeCartItemPost(
    @Body() removeDto: CartItemRequestDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<CartResponse>> {
    // Prioritize body params, fallback to headers/session
    const userId = removeDto.user_id || req.user?.id;
    const sessionId = removeDto.session_id || req.session?.id || req.headers['x-session-id'];

    return this.cartRepository.removeCartItem(removeDto.cart_item_id, userId, sessionId);
  }
 
  @Post('clear')
  async clearCartPost(
    @Body() cartRequest: CartRequestDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<any>> {
    // Prioritize body params, fallback to headers/session
    const userId = cartRequest.user_id || req.user?.id;
    const sessionId = cartRequest.session_id || req.session?.id || req.headers['x-session-id'];
    return this.cartRepository.clearCart(userId, sessionId);
  }


  @Post('count')
  async getCartCountPost(
    @Body() cartRequest: CartRequestDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<{ count: number }>> {
    // Prioritize body params, fallback to headers/session
    const userId = cartRequest.user_id || req.user?.id;
    const sessionId = cartRequest.session_id || req.session?.id || req.headers['x-session-id'];

    return this.cartRepository.getCartCount(userId, sessionId);
  }

  // --- Authentication Required Operations ---

  @Post('transfer')
  @UseGuards(AuthGuard)
  async transferCart(
    @Body() transferDto: TransferCartDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<CartResponse>> {
    const userId = req.user?.id || transferDto.to_user_id;
    
    return {
      success: true,
      message: 'Cart transfer feature not yet implemented',
      data: true,
      status: 200
    } as any;
  }

  @Post('sync')
  @UseGuards(AuthGuard)
  async syncCart(
    @Body() cartRequest: CartRequestDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<CartResponse>> {
    // Prioritize body params, fallback to headers/session
    const userId = cartRequest.user_id || req.user.id;
    const sessionId = cartRequest.session_id || req.session?.id || req.headers['x-session-id'];

    return this.cartRepository.getCart({
      user_id: userId,
      session_id: sessionId,
      currency_id: cartRequest.currency_id || 1
    });
  }

  // --- Utility Methods ---

  @Get('validate')
  async validateCart(
    @Query() query: CartQueryDto,
    @Req() req: any,
  ): Promise<ApiResponseFormat<{
    valid: boolean;
    issues?: string[];
    cart?: CartResponse;
  }>> {
    try {
      // Prioritize query params, fallback to headers/session
      const userId = query.user_id || req.user?.id;
      const sessionId = query.session_id || req.session?.id || req.headers['x-session-id'];

      const cartResult = await this.cartRepository.getCart({
        user_id: userId,
        session_id: sessionId,
        currency_id: query.currency_id || 1
      });

      if (!cartResult.result) {
        return {
          success: true,
          data: { valid: false, issues: ['Cart not found'] },
          message: 'Cart validation completed',
          status: 200
        } as any;
      }

      const cart = cartResult.result as CartResponse;
      const issues: string[] = [];

      // Check for out of stock items
      cart.items.forEach(item => {
        if (!item.is_available) {
          issues.push(`${item.product_name} is out of stock`);
        }
        if (item.quantity > item.stock_available) {
          issues.push(`${item.product_name} has insufficient stock (available: ${item.stock_available})`);
        }
      });

      return {
        success: true,
        data: {
          valid: issues.length === 0,
          issues: issues.length > 0 ? issues : undefined,
          cart: cart
        },
        message: 'Cart validation completed',
        status: 200
      } as any;

    } catch (error) {
      return {
        success: false,
        message: 'Failed to validate cart',
        status: 500
      } as any;
    }
  }
}
