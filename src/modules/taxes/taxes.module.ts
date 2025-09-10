import { Module } from '@nestjs/common';
import { TaxesController } from './taxes.controller';
import { TaxesRepository } from './taxes.repository';

@Module({
  controllers: [TaxesController],
  providers: [TaxesRepository],
})
export class TaxesModule { }
