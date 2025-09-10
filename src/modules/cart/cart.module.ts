import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';

@Module({
  controllers: [CartController],
  providers: [CartRepository],
  exports: [CartRepository],
})
export class CartModule {}
