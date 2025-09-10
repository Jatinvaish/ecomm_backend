import { Module } from '@nestjs/common';
import { AttributesController } from './attributes.controller';
import { AttributesRepository } from './attributes.repository';

@Module({
  imports: [],
  controllers: [AttributesController],
  providers: [AttributesRepository],
  exports: [AttributesRepository],
})
export class AttributesModule {}