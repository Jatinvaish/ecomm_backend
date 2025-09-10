import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersRepository } from './user.repository';
import { EmailService } from 'src/common/email.service';

@Module({
  controllers: [UsersController],
  providers: [ UsersRepository,EmailService],
  exports: [  UsersRepository], // Export Repository as well for other modules that might need it (e.g., ProductInventory)
})
export class UsersModule {}
