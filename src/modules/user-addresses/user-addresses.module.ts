import { Module } from '@nestjs/common';
import { UserAddressesController } from './user-addresses.controller';
import { UserAddressRepository } from './user-addresses.repository';

@Module({
  controllers: [UserAddressesController],
  providers: [UserAddressRepository],
})
export class UserAddressModule { }
