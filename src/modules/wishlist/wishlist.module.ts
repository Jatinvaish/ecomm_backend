import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistRepository } from './wishlist.repository';

@Module({
  controllers: [WishlistController],
  providers: [WishlistRepository],
  exports: [WishlistRepository],
})
export class WishlistModule {}
